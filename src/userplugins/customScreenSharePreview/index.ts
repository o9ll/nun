/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { UserAreaRenderProps } from "@api/UserArea";
import definePlugin from "@utils/types";
import { UserStore } from "@webpack/common";

import { SendCustomScreenSharePreviewImageButton } from "./components/SendCustomScreenSharePreviewImageButton";
import { StreamPreviewChangeIcon } from "./components/StreamPreviewChangeIcon";
import { CustomStreamPreviewState } from "./state";
import { StreamCreateEvent, StreamDeleteEvent } from "./types";
import { parseStreamKey, stopSendingScreenSharePreview } from "./utilities";

export default definePlugin({
    name: "CustomScreenSharePreview",
    description: "Adds the ability to choose your own image as a screen share preview.",
    authors: [{ name: "o9", id: 426687300387471360n }],
    tags: ["Voice", "Utility"],
    dependencies: ["UserAreaAPI"],

    userAreaButton: {
        icon: StreamPreviewChangeIcon,
        render: (props: UserAreaRenderProps) => SendCustomScreenSharePreviewImageButton(props),
    },

    flux: {
        async STREAM_CREATE({ streamKey }: StreamCreateEvent): Promise<void> {
            const { userId } = parseStreamKey(streamKey);

            if (userId !== UserStore.getCurrentUser().id) {
                return;
            }

            CustomStreamPreviewState.setState({
                isStreaming: true,
            });
        },
        async STREAM_DELETE({ streamKey }: StreamDeleteEvent): Promise<void> {
            const { userId } = parseStreamKey(streamKey);

            if (userId !== UserStore.getCurrentUser().id) {
                return;
            }

            CustomStreamPreviewState.setState({
                isStreaming: false,
            });
            stopSendingScreenSharePreview();
        },
    },
});
