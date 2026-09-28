export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    try {
      const dns = await import('dns');
      if (typeof dns.setDefaultResultOrder === 'function') {
        dns.setDefaultResultOrder('ipv4first');
      }
    } catch {
      // Ignore
    }

    try {
      const { initWebSocketServer } = await import('@/server/websocket/ws-server');
      initWebSocketServer();
    } catch (err) {
      console.warn('[Instrumentation] WebSocket auto-start deferred:', err);
    }
  }
}
