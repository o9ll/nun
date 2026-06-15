/*
 * Nun, a Discord client mod
 * Copyright (c) 2026 o9
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import Remote from "./remote";


export const compileFunction = function (code: string, params: string[] = [], options = {}) {
    const returned = Remote.vm.compileFunction(code, params, options);
    if (typeof (returned) === "function") return returned;
    const syntaxError = new SyntaxError(returned.message);
    syntaxError.stack = returned.stack;
    throw syntaxError;
};

export default {compileFunction};