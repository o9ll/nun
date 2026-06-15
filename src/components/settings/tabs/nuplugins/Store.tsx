/*
 * Nun, a Discord client mod
 * Copyright (c) 2026 o9
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./Store.css";
import "../plugins/styles.css";
import { HeadingTertiary } from "@components/Heading";
import { Margins } from "@components/margins";
import { debounce } from "@shared/debounce";
import { useIntersection } from "@utils/react";
import { classes } from "@utils/misc";
import PluginStore from "@nu/core/pluginstore";
import pluginmanager from "@nu/core/pluginmanager";
import { Paragraph } from "@components/Paragraph";
import { Select, SettingsRouter, TextInput, useCallback, useEffect, useMemo, useState } from "@webpack/common";
import { cl } from "../plugins";

import PluginStoreCard from "./StoreCard";

enum SortType {
    Downloads = "downloads",
    Author = "author",
    Likes = "likes",
    NotInstalled = "installed",
    Modified = "modified",
    ReleaseDate = "releaseDate",
    Name = "name"
}

export function PluginStorePanel() {
    const [sort, setSort] = useState(SortType.Downloads);
    const [search, setSearch] = useState("");

    const plugins = useMemo(() => {
        const searched = search.trim().toLowerCase();
        let result = Object.values(PluginStore.plugins).filter(plugin => (
            plugin.name.toLowerCase().includes(searched) ||
            plugin.description.toLowerCase().includes(searched)
        ));

        if (sort === SortType.NotInstalled) {
            result = result.filter(plugin => !pluginmanager.getPlugin(plugin.file_name));
        } else {
            result.sort((a, b) => {
                switch (sort) {
                    case SortType.Downloads:
                        return b.downloads - a.downloads;
                    case SortType.Author:
                        return a.author.display_name.localeCompare(b.author.display_name);
                    case SortType.Likes:
                        return b.likes - a.likes;
                    case SortType.Modified:
                        return new Date(b.latest_release_date).getTime() - new Date(a.latest_release_date).getTime();
                    case SortType.Name:
                        return a.name.localeCompare(b.name);
                    case SortType.ReleaseDate:
                        return new Date(b.initial_release_date).getTime() - new Date(a.initial_release_date).getTime();
                }
            });
        }

        return result;
    }, [search, sort]);

    const pluginsToLoad = Math.min(36, plugins.length);
    const [visibleCount, setVisibleCount] = useState(pluginsToLoad);

    useEffect(() => {
        setVisibleCount(Math.min(36, plugins.length));
    }, [search, sort, plugins.length]);

    const loadMore = useCallback(() => {
        setVisibleCount(v => Math.min(v + pluginsToLoad, plugins.length));
    }, [plugins.length, pluginsToLoad]);

    const dLoadMore = useMemo(() => debounce(loadMore, 100), [loadMore]);

    const [sentinelRef, isSentinelVisible] = useIntersection();

    useEffect(() => {
        if (isSentinelVisible && visibleCount < plugins.length) {
            dLoadMore();
        }
    }, [isSentinelVisible, visibleCount, plugins.length, dLoadMore]);

    const visiblePlugins = plugins.slice(0, visibleCount);

    return (
        <section className="nu-plugin-store-panel">
            <HeadingTertiary className={classes(Margins.top20, Margins.bottom8)}>
                BetterDiscord Plugin Store
            </HeadingTertiary>

            <div className={classes(Margins.bottom20, cl("filter-controls"))}>
                <TextInput
                    value={search}
                    placeholder="Search for a plugin..."
                    onChange={setSearch}
                />
                <Select
                    options={[
                        { label: "Most Downloads", value: SortType.Downloads, default: true },
                        { label: "Not Installed", value: SortType.NotInstalled },
                        { label: "Most Likes", value: SortType.Likes },
                        { label: "Last Updated", value: SortType.Modified },
                        { label: "Newest", value: SortType.ReleaseDate },
                        { label: "Author", value: SortType.Author },
                        { label: "Name", value: SortType.Name }
                    ]}
                    serialize={String}
                    select={setSort}
                    isSelected={v => v === sort}
                    closeOnSelect={true}
                />
            </div>

            <div className="nu-plugin-store-cards">
                {visiblePlugins.map(plugin => (
                    <PluginStoreCard key={plugin.id} plugin={plugin} />
                ))}
            </div>

            {plugins.length === 0 && (
                <Paragraph>No plugins match search</Paragraph>
            )}

            {visibleCount < plugins.length && (
                <div ref={sentinelRef} style={{ height: 32 }} />
            )}
        </section>
    );
}

export function openPluginStore() {
    SettingsRouter.openUserSettings("nu_plugins_panel");
}
