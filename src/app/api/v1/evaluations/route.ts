import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/server/permissions/guards';
import { JudgeRepository } from '@/server/repositories/judge.repository';
import { ScoringEngine } from '@/server/services/scoring.engine';
import { successResponse, errorResponse } from '@/lib/api/response';
import prisma from '@/lib/prisma';
import { AuditService } from '@/server/services/audit.service';
import { eventBus } from '@/server/realtime/event-bus';
import { RealtimeRoomBuilder } from '@/server/realtime/event-types';

const submitEvaluationSchema = z.object({
  projectId: z.string().min(1),
  rubricId: z.string().min(1),
  status: z.enum(['DRAFT', 'SUBMITTED']).default('SUBMITTED'),
  prosComment: z.string().optional(),
  consComment: z.string().optional(),
  suggestions: z.string().optional(),
  privateNotes: z.string().optional(),
  scores: z.array(
    z.object({
      criterionId: z.string().min(1),
      rawScore: z.number().min(0),
      feedback: z.string().optional(),
    })
  ).min(1),
});

export async function GET(req: NextRequest) {
  try {
    const session = await requireRole(['JUDGE', 'ORGANIZER', 'ADMIN']);
    const { searchParams } = new URL(req.url);
    const hackathonId = searchParams.get('hackathonId');

    if (!hackathonId) {
      return errorResponse('Missing hackathonId query parameter', 'VALIDATION_ERROR', 400);
    }

    // STRICT JUDGE ISOLATION: A judge can ONLY view their own assigned projects & evaluations
    if (session.role === 'JUDGE') {
      const assigned = await JudgeRepository.findAssignedProjects(session.id, hackathonId);
      return successResponse({ assignedProjects: assigned });
    }

    // ORGANIZER / ADMIN can view platform evaluations aggregated
    const evaluations = await prisma.evaluation.findMany({
      where: { project: { hackathonId } },
      include: {
        judge: { include: { user: { select: { fullName: true, email: true } } } },
        project: { select: { title: true, slug: true } },
        scores: true,
      },
    });

    return successResponse({ evaluations });
  } catch (error: any) {
    const status = error.status || 500;
    const code = error.code || 'INTERNAL_ERROR';
    return errorResponse(error.message, code, status);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireRole(['JUDGE']);
    const body = await req.json();
    const parsed = submitEvaluationSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse('Invalid evaluation payload', 'VALIDATION_ERROR', 422, parsed.error.format());
    }

    const { projectId, rubricId, status, prosComment, consComment, suggestions, privateNotes, scores } = parsed.data;

    // STRICT ISOLATION GUARD: Verify that this judge is actively assigned to this project
    const assignment = await JudgeRepository.verifyJudgeAssignment(session.id, projectId);
    if (!assignment) {
      return errorResponse(
        'Unauthorized: You are not assigned to evaluate this project.',
        'UNAUTHORIZED_EVALUATION_ACCESS',
        403
      );
    }

    // Fetch rubric criteria to compute weighted score safely on server
    const criteria = await prisma.rubricCriterion.findMany({
      where: { rubricId },
    });

    const criteriaMap = new Map(criteria.map((c) => [c.id, c]));
    const scoreInputs = scores.map((s) => {
      const crit = criteriaMap.get(s.criterionId);
      return {
        criterionId: s.criterionId,
        rawScore: s.rawScore,
        maxScore: crit?.maxScore || 100,
        weightPercentage: crit?.weightPercentage || 0,
      };
    });

    const computed = ScoringEngine.calculateEvaluationScore(scoreInputs);

    // Persist evaluation
    const evaluation = await prisma.evaluation.upsert({
      where: {
        judgeId_projectId: {
          judgeId: assignment.judgeId,
          projectId,
        },
      },
      update: {
        status,
        rawScoreSum: computed.rawScoreSum,
        weightedScore: computed.weightedScore,
        prosComment,
        consComment,
        suggestions,
        privateNotes,
        submittedAt: status === 'SUBMITTED' ? new Date() : null,
      },
      create: {
        assignmentId: assignment.id,
        judgeId: assignment.judgeId,
        judgeUserId: session.id,
        projectId,
        rubricId,
        status,
        rawScoreSum: computed.rawScoreSum,
        weightedScore: computed.weightedScore,
        prosComment,
        consComment,
        suggestions,
        privateNotes,
        submittedAt: status === 'SUBMITTED' ? new Date() : null,
      },
    });

    // Save individual criterion score records
    for (const s of scores) {
      await prisma.evaluationScore.upsert({
        where: {
          evaluationId_criterionId: {
            evaluationId: evaluation.id,
            criterionId: s.criterionId,
          },
        },
        update: {
          rawScore: s.rawScore,
          feedback: s.feedback,
        },
        create: {
          evaluationId: evaluation.id,
          criterionId: s.criterionId,
          rawScore: s.rawScore,
          feedback: s.feedback,
        },
      });
    }

    if (status === 'SUBMITTED') {
      await prisma.judgeAssignment.update({
        where: { id: assignment.id },
        data: { status: 'COMPLETED', completedAt: new Date() },
      });
    }

    await AuditService.log({
      userId: session.id,
      action: status === 'SUBMITTED' ? 'EVALUATION_SUBMIT' : 'EVALUATION_DRAFT_SAVE',
      entityType: 'Evaluation',
      entityId: evaluation.id,
      afterState: { weightedScore: computed.weightedScore, status },
    });

    // Fetch hackathonId for scoped room delivery
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { hackathonId: true },
    });

    if (project) {
      await eventBus.publish({
        type: status === 'SUBMITTED' ? 'EVALUATION_COMPLETED' : 'EVALUATION_UPDATED',
        hackathonId: project.hackathonId,
        projectId,
        userId: session.id,
        actorId: session.id,
        rooms: [
          RealtimeRoomBuilder.organizer(project.hackathonId),
          RealtimeRoomBuilder.judge(session.id),
          RealtimeRoomBuilder.evaluation(evaluation.id),
        ],
        payload: {
          evaluationId: evaluation.id,
          projectId,
          judgeId: assignment.judgeId,
          status,
          isCompleted: status === 'SUBMITTED',
        },
      });
    }

    return successResponse(
      { evaluationId: evaluation.id, weightedScore: computed.weightedScore, status },
      status === 'SUBMITTED' ? 'Evaluation submitted successfully' : 'Draft saved'
    );
  } catch (error: any) {
    const status = error.status || 500;
    const code = error.code || 'INTERNAL_ERROR';
    return errorResponse(error.message, code, status);
  }
}
