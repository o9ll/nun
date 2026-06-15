/*
 * Nun, a Discord client mod
 * Copyright (c) 2026 o9
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { AddonCard } from "@components/settings/AddonCard";
import pluginmanager, { type NUPlugin } from "@nu/core/pluginmanager";
import { cl } from "../plugins";
import { CogWheel, DeleteIcon, InfoIcon } from "@components/Icons";
import { openPluginModal } from "./PluginModal";
import Modals from "@nu/ui/modals";
import { useSettings } from "@api/Settings";

export default function NUPluginCard({ plugin }: { plugin: NUPlugin; }) {
    const settings = useSettings([`nuplugins.${plugin.id}`]);
    const enabled = settings.nuplugins[plugin.id] ?? false;

    const trySetEnabled = (enabled: boolean) => {
        if (enabled) pluginmanager.enable(plugin);
        else pluginmanager.disable(plugin);
    };

    const deletePlugin = () => {
        Modals.showConfirmationModal("Deletion confirmation", `Are you sure you want to delete ${plugin.name}?`, {
            onConfirm: () => pluginmanager.deletePlugin(plugin, true)
        });
    };

    return (
        <AddonCard
            name={plugin.name}
            description={plugin.description}
            enabled={enabled}
            setEnabled={trySetEnabled}
            infoButton={
                <>
                    <button
                        onClick={() => deletePlugin()}
                        className={cl("info-button")}
                    >
                        <DeleteIcon className={cl("info-icon")} />
                    </button>
                    <button
                        role="switch"
                        onClick={() => openPluginModal(plugin, enabled)}
                        className={cl("info-button")}
                    >
                        {plugin?.instance?.getSettingsPanel && enabled
                            ? <CogWheel className={cl("info-icon")} />
                            : <InfoIcon className={cl("info-icon")} />
                        }
                    </button>
                </>
            }
        />
    );
}