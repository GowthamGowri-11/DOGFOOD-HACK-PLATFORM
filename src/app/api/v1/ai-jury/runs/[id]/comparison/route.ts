import { NextRequest } from 'next/server';
import { requireRole } from '@/server/permissions/guards';
import { AIComparisonEngine } from '@/server/services/ai-comparison.engine';
import { successResponse, errorResponse } from '@/lib/api/response';
import prisma from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(['ORGANIZER', 'ADMIN']);
    const { id: runId } = await params;

    const juryRun = await prisma.aIJuryRun.findUnique({
      where: { id: runId },
      include: {
        scores: { include: { criterion: true } },
        project: { select: { id: true, title: true } },
      },
    });

    if (!juryRun) {
      return errorResponse('AI Jury Run not found', 'NOT_FOUND', 404);
    }

    const humanEvaluations = await prisma.evaluation.findMany({
      where: {
        projectId: juryRun.projectId,
        status: 'SUBMITTED',
      },
      include: {
        scores: { include: { criterion: true } },
        judge: { include: { user: { select: { fullName: true } } } },
      },
    });

    const comparisonPairs: {
      criterionId: string;
      criterionTitle: string;
      aiScore: number;
      humanScore: number;
      confidence: number;
      difference: number;
      absoluteError: number;
    }[] = [];

    for (const aiScore of juryRun.scores) {
      const criterionHumanScores = humanEvaluations
        .map((h) => h.scores.find((s) => s.criterionId === aiScore.criterionId)?.rawScore)
        .filter((s): s is number => typeof s === 'number');

      if (criterionHumanScores.length > 0) {
        const avgHuman =
          criterionHumanScores.reduce((a, b) => a + b, 0) / criterionHumanScores.length;

        comparisonPairs.push({
          criterionId: aiScore.criterionId,
          criterionTitle: aiScore.criterion.title,
          aiScore: aiScore.score,
          humanScore: Number(avgHuman.toFixed(1)),
          confidence: aiScore.confidence,
          difference: Number((aiScore.score - avgHuman).toFixed(1)),
          absoluteError: Number(Math.abs(aiScore.score - avgHuman).toFixed(1)),
        });
      }
    }

    const metrics = AIComparisonEngine.calculateMetrics(
      comparisonPairs.map((p) => ({
        criterionId: p.criterionId,
        aiScore: p.aiScore,
        humanScore: p.humanScore,
        confidence: p.confidence,
      }))
    );

    return successResponse({
      runId,
      projectTitle: juryRun.project.title,
      overallAIScore: juryRun.overallScore,
      aiConfidence: juryRun.confidenceScore,
      humanEvaluationsCount: humanEvaluations.length,
      metrics,
      comparisons: comparisonPairs,
    });
  } catch (error: any) {
    const status = error.status || 500;
    const code = error.code || 'INTERNAL_ERROR';
    return errorResponse(error.message, code, status);
  }
}
