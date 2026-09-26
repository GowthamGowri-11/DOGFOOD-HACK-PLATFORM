import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export class PrizeRepository {
  public static async listByHackathon(hackathonId: string) {
    return prisma.prize.findMany({
      where: { hackathonId },
      orderBy: { rankOrder: 'asc' },
    });
  }

  public static async findById(id: string) {
    return prisma.prize.findUnique({
      where: { id },
      include: {
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
    title: string;
    category?: string;
    amount: number | Prisma.Decimal;
    currency?: string;
    rankOrder?: number;
    description?: string;
  }) {
    return prisma.prize.create({
      data: {
        hackathonId: data.hackathonId,
        title: data.title.trim(),
        category: data.category?.trim(),
        amount: data.amount,
        currency: data.currency || 'USD',
        rankOrder: data.rankOrder || 1,
        description: data.description?.trim(),
      },
    });
  }

  public static async update(id: string, data: Prisma.PrizeUpdateInput) {
    return prisma.prize.update({
      where: { id },
      data,
    });
  }

  public static async delete(id: string) {
    return prisma.prize.delete({
      where: { id },
    });
  }
}
