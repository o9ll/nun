/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import definePlugin, { OptionType } from "@utils/types";
import { findByProps, findExportedComponentLazy } from "@webpack";
import { ApplicationCommandInputType } from "@api/Commands";
import { NunDevs } from "@utils/constants";

// --- Lazy Loaders ---
const getGlobals = () => (window as any).Equicord || (window as any).Vencord;
const FolderPlusIcon = findExportedComponentLazy("FolderPlusIcon");

// --- The Browse Component ---
const BrowseComponent = () => {
    // 1. Safe Imports
    const React = findByProps("createElement", "useState") || window.React;
    const ButtonModule = findByProps("Button", "Sizes", "Colors") || findByProps("Button", "Hover");
    const FlexModule = findByProps("Flex");
    const ToastModule = findByProps("showToast");

    // 2. Fallbacks
    const Button = ButtonModule?.default || ButtonModule?.Button || "button";
    const Flex = FlexModule?.Flex || "div";

    // 3. Browse Logic
    const handleBrowse = () => {
        const input = document.createElement("input");
        input.style.display = "none";
        input.type = "file";
        input.setAttribute("webkitdirectory", "true");
        input.setAttribute("directory", "true");

        document.body.appendChild(input);

        input.onchange = (e) => {
            const files = (e.target as HTMLInputElement).files;
            if (files && files.length > 0) {
                const selectedFile = files[0] as any;
                if (selectedFile.path) {
                    const globals = getGlobals();
                    if (!globals.Settings.plugins["OpenPluginsFolder"]) {
                        globals.Settings.plugins["OpenPluginsFolder"] = {};
                    }

                    // Update Setting
                    globals.Settings.plugins["OpenPluginsFolder"].targetPath = selectedFile.path;
                    if (globals.Settings.save) globals.Settings.save();

                    if (ToastModule) {
                        ToastModule.showToast(ToastModule.createToast(`Path Saved: ${selectedFile.path}`, 1));
                    }
                }
            }
            document.body.removeChild(input);
        };

        input.click();
    };

    // 4. Render
    const fallbackStyle = typeof Button === "string" ? {
        backgroundColor: "#5865F2",
        color: "white",
        border: "none",
        padding: "8px 16px",
        borderRadius: "3px",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: "8px"
    } : { display: "flex", gap: "8px", alignItems: "center" };

    return (
        <Flex style={{ marginTop: "10px" }}>
            <Button
                size={ButtonModule?.Sizes?.SMALL || "small"}
                color={ButtonModule?.Colors?.PRIMARY || "brand"}
                onClick={handleBrowse}
                style={fallbackStyle}
            >
                <React.Suspense fallback={<span>📂</span>}>
                    {FolderPlusIcon && <FolderPlusIcon width={18} height={18} />}
                </React.Suspense>
                Browse Folder
            </Button>
        </Flex>
    );
};

export default definePlugin({
    name: "OpenPluginsFolder",
    description: "Opens the configured folder",
    authors: [NunDevs.o9],

    options: {
        targetPath: {
            type: OptionType.STRING,
            description: "Target Path",
            default: ""
        },
        browseAction: {
            type: OptionType.COMPONENT,
            description: "Actions",
            component: BrowseComponent
        }
    },

    commands: [
        {
            inputType: ApplicationCommandInputType.BUILT_IN,
            name: "openfolder",
            description: "Opens the configured folder",
            options: [],
            execute: async (args, ctx) => {
                try {
                    const globals = getGlobals();
                    const myPath = globals?.Settings?.plugins?.["OpenPluginsFolder"]?.targetPath;

                    if (!myPath) {
                         alert("⚠️ Path is missing in Settings! Please set it.");
                         return;
                    }
                    const Native = (window as any).DiscordNative;
                    if (Native?.fileManager?.openPath) {
                        Native.fileManager.openPath(myPath);
                        return; // Success! Stop here.
                    }
                    if (Native?.fileManager?.showItemInFolder) {
                        Native.fileManager.showItemInFolder(myPath);
                        return; // Success! Stop here.
                    }
                    try {
                        const ElectronModule = findByProps("openPath") || findByProps("openExternal");
                        if (ElectronModule && ElectronModule.openPath) {
                            await ElectronModule.openPath(myPath);
                            return;
                        }
                    } catch (err) {
                        console.warn("[OpenPluginsFolder] Legacy Webpack search failed, ignoring...");
                    }

                    alert("❌ Error: Could not find a way to open folders on this version of Discord/Equicord.");

                } catch (err) {
                    console.error(err);
                    alert(`❌ Unexpected Crash: ${err}`);
                }
            }
        },
        {
            inputType: ApplicationCommandInputType.BUILT_IN,
            name: "setfolder",
            description: "Set the folder path",
            options: [
                {
                    type: 3,
                    name: "path",
                    description: "The full path to the folder",
                    required: true
                }
            ],
            execute: async (args, ctx) => {
                const newPath = args[0].value;
                const globals = getGlobals();
                if (!globals.Settings.plugins["OpenPluginsFolder"]) globals.Settings.plugins["OpenPluginsFolder"] = {};

                globals.Settings.plugins["OpenPluginsFolder"].targetPath = newPath;
                if (globals.Settings.save) globals.Settings.save();

                const ToastModule = findByProps("showToast");
                if (ToastModule) ToastModule.showToast(ToastModule.createToast(`Path set to: ${newPath}`, 1));
            }
        }
    ]

});

