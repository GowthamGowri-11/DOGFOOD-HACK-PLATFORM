import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireHackathonOrganizer } from '@/server/permissions/guards';
import { ResultService } from '@/server/services/result.service';
import { successResponse, errorResponse } from '@/lib/api/response';

const generateSchema = z.object({
  method: z.enum(['Z_SCORE', 'MIN_MAX']).default('Z_SCORE'),
  forceRegenerate: z.boolean().default(false),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: hackathonId } = await params;
    const session = await requireHackathonOrganizer(hackathonId);
    const body = await req.json().catch(() => ({}));
    const parsed = generateSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse('Invalid parameters', 'VALIDATION_ERROR', 422, parsed.error.format());
    }

    const { method, forceRegenerate } = parsed.data;

    const { DistributedLock } = await import('@/lib/lock');
    const { deleteCache, CACHE_KEYS } = await import('@/lib/cache');

    const resultData = await DistributedLock.withLock(
      `lock:results:generate:${hackathonId}`,
      async () => {
        const res = await ResultService.generateResults(hackathonId, session.id, {
          method,
          forceRegenerate,
        });
        await deleteCache(CACHE_KEYS.LEADERBOARD(hackathonId));
        return res;
      },
      45 // 45 seconds lock TTL
    );

    return successResponse(
      resultData,
      `Official results (Version ${resultData.version}) generated successfully using ${method} normalization.`
    );
  } catch (error: any) {
    const status = error.status || 500;
    const code = error.code || 'INTERNAL_ERROR';
    return errorResponse(error.message, code, status);
  }
}
