import { NextRequest } from 'next/server';
import { requireRole } from '@/server/permissions/guards';
import { AIComparisonEngine, ComparisonPair } from '@/server/services/ai-comparison.engine';
import { successResponse, errorResponse } from '@/lib/api/response';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    await requireRole(['ORGANIZER', 'ADMIN']);
    const { searchParams } = new URL(req.url);
    const hackathonId = searchParams.get('hackathonId');

    if (!hackathonId) {
      return errorResponse('Missing hackathonId parameter', 'VALIDATION_ERROR', 400);
    }

    // Fetch AI Jury runs and human evaluations for comparison
    const aiRuns = await prisma.aIJuryRun.findMany({
      where: { hackathonId },
      include: {
        scores: true,
        project: { select: { title: true } },
      },
    });

    const humanEvaluations = await prisma.evaluation.findMany({
      where: {
        project: { hackathonId },
        status: 'SUBMITTED',
      },
      include: {
        scores: true,
      },
    });

    const comparisonPairs: ComparisonPair[] = [];
    const detailedComparisons: any[] = [];

    for (const aiRun of aiRuns) {
      const matchingHumanEvals = humanEvaluations.filter((h) => h.projectId === aiRun.projectId);
      if (matchingHumanEvals.length === 0) continue;

      for (const aiScore of aiRun.scores) {
        // Average human scores for this criterion
        const criterionHumanScores = matchingHumanEvals
          .map((h) => h.scores.find((s) => s.criterionId === aiScore.criterionId)?.rawScore)
          .filter((s): s is number => typeof s === 'number');

        if (criterionHumanScores.length === 0) continue;

        const avgHumanScore =
          criterionHumanScores.reduce((a, b) => a + b, 0) / criterionHumanScores.length;

        comparisonPairs.push({
          criterionId: aiScore.criterionId,
          aiScore: aiScore.score,
          humanScore: avgHumanScore,
          confidence: aiScore.confidence,
        });

        detailedComparisons.push({
          projectId: aiRun.projectId,
          projectTitle: aiRun.project.title,
          criterionId: aiScore.criterionId,
          aiScore: aiScore.score,
          humanScore: Number(avgHumanScore.toFixed(1)),
          difference: Number((aiScore.score - avgHumanScore).toFixed(1)),
          absoluteError: Number(Math.abs(aiScore.score - avgHumanScore).toFixed(1)),
          confidence: aiScore.confidence,
        });
      }
    }

    const metrics = AIComparisonEngine.calculateMetrics(comparisonPairs);

    return successResponse({
      metrics,
      detailedComparisons,
    });
  } catch (error: any) {
    const status = error.status || 500;
    const code = error.code || 'INTERNAL_ERROR';
    return errorResponse(error.message, code, status);
  }
}
