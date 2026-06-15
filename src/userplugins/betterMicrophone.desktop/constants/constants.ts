/*
 * Nun, a Discord client mod
 * Copyright (c) 2026 o9
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { types } from "../../philsPluginLibrary";

export const PluginInfo = {
    PLUGIN_NAME: "BetterMicrophone",
    DESCRIPTION: "This plugin allows you to further customize your microphone.",
    AUTHOR: {
        name: "o9",
        id: 426687300387471360n,
        github: "https://github.com/o9ll"
    },
    CONTRIBUTORS: {
        o9: {
            github: "https://github.com/o9ll",
            id: 1146203933811953713n,
            name: "o9"
        }
    },
} as const satisfies types.PluginInfo;
