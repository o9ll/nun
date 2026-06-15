/*
 * Nun, a Discord client mod
 * Copyright (c) 2026 o9
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import Remote from "./remote";


export default {
    ...Remote.crypto,
    // Wrap it in Buffer
    randomBytes(length: number) {
        return Buffer.from(Remote.crypto.randomBytes(length));
    }
};