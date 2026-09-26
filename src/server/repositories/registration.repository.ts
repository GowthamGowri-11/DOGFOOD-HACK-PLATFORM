import prisma from '@/lib/prisma';
import { RegistrationStatus, Prisma } from '@prisma/client';

export interface ListRegistrationsOptions {
  hackathonId: string;
  status?: RegistrationStatus;
  search?: string;
  page?: number;
  pageSize?: number;
}

export class RegistrationRepository {
  public static async create(data: {
    hackathonId: string;
    userId: string;
    status?: RegistrationStatus;
    customAnswers?: Prisma.InputJsonValue;
  }) {
    return prisma.registration.create({
      data: {
        hackathonId: data.hackathonId,
        userId: data.userId,
        status: data.status || 'APPROVED',
        customAnswers: data.customAnswers,
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

  public static async findByUserAndHackathon(userId: string, hackathonId: string) {
    return prisma.registration.findUnique({
      where: {
        hackathonId_userId: {
          hackathonId,
          userId,
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
            eventStartTime: true,
            eventEndTime: true,
          },
        },
      },
    });
  }

  public static async findById(id: string) {
    return prisma.registration.findUnique({
      where: { id },
      include: {
        hackathon: {
          select: {
            id: true,
            title: true,
            slug: true,
            organizerId: true,
          },
        },
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

  public static async listByUser(userId: string) {
    return prisma.registration.findMany({
      where: { userId },
      include: {
        hackathon: {
          include: {
            tracks: true,
            prizes: {
              orderBy: { rankOrder: 'asc' },
            },
            teams: {
              where: {
                members: {
                  some: { userId },
                },
              },
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
                },
              },
            },
          },
        },
      },
      orderBy: { registeredAt: 'desc' },
    });
  }

  public static async listByHackathon(options: ListRegistrationsOptions) {
    const page = Math.max(1, options.page || 1);
    const pageSize = Math.min(100, Math.max(1, options.pageSize || 20));
    const skip = (page - 1) * pageSize;

    const where: Prisma.RegistrationWhereInput = {
      hackathonId: options.hackathonId,
      ...(options.status ? { status: options.status } : {}),
      ...(options.search
        ? {
            user: {
              OR: [
                { fullName: { contains: options.search, mode: 'insensitive' } },
                { email: { contains: options.search, mode: 'insensitive' } },
              ],
            },
          }
        : {}),
    };

    const [total, registrations] = await Promise.all([
      prisma.registration.count({ where }),
      prisma.registration.findMany({
        where,
        skip,
        take: pageSize,
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
        orderBy: { registeredAt: 'desc' },
      }),
    ]);

    const totalPages = Math.ceil(total / pageSize);

    return {
      registrations,
      pagination: {
        total,
        page,
        pageSize,
        totalPages,
        hasMore: page < totalPages,
      },
    };
  }

  public static async updateStatus(id: string, status: RegistrationStatus) {
    return prisma.registration.update({
      where: { id },
      data: { status },
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

  public static async delete(id: string) {
    return prisma.registration.delete({
      where: { id },
    });
  }

  public static async countByHackathon(hackathonId: string) {
    return prisma.registration.count({
      where: { hackathonId },
    });
  }
}
