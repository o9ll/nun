/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Heading } from "@components/Heading";
import { Paragraph } from "@components/Paragraph";
import { Margins } from "@components/margins";

export default function BetterMicrophoneSettingsAbout() {
    return (
        <>
            <Heading className={Margins.bottom8} tag="h5">GoXLR MINI + SM7B + Cloudlifter</Heading>
            <Paragraph>
                Select the <strong>GoXLR SM7B</strong> profile for voice chat. The SM7B is mono, so channels stay at 1.
                Use <strong>GoXLR SM7B Max</strong> only on boosted servers where 320 kbps is worth the bandwidth.
            </Paragraph>
            <Paragraph className={Margins.top8}>
                In the GoXLR app: set mic type to <strong>Condenser</strong> (48V powers the Cloudlifter), gain around 28 to 35 dB,
                and keep SM7B rear switches flat. Discord input should be <strong>Chat Mic (TC-Helicon GoXLR Mini)</strong>.
            </Paragraph>
            <Paragraph className={Margins.top8}>
                Disable Krisp, echo cancellation, noise suppression, and auto gain in Discord voice settings.
                On desktop, pair this plugin with VoicePatcher. StereoMic is for Vesktop or web only.
            </Paragraph>
        </>
    );
}
