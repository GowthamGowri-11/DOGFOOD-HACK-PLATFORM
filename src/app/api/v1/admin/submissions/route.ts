import { NextRequest } from 'next/server';
import { requireRole } from '@/server/permissions/guards';
import { successResponse, errorResponse } from '@/lib/api/response';
import prisma from '@/lib/prisma';
import { Prisma, SubmissionStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await requireRole('ADMIN');

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || undefined;
    const hackathonId = searchParams.get('hackathonId') || undefined;
    const status = (searchParams.get('status') as SubmissionStatus) || undefined;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get('pageSize') || '10', 10)));
    const skip = (page - 1) * pageSize;

    const where: Prisma.SubmissionWhereInput = {
      ...(status ? { status } : {}),
      ...(hackathonId ? { project: { hackathonId } } : {}),
      ...(search
        ? {
            OR: [
              { project: { title: { contains: search, mode: 'insensitive' } } },
              { project: { team: { name: { contains: search, mode: 'insensitive' } } } },
              { project: { hackathon: { title: { contains: search, mode: 'insensitive' } } } },
            ],
          }
        : {}),
    };

    const [total, submissions] = await Promise.all([
      prisma.submission.count({ where }),
      prisma.submission.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          project: {
            include: {
              hackathon: { select: { id: true, title: true, slug: true } },
              team: { select: { id: true, name: true } },
              track: { select: { id: true, title: true } },
              evaluations: { select: { id: true, status: true, weightedScore: true } },
              aiJuryRuns: {
                take: 1,
                orderBy: { createdAt: 'desc' },
                select: { id: true, overallScore: true, confidenceScore: true },
              },
            },
          },
        },
        orderBy: { submittedAt: 'desc' },
      }),
    ]);

    const totalPages = Math.ceil(total / pageSize);

    return successResponse({
      submissions,
      pagination: {
        total,
        page,
        pageSize,
        totalPages,
        hasMore: page < totalPages,
      },
    });
  } catch (error: any) {
    if (error.status === 403 || error.code === 'FORBIDDEN_ROLE') {
      return errorResponse(error.message, 'FORBIDDEN', 403);
    }
    if (error.status === 401 || error.code === 'UNAUTHORIZED') {
      return errorResponse(error.message, 'UNAUTHORIZED', 401);
    }
    return errorResponse(error.message || 'Failed to list submissions', 'INTERNAL_ERROR', 500);
  }
}
