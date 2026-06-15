/*
 * Nun, a Discord client mod
 * Copyright (c) 2026 o9
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./Store.css";
import "../plugins/styles.css";
import { HeadingTertiary } from "@components/Heading";
import { Margins } from "@components/margins";
import { React, Select, SettingsRouter, TextInput, useState } from "@webpack/common";
import PluginStore from "@nu/core/pluginstore";
import PluginStoreCard from "./StoreCard";
import Paginator from "@nu/ui/misc/paginator";
import { classes } from "@utils/misc";
import pluginmanager from "@nu/core/pluginmanager";
import { Paragraph } from "@components/Paragraph";
import { cl } from "../plugins";

const pageSize = 20;

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
    const [page, setPage] = useState(0);
    const [sort, setSort] = useState(SortType.Downloads);
    const [search, setSearch] = useState("");

    const searched = search.trim().toLowerCase();
    let plugins = Object.values(PluginStore.plugins).filter(plugin => (
        plugin.name.toLowerCase().includes(searched) ||
        plugin.description.toLowerCase().includes(searched)
    ));

    if (sort === SortType.NotInstalled) {
        plugins = plugins.filter(plugin => !pluginmanager.getPlugin(plugin.file_name));
    } else {
        plugins.sort((a, b) => {
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

    const wrapper = React.useRef<HTMLDivElement>(null);

    return (
        <section className="nu-plugin-store-panel">
            <HeadingTertiary className={classes(Margins.top20, Margins.bottom8)}>
                BetterDiscord Plugin Store
            </HeadingTertiary>

            <div className={classes(Margins.bottom20, cl("filter-controls"))}>
                <TextInput
                    value={search}
                    placeholder="Search for a plugin..."
                    onChange={(query: string) => {
                        setSearch(query);
                        setPage(0);
                    }}
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
                    select={(type) => {
                        setSort(type);
                        setPage(0);
                    }}
                    isSelected={v => v === sort}
                    closeOnSelect={true}
                />
            </div>

            <div className="nu-plugin-store-cards" ref={wrapper}>
                {plugins.slice(page * pageSize, page * pageSize + pageSize).map(plugin => (
                    <PluginStoreCard key={plugin.id} plugin={plugin} />
                ))}
            </div>

            {plugins.length === 0 && (
                <Paragraph>No plugins match search</Paragraph>
            )}

            <Paginator
                className={cl("page-buttons")}
                currentPage={page}
                length={plugins.length}
                pageSize={pageSize}
                maxVisible={9}
                onPageChange={(newPage) => {
                    setPage(newPage);
                    wrapper.current?.closest('[class*="scrollerBase"]')?.scrollTo({ top: 0, behavior: "smooth" });
                }}
            />
        </section>
    );
}

export function openPluginStore() {
    SettingsRouter.openUserSettings("nu_plugins_panel");
}
