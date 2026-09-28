import { NextResponse } from 'next/server';
import { initWebSocketServer } from '@/server/websocket/ws-server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const server = initWebSocketServer();
    const port = parseInt(process.env.WS_PORT || '3001', 10);
    return NextResponse.json({
      success: true,
      status: 'active',
      port,
      isNewInstance: Boolean(server),
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Failed to start WebSocket server',
      },
      { status: 500 }
    );
  }
}
