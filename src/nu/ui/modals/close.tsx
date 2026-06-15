/*
 * Nun, a Discord client mod
 * Copyright (c) 2026 o9
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { React } from "@webpack/common";
import Button from "../base/button";


export default function CloseButton({ onClick }: { onClick?: () => void; }) {
    return <Button
        className="nu-close-button"
        size={Button.Sizes.ICON}
        look={Button.Looks.BLANK}
        color={Button.Colors.TRANSPARENT}
        onClick={onClick}
    >
        X
        {/* <XIcon size="24px" /> */}
    </Button>;
}