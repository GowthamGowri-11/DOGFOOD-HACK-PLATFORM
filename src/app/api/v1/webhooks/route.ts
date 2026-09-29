import { NextRequest } from 'next/server';
import { requireRole } from '@/server/permissions/guards';
import { WebhookService, SUPPORTED_WEBHOOK_EVENTS } from '@/server/services/webhook.service';
import { successResponse, errorResponse } from '@/lib/api/response';

export async function GET(req: NextRequest) {
  try {
    await requireRole(['ADMIN', 'ORGANIZER']);
    const { searchParams } = new URL(req.url);
    const hackathonId = searchParams.get('hackathonId') || undefined;

    const webhooks = WebhookService.listWebhooks(hackathonId);
    return successResponse(
      { webhooks, supportedEvents: SUPPORTED_WEBHOOK_EVENTS },
      'Webhooks retrieved successfully'
    );
  } catch (err: any) {
    return errorResponse(err.message || 'Unauthorized', 'WEBHOOK_FETCH_ERROR', err.status || 401);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireRole(['ADMIN', 'ORGANIZER']);
    const body = await req.json();

    const { hackathonId, url, description, events, secret } = body;
    if (!url) {
      return errorResponse('Webhook destination URL is required.', 'VALIDATION_ERROR', 400);
    }

    const created = await WebhookService.createWebhook({
      hackathonId: hackathonId || 'hack_apex_2026',
      url,
      description,
      events: events || [],
      secret,
      actorId: session.id,
    });

    return successResponse(created, 'Webhook registered successfully', 201);
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to create webhook', 'WEBHOOK_CREATE_ERROR', err.status || 400);
  }
}
