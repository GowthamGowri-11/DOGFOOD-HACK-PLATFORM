import prisma from '@/lib/prisma';
import { EventStatus, Prisma } from '@prisma/client';

export interface ListPublicHackathonsOptions {
  search?: string;
  status?: EventStatus;
  trackSlug?: string;
  page?: number;
  pageSize?: number;
}

export class HackathonRepository {
  public static async listPublic(options: ListPublicHackathonsOptions = {}) {
    const page = Math.max(1, options.page || 1);
    const pageSize = Math.min(50, Math.max(1, options.pageSize || 10));
    const skip = (page - 1) * pageSize;

    const where: Prisma.HackathonWhereInput = {
      status: options.status ? options.status : { not: 'DRAFT' },
      ...(options.search
        ? {
            OR: [
              { title: { contains: options.search, mode: 'insensitive' } },
              { tagline: { contains: options.search, mode: 'insensitive' } },
              { description: { contains: options.search, mode: 'insensitive' } },
              { organizationName: { contains: options.search, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(options.trackSlug
        ? {
            tracks: {
              some: { slug: options.trackSlug },
            },
          }
        : {}),
    };

    try {
      const [total, hackathons] = await Promise.all([
        prisma.hackathon.count({ where }),
        prisma.hackathon.findMany({
          where,
          skip,
          take: pageSize,
          include: {
            tracks: {
              include: {
                problemStatements: {
                  where: { isPublic: true },
                },
              },
              orderBy: { displayOrder: 'asc' },
            },
            prizes: {
              orderBy: { rankOrder: 'asc' },
            },
            _count: {
              select: {
                registrations: true,
                projects: true,
              },
            },
          },
          orderBy: { eventStartTime: 'asc' },
        }),
      ]);

      const totalPages = Math.ceil(total / pageSize);

      return {
        hackathons,
        pagination: {
          total,
          page,
          pageSize,
          totalPages,
          hasMore: page < totalPages,
        },
      };
    } catch (error) {
      console.error('[HackathonRepository.listPublic] Database unreachable or error:', error);
      return {
        hackathons: [],
        pagination: {
          total: 0,
          page,
          pageSize,
          totalPages: 0,
          hasMore: false,
        },
      };
    }
  }


  public static async findBySlug(slugOrId: string, allowDraft = false) {
    return prisma.hackathon.findFirst({
      where: {
        OR: [
          { slug: slugOrId },
          { id: slugOrId },
        ],
        ...(!allowDraft ? { status: { not: 'DRAFT' } } : {}),
      },
      include: {
        organizer: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatarUrl: true,
          },
        },
        tracks: {
          include: {
            problemStatements: {
              where: !allowDraft ? { isPublic: true } : undefined,
              orderBy: { displayOrder: 'asc' },
            },
          },
          orderBy: { displayOrder: 'asc' },
        },
        prizes: {
          orderBy: { rankOrder: 'asc' },
        },
        _count: {
          select: {
            registrations: true,
            projects: true,
            judges: true,
          },
        },
      },
    });
  }

  public static async findById(id: string) {
    return prisma.hackathon.findUnique({
      where: { id },
      include: {
        organizer: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        tracks: {
          include: {
            problemStatements: {
              orderBy: { displayOrder: 'asc' },
            },
          },
          orderBy: { displayOrder: 'asc' },
        },
        prizes: {
          orderBy: { rankOrder: 'asc' },
        },
        _count: {
          select: {
            registrations: true,
            projects: true,
            judges: true,
          },
        },
      },
    });
  }

  public static async listByOrganizer(organizerId: string) {
    return prisma.hackathon.findMany({
      where: { organizerId },
      include: {
        tracks: true,
        prizes: true,
        _count: {
          select: {
            registrations: true,
            projects: true,
            judges: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  public static async countByOrganizer(organizerId: string) {
    const [total, draft, published, completed] = await Promise.all([
      prisma.hackathon.count({ where: { organizerId } }),
      prisma.hackathon.count({ where: { organizerId, status: 'DRAFT' } }),
      prisma.hackathon.count({
        where: {
          organizerId,
          status: {
            in: [
              'PUBLISHED',
              'REGISTRATION_OPEN',
              'REGISTRATION_CLOSED',
              'EVENT_ACTIVE',
              'SUBMISSION_OPEN',
              'SUBMISSION_CLOSED',
              'JUDGING',
              'RESULTS_PENDING',
              'RESULTS_PUBLISHED',
            ],
          },
        },
      }),
      prisma.hackathon.count({ where: { organizerId, status: 'COMPLETED' } }),
    ]);

    return { total, draft, published, completed };
  }

  public static async create(data: {
    title: string;
    slug: string;
    tagline?: string;
    description: string;
    organizationName: string;
    organizerId: string;
    status?: EventStatus;
    minTeamSize?: number;
    maxTeamSize?: number;
    bannerUrl?: string;
    logoUrl?: string;
    regStartTime: Date;
    regEndTime: Date;
    eventStartTime: Date;
    eventEndTime: Date;
    subStartTime: Date;
    subEndTime: Date;
    judgingStartTime: Date;
    judgingEndTime: Date;
    eligibilityRules?: string;
    rulesAndGuidelines?: string;
  }) {
    return prisma.hackathon.create({
      data: {
        title: data.title.trim(),
        slug: data.slug.trim().toLowerCase(),
        tagline: data.tagline?.trim(),
        description: data.description.trim(),
        organizationName: data.organizationName.trim(),
        organizerId: data.organizerId,
        status: data.status || 'DRAFT',
        minTeamSize: data.minTeamSize || 1,
        maxTeamSize: data.maxTeamSize || 4,
        bannerUrl: data.bannerUrl,
        logoUrl: data.logoUrl,
        regStartTime: data.regStartTime,
        regEndTime: data.regEndTime,
        eventStartTime: data.eventStartTime,
        eventEndTime: data.eventEndTime,
        subStartTime: data.subStartTime,
        subEndTime: data.subEndTime,
        judgingStartTime: data.judgingStartTime,
        judgingEndTime: data.judgingEndTime,
        eligibilityRules: data.eligibilityRules,
        rulesAndGuidelines: data.rulesAndGuidelines,
      },
    });
  }

  public static async update(
    id: string,
    data: Prisma.HackathonUpdateInput
  ) {
    return prisma.hackathon.update({
      where: { id },
      data,
      include: {
        tracks: true,
        prizes: true,
      },
    });
  }

  public static async delete(id: string) {
    return prisma.hackathon.delete({
      where: { id },
    });
  }

  public static async listAdminPaginated(options: {
    search?: string;
    status?: EventStatus;
    organizerId?: string;
    page?: number;
    pageSize?: number;
  } = {}) {
    const page = Math.max(1, options.page || 1);
    const pageSize = Math.min(50, Math.max(1, options.pageSize || 10));
    const skip = (page - 1) * pageSize;

    const where: Prisma.HackathonWhereInput = {
      ...(options.status ? { status: options.status } : {}),
      ...(options.organizerId ? { organizerId: options.organizerId } : {}),
      ...(options.search
        ? {
            OR: [
              { title: { contains: options.search, mode: 'insensitive' } },
              { slug: { contains: options.search, mode: 'insensitive' } },
              { organizationName: { contains: options.search, mode: 'insensitive' } },
              { organizer: { fullName: { contains: options.search, mode: 'insensitive' } } },
              { organizer: { email: { contains: options.search, mode: 'insensitive' } } },
            ],
          }
        : {}),
    };

    const [total, hackathons] = await Promise.all([
      prisma.hackathon.count({ where }),
      prisma.hackathon.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          organizer: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          prizes: true,
          tracks: {
            select: {
              id: true,
              title: true,
            },
          },
          _count: {
            select: {
              registrations: true,
              projects: true,
              judges: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const totalPages = Math.ceil(total / pageSize);

    return {
      hackathons,
      pagination: {
        total,
        page,
        pageSize,
        totalPages,
        hasMore: page < totalPages,
      },
    };
  }

  public static async checkSlugExists(slug: string, excludeId?: string): Promise<boolean> {
    const existing = await prisma.hackathon.findFirst({
      where: {
        slug: slug.toLowerCase().trim(),
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { id: true },
    });

    return !!existing;
  }
}
