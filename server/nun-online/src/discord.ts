const API = "https://discord.com/api/v10";

export interface DiscordUser {
    id: string;
    username: string;
    global_name?: string | null;
    avatar?: string | null;
}

export interface TokenResponse {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    token_type: string;
}

export async function exchangeCode(code: string, redirectUri: string, clientId: string, clientSecret: string): Promise<TokenResponse> {
    const body = new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
    });

    const res = await fetch(`${API}/oauth2/token`, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body,
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Discord token exchange failed (${res.status}): ${text}`);
    }

    return await res.json() as TokenResponse;
}

export async function refreshAccessToken(refreshToken: string, clientId: string, clientSecret: string): Promise<TokenResponse> {
    const body = new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "refresh_token",
        refresh_token: refreshToken,
    });

    const res = await fetch(`${API}/oauth2/token`, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body,
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Discord refresh failed (${res.status}): ${text}`);
    }

    return await res.json() as TokenResponse;
}

export async function getCurrentUser(accessToken: string): Promise<DiscordUser> {
    const res = await fetch(`${API}/users/@me`, {
        headers: { authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) throw new Error(`Invalid access token (${res.status})`);
    return await res.json() as DiscordUser;
}

export async function isGuildMember(guildId: string, userId: string, botToken: string): Promise<boolean> {
    const res = await fetch(`${API}/guilds/${guildId}/members/${userId}`, {
        headers: { authorization: `Bot ${botToken}` },
    });
    return res.ok;
}

export async function addUserToGuild(guildId: string, userId: string, userAccessToken: string, botToken: string): Promise<boolean> {
    const res = await fetch(`${API}/guilds/${guildId}/members/${userId}`, {
        method: "PUT",
        headers: {
            authorization: `Bot ${botToken}`,
            "content-type": "application/json",
        },
        body: JSON.stringify({ access_token: userAccessToken }),
    });
    return res.status === 201 || res.status === 204;
}
