import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/server/auth/session';
import { QuestionVotingService } from '@/server/services/question-voting.service';
import { successResponse, errorResponse } from '@/lib/api/response';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: hackathonId } = await params;
    const session = await getSession();

    const data = await QuestionVotingService.getCampaign(
      hackathonId,
      session
        ? {
            id: session.id,
            role: session.role,
            email: session.email,
          }
        : null
    );

    return successResponse(data, 'Question voting ballot retrieved successfully');
  } catch (error: any) {
    console.error('[API /question-voting GET] Error:', error);
    return errorResponse(error.message || 'Internal server error', 'VOTING_FETCH_ERROR', 500);
  }
}
