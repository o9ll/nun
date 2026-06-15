/*
 * Nun, a Discord client mod
 * Copyright (c) 2026 o9
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

export default abstract class Store {
    public initialize(): void {}

    #listeners = new Set<() => void>();
    public addChangeListener(callback: () => void) {
        this.#listeners.add(callback);
        return () => this.removeChangeListener(callback);
    }

    public removeChangeListener(callback: () => void) {
        this.#listeners.delete(callback);
    }

    public emitChange() {
        for (const listener of this.#listeners) {
            listener();
        }
    }
}

Object.freeze(Store);
Object.freeze(Store.prototype);