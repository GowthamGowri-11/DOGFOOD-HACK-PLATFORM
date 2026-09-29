import { NextRequest } from 'next/server';
import { requireRole } from '@/server/permissions/guards';
import { WebhookService } from '@/server/services/webhook.service';
import { successResponse, errorResponse } from '@/lib/api/response';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(['ADMIN', 'ORGANIZER']);
    const { id } = await params;

    const delivery = await WebhookService.sendTestPing(id);
    return successResponse(delivery, 'Test ping dispatched successfully');
  } catch (err: any) {
    return errorResponse(err.message || 'Test ping failed', 'PING_FAILED', err.status || 400);
  }
}
