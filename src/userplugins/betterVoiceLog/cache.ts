/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { findByPropsLazy } from "@webpack";
import { VoiceState } from "@vencord/discord-types";
const VoiceStateStore = findByPropsLazy("getVoiceStates");

export const recordedGuilds = new Set<string>();
export const ignoredChannels = new Set<string>();

export const lastVoiceStates = new Map<string, VoiceState>();

export function updateLastVoiceStatesForGuild(guildId: string, action: "Add" | "Remove") {
    Object.values(VoiceStateStore.getVoiceStates(guildId) as Record<string, VoiceState>).forEach(voiceState => {
        if (ignoredChannels.has(voiceState.channelId!)) return;
        switch (action) {
            case "Add":
                recordedGuilds.add(guildId);
                break;
            case "Remove":
                recordedGuilds.delete(guildId);
                break;
        }
    });
}
