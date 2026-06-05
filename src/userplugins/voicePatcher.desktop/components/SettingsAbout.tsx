/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Heading } from "@components/Heading";
import { Paragraph } from "@components/Paragraph";
import { Margins } from "@components/margins";

export default function VoicePatcherSettingsAbout() {
    return (
        <>
            <Heading className={Margins.bottom8} tag="h5">GoXLR MINI + SM7B stack</Heading>
            <Paragraph>
                Keep all default patches enabled. This unlocks stereo and high bitrate in discord_voice.node.
                Pair with BetterMicrophone using the GoXLR SM7B profile (mono, 160 kbps, 48 kHz).
            </Paragraph>
            <Paragraph className={Margins.top8}>
                Hardware chain: SM7B → Cloudlifter CL-1 → GoXLR MINI XLR input.
                GoXLR app: Condenser mode, gain ~28 to 35 dB. Discord input: Chat Mic (TC-Helicon GoXLR Mini).
            </Paragraph>
            <Paragraph className={Margins.top8}>
                Disable Krisp and all Discord audio processing so GoXLR gate, compressor, and EQ stay intact.
                StereoMic is not needed on desktop Discord. Use StereoScreenshareAudio only on Vesktop for stream listening.
            </Paragraph>
        </>
    );
}
