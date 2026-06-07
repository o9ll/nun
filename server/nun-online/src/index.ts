import { createServer } from "node:http";
import { WebSocketServer } from "ws";
import { handleAuth } from "./auth.js";
import { config } from "./config.js";
import { attachGateway } from "./vi/gateway.js";

const httpServer = createServer(async (req, res) => {
    const url = new URL(req.url ?? "/", config.publicUrl);
    const pathname = url.pathname.replace(/\/+$/, "") || "/";

    if (await handleAuth(req, res, pathname)) return;

    if (pathname === "/" && req.method === "GET") {
        res.writeHead(200, { "content-type": "text/plain" });
        res.end("nun online services (auth + voice-indicators gateway)");
        return;
    }

    res.writeHead(404, { "content-type": "text/plain" });
    res.end("Not found");
});

const wss = new WebSocketServer({ noServer: true });

wss.on("connection", (ws) => {
    attachGateway(ws);
});

httpServer.on("upgrade", (req, socket, head) => {
    wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit("connection", ws, req);
    });
});

httpServer.listen(config.port, () => {
    console.log(`nun-online listening on ${config.publicUrl} (port ${config.port})`);
    console.log("Auth:  GET  /auth/authorize");
    console.log("Auth:  POST /auth/access-token");
    console.log("VI:    WebSocket upgrade on same host");
});
