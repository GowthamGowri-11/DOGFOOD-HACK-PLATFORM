import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/server/permissions/guards';
import { successResponse, errorResponse } from '@/lib/api/response';
import prisma from '@/lib/prisma';
import { AuditService } from '@/server/services/audit.service';

const publishResultsSchema = z.object({
  hackathonId: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const session = await requireRole(['ORGANIZER', 'ADMIN']);
    const body = await req.json();
    const parsed = publishResultsSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse('Invalid hackathonId', 'VALIDATION_ERROR', 422);
    }

    const { hackathonId } = parsed.data;

    // Update results to published
    await prisma.result.updateMany({
      where: { hackathonId },
      data: {
        isPublished: true,
        publishedAt: new Date(),
      },
    });

    // Update hackathon status
    await prisma.hackathon.update({
      where: { id: hackathonId },
      data: {
        status: 'RESULTS_PUBLISHED',
        resultsPublishedAt: new Date(),
      },
    });

    await AuditService.log({
      userId: session.id,
      hackathonId,
      action: 'RESULTS_PUBLISH',
      entityType: 'Hackathon',
      entityId: hackathonId,
      afterState: { status: 'RESULTS_PUBLISHED' },
    });

    return successResponse(
      { hackathonId, status: 'RESULTS_PUBLISHED' },
      'Official leaderboard and results published publicly'
    );
  } catch (error: any) {
    const status = error.status || 500;
    const code = error.code || 'INTERNAL_ERROR';
    return errorResponse(error.message, code, status);
  }
}
