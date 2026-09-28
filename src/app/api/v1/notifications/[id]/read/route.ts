import { NextRequest } from 'next/server';
import { requireAuth } from '@/server/permissions/guards';
import { NotificationService } from '@/server/services/notification.service';
import { successResponse, errorResponse } from '@/lib/api/response';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireAuth();
    await NotificationService.markAsRead(params.id, session.id);
    return successResponse({ success: true }, 'Notification marked as read');
  } catch (error: any) {
    const status = error.status || 500;
    const code = error.code || 'INTERNAL_ERROR';
    return errorResponse(error.message, code, status);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  return POST(req, { params });
}
