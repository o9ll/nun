/*
 * Nun, a Discord client mod
 * Copyright (c) 2026 o9
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import vm from "vm";

export function compileFunction(code: string, params: string[] = [], options = {}) {
    try {
        return vm.compileFunction(code, params, options);
    }
    catch (e) {
        const error: Error = e as Error;
        return {
            name: error.name,
            message: error.message,
            stack: error.stack
        };
    }
}