/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { showNotice } from "@api/Notices";
import { hasAnyVisibleSettings, isPluginEnabled, pluginRequiresRestart, startDependenciesRecursive, startPlugin, stopPlugin } from "@api/PluginManager";
import { Settings, useSettings } from "@api/Settings";
import { CogWheel, InfoIcon } from "@components/Icons";
import { AddonCard } from "@components/settings/AddonCard";
import { classNameFactory } from "@utils/css";
import { Logger } from "@utils/Logger";
import { NUNT } from "@utils/nunT";
import { Plugin } from "@utils/types";
import { React, showToast, Toasts } from "@webpack/common";

import { PluginMeta } from "~plugins";

import { openPluginModal } from "./PluginModal";

const logger = new Logger("PluginCard");
const cl = classNameFactory("vc-plugins-");
interface PluginCardProps extends React.HTMLProps<HTMLDivElement> {
    plugin: Plugin;
    disabled?: boolean;
    onRestartNeeded(name: string, key: string): void;
    isNew?: boolean;
    onMouseEnter?: React.MouseEventHandler<HTMLDivElement>;
    onMouseLeave?: React.MouseEventHandler<HTMLDivElement>;
}

const NUNPLUGIN = new Set([
    "NunAutoUpdater",
]);

const NUNICON = "data:image/png;base64,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";

export function PluginCard({ plugin, disabled, onRestartNeeded, onMouseEnter, onMouseLeave, isNew }: PluginCardProps) {
    useSettings(["plugins.Settings.nunM"]);
    const nunM = (Settings.plugins as any)?.Settings?.nunM ?? true;
    const displayDescription = (!nunM && NUNT[plugin.name]?.description)
        || plugin.description;

    const settings = Settings.plugins[plugin.name];
    const pluginMeta = PluginMeta[plugin.name];
    const folderName = pluginMeta?.folderName ?? "";
    const isEquicordPlugin = folderName.startsWith("src/equicordplugins/");
    const isVencordPlugin = folderName.startsWith("src/plugins/");
    const isUserPlugin = folderName.startsWith("src/userplugins/");
    const isModifiedPlugin = plugin.isModified ?? false;
    const isNunPlugin = NUNPLUGIN.has(plugin.name);
    const isNun = isNunPlugin || isUserPlugin;

    const isEnabled = () => isPluginEnabled(plugin.name);

    function toggleEnabled() {
        const wasEnabled = isEnabled();

        // If we're enabling a plugin, make sure all deps are enabled recursively.
        if (!wasEnabled) {
            const { restartNeeded, failures } = startDependenciesRecursive(plugin);

            if (failures.length) {
                logger.error(`Failed to start dependencies for ${plugin.name}: ${failures.join(", ")}`);
                showNotice("Failed to start dependencies: " + failures.join(", "), "Close", () => null);
                return;
            }

            if (restartNeeded) {
                // If any dependencies have patches, don't start the plugin yet.
                settings.enabled = true;
                onRestartNeeded(plugin.name, "enabled");
                return;
            }
        }

        // if the plugin requires a restart, don't use stopPlugin/startPlugin. Wait for restart to apply changes.
        if (pluginRequiresRestart(plugin)) {
            settings.enabled = !wasEnabled;
            onRestartNeeded(plugin.name, "enabled");
            return;
        }

        // If the plugin is enabled, but hasn't been started, then we can just toggle it off.
        if (wasEnabled && !plugin.started) {
            settings.enabled = !wasEnabled;
            return;
        }

        const result = wasEnabled ? stopPlugin(plugin) : startPlugin(plugin);

        if (!result) {
            settings.enabled = false;

            const msg = `Error while ${wasEnabled ? "stopping" : "starting"} plugin ${plugin.name}`;
            showToast(msg, Toasts.Type.FAILURE, {
                position: Toasts.Position.BOTTOM,
            });

            return;
        }

        settings.enabled = !wasEnabled;
    }

    const pluginInfo = [
        {
            condition: isModifiedPlugin,
            src: "https://equicord.org/assets/icons/equicord/modified.png",
            alt: "Modified",
            title: "Modified Vencord Plugin"
        },
        {
            condition: isNun,
            src: NUNICON,
            alt: "Nun",
            title: "Nun"
        },
        {
            condition: isEquicordPlugin,
            src: "https://equicord.org/assets/favicon.png",
            alt: "Equicord",
            title: "Equicord Plugin"
        },
        {
            condition: isVencordPlugin,
            src: "https://equicord.org/assets/icons/vencord/icon-light.png",
            alt: "Vencord",
            title: "Vencord Plugin"
        }
    ];

    const pluginDetails = pluginInfo.find(p => p.condition);

    const sourceBadge = pluginDetails ? (
        <img
            src={pluginDetails.src}
            alt={pluginDetails.alt}
            className={cl("source")}
        />
    ) : null;

    const tooltip = pluginDetails?.title || "Unknown Plugin";

    return (
        <AddonCard
            name={plugin.name}
            sourceBadge={sourceBadge}
            tooltip={tooltip}
            description={displayDescription}
            isNew={isNew}
            enabled={isEnabled()}
            setEnabled={toggleEnabled}
            disabled={disabled}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            infoButton={
                <button
                    role="switch"
                    onClick={() => openPluginModal(plugin, onRestartNeeded)}
                    className={cl("info-button")}
                >
                    {hasAnyVisibleSettings(plugin)
                        ? <CogWheel className={cl("info-icon")} />
                        : <InfoIcon className={cl("info-icon")} />
                    }
                </button>
            } />
    );
}
