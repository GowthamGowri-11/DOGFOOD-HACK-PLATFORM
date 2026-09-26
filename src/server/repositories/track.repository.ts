import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export class TrackRepository {
  public static async listByHackathon(hackathonId: string) {
    return prisma.track.findMany({
      where: { hackathonId },
      include: {
        problemStatements: {
          orderBy: { displayOrder: 'asc' },
        },
      },
      orderBy: { displayOrder: 'asc' },
    });
  }

  public static async findById(id: string) {
    return prisma.track.findUnique({
      where: { id },
      include: {
        hackathon: {
          select: {
            id: true,
            organizerId: true,
          },
        },
        problemStatements: {
          orderBy: { displayOrder: 'asc' },
        },
      },
    });
  }

  public static async create(data: {
    hackathonId: string;
    title: string;
    slug: string;
    description?: string;
    colorHex?: string;
    displayOrder?: number;
  }) {
    return prisma.track.create({
      data: {
        hackathonId: data.hackathonId,
        title: data.title.trim(),
        slug: data.slug.trim().toLowerCase(),
        description: data.description?.trim(),
        colorHex: data.colorHex || '#3B82F6',
        displayOrder: data.displayOrder || 0,
      },
      include: {
        problemStatements: true,
      },
    });
  }

  public static async update(id: string, data: Prisma.TrackUpdateInput) {
    return prisma.track.update({
      where: { id },
      data,
      include: {
        problemStatements: true,
      },
    });
  }

  public static async delete(id: string) {
    return prisma.track.delete({
      where: { id },
    });
  }
}
