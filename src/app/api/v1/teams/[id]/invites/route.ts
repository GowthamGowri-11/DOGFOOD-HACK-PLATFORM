import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/server/permissions/guards';
import { ResourceGuards } from '@/server/permissions/resource-guards';
import { TeamInviteRepository } from '@/server/repositories/team-invite.repository';
import { TeamService } from '@/server/services/team.service';
import { successResponse, errorResponse } from '@/lib/api/response';

const createInviteSchema = z.object({
  invitedEmail: z.string().email('Valid email is required'),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth();
    const teamId = params.id;

    const isMember = await ResourceGuards.canParticipantAccessTeam(session.id, teamId);
    const isOrganizer = session.role === 'ORGANIZER' && (await ResourceGuards.canOrganizerAccessTeam(session.id, teamId));
    const isAdmin = session.role === 'ADMIN';

    if (!isMember && !isOrganizer && !isAdmin) {
      return errorResponse('You are not authorized to view invites for this team.', 'FORBIDDEN', 403);
    }

    const invites = await TeamInviteRepository.listByTeam(teamId);
    return successResponse({ invites });
  } catch (error: any) {
    const status = error.status || 500;
    const code = error.code || 'INTERNAL_ERROR';
    return errorResponse(error.message, code, status);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth();
    const teamId = params.id;

    const isMember = await ResourceGuards.canParticipantAccessTeam(session.id, teamId);
    if (!isMember && session.role !== 'ADMIN') {
      return errorResponse('Only team members can invite teammates.', 'FORBIDDEN', 403);
    }

    const body = await req.json();
    const parsed = createInviteSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse('Invalid invite payload', 'VALIDATION_ERROR', 422, parsed.error.format());
    }

    const invite = await TeamService.createInvite({
      teamId,
      invitedById: session.id,
      invitedEmail: parsed.data.invitedEmail,
    });

    return successResponse({ invite }, 'Team invite generated successfully', 201);
  } catch (error: any) {
    const status = error.status || 500;
    const code = error.code || 'INTERNAL_ERROR';
    return errorResponse(error.message, code, status);
  }
}
