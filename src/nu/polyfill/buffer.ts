/*
 * Nun, a Discord client mod
 * Copyright (c) 2026 o9
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import Logger from "../core/logger";
import { Buffer } from "buffer";


Object.defineProperty(window, "Buffer", {
    get() {
        Logger.warn("Deprecated", `Usage of the Buffer global is deprecated. Consider using web standards such as Uint8Array and TextDecoder/TextEncoder.`);
        return Buffer;
    },
    configurable: true,
    enumerable: false
});

export default Buffer;
