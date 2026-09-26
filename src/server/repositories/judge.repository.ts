import prisma from '@/lib/prisma';

export class JudgeRepository {
  /**
   * STRICT ISOLATION: Finds assigned projects for a specific judge only.
   */
  public static async findAssignedProjects(judgeUserId: string, hackathonId: string) {
    const judge = await prisma.judge.findUnique({
      where: {
        hackathonId_userId: {
          hackathonId,
          userId: judgeUserId,
        },
      },
    });

    if (!judge) return [];

    return prisma.judgeAssignment.findMany({
      where: {
        judgeId: judge.id,
      },
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
          },
        },
      },
    });
  }

  /**
   * STRICT ISOLATION: Verifies if a judge has an active assignment for a given project before allowing scoring.
   */
  public static async verifyJudgeAssignment(judgeUserId: string, projectId: string) {
    return prisma.judgeAssignment.findFirst({
      where: {
        projectId,
        judge: {
          userId: judgeUserId,
          isActive: true,
        },
      },
      include: {
        judge: true,
        project: true,
      },
    });
  }

  /**
   * Finds a specific assignment by ID and verifies judge ownership.
   */
  public static async findAssignmentForJudge(assignmentId: string, judgeUserId: string) {
    return prisma.judgeAssignment.findFirst({
      where: {
        id: assignmentId,
        judge: {
          userId: judgeUserId,
          isActive: true,
        },
      },
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
          },
        },
      },
    });
  }

  /**
   * Finds team IDs in a hackathon where the user is a member or leader (COI detection).
   */
  public static async findUserTeamIdsInHackathon(userId: string, hackathonId: string): Promise<string[]> {
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
  }

  /**
   * Finds all judges for a hackathon.
   */
  public static async findJudgesByHackathon(hackathonId: string) {
    return prisma.judge.findMany({
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
  }
}

