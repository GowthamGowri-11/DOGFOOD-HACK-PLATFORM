import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api/response';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const hackathonId = searchParams.get('hackathonId') || undefined;
    const trackId = searchParams.get('trackId') || undefined;
    const search = searchParams.get('search') || undefined;
    const sort = searchParams.get('sort') || 'newest'; // 'newest' | 'votes' | 'rank'

    // Show projects that are published or have at least one SUBMITTED submission
    const projects = await prisma.project.findMany({
      where: {
        OR: [{ submissions: { some: { status: 'SUBMITTED' } } }, { isPublished: true }],
        ...(hackathonId ? { hackathonId } : {}),
        ...(trackId ? { trackId } : {}),
        ...(search
          ? {
              AND: [
                {
                  OR: [
                    { title: { contains: search, mode: 'insensitive' } },
                    { description: { contains: search, mode: 'insensitive' } },
                    { team: { name: { contains: search, mode: 'insensitive' } } },
                  ],
                },
              ],
            }
          : {}),
      },
      include: {
        hackathon: {
          select: {
            id: true,
            title: true,
            slug: true,
            status: true,
            isVotingEnabled: true,
          },
        },
        track: { select: { id: true, title: true, colorHex: true } },
        problemStatement: { select: { id: true, code: true, title: true } },
        team: {
          select: {
            id: true,
            name: true,
            members: {
              include: {
                user: { select: { id: true, fullName: true, avatarUrl: true } },
              },
            },
          },
        },
        result: {
          select: {
            rank: true,
            finalScore: true,
            awardCategory: true,
            isWinner: true,
            isPublished: true,
          },
        },
        _count: {
          select: {
            votes: true,
            comments: { where: { isFlagged: false } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Format and apply public privacy rules: only show official result if hackathon has RESULTS_PUBLISHED
    const formatted = projects.map((p) => {
      const isPublishedResults = p.hackathon.status === 'RESULTS_PUBLISHED';
      return {
        id: p.id,
        title: p.title,
        slug: p.slug,
        tagline: p.tagline,
        description: p.description,
        repoUrl: p.repoUrl,
        demoUrl: p.demoUrl,
        videoUrl: p.videoUrl,
        documentationUrl: p.documentationUrl,
        techStack: p.techStack,
        hackathon: p.hackathon,
        track: p.track,
        problemStatement: p.problemStatement,
        team: p.team,
        communityVotesCount: p._count.votes,
        commentsCount: p._count.comments,
        // Official result is only exposed publicly if results are officially published
        officialResult:
          isPublishedResults && p.result
            ? {
                rank: p.result.rank,
                finalScore: p.result.finalScore,
                awardCategory: p.result.awardCategory,
                isWinner: p.result.isWinner,
              }
            : null,
      };
    });

    // In-memory sorting based on selected criterion
    if (sort === 'votes') {
      formatted.sort((a, b) => b.communityVotesCount - a.communityVotesCount);
    } else if (sort === 'rank') {
      formatted.sort((a, b) => {
        const rankA = a.officialResult?.rank ?? 999999;
        const rankB = b.officialResult?.rank ?? 999999;
        return rankA - rankB;
      });
    }

    return successResponse({
      totalCount: formatted.length,
      projects: formatted,
    });
  } catch (error: any) {
    const status = error.status || 500;
    const code = error.code || 'INTERNAL_ERROR';
    return errorResponse(error.message, code, status);
  }
}
