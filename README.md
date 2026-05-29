<div align="center">

<kbd>[العربية](README.ar.md)</kbd> &nbsp;|&nbsp; <kbd>**English**</kbd>

---

# [<img src="./browser/icon.png" width="45" align="center" alt="Nun">](https://github.com/o9ll/nun) Nun

### The Enhanced Discord Client Mod

---

[![GitHub Release](https://img.shields.io/github/v/release/o9ll/nun?style=flat&color=5865F2&label=Release)](https://github.com/o9ll/nun/releases/latest)
[![Tests](https://github.com/o9ll/nun/actions/workflows/test.yml/badge.svg?branch=main)](https://github.com/o9ll/nun/actions/workflows/test.yml)
[![Discord](https://img.shields.io/badge/Discord-5865F2?style=flat&logo=discord&logoColor=white)](https://discord.gg/QamdqDNEDa)
[![License](https://img.shields.io/github/license/o9ll/nun?color=green&label=License)](LICENSE)
[![Security Verified](https://img.shields.io/badge/security-verified-brightgreen?style=flat&logo=shield&logoColor=white)](https://github.com/o9ll/nun)

</div>

---

<div align="center">

<table>
<tr>
<td align="center" width="100%">

<br>

### ☕ Like the project? Support its development

<br>

**If you'd like to keep the development going and see more features added,**
**consider supporting me with any amount — even the smallest contribution makes a big difference** 🙏

<br>

[![Ko-fi](https://img.shields.io/badge/☕%20Support%20on%20Ko--fi-FF5E5B?style=for-the-badge&logo=ko-fi&logoColor=white&labelColor=1a1a1a)](https://ko-fi.com/o99)

<br>

> 💡 Your support is the fuel that keeps this project alive and drives continuous improvement

<br>

</td>
</tr>
</table>

</div>

---

## ✨ Featured Plugins

| Plugin | Description |
|--------|-------------|
| **NitroSniper** | Ultra-fast Nitro gift code claimer — scans every channel in real time and redeems codes before anyone else. |
| **FakeDeafen** | Smart spoofing — appear deafened to other server members while still hearing everything perfectly. |
| **MessageBookmarks** | Local bookmark system — save important messages or code snippets and jump back to them with a single click, no server pins needed. |
| **BetterAudioPlayer** | Enhanced audio engine — enables true stereo quality with a built-in control panel and advanced frequency processing. |
| **MessageLoggerEnhanced** | Advanced message logger — tracks deleted and edited messages and attachments with smart memory management to prevent slowdowns during long sessions. |
| **BigFileUploadEnhanced** | Unlimited external upload — bypass Discord's upload limit via multiple hosting options (Catbox, Litterbox, and more), fully localized, works on both browser and desktop. |
| **MessageInsight** | Three-in-one message analysis toolkit: **EditDiff** shows a word-level diff of every edit a message went through; **ReplyTree** lists all loaded replies to any message with one-click jump navigation; **ChannelBrief** notifies you how many new messages arrived while you were away from a channel. |
| **MessageBookmarks** | Private message bookmarks — save any message to a personal list (unlike server Pins, only you can see these), categorize them as General / Important / Later, search across all saved messages, and jump back with one click. Stored locally. |

---

## 📖 About

**Nun** is the Enhanced distribution of [Equicord](https://github.com/Equicord/Equicord), which is itself a fork of [Vencord](https://github.com/Vendicated/Vencord).

### What sets Nun apart

- ⚡ **Superior performance** — custom optimizations for a faster, lighter experience
- 🌐 **Full localization** — all 300+ plugin descriptions translated; switch languages instantly in settings
- 🔧 **Customizations** — plugins and tweaks from our team you won't find anywhere else
- 🧩 **300+ plugins** — all original Equicord plugins plus exclusive additions
- 🔒 **Security verified** — comprehensive security audit with zero dependency vulnerabilities
- 🔄 **Continuously updated** — daily upstream sync with Equicord, always staying current

---

## 📥 Installation

### Supported Platforms

| Platform | Method | Download |
|----------|--------|----------|
| 🪟 **Windows** | GUI Installer | [![Windows Setup](https://img.shields.io/badge/Windows-NunSetup.exe-0078D4?style=flat&logo=windows&logoColor=white)](https://github.com/o9ll/nun/releases/latest/download/NunSetup.exe) |
| 🍎 **macOS** | Apple Silicon & Intel | [![macOS Script](https://img.shields.io/badge/macOS-Shell_Script-000000?style=flat&logo=apple&logoColor=white)](https://github.com/o9ll/nun/releases/latest/download/NunMacOSInstaller.sh) |
| 🐧 **Linux** | Automated CLI script | [![Linux Script](https://img.shields.io/badge/Linux-Shell_Script-FCC624?style=flat&logo=linux&logoColor=black)](https://github.com/o9ll/nun/releases/latest/download/NunLinuxInstaller.sh) |

> All releases are available on the [**Releases**](https://github.com/o9ll/nun/releases) page.

---

### 🪟 Windows

Download **NunSetup.exe** and run it — it automatically detects Discord and applies the patch.

### 🍎 macOS — Apple Silicon & Intel

```bash
curl -fsSL https://github.com/o9ll/nun/releases/latest/download/NunMacOSInstaller.sh | bash
```

The script auto-detects your processor (ARM64 / Intel) and supports all Discord variants (Stable, PTB, Canary).

### 🐧 Linux

```bash
curl -fsSL https://github.com/o9ll/nun/releases/latest/download/NunLinuxInstaller.sh | bash
```

Supports Ubuntu/Debian, Fedora/RHEL, Arch Linux, Flatpak, and Snap installations.

---

## 🌐 Language Toggle

Nun ships with a built-in **language switch**.

1. Open Discord **Settings → Nun**
2. Toggle **"Mode"** on or off
3. Plugin names and descriptions in the plugin list update instantly — no restart needed

> When Mode is **off**, all plugin descriptions revert to English.
> Plugin option labels inside individual plugin modals follow the same setting.

---

## 🛠️ Building from Source (Devbuild)

### Requirements

- [Git](https://git-scm.com/download)
- [Node.JS LTS](https://nodejs.dev/en/)

### Steps

**1. Install pnpm**

> This step may require admin/root privileges. Close and reopen your terminal after installing.

```shell
npm i -g pnpm
```

> ⚠️ **Important:** Do **not** use an elevated terminal for the following steps — it can corrupt your Discord installation.

**2. Clone the repository**

```shell
git clone https://github.com/o9ll/nun
cd Nun
```

**3. Install dependencies**

```shell
pnpm install --frozen-lockfile
```

**4. Build**

```shell
pnpm build
```

**5. Inject Nun into Discord**

```shell
pnpm inject
```

**6. Build the web extension (optional)**

```shell
pnpm buildWeb
```

After building, find the ZIP file in the `dist` folder and load it as an extension in your browser.

> Note: The Firefox extension requires [Firefox for Developers](https://www.mozilla.org/en-US/firefox/developer/).

---

## Support

<div align="center">

[![Ko-fi](https://img.shields.io/badge/☕%20Support%20on%20Ko--fi-FF5E5B?style=for-the-badge&logo=ko-fi&logoColor=white&labelColor=1a1a1a)](https://ko-fi.com/o99)

</div>

If Nun has been useful to you, you can support us by:

- ☕ **Donating** via [Ko-fi](https://ko-fi.com/o99) — helps fund continued development
- ⭐ **Starring** the repository on GitHub
- 📢 **Sharing** the project with friends
- 💬 **Joining** the Discord server and contributing: **[discord.gg/QamdqDNEDa](https://discord.gg/QamdqDNEDa)**
- 🐛 **Reporting** bugs or suggestions via [Issues](https://github.com/o9ll/nun/issues)

Your support is what keeps this project alive and improving! 💪

---

## 🙏 Acknowledgements

- [Vendicated](https://github.com/Vendicated) — for creating [Vencord](https://github.com/Vendicated/Vencord)
- [Equicord Team](https://github.com/Equicord) — for building [Equicord](https://github.com/Equicord/Equicord) on top of Vencord
- [verticalsync](https://github.com/verticalsync) — for creating [Suncord](https://github.com/verticalsync/Suncord)

---

## 📊 Star History

<a href="https://star-history.com/#o9ll/nun&Timeline">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=o9ll/nun&type=Timeline&theme=dark" />
    <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=o9ll/nun&type=Timeline" />
    <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=o9ll/nun&type=Timeline" />
  </picture>
</a>

---

## ⚠️ Disclaimer

Discord is a registered trademark of Discord Inc. This project is not affiliated with or endorsed by Discord Inc.

<details>
<summary>Using Nun violates Discord's Terms of Service</summary>

Client modifications conflict with Discord's Terms of Service.

However, Discord does not typically take strict action against users of client modifications, and there are no documented cases of account bans for this reason alone — as long as abusive plugins are not used.

If your account is critically important to you, it's safest to avoid all client modifications as a precaution.

</details>

---

## 📜 Credits & License

> [!IMPORTANT]
> This project is a fork of the original [Equicord](https://github.com/Equicord/Equicord) project. All credits for the core engine and framework belong to the original creators. This version is a specialized distribution managed by o9 under the name **Nun**.

### Key enhancements in this version

- 🌍 **Full localization** — instant language switching in settings
- 🎨 **Modern UI/UX** — clean, professional redesign
- 🛡️ **Security & metadata optimizations** — hardened dependency chain

**Maintained by:** [o9](https://github.com/o9ll)
**Original project:** [Equicord](https://github.com/Equicord/Equicord)

---

<div align="center">

**Nun** • Made with ❤️ by o9 • [GPL-3.0 License](LICENSE)

[⬆ Back to top](#)

</div>
