import { NextRequest } from 'next/server';
import { requireAuth } from '@/server/permissions/guards';
import { TeamFormService } from '@/server/services/team-form.service';
import { TeamRepository } from '@/server/repositories/team.repository';
import { successResponse, errorResponse } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth();
    const teamId = params.id;

    const team = await TeamRepository.findById(teamId);
    if (!team) {
      return errorResponse('Team not found', 'NOT_FOUND', 404);
    }

    const body = await req.json();
    const formResponse = body.formResponse || body.formResponses || body;

    const result = await TeamFormService.submitMemberForm({
      hackathonId: team.hackathonId,
      teamId,
      actorUserId: session.id,
      formResponse,
    });

    return successResponse(
      result,
      'Teammate added successfully to the squad!'
    );
  } catch (error: any) {
    const status = error.status || 500;
    const code = error.code || 'INTERNAL_ERROR';
    return errorResponse(error.message || 'Failed to add team member', code, status);
  }
}
