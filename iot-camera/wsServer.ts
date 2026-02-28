/**
 * iot-camera/wsServer.ts
 *
 * Standalone native WebSocket server (port 3001).
 * - Browser clients connect here and receive real-time push events (image URL, AI results).
 * - Next.js API routes call an internal HTTP endpoint on this server to forward data.
 *
 * Run with:  npx ts-node wsServer.ts   (from iot-camera/ directory)
 */

import http from 'http';
import { WebSocket, WebSocketServer } from 'ws';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const WS_PORT = Number(process.env.WS_PORT ?? 3001);
const INTERNAL_HTTP_PORT = Number(process.env.INTERNAL_HTTP_PORT ?? 3002);

// ─── WebSocket Server ─────────────────────────────────────────────────────────

const wss = new WebSocketServer({ port: WS_PORT });
const clients = new Set<WebSocket>();

wss.on('connection', (ws: WebSocket) => {
    clients.add(ws);
    console.log(`[WS] Client connected. Total clients: ${clients.size}`);

    ws.on('close', () => {
        clients.delete(ws);
        console.log(`[WS] Client disconnected. Total clients: ${clients.size}`);
    });

    ws.on('error', (err) => {
        console.error('[WS] Client error:', err.message);
        clients.delete(ws);
    });

    // Send a welcome ping so the front-end knows the connection is alive
    ws.send(JSON.stringify({ type: 'connected', message: 'WebSocket ready' }));
});

wss.on('listening', () => {
    console.log(`[WS] WebSocket server listening on ws://localhost:${WS_PORT}`);
});

/**
 * Broadcast a JSON message to all connected browser clients.
 */
function broadcast(data: Record<string, unknown>): void {
    const payload = JSON.stringify(data);
    for (const client of clients) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(payload);
        }
    }
}

// ─── Internal HTTP Server ─────────────────────────────────────────────────────
// Next.js API routes POST to this server to trigger broadcasts.
// This lives on a separate port so it is NOT exposed to the internet.

const internalServer = http.createServer((req, res) => {
    if (req.method === 'POST' && req.url === '/internal/image') {
        let body = '';
        req.on('data', (chunk: Buffer) => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                const payload = JSON.parse(body) as Record<string, unknown>;
                // Expected: { imageUrl: string, publicId: string }
                broadcast({ type: 'image', ...payload });
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ ok: true }));
            } catch {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ ok: false, error: 'Invalid JSON' }));
            }
        });
    } else if (req.method === 'POST' && req.url === '/internal/analysis') {
        let body = '';
        req.on('data', (chunk: Buffer) => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                const payload = JSON.parse(body) as Record<string, unknown>;
                // Expected: { result: string }
                broadcast({ type: 'analysis', ...payload });
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ ok: true }));
            } catch {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ ok: false, error: 'Invalid JSON' }));
            }
        });
    } else {
        res.writeHead(404);
        res.end();
    }
});

internalServer.listen(INTERNAL_HTTP_PORT, () => {
    console.log(`[Internal HTTP] Listening on http://localhost:${INTERNAL_HTTP_PORT}`);
});

// ─── Graceful Shutdown ────────────────────────────────────────────────────────

process.on('SIGINT', () => {
    console.log('\n[WS] Shutting down...');
    wss.close(() => process.exit(0));
});
