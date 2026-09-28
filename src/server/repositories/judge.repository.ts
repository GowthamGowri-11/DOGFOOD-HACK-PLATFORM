import prisma from '@/lib/prisma';
import { AuditService } from '../services/audit.service';

export class JudgeRepository {
  /**
   * STRICT ISOLATION: Finds assigned projects for a specific judge only.
   * Scoped to Hackathon, Round, and Sub-round.
   */
  public static async findAssignedProjects(
    judgeUserId: string,
    hackathonId: string,
    roundId?: string,
    subRoundId?: string
  ) {
    try {
      const judge = await prisma.judge.findUnique({
        where: {
          hackathonId_userId: {
            hackathonId,
            userId: judgeUserId,
          },
        },
      });

      if (!judge) return [];

      const whereClause: any = {
        judgeId: judge.id,
      };

      if (roundId) whereClause.roundId = roundId;
      if (subRoundId) whereClause.subRoundId = subRoundId;

      return await prisma.judgeAssignment.findMany({
        where: whereClause,
        include: {
          project: {
            include: {
              track: true,
              problemStatement: true,
              team: {
                select: {
                  id: true,
                  name: true,
                  leaderId: true,
                },
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
      });
    } catch (error) {
      console.error('[JudgeRepository.findAssignedProjects] DB query failed:', error);
      return [];
    }
  }

  /**
   * STRICT ISOLATION: Verifies if a judge has an active assignment for a given project
   * within the exact Hackathon, Round, and Sub-Round context before allowing scoring or viewing.
   */
  public static async verifyJudgeAssignment(
    judgeUserId: string,
    projectId: string,
    roundId?: string,
    subRoundId?: string
  ) {
    try {
      const whereClause: any = {
        projectId,
        judge: {
          userId: judgeUserId,
          isActive: true,
        },
      };

      if (roundId) whereClause.roundId = roundId;
      if (subRoundId) whereClause.subRoundId = subRoundId;

      const assignment = await prisma.judgeAssignment.findFirst({
        where: whereClause,
        include: {
          judge: {
            include: {
              user: {
                select: {
                  id: true,
                  fullName: true,
                  email: true,
                },
              },
            },
          },
          project: {
            include: {
              team: true,
            },
          },
        },
      });

      if (!assignment) {
        // Log unauthorized attempt for security auditing
        try {
          const project = await prisma.project.findUnique({
            where: { id: projectId },
            select: { hackathonId: true, teamId: true },
          });

          await AuditService.log({
            userId: judgeUserId,
            hackathonId: project?.hackathonId,
            action: 'UNAUTHORIZED_EVALUATION_ACCESS',
            entityType: 'Project',
            entityId: projectId,
            afterState: {
              result: 'DENIED',
              targetTeamId: project?.teamId,
              roundId: roundId || null,
              subRoundId: subRoundId || null,
              reason: 'Judge is not assigned to this team/project for this evaluation round.',
            },
          });
        } catch {
          // Non-blocking audit log
        }
        return null;
      }

      return assignment;
    } catch (error) {
      console.error('[JudgeRepository.verifyJudgeAssignment] DB query failed:', error);
      return null;
    }
  }

  /**
   * Finds a specific assignment by ID and verifies judge ownership.
   */
  public static async findAssignmentForJudge(
    assignmentId: string,
    judgeUserId: string,
    roundId?: string,
    subRoundId?: string
  ) {
    try {
      const whereClause: any = {
        id: assignmentId,
        judge: {
          userId: judgeUserId,
          isActive: true,
        },
      };

      if (roundId) whereClause.roundId = roundId;
      if (subRoundId) whereClause.subRoundId = subRoundId;

      return await prisma.judgeAssignment.findFirst({
        where: whereClause,
        include: {
          judge: true,
          project: {
            include: {
              track: true,
              problemStatement: true,
              team: {
                select: {
                  id: true,
                  name: true,
                  leaderId: true,
                },
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
      });
    } catch (error) {
      console.error('[JudgeRepository.findAssignmentForJudge] DB query failed:', error);
      return null;
    }
  }

  /**
   * Finds team IDs in a hackathon where the user is a member or leader (COI detection).
   */
  public static async findUserTeamIdsInHackathon(userId: string, hackathonId: string): Promise<string[]> {
    try {
      const memberships = await prisma.teamMember.findMany({
        where: {
          userId,
          team: {
            hackathonId,
          },
        },
        select: {
          teamId: true,
        },
      });

      return memberships.map((m) => m.teamId);
    } catch (error) {
      console.error('[JudgeRepository.findUserTeamIdsInHackathon] DB query failed:', error);
      return [];
    }
  }

  /**
   * Finds all judges for a hackathon.
   */
  public static async findJudgesByHackathon(hackathonId: string) {
    try {
      return await prisma.judge.findMany({
        where: { hackathonId },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              avatarUrl: true,
            },
          },
          _count: {
            select: {
              assignments: true,
              evaluations: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      console.error('[JudgeRepository.findJudgesByHackathon] DB query failed:', error);
      return [];
    }
  }
}
