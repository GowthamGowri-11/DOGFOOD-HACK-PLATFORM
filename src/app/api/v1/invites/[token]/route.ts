import { NextRequest } from 'next/server';
import { requireAuth } from '@/server/permissions/guards';
import { TeamInviteRepository } from '@/server/repositories/team-invite.repository';
import { TeamService } from '@/server/services/team.service';
import { successResponse, errorResponse } from '@/lib/api/response';

export async function GET(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const invite = await TeamInviteRepository.findByToken(params.token);
    if (!invite) {
      return errorResponse('Invitation not found or invalid token', 'NOT_FOUND', 404);
    }

    const isExpired = new Date() > new Date(invite.expiresAt);

    return successResponse({
      invite: {
        id: invite.id,
        teamName: invite.team.name,
        hackathonTitle: invite.team.hackathon.title,
        hackathonSlug: invite.team.hackathon.slug,
        invitedBy: invite.invitedBy.fullName,
        memberCount: invite.team.members.length,
        maxTeamSize: invite.team.hackathon.maxTeamSize,
        status: isExpired ? 'EXPIRED' : invite.status,
        expiresAt: invite.expiresAt,
      },
    });
  } catch (error: any) {
    const status = error.status || 500;
    const code = error.code || 'INTERNAL_ERROR';
    return errorResponse(error.message, code, status);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const session = await requireAuth();
    const team = await TeamService.acceptInviteToken(session.id, params.token);

    return successResponse({ team }, 'Invitation accepted! You have joined the team.');
  } catch (error: any) {
    const status = error.status || 500;
    const code = error.code || 'INTERNAL_ERROR';
    return errorResponse(error.message, code, status);
  }
}
