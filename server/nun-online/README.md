# nun-online

Self-hosted backend for **NunOnlineServicesAPI** and **VoiceIndicators**.

One process serves both:

- HTTP auth at `/auth/authorize` and `/auth/access-token`
- Voice Indicators WebSocket on the same host (upgrade)

## Quick start (local)

### 1. Discord application

1. Create an app at [Discord Developer Portal](https://discord.com/developers/applications).
2. Copy **Client ID** and **Client Secret** (OAuth2).
3. Add redirect URL: `http://127.0.0.1:8787/auth/authorize`
4. Put the same Client ID in `src/userplugins/_api/nunOnlineServices/constants.ts` (`CLIENT_ID`).
5. Optional guild gate: create a bot, invite it with `CREATE_INSTANT_INVITE` + `MANAGE_GUILD`, set `DISCORD_BOT_TOKEN` and `GUILD_ID`.

### 2. Run the server

```bash
cd server/nun-online
cp .env.example .env
# fill DISCORD_CLIENT_ID and DISCORD_CLIENT_SECRET
pnpm install
pnpm dev
```

### 3. Point the client plugins

| Setting | Value (local) |
|---------|----------------|
| NunOnlineServicesAPI → Base URL | `http://127.0.0.1:8787` |
| `voiceIndicators/constants.ts` → `WS_URL` | `ws://127.0.0.1:8787` |
| `nunOnlineServices/constants.ts` → `CLIENT_ID` | your Discord app id |

Rebuild/reload Nun, enable both plugins, click **Authorize**.

## Production

1. Deploy this server behind HTTPS (e.g. `https://vi.yourdomain.com`).
2. Set `PUBLIC_URL=https://vi.yourdomain.com` in `.env`.
3. Add the same URL + `/auth/authorize` to Discord OAuth redirects.
4. Plugin Base URL: `https://vi.yourdomain.com`
5. `WS_URL`: `wss://vi.yourdomain.com`
6. Add your domain to `src/main/csp/index.ts` (`connect-src`).

## Notes

- Session and voice data are in-memory. Restart clears everything.
- `GUILD_ID` is optional. Leave empty to skip the guild join gate.
- Without `GUILD_ID` + bot token, any authorized Discord user can connect.
