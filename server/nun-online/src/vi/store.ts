import { config } from "../config.js";

export interface SessionUser {
    id: string;
    username?: string;
    displayName?: string;
    avatar?: string;
}

export interface SessionChannel {
    id: string;
    guildId?: string;
    name?: string;
    userLimit?: number;
    type: number;
}

export interface SessionGuild {
    id: string;
    name?: string;
    icon?: string;
    vanityCode?: string;
}

export interface SessionNick {
    guildId: string;
    userId: string;
    nick: string;
}

export interface HydratedSession {
    userId: string;
    channelId: string | null;
    sessionId: string | null;
    mute: boolean;
    deaf: boolean;
    stream: boolean;
    selfMute: boolean;
    selfDeaf: boolean;
    selfVideo: boolean;
    selfStream?: boolean;
    suppress: boolean;
    guildId?: string;
    durationMs?: number;
    user?: SessionUser;
    nick?: SessionNick;
    channel?: SessionChannel;
    guild?: SessionGuild;
}

export interface VoiceDelta {
    type: "join" | "leave" | "move" | "update";
    sessionId: string;
    userId: string;
    channelId: string | null;
    guildId?: string;
    fromChannelId?: string;
    state?: Record<string, unknown>;
}

export interface UserChannelLogEntry {
    channelId: string;
    guildId?: string;
    joinedAt: number;
    leftAt?: number;
    channel?: SessionChannel;
    guild?: SessionGuild;
}

export interface ChannelLogEntry {
    type: "join" | "leave" | "move";
    userId: string;
    sessionId: string;
    fromChannelId?: string;
    toChannelId?: string;
    guildId?: string;
    ts: number;
    user?: SessionUser;
    nick?: string;
    fromChannel?: SessionChannel;
    toChannel?: SessionChannel;
    guild?: SessionGuild;
}

interface MetaUpsert {
    guild?: SessionGuild;
    channel?: SessionChannel;
    user?: SessionUser;
    nick?: SessionNick;
}

interface VoiceReport {
    userId: string;
    channelId: string | null;
    sessionId: string | null;
    mute: boolean;
    deaf: boolean;
    stream: boolean;
    selfMute: boolean;
    selfDeaf: boolean;
    selfVideo: boolean;
    selfStream?: boolean;
    suppress: boolean;
    guildId?: string;
    meta?: MetaUpsert;
}

const sessions = new Map<string, HydratedSession>();
const joinedAt = new Map<string, number>();
const users = new Map<string, SessionUser>();
const channels = new Map<string, SessionChannel>();
const guilds = new Map<string, SessionGuild>();
const nicks = new Map<string, SessionNick>();
const userLogs = new Map<string, UserChannelLogEntry[]>();
const channelLogs = new Map<string, ChannelLogEntry[]>();

function nickKey(guildId: string, userId: string) {
    return `${guildId}:${userId}`;
}

function hydrate(session: HydratedSession): HydratedSession {
    const user = users.get(session.userId);
    const channel = session.channelId ? channels.get(session.channelId) : undefined;
    const guildId = session.guildId ?? channel?.guildId;
    const guild = guildId ? guilds.get(guildId) : undefined;
    const nick = guildId ? nicks.get(nickKey(guildId, session.userId)) : undefined;
    const since = joinedAt.get(session.userId);

    return {
        ...session,
        durationMs: session.channelId && since ? Date.now() - since : undefined,
        user,
        channel,
        guild,
        nick,
    };
}

function pushBounded<T>(list: T[], entry: T): T[] {
    const next = [...list, entry];
    if (next.length > config.maxLogEntries) next.splice(0, next.length - config.maxLogEntries);
    return next;
}

function logUserVisit(userId: string, channelId: string | null, guildId?: string, left = false): void {
    if (!channelId) return;
    const log = userLogs.get(userId) ?? [];
    const open = log.find(e => e.channelId === channelId && e.leftAt == null);
    if (left && open) {
        open.leftAt = Date.now();
        userLogs.set(userId, log);
        return;
    }
    if (!left) {
        userLogs.set(userId, pushBounded(log, {
            channelId,
            guildId,
            joinedAt: Date.now(),
            channel: channels.get(channelId),
            guild: guildId ? guilds.get(guildId) : undefined,
        }));
    }
}

function logChannelEvent(entry: ChannelLogEntry): void {
    const cid = entry.toChannelId ?? entry.fromChannelId;
    if (!cid) return;
    channelLogs.set(cid, pushBounded(channelLogs.get(cid) ?? [], entry));
}

export function upsertMeta(meta: MetaUpsert): void {
    if (meta.user) users.set(meta.user.id, meta.user);
    if (meta.channel) channels.set(meta.channel.id, meta.channel);
    if (meta.guild) guilds.set(meta.guild.id, meta.guild);
    if (meta.nick) nicks.set(nickKey(meta.nick.guildId, meta.nick.userId), meta.nick);
}

export function applyVoiceReport(report: VoiceReport): VoiceDelta | null {
    if (report.meta) upsertMeta(report.meta);

    const prev = sessions.get(report.userId);
    const sessionId = report.sessionId ?? prev?.sessionId ?? report.userId;
    const next: HydratedSession = {
        userId: report.userId,
        channelId: report.channelId,
        sessionId,
        mute: report.mute,
        deaf: report.deaf,
        stream: report.stream,
        selfMute: report.selfMute,
        selfDeaf: report.selfDeaf,
        selfVideo: report.selfVideo,
        selfStream: report.selfStream,
        suppress: report.suppress,
        guildId: report.guildId,
    };

    let type: VoiceDelta["type"] = "update";
    let fromChannelId: string | undefined;

    if (!prev?.channelId && report.channelId) {
        type = "join";
        joinedAt.set(report.userId, Date.now());
        logUserVisit(report.userId, report.channelId, report.guildId);
        logChannelEvent({
            type: "join",
            userId: report.userId,
            sessionId,
            toChannelId: report.channelId,
            guildId: report.guildId,
            ts: Date.now(),
            user: users.get(report.userId),
            nick: report.guildId ? nicks.get(nickKey(report.guildId, report.userId))?.nick : undefined,
            toChannel: report.channelId ? channels.get(report.channelId) : undefined,
            guild: report.guildId ? guilds.get(report.guildId) : undefined,
        });
    } else if (prev?.channelId && !report.channelId) {
        type = "leave";
        joinedAt.delete(report.userId);
        logUserVisit(report.userId, prev.channelId, prev.guildId, true);
        logChannelEvent({
            type: "leave",
            userId: report.userId,
            sessionId,
            fromChannelId: prev.channelId,
            guildId: prev.guildId,
            ts: Date.now(),
            user: users.get(report.userId),
            fromChannel: channels.get(prev.channelId),
            guild: prev.guildId ? guilds.get(prev.guildId) : undefined,
        });
    } else if (prev?.channelId && report.channelId && prev.channelId !== report.channelId) {
        type = "move";
        fromChannelId = prev.channelId;
        joinedAt.set(report.userId, Date.now());
        logUserVisit(report.userId, prev.channelId, prev.guildId, true);
        logUserVisit(report.userId, report.channelId, report.guildId);
        logChannelEvent({
            type: "move",
            userId: report.userId,
            sessionId,
            fromChannelId: prev.channelId,
            toChannelId: report.channelId,
            guildId: report.guildId,
            ts: Date.now(),
            user: users.get(report.userId),
            fromChannel: channels.get(prev.channelId),
            toChannel: channels.get(report.channelId),
            guild: report.guildId ? guilds.get(report.guildId) : undefined,
        });
    }

    sessions.set(report.userId, next);

    if (!prev && type === "update" && !report.channelId) return null;
    if (prev
        && prev.channelId === next.channelId
        && prev.mute === next.mute
        && prev.deaf === next.deaf
        && prev.stream === next.stream
        && prev.selfMute === next.selfMute
        && prev.selfDeaf === next.selfDeaf
        && prev.selfVideo === next.selfVideo
        && prev.selfStream === next.selfStream
        && prev.suppress === next.suppress) {
        return null;
    }

    return {
        type,
        sessionId,
        userId: report.userId,
        channelId: report.channelId,
        guildId: report.guildId,
        fromChannelId,
    };
}

export function getUserSessions(userId: string): HydratedSession[] {
    const s = sessions.get(userId);
    if (!s || !s.channelId) return [];
    return [hydrate(s)];
}

export function getUsersBulk(userIds: string[]): Record<string, HydratedSession[]> {
    const out: Record<string, HydratedSession[]> = {};
    for (const id of userIds) out[id] = getUserSessions(id);
    return out;
}

export function getChannelMembers(channelId: string): { channel?: SessionChannel; guild?: SessionGuild; count: number; members: HydratedSession[]; } {
    const members = [...sessions.values()]
        .filter(s => s.channelId === channelId)
        .map(hydrate);
    const channel = channels.get(channelId);
    const guild = channel?.guildId ? guilds.get(channel.guildId) : undefined;
    return { channel, guild, count: members.length, members };
}

export function getGuildSnapshot(guildId: string): { guild?: SessionGuild; members: HydratedSession[]; } {
    const members = [...sessions.values()]
        .filter(s => s.guildId === guildId && s.channelId)
        .map(hydrate);
    return { guild: guilds.get(guildId), members };
}

export function getUserLog(userId: string): UserChannelLogEntry[] {
    return [...(userLogs.get(userId) ?? [])].reverse();
}

export function getChannelLog(channelId: string): ChannelLogEntry[] {
    return [...(channelLogs.get(channelId) ?? [])].reverse();
}

export function matchesSubscription(
    delta: VoiceDelta,
    subs: { guilds: Set<string>; channels: Set<string>; users: Set<string>; },
): boolean {
    if (subs.users.has(delta.userId)) return true;
    if (delta.channelId && subs.channels.has(delta.channelId)) return true;
    if (delta.fromChannelId && subs.channels.has(delta.fromChannelId)) return true;
    if (delta.guildId && subs.guilds.has(delta.guildId)) return true;
    return false;
}
