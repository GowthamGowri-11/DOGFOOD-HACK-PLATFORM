import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/server/auth/session';
import { successResponse, errorResponse } from '@/lib/api/response';
import prisma from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const session = await getCurrentUser();

    const totalVotes = await prisma.vote.count({
      where: { projectId },
    });

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

    return successResponse({
      projectId,
      totalVotes,
      hasVoted,
    });
  } catch (error: any) {
    const status = error.status || 500;
    const code = error.code || 'INTERNAL_ERROR';
    return errorResponse(error.message, code, status);
  }
}
