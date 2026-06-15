/*
 * Nun, a Discord client mod
 * Copyright (c) 2026 o9
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Heading } from "@components/Heading";
import { Paragraph } from "@components/Paragraph";
import { Margins } from "@components/margins";

export default function BetterMicrophoneSettingsAbout() {
    return (
        <>
            <Heading className={Margins.bottom8} tag="h5">Setup</Heading>
            <Paragraph>
                Enable <strong>VoicePatcher</strong> and use the <strong>2Ch 512kbps 48kHz Stereo</strong> profile.
            </Paragraph>
            <Paragraph className={Margins.top8}>
                In Windows sound settings, set your mic to <strong>2 channel, 24 bit, 48000 Hz</strong>.
            </Paragraph>
            <Paragraph className={Margins.top8}>
                Disable Krisp, echo cancellation, noise suppression, and auto gain in Discord voice settings and in this plugin.
            </Paragraph>
            <Paragraph className={Margins.top8}>
                StereoMic, Micquality, LightcordBitrate, ForceStereo, rzStudioAudio, and VoiceSettings are merged here.
            </Paragraph>
        </>
    );
}
