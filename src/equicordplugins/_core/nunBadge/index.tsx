/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./styles.css";

import { addProfileBadge, BadgePosition, BadgeUserArgs, ProfileBadge, removeProfileBadge } from "@api/Badges";
import { addMessageDecoration, removeMessageDecoration } from "@api/MessageDecorations";
import ErrorBoundary from "@components/ErrorBoundary";
import definePlugin from "@utils/types";
import { Tooltip, useRef } from "@webpack/common";
import type { JSX } from "react";

const BADGE_ID = "nun-brand";

// ─── Authorized user list ──────────────────────────────────────────────────────
// Stored as base64(discordSnowflakeId) — light obfuscation only.
// To add a user:  btoa("their-discord-id")  → paste result below.
// To remove:      delete the entry.
const _ENCODED = [
    "MTE0NjIwMzkzMzgxMTk1MzcxMw==",
];

const BADGE_USERS: ReadonlySet<string> = new Set(_ENCODED.map(atob));

function hasBadge(userId: string): boolean {
    return BADGE_USERS.has(userId);
}

// ─── Badge visual — circular project icon with gold ring ─────────────────────

const PROJECT_ICON = "data:image/png;base64,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";

function NunBadgeIcon({ size }: { size: number; }): JSX.Element {
    const gradientId = useRef(`nun-${Math.random().toString(36).slice(2, 9)}`).current;
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 1024 1024"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
        >
            <defs>
                <linearGradient
                    id={gradientId}
                    x1="0%"
                    x2="100%"
                    y1="0%"
                    y2="100%"
                >
                    <stop offset="0%" stopColor="#33cfff" />
                    <stop offset="100%" stopColor="#7b2cff" />
                </linearGradient>
            </defs>

            <path
                fill={`url(#${gradientId})`}
                d="M684 238c46 2 89 15 128 41 41 29 71 65 84 114 6 24 7 47 5 72-5 39-21 73-43 105-37 52-70 106-104 159-24 39-48 77-74 115-6 10-15 15-28 14-2-1-55-2-82-9-9-2-10-5-5-13l73-109 44-66 2-6h-20a206 206 0 0 1-102-31c-7-6-8-10-3-18l27-41 13-17c4-5 9-7 15-5 13 4 26 10 40 12 52 9 97-4 130-48 12-15 18-34 20-53 7-66-46-117-99-127-41-7-79 0-112 26-27 21-42 49-45 83-1 22-3 45-9 66-20 67-63 112-129 134-29 11-60 13-92 10-42-3-80-16-114-41a199 199 0 0 1-44-282 210 210 0 0 1 202-84 246 246 0 0 1 66 18c8 3 10 8 6 16l-16 31-9 19c-5 7-11 10-19 8-19-4-38-8-57-6-47 2-85 20-109 62-11 18-15 38-15 59 1 56 42 101 98 111 29 6 58 3 85-10 29-15 48-39 57-71 3-13 4-26 5-39 1-47 17-89 47-124 34-40 78-63 129-72 18-4 36-3 54-3"
            />
        </svg>
    );
}

function NunBadge({ size }: { size: number; }): JSX.Element {
    return (
        <ErrorBoundary noop>
            <Tooltip text="Nun" position="top">
                {({ onMouseEnter, onMouseLeave }) => (
                    <div
                        className="nun-badge"
                        onMouseEnter={onMouseEnter}
                        onMouseLeave={onMouseLeave}
                        style={{ width: size, height: size }}
                        role="img"
                        aria-label="Nun"
                    >
                        <NunBadgeIcon size={size} />
                    </div>
                )}
            </Tooltip>
        </ErrorBoundary>
    );
}

// ─── Profile badge ────────────────────────────────────────────────────────────

const profileBadge: ProfileBadge = {
    id: BADGE_ID,
    key: BADGE_ID,
    description: "Nun",
    position: BadgePosition.START,
    shouldShow: ({ userId }: BadgeUserArgs) => hasBadge(userId),
    component: (_props: ProfileBadge & BadgeUserArgs) => <NunBadge size={22} />,
};

// ─── Core module ──────────────────────────────────────────────────────────────
// required: true → cannot be disabled
// hidden: true   → not listed in plugin settings

export default definePlugin({
    name: "NunBadge",
    description: "Nun badge",
    authors: [],
    required: true,
    hidden: true,
    dependencies: ["BadgesAPI", "MessageDecorationsAPI"],

    start() {
        addProfileBadge(profileBadge);

        addMessageDecoration(BADGE_ID, ({ message }) => {
            if (!hasBadge(message?.author?.id ?? "")) return null;
            return <NunBadge size={18} />;
        });
    },

    stop() {
        removeProfileBadge(profileBadge);
        removeMessageDecoration(BADGE_ID);
    },
});
