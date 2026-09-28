import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/server/permissions/guards';
import { EvaluationEditService } from '@/server/services/evaluation-edit.service';
import { successResponse, errorResponse } from '@/lib/api/response';

const executeEditSchema = z.object({
  requestId: z.string().min(1, 'requestId is required'),
  authorizationCode: z.string().length(4, 'authorizationCode must be exactly 4 digits'),
  newScore: z.number().min(0, 'newScore must be non-negative'),
  expectedVersion: z.number().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await requireRole(['JUDGE']);
    const body = await req.json();
    const parsed = executeEditSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse('Invalid execution payload', 'VALIDATION_ERROR', 422, parsed.error.format());
    }

    const result = await EvaluationEditService.executeMarkEdit({
      judgeUserId: session.id,
      requestId: parsed.data.requestId,
      authorizationCode: parsed.data.authorizationCode,
      newScore: parsed.data.newScore,
      expectedVersion: parsed.data.expectedVersion,
    });

    return successResponse(result, 'Mark edit executed successfully and score recalculated.');
  } catch (error: any) {
    const status = error.status || 500;
    const code = error.code || 'INTERNAL_ERROR';
    return errorResponse(error.message, code, status);
  }
}
