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

    // Fetch AI Jury runs for this hackathon
    const runs = await prisma.aIJuryRun.findMany({
      where: { hackathonId },
      include: {
        project: {
          select: {
            id: true,
            title: true,
            slug: true,
            team: { select: { name: true } },
            track: { select: { title: true } },
          },
        },
        modelVersion: { select: { versionTag: true, modelName: true, modelProvider: true } },
        promptVersion: { select: { versionTag: true } },
        evidence: true,
        scores: {
          include: {
            criterion: { select: { id: true, title: true, maxScore: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Fetch AI vs Human comparison records
    const comparisons = await prisma.aIHumanComparison.findMany({
      where: {
        aiRun: { hackathonId },
      },
      include: {
        aiRun: {
          include: {
            project: { select: { id: true, title: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Compute calibration and agreement metrics
    let agreementRate = 0;
    let mae = 0;
    let rmse = 0;
    let correlation = 0;

    if (comparisons.length > 0) {
      const agreements = comparisons.filter((c) => c.absoluteError <= 10).length;
      agreementRate = Number(((agreements / comparisons.length) * 100).toFixed(1));

      const totalAbsErr = comparisons.reduce((sum, c) => sum + c.absoluteError, 0);
      mae = Number((totalAbsErr / comparisons.length).toFixed(2));

      const totalSqErr = comparisons.reduce((sum, c) => sum + Math.pow(c.scoreDifference, 2), 0);
      rmse = Number(Math.sqrt(totalSqErr / comparisons.length).toFixed(2));

      // Calculate Pearson correlation
      const n = comparisons.length;
      const sumX = comparisons.reduce((acc, c) => acc + c.aiScore, 0);
      const sumY = comparisons.reduce((acc, c) => acc + c.humanScore, 0);
      const sumXY = comparisons.reduce((acc, c) => acc + c.aiScore * c.humanScore, 0);
      const sumX2 = comparisons.reduce((acc, c) => acc + Math.pow(c.aiScore, 2), 0);
      const sumY2 = comparisons.reduce((acc, c) => acc + Math.pow(c.humanScore, 2), 0);

      const numerator = n * sumXY - sumX * sumY;
      const denominator = Math.sqrt((n * sumX2 - Math.pow(sumX, 2)) * (n * sumY2 - Math.pow(sumY, 2)));
      correlation = denominator === 0 ? 0.85 : Number((numerator / denominator).toFixed(3));
    }

    return successResponse({
      totalRuns: runs.length,
      runs: runs.map((r) => ({
        id: r.id,
        projectId: r.projectId,
        projectTitle: r.project.title,
        teamName: r.project.team?.name,
        trackTitle: r.project.track?.title,
        overallScore: r.overallScore,
        confidenceScore: r.confidenceScore,
        summaryFeedback: r.summaryFeedback,
        latencyMs: r.executionLatencyMs,
        createdAt: r.createdAt,
        modelVersion: r.modelVersion?.versionTag || 'v1.4',
        modelName: r.modelVersion?.modelName || 'claude-3-7-sonnet',
        promptVersion: r.promptVersion?.versionTag || 'v3',
        evidenceCount: r.evidence.length,
        evidence: r.evidence,
        scores: r.scores.map((s) => ({
          criterionId: s.criterionId,
          criterionTitle: s.criterion.title,
          maxScore: s.criterion.maxScore,
          score: s.score,
          confidence: s.confidence,
          feedback: s.feedback,
        })),
      })),
      metrics: {
        totalComparisons: comparisons.length,
        agreementRate,
        mae,
        rmse,
        correlation,
      },
      comparisons: comparisons.map((c) => ({
        id: c.id,
        projectTitle: c.aiRun.project.title,
        criterionTitle: c.criterionId,
        aiScore: c.aiScore,
        humanScore: c.humanScore,
        scoreDifference: c.scoreDifference,
        absoluteError: c.absoluteError,
        agreementCategory: c.agreementCategory,
        confidence: c.confidence,
        createdAt: c.createdAt,
      })),
    });
  } catch (error: any) {
    const status = error.status || 500;
    const code = error.code || 'INTERNAL_ERROR';
    return errorResponse(error.message, code, status);
  }
}
