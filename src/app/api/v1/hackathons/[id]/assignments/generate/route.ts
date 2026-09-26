import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireHackathonOrganizer } from '@/server/permissions/guards';
import { AssignmentEngine } from '@/server/services/assignment.engine';
import { successResponse, errorResponse } from '@/lib/api/response';
import prisma from '@/lib/prisma';
import { AuditService } from '@/server/services/audit.service';

const generateAssignmentsSchema = z.object({
  judgesPerProject: z.number().int().min(1).max(10).default(2),
  prioritizeTrackExpertise: z.boolean().default(true),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: hackathonId } = await params;
    const session = await requireHackathonOrganizer(hackathonId);
    const body = await req.json().catch(() => ({}));
    const parsed = generateAssignmentsSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse('Invalid parameters', 'VALIDATION_ERROR', 422, parsed.error.format());
    }

    const { judgesPerProject, prioritizeTrackExpertise } = parsed.data;

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
          include: {
            members: true,
          },
        },
      },
    });

    if (projects.length === 0) {
      return errorResponse('No submitted projects found to assign', 'NO_PROJECTS_FOUND', 400);
    }

    // Map judges with dynamic COI conflict team IDs (including team memberships)
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

    // Idempotent transactional upsert
    const createdRecords = await prisma.$transaction(
      newAssignments.map((a) =>
        prisma.judgeAssignment.upsert({
          where: {
            judgeId_projectId: {
              judgeId: a.judgeId,
              projectId: a.projectId,
            },
          },
          update: { status: 'ASSIGNED' },
          create: {
            judgeId: a.judgeId,
            projectId: a.projectId,
            status: 'ASSIGNED',
          },
        })
      )
    );

    await AuditService.log({
      userId: session.id,
      hackathonId,
      action: 'ASSIGNMENTS_GENERATED',
      entityType: 'JudgeAssignment',
      entityId: hackathonId,
      afterState: { assignedCount: createdRecords.length, judgesCount: judges.length },
    });

    return successResponse(
      {
        totalAssignmentsCreated: createdRecords.length,
        judgesInvolved: judges.length,
        projectsAssigned: projects.length,
      },
      'Judge assignments generated successfully'
    );
  } catch (error: any) {
    const status = error.status || 500;
    const code = error.code || 'INTERNAL_ERROR';
    return errorResponse(error.message, code, status);
  }
}
