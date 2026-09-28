import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/server/permissions/guards';
import { AssignmentEngine } from '@/server/services/assignment.engine';
import { successResponse, errorResponse } from '@/lib/api/response';
import prisma from '@/lib/prisma';
import { AuditService } from '@/server/services/audit.service';

const autoAssignSchema = z.object({
  hackathonId: z.string().min(1),
  judgesPerProject: z.number().int().min(1).max(10).default(2),
  prioritizeTrackExpertise: z.boolean().default(true),
});

export async function POST(req: NextRequest) {
  try {
    const session = await requireRole(['ORGANIZER', 'ADMIN']);
    const body = await req.json();
    const parsed = autoAssignSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse('Invalid auto-assignment parameters', 'VALIDATION_ERROR', 422, parsed.error.format());
    }

    const { hackathonId, judgesPerProject, prioritizeTrackExpertise } = parsed.data;

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
    });

    if (projects.length === 0) {
      return errorResponse('No submitted projects found to assign', 'NO_PROJECTS_FOUND', 400);
    }

    const formattedJudges = judges.map((j) => ({
      id: j.id,
      userId: j.userId,
      maxWorkload: j.maxWorkload,
      expertiseTracks: j.expertiseTracks,
      conflictTeamIds: j.conflictTeamIds,
      currentAssignmentCount: j._count.assignments,
      isActive: j.isActive,
    }));

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

    // Persist assignments transactionally
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
      action: 'JUDGE_AUTO_ASSIGN',
      entityType: 'JudgeAssignment',
      entityId: hackathonId,
      afterState: { assignedCount: createdRecords.length },
    });

    return successResponse(
      {
        totalAssignmentsCreated: createdRecords.length,
        judgesInvolved: judges.length,
        projectsAssigned: projects.length,
      },
      'Automatic balanced judge assignment completed successfully'
    );
  } catch (error: any) {
    const status = error.status || 500;
    const code = error.code || 'INTERNAL_ERROR';
    return errorResponse(error.message, code, status);
  }
}
