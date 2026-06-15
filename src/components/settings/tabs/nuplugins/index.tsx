/*
 * Nun, a Discord client mod
 * Copyright (c) 2026 o9
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./index.css";
import "../plugins/styles.css";
import { HeadingTertiary } from "@components/Heading";
import { SettingsTab, wrapTab } from "../BaseTab";
import ErrorBoundary from "@components/ErrorBoundary";
import { debounce } from "@shared/debounce";
import { useIntersection } from "@utils/react";
import { React, Select, TextInput, useCallback, useEffect, useMemo, useRef, useState } from "@webpack/common";
import { classNameFactory } from "@utils/css";
import { classes } from "@utils/misc";
import { Margins } from "@components/margins";
import { cl, SearchStatus } from "../plugins";
import { isTruthy } from "@utils/guards";
import { Paragraph } from "@components/Paragraph";
import pluginmanager from "@nu/core/pluginmanager";
import NUPluginCard from "./PluginCard";
import { Settings } from "@api/Settings";
import { useStateFromStores } from "@nu/ui/hooks";
import DiscordModules from "@nu/webpack/modules";
import { LucideIcon } from "@nu/ui/icons";
import { Folder, Check, X, IconNode, FileUp } from "lucide";
import { PluginStorePanel } from "./Store";
import { confirmFileInstall } from "./InstallPopup";

const nuCl = classNameFactory("nu-");

interface ActionButtonProps {
    title: string;
    icon: IconNode;
    onClick: () => void;
}

function ActionButton({ title, icon, onClick }: ActionButtonProps) {
    return (
        <DiscordModules.Tooltip color="primary" position="top" aria-label={title} text={title}>
            {(props) => (
                <button {...props} onClick={onClick} className={classes(cl("info-button"), nuCl("action-button"))}>
                    <LucideIcon icon={icon} size={18} className={cl("info-icon")} />
                </button>
            )}
        </DiscordModules.Tooltip>
    );
}

function NUPlugins() {
    const tabRef = useRef<HTMLDivElement>(null);
    const [searchValue, setSearchValue] = useState({ value: "", status: SearchStatus.ALL });
    const plugins = useStateFromStores(pluginmanager, () => pluginmanager.addonList.concat(), [pluginmanager], true);
    const [dragCounter, setDragCounter] = useState(0);

    useEffect(() => {
        tabRef.current?.closest('[class*="scrollerBase"]')?.scrollTo({ top: 0 });
    }, []);

    const onSearch = (query: string) => setSearchValue(prev => ({ ...prev, value: query }));
    const onStatusChange = (status: SearchStatus) => setSearchValue(prev => ({ ...prev, status }));

    const search = searchValue.value.toLowerCase();
    const status = searchValue.status;

    const filteredPlugins = plugins.filter((plugin) => {
        if (status === SearchStatus.ENABLED && !Settings.nuplugins[plugin.id]) return false;
        else if (status === SearchStatus.DISABLED && Settings.nuplugins[plugin.id]) return false;

        if (!search.length) return true;

        return (
            plugin.name.toLowerCase().includes(search) ||
            plugin.description.toLowerCase().includes(search)
        );
    });

    const pluginsToLoad = Math.min(36, filteredPlugins.length);
    const [visibleCount, setVisibleCount] = useState(pluginsToLoad);

    useEffect(() => {
        setVisibleCount(Math.min(36, filteredPlugins.length));
    }, [searchValue.value, searchValue.status, filteredPlugins.length]);

    const loadMore = useCallback(() => {
        setVisibleCount(v => Math.min(v + pluginsToLoad, filteredPlugins.length));
    }, [filteredPlugins.length, pluginsToLoad]);

    const dLoadMore = useMemo(() => debounce(loadMore, 100), [loadMore]);

    const [sentinelRef, isSentinelVisible] = useIntersection();

    useEffect(() => {
        if (isSentinelVisible && visibleCount < filteredPlugins.length) {
            dLoadMore();
        }
    }, [isSentinelVisible, visibleCount, filteredPlugins.length, dLoadMore]);

    const visiblePlugins = filteredPlugins.slice(0, visibleCount);

    const uploadPlugin = () => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".plugin.js";
        input.multiple = true;

        input.onchange = () => {
            if (!input.files) return;

            confirmFileInstall(input.files);
        };

        input.click();
    };

    const onDragEnter = () => setDragCounter(c => c + 1);
    const onDragLeave = () => setDragCounter(c => Math.max(0, c - 1));
    const onDragOver = (e: React.DragEvent) => e.preventDefault();
    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragCounter(0);

        confirmFileInstall(e.dataTransfer.files);
    };

    return (
        <SettingsTab>
            <div ref={tabRef} className={classes(cl("settings"), nuCl("tab"))}>
                <HeadingTertiary className={classes(Margins.top20, Margins.bottom8)}>
                    Filters
                </HeadingTertiary>

                <div className={classes(Margins.bottom20, cl("filter-controls"))}>
                    <ErrorBoundary noop>
                        <TextInput value={searchValue.value} placeholder="Search for a plugin..." onChange={onSearch} />
                    </ErrorBoundary>
                    <div>
                        <ErrorBoundary noop>
                            <Select
                                options={[
                                    { label: "Show All", value: SearchStatus.ALL, default: true },
                                    { label: "Show Enabled", value: SearchStatus.ENABLED },
                                    { label: "Show Disabled", value: SearchStatus.DISABLED }
                                ].filter(isTruthy)}
                                serialize={String}
                                select={onStatusChange}
                                isSelected={v => v === searchValue.status}
                                closeOnSelect={true}
                            />
                        </ErrorBoundary>
                    </div>
                </div>

                <HeadingTertiary className={Margins.top20}>Plugins</HeadingTertiary>

                <div
                    className={classes(cl("grid"), dragCounter > 0 && nuCl("drop-indicator"))}
                    onDragEnter={onDragEnter}
                    onDragLeave={onDragLeave}
                    onDragOver={onDragOver}
                    onDrop={onDrop}
                >
                    {visiblePlugins.length
                        ? visiblePlugins.map(plugin => (
                            <NUPluginCard key={plugin.id} plugin={plugin} />
                        )) : (
                            <div className={nuCl("no-plugins")}>
                                {plugins.length > 0 ? (
                                    <Paragraph>No plugins meet the search criteria.</Paragraph>
                                ) : (
                                    <>
                                        <Paragraph>You have no BetterDiscord plugins installed.</Paragraph>
                                        <Paragraph>Use the upload button or drag and drop a .plugin.js file here to install it.</Paragraph>
                                    </>
                                )}
                            </div>
                        )
                    }
                </div>

                {visibleCount < filteredPlugins.length && (
                    <div ref={sentinelRef} style={{ height: 32 }} />
                )}

                <div className={nuCl("action-buttons")}>
                    <ActionButton title="Open Plugin Folder" icon={Folder} onClick={() => VencordNative.nu.openPluginFolder()} />
                    <ActionButton title="Enable All" icon={Check} onClick={() => pluginmanager.enableAll()} />
                    <ActionButton title="Disable All" icon={X} onClick={() => pluginmanager.disableAll()} />
                    <ActionButton title="Upload Plugin" icon={FileUp} onClick={uploadPlugin} />
                </div>

                <PluginStorePanel />
            </div>
        </SettingsTab>
    );
}

export default wrapTab(NUPlugins, "NUPlugins");
