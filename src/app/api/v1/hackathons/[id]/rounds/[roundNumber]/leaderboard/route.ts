import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/server/auth/session';
import { successResponse, errorResponse } from '@/lib/api/response';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string; roundNumber: string } }
) {
  try {
    const hackathonId = params.id;
    const roundNumber = parseInt(params.roundNumber, 10);
    const session = await getCurrentUser();

    if (isNaN(roundNumber) || roundNumber < 1) {
      return errorResponse('Invalid round number', 'INVALID_ROUND', 400);
    }

    const hackathon = await prisma.hackathon.findUnique({
      where: { id: hackathonId },
      select: {
        id: true,
        title: true,
        status: true,
        organizerId: true,
        progressionMode: true,
      },
    });

    if (!hackathon) {
      return errorResponse('Hackathon not found', 'NOT_FOUND', 404);
    }

    const roundResults = await prisma.roundResult.findMany({
      where: {
        hackathonId,
        roundNumber,
      },
      include: {
        project: {
          select: {
            id: true,
            title: true,
            slug: true,
            tagline: true,
            techStack: true,
            repoUrl: true,
            demoUrl: true,
            track: {
              select: { id: true, title: true, colorHex: true },
            },
          },
        },
        team: {
          select: {
            id: true,
            name: true,
            progressionStatus: true,
            highestRound: true,
            members: {
              include: {
                user: {
                  select: { id: true, fullName: true, avatarUrl: true },
                },
              },
            },
          },
        },
      },
      orderBy: { rank: 'asc' },
    });

    return successResponse({
      hackathonId,
      roundNumber,
      progressionMode: hackathon.progressionMode,
      totalTeams: roundResults.length,
      standings: roundResults.map((r) => ({
        rank: r.rank,
        teamId: r.teamId,
        teamName: r.team.name,
        projectId: r.projectId,
        projectTitle: r.project?.title || null,
        projectSlug: r.project?.slug || null,
        track: r.project?.track || null,
        finalScore: r.finalScore,
        rawAverageScore: r.rawAverageScore,
        progressionStatus: r.progressionStatus,
        isAdvanced: r.progressionStatus === 'ADVANCED',
        isEliminated: r.progressionStatus === 'ELIMINATED',
        members: r.team.members.map((m) => ({
          id: m.user.id,
          fullName: m.user.fullName,
          avatarUrl: m.user.avatarUrl,
        })),
      })),
    });
  } catch (error: any) {
    const status = error.status || 500;
    const code = error.code || 'INTERNAL_ERROR';
    return errorResponse(error.message, code, status);
  }
}
