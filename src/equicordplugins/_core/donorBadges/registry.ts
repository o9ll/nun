/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import type { DonorBadge } from "./types";

// ─── Donor badge registry ────────────────────────────────────────────────────
// No donors yet. When you add one, create its image file and data file inside
// donors/ (same pattern as founders.image.ts + founders.ts used before), then
// import the data here and add it to the array. Example:
//   import someDonor from "./donors/someDonor";
//   export const DONOR_BADGES = [someDonor];
//
// Note: the special Founder badge (the trophy) is not listed here — it lives
// in src/equicordplugins/_core/founderBadge/ (separate from donors).

// TODO(placeholder): intentionally empty — while this stays empty,
// NunDonorBadges does not register any badge (start()/stop() have no effect).
// Fill it in once donors join.
export const DONOR_BADGES: readonly DonorBadge[] = [];
