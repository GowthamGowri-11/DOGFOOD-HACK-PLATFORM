import { NextRequest } from 'next/server';
import { requireAuth } from '@/server/permissions/guards';
import { successResponse, errorResponse } from '@/lib/api/response';
import prisma from '@/lib/prisma';
import { AuditService } from '@/server/services/audit.service';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id: projectId } = await params;

    // Fetch project and its hackathon configuration
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        hackathon: true,
      },
    });

    if (!project) {
      return errorResponse('Project not found', 'NOT_FOUND', 404);
    }

    // Check if hackathon allows community voting
    const hackathon = project.hackathon;
    if (!hackathon.isVotingEnabled) {
      return errorResponse(
        'Community voting is not enabled for this hackathon.',
        'VOTING_DISABLED',
        403
      );
    }

    // Check voting window if configured
    const now = new Date();
    if (hackathon.votingStartTime && now < hackathon.votingStartTime) {
      return errorResponse(
        `Community voting has not started yet. Starts at ${hackathon.votingStartTime.toISOString()}`,
        'VOTING_NOT_STARTED',
        403
      );
    }
    if (hackathon.votingEndTime && now > hackathon.votingEndTime) {
      return errorResponse(
        'Community voting has ended for this event.',
        'VOTING_ENDED',
        403
      );
    }

    // Check for duplicate vote
    const existingVote = await prisma.vote.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: session.id,
        },
      },
    });

    if (existingVote) {
      return errorResponse(
        'You have already voted for this project.',
        'DUPLICATE_VOTE',
        409
      );
    }

    // Record vote
    const vote = await prisma.vote.create({
      data: {
        projectId,
        userId: session.id,
      },
    });

    const totalVotes = await prisma.vote.count({ where: { projectId } });

    await AuditService.log({
      userId: session.id,
      hackathonId: project.hackathonId,
      action: 'VOTE_CAST',
      entityType: 'Vote',
      entityId: vote.id,
      afterState: { projectId, totalVotes },
    });

    return successResponse(
      { voteId: vote.id, totalVotes, hasVoted: true },
      'Community vote recorded successfully',
      201
    );
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

    const existingVote = await prisma.vote.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: session.id,
        },
      },
    });

    if (!existingVote) {
      return errorResponse('You have not voted for this project.', 'VOTE_NOT_FOUND', 404);
    }

    await prisma.vote.delete({
      where: {
        projectId_userId: {
          projectId,
          userId: session.id,
        },
      },
    });

    const totalVotes = await prisma.vote.count({ where: { projectId } });

    await AuditService.log({
      userId: session.id,
      action: 'VOTE_REMOVED',
      entityType: 'Vote',
      entityId: existingVote.id,
      afterState: { projectId, totalVotes },
    });

    return successResponse(
      { totalVotes, hasVoted: false },
      'Your vote has been removed successfully'
    );
  } catch (error: any) {
    const status = error.status || 500;
    const code = error.code || 'INTERNAL_ERROR';
    return errorResponse(error.message, code, status);
  }
}
