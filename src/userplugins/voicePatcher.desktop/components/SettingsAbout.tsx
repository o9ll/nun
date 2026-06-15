/*
 * Nun, a Discord client mod
 * Copyright (c) 2026 o9
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Heading } from "@components/Heading";
import { Paragraph } from "@components/Paragraph";
import { Margins } from "@components/margins";

export default function VoicePatcherSettingsAbout() {
    return (
        <>
            <Heading className={Margins.bottom8} tag="h5">Setup</Heading>
            <Paragraph>
                1. Unlock stereo and high bitrate.
                2. Profile stereo + 512 kbps + 48 kHz.
            </Paragraph>
            <Paragraph className={Margins.top8}>
                3. Mic → Cloudlifter → Mixer input.
                4. Mic Condenser + Gain 28 to 35 dB.
            </Paragraph>
            <Paragraph className={Margins.top8}>
                5. Disable Krisp.
                6. Disable all audio processing.
            </Paragraph>
        </>
    );
}
