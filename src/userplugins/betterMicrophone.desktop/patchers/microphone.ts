/*
 * Nun, a Discord client mod
 * Copyright (c) 2026 o9
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { PluginInfo } from "../../betterMicrophone.desktop/constants";
import { logger } from "../../betterMicrophone.desktop/logger";
import { microphoneStore } from "../../betterMicrophone.desktop/stores";
import { Emitter, MediaEngineStore, Patcher, types } from "../../nunPluginLibrary";
import { patchConnectionAudioTransportOptions } from "../../nunPluginLibrary/patches/audio";

export class MicrophonePatcher extends Patcher {
    private mediaEngineStore: types.MediaEngineStore;
    private mediaEngine: types.MediaEngine;
    public connection?: types.Connection;
    public oldSetTransportOptions: (...args: any[]) => void;
    public forceUpdateTransportationOptions: () => void;

    constructor() {
        super();
        this.mediaEngineStore = MediaEngineStore;
        this.mediaEngine = this.mediaEngineStore.getMediaEngine();
        this.oldSetTransportOptions = () => void 0;
        this.forceUpdateTransportationOptions = () => void 0;
    }

    public patch(): this {
        this.unpatch();

        const { get } = microphoneStore;

        const connectionEventFunction =
            (connection: types.Connection) => {
                if (connection.context !== "default") return;

                this.connection = connection;

                const { oldSetTransportOptions, forceUpdateTransportationOptions } = patchConnectionAudioTransportOptions(connection, get, logger);

                this.oldSetTransportOptions = oldSetTransportOptions;
                this.forceUpdateTransportationOptions = forceUpdateTransportationOptions;
            };

        Emitter.addListener(
            this.mediaEngine.emitter,
            "on",
            "connection",
            connectionEventFunction,
            PluginInfo.PLUGIN_NAME
        );

        return this;
    }

    public unpatch(): this {
        return this._unpatch();
    }
}
