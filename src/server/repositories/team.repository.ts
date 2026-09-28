import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export class TeamRepository {
  public static async create(data: {
    hackathonId: string;
    name: string;
    inviteCode: string;
    leaderId: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const team = await tx.team.create({
        data: {
          hackathonId: data.hackathonId,
          name: data.name.trim(),
          inviteCode: data.inviteCode,
          leaderId: data.leaderId,
        },
      });

      await tx.teamMember.create({
        data: {
          teamId: team.id,
          userId: data.leaderId,
          isLeader: true,
        },
      });

      return tx.team.findUnique({
        where: { id: team.id },
        include: {
          hackathon: {
            select: {
              id: true,
              title: true,
              slug: true,
              minTeamSize: true,
              maxTeamSize: true,
            },
          },
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  fullName: true,
                  email: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
      });
    });
  }

  public static async findById(id: string) {
    try {
      return await prisma.team.findUnique({
        where: { id },
        include: {
          hackathon: {
            select: {
              id: true,
              title: true,
              slug: true,
              organizerId: true,
              minTeamSize: true,
              maxTeamSize: true,
              eventStartTime: true,
              eventEndTime: true,
              subStartTime: true,
              subEndTime: true,
            },
          },
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  fullName: true,
                  email: true,
                  avatarUrl: true,
                },
              },
            },
            orderBy: { joinedAt: 'asc' },
          },
          invites: {
            where: {
              status: 'PENDING',
              expiresAt: { gt: new Date() },
            },
            orderBy: { createdAt: 'desc' },
          },
        },
      });
    } catch (error) {
      console.error('[TeamRepository.findById] DB query failed:', error);
      return null;
    }
  }

  public static async findByHackathonAndUser(hackathonId: string, userId: string) {
    try {
      return await prisma.team.findFirst({
        where: {
          hackathonId,
          members: {
            some: { userId },
          },
        },
        include: {
          hackathon: {
            select: {
              id: true,
              title: true,
              slug: true,
              minTeamSize: true,
              maxTeamSize: true,
            },
          },
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  fullName: true,
                  email: true,
                },
              },
            },
            orderBy: { joinedAt: 'asc' },
          },
        },
      });
    } catch (error) {
      console.error('[TeamRepository.findByHackathonAndUser] DB query failed:', error);
      return null;
    }
  }

  public static async findByInviteCode(inviteCode: string) {
    try {
      return await prisma.team.findUnique({
        where: { inviteCode },
        include: {
          hackathon: {
            select: {
              id: true,
              title: true,
              slug: true,
              minTeamSize: true,
              maxTeamSize: true,
              status: true,
            },
          },
          members: {
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
        },
      });
    } catch (error) {
      console.error('[TeamRepository.findByInviteCode] DB query failed:', error);
      return null;
    }
  }

  public static async listByUser(userId: string) {
    try {
      return await prisma.team.findMany({
        where: {
          members: {
            some: { userId },
          },
        },
        include: {
          hackathon: {
            select: {
              id: true,
              title: true,
              slug: true,
              status: true,
              minTeamSize: true,
              maxTeamSize: true,
              regStartTime: true,
              regEndTime: true,
              subStartTime: true,
              subEndTime: true,
              judgingStartTime: true,
              judgingEndTime: true,
              resultsPublishedAt: true,
              progressionMode: true,
              currentRoundNumber: true,
            },
          },
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  fullName: true,
                  email: true,
                  avatarUrl: true,
                },
              },
            },
            orderBy: { joinedAt: 'asc' },
          },
          project: {
            include: {
              track: true,
              problemStatement: true,
              submissions: {
                orderBy: { versionNumber: 'desc' },
                take: 1,
              },
            },
          },
          invites: {
            where: {
              status: 'PENDING',
              expiresAt: { gt: new Date() },
            },
            orderBy: { createdAt: 'desc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      console.error('[TeamRepository.listByUser] DB query failed:', error);
      return [];
    }
  }

  public static async listByHackathon(hackathonId: string) {
    try {
      return await prisma.team.findMany({
        where: { hackathonId },
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  fullName: true,
                  email: true,
                },
              },
            },
            orderBy: { joinedAt: 'asc' },
          },
          _count: {
            select: { members: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      console.error('[TeamRepository.listByHackathon] DB query failed:', error);
      return [];
    }
  }

  public static async addMember(teamId: string, userId: string, isLeader = false) {
    return prisma.teamMember.create({
      data: {
        teamId,
        userId,
        isLeader,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });
  }

  public static async removeMember(teamId: string, userId: string) {
    return prisma.teamMember.delete({
      where: {
        teamId_userId: {
          teamId,
          userId,
        },
      },
    });
  }

  public static async countMembers(teamId: string): Promise<number> {
    return prisma.teamMember.count({
      where: { teamId },
    });
  }

  public static async update(id: string, data: { name?: string; leaderId?: string }) {
    return prisma.team.update({
      where: { id },
      data,
    });
  }

  public static async delete(id: string) {
    return prisma.team.delete({
      where: { id },
    });
  }

  public static async checkNameExists(hackathonId: string, name: string, excludeTeamId?: string): Promise<boolean> {
    const existing = await prisma.team.findFirst({
      where: {
        hackathonId,
        name: { equals: name.trim(), mode: 'insensitive' },
        ...(excludeTeamId ? { id: { not: excludeTeamId } } : {}),
      },
      select: { id: true },
    });

    return !!existing;
  }
}
