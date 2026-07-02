#!/usr/bin/env node
/*
 * Nun, a Discord client mod
 * Copyright (c) 2026 Nun contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { copyFileSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";

const equilotlDir = process.argv[2];
const assetsDir = process.argv[3];

if (!equilotlDir) {
    console.error("Usage: patchEquilotlBranding.mjs <equilotl-dir> [assets-dir]");
    process.exit(1);
}

function read(relativePath) {
    return readFileSync(join(equilotlDir, relativePath), "utf8");
}

function write(relativePath, contents) {
    writeFileSync(join(equilotlDir, relativePath), contents);
}

function walkGoFiles(dir) {
    const entries = [];
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const path = join(dir, entry.name);
        if (entry.isDirectory()) {
            entries.push(...walkGoFiles(path));
        } else if (entry.isFile() && entry.name.endsWith(".go")) {
            entries.push(path);
        }
    }
    return entries;
}

// Keep upstream URL remaps as the baseline transformation.
const urlReplacements = {
    "https://api.github.com/repos/Equicord/Equicord/releases/latest": "https://api.github.com/repos/o9ll/nun/releases/latest",
    "https://equicord.org/releases/equicord": "https://github.com/o9ll/nun/releases/latest/download/latest.json",
    "https://api.github.com/repos/Equicord/Equilotl/releases/latest": "https://api.github.com/repos/o9ll/nun/releases/latest",
    "https://equicord.org/releases/equilotl": "https://github.com/o9ll/nun/releases/latest/download/latest.json",
    "https://github.com/Equicord/Equilotl/releases/latest/download/": "https://github.com/o9ll/nun/releases/latest/download/",
    "https://github.com/Equicord/Equilotl": "https://github.com/o9ll/nun"
};

const productNameReplacements = {
    // Installer asset names.
    "Equilotl.exe": "NunInstaller.exe",
    "EquilotlCli.exe": "NunInstallerCli.exe",
    "Equilotl-x11": "Nun-x11",
    "EquilotlCli-linux": "NunCli-linux",
    "Equilotl-darwin-x64.zip": "Nun-darwin-x64.zip",
    "Equilotl-darwin-arm64.zip": "Nun-darwin-arm64.zip",
    "EquilotlCli-darwin-x64": "NunCli-darwin-x64",
    "EquilotlCli-darwin-arm64": "NunCli-darwin-arm64",
    "Equilotl.app": "NunInstaller.app",
    "EquilotlUpdate": "NunInstallerUpdate",
    // Visible installer product text.
    "\"Equilotl/\"": "\"NunInstaller/\"",
    "\"Equilotl\"": "\"NunInstaller\"",
    "Equilotl Version": "NunInstaller Version",
    "Equilotl Cli": "NunInstaller Cli",
    "Update Equilotl": "Update NunInstaller",
    "Equilotl was run": "NunInstaller was run",
    "Equilotl must not be run": "NunInstaller must not be run"
};

const installedModReplacements = {
    // User-facing references to the mod being installed.
    "Install Equicord": "Install Nun",
    "Repair Equicord": "Repair Nun",
    "Uninstall Equicord": "Uninstall Nun",
    "Downloading latest Equicord files": "Downloading latest Nun files",
    "Otherwise, Equicord will likely not work": "Otherwise, Nun will likely not work",
    "Failed to install the latest Equicord builds from GitHub": "Failed to install the latest Nun builds from GitHub",
    "**Github** and **equicord.org** are the only official places to get Equicord": "**Github** is the only official place to get Nun",
    "Reinstall & Update Equicord": "Reinstall & Update Nun",
    "verify Equicord installed successfully": "verify Nun installed successfully",
    "otherwise Equicord will likely not work": "otherwise Nun will likely not work",
    "Equicord is in no way affiliated with OpenAsar": "Nun is in no way affiliated with OpenAsar",
    "Equicord will be downloaded to": "Nun will be downloaded to",
    "Local Equicord Version": "Local Nun Version",
    "Not updating Equicord due to being in DevMode": "Not updating Nun due to being in DevMode",
    "Latest Equicord Version": "Latest Nun Version"
};

const systemReplacements = {
    // Environment variables and on-disk paths the installer uses.
    "EQUICORD_USER_DATA_DIR": "NUN_USER_DATA_DIR",
    "EQUICORD_DIRECTORY": "NUN_DIRECTORY",
    "EQUICORD_DEV_INSTALL": "NUN_DEV_INSTALL",
    "EquicordData": "NunData",
    'appdir.New("Equicord")': 'appdir.New("Nun")',
    "equicord.asar": "nun.asar",
    '`// Equicord (\\w+)`': '`// Nun (\\w+)`',
    "Found existing Equicord Install": "Found existing Nun Install",
    "non-Equicord app.asar": "non-Nun app.asar",
    "Using DISCORD_USER_DATA_DIR/../EquicordData": "Using DISCORD_USER_DATA_DIR/../NunData",
    // Internal identifiers that surface in logs/errors pointing to the mod path.
    "EquicordDirectory": "NunDirectory",
    "EquicordFile": "NunFile",
    "equicordAsarPath": "nUnAsarPath",
    "isEquicordLoaderAppAsar": "isNunLoaderAppAsar"
};

const goReplacements = {
    ...urlReplacements,
    ...productNameReplacements,
    ...installedModReplacements,
    ...systemReplacements
};

for (const path of walkGoFiles(equilotlDir)) {
    const relativePath = path.slice(equilotlDir.length + 1);
    let text = readFileSync(path, "utf8");
    const before = text;
    for (const [old, replacement] of Object.entries(goReplacements)) {
        text = text.split(old).join(replacement);
    }
    if (text !== before) {
        writeFileSync(path, text);
        console.log(`Patched ${relativePath}`);
    }
}

if (assetsDir) {
    const pngPath = join(assetsDir, "nun-symbol-dark-256.png");
    const icoPath = join(assetsDir, "nun-symbol-dark.ico");
    const icnsPath = join(assetsDir, "nun-symbol-dark.icns");

    try {
        copyFileSync(pngPath, join(equilotlDir, "winres", "icon.png"));
        copyFileSync(icoPath, join(equilotlDir, "winres", "icon.ico"));
        console.log("Replaced Windows icon resources");
    } catch (err) {
        console.warn("Could not replace Windows icon resources:", err.message);
    }

    try {
        copyFileSync(icnsPath, join(equilotlDir, "macos", "icon.icns"));
        console.log("Replaced macOS icon resources");
    } catch (err) {
        console.warn("Could not replace macOS icon resources:", err.message);
    }

    try {
        let winres = read("winres/winres.json");
        winres = winres.replace("An Installer for the Equicord Discord Mod", "An Installer for the Nun Discord Mod");
        winres = winres.replace("\"CompanyName\": \"Equicord\"", "\"CompanyName\": \"Nun\"");
        winres = winres.replace(/Equilotl/g, "NunInstaller");
        write("winres/winres.json", winres);
        console.log("Patched Windows resource manifest metadata");
    } catch (err) {
        console.warn("Could not patch winres.json:", err.message);
    }

    try {
        let plist = read("macos/Info.plist");
        plist = plist.replace("<string>Equilotl</string>", "<string>NunInstaller</string>");
        plist = plist.replace("<string>org.equicord.equilotl</string>", "<string>org.nun.nuninstaller</string>");
        write("macos/Info.plist", plist);
        console.log("Patched macOS app bundle metadata");
    } catch (err) {
        console.warn("Could not patch Info.plist:", err.message);
    }
}
