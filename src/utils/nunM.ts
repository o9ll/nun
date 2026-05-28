/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Settings } from "@api/Settings";

export function isNunMode(): boolean {
    const pluginSettings = Settings.plugins as Record<string, Record<string, unknown>>;
    return pluginSettings?.Settings?.nunM === true;
}

/**
 * Returns `ar` when Nun mode is on, `en` otherwise.
 * Use as a getter in definePlugin / definePluginSettings so the value
 * is evaluated lazily at render time rather than at module load time.
 *
 * @example
 *   get description() { return t("وصف عربي", "English description"); }
 */
export function t(ar: string, en: string): string {
    return isNunMode() ? ar : en;
}
