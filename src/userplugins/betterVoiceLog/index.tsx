/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./styles.css";

import definePlugin, { StartAt } from "@utils/types";
import { ChannelStore, GuildStore, UserStore } from "@webpack/common";
import { User, VoiceState } from "@vencord/discord-types";

import { ignoredChannels, lastVoiceStates, recordedGuilds, updateLastVoiceStatesForGuild } from "./cache";
import { openVoiceLogModal } from "./components/VoiceLogModal";
import { ChannelContextMenuPatch, GuildContextMenuPatch, UserContextMenuPatch } from "./contextMenu";
import * as db from "./db";
import { settings } from "./settings";
import { getVoiceLogs, TRawVoiceLog, TVoiceStateType, TVoiceUpdateType } from "./voiceLog";

let cacheClearerInterval: any;
let canScan = false;

export default definePlugin({
    name: "BetterVoiceLog",
    description: "A plugin to log voice state changes in Discord. Allows you to track when users join, leave, mute, unmute, and more in voice channels. You can filter logs by channel and guild, and view detailed information about each event.",
    authors: [{ name: "o9", id: 426687300387471360n }],
    settings,
    startAt: StartAt.DOMContentLoaded,
    async start() {
        recordedGuilds.clear();
        lastVoiceStates.clear();

        await new Promise(r => setTimeout(r, 3000));

        const ignored = await db.get("Config;IgnoredChannels");
        if (ignored) {
            for (const channel of ignored) {
                ignoredChannels.add(channel);
            }
        }

        const guilds = await db.get("Config;RecordedGuilds");
        if (guilds) {
            for (const guildId of guilds) {
                recordedGuilds.add(guildId);
                updateLastVoiceStatesForGuild(guildId, "Add");
            }
        }

        window.BetterVoiceLog = {
            recordedGuilds,
            ignoredChannels,
            lastVoiceStates,
            settings,
            db,
            getVoiceLogs,
            openVoiceLogModal
        };

        async function clearCache() {
            let [
                userInfoCache,
                guildInfoCache,
                channelInfoCache,
                voiceLog,
            ] = await db.getMany([
                "System;Cache;UserInfo",
                "System;Cache;GuildInfo",
                "System;Cache;ChannelInfo",
                "System;VoiceLog",
            ]) as [any, any, any, TRawVoiceLog[]];

            userInfoCache ||= {};
            guildInfoCache ||= {};
            channelInfoCache ||= {};
            voiceLog ||= [];

            Object.keys(userInfoCache).forEach(userId => {
                if (!voiceLog.some(log => log.user_id === userId))
                    delete userInfoCache[userId];
            });

            Object.keys(guildInfoCache).forEach(guildId => {
                if (!voiceLog.some(log => log.guild_id === guildId))
                    delete guildInfoCache[guildId];
            });

            Object.keys(channelInfoCache).forEach(channelId => {
                if (!voiceLog.some(log => log.channel_id === channelId || log.old_channel_id === channelId))
                    delete channelInfoCache[channelId];
            });

            await db.setMany({
                "System;Cache;UserInfo": userInfoCache,
                "System;Cache;GuildInfo": guildInfoCache,
                "System;Cache;ChannelInfo": channelInfoCache,
            });
        }

        cacheClearerInterval = setInterval(clearCache, 1000 * 60 * 60 * 2);
        await clearCache();
        canScan = true;
    },
    async stop() {
        canScan = false;

        await db.set("Config;RecordedGuilds", [...recordedGuilds]);
        recordedGuilds.clear();
        await db.set("Config;IgnoredChannels", [...ignoredChannels]);
        ignoredChannels.clear();
        lastVoiceStates.clear();

        delete window.BetterVoiceLog;
        if (cacheClearerInterval) clearInterval(cacheClearerInterval);
    },
    flux: {
        async VOICE_STATE_UPDATES({ voiceStates }: { voiceStates: VoiceState[]; }) {
            if (!canScan) return;

            const newLog: TRawVoiceLog[] = [];

            voiceStates.forEach(voiceState => {
                if (!voiceState.guildId || !recordedGuilds.has(voiceState.guildId)) return;
                const channelId = voiceState.channelId || voiceState.oldChannelId;
                if (!channelId || ignoredChannels.has(channelId)) return;
                const guild = GuildStore.getGuild(voiceState.guildId);
                const channel = ChannelStore.getChannel(channelId);
                if (!guild || !channel) return;

                const lastVoiceState = lastVoiceStates.get(voiceState.userId);

                const moveType = (() => {
                    if (voiceState.channelId && voiceState.oldChannelId && voiceState.channelId !== voiceState.oldChannelId) {
                        return "Move";
                    } else if (voiceState.channelId && !voiceState.oldChannelId) {
                        return "Join";
                    } else if (!voiceState.channelId && voiceState.oldChannelId) {
                        return "Leave";
                    } else {
                        return "Stay";
                    }
                })();

                const updateTypes = (() => {
                    if (!lastVoiceState) return [];
                    const types: TVoiceUpdateType[] = [];
                    if (voiceState.selfMute !== lastVoiceState?.selfMute) {
                        types.push(voiceState.selfMute ? "SelfMute" : "SelfUnmute");
                    }
                    if (voiceState.selfDeaf !== lastVoiceState?.selfDeaf) {
                        types.push(voiceState.selfDeaf ? "SelfDeaf" : "SelfUndeaf");
                    }
                    if (voiceState.mute !== lastVoiceState?.mute) {
                        types.push(voiceState.mute ? "GuildMute" : "GuildUnmute");
                    }
                    if (voiceState.deaf !== lastVoiceState?.deaf) {
                        types.push(voiceState.deaf ? "GuildDeaf" : "GuildUndeaf");
                    }
                    if (voiceState.selfStream !== lastVoiceState?.selfStream) {
                        types.push(voiceState.selfStream ? "SelfStartStream" : "SelfStopStream");
                    }
                    if (voiceState.selfVideo !== lastVoiceState?.selfVideo) {
                        types.push(voiceState.selfVideo ? "SelfStartVideo" : "SelfStopVideo");
                    }
                    return types;
                })();

                if (moveType !== "Leave") {
                    lastVoiceStates.set(voiceState.userId, voiceState);
                } else {
                    lastVoiceStates.delete(voiceState.userId);
                }

                newLog.push({
                    user_id: voiceState.userId,
                    guild_id: voiceState.guildId,
                    channel_id: voiceState.channelId || null,
                    old_channel_id: voiceState.oldChannelId || null,
                    update_types: updateTypes,
                    move_type: moveType,
                    states: [
                        voiceState.selfMute && "SelfMute",
                        voiceState.selfDeaf && "SelfDeaf",
                        voiceState.mute && "GuildMute",
                        voiceState.deaf && "GuildDeaf",
                        voiceState.selfStream && "SelfStream",
                        voiceState.selfVideo && "SelfVideo",
                    ].filter(Boolean) as TVoiceStateType[],
                    at: Date.now(),
                });
            });

            if (newLog.length === 0) return;

            let [
                userInfoCache,
                guildInfoCache,
                channelInfoCache,
                oldLog,
            ] = await db.getMany([
                "System;Cache;UserInfo",
                "System;Cache;GuildInfo",
                "System;Cache;ChannelInfo",
                "System;VoiceLog",
            ]);

            userInfoCache ||= {};
            guildInfoCache ||= {};
            channelInfoCache ||= {};
            oldLog ||= [];

            newLog.forEach(log => {
                const user = UserStore.getUser(log.user_id) as User & { globalName: string | null; };
                if (user) userInfoCache[log.user_id] = {
                    id: user.id,
                    username: user.username,
                    global_name: user.globalName,
                    bot: user.bot,
                    discriminator: user.discriminator,
                    avatar: user.avatar,
                };
                const guild = GuildStore.getGuild(log.guild_id);
                if (guild) guildInfoCache[log.guild_id] = {
                    id: guild.id,
                    name: guild.name,
                    icon: guild.icon,
                    owner_id: guild.ownerId,
                };
                const channelId = (log.channel_id || log.old_channel_id)!;
                const channel = ChannelStore.getChannel(channelId);
                if (channel) channelInfoCache[channelId] = {
                    id: channel.id,
                    name: channel.name,
                    type: channel.type,
                    guild_id: channel.guild_id,
                };
            });

            await db.setMany({
                "System;Cache;UserInfo": userInfoCache,
                "System;Cache;GuildInfo": guildInfoCache,
                "System;Cache;ChannelInfo": channelInfoCache,
                "System;VoiceLog": [...newLog, ...oldLog].slice(0, settings.store.maxHistorySize),
            });
        }
    },
    contextMenus: {
        "channel-context": ChannelContextMenuPatch,
        "guild-context": GuildContextMenuPatch,
        "user-context": UserContextMenuPatch
    }
});
