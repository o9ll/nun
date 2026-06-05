/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

export function UserLeaveIcon({ hoverable = false }: { hoverable?: boolean; }) {
    return (
        <svg className={`bvl-icon ${hoverable ? "hoverable" : ""}`} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m9 6-6 6 6 6" />
            <path d="M3 12h14" />
            <path d="M21 19V5" />
        </svg>
    );
}
