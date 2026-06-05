/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { Logger } from "@utils/Logger";
import definePlugin, { OptionType } from "@utils/types";

const logger = new Logger("StereoMic");

export const settings = definePluginSettings({
    bitrate: {
        type: OptionType.SLIDER,
        description: "Opus average bitrate in kbps. 160 is ideal for mono voice mics like the SM7B.",
        default: 160,
        markers: [96, 160, 256, 320, 512],
    },
    channels: {
        type: OptionType.SELECT,
        description: "Capture channel count. Use 1 for mono mics (SM7B). Use 2 only when feeding a stereo virtual source.",
        options: [
            { label: "Mono (SM7B / voice)", value: 1, default: true },
            { label: "Stereo (virtual input)", value: 2 },
        ],
    },
    disableProcessing: {
        type: OptionType.BOOLEAN,
        description: "Disable Discord browser processing (echo cancellation, noise suppression, auto gain). Keep on for GoXLR processed audio.",
        default: true,
    },
});

function mungeSdp(sdp: string, tag: string): string {
    if (!sdp || !/opus/i.test(sdp)) return sdp;
    const channels = settings.store.channels;
    const rtpmap = channels === 2
        ? sdp.match(/a=rtpmap:(\d+)\s+opus\/48000\/2/i)
        : sdp.match(/a=rtpmap:(\d+)\s+opus\/48000(?:\/\d+)?/i);
    if (!rtpmap) return sdp;
    const pt = rtpmap[1];
    const bitrate = settings.store.bitrate * 1000;
    const lines = sdp.split(/\r?\n/);
    let touched = false;
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith(`a=fmtp:${pt} `)) {
            let p = lines[i].slice(`a=fmtp:${pt} `.length);
            const set = (k: string, v: number) => {
                const re = new RegExp(`${k}=[^;]*`);
                p = re.test(p) ? p.replace(re, `${k}=${v}`) : `${p};${k}=${v}`;
            };
            if (channels === 2) {
                set("stereo", 1);
                set("sprop-stereo", 1);
            }
            set("maxaveragebitrate", bitrate);
            lines[i] = `a=fmtp:${pt} ${p}`;
            touched = true;
        }
    }
    if (touched) logger.info(`munged ${tag} (pt ${pt}, ${channels}ch, ${settings.store.bitrate}kbps)`);
    return lines.join("\r\n");
}

let origSetLocal: typeof RTCPeerConnection.prototype.setLocalDescription | undefined;
let origSetRemote: typeof RTCPeerConnection.prototype.setRemoteDescription | undefined;
let origGetUserMedia: typeof navigator.mediaDevices.getUserMedia | undefined;

export default definePlugin({
    name: "StereoMic",
    description: "Send mic audio at high bitrate via WebRTC SDP munge. Defaults tuned for GoXLR SM7B mono voice on Vesktop or web Discord.",
    authors: [{ name: "o9", id: 426687300387471360n }],
    settings,

    start() {
        const PC = RTCPeerConnection.prototype;
        origSetLocal = PC.setLocalDescription;
        origSetRemote = PC.setRemoteDescription;

        type SessionDesc = RTCSessionDescription | RTCLocalSessionDescriptionInit | RTCSessionDescriptionInit;

        const wrap = (orig: typeof origSetLocal, tag: string) =>
            function (this: RTCPeerConnection, desc?: SessionDesc, ...rest: unknown[]) {
                try {
                    if (desc && "sdp" in desc && desc.sdp) {
                        const sdp = mungeSdp(desc.sdp, tag);
                        desc = desc instanceof RTCSessionDescription
                            ? { type: desc.type, sdp }
                            : Object.assign({}, desc, { sdp });
                    }
                } catch (e) {
                    logger.warn("munge error", e);
                }
                return Reflect.apply(orig!, this, [desc, ...rest]);
            };

        PC.setLocalDescription = wrap(origSetLocal, "setLocalDescription") as typeof PC.setLocalDescription;
        PC.setRemoteDescription = wrap(origSetRemote, "setRemoteDescription") as typeof PC.setRemoteDescription;

        const md = navigator.mediaDevices;
        origGetUserMedia = md.getUserMedia.bind(md);
        md.getUserMedia = function (constraints?: MediaStreamConstraints) {
            if (constraints?.audio) {
                const a = typeof constraints.audio === "object" ? { ...constraints.audio } : {};
                const audio = a as MediaTrackConstraints;
                audio.channelCount = settings.store.channels;
                if (settings.store.disableProcessing) {
                    audio.echoCancellation = false;
                    audio.noiseSuppression = false;
                    audio.autoGainControl = false;
                }
                constraints = { ...constraints, audio };
            }
            return origGetUserMedia!(constraints);
        };

        logger.info(`active (${settings.store.channels}ch, ${settings.store.bitrate}kbps). Rejoin voice to apply.`);
    },

    stop() {
        if (origSetLocal) RTCPeerConnection.prototype.setLocalDescription = origSetLocal;
        if (origSetRemote) RTCPeerConnection.prototype.setRemoteDescription = origSetRemote;
        if (origGetUserMedia) navigator.mediaDevices.getUserMedia = origGetUserMedia;
        logger.info("stopped");
    },
});
