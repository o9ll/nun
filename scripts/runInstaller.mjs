/*
 * Nun, a vaporwave-inspired Discord client mod
 * Copyright (c) 2026 o9
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

// Patches Discord without any external installer. Renames app.asar to
// _app.asar and drops a folder named app.asar that just requires our patcher.
// pnpm inject / uninject / repair map to --install / --uninstall / --repair.
//
// Pick a branch with --branch stable|canary|ptb (comma-separated ok)
// --stable / --canary / --ptb, or --all. With no flags and a TTY you get an interactive menu.

import "./checkNodeVersion.js";

import { execSync } from "child_process";
import { existsSync, lstatSync, mkdirSync, readdirSync, renameSync, rmSync, writeFileSync } from "fs";
import { homedir } from "os";
import { dirname, join } from "path";
import readline from "readline/promises";
import { stdin as input, stdout as output } from "process";
import { setTimeout as sleep } from "timers/promises";
import { fileURLToPath } from "url";

const BASE_DIR = join(dirname(fileURLToPath(import.meta.url)), "..");
const PATCHER_PATH = join(BASE_DIR, "dist", "desktop", "patcher.js");

const STUB_PACKAGE = JSON.stringify({ name: "discord", main: "index.js" });
const makeStubIndex = patcherPath => `require(${JSON.stringify(patcherPath.replace(/\\/g, "/"))});\n`;

const VERSION_PREFIX = "app-";

const BRANCH_IDS = ["stable", "canary", "ptb", "development"];
const BRANCH_LABELS = {
    stable: "Stable",
    canary: "Canary",
    ptb: "PTB",
    development: "Development",
};

const WIN_BRANCH_DIRS = {
    Discord: "stable",
    DiscordCanary: "canary",
    DiscordPTB: "ptb",
    DiscordDevelopment: "development",
};

const DARWIN_BRANCH_APPS = {
    Discord: "stable",
    "Discord PTB": "ptb",
    "Discord Canary": "canary",
};

const LINUX_BRANCH_FOLDERS = {
    discord: "stable",
    Discord: "stable",
    "discord-canary": "canary",
    DiscordCanary: "canary",
    discordcanary: "canary",
    "discord-ptb": "ptb",
    DiscordPTB: "ptb",
    discordptb: "ptb",
    "discord-development": "development",
    DiscordDevelopment: "development",
    discorddevelopment: "development",
};

const CONFIG_HOME_BRANCHES = {
    discord: "stable",
    discordcanary: "canary",
    discordptb: "ptb",
    discorddevelopment: "development",
};

function pushInstall(installs, branch, resources) {
    if (existsSync(resources)) installs.push({ branch, resources });
}

function getInstallations() {
    const installs = [];

    if (process.platform === "win32") {
        const local = process.env.LOCALAPPDATA;
        if (!local) return installs;
        for (const [folder, branch] of Object.entries(WIN_BRANCH_DIRS)) {
            const branchDir = join(local, folder);
            if (!existsSync(branchDir)) continue;
            for (const name of readdirSync(branchDir)) {
                if (!name.startsWith(VERSION_PREFIX)) continue;
                pushInstall(installs, branch, join(branchDir, name, "resources"));
            }
        }
    } else if (process.platform === "darwin") {
        for (const [app, branch] of Object.entries(DARWIN_BRANCH_APPS)) {
            pushInstall(installs, branch, join("/Applications", `${app}.app`, "Contents", "Resources"));
        }
    } else {
        const home = homedir();
        const bases = [
            "/usr/share", "/usr/lib", "/usr/lib64", "/opt",
            "/usr/local/share", "/usr/local/lib", "/usr/local",
            join(home, ".local/share"),
            "/var/lib/flatpak/app/com.discordapp.Discord/current/active/files",
            join(home, ".local/share/flatpak/app/com.discordapp.Discord/current/active/files"),
            "/snap/discord/current/usr/share",
        ];

        const seen = new Set();
        const tryDir = (res, branch = "stable") => {
            if (!res || seen.has(res)) return;
            seen.add(res);
            if (existsSync(join(res, "app.asar")) || existsSync(join(res, "_app.asar"))) {
                installs.push({ branch, resources: res });
            }
        };

        for (const base of bases) {
            tryDir(join(base, "resources"));
            for (const [folder, branch] of Object.entries(LINUX_BRANCH_FOLDERS)) {
                tryDir(join(base, folder, "resources"), branch);
            }
        }

        const configHome = process.env.XDG_CONFIG_HOME || join(home, ".config");
        for (const [folder, branch] of Object.entries(CONFIG_HOME_BRANCHES)) {
            const branchDir = join(configHome, folder);
            if (!existsSync(branchDir)) continue;
            for (const name of readdirSync(branchDir)) {
                if (!name.startsWith(VERSION_PREFIX)) continue;
                tryDir(join(branchDir, name, "resources"), branch);
            }
        }
    }

    return installs;
}

function parseSelectedBranches(args) {
    if (args.includes("--all")) return "all";

    const selected = new Set();
    for (const id of BRANCH_IDS) {
        if (args.includes(`--${id}`)) selected.add(id);
    }

    const idx = args.indexOf("--branch");
    if (idx !== -1) {
        const val = args[idx + 1];
        if (!val || val.startsWith("--")) {
            console.error("--branch needs a value: stable, canary, ptb, or development");
            process.exit(1);
        }
        for (const part of val.split(",")) {
            const id = part.trim().toLowerCase();
            if (!BRANCH_IDS.includes(id)) {
                console.error(`Unknown branch "${part}". Use stable, canary, ptb, or development.`);
                process.exit(1);
            }
            selected.add(id);
        }
    }

    return selected.size ? selected : null;
}

async function promptForBranches(available) {
    const sorted = [...available].sort((a, b) => BRANCH_IDS.indexOf(a) - BRANCH_IDS.indexOf(b));

    console.log("\nWhich Discord branch do you want to target?");
    sorted.forEach((branch, i) => console.log(`  [${i + 1}] ${BRANCH_LABELS[branch]}`));
    const allNum = sorted.length + 1;
    console.log(`  [${allNum}] All`);
    console.log("  (comma-separated numbers, or branch names like stable,canary)");

    const rl = readline.createInterface({ input, output });
    try {
        const answer = (await rl.question("\nChoose: ")).trim();
        if (!answer || answer.toLowerCase() === "all" || answer === String(allNum)) {
            return new Set(sorted);
        }

        const selected = new Set();
        for (const part of answer.split(",").map(s => s.trim()).filter(Boolean)) {
            const num = parseInt(part, 10);
            if (!Number.isNaN(num) && num >= 1 && num <= sorted.length) {
                selected.add(sorted[num - 1]);
                continue;
            }
            const id = part.toLowerCase();
            if (BRANCH_IDS.includes(id)) {
                selected.add(id);
                continue;
            }
            console.error(`Invalid choice: ${part}`);
            process.exit(1);
        }

        if (!selected.size) {
            console.error("Nothing selected.");
            process.exit(1);
        }
        return selected;
    } finally {
        rl.close();
    }
}

async function resolveSelectedBranches(installations, args) {
    const available = [...new Set(installations.map(i => i.branch))];
    const parsed = parseSelectedBranches(args);

    if (parsed === "all") return new Set(available);
    if (parsed?.size) {
        for (const branch of parsed) {
            if (!available.includes(branch)) {
                console.error(`${BRANCH_LABELS[branch]} is not installed.`);
                process.exit(1);
            }
        }
        return parsed;
    }

    if (available.length === 1) return new Set(available);
    if (process.stdin.isTTY) return promptForBranches(available);

    console.error("Multiple Discord installs found. Pick one:");
    console.error("  pnpm inject -- --branch stable");
    console.error("  pnpm inject -- --branch canary,ptb");
    console.error("  pnpm inject -- --all");
    for (const branch of available) console.error(`    - ${BRANCH_LABELS[branch]}`);
    process.exit(1);
}

function killDiscord(branches) {
    console.log("Closing Discord so its files can be patched...");
    try {
        if (process.platform === "win32") {
            const exes = {
                stable: "Discord.exe",
                canary: "DiscordCanary.exe",
                ptb: "DiscordPTB.exe",
                development: "DiscordDevelopment.exe",
            };
            for (const branch of branches) {
                const exe = exes[branch];
                if (!exe) continue;
                try {
                    execSync(`taskkill /F /T /IM ${exe}`, { stdio: "ignore" });
                } catch {
                    // not running
                }
            }
        } else if (process.platform === "darwin") {
            const patterns = {
                stable: "Discord.app",
                canary: "Discord Canary.app",
                ptb: "Discord PTB.app",
            };
            for (const branch of branches) {
                const pattern = patterns[branch];
                if (!pattern) continue;
                try {
                    execSync(`pkill -f "${pattern}"`, { stdio: "ignore" });
                } catch {
                    // not running
                }
            }
        } else {
            for (const branch of branches) {
                const patterns = {
                    stable: "discord",
                    canary: "discordcanary|discord-canary|DiscordCanary",
                    ptb: "discordptb|discord-ptb|DiscordPTB",
                    development: "discorddevelopment|discord-development|DiscordDevelopment",
                };
                const pattern = patterns[branch];
                if (!pattern) continue;
                try {
                    execSync(`pkill -iE "${pattern}"`, { stdio: "ignore" });
                } catch {
                    // not running
                }
            }
        }
    } catch (err) {
        console.warn("Could not close Discord automatically. Close it manually if patching fails.", err?.message ?? err);
    }
}

/** rename with a few retries to ride out lingering file locks after closing Discord */
async function renameWithRetry(from, to) {
    let lastErr;
    for (let attempt = 0; attempt < 6; attempt++) {
        try {
            renameSync(from, to);
            return;
        } catch (err) {
            lastErr = err;
            if (err.code !== "EBUSY" && err.code !== "EPERM" && err.code !== "EACCES") throw err;
            await sleep(500);
        }
    }
    throw lastErr;
}

async function patch(resources) {
    const app = join(resources, "app.asar");
    const _app = join(resources, "_app.asar");

    if (existsSync(_app)) {
        if (existsSync(app) && lstatSync(app).isDirectory()) {
            writeFileSync(join(app, "package.json"), STUB_PACKAGE);
            writeFileSync(join(app, "index.js"), makeStubIndex(PATCHER_PATH));
            return "refreshed";
        }
        return "already";
    }

    if (!existsSync(app) || lstatSync(app).isDirectory()) return "skip";

    await renameWithRetry(app, _app);
    try {
        mkdirSync(app);
        writeFileSync(join(app, "package.json"), STUB_PACKAGE);
        writeFileSync(join(app, "index.js"), makeStubIndex(PATCHER_PATH));
    } catch (err) {
        try {
            rmSync(app, { recursive: true, force: true });
            renameSync(_app, app);
        } catch (cleanupErr) {
            console.error("Rollback failed:", cleanupErr);
        }
        throw err;
    }
    return "patched";
}

async function unpatch(resources) {
    const app = join(resources, "app.asar");
    const _app = join(resources, "_app.asar");

    if (!existsSync(_app)) return "notpatched";

    if (existsSync(app) && lstatSync(app).isDirectory()) {
        rmSync(app, { recursive: true, force: true });
    }
    await renameWithRetry(_app, app);
    return "unpatched";
}

async function main() {
    const argStart = process.argv.indexOf("--");
    const args = argStart === -1 ? [] : process.argv.slice(argStart + 1);
    const action = args.includes("--uninstall")
        ? "uninstall"
        : args.includes("--repair")
            ? "repair"
            : "install";

    if (action !== "uninstall" && !existsSync(PATCHER_PATH)) {
        console.error("Could not find the built patcher at dist/desktop/patcher.js.");
        console.error("Run `pnpm build` first, then `pnpm inject`.");
        process.exit(1);
    }

    const installations = getInstallations();
    if (!installations.length) {
        console.error("No Discord installation found. Is Discord installed?");
        process.exit(1);
    }

    const selectedBranches = await resolveSelectedBranches(installations, args);
    const targets = installations.filter(i => selectedBranches.has(i.branch));

    const branchSummary = [...selectedBranches].map(b => BRANCH_LABELS[b]).join(", ");
    console.log(`Found ${targets.length} install(s) for ${branchSummary}.`);
    killDiscord(selectedBranches);
    await sleep(1500);

    let ok = 0;
    for (const { branch, resources } of targets) {
        const label = BRANCH_LABELS[branch];
        try {
            if (action === "uninstall") {
                const r = await unpatch(resources);
                console.log(`  [${r}] ${label}: ${resources}`);
            } else {
                if (action === "repair") await unpatch(resources);
                const r = await patch(resources);
                console.log(`  [${r}] ${label}: ${resources}`);
            }
            ok++;
        } catch (err) {
            console.error(`  [failed] ${label}: ${resources}\n    ${err?.message ?? err}`);
        }
    }

    if (ok === 0) {
        console.error("Nothing was changed. If files were locked, fully close Discord and try again.");
        process.exit(1);
    }

    console.log(
        action === "uninstall"
            ? "Nun removed. Start Discord normally for vanilla."
            : "Done! Start Discord to load Nun."
    );
}

main().catch(err => {
    console.error("Something went wrong:", err);
    process.exit(1);
});
