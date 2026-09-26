import { NextRequest } from 'next/server';
import { requireRole } from '@/server/permissions/guards';
import { successResponse, errorResponse } from '@/lib/api/response';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await requireRole(['JUDGE']);
    const { searchParams } = new URL(req.url);
    const hackathonId = searchParams.get('hackathonId');

    // Find all judge records for this user
    const judges = await prisma.judge.findMany({
      where: {
        userId: session.id,
        ...(hackathonId ? { hackathonId } : {}),
      },
      select: { id: true, hackathonId: true },
    });

    if (judges.length === 0) {
      return successResponse({ assignments: [] });
    }

    const judgeIds = judges.map((j) => j.id);

    // STRICT JUDGE ISOLATION: A judge can ONLY view their own assigned projects & evaluations
    const assignments = await prisma.judgeAssignment.findMany({
      where: {
        judgeId: { in: judgeIds },
      },
      include: {
        judge: {
          select: {
            id: true,
            hackathonId: true,
            hackathon: {
              select: {
                id: true,
                title: true,
                slug: true,
                status: true,
              },
            },
          },
        },
        project: {
          include: {
            track: { select: { id: true, title: true, colorHex: true } },
            problemStatement: { select: { id: true, title: true, code: true } },
            team: { select: { id: true, name: true } },
            submissions: {
              where: { status: 'SUBMITTED' },
              orderBy: { versionNumber: 'desc' },
              take: 1,
            },
          },
        },
        evaluation: {
          select: {
            id: true,
            status: true,
            rawScoreSum: true,
            weightedScore: true,
            submittedAt: true,
            scores: true,
          },
        },
      },
      orderBy: { assignedAt: 'desc' },
    });

    return successResponse({ assignments });
  } catch (error: any) {
    const status = error.status || 500;
    const code = error.code || 'INTERNAL_ERROR';
    return errorResponse(error.message, code, status);
  }
}
