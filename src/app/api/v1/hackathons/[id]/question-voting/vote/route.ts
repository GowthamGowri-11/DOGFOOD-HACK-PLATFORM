import { NextRequest } from 'next/server';
import { requireAuth } from '@/server/permissions/guards';
import { QuestionVotingService } from '@/server/services/question-voting.service';
import { successResponse, errorResponse } from '@/lib/api/response';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id: hackathonId } = await params;

    const body = await req.json();
    const { problemStatementId, desiredVotes } = body;

    if (!problemStatementId || typeof desiredVotes !== 'number') {
      return errorResponse(
        'Missing problemStatementId or valid desiredVotes number.',
        'INVALID_REQUEST',
        400
      );
    }

    const ipAddress =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('x-real-ip') ||
      '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || 'Unknown';

    const result = await QuestionVotingService.castVote({
      hackathonId,
      userId: session.id,
      userEmail: session.email,
      userRole: session.role,
      problemStatementId,
      desiredVotes,
      ipAddress,
      userAgent,
    });

    return successResponse(result, 'Vote recorded successfully');
  } catch (error: any) {
    console.error('[API /question-voting/vote POST] Error:', error);
    const status = error.status || 400;
    return errorResponse(error.message || 'Failed to record vote', 'VOTE_ERROR', status);
  }
}
