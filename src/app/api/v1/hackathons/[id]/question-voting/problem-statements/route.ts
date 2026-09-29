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
    const { trackId, code, title, description } = body;

    if (!trackId || !code || !title || !description) {
      return errorResponse(
        'Missing required fields: trackId, code, title, or description.',
        'VALIDATION_ERROR',
        400
      );
    }

    const created = await QuestionVotingService.createProblemStatement({
      hackathonId,
      trackId,
      code,
      title,
      description,
      organizerId: session.id,
    });

    return successResponse(created, 'Problem statement created successfully');
  } catch (error: any) {
    console.error('[API /question-voting/problem-statements POST] Error:', error);
    const status = error.status || 400;
    return errorResponse(
      error.message || 'Failed to create problem statement',
      'PROBLEM_STATEMENT_ERROR',
      status
    );
  }
}
