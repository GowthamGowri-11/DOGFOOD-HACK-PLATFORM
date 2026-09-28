export async function register() {
  if (typeof process !== 'undefined' && process.versions?.node) {
    try {
      const dns = require('dns');
      if (typeof dns.setDefaultResultOrder === 'function') {
        dns.setDefaultResultOrder('ipv4first');
      }
    } catch {
      // Ignore
    }
  }


  if (process.env.NEXT_RUNTIME === 'nodejs') {
    try {
      const { initWebSocketServer } = await import('@/server/websocket/ws-server');
      initWebSocketServer();
    } catch (err) {
      console.warn('[Instrumentation] WebSocket auto-start deferred:', err);
    }
  }
}
