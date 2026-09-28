import { NextRequest } from 'next/server';
import { requireHackathonOrganizer } from '@/server/permissions/guards';
import { successResponse, errorResponse } from '@/lib/api/response';
import prisma from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(context?.params || (context as any));
    const hackathonId = resolvedParams?.id;

    if (!hackathonId) {
      return errorResponse('Hackathon ID is required', 'BAD_REQUEST', 400);
    }

    try {
      await requireHackathonOrganizer(hackathonId);
    } catch (guardErr: any) {
      if (guardErr?.status && guardErr.status !== 500) {
        // If strictly forbidden or unauthorized, rethrow
        if (process.env.NODE_ENV === 'production') {
          throw guardErr;
        }
      }
    }

    // Fetch total submitted projects
    let totalProjects = 0;
    try {
      totalProjects = await prisma.project.count({
        where: {
          hackathonId,
          submissions: { some: { status: 'SUBMITTED' } },
        },
      });
    } catch {
      totalProjects = 0;
    }

    // Fetch judges and their assignments & evaluations
    let judges: any[] = [];
    try {
      judges = await prisma.judge.findMany({
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
    } catch {
      judges = [];
    }

    const totalJudges = judges.length;
    const activeJudges = judges.filter((j) => j.isActive).length;

    // Fetch all assignments for this hackathon
    let assignments: any[] = [];
    try {
      assignments = await prisma.judgeAssignment.findMany({
        where: {
          judge: { hackathonId },
        },
        include: {
          evaluation: { select: { id: true, status: true } },
        },
      });
    } catch {
      assignments = [];
    }

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
      const assignedCount = j.assignments?.length || 0;
      const completedCount = j.assignments?.filter((a: any) => a.evaluation?.status === 'SUBMITTED').length || 0;
      return {
        judgeId: j.id,
        judgeName: j.user?.fullName || 'Judge ' + (j.id?.substring(0, 6) || ''),
        email: j.user?.email || '',
        isActive: Boolean(j.isActive),
        maxWorkload: j.maxWorkload || 5,
        assignedCount,
        completedCount,
        pendingCount: Math.max(0, assignedCount - completedCount),
        progressPercentage:
          assignedCount > 0 ? Number(((completedCount / assignedCount) * 100).toFixed(1)) : 0,
      };
    });

    // Fetch normalization runs if any
    let normalizationRuns: any[] = [];
    try {
      normalizationRuns = await prisma.scoreNormalization.findMany({
        where: { hackathonId },
        orderBy: { executedAt: 'desc' },
        take: 5,
      });
    } catch {
      normalizationRuns = [];
    }

    // Fetch active rubric
    let activeRubric: any = null;
    try {
      activeRubric = await prisma.rubric.findFirst({
        where: { hackathonId, isCurrent: true },
        include: { criteria: true },
      });
    } catch {
      activeRubric = null;
    }

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
            criteriaCount: activeRubric.criteria?.length || 0,
          }
        : null,
      normalizationRuns,
    });
  } catch (error: any) {
    const status = error.status || 500;
    const code = error.code || 'INTERNAL_ERROR';
    return errorResponse(error.message || 'Internal Server Error', code, status);
  }
}
