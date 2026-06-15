/*
 * Nun, a Discord client mod
 * Copyright (c) 2026 o9
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { getAccessToken as getOnlineAccessToken, isAuthorized as isOnlineAuthorized } from "../_api/onlineServices";
import { getWsUrl as getOnlineWsUrl } from "../_api/onlineServices/constants";
import { getAccessToken as getNunAccessToken, isAuthorized as isNunAuthorized } from "../_api/nunServices";
import { getWsUrl as getNunWsUrl } from "../_api/nunServices/constants";
import { debounce } from "@shared/debounce";
import { proxyLazy } from "@utils/lazy";
import { Logger } from "@utils/Logger";
import type { VoiceState as DiscordVoiceState } from "@vencord/discord-types";
import { ChannelStore, GuildMemberStore, GuildStore, showToast, Toasts, UserStore, VoiceStateStore, zustandCreate } from "@webpack/common";

import { BATCH_INTERVAL_MS } from "./constants";
import { type MetaUpsert, VoiceIndicatorsClient, type VoiceState as ReportVoiceState } from "./sdk/VoiceIndicatorsClient";
import { settings } from "./settings";
import type { ChannelLogEntry, ChannelQueryResult, HydratedSession, UserChannelLogEntry } from "./types";

const logger = new Logger("VoiceIndicators");

interface Backend {
    wsUrl: string;
    getAccessToken: () => Promise<string>;
    isAuthorized: () => boolean;
}

function getBackend(): Backend {
    if (settings.store.backend === "nunServices") {
        return {
            wsUrl: getNunWsUrl(),
            getAccessToken: getNunAccessToken,
            isAuthorized: isNunAuthorized,
        };
    }

    return {
        wsUrl: getOnlineWsUrl(),
        getAccessToken: getOnlineAccessToken,
        isAuthorized: isOnlineAuthorized,
    };
}

let vi: VoiceIndicatorsClient | null = null;
let activeBackend: string | null = null;

function getVi(): VoiceIndicatorsClient {
    const backend = settings.store.backend;
    if (!vi || activeBackend !== backend) {
        vi?.close();
        const { wsUrl, getAccessToken } = getBackend();
        vi = new VoiceIndicatorsClient({ url: wsUrl, getAccessToken });
        activeBackend = backend;
        bindViEvents(vi);
        started = false;
    }
    return vi;
}

// ── Reactive session store ───────────────────────────────────────────────────
interface VoiceStoreState {
    sessions: Record<string, HydratedSession[]>;
    setMany: (map: Record<string, HydratedSession[]>) => void;
    clear: () => void;
}

export const useVoiceStore = proxyLazy(() => zustandCreate((set: any, get: any) => ({
    sessions: {},
    setMany: (map: Record<string, HydratedSession[]>) => set({ sessions: { ...get().sessions, ...map } }),
    clear: () => set({ sessions: {} }),
} as VoiceStoreState))) as unknown as {
    <U>(selector: (state: VoiceStoreState) => U): U;
    getState: () => VoiceStoreState;
};

// ── Connection lifecycle ─────────────────────────────────────────────────────
let started = false;
let connecting: Promise<void> | null = null;

async function ensureConnected(): Promise<void> {
    if (started) return;
    if (connecting) return connecting;

    connecting = getVi().connect().then(
        () => { started = true; },
        e => { connecting = null; throw e; }
    ).finally(() => { connecting = null; });
    return connecting;
}

// ── Subscriptions (ref-counted) ──────────────────────────────────────────────
const userRefCounts = new Map<string, number>();
const channelListeners = new Map<string, Set<() => void>>();

export function subscribeUser(userId: string): void {
    const next = (userRefCounts.get(userId) ?? 0) + 1;
    userRefCounts.set(userId, next);
    if (next === 1) getVi().subscribe({ users: [userId] });
    void ensureConnected().catch(() => { });
}

export function unsubscribeUser(userId: string): void {
    const next = (userRefCounts.get(userId) ?? 0) - 1;
    if (next <= 0) {
        userRefCounts.delete(userId);
        getVi().unsubscribe({ users: [userId] });
    } else {
        userRefCounts.set(userId, next);
    }
}

export function subscribeChannel(channelId: string, onChange: () => void): () => void {
    let set = channelListeners.get(channelId);
    if (!set) {
        set = new Set();
        channelListeners.set(channelId, set);
        getVi().subscribe({ channels: [channelId] });
    }
    set.add(onChange);
    void ensureConnected().catch(() => { });

    return () => {
        const current = channelListeners.get(channelId);
        if (!current) return;
        current.delete(onChange);
        if (current.size === 0) {
            channelListeners.delete(channelId);
            getVi().unsubscribe({ channels: [channelId] });
        }
    };
}

// ── Batched bulk user queries ────────────────────────────────────────────────
const pendingUsers = new Set<string>();

const flushUsers = debounce(() => {
    const ids = [...pendingUsers];
    pendingUsers.clear();
    if (ids.length === 0) return;

    ensureConnected()
        .then(async () => {
            const result = await getVi().queryUsers(ids) as Record<string, HydratedSession[]>;
            const map: Record<string, HydratedSession[]> = {};
            const missingChannels = new Set<string>();
            for (const id of ids) {
                map[id] = result[id] ?? [];
                if (map[id].length === 0) {
                    const cid = VoiceStateStore.getVoiceStateForUser(id)?.channelId;
                    if (cid) missingChannels.add(cid);
                }
            }
            useVoiceStore.getState().setMany(map);
            missingChannels.forEach(reportChannel);
        })
        .catch(e => { if (getBackend().isAuthorized()) logger.error("Bulk user query failed", e); });
}, BATCH_INTERVAL_MS);

export function requestUserSessions(userId: string): void {
    pendingUsers.add(userId);
    flushUsers();
}

// ── Direct queries (for the modal) ───────────────────────────────────────────
export async function queryUserSessions(userId: string): Promise<HydratedSession[]> {
    await ensureConnected();
    return await getVi().queryUser(userId) as HydratedSession[];
}

export async function queryChannelMembers(channelId: string): Promise<ChannelQueryResult> {
    await ensureConnected();
    const result = await getVi().queryChannel(channelId) as ChannelQueryResult;
    if (!result.members?.length) reportChannel(channelId);
    return result;
}

export async function queryUserLog(userId: string): Promise<UserChannelLogEntry[]> {
    await ensureConnected();
    return await getVi().queryUserLog(userId) as UserChannelLogEntry[];
}

export async function queryChannelLog(channelId: string): Promise<ChannelLogEntry[]> {
    await ensureConnected();
    return await getVi().queryChannelLog(channelId) as ChannelLogEntry[];
}

// ── Crowd-sourced reporting ──────────────────────────────────────────────────
function toReport(vs: DiscordVoiceState): ReportVoiceState {
    return {
        userId: vs.userId,
        channelId: vs.channelId ?? null,
        sessionId: vs.sessionId ?? null,
        mute: vs.mute,
        deaf: vs.deaf,
        stream: vs.stream,
        selfMute: vs.selfMute,
        selfDeaf: vs.selfDeaf,
        selfVideo: vs.selfVideo,
        selfStream: vs.selfStream,
        suppress: vs.suppress,
        guildId: vs.guildId,
    };
}

function buildMeta(vs: DiscordVoiceState): MetaUpsert {
    const meta: MetaUpsert = {};

    const user = UserStore.getUser(vs.userId);
    if (user) meta.user = { id: user.id, username: user.username, displayName: user.globalName ?? undefined, avatar: user.avatar ?? undefined };

    if (vs.channelId) {
        const channel = ChannelStore.getChannel(vs.channelId);
        if (channel) meta.channel = { id: channel.id, guildId: channel.guild_id ?? undefined, name: channel.name, userLimit: channel.userLimit, type: channel.type };
    }

    if (vs.guildId) {
        const guild = GuildStore.getGuild(vs.guildId);
        if (guild) meta.guild = { id: guild.id, name: guild.name, icon: guild.icon ?? undefined, vanityCode: guild.vanityURLCode ?? undefined };

        const nick = GuildMemberStore.getNick(vs.guildId, vs.userId);
        if (nick) meta.nick = { guildId: vs.guildId, userId: vs.userId, nick };
    }

    return meta;
}

function reportAllVoiceStates(): void {
    for (const byUser of Object.values(VoiceStateStore.getAllVoiceStates())) {
        for (const vs of Object.values(byUser)) {
            if (!vs.channelId) continue;
            getVi().report(toReport(vs), buildMeta(vs));
        }
    }
}

function reportChannel(channelId: string): void {
    for (const vs of Object.values(VoiceStateStore.getVoiceStatesForChannel(channelId))) {
        getVi().report(toReport(vs), buildMeta(vs));
    }
}

export function reportGuildMeta(guildId: string): void {
    const guild = GuildStore.getGuild(guildId);
    if (guild) getVi().upsertMeta({ guild: { id: guild.id, name: guild.name, icon: guild.icon ?? undefined, vanityCode: guild.vanityURLCode ?? undefined } });
}

export function reportVoiceStates(voiceStates: DiscordVoiceState[]): void {
    if (!started) return;
    for (const vs of voiceStates) getVi().report(toReport(vs), buildMeta(vs));
}

let reportTimer: ReturnType<typeof setTimeout> | null = null;

export function reportKnownVoiceStatesSoon(): void {
    if (reportTimer) clearTimeout(reportTimer);
    reportTimer = setTimeout(() => {
        reportTimer = null;
        ensureConnected().then(reportAllVoiceStates, () => { });
    }, 100);
}

function bindViEvents(client: VoiceIndicatorsClient): void {
    client.on("voiceDelta", d => {
        if (userRefCounts.has(d.userId)) requestUserSessions(d.userId);

        for (const cid of [d.channelId, d.fromChannelId]) {
            if (cid == null) continue;
            channelListeners.get(cid)?.forEach(cb => cb());
        }
    });

    client.on("ready", () => {
        reportAllVoiceStates();
        for (const id of userRefCounts.keys()) requestUserSessions(id);
    });

    client.on("revalidate", ({ channelId }) => reportChannel(channelId));

    client.on("fatal", ({ code, message }) => {
        started = false;
        logger.error(`Connection terminated: ${code} ${message}`);
        if (code === "AUTH_INVALID" || code === "GUILD_JOIN_FAILED") {
            showToast("Voice Indicators session expired. Re-authorize from the plugin settings.", Toasts.Type.FAILURE);
        }
    });
}

export function stopClient(): void {
    started = false;
    connecting = null;
    if (reportTimer) { clearTimeout(reportTimer); reportTimer = null; }
    pendingUsers.clear();
    userRefCounts.clear();
    channelListeners.clear();
    vi?.close();
    vi = null;
    activeBackend = null;
    useVoiceStore.getState().clear();
}
