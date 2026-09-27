import { WebSocketServer, WebSocket as WsClient } from 'ws';

export interface WsMessage {
  type: string;
  channel?: string;
  data?: any;
  timestamp?: number;
}

interface ClientMeta {
  ws: WsClient;
  channels: Set<string>;
  isAlive: boolean;
}

declare global {
  // eslint-disable-next-line no-var
  var __wsServerInstance: WebSocketServer | undefined;
  // eslint-disable-next-line no-var
  var __wsClients: Map<WsClient, ClientMeta> | undefined;
}

const PORT = parseInt(process.env.WS_PORT || '3001', 10);

export function initWebSocketServer(): WebSocketServer | null {
  if (global.__wsServerInstance) {
    return global.__wsServerInstance;
  }

  try {
    const wss = new WebSocketServer({ port: PORT });
    const clients = new Map<WsClient, ClientMeta>();

    global.__wsServerInstance = wss;
    global.__wsClients = clients;

    wss.on('connection', (ws: WsClient) => {
      const meta: ClientMeta = {
        ws,
        channels: new Set(['general', 'announcements', 'leaderboard']),
        isAlive: true,
      };
      clients.set(ws, meta);

      // Send initial welcome message
      ws.send(
        JSON.stringify({
          type: 'SYSTEM_CONNECT',
          message: 'Connected to ApexHack Real-Time WebSocket Gateway',
          port: PORT,
          timestamp: Date.now(),
          channels: Array.from(meta.channels),
        })
      );

      ws.on('message', (messageRaw: string) => {
        try {
          const parsed = JSON.parse(messageRaw.toString());
          if (parsed.type === 'PING') {
            ws.send(JSON.stringify({ type: 'PONG', timestamp: Date.now() }));
            return;
          }

          if (parsed.type === 'SUBSCRIBE' && parsed.channel) {
            meta.channels.add(parsed.channel);
            ws.send(
              JSON.stringify({
                type: 'SUBSCRIBED',
                channel: parsed.channel,
                timestamp: Date.now(),
              })
            );
            return;
          }

          if (parsed.type === 'UNSUBSCRIBE' && parsed.channel) {
            meta.channels.delete(parsed.channel);
            ws.send(
              JSON.stringify({
                type: 'UNSUBSCRIBED',
                channel: parsed.channel,
                timestamp: Date.now(),
              })
            );
            return;
          }

          // If client sends a broadcast message
          if (parsed.type === 'BROADCAST' && parsed.channel && parsed.data) {
            broadcastWsEvent(parsed.channel, parsed.data, parsed.event || 'MESSAGE');
          }
        } catch {
          // Ignore malformed payloads
        }
      });

      ws.on('pong', () => {
        meta.isAlive = true;
      });

      ws.on('close', () => {
        clients.delete(ws);
      });

      ws.on('error', () => {
        clients.delete(ws);
      });
    });

    // Heartbeat check every 30 seconds
    const interval = setInterval(() => {
      if (!global.__wsServerInstance) {
        clearInterval(interval);
        return;
      }
      clients.forEach((meta, ws) => {
        if (!meta.isAlive) {
          clients.delete(ws);
          ws.terminate();
          return;
        }
        meta.isAlive = false;
        ws.ping();
      });
    }, 30000);

    wss.on('close', () => {
      clearInterval(interval);
      global.__wsServerInstance = undefined;
      global.__wsClients = undefined;
    });

    console.log(`[WebSocket] Real-time WebSocket Server initialized on port ${PORT}`);
    return wss;
  } catch (err: any) {
    if (err.code === 'EADDRINUSE') {
      console.log(`[WebSocket] Port ${PORT} already in use, attaching to existing instance`);
      return null;
    }
    console.error('[WebSocket] Failed to initialize WebSocket server:', err);
    return null;
  }
}

export function broadcastWsEvent(channel: string, data: any, eventType = 'UPDATE') {
  const clients = global.__wsClients;
  if (!clients) return;

  const payload = JSON.stringify({
    type: eventType,
    channel,
    data,
    timestamp: Date.now(),
  });

  clients.forEach((meta, ws) => {
    if (ws.readyState === WsClient.OPEN) {
      if (meta.channels.has(channel) || meta.channels.has('*')) {
        ws.send(payload);
      }
    }
  });
}
