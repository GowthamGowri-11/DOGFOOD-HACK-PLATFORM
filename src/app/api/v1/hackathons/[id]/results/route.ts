import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/server/auth/session';
import { successResponse, errorResponse } from '@/lib/api/response';
import prisma from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: hackathonId } = await params;
    const session = await getCurrentUser();

    // Check hackathon status
    const hackathon = await prisma.hackathon.findUnique({
      where: { id: hackathonId },
      select: { organizerId: true, status: true },
    });

    if (!hackathon) {
      return errorResponse('Hackathon not found', 'NOT_FOUND', 404);
    }

    const isOrganizerOrAdmin =
      session && (session.role === 'ADMIN' || session.id === hackathon.organizerId);

    // If results are not published and user is not organizer/admin, forbid viewing results
    if (hackathon.status !== 'RESULTS_PUBLISHED' && !isOrganizerOrAdmin) {
      return errorResponse(
        'Results for this hackathon have not been published yet.',
        'RESULTS_NOT_PUBLISHED',
        403
      );
    }

    const results = await prisma.result.findMany({
      where: { hackathonId },
      include: {
        project: {
          select: {
            id: true,
            title: true,
            slug: true,
            tagline: true,
            repoUrl: true,
            demoUrl: true,
            team: {
              select: {
                id: true,
                name: true,
                members: {
                  include: {
                    user: {
                      select: {
                        id: true,
                        fullName: true,
                        avatarUrl: true,
                      },
                    },
                  },
                },
              },
            },
            track: {
              select: {
                id: true,
                title: true,
                colorHex: true,
              },
            },
          },
        },
      },
      orderBy: { rank: 'asc' },
    });

    return successResponse({
      hackathonId,
      isPublished: hackathon.status === 'RESULTS_PUBLISHED',
      results,
    });
  } catch (error: any) {
    const status = error.status || 500;
    const code = error.code || 'INTERNAL_ERROR';
    return errorResponse(error.message, code, status);
  }
}
