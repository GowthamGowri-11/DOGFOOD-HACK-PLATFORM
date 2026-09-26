import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/server/permissions/guards';
import { NormalizationEngine } from '@/server/services/normalization.engine';
import { ResultEngine } from '@/server/services/result.engine';
import { successResponse, errorResponse } from '@/lib/api/response';
import prisma from '@/lib/prisma';
import { AuditService } from '@/server/services/audit.service';

const normalizationSchema = z.object({
  hackathonId: z.string().uuid(),
  method: z.enum(['Z_SCORE', 'MIN_MAX']).default('Z_SCORE'),
});

export async function POST(req: NextRequest) {
  try {
    const session = await requireRole(['ORGANIZER', 'ADMIN']);
    const body = await req.json();
    const parsed = normalizationSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse('Invalid normalization parameters', 'VALIDATION_ERROR', 422, parsed.error.format());
    }

    const { hackathonId, method } = parsed.data;

    // Fetch submitted evaluations
    const evaluations = await prisma.evaluation.findMany({
      where: {
        project: { hackathonId },
        status: 'SUBMITTED',
      },
      select: {
        judgeId: true,
        projectId: true,
        weightedScore: true,
      },
    });

    if (evaluations.length === 0) {
      return errorResponse('No submitted evaluations available to normalize', 'NO_EVALUATIONS_FOUND', 400);
    }

    const normalizedScores =
      method === 'Z_SCORE'
        ? NormalizationEngine.computeZScoreNormalization(evaluations)
        : NormalizationEngine.computeMinMaxNormalization(evaluations);

    // Fetch prizes to map ranking awards
    const prizes = await prisma.prize.findMany({
      where: { hackathonId },
      orderBy: { rankOrder: 'asc' },
    });

    const rankedResults = ResultEngine.computeRankings(
      normalizedScores.map((n) => ({
        projectId: n.projectId,
        finalScore: n.finalScore,
        rawAverage: n.rawAverage,
        normalizedScore: n.normalizedScore,
      })),
      prizes.map((p) => ({ title: p.title, rankOrder: p.rankOrder }))
    );

    // Save normalization run metadata
    const normRun = await prisma.scoreNormalization.create({
      data: {
        hackathonId,
        method,
      },
    });

    // Upsert project results
    for (const r of rankedResults) {
      await prisma.result.upsert({
        where: { projectId: r.projectId },
        update: {
          normalizationId: normRun.id,
          rawAverageScore: r.rawAverageScore,
          normalizedScore: r.normalizedScore,
          finalScore: r.finalScore,
          rank: r.rank,
          awardCategory: r.awardCategory,
          isWinner: r.isWinner,
        },
        create: {
          hackathonId,
          projectId: r.projectId,
          normalizationId: normRun.id,
          rawAverageScore: r.rawAverageScore,
          normalizedScore: r.normalizedScore,
          finalScore: r.finalScore,
          rank: r.rank,
          awardCategory: r.awardCategory,
          isWinner: r.isWinner,
        },
      });
    }

    await AuditService.log({
      userId: session.id,
      hackathonId,
      action: 'NORMALIZATION_COMPUTE',
      entityType: 'ScoreNormalization',
      entityId: normRun.id,
      afterState: { method, resultsCount: rankedResults.length },
    });

    return successResponse(
      {
        normalizationRunId: normRun.id,
        method,
        rankedResults,
      },
      'Scores normalized and rankings computed successfully'
    );
  } catch (error: any) {
    const status = error.status || 500;
    const code = error.code || 'INTERNAL_ERROR';
    return errorResponse(error.message, code, status);
  }
}
