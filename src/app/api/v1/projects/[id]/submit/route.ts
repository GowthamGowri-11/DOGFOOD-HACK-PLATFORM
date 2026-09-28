import { NextRequest } from 'next/server';
import { requireRole } from '@/server/permissions/guards';
import { SubmissionLockService } from '@/server/services/submission-lock.service';
import { successResponse, errorResponse } from '@/lib/api/response';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireRole(['PARTICIPANT', 'ORGANIZER', 'ADMIN']);
    let roundNumber: number | undefined = undefined;
    try {
      const body = await req.clone().json();
      if (body?.roundNumber) roundNumber = Number(body.roundNumber);
    } catch {
      // Body may be empty
    }

    const result = await SubmissionLockService.submitAndLockProject(params.id, session.id, new Date(), roundNumber);

    return successResponse(
      result,
      'Project submitted and locked successfully! An immutable snapshot has been generated.',
      201
    );
  } catch (error: any) {
    const status = error.status || 500;
    const code = error.code || 'INTERNAL_ERROR';
    return errorResponse(error.message, code, status, error.details);
  }
}
