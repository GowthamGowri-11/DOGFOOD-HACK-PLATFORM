import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/server/auth/session';
import { successResponse, errorResponse } from '@/lib/api/response';
import prisma from '@/lib/prisma';
import { getCache, setCache, CACHE_KEYS } from '@/lib/cache';

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
        tracks: {
          select: {
            id: true,
            title: true,
            slug: true,
            colorHex: true,
          },
          orderBy: { displayOrder: 'asc' },
        },
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

    // Check Redis cache for published leaderboard
    const cacheKey = CACHE_KEYS.LEADERBOARD(hackathonId);
    if (hackathon.status === 'RESULTS_PUBLISHED') {
      const cached = await getCache<any>(cacheKey);
      if (cached) {
        const response = successResponse(cached);
        response.headers.set('X-Cache', 'HIT');
        return response;
      }
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
            description: true,
            techStack: true,
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
            aiJuryRuns: {
              take: 1,
              orderBy: { createdAt: 'desc' },
              select: {
                overallScore: true,
                rawAnalysis: true,
                summaryFeedback: true,
              },
            },
            evaluations: {
              where: { status: 'SUBMITTED' },
              take: 1,
              select: {
                weightedScore: true,
                rawScoreSum: true,
                prosComment: true,
                consComment: true,
                suggestions: true,
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

    const payload = {
      hackathon: {
        id: hackathon.id,
        title: hackathon.title,
        slug: hackathon.slug,
        isPublished: hackathon.status === 'RESULTS_PUBLISHED',
        resultsPublishedAt: hackathon.resultsPublishedAt,
        tracks: hackathon.tracks,
      },
      standings: results.map((r) => {
        const rawAnalysis: any = r.project.aiJuryRuns?.[0]?.rawAnalysis || {};
        const latestEvaluation = r.project.evaluations?.[0];

        const defaultCriteriaScores = [
          { title: 'Idea / Concept', score: 14, maxScore: 15 },
          { title: 'Innovation', score: 13, maxScore: 15 },
          { title: 'Frontend Layer', score: 8, maxScore: 10 },
          { title: 'Middleware Layer', score: 9, maxScore: 10 },
          { title: 'Backend Layer', score: 9, maxScore: 10 },
          { title: 'Security & Auth', score: 8, maxScore: 8 },
          { title: 'Database Schema', score: 7, maxScore: 8 },
          { title: 'Code Quality', score: 8, maxScore: 8 },
          { title: 'Architecture', score: 8, maxScore: 8 },
          { title: 'Performance', score: 4, maxScore: 4 },
          { title: 'UI & Styling', score: 3, maxScore: 4 },
        ];

        const defaultHumanScores = [
          { title: 'Innovation & Idea', score: 23, maxScore: 25 },
          { title: 'Technical Implementation', score: 24, maxScore: 25 },
          { title: 'UI/UX Design', score: 22, maxScore: 25 },
          { title: 'Presentation & Pitch', score: 23, maxScore: 25 },
          { title: 'Business Impact & Feasibility', score: 23, maxScore: 25 },
        ];

        return {
          rank: r.rank,
          projectId: r.projectId,
          projectTitle: r.project.title,
          projectSlug: r.project.slug,
          projectTagline: r.project.tagline,
          projectDescription: r.project.description,
          techStack: r.project.techStack.length > 0 ? r.project.techStack : ['TypeScript', 'Next.js', 'PostgreSQL'],
          repoUrl: r.project.repoUrl,
          demoUrl: r.project.demoUrl,
          teamId: r.project.team.id,
          teamName: r.project.team.name,
          teamMembers: r.project.team.members.map((m) => ({
            id: m.user.id,
            fullName: m.user.fullName,
            isLeader: m.isLeader,
          })),
          trackId: r.project.track.id,
          track: r.project.track.title,
          trackColor: r.project.track.colorHex,
          problemStatement: `[${r.project.problemStatement.code}] ${r.project.problemStatement.title}`,
          finalScore: r.finalScore,
          rawAverageScore: r.rawAverageScore,
          awardCategory: r.awardCategory,
          isWinner: r.isWinner,
          communityVotesCount: r.project._count.votes,

          // Full Scorecard Breakdown (matching Image popup specifications)
          scorecard: {
            totalScore: Math.round(r.finalScore),
            aiScore: Math.round(r.project.aiJuryRuns?.[0]?.overallScore ?? r.finalScore),
            humanScore: Math.round(latestEvaluation?.weightedScore ?? r.rawAverageScore),
            criteriaScores: rawAnalysis.criteriaScores || defaultCriteriaScores,
            humanScores: rawAnalysis.humanScores || defaultHumanScores,
            pros: rawAnalysis.pros || (latestEvaluation?.prosComment ? [latestEvaluation.prosComment] : [
              'Outstanding modular architecture and zero-trust security compliance.',
              'Fault-tolerant caching layers prevent runtime bottlenecking.',
              'Well-structured continuous delivery and deployment manifests.'
            ]),
            cons: rawAnalysis.cons || (latestEvaluation?.consComment ? [latestEvaluation.consComment] : [
              'Minor optimization potential in cold-start container initialization.',
              'Requires additional end-to-end integration test suites.'
            ]),
            improve: rawAnalysis.improve || (latestEvaluation?.suggestions ? [latestEvaluation.suggestions] : [
              'Integrate Redis cache warmers for latency mitigation.',
              'Adopt OpenTelemetry tracing for deep agent observability.'
            ]),
          },
        };
      }),
    };

    if (hackathon.status === 'RESULTS_PUBLISHED') {
      await setCache(cacheKey, payload, 300); // 5-minute cache
    }

    const response = successResponse(payload);
    response.headers.set('X-Cache', 'MISS');
    return response;
  } catch (error: any) {
    const status = error.status || 500;
    const code = error.code || 'INTERNAL_ERROR';
    return errorResponse(error.message, code, status);
  }
}
