import { NextRequest } from 'next/server';
import { requireHackathonOrganizer } from '@/server/permissions/guards';
import { successResponse, errorResponse } from '@/lib/api/response';
import prisma from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: hackathonId } = await params;
    await requireHackathonOrganizer(hackathonId);

    const evaluations = await prisma.evaluation.findMany({
      where: {
        project: { hackathonId },
      },
      include: {
        judge: {
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
        project: {
          select: {
            id: true,
            title: true,
            slug: true,
            team: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        scores: {
          include: {
            criterion: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return successResponse({ evaluations });
  } catch (error: any) {
    const status = error.status || 500;
    const code = error.code || 'INTERNAL_ERROR';
    return errorResponse(error.message, code, status);
  }
}
