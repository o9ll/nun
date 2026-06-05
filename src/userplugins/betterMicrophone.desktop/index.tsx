/*
 * Vencord, a modification for Discord's desktop app
 * Copyright (c) 2023 Vendicated and contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import BetterMicrophoneSettingsAbout from "@userplugins/betterMicrophone.desktop/components/SettingsAbout";
import { PluginInfo } from "@userplugins/betterMicrophone.desktop/constants";
import { openMicrophoneSettingsModal } from "@userplugins/betterMicrophone.desktop/modals";
import { MicrophonePatcher } from "@userplugins/betterMicrophone.desktop/patchers";
import { initMicrophoneStore } from "@userplugins/betterMicrophone.desktop/stores";
import { addSettingsPanelButton, Emitter, MicrophoneSettingsIcon, removeSettingsPanelButton } from "@userplugins/philsPluginLibrary";
import definePlugin, { PluginNative } from "@utils/types";

export const Native = VencordNative.pluginHelpers.BetterMicrophone as PluginNative<typeof import("./native")>;

export default definePlugin({
    name: "BetterMicrophone",
    description: "Customize mic transport for GoXLR and other interfaces. Includes GoXLR SM7B profiles tuned for mono voice at 48 kHz.",
    authors: [{ name: "o9", id: 426687300387471360n }],
    dependencies: ["PhilsPluginLibrary"],
    requiresRestart: true,
    settingsAboutComponent: BetterMicrophoneSettingsAbout,

    start(): void {
        initMicrophoneStore();
        this.microphonePatcher = new MicrophonePatcher().patch();
        addSettingsPanelButton({
            name: PluginInfo.PLUGIN_NAME,
            icon: MicrophoneSettingsIcon,
            tooltipText: "Mic",
            onClick: openMicrophoneSettingsModal
        });
        try {
            const nativeModules = globalThis.DiscordNative?.nativeModules;
            if (!nativeModules?.requireModule) throw new Error("DiscordNative.nativeModules is unavailable");
            nativeModules.requireModule("discord_voice");
            Native.applyPatches().then(result => {
                if (result.error) { console.error("[BetterMicrophone]", result.error); return; }
                console.log(`[BetterMicrophone] ${result.module_base} | patches: ok:${result.ok} failed:${result.failed} skipped:${result.skipped}`);
            }).catch(e => console.error("[BetterMicrophone]", e));
        } catch (e) {
            console.error("[BetterMicrophone]", e);
        }
    },

    stop(): void {
        this.microphonePatcher?.unpatch();
        Emitter.removeAllListeners(PluginInfo.PLUGIN_NAME);
        removeSettingsPanelButton(PluginInfo.PLUGIN_NAME);
    },

    toolboxActions: {
        "Microphone Settings": openMicrophoneSettingsModal
    },
});
