/*
 * Nun, a Discord client mod
 * Copyright (c) 2026 o9
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import Store from "@nu/stores/base";

export default abstract class AddonManager extends Store {
    abstract addonFolder: string;
    public addonList: any[] = [];

    isEnabled(idOrFile: string) { return false; }
    enableAddon(idOrAddon: string) { }
    disableAddon(idOrAddon: string) { }
    toggleAddon(idOrAddon: string) { }
    reloadAddon(idOrFileOrAddon: string) { }
    getAddon(idOrFile: string) { }
}