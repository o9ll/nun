/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { OptionType } from "@utils/types";

export const settings = definePluginSettings({
    maxHistorySize: {
        type: OptionType.NUMBER,
        default: 2048,
        description: "Max history size. Maximum number of voice states to keep in database."
    },
    voiceLogSize: {
        type: OptionType.NUMBER,
        default: 128,
        description: "Voice log visual size. Number of voice logs to show in the modal."
    }
});
