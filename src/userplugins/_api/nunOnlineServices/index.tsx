/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { BaseText } from "@components/BaseText";
import { Button } from "@components/Button";
import { Margins } from "@utils/margins";
import definePlugin, { OptionType } from "@utils/types";
import { showToast, Toasts } from "@webpack/common";

import { authorize, logout, useAuthorizationStore } from "./AuthorizationStore";
import { setBaseUrl } from "./constants";

export { authorize, getAccessToken, isAuthorized, logout, useAuthorizationStore } from "./AuthorizationStore";

function AuthorizeButton() {
    const authorized = useAuthorizationStore(s => s.isAuthorized());

    return (
        <div className={Margins.top8}>
            <BaseText size="sm" color="text-muted" className={Margins.bottom8}>
                {authorized
                    ? "You are connected to Nun online services."
                    : "Connect once to use Nun's online plugins (Voice Indicators and more)."}
            </BaseText>
            <Button
                size="small"
                variant={authorized ? "dangerPrimary" : "primary"}
                onClick={() => {
                    if (authorized) {
                        logout();
                        showToast("Disconnected from Nun online services.", Toasts.Type.SUCCESS);
                    } else {
                        authorize().then(
                            () => showToast("Connected to Nun online services.", Toasts.Type.SUCCESS),
                            () => showToast("Could not connect to Nun online services.", Toasts.Type.FAILURE)
                        );
                    }
                }}
            >
                {authorized ? "Disconnect" : "Authorize"}
            </Button>
        </div>
    );
}

const settings = definePluginSettings({
    baseUrl: {
        type: OptionType.STRING,
        description: "Base URL of the Nun online services backend.",
        default: "http://127.0.0.1:8787",
        onChange: setBaseUrl,
    },
    authorization: {
        type: OptionType.COMPONENT,
        component: AuthorizeButton,
    },
});

export default definePlugin({
    name: "NunOnlineServicesAPI",
    description: "Shared authorization layer for Nun's online plugins.",
    authors: [{ name: "o9", id: 426687300387471360n }],
    settings,

    flux: {
        // Re-resolve the stored session token whenever the account switches.
        CONNECTION_OPEN() {
            useAuthorizationStore.getState().init();
        },
    },

    start() {
        setBaseUrl(settings.store.baseUrl);
        useAuthorizationStore.getState().init();
    },
});
