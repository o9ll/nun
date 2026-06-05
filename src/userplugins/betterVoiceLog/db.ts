/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import * as DataStore from "@api/DataStore";

const store = DataStore.createStore("BetterVoiceLog", "keyval");

export function set(key: string, value: unknown) {
    return DataStore.set(key, JSON.stringify(value ?? null), store);
}

export function setMany(values: Record<string, unknown>) {
    return DataStore.setMany(Object.entries(values).map(([key, value]) => [key, JSON.stringify(value ?? null)]), store);
}

export async function getMany(keys: string[]) {
    return (await DataStore.getMany<string>(keys, store)).map(value => JSON.parse(value ?? "null"));
}

export async function get(key: string) {
    return JSON.parse((await DataStore.get<string>(key, store)) ?? "null");
}

export function remove(key: string) {
    return DataStore.del(key, store);
}
