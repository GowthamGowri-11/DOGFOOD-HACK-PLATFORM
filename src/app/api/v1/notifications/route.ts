import { NextRequest } from 'next/server';
import { requireAuth } from '@/server/permissions/guards';
import { NotificationService } from '@/server/services/notification.service';
import { successResponse, errorResponse } from '@/lib/api/response';

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(req.url);
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 50;
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    const result = await NotificationService.getNotifications(session.id, limit, unreadOnly);
    return successResponse(result);
  } catch (error: any) {
    const status = error.status || 500;
    const code = error.code || 'INTERNAL_ERROR';
    return errorResponse(error.message, code, status);
  }
}
