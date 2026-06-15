/*
 * Nun, a Discord client mod
 * Copyright (c) 2026 o9
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import NULogger from "../core/logger";

import PluginManager from "../core/pluginmanager";
import ThemeManager from "../core/thememanager";
import DiscordModules from "../webpack/modules";
import { React } from "@webpack/common";

import AddonAPI from "./addonapi";
import Data from "./data";
import DOM from "./dom";
import Patcher from "./patcher";
import ReactUtils from "./reactutils";
import UI from "./ui";
import Utils from "./utils";
import Webpack from "./webpack";
import ContextMenu from "./contextmenu";
import fetch from "./fetch";
import Logger from "./logger";
import CommandAPI from "./commands";
import Hooks from "./hooks";

import ColorInput from "../ui/settings/components/color";
import DropdownInput from "../ui/settings/components/dropdown";
import SettingItem from "../ui/settings/components/item";
import KeybindInput from "../ui/settings/components/keybind";
import NumberInput from "../ui/settings/components/number";
import RadioInput from "../ui/settings/components/radio";
import SearchInput from "../ui/settings/components/search";
import SliderInput from "../ui/settings/components/slider";
import SwitchInput from "../ui/settings/components/switch";
import TextInput from "../ui/settings/components/textbox";
import SettingGroup from "../ui/settings/group";
import ErrorBoundary from "../ui/errorboundary";
import Text from "../ui/base/text";
import Flex from "../ui/base/flex";
import Button from "../ui/base/button";
import Spinner from "../ui/spinner";


const bounded = new Map();
const PluginAPI = new AddonAPI(PluginManager);
const ThemeAPI = new AddonAPI(ThemeManager);
const PatcherAPI = new Patcher<false>();
const DataAPI = new Data<false>();
const DOMAPI = new DOM<false>();
const ContextMenuAPI = new ContextMenu();
const CommandsAPI = new CommandAPI<false>();
const HooksAPI = new Hooks();
const DefaultLogger = new Logger<false>();

/**
 * `Components` is a namespace holding a series of React components. It is available under {@link NuApi}.
 * @summary {@link Components} a namespace holding a series of React components
 * @name Components
 */
const Components = {
    get Tooltip() { return DiscordModules.Tooltip; },
    get ColorInput() { return ColorInput; },
    get DropdownInput() { return DropdownInput; },
    get SettingItem() { return SettingItem; },
    get KeybindInput() { return KeybindInput; },
    get NumberInput() { return NumberInput; },
    get RadioInput() { return RadioInput; },
    get SearchInput() { return SearchInput; },
    get SliderInput() { return SliderInput; },
    get SwitchInput() { return SwitchInput; },
    get TextInput() { return TextInput; },
    get SettingGroup() { return SettingGroup; },
    get ErrorBoundary() { return ErrorBoundary; },
    get Text() { return Text; },
    get Flex() { return Flex; },
    get Button() { return Button; },
    get Spinner() { return Spinner; },
};

/**
 * A reference string for NU's version.
 * @type string
 * @memberof NuApi
 */
const version: string = "1.13.4";

/**
 * `NuApi` is a globally (`window.NuApi`) accessible object for use by plugins and developers to make their lives easier.
 * @name NuApi
 */
export default class NuApi {
    Patcher: Patcher<true> = PatcherAPI as Patcher<true>;
    Data: Data<true> = DataAPI as Data<true>;
    DOM: DOM<true> = DOMAPI as DOM<true>;
    Logger: Logger<true> = DefaultLogger as Logger<true>;
    Commands: CommandAPI<true> = CommandsAPI as unknown as CommandAPI<true>;
    get React() { return React; };
    get ReactDOM() { return DiscordModules.ReactDOM; };
    version = version;

    static Patcher: Patcher<false>;
    static Data: Data<false>;
    static DOM: DOM<false>;
    static Logger: Logger<false>;
    static Commands: CommandAPI<false>;
    static Hooks: Hooks;
    static get React() { return React; };
    static get ReactDOM() { return DiscordModules.ReactDOM; };
    static version = version;

    static Plugins: AddonAPI;
    static Themes: AddonAPI;
    static Webpack: typeof Webpack;
    static UI: typeof UI;
    static ReactUtils: typeof ReactUtils;
    static Utils: typeof Utils;
    static ContextMenu: ContextMenu;
    static Components: typeof Components;
    static Net: { fetch: typeof fetch; };

    constructor(pluginName: string) {
        // @ts-expect-error nu
        if (!pluginName) return NuApi;
        if (bounded.has(pluginName)) return bounded.get(pluginName);
        if (typeof (pluginName) !== "string") {
            NULogger.error("NuApi", "Plugin name not a string, returning generic API!");
            // @ts-expect-error nu
            return NuApi;
        }

        // Bind to pluginName
        this.Patcher = new Patcher(pluginName);
        this.Data = new Data(pluginName);
        this.DOM = new DOM(pluginName);
        this.Logger = new Logger(pluginName);
        this.Commands = new CommandAPI(pluginName);
        // @ts-expect-error nu
        this.Hooks = new Hooks(pluginName);

        bounded.set(pluginName, this);
    }

    // Non-bound namespaces
    get Plugins() { return PluginAPI; }
    get Themes() { return ThemeAPI; }
    get Webpack() { return Webpack; }
    get Utils() { return Utils; }
    get UI() { return UI; }
    get ReactUtils() { return ReactUtils; }
    get ContextMenu() { return ContextMenuAPI; }
    get Components() { return Components; }
    Net = { fetch };
}

/**
 * An instance of {@link AddonAPI} to access plugins.
 * @type AddonAPI
 */
NuApi.Plugins = PluginAPI;

/**
 * An instance of {@link AddonAPI} to access themes.
 * @type AddonAPI
 */
NuApi.Themes = ThemeAPI;

/**
 * An instance of {@link Patcher} to monkey patch functions.
 * @type Patcher
 */
NuApi.Patcher = PatcherAPI;

/**
 * An instance of {@link Webpack} to search for modules.
 * @type Webpack
 */
NuApi.Webpack = Webpack;

/**
 * An instance of {@link Data} to manage data.
 * @type Data
 */
NuApi.Data = DataAPI;

/**
 * An instance of {@link UI} to create interfaces.
 * @type UI
 */
NuApi.UI = UI;

/**
 * An instance of {@link ReactUtils} to work with React.
 * @type ReactUtils
 */
NuApi.ReactUtils = ReactUtils;

/**
 * An instance of {@link Utils} for general utility functions.
 * @type Utils
 */
NuApi.Utils = Utils;

/**
 * An instance of {@link DOM} to interact with the DOM.
 * @type DOM
 */
NuApi.DOM = DOMAPI;

/**
 * An instance of {@link ContextMenu} for interacting with context menus.
 * @type ContextMenu
 */
NuApi.ContextMenu = ContextMenuAPI;

/**
 * An set of react components plugins can make use of.
 * @type Components
 */
NuApi.Components = Components;

/**
 * An instance of {@link CommandAPI} for adding slash commands.
 * @type CommandAPI
 */
NuApi.Commands = CommandsAPI;

/**
 * An instance of {@link Net} for using network related tools.
 * @type Net
 */
NuApi.Net = { fetch };

/**
 * An instance of {@link Logger} for logging information.
 * @type Logger
 */
NuApi.Logger = DefaultLogger;

/**
 * An instance of {@link Hooks} for react hooks.
 * @type Hooks
 */
NuApi.Hooks = HooksAPI;

Object.freeze(NuApi);
Object.freeze(NuApi.Net);
Object.freeze(NuApi.prototype);
Object.freeze(NuApi.Components);