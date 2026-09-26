import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/server/permissions/guards';
import { ResourceGuards } from '@/server/permissions/resource-guards';
import { TeamRepository } from '@/server/repositories/team.repository';
import { TeamService } from '@/server/services/team.service';
import { successResponse, errorResponse } from '@/lib/api/response';

const updateTeamSchema = z.object({
  name: z.string().min(2).max(50).optional(),
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

    const readiness = TeamService.calculateReadiness(
      team.members.length,
      team.hackathon.minTeamSize,
      team.hackathon.maxTeamSize
    );

    const isMember = team.members.some((m) => m.userId === session.id);
    const isLeader = team.leaderId === session.id;

    return successResponse({
      team,
      readiness,
      isMember,
      isLeader,
    });
  } catch (error: any) {
    const status = error.status || 500;
    const code = error.code || 'INTERNAL_ERROR';
    return errorResponse(error.message, code, status);
  }
}

export async function PATCH(
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

    const isLeader = team.leaderId === session.id;
    const isAdmin = session.role === 'ADMIN';

    if (!isLeader && !isAdmin) {
      return errorResponse('Only the team leader or an admin can update the team.', 'FORBIDDEN', 403);
    }

    const body = await req.json();
    const parsed = updateTeamSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse('Invalid team update payload', 'VALIDATION_ERROR', 422, parsed.error.format());
    }

    if (parsed.data.name) {
      const nameExists = await TeamRepository.checkNameExists(team.hackathon.id, parsed.data.name, teamId);
      if (nameExists) {
        return errorResponse('A team with this name already exists in the hackathon.', 'TEAM_NAME_TAKEN', 409);
      }
    }

    const updated = await TeamRepository.update(teamId, { name: parsed.data.name });
    return successResponse({ team: updated }, 'Team updated successfully');
  } catch (error: any) {
    const status = error.status || 500;
    const code = error.code || 'INTERNAL_ERROR';
    return errorResponse(error.message, code, status);
  }
}

export async function DELETE(
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

    const isLeader = team.leaderId === session.id;
    const isAdmin = session.role === 'ADMIN';
    const isOrganizer = session.role === 'ORGANIZER' && (await ResourceGuards.canOrganizerAccessTeam(session.id, teamId));

    if (!isLeader && !isAdmin && !isOrganizer) {
      return errorResponse('You are not authorized to delete/disband this team.', 'FORBIDDEN', 403);
    }

    await TeamRepository.delete(teamId);
    return successResponse(null, 'Team disbanded successfully');
  } catch (error: any) {
    const status = error.status || 500;
    const code = error.code || 'INTERNAL_ERROR';
    return errorResponse(error.message, code, status);
  }
}
