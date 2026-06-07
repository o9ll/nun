# [<img src="./browser/icon.png" width="40" align="left" alt="Nun">](https://github.com/o9ll/nun) Nun

Nun is a modified version of [Equicord](https://equicord.org/) which is capable of running [BetterDiscord](https://betterdiscord.app/) plugins alongside Equicord ones. It only works on Discord Desktop.

## Installing

Windows

- [GUI](https://github.com/o9ll/nun/releases/latest/download/Nun.exe)
- [CLI](https://github.com/o9ll/nun/releases/latest/download/NunCli.exe)

```shell
sh -c "$(curl -sS https://raw.githubusercontent.com/o9ll/nun/refs/heads/main/misc/install.sh)"
```

## Installing Devbuild

### Dependencies

[Git](https://git-scm.com/download) and [Node.JS LTS](https://nodejs.dev/en/) are required.

Install `pnpm`:

```shell
npm i -g pnpm
```

Clone:

```shell
git clone https://github.com/o9ll/nun
cd nun
```

Install dependencies:

```shell
pnpm install --frozen-lockfile
```

Build:

```shell
pnpm build
```

Inject into your desktop client:

```shell
pnpm inject
```

Build for web:

```shell
pnpm buildWeb
```

## Credits

Thank you to [Vendicated](https://github.com/Vendicated) for creating [Vencord](https://github.com/Vendicated/Vencord) & [Suncord](https://github.com/verticalsync/Suncord) by [verticalsync](https://github.com/verticalsync) for helping when needed.
