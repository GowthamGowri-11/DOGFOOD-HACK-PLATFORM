import { NextRequest } from 'next/server';
import { requireAuth } from '@/server/permissions/guards';
import { TeamRepository } from '@/server/repositories/team.repository';
import { TeamInviteRepository } from '@/server/repositories/team-invite.repository';
import { TeamService } from '@/server/services/team.service';
import { successResponse, errorResponse } from '@/lib/api/response';

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();
    const [teams, pendingInvites] = await Promise.all([
      TeamRepository.listByUser(session.id),
      TeamInviteRepository.listPendingForUser(session.email, session.id),
    ]);

    const formattedTeams = teams.map((t) => {
      const readiness = TeamService.calculateReadiness(
        t.members.length,
        t.hackathon.minTeamSize,
        t.hackathon.maxTeamSize
      );
      return {
        ...t,
        readiness,
        isLeader: t.leaderId === session.id,
      };
    });

    return successResponse({
      teams: formattedTeams,
      pendingInvites,
    });
  } catch (error: any) {
    const status = error.status || 500;
    const code = error.code || 'INTERNAL_ERROR';
    return errorResponse(error.message, code, status);
  }
}
