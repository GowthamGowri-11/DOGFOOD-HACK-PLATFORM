import prisma from '@/lib/prisma';
import { EditRequestStatus } from '@prisma/client';

export interface CreateEditRequestData {
  evaluationId: string;
  judgeId: string;
  judgeUserId: string;
  hackathonId: string;
  roundId?: string;
  subRoundId?: string;
  teamId: string;
  projectId: string;
  criterionId: string;
  criterionTitle: string;
  oldScore: number;
  requestedScore: number;
  reason: string;
}

export interface ListEditRequestsFilter {
  hackathonId?: string;
  roundId?: string;
  subRoundId?: string;
  status?: EditRequestStatus;
  judgeUserId?: string;
  teamId?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export class EvaluationEditRepository {
  public static async createRequest(data: CreateEditRequestData) {
    return await prisma.evaluationEditRequest.create({
      data: {
        evaluationId: data.evaluationId,
        judgeId: data.judgeId,
        judgeUserId: data.judgeUserId,
        hackathonId: data.hackathonId,
        roundId: data.roundId,
        subRoundId: data.subRoundId,
        teamId: data.teamId,
        projectId: data.projectId,
        criterionId: data.criterionId,
        criterionTitle: data.criterionTitle,
        oldScore: data.oldScore,
        requestedScore: data.requestedScore,
        reason: data.reason.trim(),
        status: 'PENDING',
      },
      include: {
        evaluation: true,
        project: {
          include: {
            team: true,
            track: true,
          },
        },
        judge: {
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
        hackathon: {
          select: {
            id: true,
            title: true,
            slug: true,
            organizerId: true,
          },
        },
      },
    });
  }

  public static async findById(id: string) {
    return await prisma.evaluationEditRequest.findUnique({
      where: { id },
      include: {
        evaluation: {
          include: {
            scores: true,
            rubric: {
              include: {
                criteria: true,
              },
            },
          },
        },
        project: {
          include: {
            team: true,
            track: true,
          },
        },
        judge: {
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
        hackathon: {
          select: {
            id: true,
            title: true,
            slug: true,
            organizerId: true,
          },
        },
      },
    });
  }

  public static async findActiveByEvaluationAndCriterion(evaluationId: string, criterionId: string) {
    return await prisma.evaluationEditRequest.findFirst({
      where: {
        evaluationId,
        criterionId,
        status: { in: ['PENDING', 'APPROVED', 'CODE_ISSUED'] },
      },
    });
  }

  public static async listRequests(filter: ListEditRequestsFilter) {
    const where: any = {};

    if (filter.hackathonId) where.hackathonId = filter.hackathonId;
    if (filter.roundId) where.roundId = filter.roundId;
    if (filter.subRoundId) where.subRoundId = filter.subRoundId;
    if (filter.status) where.status = filter.status;
    if (filter.judgeUserId) where.judgeUserId = filter.judgeUserId;
    if (filter.teamId) where.teamId = filter.teamId;

    if (filter.search) {
      where.OR = [
        { project: { title: { contains: filter.search, mode: 'insensitive' } } },
        { project: { team: { name: { contains: filter.search, mode: 'insensitive' } } } },
        { criterionTitle: { contains: filter.search, mode: 'insensitive' } },
        { reason: { contains: filter.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.evaluationEditRequest.findMany({
        where,
        include: {
          evaluation: true,
          project: {
            include: {
              team: true,
              track: true,
            },
          },
          judge: {
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
          hackathon: {
            select: {
              id: true,
              title: true,
              slug: true,
              organizerId: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: filter.limit || 50,
        skip: filter.offset || 0,
      }),
      prisma.evaluationEditRequest.count({ where }),
    ]);

    return { items, total };
  }

  public static async approveRequest(
    id: string,
    data: {
      approvedById: string;
      approvedByType: 'ADMIN' | 'ORGANIZER';
      authCodeHash: string;
      authCodeMasked: string;
      authCodePlain: string;
      authCodeExpiresAt: Date;
    }
  ) {
    return await prisma.evaluationEditRequest.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedById: data.approvedById,
        approvedByType: data.approvedByType,
        approvedAt: new Date(),
        authCodeHash: data.authCodeHash,
        authCodeMasked: data.authCodeMasked,
        authCodePlain: data.authCodePlain,
        authCodeExpiresAt: data.authCodeExpiresAt,
      },
    });
  }

  public static async rejectRequest(id: string, data: { rejectedById: string; rejectedReason: string }) {
    return await prisma.evaluationEditRequest.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectedById: data.rejectedById,
        rejectedReason: data.rejectedReason.trim(),
        rejectedAt: new Date(),
      },
    });
  }

  public static async markExecuted(id: string) {
    return await prisma.evaluationEditRequest.update({
      where: { id },
      data: {
        status: 'EXECUTED',
        isCodeUsed: true,
        usedAt: new Date(),
        executedAt: new Date(),
      },
    });
  }
}
