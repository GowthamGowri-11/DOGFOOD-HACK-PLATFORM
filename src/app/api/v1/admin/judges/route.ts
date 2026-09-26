import { NextRequest } from 'next/server';
import { requireRole } from '@/server/permissions/guards';
import { successResponse, errorResponse } from '@/lib/api/response';
import prisma from '@/lib/prisma';
import { AssignmentEngine } from '@/server/services/assignment.engine';
import { AuditService } from '@/server/services/audit.service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await requireRole('ADMIN');

    const { searchParams } = new URL(req.url);
    const hackathonId = searchParams.get('hackathonId') || undefined;

    const judges = await prisma.judge.findMany({
      where: {
        ...(hackathonId ? { hackathonId } : {}),
      },
      include: {
        user: {
          select: { id: true, fullName: true, email: true, avatarUrl: true },
        },
        hackathon: {
          select: { id: true, title: true, slug: true, status: true },
        },
        assignments: {
          include: {
            project: {
              select: { id: true, title: true },
            },
          },
        },
        evaluations: {
          select: { id: true, status: true, weightedScore: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = judges.map((j) => {
      const completedCount = j.evaluations.filter((e) => e.status === 'SUBMITTED').length;
      return {
        id: j.id,
        userId: j.userId,
        fullName: j.user.fullName,
        email: j.user.email,
        hackathonId: j.hackathonId,
        hackathonTitle: j.hackathon.title,
        hackathonStatus: j.hackathon.status,
        maxWorkload: j.maxWorkload,
        isActive: j.isActive,
        expertiseTracks: j.expertiseTracks,
        assignmentsCount: j.assignments.length,
        completedEvaluationsCount: completedCount,
        pendingEvaluationsCount: Math.max(0, j.assignments.length - completedCount),
      };
    });

    return successResponse({ judges: formatted });
  } catch (error: any) {
    if (error.status === 403 || error.code === 'FORBIDDEN_ROLE') {
      return errorResponse(error.message, 'FORBIDDEN', 403);
    }
    if (error.status === 401 || error.code === 'UNAUTHORIZED') {
      return errorResponse(error.message, 'UNAUTHORIZED', 401);
    }
    return errorResponse(error.message || 'Failed to list judges', 'INTERNAL_ERROR', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireRole('ADMIN');
    const body = await req.json();
    const { hackathonId, judgesPerProject = 2, prioritizeTrackExpertise = true } = body;

    if (!hackathonId) {
      return errorResponse('hackathonId is required', 'VALIDATION_ERROR', 400);
    }

    const hackathon = await prisma.hackathon.findUnique({
      where: { id: hackathonId },
    });

    if (!hackathon) {
      return errorResponse('Hackathon not found', 'NOT_FOUND', 404);
    }

    // Fetch active judges
    const judges = await prisma.judge.findMany({
      where: { hackathonId, isActive: true },
      include: {
        _count: { select: { assignments: true } },
      },
    });

    if (judges.length === 0) {
      return errorResponse('No active judges available for this hackathon', 'NO_JUDGES_AVAILABLE', 400);
    }

    // Fetch submitted projects
    const projects = await prisma.project.findMany({
      where: {
        hackathonId,
        submissions: { some: { status: 'SUBMITTED' } },
      },
      include: {
        team: {
          include: { members: true },
        },
      },
    });

    if (projects.length === 0) {
      return errorResponse('No submitted projects found to assign', 'NO_PROJECTS_FOUND', 400);
    }

    // Map judges with dynamic COI conflict team IDs
    const formattedJudges = await Promise.all(
      judges.map(async (j) => {
        const memberTeamIds = await prisma.teamMember.findMany({
          where: { userId: j.userId, team: { hackathonId } },
          select: { teamId: true },
        });
        const dynamicConflictTeams = Array.from(
          new Set([...j.conflictTeamIds, ...memberTeamIds.map((m) => m.teamId)])
        );

        return {
          id: j.id,
          userId: j.userId,
          maxWorkload: j.maxWorkload,
          expertiseTracks: j.expertiseTracks,
          conflictTeamIds: dynamicConflictTeams,
          currentAssignmentCount: j._count.assignments,
          isActive: j.isActive,
        };
      })
    );

    const formattedProjects = projects.map((p) => ({
      id: p.id,
      teamId: p.teamId,
      trackId: p.trackId,
      hackathonId: p.hackathonId,
    }));

    const newAssignments = AssignmentEngine.distribute(formattedProjects, formattedJudges, {
      judgesPerProject,
      prioritizeTrackExpertise,
    });

    const createdRecords = await prisma.$transaction(
      newAssignments.map((a) =>
        prisma.judgeAssignment.upsert({
          where: {
            judgeId_projectId: {
              judgeId: a.judgeId,
              projectId: a.projectId,
            },
          },
          update: {},
          create: {
            judgeId: a.judgeId,
            projectId: a.projectId,
          },
        })
      )
    );

    await AuditService.log({
      userId: session.id,
      hackathonId,
      action: 'JUDGE_ASSIGNED',
      entityType: 'JudgeAssignment',
      entityId: hackathonId,
      afterState: {
        generatedCount: createdRecords.length,
        judgesPerProject,
      },
    });

    return successResponse(
      { count: createdRecords.length },
      `Successfully generated ${createdRecords.length} judge assignments.`
    );
  } catch (error: any) {
    if (error.status === 403 || error.code === 'FORBIDDEN_ROLE') {
      return errorResponse(error.message, 'FORBIDDEN', 403);
    }
    if (error.status === 401 || error.code === 'UNAUTHORIZED') {
      return errorResponse(error.message, 'UNAUTHORIZED', 401);
    }
    return errorResponse(error.message || 'Failed to assign judges', 'INTERNAL_ERROR', 500);
  }
}
