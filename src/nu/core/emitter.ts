/*
 * Nun, a Discord client mod
 * Copyright (c) 2026 o9
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import EventEmitter3 from "eventemitter3";

export default new class NUEvents extends EventEmitter3 {
    constructor() {
        super();
    }

    dispatch(eventName: string, ...args: any[]) {
        this.emit(eventName, ...args);
    }
};