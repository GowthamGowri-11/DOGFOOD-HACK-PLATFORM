import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/server/permissions/guards';
import { AIJuryService } from '@/server/services/ai-jury.service';
import { successResponse, errorResponse } from '@/lib/api/response';
import prisma from '@/lib/prisma';
import { AuditService } from '@/server/services/audit.service';
import { getCache, setCache, CACHE_KEYS } from '@/lib/cache';
import { eventBus } from '@/server/realtime/event-bus';
import { RealtimeRoomBuilder } from '@/server/realtime/event-types';

/** AI Jury result cache TTL: 1 hour. Evaluations are expensive + deterministic per input. */
const AI_EVAL_TTL = 3600;

const aiEvalSchema = z.object({
  projectId: z.string().min(1),
  rubricId: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const session = await requireRole(['ORGANIZER', 'ADMIN']);
    const body = await req.json();
    const parsed = aiEvalSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse('Invalid AI evaluation request', 'VALIDATION_ERROR', 422, parsed.error.format());
    }

    const { projectId, rubricId } = parsed.data;

    // Build a deterministic cache key from both IDs
    const evalCacheKey = CACHE_KEYS.AI_EVAL(`${projectId}:${rubricId}`);

    // Return cached result immediately — AI evaluations are deterministic and expensive
    const cached = await getCache<{
      runId: string;
      overallScore: number;
      confidenceScore: number;
      evidenceCount: number;
      summaryFeedback: string;
      fromCache: boolean;
    }>(evalCacheKey);
    if (cached !== null) {
      return successResponse(
        { ...cached, fromCache: true },
        'AI Jury evaluation returned from cache'
      );
    }

    // Fetch project and its active artifacts
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        track: true,
        problemStatement: true,
      },
    });

    if (!project) {
      return errorResponse('Project not found', 'NOT_FOUND', 404);
    }

    // Fetch rubric and criteria
    const rubric = await prisma.rubric.findUnique({
      where: { id: rubricId },
      include: {
        criteria: {
          orderBy: { displayOrder: 'asc' },
        },
      },
    });

    if (!rubric || rubric.criteria.length === 0) {
      return errorResponse('Rubric not found or contains no criteria', 'NOT_FOUND', 404);
    }

    // Fetch active model & prompt versions
    const activeModel = await prisma.aIModelVersion.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    const activePrompt = await prisma.aIPromptVersion.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    const modelVersionId = activeModel?.id || 'default_model_v1';
    const promptVersionId = activePrompt?.id || 'default_prompt_v3';

    // Execute AI Jury Service
    const evalResult = await AIJuryService.evaluateSubmission(
      {
        projectId: project.id,
        title: project.title,
        description: project.description,
        repoUrl: project.repoUrl,
        demoUrl: project.demoUrl,
        techStack: project.techStack,
        documentation: project.documentationUrl,
      },
      rubric.criteria.map((c) => ({
        id: c.id,
        title: c.title,
        description: c.description,
        weightPercentage: c.weightPercentage,
        maxScore: c.maxScore,
      }))
    );

    // Save AI Jury Run in database
    const juryRun = await prisma.aIJuryRun.create({
      data: {
        hackathonId: project.hackathonId,
        projectId: project.id,
        rubricId: rubric.id,
        modelVersionId,
        promptVersionId,
        overallScore: evalResult.overallScore,
        confidenceScore: evalResult.confidenceScore,
        summaryFeedback: evalResult.summaryFeedback,
        latencyMs: evalResult.latencyMs,
        status: 'COMPLETED',
      },
    });

    // Save Extracted Evidence
    if (evalResult.evidence.length > 0) {
      await prisma.aIEvidence.createMany({
        data: evalResult.evidence.map((ev) => ({
          runId: juryRun.id,
          category: ev.category,
          finding: ev.finding,
          snippet: ev.snippet,
          sourceLocation: ev.sourceLocation,
          confidenceLevel: ev.confidenceLevel,
        })),
      });
    }

    // Save Criterion AI Scores
    for (const sc of evalResult.criterionScores) {
      await prisma.aICriterionScore.create({
        data: {
          runId: juryRun.id,
          criterionId: sc.criterionId,
          score: sc.score,
          confidence: sc.confidence,
          feedback: sc.feedback,
        },
      });
    }

    await AuditService.log({
      userId: session.id,
      hackathonId: project.hackathonId,
      action: 'AI_JURY_EVALUATION',
      entityType: 'AIJuryRun',
      entityId: juryRun.id,
      afterState: { overallScore: evalResult.overallScore, confidence: evalResult.confidenceScore },
    });

    const responsePayload = {
      runId: juryRun.id,
      overallScore: evalResult.overallScore,
      confidenceScore: evalResult.confidenceScore,
      evidenceCount: evalResult.evidence.length,
      summaryFeedback: evalResult.summaryFeedback,
      fromCache: false,
    };

    // Cache the evaluation result for 1 hour — deterministic per project+rubric combo
    await setCache(evalCacheKey, responsePayload, AI_EVAL_TTL);

    // Publish realtime event
    await eventBus.publish({
      type: 'AI_JURY_COMPLETED',
      hackathonId: project.hackathonId,
      projectId: project.id,
      userId: session.id,
      actorId: session.id,
      rooms: [
        RealtimeRoomBuilder.organizer(project.hackathonId),
      ],
      payload: {
        runId: juryRun.id,
        projectId: project.id,
        overallScore: evalResult.overallScore,
        confidenceScore: evalResult.confidenceScore,
        evidenceCount: evalResult.evidence.length,
      },
    });

    return successResponse(
      responsePayload,
      'AI Jury evaluation completed successfully with verified evidence records'
    );
  } catch (error: any) {
    const status = error.status || 500;
    const code = error.code || 'INTERNAL_ERROR';
    return errorResponse(error.message, code, status);
  }
}
