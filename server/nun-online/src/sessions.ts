import { refreshAccessToken, type TokenResponse } from "./discord.js";
import { config } from "./config.js";

export interface StoredSession {
    token: string;
    userId: string;
    refreshToken: string;
    accessToken: string;
    accessExpiresAt: number;
}

const sessions = new Map<string, StoredSession>();

export function createSession(userId: string, tokens: TokenResponse): string {
    const token = crypto.randomUUID();
    sessions.set(token, {
        token,
        userId,
        refreshToken: tokens.refresh_token,
        accessToken: tokens.access_token,
        accessExpiresAt: Date.now() + tokens.expires_in * 1000,
    });
    return token;
}

export function getSession(token: string): StoredSession | undefined {
    return sessions.get(token);
}

export function deleteSession(token: string): void {
    sessions.delete(token);
}

export async function getDiscordAccessToken(session: StoredSession): Promise<{ access_token: string; expires_in: number; }> {
    if (session.accessExpiresAt > Date.now() + 30_000) {
        return {
            access_token: session.accessToken,
            expires_in: Math.max(1, Math.floor((session.accessExpiresAt - Date.now()) / 1000)),
        };
    }

    if (!config.clientId || !config.clientSecret) {
        throw new Error("Server missing Discord OAuth credentials");
    }

    const refreshed = await refreshAccessToken(session.refreshToken, config.clientId, config.clientSecret);
    session.accessToken = refreshed.access_token;
    session.refreshToken = refreshed.refresh_token;
    session.accessExpiresAt = Date.now() + refreshed.expires_in * 1000;

    return { access_token: refreshed.access_token, expires_in: refreshed.expires_in };
}
