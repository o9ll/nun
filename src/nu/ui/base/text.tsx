/*
 * Nun, a Discord client mod
 * Copyright (c) 2026 o9
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { React } from "@webpack/common";
import clsx from "clsx";
import type { CSSProperties, ElementType, HTMLAttributes, PropsWithChildren } from "react";

export const Colors = Object.freeze({
    STANDARD: "text-normal",
    MUTED: "text-muted",
    ERROR: "text-error",
    BRAND: "text-brand",
    LINK: "text-link",
    HEADER_PRIMARY: "header-primary",
    HEADER_SECONDARY: "header-secondary",
    STATUS_YELLOW: "text-yellow",
    STATUS_GREEN: "text-green",
    STATUS_RED: "text-red",
    ALWAYS_WHITE: "text-white",
    CUSTOM: null
});


export const Sizes = Object.freeze({
    SIZE_10: "text-10",
    SIZE_12: "text-12",
    SIZE_14: "text-14",
    SIZE_16: "text-16",
    SIZE_20: "text-20",
    SIZE_24: "text-24",
    SIZE_32: "text-32"
});


type TextProps = PropsWithChildren<{
    tag?: ElementType<HTMLAttributes<HTMLElement>>;
    className?: string;
    color?: typeof Colors[keyof typeof Colors];
    size?: typeof Sizes[keyof typeof Sizes];
    selectable?: boolean;
    strong?: boolean;
    style?: CSSProperties;
    [other: string]: any;
}>;
export default function Text({ tag: Tag = "div", className = "", children = null, color = Colors.STANDARD, size = Sizes.SIZE_14, selectable, strong, style, ...props }: TextProps) {
    return <Tag
        className={
            clsx(
                color, size, className,
                {
                    "selectable": selectable,
                    "text-strong": strong
                }
            )}
        style={style}
        {...props}
    >
        {children}
    </Tag>;
}

Text.Colors = Colors;
Text.Sizes = Sizes;

// te = WebpackModules.getModule(m => m?.Sizes?.SIZE_32 && m.Colors)
// foo = []
// for (const color in te.Colors) foo.push(NuApi.React.createElement(te, {color: te.Colors[color]}, color))
// for (const size in te.Sizes) foo.push(NuApi.React.createElement(te, {size: te.Sizes[size]}, size))
// NuApi.showConfirmationModal("Text Elements", foo)