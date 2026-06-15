/*
 * Nun, a Discord client mod
 * Copyright (c) 2026 o9
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

export interface NuWebAddon {
    id: number;
    name: string;
    file_name: string;
    type: NuWebAddonType;
    description: string;
    version: string;
    author: NuWebAuthor;
    likes: number;
    downloads: number;
    tags: string[];
    thumbnail_url?: string;
    latest_source_url: string;
    initial_release_date: string;
    latest_release_date: string;
    guild: NuWebGuild | null;
}

export interface NuWebAuthor {
    github_id: string;
    github_name: string;
    display_name: string;
    discord_name: string;
    discord_avatar_hash: null | string;
    discord_snowflake: string;
    guild: NuWebGuild | null;
}

export interface NuWebGuild {
    name: string;
    snowflake: string;
    invite_link: string;
    avatar_hash?: string;
}

export type NuWebAddonType = "plugin" | "theme";