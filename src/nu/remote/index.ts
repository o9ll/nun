/*
 * Nun, a Discord client mod
 * Copyright (c) 2026 o9
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

export * as filesystem from "./filesystem";
export {default as https} from "./https";
export * as electron from "./electron";
export * as crypto from "./crypto";
export * as vm from "./vm";
export * from "./fetch";

// We can expose that without any issues.
// @ts-expect-error TODO: fix wrong way of exporting path
export * as path from "path";
export * as net from "net"; // TODO: evaluate need and create wrapper
export * as os from "os";
