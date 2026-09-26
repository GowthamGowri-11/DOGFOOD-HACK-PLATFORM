import prisma from '@/lib/prisma';

export interface CreateRubricInput {
  hackathonId: string;
  name: string;
  version?: number;
  criteria: {
    title: string;
    description: string;
    weightPercentage: number;
    maxScore?: number;
    displayOrder?: number;
    requiredFeedback?: boolean;
  }[];
}

export class RubricRepository {
  /**
   * Finds the current active rubric for a hackathon with its criteria.
   */
  public static async findCurrentByHackathon(hackathonId: string) {
    return prisma.rubric.findFirst({
      where: {
        hackathonId,
        isCurrent: true,
      },
      include: {
        criteria: {
          orderBy: { displayOrder: 'asc' },
        },
      },
    });
  }

  /**
   * Finds all rubrics (including historical versions) for a hackathon.
   */
  public static async findAllByHackathon(hackathonId: string) {
    return prisma.rubric.findMany({
      where: { hackathonId },
      include: {
        criteria: {
          orderBy: { displayOrder: 'asc' },
        },
        _count: {
          select: {
            evaluations: true,
            aiJuryRuns: true,
          },
        },
      },
      orderBy: { version: 'desc' },
    });
  }

  /**
   * Finds a rubric by ID with its criteria and evaluation counts.
   */
  public static async findById(id: string) {
    return prisma.rubric.findUnique({
      where: { id },
      include: {
        criteria: {
          orderBy: { displayOrder: 'asc' },
        },
        _count: {
          select: {
            evaluations: true,
            aiJuryRuns: true,
          },
        },
      },
    });
  }

  /**
   * Creates a new rubric with criteria in a transaction.
   * If isCurrent is true, unsets previous current rubrics for the hackathon.
   */
  public static async create(input: CreateRubricInput) {
    return prisma.$transaction(async (tx) => {
      // Find current latest version
      const latest = await tx.rubric.findFirst({
        where: { hackathonId: input.hackathonId },
        orderBy: { version: 'desc' },
      });

      const nextVersion = input.version || (latest ? latest.version + 1 : 1);

      // Unset previous active rubrics
      await tx.rubric.updateMany({
        where: { hackathonId: input.hackathonId, isCurrent: true },
        data: { isCurrent: false },
      });

      // Create new rubric
      const rubric = await tx.rubric.create({
        data: {
          hackathonId: input.hackathonId,
          name: input.name || `Rubric v${nextVersion}`,
          version: nextVersion,
          isCurrent: true,
          criteria: {
            create: input.criteria.map((c, idx) => ({
              title: c.title,
              description: c.description,
              weightPercentage: c.weightPercentage,
              maxScore: c.maxScore || 100,
              displayOrder: c.displayOrder ?? idx,
              requiredFeedback: c.requiredFeedback ?? true,
            })),
          },
        },
        include: {
          criteria: {
            orderBy: { displayOrder: 'asc' },
          },
        },
      });

      return rubric;
    });
  }

  /**
   * Checks whether a rubric has been used in any submitted evaluations.
   * Used to enforce immutability of active rubric versions.
   */
  public static async isLockedByEvaluations(rubricId: string): Promise<boolean> {
    const count = await prisma.evaluation.count({
      where: {
        rubricId,
        status: 'SUBMITTED',
      },
    });
    return count > 0;
  }
}
