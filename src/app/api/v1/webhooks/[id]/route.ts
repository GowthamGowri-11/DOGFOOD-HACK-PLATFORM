import { NextRequest } from 'next/server';
import { requireRole } from '@/server/permissions/guards';
import { WebhookService } from '@/server/services/webhook.service';
import { successResponse, errorResponse } from '@/lib/api/response';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRole(['ADMIN', 'ORGANIZER']);
    const { id } = await params;

    const deleted = await WebhookService.deleteWebhook(id, session.id);
    if (!deleted) {
      return errorResponse('Webhook not found', 'NOT_FOUND', 404);
    }

    return successResponse({ deleted: true }, 'Webhook deleted successfully');
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to delete webhook', 'WEBHOOK_DELETE_ERROR', err.status || 400);
  }
}
