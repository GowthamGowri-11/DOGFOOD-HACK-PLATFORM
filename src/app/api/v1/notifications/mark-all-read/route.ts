import { NextRequest } from 'next/server';
import { requireAuth } from '@/server/permissions/guards';
import { NotificationService } from '@/server/services/notification.service';
import { successResponse, errorResponse } from '@/lib/api/response';

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    await NotificationService.markAllAsRead(session.id);
    return successResponse({ success: true }, 'All notifications marked as read');
  } catch (error: any) {
    const status = error.status || 500;
    const code = error.code || 'INTERNAL_ERROR';
    return errorResponse(error.message, code, status);
  }
}
