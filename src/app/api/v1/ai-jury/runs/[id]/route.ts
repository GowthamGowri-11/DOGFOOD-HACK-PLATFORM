import { NextRequest } from 'next/server';
import { requireRole } from '@/server/permissions/guards';
import { successResponse, errorResponse } from '@/lib/api/response';
import prisma from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(['ORGANIZER', 'ADMIN']);
    const { id: runId } = await params;

    const juryRun = await prisma.aIJuryRun.findUnique({
      where: { id: runId },
      include: {
        modelVersion: true,
        promptVersion: true,
        evidence: true,
        scores: {
          include: {
            criterion: true,
          },
        },
        project: {
          select: {
            id: true,
            title: true,
            slug: true,
            repoUrl: true,
            demoUrl: true,
          },
        },
        comparisons: true,
      },
    });

    if (!juryRun) {
      return errorResponse('AI Jury Run not found', 'NOT_FOUND', 404);
    }

    return successResponse({ juryRun });
  } catch (error: any) {
    const status = error.status || 500;
    const code = error.code || 'INTERNAL_ERROR';
    return errorResponse(error.message, code, status);
  }
}
