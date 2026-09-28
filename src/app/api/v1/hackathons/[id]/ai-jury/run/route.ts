import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireHackathonOrganizer } from '@/server/permissions/guards';
import { AIJuryService } from '@/server/services/ai-jury.service';
import { RubricRepository } from '@/server/repositories/rubric.repository';
import { successResponse, errorResponse } from '@/lib/api/response';
import prisma from '@/lib/prisma';
import { AuditService } from '@/server/services/audit.service';

const aiJuryRunSchema = z.object({
  projectId: z.string().min(1).optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: hackathonId } = await params;
    const session = await requireHackathonOrganizer(hackathonId);
    const body = await req.json().catch(() => ({}));
    const parsed = aiJuryRunSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse('Invalid parameters', 'VALIDATION_ERROR', 422, parsed.error.format());
    }

    const { projectId } = parsed.data;

    // Fetch active rubric
    const rubric = await RubricRepository.findCurrentByHackathon(hackathonId);
    if (!rubric || rubric.criteria.length === 0) {
      return errorResponse('No active rubric criteria configured for this hackathon', 'NO_RUBRIC_CONFIGURED', 400);
    }

    // Fetch projects to evaluate
    const projects = await prisma.project.findMany({
      where: {
        hackathonId,
        ...(projectId ? { id: projectId } : {}),
        submissions: { some: { status: 'SUBMITTED' } },
      },
      include: {
        submissions: {
          where: { status: 'SUBMITTED' },
          orderBy: { versionNumber: 'desc' },
          take: 1,
        },
      },
    });

    if (projects.length === 0) {
      return errorResponse('No submitted projects found to evaluate', 'NO_PROJECTS_FOUND', 400);
    }

    // Ensure active AIModelVersion and PromptVersion exist
    const modelVer = await prisma.aIModelVersion.upsert({
      where: { versionTag: 'v1.4' },
      update: {},
      create: {
        versionTag: 'v1.4',
        modelProvider: 'anthropic',
        modelName: 'claude-3-7-sonnet',
        temperature: 0.2,
        systemPromptHash: 'hash_sha256_enterprise_v1',
      },
    });

    const promptVer = await prisma.promptVersion.upsert({
      where: { versionTag: 'v3' },
      update: {},
      create: {
        versionTag: 'v3',
        promptTemplate: 'Analyze repository artifacts with objective criterion grounding.',
        evidenceRules: 'Categorize findings by architecture, code quality, APIs, security, and tests.',
      },
    });

    const runResults = [];

    for (const project of projects) {
      const latestSub = project.submissions[0];
      const payload: any = latestSub?.payloadSnapshot || {};

      // CRITICAL: AI independently evaluates the locked submission artifacts without receiving human scores
      const evalResult = await AIJuryService.evaluateSubmission(
        {
          projectId: project.id,
          title: payload.title || project.title,
          description: payload.description || project.description,
          repoUrl: payload.repoUrl || project.repoUrl,
          demoUrl: payload.demoUrl || project.demoUrl,
          techStack: payload.techStack || project.techStack,
        },
        rubric.criteria.map((c) => ({
          id: c.id,
          title: c.title,
          description: c.description,
          weightPercentage: c.weightPercentage,
          maxScore: c.maxScore,
        }))
      );

      // Persist AIJuryRun
      const juryRun = await prisma.aIJuryRun.create({
        data: {
          hackathonId,
          projectId: project.id,
          rubricId: rubric.id,
          modelVersionId: modelVer.id,
          promptVersionId: promptVer.id,
          overallScore: evalResult.overallScore,
          confidenceScore: evalResult.confidenceScore,
          rawAnalysis: JSON.parse(JSON.stringify(evalResult)),
          summaryFeedback: evalResult.summaryFeedback,
          executionLatencyMs: evalResult.latencyMs,
          evidence: {
            create: evalResult.evidence.map((ev) => ({
              category: ev.category,
              finding: ev.finding,
              snippet: ev.snippet,
              sourceLocation: ev.sourceLocation,
              confidenceLevel: ev.confidenceLevel,
            })),
          },
          scores: {
            create: evalResult.criterionScores.map((sc) => ({
              criterionId: sc.criterionId,
              score: sc.score,
              confidence: sc.confidence,
              feedback: sc.feedback,
            })),
          },
        },
      });

      // If human evaluations already exist, calculate and store post-evaluation AIHumanComparison records
      const humanEvals = await prisma.evaluation.findMany({
        where: { projectId: project.id, status: 'SUBMITTED' },
        include: { scores: true },
      });

      for (const humanEval of humanEvals) {
        for (const aiSc of evalResult.criterionScores) {
          const matchingHumanScore = humanEval.scores.find((s) => s.criterionId === aiSc.criterionId);
          if (matchingHumanScore) {
            const diff = Number((aiSc.score - matchingHumanScore.rawScore).toFixed(2));
            const absErr = Number(Math.abs(diff).toFixed(2));
            const isAgree = absErr <= 10;

            await prisma.aIHumanComparison.create({
              data: {
                aiRunId: juryRun.id,
                evaluationId: humanEval.id,
                criterionId: aiSc.criterionId,
                aiScore: aiSc.score,
                humanScore: matchingHumanScore.rawScore,
                scoreDifference: diff,
                absoluteError: absErr,
                confidence: aiSc.confidence,
                agreementCategory: isAgree ? 'AGREEMENT' : diff > 0 ? 'AI_HIGHER' : 'HUMAN_HIGHER',
              },
            });
          }
        }
      }

      runResults.push({
        projectId: project.id,
        projectTitle: project.title,
        runId: juryRun.id,
        overallScore: evalResult.overallScore,
        confidenceScore: evalResult.confidenceScore,
        evidenceCount: evalResult.evidence.length,
      });
    }

    await AuditService.log({
      userId: session.id,
      hackathonId,
      action: 'AI_JURY_BATCH_RUN',
      entityType: 'AIJuryRun',
      entityId: hackathonId,
      afterState: { evaluatedProjectsCount: runResults.length },
    });

    return successResponse(
      { evaluatedProjects: runResults },
      'Autonomous AI Jury batch evaluation completed successfully'
    );
  } catch (error: any) {
    const status = error.status || 500;
    const code = error.code || 'INTERNAL_ERROR';
    return errorResponse(error.message, code, status);
  }
}
