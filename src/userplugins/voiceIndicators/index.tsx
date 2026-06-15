/*
 * Nun, a Discord client mod
 * Copyright (c) 2026 o9
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./style.css";

import definePlugin from "@utils/types";

import { reportKnownVoiceStatesSoon, reportVoiceStates, stopClient } from "./client";
import { VoiceIndicator } from "./components";
import { settings } from "./settings";

export default definePlugin({
    name: "VoiceIndicators",
    description: "Shows a crowd-sourced indicator when a user is in a voice channel, pulled from online services instead of your local client. Click it to see who they are with.",
    authors: [{ name: "o9", id: 426687300387471360n }],
    tags: ["Nun"],
    dependencies: ["OnlineServicesAPI", "NunServicesAPI", "MemberListDecoratorsAPI", "MessageDecorationsAPI", "NicknameIconsAPI"],
    settings,

    flux: {
        READY_SUPPLEMENTAL() {
            reportKnownVoiceStatesSoon();
        },
        VOICE_STATE_UPDATES({ voiceStates }) {
            reportVoiceStates(voiceStates);
        },
    },

    renderNicknameIcon({ userId }) {
        if (!settings.store.showInProfile) return null;
        return <VoiceIndicator userId={userId} isProfile />;
    },
    renderMemberListDecorator({ user }) {
        if (!settings.store.showInMemberList || user == null) return null;
        return <VoiceIndicator userId={user.id} />;
    },
    renderMessageDecoration({ message }) {
        if (!settings.store.showInMessages || message?.author == null) return null;
        return <VoiceIndicator userId={message.author.id} isMessageIndicator />;
    },

    patches: [
        {
            find: "null!=this.peopleListItemRef.current",
            replacement: {
                match: /\.isProvisional.{0,50}?className:\i\.\i,children:\[(?<=isFocused:(\i).+?)/,
                replace: "$&$self.VoiceIndicator({userId:this?.props?.user?.id,isActionButton:true,shouldHighlight:$1}),"
            },
            predicate: () => settings.store.showInMemberList
        }
    ],

    stop() {
        stopClient();
    },

    VoiceIndicator,
});
