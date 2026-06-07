import type { IncomingMessage, ServerResponse } from "node:http";
import { config } from "./config.js";
import { exchangeCode, getCurrentUser } from "./discord.js";
import { createSession, deleteSession, getDiscordAccessToken, getSession } from "./sessions.js";

function readBearer(req: IncomingMessage): string | null {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) return null;
    return header.slice(7).trim() || null;
}

export async function handleAuth(req: IncomingMessage, res: ServerResponse, pathname: string): Promise<boolean> {
    if (pathname === "/auth/authorize" && req.method === "GET") {
        await handleAuthorize(req, res);
        return true;
    }

    if (pathname === "/auth/access-token" && req.method === "POST") {
        await handleAccessToken(req, res);
        return true;
    }

    return false;
}

async function handleAuthorize(_req: IncomingMessage, res: ServerResponse): Promise<void> {
    const url = new URL(_req.url ?? "/", config.publicUrl);
    const code = url.searchParams.get("code");

    if (!code) {
        res.writeHead(400, { "content-type": "text/plain" });
        res.end("Missing 'code' query parameter");
        return;
    }

    if (!config.clientId || !config.clientSecret) {
        res.writeHead(500, { "content-type": "text/plain" });
        res.end("Server missing Discord OAuth credentials");
        return;
    }

    const redirectUri = `${config.publicUrl}/auth/authorize`;

    try {
        const tokens = await exchangeCode(code, redirectUri, config.clientId, config.clientSecret);
        const user = await getCurrentUser(tokens.access_token);
        const sessionToken = createSession(user.id, tokens);
        res.writeHead(200, { "content-type": "text/plain" });
        res.end(sessionToken);
    } catch (e) {
        res.writeHead(400, { "content-type": "text/plain" });
        res.end(e instanceof Error ? e.message : "Authorization failed");
    }
}

async function handleAccessToken(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const token = readBearer(req);
    if (!token) {
        res.writeHead(401, { "content-type": "text/plain" });
        res.end("Missing session");
        return;
    }

    const session = getSession(token);
    if (!session) {
        res.writeHead(401, { "content-type": "text/plain" });
        res.end("Invalid session");
        return;
    }

    try {
        const body = await getDiscordAccessToken(session);
        res.writeHead(200, { "content-type": "application/json" });
        res.end(JSON.stringify(body));
    } catch {
        deleteSession(token);
        res.writeHead(401, { "content-type": "text/plain" });
        res.end("Session expired");
    }
}
