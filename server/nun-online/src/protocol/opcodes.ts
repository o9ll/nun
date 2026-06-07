export const Op = {
    IDENTIFY: 0,
    READY: 1,
    HEARTBEAT: 2,
    HEARTBEAT_ACK: 3,
    VOICE_REPORT: 4,
    META_UPSERT: 5,
    SUBSCRIBE: 6,
    UNSUBSCRIBE: 7,
    VOICE_DELTA: 8,
    REVALIDATE: 9,
    QUERY: 10,
    QUERY_RESULT: 11,
    ERROR: 12,
} as const;

export const FATAL_CODES = new Set(["AUTH_INVALID", "GUILD_JOIN_FAILED"]);
