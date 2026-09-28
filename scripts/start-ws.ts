import { initWebSocketServer } from '../src/server/websocket/ws-server';

console.log('[WebSocket Runner] Starting ApexHack standalone WebSocket service...');
const server = initWebSocketServer();

if (server) {
  console.log('[WebSocket Runner] WebSocket gateway active and listening for live connections.');
} else {
  console.log('[WebSocket Runner] Existing instance active or port bound.');
}
