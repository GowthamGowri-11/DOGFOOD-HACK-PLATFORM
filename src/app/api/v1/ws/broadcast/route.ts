import { NextRequest } from 'next/server';
import { broadcastWsEvent } from '@/server/websocket/ws-server';
import { successResponse, errorResponse } from '@/lib/api/response';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { channel = 'general', eventType = 'BROADCAST', data = {} } = body;

    broadcastWsEvent(channel, data, eventType);

    return successResponse(
      {
        channel,
        eventType,
        data,
        broadcastedAt: new Date().toISOString(),
      },
      'WebSocket event broadcasted successfully'
    );
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to broadcast WebSocket event', 'BROADCAST_FAILED', 500);
  }
}
