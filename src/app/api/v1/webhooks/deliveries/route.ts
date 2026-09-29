import { NextRequest } from 'next/server';
import { requireRole } from '@/server/permissions/guards';
import { WebhookService } from '@/server/services/webhook.service';
import { successResponse, errorResponse } from '@/lib/api/response';

export async function GET(req: NextRequest) {
  try {
    await requireRole(['ADMIN', 'ORGANIZER']);
    const { searchParams } = new URL(req.url);
    const webhookId = searchParams.get('webhookId') || undefined;

    const deliveries = WebhookService.getDeliveryLogs(webhookId);
    return successResponse({ deliveries }, 'Delivery logs retrieved successfully');
  } catch (err: any) {
    return errorResponse(err.message || 'Unauthorized', 'DELIVERIES_FETCH_ERROR', err.status || 401);
  }
}
