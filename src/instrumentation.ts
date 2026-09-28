export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    try {
      const { initWebSocketServer } = await import('@/server/websocket/ws-server');
      initWebSocketServer();
    } catch (err) {
      console.warn('[Instrumentation] WebSocket auto-start deferred:', err);
    }
  }
}
