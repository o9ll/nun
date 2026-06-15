/*
 * Nun, a Discord client mod
 * Copyright (c) 2026 o9
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

package main

import (
	"image/color"
	"vencordinstaller/buildinfo"
)

const ReleaseUrl = "https://api.github.com/repos/o9ll/nun/releases/290026220"
const InstallerReleaseUrl = "https://api.github.com/repos/o9ll/nun/releases/291054553"

var UserAgent = "NunInstaller/" + buildinfo.InstallerGitHash + " (https://github.com/o9ll/nun)"

var (
	DiscordGreen  = color.RGBA{R: 0x2D, G: 0x7C, B: 0x46, A: 0xFF}
	DiscordRed    = color.RGBA{R: 0xEC, G: 0x41, B: 0x44, A: 0xFF}
	DiscordBlue   = color.RGBA{R: 0x58, G: 0x65, B: 0xF2, A: 0xFF}
	DiscordYellow = color.RGBA{R: 0xfe, G: 0xe7, B: 0x5c, A: 0xff}
)

var ForkInstallNames = []string{
	"Vencord",
	"Equicord",
	"BetterVencord",
	"Lightcord",
}
