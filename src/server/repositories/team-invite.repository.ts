import prisma from '@/lib/prisma';
import { TeamInviteStatus } from '@prisma/client';

export class TeamInviteRepository {
  public static async create(data: {
    teamId: string;
    invitedEmail: string;
    invitedUserId?: string;
    invitedById: string;
    token: string;
    expiresAt: Date;
  }) {
    return prisma.teamInvite.create({
      data: {
        teamId: data.teamId,
        invitedEmail: data.invitedEmail.toLowerCase().trim(),
        invitedUserId: data.invitedUserId,
        invitedById: data.invitedById,
        token: data.token,
        expiresAt: data.expiresAt,
        status: 'PENDING',
      },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            hackathonId: true,
          },
        },
      },
    });
  }

  public static async findByToken(token: string) {
    return prisma.teamInvite.findUnique({
      where: { token },
      include: {
        team: {
          include: {
            hackathon: {
              select: {
                id: true,
                title: true,
                slug: true,
                status: true,
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
                  },
                },
              },
            },
          },
        },
        invitedBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });
  }

  public static async listByTeam(teamId: string) {
    return prisma.teamInvite.findMany({
      where: { teamId },
      include: {
        invitedBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  public static async listPendingForUser(email: string, userId?: string) {
    try {
      return await prisma.teamInvite.findMany({
        where: {
          OR: [
            { invitedEmail: email.toLowerCase().trim() },
            ...(userId ? [{ invitedUserId: userId }] : []),
          ],
          status: 'PENDING',
          expiresAt: { gt: new Date() },
        },
        include: {
          team: {
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
                    },
                  },
                },
              },
            },
          },
          invitedBy: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (err) {
      console.error('[TeamInviteRepository.listPendingForUser] DB error:', err);
      return [];
    }
  }


  public static async updateStatus(id: string, status: TeamInviteStatus) {
    return prisma.teamInvite.update({
      where: { id },
      data: { status },
    });
  }

  public static async delete(id: string) {
    return prisma.teamInvite.delete({
      where: { id },
    });
  }
}
