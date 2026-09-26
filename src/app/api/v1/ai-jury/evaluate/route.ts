import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/server/permissions/guards';
import { AIJuryService } from '@/server/services/ai-jury.service';
import { successResponse, errorResponse } from '@/lib/api/response';
import prisma from '@/lib/prisma';
import { AuditService } from '@/server/services/audit.service';

const aiEvalSchema = z.object({
  projectId: z.string().uuid(),
  rubricId: z.string().uuid(),
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

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        hackathon: true,
      },
    });

    if (!project) {
      return errorResponse('Project not found', 'PROJECT_NOT_FOUND', 404);
    }

    const criteria = await prisma.rubricCriterion.findMany({
      where: { rubricId },
      orderBy: { displayOrder: 'asc' },
    });

    if (criteria.length === 0) {
      return errorResponse('No rubric criteria configured', 'NO_RUBRIC_CRITERIA', 400);
    }

    // Get or create active ModelVersion and PromptVersion
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

    // Execute independent AI evaluation
    const evalResult = await AIJuryService.evaluateSubmission(
      {
        projectId: project.id,
        title: project.title,
        description: project.description,
        repoUrl: project.repoUrl,
        demoUrl: project.demoUrl,
        techStack: project.techStack,
      },
      criteria.map((c) => ({
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
        hackathonId: project.hackathonId,
        projectId: project.id,
        rubricId,
        modelVersionId: modelVer.id,
        promptVersionId: promptVer.id,
        overallScore: evalResult.overallScore,
        confidenceScore: evalResult.confidenceScore,
        rawAnalysis: JSON.parse(JSON.stringify(evalResult)),
        summaryFeedback: evalResult.summaryFeedback,
        executionLatencyMs: evalResult.latencyMs,
      },
    });

    // Persist Evidence
    for (const ev of evalResult.evidence) {
      await prisma.aIEvidence.create({
        data: {
          runId: juryRun.id,
          category: ev.category,
          finding: ev.finding,
          snippet: ev.snippet,
          sourceLocation: ev.sourceLocation,
          confidenceLevel: ev.confidenceLevel,
        },
      });
    }

    // Persist Criterion Scores
    for (const sc of evalResult.criterionScores) {
      await prisma.aIScore.create({
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

    return successResponse(
      {
        runId: juryRun.id,
        overallScore: evalResult.overallScore,
        confidenceScore: evalResult.confidenceScore,
        evidenceCount: evalResult.evidence.length,
        summaryFeedback: evalResult.summaryFeedback,
      },
      'AI Jury evaluation completed successfully with verified evidence records'
    );
  } catch (error: any) {
    const status = error.status || 500;
    const code = error.code || 'INTERNAL_ERROR';
    return errorResponse(error.message, code, status);
  }
}
