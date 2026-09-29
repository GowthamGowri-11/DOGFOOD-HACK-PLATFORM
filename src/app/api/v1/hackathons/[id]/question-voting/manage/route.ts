import { NextRequest } from 'next/server';
import { requireRole } from '@/server/permissions/guards';
import { QuestionVotingService } from '@/server/services/question-voting.service';
import { successResponse, errorResponse } from '@/lib/api/response';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRole(['ADMIN', 'ORGANIZER']);
    const { id: hackathonId } = await params;

    const body = await req.json();

    const updated = await QuestionVotingService.updateCampaign(
      hackathonId,
      body,
      session.id
    );

    return successResponse(updated, 'Voting campaign configuration updated successfully');
  } catch (error: any) {
    console.error('[API /question-voting/manage POST] Error:', error);
    const status = error.status || 400;
    return errorResponse(
      error.message || 'Failed to update campaign configuration',
      'CAMPAIGN_UPDATE_ERROR',
      status
    );
  }
}
