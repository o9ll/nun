/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import definePlugin from "@utils/types";

const BITRATE = 320000; // Opus avg bitrate (music-grade). Max 510000.

function mungeSdp(sdp: string, tag: string): string {
    if (!sdp || !/opus/i.test(sdp)) return sdp;
    const rtpmap = sdp.match(/a=rtpmap:(\d+)\s+opus\/48000\/2/i);
    if (!rtpmap) return sdp;
    const pt = rtpmap[1];
    const lines = sdp.split(/\r?\n/);
    let touched = false;
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith(`a=fmtp:${pt} `)) {
            let p = lines[i].slice(`a=fmtp:${pt} `.length);
            const set = (k: string, v: number) => {
                const re = new RegExp(`${k}=[^;]*`);
                p = re.test(p) ? p.replace(re, `${k}=${v}`) : `${p};${k}=${v}`;
            };
            set("stereo", 1);
            set("sprop-stereo", 1);
            set("maxaveragebitrate", BITRATE);
            lines[i] = `a=fmtp:${pt} ${p}`;
            touched = true;
        }
    }
    if (touched) console.log(`[StereoMic] munged ${tag} (pt ${pt})`);
    return lines.join("\r\n");
}

let origSetLocal: typeof RTCPeerConnection.prototype.setLocalDescription | undefined;
let origSetRemote: typeof RTCPeerConnection.prototype.setRemoteDescription | undefined;
let origGetUserMedia: typeof navigator.mediaDevices.getUserMedia | undefined;

export default definePlugin({
    name: "StereoMic",
    description: "Send your mic/virtual input to a voice channel in true stereo at high bitrate (Opus SDP munge of local+remote descriptions + 2-channel unprocessed capture). For Vesktop / web Discord on macOS & Linux.",
    authors: [{ name: "ganten", id: 0n }],

    start() {
        const PC = RTCPeerConnection.prototype;
        origSetLocal = PC.setLocalDescription;
        origSetRemote = PC.setRemoteDescription;

        const wrap = (orig: any, tag: string) =>
            function (this: RTCPeerConnection, desc?: any, ...rest: any[]) {
                try {
                    if (desc && desc.sdp) {
                        const sdp = mungeSdp(desc.sdp, tag);
                        desc = typeof desc.toJSON === "function"
                            ? { type: desc.type, sdp }
                            : Object.assign({}, desc, { sdp });
                    }
                } catch (e) {
                    console.warn("[StereoMic] munge error", e);
                }
                return orig.call(this, desc, ...rest);
            };

        PC.setLocalDescription = wrap(origSetLocal, "setLocalDescription");
        PC.setRemoteDescription = wrap(origSetRemote, "setRemoteDescription");

        const md = navigator.mediaDevices;
        origGetUserMedia = md.getUserMedia.bind(md);
        md.getUserMedia = function (constraints?: MediaStreamConstraints) {
            if (constraints && constraints.audio) {
                const a = typeof constraints.audio === "object" ? { ...constraints.audio } : {};
                (a as any).channelCount = 2;
                (a as any).echoCancellation = false;
                (a as any).noiseSuppression = false;
                (a as any).autoGainControl = false;
                constraints = { ...constraints, audio: a };
            }
            return origGetUserMedia!(constraints);
        };

        console.log("[StereoMic] active — (re)join voice to apply. Feed a stereo source into your input device.");
    },

    stop() {
        if (origSetLocal) RTCPeerConnection.prototype.setLocalDescription = origSetLocal;
        if (origSetRemote) RTCPeerConnection.prototype.setRemoteDescription = origSetRemote;
        if (origGetUserMedia) navigator.mediaDevices.getUserMedia = origGetUserMedia;
        console.log("[StereoMic] stopped.");
    },
});
