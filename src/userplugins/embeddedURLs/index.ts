/*
 * Nun, a Discord client mod
 * Copyright (c) 2026 o9
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import definePlugin from "@utils/types";

const urlMap = new Map<string, string>([
    ["https://www.tiktok.com", "https://www.tnktok.com"],
    ["https://vt.tiktok.com", "https://www.tnktok.com"],
    ["https://x.com", "https://www.fxtwitter.com"],
    ["https://www.twitter.com", "https://www.fxtwitter.com"],
    ["https://www.instagram.com", "https://www.kkinstagram.com"]
]);

export default definePlugin({
    name: "EmbeddedURLs",
    description: "Turns plain social links into embeddable URLs so posts and videos are fully viewable in Discord instead of forcing users to open the external site.",
    authors: [{ name: "o9", id: 426687300387471360n }],
    tags: ["Nun"],

    replaceUrl(originalUrl: string): string {
        let newUrl: URL;
        try {
            newUrl = new URL(originalUrl);
        } catch {
            return originalUrl;
        }
        const replacement = urlMap.get(newUrl.origin);
        if (replacement) return replacement + newUrl.pathname + newUrl.search;
        return originalUrl;
    },

    onBeforeMessageSend(_, msg) {
        if (/https:\/\//.test(msg.content)) {
            msg.content = this.replaceUrl(msg.content);
        }
    }
});
