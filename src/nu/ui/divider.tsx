/*
 * Nun, a Discord client mod
 * Copyright (c) 2026 o9
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { React } from "@webpack/common";
import clsx from "clsx";


export default ({ className, ...props }: React.JSX.IntrinsicElements["hr"]) => <hr {...props} className={clsx("nu-divider", className)} />;