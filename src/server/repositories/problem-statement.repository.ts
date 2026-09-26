import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export class ProblemStatementRepository {
  public static async listByTrack(trackId: string, publicOnly = false) {
    return prisma.problemStatement.findMany({
      where: {
        trackId,
        ...(publicOnly ? { isPublic: true } : {}),
      },
      orderBy: { displayOrder: 'asc' },
    });
  }

  public static async listByHackathon(hackathonId: string, publicOnly = false) {
    return prisma.problemStatement.findMany({
      where: {
        hackathonId,
        ...(publicOnly ? { isPublic: true } : {}),
      },
      include: {
        track: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
      },
      orderBy: [{ trackId: 'asc' }, { displayOrder: 'asc' }],
    });
  }

  public static async findById(id: string) {
    return prisma.problemStatement.findUnique({
      where: { id },
      include: {
        track: true,
        hackathon: {
          select: {
            id: true,
            organizerId: true,
          },
        },
      },
    });
  }

  public static async create(data: {
    hackathonId: string;
    trackId: string;
    code: string;
    title: string;
    description: string;
    challengeDocUrl?: string;
    isPublic?: boolean;
    displayOrder?: number;
  }) {
    return prisma.problemStatement.create({
      data: {
        hackathonId: data.hackathonId,
        trackId: data.trackId,
        code: data.code.trim().toUpperCase(),
        title: data.title.trim(),
        description: data.description.trim(),
        challengeDocUrl: data.challengeDocUrl?.trim(),
        isPublic: data.isPublic !== undefined ? data.isPublic : true,
        displayOrder: data.displayOrder || 0,
      },
      include: {
        track: true,
      },
    });
  }

  public static async update(id: string, data: Prisma.ProblemStatementUpdateInput) {
    return prisma.problemStatement.update({
      where: { id },
      data,
      include: {
        track: true,
      },
    });
  }

  public static async delete(id: string) {
    return prisma.problemStatement.delete({
      where: { id },
    });
  }
}
