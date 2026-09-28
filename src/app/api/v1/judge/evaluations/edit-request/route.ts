import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/server/permissions/guards';
import { EvaluationEditService } from '@/server/services/evaluation-edit.service';
import { EvaluationEditRepository } from '@/server/repositories/evaluation-edit.repository';
import { successResponse, errorResponse } from '@/lib/api/response';

const createEditRequestSchema = z.object({
  evaluationId: z.string().min(1, 'evaluationId is required'),
  criterionId: z.string().min(1, 'criterionId is required'),
  requestedScore: z.number().min(0, 'requestedScore must be non-negative'),
  reason: z.string().min(3, 'A clear explanation of at least 3 characters is required'),
});

export async function POST(req: NextRequest) {
  try {
    const session = await requireRole(['JUDGE']);
    const body = await req.json();
    const parsed = createEditRequestSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse('Invalid edit request payload', 'VALIDATION_ERROR', 422, parsed.error.format());
    }

    const editRequest = await EvaluationEditService.requestMarkEdit({
      judgeUserId: session.id,
      evaluationId: parsed.data.evaluationId,
      criterionId: parsed.data.criterionId,
      requestedScore: parsed.data.requestedScore,
      reason: parsed.data.reason,
    });

    return successResponse(
      { editRequest },
      'Mark edit request submitted successfully. Awaiting approval from Admin/Organizer.'
    );
  } catch (error: any) {
    const status = error.status || 500;
    const code = error.code || 'INTERNAL_ERROR';
    return errorResponse(error.message, code, status);
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await requireRole(['JUDGE']);
    const { searchParams } = new URL(req.url);
    const hackathonId = searchParams.get('hackathonId') || undefined;
    const status = (searchParams.get('status') as any) || undefined;

    const result = await EvaluationEditRepository.listRequests({
      judgeUserId: session.id,
      hackathonId,
      status,
    });

    return successResponse(result);
  } catch (error: any) {
    const status = error.status || 500;
    const code = error.code || 'INTERNAL_ERROR';
    return errorResponse(error.message, code, status);
  }
}
