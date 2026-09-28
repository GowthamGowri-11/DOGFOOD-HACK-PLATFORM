import http from 'http';
import { getWebSocketServer } from '../src/server/realtime/websocket-server';

const PORT = parseInt(process.env.WEBSOCKET_PORT || '3001', 10);

const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'OK', service: 'ATLYX WebSocket Server', timestamp: new Date().toISOString() }));
    return;
  }
  res.writeHead(404);
  res.end();
});

const wsServer = getWebSocketServer(server);

server.listen(PORT, () => {
  console.log(`[ATLYX Realtime] Hybrid WebSocket server listening on ws://localhost:${PORT}`);
});

process.on('SIGTERM', () => {
  console.log('[ATLYX Realtime] Closing WebSocket server...');
  wsServer.close();
  server.close(() => process.exit(0));
});
