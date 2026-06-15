/*
 * Nun, a Discord client mod
 * Copyright (c) 2026 o9
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import type {BinaryLike, BinaryToTextEncoding} from "crypto";

const crypto: () => typeof import("crypto") = (() => {
    let cache: typeof import("crypto") | null = null;

    return () => {
        if (cache) return cache;

         
        return cache = require("crypto");
    };
})();

export function createHash(type: string) {
    const hash = crypto().createHash(type);

    const ctx = {
        update(data: BinaryLike) {
            hash.update(data);

            return ctx;
        },
        digest(encoding: BinaryToTextEncoding) {return hash.digest(encoding);}
    };

    return ctx;
}

export function randomBytes(length: number) {
    return crypto().randomBytes(length);
}