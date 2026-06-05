/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { ChannelStore, GuildStore, UserStore } from "@webpack/common";
import { Channel, Guild, User } from "@vencord/discord-types";

import * as db from "./db";

export type TVoiceUpdateType = "SelfMute" | "SelfUnmute" | "SelfDeaf" | "SelfUndeaf" | "GuildMute" | "GuildUnmute" | "GuildDeaf" | "GuildUndeaf" | "SelfStartStream" | "SelfStopStream" | "SelfStartVideo" | "SelfStopVideo";
export type TVoiceStateType = "SelfMute" | "SelfDeaf" | "GuildMute" | "GuildDeaf" | "SelfStream" | "SelfVideo";
export type TVoiceMoveType = "Join" | "Leave" | "Move" | "Stay";

export type TRawVoiceLog = {
    user_id: string;
    guild_id: string;
    channel_id: string | null;
    old_channel_id: string | null;
    update_types: TVoiceUpdateType[];
    move_type: TVoiceMoveType;
    states: TVoiceStateType[];
    at: number;
};

export type TVoiceLog = TRawVoiceLog & {
    user: User;
    guild: Guild;
    old_channel: Channel | null;
    channel: Channel | null;

    cache_user: {
        id: string;
        username: string;
        global_name: string;
        bot: boolean;
        discriminator: string;
        avatar: string | null;
    };

    cache_guild: {
        id: string;
        name: string;
        icon: string | null;
        owner_id: string;
    };

    cache_old_channel: {
        id: string;
        name: string;
        type: number;
        guild_id: string;
    };

    cache_channel: {
        id: string;
        name: string;
        type: number;
        guild_id: string;
    };
};

export async function getVoiceLogs(): Promise<TVoiceLog[]> {
    let [
        userInfoCache,
        guildInfoCache,
        channelInfoCache,
        rawLogs,
    ] = await db.getMany([
        "System;Cache;UserInfo",
        "System;Cache;GuildInfo",
        "System;Cache;ChannelInfo",
        "System;VoiceLog",
    ]) as [any, any, any, TRawVoiceLog[]];

    userInfoCache ||= {};
    guildInfoCache ||= {};
    channelInfoCache ||= {};
    rawLogs ||= [];

    return rawLogs.map(rawLog => {
        const user = UserStore.getUser(rawLog.user_id);
        const guild = GuildStore.getGuild(rawLog.guild_id);
        const channel = rawLog.channel_id ? ChannelStore.getChannel(rawLog.channel_id) : null;
        const oldChannel = rawLog.old_channel_id ? ChannelStore.getChannel(rawLog.old_channel_id) : null;

        return {
            ...rawLog,
            user,
            guild,
            channel,
            old_channel: oldChannel,
            cache_user: user ? {
                id: user.id,
                username: user.username,
                global_name: (user as any).globalName,
                bot: user.bot,
                discriminator: user.discriminator,
                avatar: user.avatar,
            } : userInfoCache[rawLog.user_id],
            cache_guild: guild ? {
                id: guild.id,
                name: guild.name,
                icon: guild.icon,
                owner_id: guild.ownerId,
            } : guildInfoCache[rawLog.guild_id],
            cache_channel: channel ? {
                id: channel.id,
                name: channel.name,
                type: channel.type,
                guild_id: channel.guild_id,
            } : channelInfoCache[rawLog.channel_id!],
            cache_old_channel: oldChannel ? {
                id: oldChannel.id,
                name: oldChannel.name,
                type: oldChannel.type,
                guild_id: oldChannel.guild_id,
            } : channelInfoCache[rawLog.old_channel_id!],
            toJSON() {
                return {
                    user_id: this.user_id,
                    guild_id: this.guild_id,
                    channel_id: this.channel_id,
                    old_channel_id: this.old_channel_id,
                    update_types: this.update_types,
                    move_type: this.move_type,
                    states: this.states,
                    at: this.at,
                    cache_user: this.cache_user,
                    cache_guild: this.cache_guild,
                    cache_channel: this.cache_channel,
                    cache_old_channel: this.cache_old_channel,
                };
            }
        };
    });

}
