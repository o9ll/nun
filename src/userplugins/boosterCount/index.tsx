/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { NavContextMenuPatchCallback } from "@api/ContextMenu";
import ErrorBoundary from "@components/ErrorBoundary";
import { Flex } from "@components/Flex";
import { openUserProfile } from "@utils/discord";
import { Logger } from "@utils/Logger";
import { closeModal, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalRoot, ModalSize, openModal } from "@utils/modal";
import definePlugin from "@utils/types";
import { FluxDispatcher, GuildMemberStore, IconUtils, Menu, RestAPI, ScrollerThin, Text, useEffect, UserStore, useStateFromStores } from "@webpack/common";

const logger = new Logger("BoostCounts");

async function openViewBoosters(guildId: string) {
    const boosters = await fetchBoosters(guildId);
    const key = openModal(props => (
        <ErrorBoundary>
            <ModalRoot {...props} size={ModalSize.LARGE}>
                <ModalHeader>
                    <Text variant="heading-lg/semibold" style={{ flexGrow: 1 }}>Boosters</Text>
                    <ModalCloseButton onClick={() => closeModal(key)} />
                </ModalHeader>
                <ModalContent>
                    <UserList guildId={guildId} boosters={boosters} />
                </ModalContent>
                <ModalFooter>
                    <Flex cellSpacing={10} />
                </ModalFooter>
            </ModalRoot>
        </ErrorBoundary>
    ));
}

function MakeContextCallback(): NavContextMenuPatchCallback {
    return (children, props) => {
        const { guild } = props;
        if (!guild) return;

        const lastChild = children.at(-1);
        if (lastChild?.key === "developer-actions") {
            const p = lastChild.props;
            if (!Array.isArray(p.children)) p.children = [p.children];
            children = p.children;
        }

        children.splice(-1, 0,
            <Menu.MenuItem
                id="vc-view-boosts"
                label="View Boosters"
                action={() => openViewBoosters(guild.id)}
                icon={BoostIcon}
            />
        );
    };
}

export default definePlugin({
    name: "BoostCounts",
    description: "Shows all the boosters in the server and the number of boosts for each booster.",
    authors: [{ name: "Raf", id: 121253596753952768n }, { name: "Streets", id: 463495065407586304n }],
    contextMenus: {
        "guild-context": MakeContextCallback()
    }
});

async function fetchBoosters(guildId: string): Promise<Record<string, number>> {
    const { body } = await RestAPI.get({ url: `/guilds/${guildId}/premium/subscriptions` });
    const boosters: Record<string, number> = {};
    for (const boost of body) {
        boosters[boost.user.id] = (boosters[boost.user.id] ?? 0) + 1;
    }
    return boosters;
}

function UserList({ guildId, boosters }: { guildId: string; boosters: Record<string, number>; }) {
    const missing: string[] = [];
    const members: string[] = [];

    for (const id of Object.keys(boosters)) {
        if (GuildMemberStore.isMember(guildId, id)) members.push(id);
        else missing.push(id);
    }

    useStateFromStores(
        [GuildMemberStore],
        () => GuildMemberStore.getMemberIds(guildId),
        null,
        (old, curr) => old?.length === curr?.length
    );

    useEffect(() => {
        if (missing.length > 0) {
            FluxDispatcher.dispatch({
                type: "GUILD_MEMBERS_REQUEST",
                guildIds: [guildId],
                userIds: missing
            });
        }
    }, []);

    return (
        <ScrollerThin fade>
            {members.map(id => {
                const user = UserStore.getUser(id);
                if (!user) {
                    logger.info("No user for id", id);
                    return null;
                }

                return (
                    <Flex key={id} style={{ alignItems: "center", marginBottom: "10px", gap: "12px" }}>
                        <Text variant="text-md/bold" style={{ minWidth: "24px", textAlign: "center" }}>
                            {boosters[id]}x
                        </Text>
                        <Flex
                            style={{ alignItems: "center", cursor: "pointer", gap: "10px" }}
                            onClick={() => openUserProfile(id)}
                        >
                            <img
                                src={IconUtils.getUserAvatarURL(user, false, 32)}
                                width={32}
                                height={32}
                                style={{ borderRadius: "50%" }}
                                alt={`${user.username}'s avatar`}
                            />
                            <Text variant="text-md/medium">
                                {user.globalName ?? user.username}
                            </Text>
                        </Flex>
                    </Flex>
                );
            })}
        </ScrollerThin>
    );
}

function BoostIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="white" stroke="white" width="18" height="18" viewBox="0 0 24 24">
            <path fill="#000" fillRule="evenodd" d="M11.68 1.616a.5.5 0 0 1 .64 0l6 5A.5.5 0 0 1 18.5 7v10a.5.5 0 0 1-.18.384l-6 5a.5.5 0 0 1-.64 0l-6-5A.5.5 0 0 1 5.5 17V7a.5.5 0 0 1 .18-.384l6-5ZM6.5 7.234v9.532l5.5 4.583 5.5-4.583V7.234L12 2.651 6.5 7.234Z" clipRule="evenodd" />
            <path fill="#000" fillRule="evenodd" d="M11.662 5.631a.5.5 0 0 1 .676 0l3 2.75a.5.5 0 0 1 .162.369v6.5a.5.5 0 0 1-.162.369l-3 2.75a.5.5 0 0 1-.676 0l-3-2.75a.5.5 0 0 1-.162-.369v-6.5a.5.5 0 0 1 .162-.369l3-2.75ZM9.5 8.97v6.06l2.5 2.292 2.5-2.292V8.97L12 6.678 9.5 8.97Z" clipRule="evenodd" />
            <path fill="#000" fillRule="evenodd" d="M12.5 2.5V6h-1V2.5h1ZM6.224 6.553l3 1.5-.448.894-3-1.5.448-.894Zm12 .894-3 1.5-.448-.894 3-1.5.448.894ZM5.776 16.553l3-1.5.448.894-3 1.5-.448-.894Zm12 .894-3-1.5.448-.894 3 1.5-.448.894ZM11.5 21.5V18h1v3.5h-1Z" clipRule="evenodd" />
        </svg>
    );
}
