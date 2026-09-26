import { NextRequest } from 'next/server';
import { requireRole } from '@/server/permissions/guards';
import { ResourceGuards } from '@/server/permissions/resource-guards';
import { SubmissionRepository } from '@/server/repositories/submission.repository';
import { successResponse, errorResponse } from '@/lib/api/response';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireRole(['ORGANIZER', 'ADMIN']);
    const hackathonId = params.id;

    if (session.role === 'ORGANIZER') {
      const canAccess = await ResourceGuards.canOrganizerAccessHackathon(session.id, hackathonId);
      if (!canAccess) {
        return errorResponse('You are not authorized to view submissions for this hackathon.', 'FORBIDDEN_RESOURCE', 403);
      }
    }

    const submissions = await SubmissionRepository.listByHackathon(hackathonId);

    return successResponse({ submissions });
  } catch (error: any) {
    const status = error.status || 500;
    const code = error.code || 'INTERNAL_ERROR';
    return errorResponse(error.message, code, status);
  }
}
