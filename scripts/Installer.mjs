/*
 * NuCord, a vaporwave-inspired Discord client mod
 * Copyright (c) 2026 o9
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

// Local installer entry point. Forwards to the native patcher in scripts/runInstaller.mjs.
// pnpm inject / uninject / repair call runInstaller.mjs directly with the same flags.

import "./scripts/checkNodeVersion.js";

import { execFileSync } from "child_process";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const BASE_DIR = dirname(fileURLToPath(import.meta.url));
const RUN_INSTALLER = join(BASE_DIR, "scripts", "runInstaller.mjs");

const argStart = process.argv.indexOf("--");
const args = argStart === -1 ? [] : process.argv.slice(argStart + 1);

try {
    execFileSync(process.execPath, [RUN_INSTALLER, "--", ...args], { stdio: "inherit" });
} catch {
    process.exit(1);
}
