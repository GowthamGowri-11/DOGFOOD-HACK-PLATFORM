import prisma from '@/lib/prisma';
import { NormalizationEngine } from './normalization.engine';
import { ResultEngine, RankedProjectResult } from './result.engine';
import { AuditService } from './audit.service';
import { eventBus } from '@/server/realtime/event-bus';
import { RealtimeRoomBuilder } from '@/server/realtime/event-types';

export interface ResultGenerationOptions {
  method?: 'Z_SCORE' | 'MIN_MAX';
  forceRegenerate?: boolean;
}

export interface ResultVerificationReport {
  isVerified: boolean;
  totalProjects: number;
  rankedProjectsCount: number;
  hasNaNOrInfinity: boolean;
  duplicateRanks: number[];
  unassignedPrizesCount: number;
  anomalies: string[];
}

export class ResultService {
  /**
   * Generates official hackathon results from completed human evaluations.
   * Enforces judging completion and data integrity preconditions.
   */
  public static async generateResults(
    hackathonId: string,
    userId: string,
    options: ResultGenerationOptions = {}
  ): Promise<{
    results: RankedProjectResult[];
    normalizationId: string;
    version: number;
  }> {
    const method = options.method || 'Z_SCORE';

    // 1. Fetch Hackathon and verify lifecycle state
    const hackathon = await prisma.hackathon.findUnique({
      where: { id: hackathonId },
      include: {
        prizes: { orderBy: { rankOrder: 'asc' } },
      },
    });

    if (!hackathon) {
      throw { status: 404, code: 'HACKATHON_NOT_FOUND', message: 'Hackathon not found.' };
    }

    // 2. Fetch all submitted projects
    const submittedProjects = await prisma.project.findMany({
      where: {
        hackathonId,
        submissions: { some: { status: 'SUBMITTED' } },
      },
      include: {
        evaluations: {
          where: { status: 'SUBMITTED' },
        },
      },
    });

    if (submittedProjects.length === 0) {
      throw {
        status: 400,
        code: 'NO_SUBMITTED_PROJECTS',
        message: 'No submitted projects found to generate results for.',
      };
    }

    // 3. Verify Precondition: All submitted projects must have at least one completed evaluation
    const unevaluatedProjects = submittedProjects.filter((p) => p.evaluations.length === 0);
    if (unevaluatedProjects.length > 0 && !options.forceRegenerate) {
      const titles = unevaluatedProjects.map((p) => p.title).slice(0, 3).join(', ');
      throw {
        status: 400,
        code: 'JUDGING_INCOMPLETE',
        message: `Judging is incomplete. ${unevaluatedProjects.length} projects have no completed evaluations (${titles}).`,
      };
    }

    // 4. Collect evaluation records for normalization
    const evalRecords: { judgeId: string; projectId: string; weightedScore: number }[] = [];
    submittedProjects.forEach((p) => {
      p.evaluations.forEach((e) => {
        evalRecords.push({
          judgeId: e.judgeId,
          projectId: e.projectId,
          weightedScore: e.weightedScore,
        });
      });
    });

    if (evalRecords.length === 0) {
      throw {
        status: 400,
        code: 'NO_COMPLETED_EVALUATIONS',
        message: 'No completed evaluations found. Results cannot be generated.',
      };
    }

    // 5. Compute Normalization
    const normalizedScores =
      method === 'Z_SCORE'
        ? NormalizationEngine.computeZScoreNormalization(evalRecords)
        : NormalizationEngine.computeMinMaxNormalization(evalRecords);

    // 6. Compute Ranked Results & Map Prizes
    const rankedResults = ResultEngine.computeRankings(
      normalizedScores.map((n) => ({
        projectId: n.projectId,
        finalScore: n.finalScore,
        rawAverage: n.rawAverage,
        normalizedScore: n.normalizedScore,
      })),
      hackathon.prizes.map((p) => ({ title: p.title, rankOrder: p.rankOrder }))
    );

    // 7. Atomic Transaction: Persist ScoreNormalization and Result records
    const latestNorm = await prisma.scoreNormalization.findFirst({
      where: { hackathonId },
      orderBy: { version: 'desc' },
    });
    const nextVersion = (latestNorm?.version || 0) + 1;

    const normRun = await prisma.scoreNormalization.create({
      data: {
        hackathonId,
        method,
        version: nextVersion,
      },
    });

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
      userId,
      hackathonId,
      action: 'RESULTS_GENERATED',
      entityType: 'ScoreNormalization',
      entityId: normRun.id,
      afterState: { version: nextVersion, method, rankedCount: rankedResults.length },
    });

    await eventBus.publish({
      type: 'RESULTS_GENERATED',
      hackathonId,
      actorId: userId,
      rooms: [
        RealtimeRoomBuilder.organizer(hackathonId),
      ],
      payload: {
        hackathonId,
        version: nextVersion,
        rankedCount: rankedResults.length,
      },
    });

    return {
      results: rankedResults,
      normalizationId: normRun.id,
      version: nextVersion,
    };
  }

  /**
   * Verifies the mathematical and structural integrity of generated results prior to publication.
   */
  public static async verifyResults(hackathonId: string): Promise<ResultVerificationReport> {
    const results = await prisma.result.findMany({
      where: { hackathonId },
      include: {
        project: {
          include: {
            submissions: { where: { status: 'SUBMITTED' } },
          },
        },
      },
      orderBy: { rank: 'asc' },
    });

    const totalProjects = await prisma.project.count({
      where: {
        hackathonId,
        submissions: { some: { status: 'SUBMITTED' } },
      },
    });

    const anomalies: string[] = [];
    let hasNaNOrInfinity = false;
    const rankCounts = new Map<number, number>();

    if (results.length === 0) {
      anomalies.push('No generated results found for this hackathon.');
    }

    if (results.length < totalProjects) {
      anomalies.push(`Missing results: ${totalProjects - results.length} submitted projects lack result records.`);
    }

    results.forEach((r) => {
      if (isNaN(r.finalScore) || !isFinite(r.finalScore)) {
        hasNaNOrInfinity = true;
        anomalies.push(`Project "${r.project.title}" has invalid final score: ${r.finalScore}`);
      }

      if (r.project.submissions.length === 0) {
        anomalies.push(`Project "${r.project.title}" lacks a locked submission snapshot.`);
      }

      const count = (rankCounts.get(r.rank) || 0) + 1;
      rankCounts.set(r.rank, count);
    });

    const duplicateRanks: number[] = [];
    rankCounts.forEach((count, rank) => {
      if (count > 1) duplicateRanks.push(rank);
    });

    if (duplicateRanks.length > 0) {
      anomalies.push(`Duplicate ranks detected: Ranks ${duplicateRanks.join(', ')} assigned to multiple projects.`);
    }

    const prizes = await prisma.prize.findMany({ where: { hackathonId } });
    const unassignedPrizes = prizes.filter(
      (p) => !results.some((r) => r.rank === p.rankOrder && r.awardCategory === p.title)
    );

    const isVerified = anomalies.length === 0 && !hasNaNOrInfinity;

    return {
      isVerified,
      totalProjects,
      rankedProjectsCount: results.length,
      hasNaNOrInfinity,
      duplicateRanks,
      unassignedPrizesCount: unassignedPrizes.length,
      anomalies,
    };
  }

  /**
   * Officially publishes verified results to the public leaderboard.
   */
  public static async publishResults(hackathonId: string, userId: string) {
    const verification = await this.verifyResults(hackathonId);
    if (!verification.isVerified && verification.rankedProjectsCount === 0) {
      throw {
        status: 400,
        code: 'RESULT_VERIFICATION_FAILED',
        message: `Cannot publish results. Verification failed: ${verification.anomalies.join('; ')}`,
      };
    }

    await prisma.$transaction(async (tx) => {
      await tx.result.updateMany({
        where: { hackathonId },
        data: {
          isPublished: true,
          publishedAt: new Date(),
        },
      });

      await tx.hackathon.update({
        where: { id: hackathonId },
        data: {
          status: 'RESULTS_PUBLISHED',
          resultsPublishedAt: new Date(),
        },
      });
    });

    await AuditService.log({
      userId,
      hackathonId,
      action: 'RESULTS_PUBLISHED',
      entityType: 'Hackathon',
      entityId: hackathonId,
      afterState: { status: 'RESULTS_PUBLISHED', publishedResultsCount: verification.rankedProjectsCount },
    });

    await eventBus.publish({
      type: 'RESULTS_PUBLISHED',
      hackathonId,
      actorId: userId,
      rooms: [
        RealtimeRoomBuilder.hackathon(hackathonId),
        RealtimeRoomBuilder.organizer(hackathonId),
      ],
      payload: {
        hackathonId,
        status: 'RESULTS_PUBLISHED',
        publishedCount: verification.rankedProjectsCount,
      },
    });

    return {
      hackathonId,
      status: 'RESULTS_PUBLISHED',
      publishedResultsCount: verification.rankedProjectsCount,
    };
  }
}
