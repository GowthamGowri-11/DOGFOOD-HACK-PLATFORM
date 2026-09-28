import prisma from '@/lib/prisma';
import { DistributedLock } from '@/lib/lock';
import { AuditService } from '@/server/services/audit.service';
import { NotificationService } from '@/server/services/notification.service';
import { eventBus } from '@/server/realtime/event-bus';
import { RealtimeRoomBuilder } from '@/server/realtime/event-types';
import { ResultEngine } from '@/server/services/result.engine';
import { NormalizationEngine } from '@/server/services/normalization.engine';
import { ProgressionMode, TeamProgressionStatus, RoundStatus, EvaluationStatus } from '@prisma/client';

export interface RoundAdvancementRule {
  roundNumber: number;
  name: string;
  progressionMode: ProgressionMode;
  selectionCount?: number | null;
  maxTeamsAllowed?: number | null;
  isFinal?: boolean;
}

export interface FinalizeRoundOptions {
  selectionCount?: number;
  normalizationMethod?: 'Z_SCORE' | 'MIN_MAX';
  forceFinalize?: boolean;
}

export interface RoundFinalizationResult {
  hackathonId: string;
  roundNumber: number;
  progressionMode: ProgressionMode;
  eligibleTeamsCount: number;
  selectedTeamsCount: number;
  eliminatedTeamsCount: number;
  advancedTeamIds: string[];
  eliminatedTeamIds: string[];
  isFinalRound: boolean;
  roundResults: {
    teamId: string;
    projectId: string;
    rank: number;
    finalScore: number;
    rawAverageScore: number;
    status: TeamProgressionStatus;
  }[];
}

export interface TeamRoundAccessCheck {
  allowed: boolean;
  status: number;
  code: string;
  message: string;
  team?: any;
  hackathon?: any;
  highestRound?: number;
  progressionStatus?: TeamProgressionStatus;
}

export class RoundProgressionService {
  /**
   * Validates selection count configuration for a given round.
   */
  public static validateSelectionCount(
    selectionCount: any,
    eligibleTeamsCount: number,
    progressionMode: ProgressionMode
  ): { isValid: boolean; error?: string; count?: number } {
    if (progressionMode === ProgressionMode.OVERALL_PERFORMANCE) {
      return { isValid: true };
    }

    if (selectionCount === undefined || selectionCount === null || selectionCount === '') {
      return { isValid: false, error: 'Selection count is required for selection-based progression.' };
    }

    const count = Number(selectionCount);
    if (!Number.isInteger(count) || count <= 0) {
      return { isValid: false, error: 'Selection count must be a positive integer greater than zero.' };
    }

    if (eligibleTeamsCount > 0 && count > eligibleTeamsCount) {
      return {
        isValid: false,
        error: `Selection count (${count}) cannot exceed the number of eligible participating teams (${eligibleTeamsCount}).`,
      };
    }

    return { isValid: true, count };
  }

  /**
   * Authoritative backend verification of team access to a requested round.
   * Checks:
   * 1. Authenticated user
   * 2. Hackathon participation & team membership
   * 3. Progression mode & team status (ELIGIBLE, ADVANCED, ELIMINATED, DISQUALIFIED)
   * 4. Unlocked round level
   */
  public static async checkTeamRoundAccess(
    userId: string,
    hackathonId: string,
    roundNumber: number
  ): Promise<TeamRoundAccessCheck> {
    if (!userId) {
      return {
        allowed: false,
        status: 401,
        code: 'UNAUTHORIZED',
        message: 'Authentication required to access round resources.',
      };
    }

    const hackathon = await prisma.hackathon.findUnique({
      where: { id: hackathonId },
      include: {
        rounds: { orderBy: { roundNumber: 'asc' } },
      },
    });

    if (!hackathon) {
      return {
        allowed: false,
        status: 404,
        code: 'HACKATHON_NOT_FOUND',
        message: 'Hackathon not found.',
      };
    }

    // Find team for user
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        userId,
        team: { hackathonId },
      },
      include: {
        team: {
          include: {
            project: true,
          },
        },
      },
    });

    if (!teamMember || !teamMember.team) {
      return {
        allowed: false,
        status: 403,
        code: 'NOT_IN_TEAM',
        message: 'You are not a registered member of any team in this hackathon.',
      };
    }

    const team = teamMember.team;
    const requestedRound = Number(roundNumber) || 1;

    // Disqualified check
    if (team.progressionStatus === TeamProgressionStatus.DISQUALIFIED) {
      return {
        allowed: false,
        status: 403,
        code: 'TEAM_DISQUALIFIED',
        message: 'Your team has been disqualified from participating.',
        team,
        hackathon,
        highestRound: team.highestRound,
        progressionStatus: team.progressionStatus,
      };
    }

    // Overall Performance mode: all eligible teams participate in all rounds
    if (hackathon.progressionMode === ProgressionMode.OVERALL_PERFORMANCE) {
      return {
        allowed: true,
        status: 200,
        code: 'ACCESS_GRANTED',
        message: 'Access granted.',
        team,
        hackathon,
        highestRound: team.highestRound,
        progressionStatus: team.progressionStatus,
      };
    }

    // Selection-Based mode: strict progression checks
    // An eliminated team cannot access current active round or any future rounds
    if (
      team.progressionStatus === TeamProgressionStatus.ELIMINATED &&
      (requestedRound >= (hackathon.currentRoundNumber || 1) || requestedRound > team.highestRound)
    ) {
      return {
        allowed: false,
        status: 403,
        code: 'TEAM_ELIMINATED',
        message: `Your team was not selected for Round ${requestedRound} of ${hackathon.title}. You can view the published leaderboard.`,
        team,
        hackathon,
        highestRound: team.highestRound,
        progressionStatus: team.progressionStatus,
      };
    }

    if (requestedRound > team.highestRound) {
      return {
        allowed: false,
        status: 403,
        code: 'ROUND_LOCKED',
        message: `Round ${requestedRound} is currently locked for your team. You have only advanced up to Round ${team.highestRound}.`,
        team,
        hackathon,
        highestRound: team.highestRound,
        progressionStatus: team.progressionStatus,
      };
    }

    return {
      allowed: true,
      status: 200,
      code: 'ACCESS_GRANTED',
      message: 'Access granted.',
      team,
      hackathon,
      highestRound: team.highestRound,
      progressionStatus: team.progressionStatus,
    };
  }

  /**
   * Syncs Round records in the database with the JSON rounds configuration
   * from rulesAndGuidelines or API payload.
   */
  public static async syncRoundsFromConfig(
    hackathonId: string,
    roundsConfig: any[],
    progressionMode?: ProgressionMode
  ): Promise<any[]> {
    if (!Array.isArray(roundsConfig) || roundsConfig.length === 0) {
      return [];
    }

    const syncedRounds = [];
    for (let i = 0; i < roundsConfig.length; i++) {
      const r = roundsConfig[i];
      const roundNum = i + 1;
      const isFinal = r.isFinal || i === roundsConfig.length - 1;
      // In OVERALL_PERFORMANCE mode, selectionCount must not be used (Requirement 3 & 19)
      const selectionCount = (progressionMode === ProgressionMode.OVERALL_PERFORMANCE)
        ? null
        : (r.selectionCount ? Number(r.selectionCount) : null);
      const maxTeams = r.maxTeamsAllowed ? Number(r.maxTeamsAllowed) : null;

      const roundRecord = await prisma.round.upsert({
        where: {
          hackathonId_roundNumber: {
            hackathonId,
            roundNumber: roundNum,
          },
        },
        update: {
          name: r.name || `Round ${roundNum}`,
          roundType: r.roundType || 'HACKATHON',
          startDate: r.startDate ? new Date(r.startDate) : null,
          endDate: r.endDate ? new Date(r.endDate) : null,
          submissionDeadline: r.submissionDeadline ? new Date(r.submissionDeadline) : null,
          selectionCount,
          maxTeamsAllowed: maxTeams,
          isFinal,
        },
        create: {
          hackathonId,
          roundNumber: roundNum,
          name: r.name || `Round ${roundNum}`,
          roundType: r.roundType || 'HACKATHON',
          status: RoundStatus.ACTIVE,
          startDate: r.startDate ? new Date(r.startDate) : null,
          endDate: r.endDate ? new Date(r.endDate) : null,
          submissionDeadline: r.submissionDeadline ? new Date(r.submissionDeadline) : null,
          selectionCount,
          maxTeamsAllowed: maxTeams,
          isFinal,
        },
      });

      syncedRounds.push(roundRecord);
    }

    return syncedRounds;
  }

  /**
   * Transactional and Idempotent Round Result Finalization.
   * Consumes finalized evaluation scores, ranks eligible teams, handles ties deterministically,
   * decides advancement/elimination, updates progression state, records audit logs,
   * and dispatches notifications.
   */
  public static async finalizeRoundResults(
    hackathonId: string,
    roundNumber: number,
    actorUserId: string,
    options: FinalizeRoundOptions = {}
  ): Promise<RoundFinalizationResult> {
    const lockKey = `lock:round:finalize:${hackathonId}:${roundNumber}`;

    return await DistributedLock.withLock(lockKey, async () => {
      // 1. Fetch Hackathon
      const hackathon = await prisma.hackathon.findUnique({
        where: { id: hackathonId },
        include: {
          prizes: { orderBy: { rankOrder: 'asc' } },
          rounds: { orderBy: { roundNumber: 'asc' } },
        },
      });

      if (!hackathon) {
        throw { status: 404, code: 'HACKATHON_NOT_FOUND', message: 'Hackathon not found.' };
      }

      // Check if rounds exist in DB; if not, sync from rulesAndGuidelines
      let rounds = hackathon.rounds;
      if (rounds.length === 0 && hackathon.rulesAndGuidelines) {
        try {
          const parsed = JSON.parse(hackathon.rulesAndGuidelines);
          if (Array.isArray(parsed.rounds) && parsed.rounds.length > 0) {
            rounds = await this.syncRoundsFromConfig(hackathonId, parsed.rounds);
          }
        } catch {
          // ignore parsing error
        }
      }

      const currentRoundConfig = rounds.find((r) => r.roundNumber === roundNumber) || {
        id: undefined,
        roundNumber,
        name: `Round ${roundNumber}`,
        selectionCount: options.selectionCount ?? null,
        isFinal: roundNumber >= Math.max(rounds.length, 1),
      };

      const isFinalRound = currentRoundConfig.isFinal || roundNumber >= Math.max(rounds.length, 1);

      // Check idempotency: If round is already COMPLETED and not forceFinalize, return existing results safely
      const existingCompletedRound = rounds.find(
        (r) => r.roundNumber === roundNumber && r.status === RoundStatus.COMPLETED
      );
      if (existingCompletedRound && !options.forceFinalize) {
        const existingResults = await prisma.roundResult.findMany({
          where: { hackathonId, roundNumber },
          orderBy: { rank: 'asc' },
        });

        if (existingResults.length > 0) {
          const advanced = existingResults.filter((r) => r.progressionStatus === TeamProgressionStatus.ADVANCED);
          const eliminated = existingResults.filter((r) => r.progressionStatus === TeamProgressionStatus.ELIMINATED);

          return {
            hackathonId,
            roundNumber,
            progressionMode: hackathon.progressionMode,
            eligibleTeamsCount: existingResults.length,
            selectedTeamsCount: advanced.length,
            eliminatedTeamsCount: eliminated.length,
            advancedTeamIds: advanced.map((a) => a.teamId),
            eliminatedTeamIds: eliminated.map((e) => e.teamId),
            isFinalRound,
            roundResults: existingResults.map((r) => ({
              teamId: r.teamId,
              projectId: r.projectId || '',
              rank: r.rank,
              finalScore: r.finalScore,
              rawAverageScore: r.rawAverageScore,
              status: r.progressionStatus,
            })),
          };
        }
      }

      // Check evaluation completeness: Incomplete assignments/draft evaluations cannot trigger progression
      if (!options.forceFinalize) {
        const unfinishedAssignments = await prisma.judgeAssignment.count({
          where: {
            status: { in: ['ASSIGNED', 'IN_PROGRESS'] },
            project: { hackathonId },
            ...(currentRoundConfig.id ? { roundId: currentRoundConfig.id } : {}),
          },
        });
        const draftEvaluations = await prisma.evaluation.count({
          where: {
            status: EvaluationStatus.DRAFT,
            project: { hackathonId },
            ...(currentRoundConfig.id ? { roundId: currentRoundConfig.id } : {}),
          },
        });
        if (unfinishedAssignments > 0 || draftEvaluations > 0) {
          throw {
            status: 400,
            code: 'EVALUATIONS_INCOMPLETE',
            message: `Cannot finalize Round ${roundNumber}: ${unfinishedAssignments} judge assignment(s) in progress and ${draftEvaluations} draft evaluation(s) remain unsubmitted. All evaluations must be completed before finalization.`,
          };
        }
      }

      // 2. Fetch eligible participating teams for this round
      // For Round 1: All active teams in hackathon that are not DISQUALIFIED
      // For Round N (N > 1): Teams that have highestRound >= N and progressionStatus !== ELIMINATED
      const eligibleTeams = await prisma.team.findMany({
        where: {
          hackathonId,
          progressionStatus: { not: TeamProgressionStatus.DISQUALIFIED },
          ...(roundNumber > 1
            ? {
                highestRound: { gte: roundNumber },
                progressionStatus: { not: TeamProgressionStatus.ELIMINATED },
              }
            : {}),
        },
        include: {
          project: {
            include: {
              submissions: {
                where: { status: { in: ['SUBMITTED', 'LOCKED'] } },
                orderBy: { createdAt: 'asc' },
              },
              evaluations: { where: { status: EvaluationStatus.SUBMITTED } },
            },
          },
          members: {
            include: { user: true },
          },
        },
      });

      if (eligibleTeams.length === 0) {
        throw {
          status: 400,
          code: 'NO_ELIGIBLE_TEAMS',
          message: `No eligible participating teams found for Round ${roundNumber}.`,
        };
      }

      // 3. Selection count configuration & validation
      let selectionCount: number | undefined = undefined;
      if (hackathon.progressionMode === ProgressionMode.SELECTION_BASED) {
        const rawCount = options.selectionCount ?? currentRoundConfig.selectionCount;
        const validation = this.validateSelectionCount(
          rawCount,
          eligibleTeams.length,
          hackathon.progressionMode
        );

        if (!validation.isValid) {
          throw {
            status: 400,
            code: 'INVALID_SELECTION_COUNT',
            message: validation.error,
          };
        }
        selectionCount = validation.count;
      }

      // 4. Calculate finalized scores for eligible teams
      const teamScores = eligibleTeams.map((team) => {
        const project = team.project;
        const firstSubmission = project?.submissions?.[0];
        const submittedAt = firstSubmission?.createdAt || null;

        if (!project || project.evaluations.length === 0) {
          return {
            teamId: team.id,
            projectId: project?.id || '',
            teamName: team.name,
            rawAverage: 0,
            normalizedScore: 0,
            finalScore: 0,
            submittedAt,
          };
        }

        const validEvals = project.evaluations.filter(
          (e) => !e.roundId || e.roundId === currentRoundConfig.id || e.roundId === `round_${roundNumber}`
        );
        const evalsToUse = validEvals.length > 0 ? validEvals : project.evaluations;

        const sum = evalsToUse.reduce((acc, curr) => acc + curr.weightedScore, 0);
        const rawAvg = sum / evalsToUse.length;

        return {
          teamId: team.id,
          projectId: project.id,
          teamName: team.name,
          rawAverage: rawAvg,
          normalizedScore: rawAvg,
          finalScore: rawAvg,
          submittedAt,
        };
      });

      // 5. Deterministic Ranking using ResultEngine
      // Primary: final score descending
      // Secondary: raw average descending
      // Tertiary: earlier submission time
      // Quaternary: stable canonical team ID
      const rankedTeams = [...teamScores].sort((a, b) => {
        if (b.finalScore !== a.finalScore) {
          return b.finalScore - a.finalScore;
        }
        if (b.rawAverage !== a.rawAverage) {
          return b.rawAverage - a.rawAverage;
        }
        const timeA = a.submittedAt ? new Date(a.submittedAt).getTime() : Infinity;
        const timeB = b.submittedAt ? new Date(b.submittedAt).getTime() : Infinity;
        if (timeA !== timeB) {
          return timeA - timeB;
        }
        return a.teamId.localeCompare(b.teamId);
      });

      // 6. Partition Advancement vs Elimination
      const advancedTeamIds: string[] = [];
      const eliminatedTeamIds: string[] = [];
      const roundResultRecords: any[] = [];

      rankedTeams.forEach((item, index) => {
        const rank = index + 1;
        let status: TeamProgressionStatus = TeamProgressionStatus.ADVANCED;

        if (hackathon.progressionMode === ProgressionMode.SELECTION_BASED) {
          if (selectionCount !== undefined && rank <= selectionCount) {
            status = TeamProgressionStatus.ADVANCED;
            advancedTeamIds.push(item.teamId);
          } else {
            status = TeamProgressionStatus.ELIMINATED;
            eliminatedTeamIds.push(item.teamId);
          }
        } else {
          // OVERALL_PERFORMANCE: all eligible teams advance
          status = TeamProgressionStatus.ADVANCED;
          advancedTeamIds.push(item.teamId);
        }

        roundResultRecords.push({
          teamId: item.teamId,
          projectId: item.projectId,
          rank,
          finalScore: item.finalScore,
          rawAverageScore: item.rawAverage,
          status,
        });
      });

      // 7. Atomic Database Transaction: Persist advancement decisions
      const nextRoundNumber = roundNumber + 1;
      await prisma.$transaction(async (tx) => {
        // A. Update Round record status if exists
        if (currentRoundConfig.id) {
          await tx.round.update({
            where: { id: currentRoundConfig.id },
            data: { status: RoundStatus.COMPLETED },
          });
        }

        // B. Update Hackathon current round
        await tx.hackathon.update({
          where: { id: hackathonId },
          data: {
            currentRoundNumber: nextRoundNumber,
            ...(isFinalRound ? { status: 'RESULTS_PUBLISHED', resultsPublishedAt: new Date() } : {}),
          },
        });

        // C. Update Advanced Teams: Unlock next round
        for (const teamId of advancedTeamIds) {
          await tx.team.update({
            where: { id: teamId },
            data: {
              highestRound: Math.max(nextRoundNumber, 1),
              progressionStatus: isFinalRound ? TeamProgressionStatus.ELIGIBLE : TeamProgressionStatus.ADVANCED,
            },
          });
        }

        // D. Update Eliminated Teams: Freeze at completed round
        for (const teamId of eliminatedTeamIds) {
          await tx.team.update({
            where: { id: teamId },
            data: {
              progressionStatus: TeamProgressionStatus.ELIMINATED,
              highestRound: roundNumber,
            },
          });
        }

        // E. Persist RoundResult records
        for (const rr of roundResultRecords) {
          await tx.roundResult.upsert({
            where: {
              roundNumber_teamId: {
                roundNumber,
                teamId: rr.teamId,
              },
            },
            update: {
              projectId: rr.projectId || null,
              rawAverageScore: rr.rawAverageScore,
              normalizedScore: rr.finalScore,
              finalScore: rr.finalScore,
              rank: rr.rank,
              progressionStatus: rr.status,
              isPublished: true,
              publishedAt: new Date(),
              roundId: currentRoundConfig.id || null,
            },
            create: {
              hackathonId,
              roundNumber,
              roundId: currentRoundConfig.id || null,
              projectId: rr.projectId || null,
              teamId: rr.teamId,
              rawAverageScore: rr.rawAverageScore,
              normalizedScore: rr.finalScore,
              finalScore: rr.finalScore,
              rank: rr.rank,
              progressionStatus: rr.status,
              isPublished: true,
              publishedAt: new Date(),
            },
          });

          // If final round and project exists, also mirror into global Result table for public leaderboard compatibility
          if (isFinalRound && rr.projectId) {
            await tx.result.upsert({
              where: { projectId: rr.projectId },
              update: {
                rawAverageScore: rr.rawAverageScore,
                normalizedScore: rr.finalScore,
                finalScore: rr.finalScore,
                rank: rr.rank,
                isPublished: true,
                publishedAt: new Date(),
              },
              create: {
                hackathonId,
                projectId: rr.projectId,
                rawAverageScore: rr.rawAverageScore,
                normalizedScore: rr.finalScore,
                finalScore: rr.finalScore,
                rank: rr.rank,
                isPublished: true,
                publishedAt: new Date(),
              },
            });
          }
        }
      });

      // 8. Audit Trail Logging
      await AuditService.log({
        userId: actorUserId,
        hackathonId,
        action: 'ROUND_RESULT_FINALIZED',
        entityType: 'Round',
        entityId: currentRoundConfig.id || `round_${roundNumber}`,
        afterState: {
          roundNumber,
          progressionMode: hackathon.progressionMode,
          eligibleCount: eligibleTeams.length,
          advancedCount: advancedTeamIds.length,
          eliminatedCount: eliminatedTeamIds.length,
          isFinalRound,
        },
      });

      // 9. Dispatch Notifications (Safely isolated from DB transaction)
      try {
        const teamMap = new Map<string, (typeof eligibleTeams)[0]>();
        eligibleTeams.forEach((t) => teamMap.set(t.id, t));

        if (hackathon.progressionMode === ProgressionMode.SELECTION_BASED && !isFinalRound) {
          // Notify Selected Teams
          for (const teamId of advancedTeamIds) {
            const team = teamMap.get(teamId);
            if (team) {
              const userIds = team.members.map((m) => m.userId);
              await NotificationService.sendBulkNotification(userIds, {
                title: 'Selected for Next Round',
                message: `Your team has been selected for the next round of ${hackathon.title}.`,
                type: 'TEAM_SELECTED_FOR_NEXT_ROUND',
                hackathonId,
                roundId: currentRoundConfig.id || `round_${roundNumber}`,
                linkUrl: `/participant/hackathons`,
              });
            }
          }

          // Notify Eliminated Teams
          for (const teamId of eliminatedTeamIds) {
            const team = teamMap.get(teamId);
            if (team) {
              const userIds = team.members.map((m) => m.userId);
              await NotificationService.sendBulkNotification(userIds, {
                title: 'Not Selected for Next Round',
                message: `Your team was not selected for the next round of ${hackathon.title}. You can still view the published leaderboard.`,
                type: 'TEAM_NOT_SELECTED_FOR_NEXT_ROUND',
                hackathonId,
                roundId: currentRoundConfig.id || `round_${roundNumber}`,
                linkUrl: `/leaderboard`,
              });
            }
          }
        } else if (isFinalRound) {
          // Final Result Published Notification
          const allUserIds = eligibleTeams.flatMap((t) => t.members.map((m) => m.userId));
          await NotificationService.sendBulkNotification(allUserIds, {
            title: 'Final Results Published',
            message: `Final results for ${hackathon.title} have been published! Check the leaderboard for official standings.`,
            type: 'FINAL_RESULT_PUBLISHED',
            hackathonId,
            linkUrl: `/leaderboard`,
          });
        }
      } catch (notifErr: any) {
        console.warn('[RoundProgressionService] Notification dispatch warning:', notifErr.message);
      }

      // 10. Real-time WebSocket Event Broadcast
      await eventBus.publish({
        type: 'ROUND_FINALIZED' as any,
        hackathonId,
        actorId: actorUserId,
        rooms: [
          RealtimeRoomBuilder.hackathon(hackathonId),
          RealtimeRoomBuilder.organizer(hackathonId),
        ],
        payload: {
          hackathonId,
          roundNumber,
          isFinalRound,
          advancedCount: advancedTeamIds.length,
          eliminatedCount: eliminatedTeamIds.length,
        },
      });

      return {
        hackathonId,
        roundNumber,
        progressionMode: hackathon.progressionMode,
        eligibleTeamsCount: eligibleTeams.length,
        selectedTeamsCount: advancedTeamIds.length,
        eliminatedTeamsCount: eliminatedTeamIds.length,
        advancedTeamIds,
        eliminatedTeamIds,
        isFinalRound,
        roundResults: roundResultRecords,
      };
    }, 60);
  }
}
