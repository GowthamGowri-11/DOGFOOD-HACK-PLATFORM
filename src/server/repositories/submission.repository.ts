import prisma from '@/lib/prisma';
import { SubmissionStatus, Prisma } from '@prisma/client';

export class SubmissionRepository {
  public static async create(data: {
    projectId: string;
    versionNumber?: number;
    status?: SubmissionStatus;
    payloadSnapshot: Prisma.InputJsonValue;
    submittedAt?: Date;
    lockedAt?: Date;
    createdById: string;
  }) {
    return prisma.submission.create({
      data: {
        projectId: data.projectId,
        versionNumber: data.versionNumber || 1,
        status: data.status || 'SUBMITTED',
        payloadSnapshot: data.payloadSnapshot,
        submittedAt: data.submittedAt || new Date(),
        lockedAt: data.lockedAt || new Date(),
        createdById: data.createdById,
      },
      include: {
        project: {
          include: {
            hackathon: true,
            team: true,
            track: true,
            problemStatement: true,
          },
        },
      },
    });
  }

  public static async findById(id: string) {
    return prisma.submission.findUnique({
      where: { id },
      include: {
        project: {
          include: {
            hackathon: {
              select: {
                id: true,
                title: true,
                slug: true,
                organizerId: true,
              },
            },
            team: {
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
            track: true,
            problemStatement: true,
          },
        },
      },
    });
  }

  public static async findLatestByProjectId(projectId: string) {
    return prisma.submission.findFirst({
      where: { projectId },
      orderBy: { versionNumber: 'desc' },
      include: {
        project: {
          include: {
            hackathon: true,
            team: true,
            track: true,
            problemStatement: true,
          },
        },
      },
    });
  }

  public static async listByUser(userId: string) {
    return prisma.submission.findMany({
      where: {
        project: {
          team: {
            members: {
              some: { userId },
            },
          },
        },
      },
      include: {
        project: {
          include: {
            hackathon: {
              select: {
                id: true,
                title: true,
                slug: true,
                status: true,
                organizationName: true,
                subStartTime: true,
                subEndTime: true,
                judgingStartTime: true,
                judgingEndTime: true,
                resultsPublishedAt: true,
              },
            },
            team: {
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
            track: true,
            problemStatement: true,
            result: true,
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });
  }

  public static async listByHackathon(hackathonId: string) {
    return prisma.submission.findMany({
      where: {
        project: { hackathonId },
      },
      include: {
        project: {
          include: {
            team: {
              include: {
                members: {
                  include: {
                    user: {
                      select: {
                        fullName: true,
                        email: true,
                      },
                    },
                  },
                },
              },
            },
            track: true,
            problemStatement: true,
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });
  }
}
