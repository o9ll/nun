/*
 * Nun, a Discord client mod
 * Copyright (c) 2026 o9
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import BetterMicrophoneSettingsAbout from "../betterMicrophone.desktop/components/SettingsAbout";
import { PluginInfo } from "../betterMicrophone.desktop/constants";
import { openMicrophoneSettingsModal } from "../betterMicrophone.desktop/modals";
import { MicrophonePatcher } from "../betterMicrophone.desktop/patchers";
import { applyDiscordNoiseSuppressionMode, settings } from "../betterMicrophone.desktop/settings";
import { initMicrophoneStore, microphoneStore } from "../betterMicrophone.desktop/stores";
import { disableStereoScreenshareSDP, enableStereoScreenshareSDP } from "../betterMicrophone.desktop/voicePatches";
import { addSettingsPanelButton, Emitter, MicrophoneSettingsIcon, removeSettingsPanelButton } from "../nunPluginLibrary";
import definePlugin from "@utils/types";
import { waitForStore } from "@webpack/common/internal";

export { settings } from "../betterMicrophone.desktop/settings";

let liveVoiceConnection: { voiceBitrate?: number; setVoiceBitRate?(bitrate: number): void; } | null = null;

export default definePlugin({
    name: "BetterMicrophone",
    description: "Unified desktop voice setup: stereo 2 channel Opus at 48 kHz with profiled bitrates. Requires VoicePatcher.",
    authors: [{ name: "o9", id: 426687300387471360n }],
    tags: ["Nun"],
    dependencies: ["NunPluginLibrary", "VoicePatcher"],
    requiresRestart: true,
    settings,
    settingsAboutComponent: BetterMicrophoneSettingsAbout,

    patches: [
        {
            find: "...this.getAttenuationOptions()",
            replacement: [
                {
                    match: /freq:48e3,pacsize:960,channels:1,rate:64e3/,
                    replace: "freq:48e3,pacsize:960,channels:2,params:{stereo:\"1\"},rate:64e3"
                },
                {
                    match: /fec:!0/,
                    replace: "fec:$self.isFecEnabled()"
                }
            ]
        },
        {
            find: "){this.setVoiceBitRate(",
            replacement: {
                match: /setVoiceBitRate\(([A-Za-z_$][\w$]*)\)\{/,
                replace: "setVoiceBitRate($1){$1=$self.getVoiceBitrate(this,$1);"
            }
        },
        {
            find: "mediaBitrate:",
            replacement: {
                match: /(?<=mediaBitrate:)\d+/,
                replace: "$self.getMediaBitrate()",
            },
            noWarn: true,
        },
        {
            find: "pttReleaseDelay",
            replacement: {
                match: /(?<=pttReleaseDelay.{0,200})maxValue:2000/,
                replace: "maxValue:$self.settings.store.pttDelayMax",
            },
            noWarn: true,
        },
        {
            find: "voiceBitrate:",
            replacement: {
                match: /voiceBitrate:\i/,
                replace: "voiceBitrate:$self.getMediaBitrate()"
            }
        },
        {
            find: "noiseSuppression:",
            replacement: {
                match: /noiseSuppression:!?\d/,
                replace: "noiseSuppression:$self.getNoiseSuppression()"
            }
        },
        {
            find: "noiseCancellation:",
            replacement: {
                match: /noiseCancellation:!?\d/,
                replace: "noiseCancellation:$self.getNoiseCancellation()"
            }
        },
        {
            find: "echoCancellation:",
            replacement: {
                match: /echoCancellation:!?\d/,
                replace: "echoCancellation:$self.getEchoCancellation()"
            }
        },
        {
            find: "autoGainControl:",
            replacement: {
                match: /autoGainControl:!?\d/,
                replace: "autoGainControl:$self.getAutoGainControl()"
            }
        },
        {
            find: "x-google-max-bitrate",
            replacement: {
                match: /"x-google-max-bitrate=".concat\(\i\)/,
                replace: '"x-google-max-bitrate=".concat($self.getMediaBitrate())'
            }
        },
        {
            find: "b=AS:",
            replacement: {
                match: /b=AS:\d+/,
                replace: "b=AS:$self.getMediaBitrate()"
            }
        },
        {
            find: "priority:",
            replacement: {
                match: /priority:"low"/,
                replace: 'priority:$self.getAudioPriority()'
            }
        },
        {
            find: "googHighStartBitrate",
            replacement: {
                match: /googHighStartBitrate:\i/,
                replace: "googHighStartBitrate:$self.getPrioritizeAudioQuality()"
            }
        }
    ],

    getProfileBitrateKbps() {
        if (!microphoneStore) return settings.store.prioritizeAudioQuality ? 512 : 320;
        const { currentProfile } = microphoneStore.get();
        if (currentProfile.voiceBitrateEnabled && currentProfile.voiceBitrate) return currentProfile.voiceBitrate;
        return settings.store.prioritizeAudioQuality ? 512 : 320;
    },

    getMediaBitrate() {
        return this.getProfileBitrateKbps() * 1000;
    },

    getVoiceBitrate(conn: { voiceBitrate?: number; setVoiceBitRate?(bitrate: number): void; }, orgBitrate: number) {
        liveVoiceConnection = conn;
        return this.getMediaBitrate();
    },

    applyLiveBitrate() {
        if (!liveVoiceConnection?.setVoiceBitRate) return;
        try {
            liveVoiceConnection.voiceBitrate = undefined;
            liveVoiceConnection.setVoiceBitRate(this.getMediaBitrate());
        } catch { }
    },

    isFecEnabled() {
        if (!microphoneStore) return false;
        const { currentProfile } = microphoneStore.get();
        return currentProfile.fecEnabled ? !!currentProfile.fec : false;
    },

    getNoiseSuppression() {
        return false;
    },

    getNoiseCancellation() {
        return settings.store.enableKrispNoiseSuppression;
    },

    getEchoCancellation() {
        return settings.store.enableEchoCancellation;
    },

    getAutoGainControl() {
        return settings.store.enableAutoGainControl;
    },

    getPrioritizeAudioQuality() {
        return settings.store.prioritizeAudioQuality;
    },

    getAudioPriority() {
        return settings.store.prioritizeAudioQuality ? "high" : "low";
    },

    start() {
        initMicrophoneStore();
        this.microphonePatcher = new MicrophonePatcher().patch();
        enableStereoScreenshareSDP();
        waitForStore("MediaEngineStore", store => applyDiscordNoiseSuppressionMode(store));
        addSettingsPanelButton({
            name: PluginInfo.PLUGIN_NAME,
            icon: MicrophoneSettingsIcon,
            tooltipText: "Mic",
            onClick: openMicrophoneSettingsModal
        });
    },

    stop() {
        this.microphonePatcher?.unpatch();
        disableStereoScreenshareSDP();
        Emitter.removeAllListeners(PluginInfo.PLUGIN_NAME);
        removeSettingsPanelButton(PluginInfo.PLUGIN_NAME);
        liveVoiceConnection = null;
    },

    toolboxActions: {
        "Microphone Settings": openMicrophoneSettingsModal
    },
});
