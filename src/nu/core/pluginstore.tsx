/*
 * Nun, a Discord client mod
 * Copyright (c) 2026 o9
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Logger } from "@utils/Logger";
import toasts from "@nu/stores/toasts";
import { NuWebAddon } from "@nu/types/addonstore";
import pluginmanager from "./pluginmanager";
import { comparator, regex as semverRegex } from "@nu/structs/semver";
import Notifications from "@nu/ui/notifications";
import { React } from "@webpack/common";
import { NULogo } from "@nu/ui/icons";
import fetch from "@nu/api/fetch";

const logger = new Logger("PluginStore", "#3E82E5", "Nun");

export default class PluginStore {
    static url = "https://api.betterdiscord.app/v3/store/plugins";
    static plugins: Record<string, NuWebAddon> = {};

    static async init() {
        await this.fetchAndUpdate();

        const interval = 1000 * 60 * 60 * 5; // 5 hours
        setInterval(() => this.fetchAndUpdate(), interval);
    }

    static async fetchAndUpdate() {
        try {
            const plugins: NuWebAddon[] = await this.fetchStore();
            logger.info(`Fetched ${plugins.length} plugins from store`);

            this.plugins = {};
            for (const plugin of plugins) {
                this.plugins[plugin.file_name] = plugin;
            }
        } catch (e) {
            toasts.show("Failed to get BetterDiscord plugin updates", { type: "error", timeout: 5000 });
            logger.error("Failed to fetch plugin list", e);
            return;
        }

        await pluginmanager.initialized;
        this.checkUpdates();
    }

    static async fetchStore() {
        const res: any = await fetch(this.url);
        return res.json();
    }

    static checkUpdates() {
        const updatable: string[] = [];

        for (const plugin of pluginmanager.addonList) {
            const storePlugin = this.plugins[plugin.filename];
            if (!storePlugin) continue;

            // Check if a new version is available
            if (!semverRegex.test(storePlugin.version) || !semverRegex.test(plugin.version)) continue;
            const comparison = comparator(plugin.version, storePlugin.version);
            if (comparison !== 1) continue;

            updatable.push(plugin.filename);
        }

        if (updatable.length === 0) return;

        // Show a toast asking the user to update
        const message = updatable.length === 1 ? "One plugin has an update!" : `${updatable.length} plugins have updates!`;
        Notifications.show({
            id: "plugin-updates",
            title: "BetterDiscord Plugin Updater",
            content: [
                message,
                <ul key="updates" className="notification-updates-list">
                    {updatable.map(filename =>
                        <li key={filename}>
                            {this.plugins[filename].name}
                            {" "}
                            <i>({this.plugins[filename].version})</i>
                        </li>
                    )}
                </ul>
            ],
            type: "info",
            icon: () => <NULogo accent={true} />,
            duration: Infinity,
            actions: [
                {
                    label: "Update All!",
                    onClick: () => this.applyUpdates(updatable)
                }
            ]
        });
    }

    static async applyUpdates(filenames: string[]) {
        await Promise.all(filenames.map((name) => this.applyUpdate(name)));
    }

    static async applyUpdate(filename: string) {
        const info = this.plugins[filename];
        if (!info) return;

        try {
            const res: any = await fetch(info.latest_source_url, {
                headers: {
                    "Cache-Control": "no-cache",
                    "Pragma": "no-cache"
                }
            });
            const code: string = await res.text();

            const plugin = pluginmanager.getAddon(filename);
            if (!plugin) return;

            pluginmanager.updatePlugin(plugin, {
                added: plugin.added,
                modified: Date.now(),
                file: filename,
                code,
                size: code.length // Technically an approximation but whatever
            }, true);

            logger.info(`Updated plugin ${info.name} to version ${info.version}`);
        } catch (e) {
            logger.error(`Failed to update plugin ${filename}`, e);
            toasts.show(`Failed to update plugin ${info.name}`, { type: "error", timeout: 5000 });
        }
    }
}