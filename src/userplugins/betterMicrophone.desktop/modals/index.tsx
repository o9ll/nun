/*
 * Nun, a Discord client mod
 * Copyright (c) 2026 o9
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { MicrophoneSettingsModal } from "../../betterMicrophone.desktop/components";
import { PluginInfo } from "../../betterMicrophone.desktop/constants";
import Plugin from "../../betterMicrophone.desktop/index";
import { microphoneStore } from "../../betterMicrophone.desktop/stores";
import { openModalLazy } from "@webpack/common";

const onMicrophoneModalDone = () => {
    Plugin.microphonePatcher?.forceUpdateTransportationOptions();
    Plugin.applyLiveBitrate();
};

export const openMicrophoneSettingsModal =
    () => openModalLazy(async () => {
        return props =>
            <MicrophoneSettingsModal
                onDone={onMicrophoneModalDone}
                showInfo
                microphoneStore={microphoneStore}
                author={PluginInfo.AUTHOR}
                contributors={Object.values(PluginInfo.CONTRIBUTORS)}
                {...props} />;
    });
