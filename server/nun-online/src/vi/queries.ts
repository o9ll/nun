import {
    getChannelLog,
    getChannelMembers,
    getGuildSnapshot,
    getUserLog,
    getUserSessions,
    getUsersBulk,
} from "./store.js";

export function runQuery(kind: string, args: Record<string, unknown>): unknown {
    switch (kind) {
        case "user":
            return getUserSessions(String(args.userId));
        case "usersBulk":
            return getUsersBulk((args.userIds as string[]) ?? []);
        case "channel":
            return getChannelMembers(String(args.channelId));
        case "guild":
            return getGuildSnapshot(String(args.guildId));
        case "userLog":
            return getUserLog(String(args.userId));
        case "channelLog":
            return getChannelLog(String(args.channelId));
        default:
            throw new Error(`Unknown query kind: ${kind}`);
    }
}
