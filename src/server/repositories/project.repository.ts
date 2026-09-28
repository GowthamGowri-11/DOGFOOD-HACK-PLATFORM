import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export class ProjectRepository {
  public static async create(data: {
    hackathonId: string;
    teamId: string;
    trackId: string;
    problemId: string;
    title: string;
    slug: string;
    tagline?: string;
    description: string;
    thumbnailUrl?: string;
    repoUrl: string;
    demoUrl?: string;
    videoUrl?: string;
    documentationUrl?: string;
    techStack?: string[];
  }) {
    return prisma.project.create({
      data: {
        hackathonId: data.hackathonId,
        teamId: data.teamId,
        trackId: data.trackId,
        problemId: data.problemId,
        title: data.title.trim(),
        slug: data.slug.trim().toLowerCase(),
        tagline: data.tagline?.trim(),
        description: data.description.trim(),
        thumbnailUrl: data.thumbnailUrl,
        repoUrl: data.repoUrl.trim(),
        demoUrl: data.demoUrl?.trim(),
        videoUrl: data.videoUrl?.trim(),
        documentationUrl: data.documentationUrl?.trim(),
        techStack: data.techStack || [],
        isPublished: false,
      },
      include: {
        hackathon: {
          select: {
            id: true,
            title: true,
            slug: true,
            minTeamSize: true,
            maxTeamSize: true,
            subStartTime: true,
            subEndTime: true,
          },
        },
        track: true,
        problemStatement: true,
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
        submissions: {
          orderBy: { versionNumber: 'desc' },
        },
      },
    });
  }

  public static async findById(id: string) {
    try {
      return await prisma.project.findUnique({
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
              subStartTime: true,
              subEndTime: true,
              currentRoundNumber: true,
              progressionMode: true,
            },
          },
          track: true,
          problemStatement: true,
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
          submissions: {
            orderBy: { versionNumber: 'desc' },
          },
        },
      });
    } catch (error) {
      console.error('[ProjectRepository.findById] DB query failed:', error);
      return null;
    }
  }

  public static async findByTeamId(teamId: string) {
    try {
      return await prisma.project.findUnique({
        where: { teamId },
        include: {
          hackathon: {
            select: {
              id: true,
              title: true,
              slug: true,
              organizerId: true,
              minTeamSize: true,
              maxTeamSize: true,
              subStartTime: true,
              subEndTime: true,
            },
          },
          track: true,
          problemStatement: true,
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
          submissions: {
            orderBy: { versionNumber: 'desc' },
          },
        },
      });
    } catch (error) {
      console.error('[ProjectRepository.findByTeamId] DB query failed:', error);
      return null;
    }
  }

  public static async findBySlug(hackathonId: string, slug: string) {
    try {
      return await prisma.project.findUnique({
        where: {
          hackathonId_slug: {
            hackathonId,
            slug,
          },
        },
        include: {
          hackathon: true,
          track: true,
          problemStatement: true,
          team: {
            include: {
              members: {
                include: {
                  user: true,
                },
              },
            },
          },
          submissions: {
            orderBy: { versionNumber: 'desc' },
          },
        },
      });
    } catch (error) {
      console.error('[ProjectRepository.findBySlug] DB query failed:', error);
      return null;
    }
  }

  public static async update(
    id: string,
    data: Prisma.ProjectUpdateInput
  ) {
    return prisma.project.update({
      where: { id },
      data,
      include: {
        hackathon: true,
        track: true,
        problemStatement: true,
        team: {
          include: {
            members: {
              include: {
                user: true,
              },
            },
          },
        },
        submissions: {
          orderBy: { versionNumber: 'desc' },
        },
      },
    });
  }

  public static async delete(id: string) {
    return prisma.project.delete({
      where: { id },
    });
  }

  public static async listByUser(userId: string) {
    try {
      return await prisma.project.findMany({
        where: {
          team: {
            members: {
              some: { userId },
            },
          },
        },
        include: {
          hackathon: {
            select: {
              id: true,
              title: true,
              slug: true,
              status: true,
              organizationName: true,
              minTeamSize: true,
              maxTeamSize: true,
              subStartTime: true,
              subEndTime: true,
              judgingStartTime: true,
              judgingEndTime: true,
              resultsPublishedAt: true,
            },
          },
          track: true,
          problemStatement: true,
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
          submissions: {
            orderBy: { versionNumber: 'desc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      console.error('[ProjectRepository.listByUser] DB query failed:', error);
      return [];
    }
  }

  public static async listByHackathon(hackathonId: string, options: { search?: string; trackId?: string } = {}) {
    try {
      return await prisma.project.findMany({
        where: {
          hackathonId,
          ...(options.trackId ? { trackId: options.trackId } : {}),
          ...(options.search
            ? {
                OR: [
                  { title: { contains: options.search, mode: 'insensitive' } },
                  { description: { contains: options.search, mode: 'insensitive' } },
                  { team: { name: { contains: options.search, mode: 'insensitive' } } },
                ],
              }
            : {}),
        },
        include: {
          track: true,
          problemStatement: true,
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
          submissions: {
            orderBy: { versionNumber: 'desc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      console.error('[ProjectRepository.listByHackathon] DB query failed:', error);
      return [];
    }
  }

  public static async listPublicGallery(hackathonId?: string, trackId?: string) {
    try {
      return await prisma.project.findMany({
        where: {
          isPublished: true,
          ...(hackathonId ? { hackathonId } : {}),
          ...(trackId ? { trackId } : {}),
        },
        include: {
          hackathon: {
            select: {
              title: true,
              slug: true,
            },
          },
          track: true,
          problemStatement: true,
          team: {
            include: {
              members: {
                include: {
                  user: {
                    select: {
                      fullName: true,
                      avatarUrl: true,
                    },
                  },
                },
              },
            },
          },
          _count: {
            select: {
              votes: true,
              comments: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      console.error('[ProjectRepository.listPublicGallery] DB query failed:', error);
      return [];
    }
  }

  public static async checkSlugExists(hackathonId: string, slug: string, excludeId?: string): Promise<boolean> {
    const existing = await prisma.project.findFirst({
      where: {
        hackathonId,
        slug: slug.trim().toLowerCase(),
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { id: true },
    });

    return !!existing;
  }
}
