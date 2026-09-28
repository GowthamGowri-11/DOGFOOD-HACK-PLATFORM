import { NextRequest } from 'next/server';
import { requireRole } from '@/server/permissions/guards';
import { ResultService } from '@/server/services/result.service';
import { AuditService } from '@/server/services/audit.service';
import { successResponse, errorResponse } from '@/lib/api/response';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await requireRole('ADMIN');

    const { searchParams } = new URL(req.url);
    const hackathonId = searchParams.get('hackathonId') || undefined;

    const hackathons = await prisma.hackathon.findMany({
      where: {
        ...(hackathonId ? { id: hackathonId } : {}),
      },
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        resultsPublishedAt: true,
        rulesAndGuidelines: true,
        organizer: { select: { id: true, fullName: true, email: true } },
        tracks: {
          select: {
            id: true,
            title: true,
            slug: true,
            colorHex: true,
          },
          orderBy: { displayOrder: 'asc' },
        },
        prizes: {
          orderBy: { rankOrder: 'asc' },
          select: {
            id: true,
            title: true,
            category: true,
            amount: true,
            currency: true,
            rankOrder: true,
            description: true,
          },
        },
        scoreNormalizations: {
          orderBy: { version: 'desc' },
          take: 1,
          select: {
            id: true,
            method: true,
            version: true,
            executedAt: true,
          },
        },
        results: {
          orderBy: { rank: 'asc' },
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
                      select: {
                        isLeader: true,
                        user: { select: { id: true, fullName: true } },
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
              },
            },
          },
        },
        _count: {
          select: {
            results: true,
            projects: true,
            judges: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Compute verification reports and evaluation counts for each hackathon
    const enrichedHackathons = await Promise.all(
      hackathons.map(async (h) => {
        let verification = null;
        if (h.results.length > 0) {
          try {
            verification = await ResultService.verifyResults(h.id);
          } catch {
            verification = null;
          }
        }

        // Count completed evaluations for submitted projects in this arena
        const completedEvaluationsCount = await prisma.evaluation.count({
          where: {
            project: { hackathonId: h.id },
            status: 'SUBMITTED',
          },
        });

        // Count submitted projects (projects with status SUBMITTED)
        const submittedProjectsCount = await prisma.project.count({
          where: {
            hackathonId: h.id,
            submissions: { some: { status: 'SUBMITTED' } },
          },
        });

        return {
          ...h,
          verification,
          latestNormalization: h.scoreNormalizations[0] || null,
          stats: {
            rankedCount: h.results.length,
            submittedProjectsCount,
            completedEvaluationsCount,
            judgesCount: h._count.judges,
            prizesCount: h.prizes.length,
            isPublished: h.status === 'RESULTS_PUBLISHED',
          },
        };
      })
    );

    return successResponse({ hackathons: enrichedHackathons });
  } catch (error: any) {
    if (error.status === 403 || error.code === 'FORBIDDEN_ROLE') {
      return errorResponse(error.message, 'FORBIDDEN', 403);
    }
    if (error.status === 401 || error.code === 'UNAUTHORIZED') {
      return errorResponse(error.message, 'UNAUTHORIZED', 401);
    }
    return errorResponse(error.message || 'Failed to list results', 'INTERNAL_ERROR', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireRole('ADMIN');
    const body = await req.json();
    const { hackathonId, action = 'publish', method = 'Z_SCORE' } = body;

    if (!hackathonId) {
      return errorResponse('hackathonId is required', 'VALIDATION_ERROR', 400);
    }

    if (action === 'generate' || action === 'calculate') {
      // Generate & Normalize results
      const genResult = await ResultService.generateResults(hackathonId, session.id, {
        method: method === 'MIN_MAX' ? 'MIN_MAX' : 'Z_SCORE',
        forceRegenerate: true,
      });

      try {
        revalidatePath('/admin/results');
        revalidatePath('/leaderboard');
      } catch {
        // Safe to ignore in dev / static
      }

      return successResponse(
        genResult,
        `Scores successfully normalized via ${method} and official rankings calculated.`
      );
    }

    if (action === 'unpublish') {
      // Revert results publication to DRAFT / JUDGING stage
      await prisma.$transaction(async (tx) => {
        await tx.result.updateMany({
          where: { hackathonId },
          data: {
            isPublished: false,
            publishedAt: null,
          },
        });

        await tx.hackathon.update({
          where: { id: hackathonId },
          data: {
            status: 'JUDGING',
            resultsPublishedAt: null,
          },
        });
      });

      await AuditService.log({
        userId: session.id,
        hackathonId,
        action: 'RESULTS_UNPUBLISHED',
        entityType: 'Hackathon',
        entityId: hackathonId,
        afterState: { status: 'JUDGING', isPublished: false },
      });

      try {
        revalidatePath('/leaderboard');
        revalidatePath('/admin/results');
      } catch {
        // Safe to ignore in dev
      }

      return successResponse(
        { hackathonId, status: 'JUDGING', isPublished: false },
        'Official results have been unpublished and returned to draft.'
      );
    }

    // Default action: publish
    const result = await ResultService.publishResults(hackathonId, session.id);

    try {
      revalidatePath('/leaderboard');
      revalidatePath('/gallery');
      revalidatePath('/projects');
      revalidatePath('/admin/results');
      revalidatePath('/organizer/results');
    } catch {
      // Ignore during test/static builds
    }

    return successResponse(result, 'Official results and leaderboard published successfully');
  } catch (error: any) {
    if (error.status === 403 || error.code === 'FORBIDDEN_ROLE') {
      return errorResponse(error.message, 'FORBIDDEN', 403);
    }
    if (error.status === 401 || error.code === 'UNAUTHORIZED') {
      return errorResponse(error.message, 'UNAUTHORIZED', 401);
    }
    return errorResponse(error.message || 'Operation failed', 'INTERNAL_ERROR', error.status || 500);
  }
}
