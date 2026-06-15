/*
 * Nun, a Discord client mod
 * Copyright (c) 2026 o9
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { applyVoiceProcessingOptions } from "../../betterMicrophone.desktop/settings";
import { MicrophoneProfile, MicrophoneStore } from "../../betterMicrophone.desktop/stores";
import { ProfilableStore, types } from "../../philsPluginLibrary";
import { Logger } from "@utils/Logger";
import { lodash } from "@webpack/common";

export function getDefaultAudioTransportationOptions(connection: types.Connection) {
    return {
        audioEncoder: { ...connection.getCodecOptions("opus").audioEncoder },
        encodingVoiceBitRate: 64000
    };
}

const STEREO_DECODER = {
    channels: 2,
    freq: 48000,
    bitrate: 512,
    params: { stereo: "1" },
    type: 120,
    name: "opus",
} as const;

export function getStereoAudioDecoder() {
    return STEREO_DECODER;
}

export function getReplaceableAudioTransportationOptions(
    connection: types.Connection,
    get: ProfilableStore<MicrophoneStore, MicrophoneProfile>["get"]
) {
    const { currentProfile } = get();
    const { channels, channelsEnabled, freq, freqEnabled, pacsize, pacsizeEnabled, rate, rateEnabled, voiceBitrate, voiceBitrateEnabled } = currentProfile;
    const channelCount = channelsEnabled && channels ? channels : 1;
    const encoder = {
        ...connection.getCodecOptions("opus").audioEncoder,
        ...(rateEnabled && rate ? { rate } : {}),
        ...(pacsizeEnabled && pacsize ? { pacsize } : pacsizeEnabled === false ? {} : { pacsize: 960 }),
        ...(freqEnabled && freq ? { freq } : freqEnabled === false ? {} : { freq: 48000 }),
        channels: channelCount,
        ...(channelCount >= 2 ? { params: { stereo: "1" } } : {}),
    };
    return {
        ...(voiceBitrateEnabled && voiceBitrate ? { encodingVoiceBitRate: voiceBitrate * 1000 } : {}),
        audioEncoder: encoder,
        ...(channelCount >= 2 ? { audioDecoders: [getStereoAudioDecoder()] } : {}),
    };
}

export function patchConnectionAudioTransportOptions(
    connection: types.Connection,
    get: ProfilableStore<MicrophoneStore, MicrophoneProfile>["get"],
    logger?: Logger
) {
    const oldSetTransportOptions = connection.conn.setTransportOptions;

    connection.conn.setTransportOptions = function (this: any, options: Record<string, any>) {
        const replaceable = getReplaceableAudioTransportationOptions(connection, get);
        if (replaceable.encodingVoiceBitRate !== undefined) options.encodingVoiceBitRate = replaceable.encodingVoiceBitRate;
        if (!options.audioEncoder) options.audioEncoder = {};
        Object.assign(options.audioEncoder, replaceable.audioEncoder);
        if (replaceable.audioDecoders) options.audioDecoders = replaceable.audioDecoders;
        applyVoiceProcessingOptions(options);
        return Reflect.apply(oldSetTransportOptions, this, [options]);
    };

    const forceUpdateTransportationOptions = () => {
        const transportOptions = lodash.merge(
            { ...getDefaultAudioTransportationOptions(connection) },
            getReplaceableAudioTransportationOptions(connection, get)
        );
        applyVoiceProcessingOptions(transportOptions);
        logger?.info("Overridden Transport Options", transportOptions);
        oldSetTransportOptions(transportOptions);
    };

    return { oldSetTransportOptions, forceUpdateTransportationOptions };
}
