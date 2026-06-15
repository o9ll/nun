/*
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { execSync } from "child_process";
import { existsSync, readdirSync, renameSync, rmSync, writeFileSync } from "fs";
import { basename, join } from "path";

import { promptSelect } from "./promptSelect.mjs";

const PACKAGE_JSON = `{
\t"name": "discord",
\t"main": "index.js"
}`;

const DISCORD_FOLDERS = {
    stable: "Discord",
    ptb: "DiscordPTB",
    canary: "DiscordCanary",
    dev: "DiscordDevelopment"
};

const FORK_FOLDERS = ["Vencord", "Equicord", "BetterVencord", "Lightcord"];

function getProcessName(install) {
    const folder = basename(install.path).replace(/\.app$/, "");

    for (const name of Object.values(DISCORD_FOLDERS)) {
        if (folder === name) return `${name}.exe`;
    }

    for (const name of FORK_FOLDERS) {
        if (folder === name) return `${name}.exe`;
    }

    return `${folder}.exe`;
}

function killDiscordProcess(install) {
    if (process.platform !== "win32") return;

    const name = getProcessName(install);
    try {
        execSync(`taskkill /F /IM ${name}`, { stdio: "ignore" });
    } catch { }
}

function getBranch(name) {
    const lower = name.toLowerCase();
    if (lower.includes("canary")) return "canary";
    if (lower.includes("ptb")) return "ptb";
    if (lower.includes("development") || lower.includes("dev")) return "dev";
    return "stable";
}

function parseDiscord(basePath, branch = "") {
    if (!existsSync(basePath)) return null;

    let appPath = "";
    let isPatched = false;

    for (const entry of readdirSync(basePath, { withFileTypes: true })) {
        if (!entry.isDirectory() || !entry.name.startsWith("app-")) continue;

        const resources = join(basePath, entry.name, "resources");
        if (!existsSync(resources)) continue;

        const app = join(resources, "app");
        if (app > appPath) {
            appPath = app;
            isPatched = existsSync(join(resources, "_app.asar"));
        }
    }

    if (!appPath) return null;

    return {
        path: basePath,
        branch: branch || getBranch(basename(basePath)),
        resourcesDir: join(appPath, ".."),
        appPath,
        isPatched
    };
}

function findDiscords() {
    const installs = [];

    if (process.platform === "win32") {
        const appData = process.env.LOCALAPPDATA;
        if (!appData) return installs;

        for (const [branch, folder] of Object.entries(DISCORD_FOLDERS)) {
            const install = parseDiscord(join(appData, folder), branch);
            if (install) installs.push(install);
        }

        for (const folder of FORK_FOLDERS) {
            const install = parseDiscord(join(appData, folder));
            if (install) installs.push(install);
        }
    } else if (process.platform === "darwin") {
        const bases = ["/Applications", join(process.env.HOME ?? "", "Applications")];
        const apps = [
            ...Object.entries({ stable: "Discord.app", ptb: "Discord PTB.app", canary: "Discord Canary.app", dev: "Discord Development.app" }),
            ...FORK_FOLDERS.map(f => ["", `${f}.app`])
        ];

        for (const base of bases) {
            for (const [branch, appName] of apps) {
                const root = join(base, appName);
                const resources = join(root, "Contents/Resources");
                if (!existsSync(resources)) continue;

                installs.push({
                    path: root,
                    branch: branch || getBranch(appName),
                    resourcesDir: resources,
                    appPath: join(resources, "app"),
                    isPatched: existsSync(join(resources, "_app.asar"))
                });
            }
        }
    } else {
        const home = process.env.HOME ?? "";
        const dirs = [
            "/usr/share", "/usr/lib64", "/opt",
            join(home, ".local/share"),
            join(home, ".dvm")
        ];
        const names = [
            ...Object.values(DISCORD_FOLDERS),
            ...FORK_FOLDERS.map(n => n.toLowerCase()),
            "discord", "discordptb", "discordcanary", "discorddevelopment"
        ];

        for (const dir of dirs) {
            if (!existsSync(dir)) continue;
            for (const entry of readdirSync(dir, { withFileTypes: true })) {
                if (!entry.isDirectory() || !names.includes(entry.name)) continue;
                const install = parseDiscord(join(dir, entry.name));
                if (install) installs.push(install);
            }
        }
    }

    return installs;
}

function writeAppAsar(outFile, patcherPath) {
    const indexJs = `require(${JSON.stringify(patcherPath)})`;
    const files = {
        "index.js": { size: Buffer.byteLength(indexJs), offset: "0" },
        "package.json": { size: Buffer.byteLength(PACKAGE_JSON), offset: String(Buffer.byteLength(indexJs)) }
    };

    const headerString = JSON.stringify({ files });
    const dataSize = 4;
    const headerStringSize = Buffer.byteLength(headerString);
    const alignedSize = (headerStringSize + dataSize - 1) & ~(dataSize - 1);
    const headerSize = alignedSize + 8;
    const headerObjectSize = alignedSize + dataSize;
    const paddedHeader = headerString + "0".repeat(alignedSize - headerStringSize);

    const parts = [
        Buffer.alloc(16),
        Buffer.from(paddedHeader),
        Buffer.from(indexJs),
        Buffer.from(PACKAGE_JSON)
    ];

    parts[0].writeUInt32LE(dataSize, 0);
    parts[0].writeUInt32LE(headerSize, 4);
    parts[0].writeUInt32LE(headerObjectSize, 8);
    parts[0].writeUInt32LE(headerStringSize, 12);

    writeFileSync(outFile, Buffer.concat(parts));
}

function killDiscordProcesses() {
    if (process.platform !== "win32") return;

    for (const name of PROCESS_NAMES) {
        try {
            execSync(`taskkill /F /IM ${name}`, { stdio: "ignore" });
        } catch { }
    }
}

function patchInstall(install, patcherPath) {
    killDiscordProcess(install);

    const dir = install.resourcesDir;
    const appAsar = join(dir, "app.asar");
    const backupAsar = join(dir, "_app.asar");

    if (install.isPatched) unpatchInstall(install);

    renameSync(appAsar, backupAsar);
    writeAppAsar(appAsar, patcherPath);
    install.isPatched = true;
    console.log(`Patched ${install.path}`);
}

function unpatchInstall(install) {
    killDiscordProcess(install);

    const dir = install.resourcesDir;
    const appAsar = join(dir, "app.asar");
    const backupAsar = join(dir, "_app.asar");
    const tmpAsar = join(dir, "app.asar.tmp");

    if (!existsSync(backupAsar)) {
        throw new Error(`${install.path} does not look patched (_app.asar missing)`);
    }

    if (existsSync(appAsar)) renameSync(appAsar, tmpAsar);
    renameSync(backupAsar, appAsar);
    if (existsSync(tmpAsar)) rmSync(tmpAsar, { force: true });

    install.isPatched = false;
    console.log(`Unpatched ${install.path}`);
}

async function promptInstall(installs, action) {
    if (!installs.length) {
        throw new Error("No Discord installs found");
    }

    const patched = installs.filter(i => i.isPatched);
    const candidates = action === "unpatch" ? patched : installs;

    if (!candidates.length) {
        throw new Error(action === "unpatch" ? "No patched Discord installs found" : "No Discord installs found");
    }

    if (candidates.length === 1) return candidates[0];

    const choices = candidates.map(install => {
        const tag = install.isPatched ? " [PATCHED]" : "";
        return `${install.branch} - ${install.path}${tag}`;
    });

    const index = await promptSelect(`Select ${action}:`, choices);
    return candidates[index];
}

function pickByBranch(installs, branch) {
    const match = installs.find(i => i.branch === branch);
    if (!match) throw new Error(`Discord ${branch} not found`);
    return match;
}

export async function runLocalInstaller({ args, desktopDir }) {
    const patcherPath = join(desktopDir, "patcher.js");
    if (!existsSync(patcherPath)) {
        throw new Error(`Missing ${patcherPath}. Run pnpm build first.`);
    }

    const filteredArgs = args.filter(a => a !== "--");

    const install = filteredArgs.includes("--install");
    const uninstall = filteredArgs.includes("--uninstall");
    const repair = filteredArgs.includes("--repair");

    if (!install && !uninstall && !repair) {
        throw new Error("Pass --install, --uninstall, or --repair");
    }

    const branchIdx = filteredArgs.findIndex(a => a === "-branch" || a === "--branch");
    const branch = branchIdx !== -1 ? filteredArgs[branchIdx + 1] : "";

    const installs = findDiscords();

    if (uninstall) {
        const target = branch ? pickByBranch(installs.filter(i => i.isPatched), branch) : await promptInstall(installs, "unpatch");
        unpatchInstall(target);
        return;
    }

    const target = branch ? pickByBranch(installs, branch) : await promptInstall(installs, install ? "patch" : "repair");
    patchInstall(target, patcherPath);
}
