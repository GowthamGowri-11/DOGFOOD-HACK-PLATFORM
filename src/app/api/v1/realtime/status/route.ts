import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/server/auth/session';
import { getWebSocketServer } from '@/server/realtime/websocket-server';

export async function GET() {
  const user = await getCurrentUser();
  const wsPort = process.env.WEBSOCKET_PORT || '3001';
  const customWsUrl = process.env.NEXT_PUBLIC_WS_URL;

  // Ensure WebSocket server instance is active
  try {
    getWebSocketServer(parseInt(wsPort, 10));
  } catch (err: any) {
    // Port may already be bound, which is expected
  }

  return NextResponse.json({
    success: true,
    data: {
      status: 'AVAILABLE',
      wsUrl: customWsUrl || `ws://localhost:${wsPort}`,
      wsPort: parseInt(wsPort, 10),
      protocol: 'ws/wss',
      authenticated: !!user,
      userId: user?.id,
      timestamp: new Date().toISOString(),
    },
  });
}
