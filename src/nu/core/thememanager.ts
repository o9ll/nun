/*
 * Nun, a Discord client mod
 * Copyright (c) 2026 o9
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import AddonManager from "./addonmanager";
import { NU_THEMES_DIR } from "@nu/consts";

export default new class ThemeManager extends AddonManager {
    addonFolder = NU_THEMES_DIR;
};