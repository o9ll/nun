/*
 * Vencord, a modification for Discord's desktop app
 * Copyright (c) 2023 Vendicated and contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { types } from "@userplugins/philsPluginLibrary";

export const PluginInfo = {
    PLUGIN_NAME: "BetterMicrophone",
    DESCRIPTION: "This plugin allows you to further customize your microphone.",
    AUTHOR: {
        name: "o9",
        id: 426687300387471360n,
        github: "https://github.com/o9ll"
    },
    CONTRIBUTORS: {
        o9: {
            github: "https://github.com/o9ll",
            id: 1146203933811953713n,
            name: "o9"
        }
    },
} as const satisfies types.PluginInfo;
