/*
 * Nun, a Discord client mod
 * Copyright (c) 2026 o9
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import EventEmitter from "eventemitter3";

import Remote from "./remote";


export function get(url: string, options: null | object | ((e: EventEmitter) => void) = {}, callback: (e: EventEmitter) => void) {
    if (typeof (options) === "function") {
        callback = options as (e: EventEmitter) => void;
        options = null;
    }

    const emitter = new EventEmitter();

    callback(emitter);

    // // @ts-expect-error idk what this means and i cba
    Remote.https.get(url, options, (error: Error, res?: Record<string, any>, body?: Buffer | string) => {
        if (error) return emitter.emit("error", error);
        emitter.emit("data", body);
        emitter.emit("end", res);
    });

    return emitter;
}

export default {get};