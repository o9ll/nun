/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { ModalCloseButton, ModalContent, ModalHeader, ModalProps, ModalRoot, ModalSize, openModal } from "@utils/modal";
import { Checkbox, ContextMenuApi, React, ScrollerThin, Text, TextInput, TooltipContainer } from "@webpack/common";

import { VoiceLogContextMenu } from "../contextMenu";
import { settings } from "../settings";
import { getVoiceLogs, TVoiceLog, TVoiceMoveType, TVoiceStateType, TVoiceUpdateType } from "../voiceLog";
import { ArrowRightIcon } from "./icons/ArrowRightIcon";
import { FilterIcon } from "./icons/FilterIcon";
import { RefreshIcon } from "./icons/RefreshIcon";
import { SearchIcon } from "./icons/SearchIcon";
import { UserDeafIcon } from "./icons/UserDeafIcon";
import { UserJoinIcon } from "./icons/UserJoinIcon";
import { UserLeaveIcon } from "./icons/UserLeaveIcon";
import { UserMoveIcon } from "./icons/UserMoveIcon";
import { UserMuteIcon } from "./icons/UserMuteIcon";
import { UserStayIcon } from "./icons/UserStayIcon";
import { UserStreamIcon } from "./icons/UserStreamIcon";
import { UserVideoIcon } from "./icons/UserVideoIcon";

const MoveTypes = [
    { name: "Join", value: "Join" },
    { name: "Leave", value: "Leave" },
    { name: "Move", value: "Move" },
    { name: "Stay", value: "Stay" },
];

const UpdateTypes = [
    { name: "Self Mute", value: "SelfMute" },
    { name: "Self Unmute", value: "SelfUnmute" },
    { name: "Self Deaf", value: "SelfDeaf" },
    { name: "Self Undeaf", value: "SelfUndeaf" },
    { name: "Guild Mute", value: "GuildMute" },
    { name: "Guild Unmute", value: "GuildUnmute" },
    { name: "Guild Deaf", value: "GuildDeaf" },
    { name: "Guild Undeaf", value: "GuildUndeaf" },
    { name: "Start Stream", value: "SelfStartStream" },
    { name: "Stop Stream", value: "SelfStopStream" },
    { name: "Start Video", value: "SelfStartVideo" },
    { name: "Stop Video", value: "SelfStopVideo" },
];

const StateTypes = [
    { name: "Self Mute", value: "SelfMute" },
    { name: "Self Deaf", value: "SelfDeaf" },
    { name: "Guild Mute", value: "GuildMute" },
    { name: "Guild Deaf", value: "GuildDeaf" },
    { name: "Stream", value: "SelfStream" },
    { name: "Video", value: "SelfVideo" },
];

const FilterSections = [
    { name: "Move Types", types: MoveTypes, key: "move_types" },
    { name: "Update Types", types: UpdateTypes, key: "update_types" },
    { name: "State Types", types: StateTypes, key: "states" },
];

let filtersCache = {
    update_types: [] as TVoiceUpdateType[],
    move_types: [] as TVoiceMoveType[],
    states: [] as TVoiceStateType[]
};

export function VoiceLogModal(props: { modalProps: ModalProps; search?: string; }) {
    const [showFilters, setShowFilters] = React.useState(false);
    const [filters, setFilters] = React.useState({ ...filtersCache });
    const [search, setSearch] = React.useState(props.search || "");
    const [voiceLogs, setVoiceLogs] = React.useState<TVoiceLog[]>([]);

    React.useEffect(() => {
        getVoiceLogs().then(logs => {
            setVoiceLogs(logs);
        });
    }, []);

    React.useEffect(() => {
        filtersCache = { ...filters };
    }, [filters]);

    const results = React.useMemo(() => voiceLogs.filter(log => {
        const searchLower = search.toLowerCase().trim();
        if (searchLower === "") return true;
        return log.user_id === searchLower ||
            log.channel_id === searchLower ||
            log.old_channel_id === searchLower ||
            log.guild_id === searchLower ||
            log.cache_user?.username?.toLowerCase()?.includes(searchLower) ||
            log.cache_user?.global_name?.toLowerCase()?.includes(searchLower) ||
            log.cache_channel?.name?.toLowerCase()?.includes(searchLower) ||
            log.cache_old_channel?.name?.toLowerCase()?.includes(searchLower) ||
            log.cache_guild?.name?.toLowerCase()?.includes(searchLower);
    }).filter(log => {
        const showAll = filters.move_types.length === 0 && filters.update_types.length === 0 && filters.states.length === 0;
        if (showAll) return true;
        if (filters.move_types.length > 0 && filters.move_types.includes(log.move_type)) return true;
        if (filters.update_types.length > 0 && filters.update_types.some(ut => log.update_types.includes(ut))) return true;
        if (filters.states.length > 0 && filters.states.some(s => log.states.includes(s))) return true;
        return false;
    }).slice(0, settings.store.voiceLogSize), [search, filters, voiceLogs]);

    return (
        <ModalRoot {...props.modalProps} size={ModalSize.LARGE} className="bvl-modal">
            <ModalHeader className="bvl-header">
                <Text variant="heading-xl/medium">Better Voice Log</Text>
                <div className="bvl-header-buttons">
                    <button className="bvl-icon-button" onClick={() => {
                        getVoiceLogs().then(logs => {
                            setVoiceLogs(logs);
                        });
                    }}>
                        <TooltipContainer text="Refresh">
                            <RefreshIcon hoverable />
                        </TooltipContainer>
                    </button>
                    <div className="bvl-filters-container">
                        <button className="bvl-icon-button" onClick={() => setShowFilters(!showFilters)}>
                            <TooltipContainer text="Filters">
                                <FilterIcon hoverable />
                            </TooltipContainer>
                        </button>
                        {showFilters && (<ScrollerThin className="bvl-filters">
                            {FilterSections.map(section => (
                                <div key={section.name} className="bvl-filter-section">
                                    <Text variant="heading-md/semibold">{section.name}</Text>
                                    {section.types.map(type => (
                                        <Checkbox
                                            key={type.value}
                                            value={filters[section.key].includes(type.value as TVoiceUpdateType)}
                                            onChange={() => {
                                                setFilters(prev => ({
                                                    ...prev,
                                                    [section.key]: prev[section.key].includes(type.value as TVoiceUpdateType)
                                                        ? prev[section.key].filter(t => t !== type.value)
                                                        : [...prev[section.key], type.value as TVoiceUpdateType],
                                                }));
                                            }}
                                        >
                                            {type.name}
                                        </Checkbox>
                                    ))}
                                </div>
                            ))}
                        </ScrollerThin>)}
                    </div>
                    <ModalCloseButton onClick={props.modalProps.onClose} />
                </div>
            </ModalHeader>
            <ModalContent className="bvl-content">
                <TextInput
                    className="search-input"
                    placeholder="Search by user, channel, or guild"
                    value={search}
                    onChange={v => setSearch(v)}
                ></TextInput>
                <div className="bvl-result-count">
                    <SearchIcon />
                    <Text variant="heading-sm/medium">
                        {results.length}/{Math.min(settings.store.voiceLogSize, voiceLogs.length)}/{voiceLogs.length} results
                    </Text>
                </div>
                <div className="bvl-results">
                    {results.map(log => (
                        <div
                            key={`${log.guild_id}-${log.channel_id}-${log.user_id}-${log.at}`}
                            className="bvl-log"
                            data-move-type={log.move_type}
                            onContextMenu={e => {
                                ContextMenuApi.openContextMenu(e, () => <VoiceLogContextMenu log={log} />);
                            }}
                        >
                            <div className="move-icon">
                                <TooltipContainer text={log.move_type}>
                                    {log.move_type === "Join" && <UserJoinIcon />}
                                    {log.move_type === "Leave" && <UserLeaveIcon />}
                                    {log.move_type === "Move" && <UserMoveIcon />}
                                    {log.move_type === "Stay" && <UserStayIcon />}
                                </TooltipContainer>
                            </div>

                            <div className="bottom-right">
                                {log.states.length > 0 && <div className="status-icons">
                                    <Text variant="heading-sm/medium" className="text">Statuses:</Text>
                                    {log.states.includes("SelfMute") && <TooltipContainer text="Self Mute"><UserMuteIcon /></TooltipContainer>}
                                    {log.states.includes("SelfDeaf") && <TooltipContainer text="Self Deaf"><UserDeafIcon /></TooltipContainer>}
                                    {log.states.includes("GuildMute") && <TooltipContainer text="Guild Mute"><UserMuteIcon className="guild-icon" /></TooltipContainer>}
                                    {log.states.includes("GuildDeaf") && <TooltipContainer text="Guild Deaf"><UserDeafIcon className="guild-icon" /></TooltipContainer>}
                                    {log.states.includes("SelfStream") && <TooltipContainer text="Stream"><UserStreamIcon /></TooltipContainer>}
                                    {log.states.includes("SelfVideo") && <TooltipContainer text="Video"><UserVideoIcon /></TooltipContainer>}
                                </div>}


                                {log.update_types.length > 0 && <div className="update-icons">
                                    <Text variant="heading-sm/medium" className="text">Updates:</Text>
                                    {log.update_types.includes("SelfMute") && <TooltipContainer text="Self Mute"><UserMuteIcon /></TooltipContainer>}
                                    {log.update_types.includes("SelfUnmute") && <TooltipContainer text="Self Unmute"><UserMuteIcon className="stop" /></TooltipContainer>}
                                    {log.update_types.includes("SelfDeaf") && <TooltipContainer text="Self Deaf"><UserDeafIcon /></TooltipContainer>}
                                    {log.update_types.includes("SelfUndeaf") && <TooltipContainer text="Self Undeaf"><UserDeafIcon className="stop" /></TooltipContainer>}
                                    {log.update_types.includes("GuildMute") && <TooltipContainer text="Guild Mute"><UserMuteIcon className="guild-icon" /></TooltipContainer>}
                                    {log.update_types.includes("GuildUnmute") && <TooltipContainer text="Guild Unmute"><UserMuteIcon className="guild-icon stop" /></TooltipContainer>}
                                    {log.update_types.includes("GuildDeaf") && <TooltipContainer text="Guild Deaf"><UserDeafIcon className="guild-icon" /></TooltipContainer>}
                                    {log.update_types.includes("GuildUndeaf") && <TooltipContainer text="Guild Undeaf"><UserDeafIcon className="guild-icon stop" /></TooltipContainer>}
                                    {log.update_types.includes("SelfStartStream") && <TooltipContainer text="Start Stream"><UserStreamIcon /></TooltipContainer>}
                                    {log.update_types.includes("SelfStopStream") && <TooltipContainer text="Stop Stream"><UserStreamIcon className="stop" /></TooltipContainer>}
                                    {log.update_types.includes("SelfStartVideo") && <TooltipContainer text="Start Video"><UserVideoIcon /></TooltipContainer>}
                                    {log.update_types.includes("SelfStopVideo") && <TooltipContainer text="Stop Video"><UserVideoIcon className="stop" /></TooltipContainer>}
                                </div>}

                            </div>

                            <div className="guild">
                                <img
                                    className="icon"
                                    src={log.cache_guild?.icon ? `https://cdn.discordapp.com/icons/${log.guild_id}/${log.cache_guild.icon}.png` : "https://cdn.discordapp.com/embed/avatars/1.png"}
                                    alt={log.cache_guild?.name}
                                    loading="lazy"
                                    draggable="false"
                                />
                                <Text variant="heading-sm/medium" className="name">{log.cache_guild?.name}</Text>
                            </div>
                            <div className="channel">
                                {(log.cache_old_channel && log.old_channel_id !== log.channel_id) && (<>
                                    <Text variant="heading-sm/medium" className="name">{log.cache_old_channel?.name}</Text>
                                    {log.cache_channel && <ArrowRightIcon />}
                                </>)}
                                <Text variant="heading-sm/medium" className="name">{log.cache_channel?.name}</Text>
                            </div>
                            <div className="user">
                                <img
                                    className="icon"
                                    src={log.cache_user?.avatar ? `https://cdn.discordapp.com/avatars/${log.user_id}/${log.cache_user.avatar}.png` : "https://cdn.discordapp.com/embed/avatars/0.png"}
                                    alt={log.cache_user?.username}
                                    loading="lazy"
                                    draggable="false"
                                />
                                {log.cache_user?.global_name ? (
                                    <>
                                        <Text variant="heading-sm/medium" className="name">{log.cache_user?.global_name}</Text>
                                        <Text variant="heading-sm/normal" className="alt-text">{log.cache_user?.username}</Text>
                                    </>
                                ) : (
                                    <Text variant="heading-sm/medium" className="name">{log.cache_user?.username}</Text>
                                )}
                            </div>
                            <div className="time">
                                <Text variant="heading-sm/medium" className="alt-text">{new Date(log.at).toLocaleString()}</Text>
                            </div>
                        </div>
                    ))}
                </div>
            </ModalContent>
        </ModalRoot>
    );
}

export function openVoiceLogModal(search = "") {
    const key = openModal(modalProps => (
        <VoiceLogModal
            modalProps={modalProps}
            search={search}
        />
    ));
}
