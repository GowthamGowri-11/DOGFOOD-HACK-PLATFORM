import { NextRequest } from 'next/server';
import { requireRole } from '@/server/permissions/guards';
import { successResponse, errorResponse } from '@/lib/api/response';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await requireRole(['JUDGE', 'ADMIN']);
    const { searchParams } = new URL(req.url);
    const hackathonParam = searchParams.get('hackathonId');
    const hackathonId = hackathonParam && hackathonParam !== 'all' ? hackathonParam : undefined;

    // Fetch all hackathons with tracks for dynamic frontend selectors
    const hackathons = await prisma.hackathon.findMany({
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        tracks: {
          select: {
            id: true,
            title: true,
            colorHex: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Find judge records for this user
    const judges = await prisma.judge.findMany({
      where: {
        userId: session.id,
        ...(hackathonId ? { hackathonId } : {}),
      },
      select: { id: true, hackathonId: true },
    });

    let whereCondition: any;
    if (judges.length > 0) {
      whereCondition = {
        judgeId: { in: judges.map((j) => j.id) },
        ...(hackathonId ? { judge: { hackathonId } } : {}),
      };
    } else if (session.role === 'ADMIN') {
      // In dev or preview mode, allow admin to view assignments across the event
      whereCondition = hackathonId ? { judge: { hackathonId } } : {};
    } else {
      return successResponse({
        assignments: [],
        hackathons,
        totalCount: 0,
        completedCount: 0,
        pendingCount: 0,
      });
    }

    // STRICT JUDGE ISOLATION: A judge can ONLY view their own assigned projects & evaluations
    const assignments = await prisma.judgeAssignment.findMany({
      where: whereCondition,
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

    return successResponse({
      assignments,
      hackathons,
      totalCount: assignments.length,
      completedCount: assignments.filter((a) => a.evaluation?.status === 'SUBMITTED').length,
      pendingCount: assignments.filter((a) => a.evaluation?.status !== 'SUBMITTED').length,
    });
  } catch (error: any) {
    const status = error.status || 500;
    const code = error.code || 'INTERNAL_ERROR';
    return errorResponse(error.message, code, status);
  }
}
