/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

export function UserStreamIcon({ className }: { className?: string; }) {
    return (
        <div className={`bvl-icon bvl-red-dot ${className || ""}`}></div>
    );
}
