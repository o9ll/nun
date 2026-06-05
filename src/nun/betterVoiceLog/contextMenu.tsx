/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { NavContextMenuPatchCallback } from "@api/ContextMenu";
import { copyToClipboard } from "@utils/clipboard";
import { FluxDispatcher, Menu, React } from "@webpack/common";
import { Channel, Guild, User } from "@vencord/discord-types";

import { ignoredChannels, recordedGuilds, updateLastVoiceStatesForGuild } from "./cache";
import { openVoiceLogModal } from "./components/VoiceLogModal";
import * as db from "./db";
import { TVoiceLog } from "./voiceLog";

export const ChannelContextMenuPatch: NavContextMenuPatchCallback = (children, { channel }: { channel: Channel; }) => {
    const [checked, setChecked] = React.useState(ignoredChannels.has(channel.id));

    if (channel.type !== 2) return;
    if (!channel.guild_id || !recordedGuilds.has(channel.guild_id)) return;

    children.push(
        <Menu.MenuSeparator />,
        <Menu.MenuItem id="voice-log" label="Voice Log" >
            <Menu.MenuCheckboxItem
                id="bvl-ignore-channel"
                label="Ignore Channel"
                checked={checked}
                action={() => {
                    if (ignoredChannels.has(channel.id)) {
                        ignoredChannels.delete(channel.id);
                        setChecked(false);
                        db.set("Config;IgnoredChannels", [...ignoredChannels]);
                        return;
                    }

                    ignoredChannels.add(channel.id);
                    db.set("Config;IgnoredChannels", [...ignoredChannels]);
                    setChecked(true);
                }}
            ></Menu.MenuCheckboxItem>
            <Menu.MenuItem
                id="bvl-show-logs"
                label="Show Channel Logs"
                action={() => {
                    openVoiceLogModal(channel.id);
                }}
            ></Menu.MenuItem>
        </Menu.MenuItem>
    );
};

export const GuildContextMenuPatch: NavContextMenuPatchCallback = (children, { guild }: { guild: Guild; }) => {
    const [checked, setChecked] = React.useState(recordedGuilds.has(guild.id));

    children.push(
        <Menu.MenuSeparator />,
        <Menu.MenuItem id="voice-log" label="Voice Log" >
            <Menu.MenuCheckboxItem
                id="bvl-ignore-channel"
                label="Record Guild"
                checked={checked}
                action={() => {
                    if (recordedGuilds.has(guild.id)) {
                        recordedGuilds.delete(guild.id);
                        setChecked(false);
                        db.set("Config;RecordedGuilds", [...recordedGuilds]);
                        updateLastVoiceStatesForGuild(guild.id, "Remove");
                        return;
                    }

                    updateLastVoiceStatesForGuild(guild.id, "Add");
                    recordedGuilds.add(guild.id);
                    db.set("Config;RecordedGuilds", [...recordedGuilds]);
                    setChecked(true);
                }}
            ></Menu.MenuCheckboxItem>
            <Menu.MenuItem
                id="bvl-show-logs"
                label="Show Guild Logs"
                action={() => {
                    openVoiceLogModal(guild.id);
                }}
            ></Menu.MenuItem>
        </Menu.MenuItem>
    );
};

export const UserContextMenuPatch: NavContextMenuPatchCallback = (children, { user }: { user: User; }) => {

    children.push(
        <Menu.MenuSeparator />,
        <Menu.MenuItem id="voice-log" label="Voice Log" >
            <Menu.MenuItem
                id="bvl-show-logs"
                label="Show User Logs"
                action={() => {
                    openVoiceLogModal(user.id);
                }}
            ></Menu.MenuItem>
        </Menu.MenuItem>
    );
};

export function VoiceLogContextMenu({ log }: { log: TVoiceLog; }) {
    return (
        <Menu.Menu
            navId="bvl-log-item"
            onClose={() => FluxDispatcher.dispatch({ type: "CONTEXT_MENU_CLOSE" })}
        >
            <Menu.MenuItem
                id="bvl-copy-id-guild"
                label="Copy Guild ID"
                action={() => {
                    copyToClipboard(log.guild_id);
                }}
            ></Menu.MenuItem>
            {log.channel_id && (
                <Menu.MenuItem
                    id="bvl-copy-id-channel"
                    label="Copy Channel ID"
                    action={() => {
                        copyToClipboard(log.channel_id!);
                    }}
                ></Menu.MenuItem>
            )}
            {(log.old_channel_id && log.old_channel_id !== log.channel_id) && (
                <Menu.MenuItem
                    id="bvl-copy-id-old-channel"
                    label="Copy Old Channel ID"
                    action={() => {
                        copyToClipboard(log.old_channel_id!);
                    }}
                ></Menu.MenuItem>
            )}
            <Menu.MenuItem
                id="bvl-copy-id-user"
                label="Copy User ID"
                action={() => {
                    copyToClipboard(log.user_id);
                }}
            ></Menu.MenuItem>
            <Menu.MenuItem
                id="bvl-copy-date"
                label="Copy Unix Date"
                action={() => {
                    copyToClipboard(log.at.toString());
                }}
            ></Menu.MenuItem>
        </Menu.Menu>
    );
}
