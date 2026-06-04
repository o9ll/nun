/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./styles.css";

import { addProfileBadge, BadgePosition, BadgeUserArgs, ProfileBadge, removeProfileBadge } from "@api/Badges";
import definePlugin from "@utils/types";

import { CircleBadge } from "../_shared/CircleBadge";
import { FOUNDERS_IMAGE } from "./image";

const BADGE_ID = "nun-founder";
const RING = "#a01b2d";
const NAME = "Staff · إدارة";

// ─── Authorized IDs ──────────────────────
const FOUNDER_IDS: ReadonlySet<string> = new Set([
    "1146203933811953713",
    "426687300387471360",
    "1143882902032105472",
    "1138447342119440404",
    "409358829101514793",
    "432612760782635008",
    "1020801845490356245",
]);

const profileBadge: ProfileBadge = {
    id: BADGE_ID,
    key: BADGE_ID,
    description: NAME,
    position: BadgePosition.START,
    shouldShow: ({ userId }: BadgeUserArgs) => FOUNDER_IDS.has(userId),
    component: () => (
        <CircleBadge size={22} image={FOUNDERS_IMAGE} ring={RING} tooltip={NAME} className="nun-founder-badge" />
    ),
};

// required: true → cannot be disabled; hidden: true → not listed in settings
export default definePlugin({
    name: "NunFounderBadge",
    description: "Special staff badge",
    authors: [],
    required: true,
    hidden: true,
    dependencies: ["BadgeAPI"],

    start() {
        addProfileBadge(profileBadge);
    },

    stop() {
        removeProfileBadge(profileBadge);
    },
});
