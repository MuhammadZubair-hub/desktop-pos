import express from 'express';
import http from 'http';
import cors from 'cors';
import { WebSocketServer, WebSocket } from 'ws';
import { apiRouter } from './routes';
import { apiKeyMiddleware } from './auth';

let httpServer: http.Server | null = null;
let wss: WebSocketServer | null = null;
const connectedClients = new Set<WebSocket>();

export function startApiServer(port = 5000): Promise<{ port: number }> {
  return new Promise((resolve, reject) => {
    const app = express();

    // Middleware
    app.use(cors({
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'x-api-key', 'X-Pairing-PIN', 'x-pairing-pin'],
    }));
    app.use(express.json());

    // Security Middleware (Validates X-API-Key against stored pairing pin)
    app.use('/api', apiKeyMiddleware);

    // API Routes
    app.use('/api', apiRouter);

    // Root info
    app.get('/', (_req, res) => {
      res.json({
        name: 'Offline POS Host Server',
        status: 'online',
        wsPath: '/ws',
        version: '1.0.0',
      });
    });

    // Create shared HTTP server
    httpServer = http.createServer(app);

    // Create WebSocket Server on the same port 5000
    wss = new WebSocketServer({ server: httpServer, path: '/ws' });

    wss.on('connection', (ws: WebSocket, req) => {
      const clientIp = req.socket.remoteAddress;
      connectedClients.add(ws);
      console.log(`[WebSocket] Client connected from ${clientIp}. Total active clients: ${connectedClients.size}`);

      // Send initial welcome & connection ack
      ws.send(JSON.stringify({
        type: 'CONNECTED',
        payload: {
          message: 'Connected to Offline POS Host WebSocket',
          activeClients: connectedClients.size,
          timestamp: Date.now(),
        },
      }));

      ws.on('message', (message) => {
        try {
          const parsed = JSON.parse(message.toString());
          if (parsed.type === 'PING') {
            ws.send(JSON.stringify({ type: 'PONG', timestamp: Date.now() }));
          }
        } catch {
          // ignore non-json
        }
      });

      ws.on('close', () => {
        connectedClients.delete(ws);
        console.log(`[WebSocket] Client disconnected. Total active clients: ${connectedClients.size}`);
      });

      ws.on('error', (err) => {
        console.error('[WebSocket] Client error:', err);
        connectedClients.delete(ws);
      });
    });

    // Heartbeat to prune dead connections
    const heartbeatInterval = setInterval(() => {
      if (!wss) return;
      wss.clients.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
          try {
            ws.ping();
          } catch {
            ws.terminate();
          }
        }
      });
    }, 30000);

    wss.on('close', () => {
      clearInterval(heartbeatInterval);
    });

    // Bind strictly to 0.0.0.0 for LAN access
    httpServer.listen(port, '0.0.0.0', () => {
      console.log(`[Server] Express API & WebSocket Server running on http://0.0.0.0:${port}`);
      resolve({ port });
    });

    httpServer.on('error', (err) => {
      console.error('[Server] Server error:', err);
      reject(err);
    });
  });
}

export function broadcastWsEvent(type: string, payload: any): void {
  if (!wss) return;
  const message = JSON.stringify({ type, payload, timestamp: Date.now() });

  for (const client of connectedClients) {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(message);
      } catch (err) {
        console.error('[WebSocket] Error broadcasting to client:', err);
      }
    }
  }
}

export function getActiveWsClientCount(): number {
  return connectedClients.size;
}

export function stopApiServer(): Promise<void> {
  return new Promise((resolve) => {
    if (wss) {
      wss.close();
      wss = null;
    }
    if (httpServer) {
      httpServer.close(() => {
        console.log('[Server] API server stopped.');
        resolve();
      });
      httpServer = null;
    } else {
      resolve();
    }
  });
}
