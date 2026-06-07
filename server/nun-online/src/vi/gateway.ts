import { encode, decode } from "@msgpack/msgpack";
import type { WebSocket } from "ws";
import { config } from "../config.js";
import { addUserToGuild, getCurrentUser, isGuildMember } from "../discord.js";
import { Op } from "../protocol/opcodes.js";
import { applyVoiceReport, matchesSubscription, upsertMeta, type VoiceDelta } from "./store.js";
import { runQuery } from "./queries.js";

type Frame = [number, unknown];

interface ClientState {
    userId: string | null;
    identified: boolean;
    subs: { guilds: Set<string>; channels: Set<string>; users: Set<string>; };
}

const clients = new Set<{ ws: WebSocket; state: ClientState; }>();

function send(ws: WebSocket, op: number, payload: unknown): void {
    if (ws.readyState === ws.OPEN) ws.send(encode([op, payload]));
}

function sendError(ws: WebSocket, code: string, message: string, fatal: boolean, reqId?: number): void {
    send(ws, Op.ERROR, { code, message, fatal, reqId });
}

function broadcastDelta(delta: VoiceDelta): void {
    for (const client of clients) {
        if (!client.state.identified || !matchesSubscription(delta, client.state.subs)) continue;
        send(client.ws, Op.VOICE_DELTA, delta);
    }
}

export function attachGateway(ws: WebSocket): void {
    const client: { ws: WebSocket; state: ClientState; } = {
        ws,
        state: {
            userId: null,
            identified: false,
            subs: { guilds: new Set<string>(), channels: new Set<string>(), users: new Set<string>() },
        },
    };
    clients.add(client);

    ws.on("message", (data: Buffer) => {
        void handleMessage(client, data);
    });

    ws.on("close", () => {
        clients.delete(client);
    });
}

async function handleMessage(client: { ws: WebSocket; state: ClientState; }, raw: unknown): Promise<void> {
    let frame: Frame;
    try {
        const buf = raw instanceof Buffer ? raw : Buffer.from(raw as ArrayBuffer);
        frame = decode(buf) as Frame;
    } catch {
        return;
    }

    const [op, payload] = frame;
    const p = payload as Record<string, unknown>;

    switch (op) {
        case Op.IDENTIFY:
            await handleIdentify(client, String(p.accessToken ?? ""));
            break;
        case Op.HEARTBEAT:
            send(client.ws, Op.HEARTBEAT_ACK, {});
            break;
        case Op.VOICE_REPORT: {
            if (!client.state.identified) return;
            const delta = applyVoiceReport(p as never);
            if (delta) broadcastDelta(delta);
            break;
        }
        case Op.META_UPSERT:
            if (!client.state.identified) return;
            upsertMeta(p as never);
            break;
        case Op.SUBSCRIBE:
            if (!client.state.identified) return;
            mergeSubs(client.state.subs, p);
            break;
        case Op.UNSUBSCRIBE:
            if (!client.state.identified) return;
            removeSubs(client.state.subs, p);
            break;
        case Op.QUERY:
            if (!client.state.identified) return;
            await handleQuery(client, p);
            break;
        default:
            break;
    }
}

function mergeSubs(subs: ClientState["subs"], payload: Record<string, unknown>): void {
    for (const g of (payload.guilds as string[] | undefined) ?? []) subs.guilds.add(g);
    for (const c of (payload.channels as string[] | undefined) ?? []) subs.channels.add(c);
    for (const u of (payload.users as string[] | undefined) ?? []) subs.users.add(u);
}

function removeSubs(subs: ClientState["subs"], payload: Record<string, unknown>): void {
    for (const g of (payload.guilds as string[] | undefined) ?? []) subs.guilds.delete(g);
    for (const c of (payload.channels as string[] | undefined) ?? []) subs.channels.delete(c);
    for (const u of (payload.users as string[] | undefined) ?? []) subs.users.delete(u);
}

async function handleIdentify(client: { ws: WebSocket; state: ClientState; }, accessToken: string): Promise<void> {
    if (!accessToken) {
        sendError(client.ws, "AUTH_INVALID", "Missing access token", true);
        client.ws.close();
        return;
    }

    let user;
    try {
        user = await getCurrentUser(accessToken);
    } catch {
        sendError(client.ws, "AUTH_INVALID", "Invalid access token", true);
        client.ws.close();
        return;
    }

    if (config.guildId) {
        if (!config.botToken) {
            sendError(client.ws, "GUILD_JOIN_FAILED", "Server missing bot token for guild gate", true);
            client.ws.close();
            return;
        }

        const member = await isGuildMember(config.guildId, user.id, config.botToken);
        if (!member) {
            const joined = await addUserToGuild(config.guildId, user.id, accessToken, config.botToken);
            if (!joined) {
                sendError(client.ws, "GUILD_JOIN_FAILED", "Could not add you to the required guild", true);
                client.ws.close();
                return;
            }
        }
    }

    client.state.userId = user.id;
    client.state.identified = true;
    send(client.ws, Op.READY, { userId: user.id, heartbeatIntervalMs: config.heartbeatIntervalMs });
}

async function handleQuery(client: { ws: WebSocket; state: ClientState; }, payload: Record<string, unknown>): Promise<void> {
    const reqId = Number(payload.reqId);
    const kind = String(payload.kind ?? "");
    const args = (payload.args as Record<string, unknown>) ?? {};

    try {
        const data = runQuery(kind, args);
        send(client.ws, Op.QUERY_RESULT, { reqId, data });
    } catch (e) {
        sendError(client.ws, "QUERY_FAILED", e instanceof Error ? e.message : "Query failed", false, reqId);
    }
}
