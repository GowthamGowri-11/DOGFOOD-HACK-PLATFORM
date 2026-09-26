import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/server/permissions/guards';
import { getCurrentUser } from '@/server/auth/session';
import { ResourceGuards } from '@/server/permissions/resource-guards';
import { ProjectRepository } from '@/server/repositories/project.repository';
import { ProjectService } from '@/server/services/project.service';
import { SubmissionRepository } from '@/server/repositories/submission.repository';
import { successResponse, errorResponse } from '@/lib/api/response';
import prisma from '@/lib/prisma';


const updateProjectSchema = z.object({
  title: z.string().min(3).optional(),
  tagline: z.string().optional(),
  description: z.string().min(20).optional(),
  trackId: z.string().optional(),
  problemId: z.string().optional(),
  thumbnailUrl: z.string().optional(),
  repoUrl: z.string().optional(),
  demoUrl: z.string().optional(),
  videoUrl: z.string().optional(),
  documentationUrl: z.string().optional(),
  techStack: z.array(z.string()).optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const session = await getCurrentUser();

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        hackathon: {
          select: {
            id: true,
            title: true,
            slug: true,
            status: true,
            organizerId: true,
            isVotingEnabled: true,
            votingStartTime: true,
            votingEndTime: true,
          },
        },
        track: true,
        problemStatement: true,
        team: {
          include: {
            members: {
              include: {
                user: { select: { id: true, fullName: true, avatarUrl: true } },
              },
            },
          },
        },
        submissions: {
          where: { status: 'SUBMITTED' },
          orderBy: { versionNumber: 'desc' },
          take: 1,
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
    });

    if (!project) {
      return errorResponse('Project not found', 'NOT_FOUND', 404);
    }

    const isMember = session ? project.team.members.some((m) => m.user.id === session.id) : false;
    const isOrganizer = session && (session.role === 'ADMIN' || session.id === project.hackathon.organizerId);
    const hasSubmitted = project.submissions.length > 0;

    // A project is viewable if user is member/organizer OR if the project is published OR has a submission
    if (!isMember && !isOrganizer && !hasSubmitted && !project.isPublished) {
      return errorResponse('You are not authorized to view this project draft.', 'FORBIDDEN', 403);
    }

    let hasVoted = false;
    if (session) {
      const userVote = await prisma.vote.findUnique({
        where: {
          projectId_userId: {
            projectId,
            userId: session.id,
          },
        },
      });
      hasVoted = !!userVote;
    }

    const isPublishedResults = project.hackathon.status === 'RESULTS_PUBLISHED';

    return successResponse({
      project: {
        id: project.id,
        title: project.title,
        slug: project.slug,
        tagline: project.tagline,
        description: project.description,
        repoUrl: project.repoUrl,
        demoUrl: project.demoUrl,
        videoUrl: project.videoUrl,
        documentationUrl: project.documentationUrl,
        techStack: project.techStack,
        hackathon: project.hackathon,
        track: project.track,
        problemStatement: project.problemStatement,
        team: project.team,
        latestSubmission: project.submissions[0] || null,
        communityVotesCount: project._count.votes,
        commentsCount: project._count.comments,
        hasVoted,
        officialResult:
          isPublishedResults && project.result
            ? {
                rank: project.result.rank,
                finalScore: project.result.finalScore,
                awardCategory: project.result.awardCategory,
                isWinner: project.result.isWinner,
              }
            : null,
      },
      isMember,
      isOrganizer,
    });
  } catch (error: any) {
    const status = error.status || 500;
    const code = error.code || 'INTERNAL_ERROR';
    return errorResponse(error.message, code, status);
  }
}


export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id: projectId } = await params;

    const body = await req.json();
    const parsed = updateProjectSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse('Invalid project update payload', 'VALIDATION_ERROR', 422, parsed.error.format());
    }

    const updated = await ProjectService.updateProject({
      projectId,
      userId: session.id,
      ...parsed.data,
    });

    return successResponse({ project: updated }, 'Project updated successfully');
  } catch (error: any) {
    const status = error.status || 500;
    const code = error.code || 'INTERNAL_ERROR';
    return errorResponse(error.message, code, status);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id: projectId } = await params;

    const project = await ProjectRepository.findById(projectId);
    if (!project) {
      return errorResponse('Project not found', 'NOT_FOUND', 404);
    }

    const isLeader = project.team.leaderId === session.id;
    const isAdmin = session.role === 'ADMIN';

    if (!isLeader && !isAdmin) {
      return errorResponse('Only the team leader or an admin can delete the project.', 'FORBIDDEN', 403);
    }

    const latest = await SubmissionRepository.findLatestByProjectId(projectId);
    if (latest && latest.status === 'LOCKED') {
      return errorResponse('Locked projects cannot be deleted.', 'SUBMISSION_LOCKED', 403);
    }

    await ProjectRepository.delete(projectId);
    return successResponse(null, 'Project deleted successfully');
  } catch (error: any) {
    const status = error.status || 500;
    const code = error.code || 'INTERNAL_ERROR';
    return errorResponse(error.message, code, status);
  }
}

