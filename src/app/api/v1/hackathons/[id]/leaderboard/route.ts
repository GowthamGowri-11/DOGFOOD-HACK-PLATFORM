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

    // Check hackathon status and organizer
    const hackathon = await prisma.hackathon.findUnique({
      where: { id: hackathonId },
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        organizerId: true,
        resultsPublishedAt: true,
      },
    });

    if (!hackathon) {
      return errorResponse('Hackathon not found', 'NOT_FOUND', 404);
    }

    const isOrganizerOrAdmin =
      session && (session.role === 'ADMIN' || session.id === hackathon.organizerId);

    // If unpublished, reject public access
    if (hackathon.status !== 'RESULTS_PUBLISHED' && !isOrganizerOrAdmin) {
      return errorResponse(
        'Official leaderboard for this event has not been published yet.',
        'LEADERBOARD_NOT_PUBLISHED',
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
            problemStatement: {
              select: {
                id: true,
                code: true,
                title: true,
              },
            },
            _count: {
              select: {
                votes: true,
              },
            },
          },
        },
      },
      orderBy: { rank: 'asc' },
    });

    return successResponse({
      hackathon: {
        id: hackathon.id,
        title: hackathon.title,
        slug: hackathon.slug,
        isPublished: hackathon.status === 'RESULTS_PUBLISHED',
        resultsPublishedAt: hackathon.resultsPublishedAt,
      },
      standings: results.map((r) => ({
        rank: r.rank,
        projectId: r.projectId,
        projectTitle: r.project.title,
        projectSlug: r.project.slug,
        teamName: r.project.team.name,
        track: r.project.track.title,
        trackColor: r.project.track.colorHex,
        problemStatement: `[${r.project.problemStatement.code}] ${r.project.problemStatement.title}`,
        finalScore: r.finalScore,
        awardCategory: r.awardCategory,
        isWinner: r.isWinner,
        communityVotesCount: r.project._count.votes,
      })),
    });
  } catch (error: any) {
    const status = error.status || 500;
    const code = error.code || 'INTERNAL_ERROR';
    return errorResponse(error.message, code, status);
  }
}
