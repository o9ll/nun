import "@nu/styles/index.css";
import "@nu/polyfill";

import { loadModules } from "@nu/webpack/modules";
import { loadStores } from "@nu/webpack";
import DOMManager from "@nu/core/dommanager";
import Modals from "@nu/ui/modals";
import Toasts from "@nu/ui/toasts";
import NotificationUIInstance from "@nu/ui/notifications";
import { MenuPatcher } from "@nu/api/contextmenu";
import CommandManager from "@nu/core/commandmanager";
import NuApi from "@nu/api";
import PluginManager from "@nu/core/pluginmanager";
import PluginStore from "./core/pluginstore";
import { patchSettingsContextMenu } from "./core/contextmenu";

export function onInit() {
    Object.defineProperty(window, "NuApi", {
        value: NuApi,
        writable: false,
        configurable: false
    });
}

export function onDOMReady() {
    DOMManager.init();
}

export async function onWebpackReady() {
    loadStores();
    loadModules();
    MenuPatcher.initialize();
    Modals.makeStack();
    Toasts.initialize();
    NotificationUIInstance.initialize();
    CommandManager.initialize();
    PluginStore.init();
    patchSettingsContextMenu();

    await PluginManager.initialize();
    PluginManager.startPlugins("connection");
}