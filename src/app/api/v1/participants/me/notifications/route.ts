import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/server/permissions/guards';
import { NotificationRepository } from '@/server/repositories/notification.repository';
import { successResponse, errorResponse } from '@/lib/api/response';

const markReadSchema = z.object({
  id: z.string().optional(),
  all: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();
    const [notifications, unreadCount] = await Promise.all([
      NotificationRepository.listByUser(session.id),
      NotificationRepository.countUnreadByUser(session.id),
    ]);

    return successResponse({
      notifications,
      unreadCount,
    });
  } catch (error: any) {
    const status = error.status || 500;
    const code = error.code || 'INTERNAL_ERROR';
    return errorResponse(error.message, code, status);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await req.json();
    const parsed = markReadSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse('Invalid payload', 'VALIDATION_ERROR', 422, parsed.error.format());
    }

    if (parsed.data.all) {
      await NotificationRepository.markAllAsRead(session.id);
    } else if (parsed.data.id) {
      await NotificationRepository.markAsRead(parsed.data.id, session.id);
    }

    return successResponse(null, 'Notifications updated');
  } catch (error: any) {
    const status = error.status || 500;
    const code = error.code || 'INTERNAL_ERROR';
    return errorResponse(error.message, code, status);
  }
}
