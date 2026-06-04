/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import ErrorBoundary from "@components/ErrorBoundary";
import { Tooltip, useRef } from "@webpack/common";
import type { JSX } from "react";

interface CircleBadgeProps {
    /** Pixel size of the badge (width = height). */
    size: number;
    /** Image shown inside the circle — a base64 data: URI or a URL. */
    image: string;
    /** Outer ring (circle) color. */
    ring: string;
    /** Tooltip text shown on hover, also used as the accessible label. */
    tooltip: string;
    /** CSS class carrying this badge's own glow/animation (defined in its styles.css). */
    className: string;
}

/**
 * Shared circular badge drawing: a colored ring with an image clipped inside,
 * wrapped in a hover tooltip. Every Nun badge draws the exact same way —
 * only the image, ring color, tooltip and CSS class differ. Each badge keeps
 * its own data and styling and just calls this one component to draw itself,
 * so the drawing recipe lives in a single place instead of being copied.
 */
export function CircleBadge({ size, image, ring, tooltip, className }: CircleBadgeProps): JSX.Element {
    const gradientId = useRef(`nun-badge-${Math.random().toString(36).slice(2, 9)}`).current;

    return (
        <ErrorBoundary noop>
            <Tooltip text={tooltip} position="top">
                {({ onMouseEnter, onMouseLeave }) => (
                    <div
                        className={className}
                        onMouseEnter={onMouseEnter}
                        onMouseLeave={onMouseLeave}
                        style={{ width: size, height: size }}
                        role="img"
                        aria-label={tooltip}
                    >
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
                    </div>
                )}
            </Tooltip>
        </ErrorBoundary>
    );
}
