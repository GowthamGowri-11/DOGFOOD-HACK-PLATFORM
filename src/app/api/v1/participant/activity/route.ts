import { NextRequest } from 'next/server';
import { requireAuth } from '@/server/permissions/guards';
import { ParticipantActivityService } from '@/server/services/participant-activity.service';
import { successResponse, errorResponse } from '@/lib/api/response';

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();
    const searchParams = req.nextUrl.searchParams;

    const type = searchParams.get('type') || undefined;
    const dateRange = searchParams.get('dateRange') || undefined;
    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!, 10) : 1;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 20;

    // Strict user isolation - uses session.id only, ignores client query overrides
    const result = await ParticipantActivityService.getTimeline(session.id, {
      type,
      dateRange,
      page,
      limit,
    });

    return successResponse({
      items: result.items,
      pagination: {
        total: result.total,
        page: result.page,
        totalPages: result.totalPages,
      },
    });
  } catch (error: any) {
    const status = error.status || 500;
    const code = error.code || 'INTERNAL_ERROR';
    return errorResponse(error.message || 'Failed to retrieve participant activity.', code, status);
  }
}
