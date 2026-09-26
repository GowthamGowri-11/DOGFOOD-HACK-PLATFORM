import { NextRequest } from 'next/server';
import { requireHackathonOrganizer } from '@/server/permissions/guards';
import { successResponse, errorResponse } from '@/lib/api/response';
import prisma from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: hackathonId } = await params;
    await requireHackathonOrganizer(hackathonId);

    // Fetch total submitted projects
    const totalProjects = await prisma.project.count({
      where: {
        hackathonId,
        submissions: { some: { status: 'SUBMITTED' } },
      },
    });

    // Fetch judges and their assignments & evaluations
    const judges = await prisma.judge.findMany({
      where: { hackathonId },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        assignments: {
          include: {
            evaluation: { select: { id: true, status: true, weightedScore: true } },
          },
        },
      },
    });

    const totalJudges = judges.length;
    const activeJudges = judges.filter((j) => j.isActive).length;

    // Fetch all assignments for this hackathon
    const assignments = await prisma.judgeAssignment.findMany({
      where: {
        judge: { hackathonId },
      },
      include: {
        evaluation: { select: { id: true, status: true } },
      },
    });

    const totalAssignments = assignments.length;
    const completedEvaluations = assignments.filter((a) => a.evaluation?.status === 'SUBMITTED').length;
    const pendingEvaluations = totalAssignments - completedEvaluations;

    // Fetch assigned project IDs
    const assignedProjectIds = new Set(assignments.map((a) => a.projectId));
    const assignedProjectsCount = assignedProjectIds.size;
    const unassignedProjectsCount = Math.max(0, totalProjects - assignedProjectsCount);

    // Completion percentage
    const completionRate =
      totalAssignments > 0 ? Number(((completedEvaluations / totalAssignments) * 100).toFixed(1)) : 0;

    // Workload breakdown per judge
    const judgeWorkloads = judges.map((j) => {
      const assignedCount = j.assignments.length;
      const completedCount = j.assignments.filter((a) => a.evaluation?.status === 'SUBMITTED').length;
      return {
        judgeId: j.id,
        judgeName: j.user.fullName,
        email: j.user.email,
        isActive: j.isActive,
        maxWorkload: j.maxWorkload,
        assignedCount,
        completedCount,
        pendingCount: assignedCount - completedCount,
        progressPercentage:
          assignedCount > 0 ? Number(((completedCount / assignedCount) * 100).toFixed(1)) : 0,
      };
    });

    // Fetch normalization runs if any
    const normalizationRuns = await prisma.scoreNormalization.findMany({
      where: { hackathonId },
      orderBy: { executedAt: 'desc' },
      take: 5,
    });

    // Fetch active rubric
    const activeRubric = await prisma.rubric.findFirst({
      where: { hackathonId, isCurrent: true },
      include: { criteria: true },
    });

    return successResponse({
      summary: {
        totalProjects,
        assignedProjectsCount,
        unassignedProjectsCount,
        totalJudges,
        activeJudges,
        totalAssignments,
        completedEvaluations,
        pendingEvaluations,
        completionRate,
      },
      judgeWorkloads,
      activeRubric: activeRubric
        ? {
            id: activeRubric.id,
            name: activeRubric.name,
            version: activeRubric.version,
            criteriaCount: activeRubric.criteria.length,
          }
        : null,
      normalizationRuns,
    });
  } catch (error: any) {
    const status = error.status || 500;
    const code = error.code || 'INTERNAL_ERROR';
    return errorResponse(error.message, code, status);
  }
}
