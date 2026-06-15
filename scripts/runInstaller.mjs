/*
 * Vencord, a modification for Discord's desktop app
 * Copyright (c) 2023 Vendicated and contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import "./checkNodeVersion.js";

import { execFileSync, execSync } from "child_process";
import { existsSync, mkdirSync, statSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

import { runLocalInstaller } from "./localInstaller.mjs";

const BASE_DIR = join(dirname(fileURLToPath(import.meta.url)), "..");
const INSTALLER_SRC = join(BASE_DIR, "installer");
const OUT_DIR = join(BASE_DIR, "dist", "Installer");
const DESKTOP_DIR = join(BASE_DIR, "dist", "desktop");
const PATCHER = join(DESKTOP_DIR, "patcher.js");

function getInstallerOut() {
    if (process.platform !== "win32")
        throw new Error("Installer build is only supported on Windows");

    return join(OUT_DIR, "NunInstallerCli.exe");
}

function ensureBuild() {
    if (existsSync(PATCHER)) return;

    console.log("Build output missing, running pnpm build...");
    execSync("pnpm build", { cwd: BASE_DIR, stdio: "inherit" });

    if (!existsSync(PATCHER))
        throw new Error("Build finished but patcher.js is still missing at " + PATCHER);
}

function hasGo() {
    try {
        execSync("go version", { stdio: "pipe" });
        return true;
    } catch {
        return false;
    }
}

function buildGoInstaller(out) {
    console.log("Building local Go installer...");

    mkdirSync(OUT_DIR, { recursive: true });

    const gitHash = execSync("git rev-parse --short HEAD", { cwd: BASE_DIR, encoding: "utf-8" }).trim();
    const ldflags = [
        "-s", "-w",
        `-X 'vencordinstaller/buildinfo.InstallerGitHash=${gitHash}'`,
        "-X 'vencordinstaller/buildinfo.InstallerTag=dev'"
    ].join(" ");

    const env = { ...process.env, CGO_ENABLED: "0", GOOS: "windows", GOARCH: process.arch === "arm64" ? "arm64" : "386" };
    const args = ["build", "-v", "-tags", "static cli", "-ldflags", ldflags, "-o", out, "."];

    execFileSync("go", args, { cwd: INSTALLER_SRC, stdio: "inherit", env });
}

function isStaleInstaller(out) {
    try {
        const installerMtime = statSync(out).mtimeMs;
        const srcMtime = Math.max(
            ...["cli.go", "patcher.go", "find_discord_windows.go", "github_downloader.go", "constants.go"]
                .map(f => statSync(join(INSTALLER_SRC, f)).mtimeMs)
        );
        return srcMtime > installerMtime;
    } catch {
        return false;
    }
}

function getGoInstaller() {
    const out = getInstallerOut();
    if (!existsSync(out) && hasGo())
        buildGoInstaller(out);
    else if (existsSync(out) && isStaleInstaller(out) && hasGo())
        buildGoInstaller(out);

    return existsSync(out) ? out : null;
}

ensureBuild();

const argStart = process.argv.indexOf("--");
const args = argStart === -1 ? [] : process.argv.slice(argStart + 1);

const goInstaller = getGoInstaller();

if (goInstaller) {
    console.log("Running local Go installer...");
    try {
        execFileSync(goInstaller, args, {
            stdio: "inherit",
            env: {
                ...process.env,
                EQUICORD_USER_DATA_DIR: BASE_DIR,
                EQUICORD_DIRECTORY: DESKTOP_DIR,
                EQUICORD_DEV_INSTALL: "1",
                VENCORD_USER_DATA_DIR: BASE_DIR,
                VENCORD_DIRECTORY: DESKTOP_DIR,
                VENCORD_DEV_INSTALL: "1"
            }
        });
    } catch {
        console.error("Something went wrong. Check the logs above.");
        process.exit(1);
    }
} else {
    console.log("Using built-in local installer...");
    try {
        await runLocalInstaller({ args, desktopDir: DESKTOP_DIR });
        console.log("Success!");
    } catch (e) {
        console.error(e?.message ?? e);
        process.exit(1);
    }
}
