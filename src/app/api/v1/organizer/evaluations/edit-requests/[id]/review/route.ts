import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/server/permissions/guards';
import { EvaluationEditService } from '@/server/services/evaluation-edit.service';
import { successResponse, errorResponse } from '@/lib/api/response';

const reviewSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT']),
  rejectionReason: z.string().optional(),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireRole(['ORGANIZER', 'ADMIN']);
    const body = await req.json();
    const parsed = reviewSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse('Invalid review payload', 'VALIDATION_ERROR', 422, parsed.error.format());
    }

    const result = await EvaluationEditService.reviewEditRequest({
      reviewerUserId: session.id,
      reviewerRole: session.role === 'ADMIN' ? 'ADMIN' : 'ORGANIZER',
      requestId: params.id,
      action: parsed.data.action,
      rejectionReason: parsed.data.rejectionReason,
    });

    return successResponse(
      result,
      parsed.data.action === 'APPROVE'
        ? 'Edit request approved and 4-digit authorization code generated for the judge.'
        : 'Edit request rejected.'
    );
  } catch (error: any) {
    const status = error.status || 500;
    const code = error.code || 'INTERNAL_ERROR';
    return errorResponse(error.message, code, status);
  }
}
