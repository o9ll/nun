/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import definePlugin from "@utils/types";
import { ExpressionPickerStore } from "@webpack/common";

let restoreTimer: ReturnType<typeof setTimeout> | undefined;

function suppressGifPickerCloseForTick() {
    const store = ExpressionPickerStore as {
        closePopout?: () => void;
        closeExpressionPicker: () => void;
    };

    const originalCloseExpressionPicker = store.closeExpressionPicker;
    const originalClosePopout = store.closePopout;

    store.closeExpressionPicker = () => { };
    if (originalClosePopout) store.closePopout = () => { };

    if (restoreTimer) clearTimeout(restoreTimer);
    restoreTimer = setTimeout(() => {
        store.closeExpressionPicker = originalCloseExpressionPicker;
        if (originalClosePopout) store.closePopout = originalClosePopout;
    }, 0);
}

export default definePlugin({
    name: "KeepGifPickerOpen",
    description: "Prevents the Discord GIF picker from closing after sending a GIF.",
    authors: [{ name: "pacxwheaa", id: 0n }, { name: "Streets", id: 463495065407586304n }],
    patches: [
        {
            find: "handleSelectGIF=",
            replacement: {
                match: /handleSelectGIF=(\i)=>\{/,
                replace: "$&$self.suppressGifPickerCloseForTick();"
            }
        }
    ],
    suppressGifPickerCloseForTick
});
