import { NextRequest } from 'next/server';
import { requireAuth } from '@/server/permissions/guards';
import { successResponse, errorResponse } from '@/lib/api/response';
import prisma from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id: hackathonId } = await params;

    // Find participant's team in this hackathon
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        userId: session.id,
        team: { hackathonId },
      },
      include: {
        team: {
          include: {
            project: {
              include: {
                result: true,
                track: true,
                problemStatement: true,
                _count: { select: { votes: true, comments: true } },
              },
            },
            hackathon: {
              select: {
                id: true,
                title: true,
                status: true,
                resultsPublishedAt: true,
              },
            },
          },
        },
      },
    });

    if (!teamMember || !teamMember.team.project) {
      return errorResponse(
        'No submitted project found for your team in this hackathon.',
        'PROJECT_NOT_FOUND',
        404
      );
    }

    const project = teamMember.team.project;
    const hackathon = teamMember.team.hackathon;
    const isPublished = hackathon.status === 'RESULTS_PUBLISHED';

    if (!isPublished) {
      return successResponse({
        hackathon: {
          id: hackathon.id,
          title: hackathon.title,
          status: hackathon.status,
          isPublished: false,
        },
        project: {
          id: project.id,
          title: project.title,
          slug: project.slug,
          track: project.track.title,
        },
        message: 'Judging is currently in progress. Results will be visible once published by the organizer.',
        result: null,
      });
    }

    return successResponse({
      hackathon: {
        id: hackathon.id,
        title: hackathon.title,
        status: hackathon.status,
        isPublished: true,
        resultsPublishedAt: hackathon.resultsPublishedAt,
      },
      project: {
        id: project.id,
        title: project.title,
        slug: project.slug,
        track: project.track.title,
        problemStatement: `[${project.problemStatement.code}] ${project.problemStatement.title}`,
        communityVotesCount: project._count.votes,
      },
      result: project.result
        ? {
            rank: project.result.rank,
            finalScore: project.result.finalScore,
            rawAverageScore: project.result.rawAverageScore,
            normalizedScore: project.result.normalizedScore,
            awardCategory: project.result.awardCategory,
            isWinner: project.result.isWinner,
          }
        : null,
    });
  } catch (error: any) {
    const status = error.status || 500;
    const code = error.code || 'INTERNAL_ERROR';
    return errorResponse(error.message, code, status);
  }
}
