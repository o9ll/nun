function required(name: string): string {
    const v = process.env[name]?.trim();
    if (!v) throw new Error(`Missing env ${name}`);
    return v;
}

function optional(name: string): string | undefined {
    const v = process.env[name]?.trim();
    return v || undefined;
}

export const config = {
    publicUrl: (optional("PUBLIC_URL") ?? "http://127.0.0.1:8787").replace(/\/+$/, ""),
    port: Number(optional("PORT") ?? "8787"),
    clientId: optional("DISCORD_CLIENT_ID"),
    clientSecret: optional("DISCORD_CLIENT_SECRET"),
    botToken: optional("DISCORD_BOT_TOKEN"),
    guildId: optional("GUILD_ID"),
    heartbeatIntervalMs: 30_000,
    maxLogEntries: 50,
};

export function assertAuthConfig(): void {
    required("DISCORD_CLIENT_ID");
    required("DISCORD_CLIENT_SECRET");
}
