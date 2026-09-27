import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/server/permissions/guards';
import { TeamService } from '@/server/services/team.service';
import { TeamFormService } from '@/server/services/team-form.service';
import { TeamRepository } from '@/server/repositories/team.repository';
import { RegistrationRepository } from '@/server/repositories/registration.repository';
import { successResponse, errorResponse } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

const removeMemberSchema = z.object({
  userId: z.string().min(1, 'Target user ID is required'),
});

export async function GET(
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

    // Fetch custom answers for each member from their registration
    const membersWithResponses = await Promise.all(
      team.members.map(async (m) => {
        const reg = await RegistrationRepository.findByUserAndHackathon(m.userId, team.hackathonId);
        return {
          ...m,
          formResponse: reg?.customAnswers || null,
        };
      })
    );

    return successResponse({
      teamId: team.id,
      teamName: team.name,
      hackathonId: team.hackathonId,
      members: membersWithResponses,
    });
  } catch (error: any) {
    const status = error.status || 500;
    const code = error.code || 'INTERNAL_ERROR';
    return errorResponse(error.message || 'Failed to fetch team members', code, status);
  }
}

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
    const formResponse = body.formResponse || body;

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

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth();
    const teamId = params.id;

    const body = await req.json();
    const parsed = removeMemberSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse('Invalid payload', 'VALIDATION_ERROR', 422, parsed.error.format());
    }

    const result = await TeamService.removeMember({
      teamId,
      targetUserId: parsed.data.userId,
      actorUserId: session.id,
      actorRole: session.role,
    });

    return successResponse(
      result,
      result.disbanded ? 'Team disbanded as no members remain' : 'Member removed successfully'
    );
  } catch (error: any) {
    const status = error.status || 500;
    const code = error.code || 'INTERNAL_ERROR';
    return errorResponse(error.message, code, status);
  }
}
