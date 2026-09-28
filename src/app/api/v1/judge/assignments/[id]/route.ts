import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/server/permissions/guards';
import { JudgeRepository } from '@/server/repositories/judge.repository';
import { RubricRepository } from '@/server/repositories/rubric.repository';
import { ScoringEngine } from '@/server/services/scoring.engine';
import { successResponse, errorResponse } from '@/lib/api/response';
import prisma from '@/lib/prisma';
import { AuditService } from '@/server/services/audit.service';
import { EncryptionService } from '@/server/security/encryption.service';
import { eventBus } from '@/server/realtime/event-bus';
import { RealtimeRoomBuilder } from '@/server/realtime/event-types';

const submitEvaluationSchema = z.object({
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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRole(['JUDGE', 'ADMIN']);
    const { id: assignmentId } = await params;

    // STRICT JUDGE ISOLATION: Fetch assignment only if assigned to this judge
    let assignment = await JudgeRepository.findAssignmentForJudge(assignmentId, session.id);

    if (!assignment && session.role === 'ADMIN') {
      // In dev or preview mode, allow admin to view any assignment
      assignment = (await prisma.judgeAssignment.findUnique({
        where: { id: assignmentId },
        include: {
          judge: true,
          project: {
            include: {
              track: true,
              problemStatement: true,
              team: {
                select: { id: true, name: true, leaderId: true },
              },
              submissions: {
                where: { status: 'SUBMITTED' },
                orderBy: { versionNumber: 'desc' },
                take: 1,
              },
            },
          },
          evaluation: {
            include: {
              scores: true,
              editRequests: {
                orderBy: { createdAt: 'desc' },
              },
            },
          },
        },
      })) as any;
    }

    if (!assignment) {
      return errorResponse(
        'Assignment not found or access forbidden',
        'ASSIGNMENT_NOT_FOUND',
        404
      );
    }

    // Fetch the active rubric for this hackathon
    const rubric = await RubricRepository.findCurrentByHackathon(assignment.judge.hackathonId);

    return successResponse({
      assignment: {
        id: assignment.id,
        status: assignment.status,
        assignedAt: assignment.assignedAt,
        completedAt: assignment.completedAt,
        project: {
          id: assignment.project.id,
          title: assignment.project.title,
          slug: assignment.project.slug,
          tagline: assignment.project.tagline,
          description: assignment.project.description,
          repoUrl: assignment.project.repoUrl,
          demoUrl: assignment.project.demoUrl,
          videoUrl: assignment.project.videoUrl,
          documentationUrl: assignment.project.documentationUrl,
          techStack: assignment.project.techStack,
          track: assignment.project.track,
          problemStatement: assignment.project.problemStatement,
          team: assignment.project.team,
          lockedSubmission: assignment.project.submissions[0] || null,
        },
        evaluation: assignment.evaluation,
      },
      rubric,
    });
  } catch (error: any) {
    const status = error.status || 500;
    const code = error.code || 'INTERNAL_ERROR';
    return errorResponse(error.message, code, status);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRole(['JUDGE', 'ADMIN']);
    const { id: assignmentId } = await params;

    // STRICT JUDGE ISOLATION: Verify assignment ownership
    let assignment = await JudgeRepository.findAssignmentForJudge(assignmentId, session.id);

    if (!assignment && session.role === 'ADMIN') {
      assignment = (await prisma.judgeAssignment.findUnique({
        where: { id: assignmentId },
        include: {
          judge: true,
          project: true,
        },
      })) as any;
    }

    if (!assignment) {
      return errorResponse(
        'Unauthorized: You are not assigned to evaluate this project.',
        'UNAUTHORIZED_EVALUATION_ACCESS',
        403
      );
    }

    // Check if existing evaluation is already locked
    const existingEval = await prisma.evaluation.findUnique({
      where: { assignmentId },
    });

    if (existingEval && existingEval.status === 'SUBMITTED') {
      return errorResponse(
        'Evaluation is locked and cannot be modified after submission.',
        'EVALUATION_LOCKED',
        409
      );
    }

    const body = await req.json();
    const parsed = submitEvaluationSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse('Invalid evaluation data', 'VALIDATION_ERROR', 422, parsed.error.format());
    }

    const { status, prosComment, consComment, suggestions, privateNotes, scores } = parsed.data;

    // Fetch the active rubric
    const rubric = await RubricRepository.findCurrentByHackathon(assignment.judge.hackathonId);
    if (!rubric || rubric.criteria.length === 0) {
      return errorResponse('No active rubric configured for this hackathon', 'NO_RUBRIC_CONFIGURED', 400);
    }

    // Verify all criteria belong to the rubric and are present if SUBMITTED
    const criteriaMap = new Map(rubric.criteria.map((c) => [c.id, c]));
    for (const s of scores) {
      if (!criteriaMap.has(s.criterionId)) {
        return errorResponse(
          `Criterion ID ${s.criterionId} does not belong to active rubric`,
          'INVALID_CRITERION_ID',
          400
        );
      }
    }

    if (status === 'SUBMITTED' && scores.length < rubric.criteria.length) {
      return errorResponse(
        `All ${rubric.criteria.length} criteria must be scored to submit evaluation. Received ${scores.length}.`,
        'INCOMPLETE_CRITERIA_SCORES',
        400
      );
    }

    const scoreInputs = scores.map((s) => {
      const crit = criteriaMap.get(s.criterionId)!;
      return {
        criterionId: s.criterionId,
        rawScore: s.rawScore,
        maxScore: crit.maxScore,
        weightPercentage: crit.weightPercentage,
      };
    });

    // Compute weighted scores authoritative on server
    const computed = ScoringEngine.calculateEvaluationScore(scoreInputs);

    // Encrypt sensitive evaluation data at rest (AES-256-GCM)
    const encryptedPayload = EncryptionService.encrypt({
      scores,
      prosComment,
      consComment,
      suggestions,
      privateNotes,
      computed,
    });

    // Save evaluation in transaction
    const evaluation = await prisma.$transaction(async (tx) => {
      const savedEval = await tx.evaluation.upsert({
        where: { assignmentId },
        update: {
          status,
          rawScoreSum: computed.rawScoreSum,
          weightedScore: computed.weightedScore,
          encryptedPayload,
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
          projectId: assignment.projectId,
          rubricId: rubric.id,
          roundId: assignment.roundId,
          subRoundId: assignment.subRoundId,
          status,
          rawScoreSum: computed.rawScoreSum,
          weightedScore: computed.weightedScore,
          encryptedPayload,
          prosComment,
          consComment,
          suggestions,
          privateNotes,
          submittedAt: status === 'SUBMITTED' ? new Date() : null,
        },
      });

      for (const s of scores) {
        await tx.evaluationScore.upsert({
          where: {
            evaluationId_criterionId: {
              evaluationId: savedEval.id,
              criterionId: s.criterionId,
            },
          },
          update: {
            rawScore: s.rawScore,
            feedback: s.feedback,
          },
          create: {
            evaluationId: savedEval.id,
            criterionId: s.criterionId,
            rawScore: s.rawScore,
            originalScore: s.rawScore,
            feedback: s.feedback,
          },
        });
      }

      if (status === 'SUBMITTED') {
        await tx.judgeAssignment.update({
          where: { id: assignment.id },
          data: { status: 'COMPLETED', completedAt: new Date() },
        });
      }

      return savedEval;
    });

    await AuditService.log({
      userId: session.id,
      hackathonId: assignment.judge.hackathonId,
      action: status === 'SUBMITTED' ? 'EVALUATION_SUBMITTED' : 'EVALUATION_DRAFT_SAVED',
      entityType: 'Evaluation',
      entityId: evaluation.id,
      afterState: { weightedScore: computed.weightedScore, status },
    });

    // Real-time notification to organizer and judge rooms
    await eventBus.publish({
      type: status === 'SUBMITTED' ? 'EVALUATION_COMPLETED' : 'EVALUATION_UPDATED',
      hackathonId: assignment.judge.hackathonId,
      projectId: assignment.projectId,
      userId: session.id,
      actorId: session.id,
      rooms: [
        RealtimeRoomBuilder.organizer(assignment.judge.hackathonId),
        RealtimeRoomBuilder.judge(session.id),
        RealtimeRoomBuilder.evaluation(evaluation.id),
        RealtimeRoomBuilder.admin(),
      ],
      payload: {
        evaluationId: evaluation.id,
        assignmentId: assignment.id,
        projectId: assignment.projectId,
        judgeId: assignment.judgeId,
        status,
        weightedScore: computed.weightedScore,
        isCompleted: status === 'SUBMITTED',
      },
    });

    return successResponse(
      {
        evaluationId: evaluation.id,
        weightedScore: computed.weightedScore,
        rawScoreSum: computed.rawScoreSum,
        criterionContributions: computed.criterionContributions,
        status,
      },
      status === 'SUBMITTED' ? 'Evaluation submitted and locked successfully' : 'Evaluation draft saved'
    );
  } catch (error: any) {
    const status = error.status || 500;
    const code = error.code || 'INTERNAL_ERROR';
    return errorResponse(error.message, code, status);
  }
}
