import { NextRequest } from 'next/server';
import { requireRole } from '@/server/permissions/guards';
import { ResultService } from '@/server/services/result.service';
import { successResponse, errorResponse } from '@/lib/api/response';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await requireRole('ADMIN');

    const { searchParams } = new URL(req.url);
    const hackathonId = searchParams.get('hackathonId') || undefined;

    const hackathons = await prisma.hackathon.findMany({
      where: {
        ...(hackathonId ? { id: hackathonId } : {}),
      },
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        resultsPublishedAt: true,
        organizer: { select: { fullName: true } },
        prizes: {
          orderBy: { rankOrder: 'asc' },
          select: { id: true, title: true, amount: true, rankOrder: true },
        },
        results: {
          orderBy: { rank: 'asc' },
          take: 5,
          include: {
            project: {
              select: {
                id: true,
                title: true,
                team: { select: { name: true } },
              },
            },
          },
        },
        _count: {
          select: {
            results: true,
            projects: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return successResponse({ hackathons });
  } catch (error: any) {
    if (error.status === 403 || error.code === 'FORBIDDEN_ROLE') {
      return errorResponse(error.message, 'FORBIDDEN', 403);
    }
    if (error.status === 401 || error.code === 'UNAUTHORIZED') {
      return errorResponse(error.message, 'UNAUTHORIZED', 401);
    }
    return errorResponse(error.message || 'Failed to list results', 'INTERNAL_ERROR', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireRole('ADMIN');
    const body = await req.json();
    const { hackathonId } = body;

    if (!hackathonId) {
      return errorResponse('hackathonId is required', 'VALIDATION_ERROR', 400);
    }

    // Call ResultService.publishResults() to publish official results
    const result = await ResultService.publishResults(hackathonId, session.id);

    try {
      revalidatePath('/leaderboard');
      revalidatePath('/gallery');
      revalidatePath('/projects');
      revalidatePath('/admin/results');
      revalidatePath('/organizer/results');
    } catch {
      // Ignore during test/static builds
    }

    return successResponse(result, 'Official results and leaderboard published successfully');
  } catch (error: any) {
    if (error.status === 403 || error.code === 'FORBIDDEN_ROLE') {
      return errorResponse(error.message, 'FORBIDDEN', 403);
    }
    if (error.status === 401 || error.code === 'UNAUTHORIZED') {
      return errorResponse(error.message, 'UNAUTHORIZED', 401);
    }
    return errorResponse(error.message || 'Failed to publish results', 'INTERNAL_ERROR', error.status || 500);
  }
}
