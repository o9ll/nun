/*
 * Nun, a Discord client mod
 * Copyright (c) 2026 o9
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import ContextMenuPatcher from "@nu/api/contextmenu";
import pluginmanager from "./pluginmanager";
import { openPluginModal } from "@components/settings/tabs/nuplugins/PluginModal";
import { useSettings } from "@api/Settings";
import { openPluginStore } from "@components/settings/tabs/nuplugins/Store";
import findInTree from "@nu/utils/findintree";

type ContextMenuType = ContextMenuPatcher & {
    Separator: any;
    CheckboxItem: any;
    RadioItem: any;
    ControlItem: any;
    Group: any;
    Item: any;
    Menu: any;
};

function usePluginToggles({ ContextMenu }: { ContextMenu: ContextMenuType; }) {
    const settings = useSettings([`nuplugins.*`]);

    const items = pluginmanager.addonList.map((plugin) => (
        <ContextMenu.CheckboxItem
            label={plugin.name}
            id={`plugin-${plugin.id}`}
            key={`plugin-${plugin.id}`}
            checked={settings.nuplugins[plugin.id] ?? false}
            action={(e: MouseEvent) => {
                if (!e.shiftKey) {
                    pluginmanager.toggle(plugin);
                    return;
                }

                e.preventDefault();
                if (!settings.nuplugins[plugin.id] || !plugin.instance?.getSettingsPanel) return;
                openPluginModal(plugin, true);
                ContextMenu.close();
            }}
        />
    ));

    items.push(
        <ContextMenu.Item
            label="View plugin store"
            id="no-plugins"
            key="no-plugins"
            action={openPluginStore}
        />
    );

    return items;
}

export function patchSettingsContextMenu() {
    const ContextMenu = new ContextMenuPatcher() as ContextMenuType;

    ContextMenu.patch("settings-menu", (retVal: any) => {
        const element = findInTree(retVal, (e) => e.key === "nu_plugins", { walkable: ["props", "children"] });
        if (!element) return;

        const pluginToggles = usePluginToggles({ ContextMenu });

        element.props.children = (
            <ContextMenu.Group key="nu-plugins-group">
                {pluginToggles}
            </ContextMenu.Group>
        );
    });
}