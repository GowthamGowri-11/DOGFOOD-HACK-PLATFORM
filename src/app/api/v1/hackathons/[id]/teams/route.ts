import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/server/auth/session';
import { requireAuth, requireRole } from '@/server/permissions/guards';
import { TeamRepository } from '@/server/repositories/team.repository';
import { TeamService } from '@/server/services/team.service';
import { successResponse, errorResponse } from '@/lib/api/response';

const createTeamSchema = z.object({
  name: z.string().min(2, 'Team name must be at least 2 characters').max(50, 'Team name cannot exceed 50 characters'),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    const hackathonId = params.id;
    const { searchParams } = new URL(req.url);
    const my = searchParams.get('my') === 'true';

    if (my) {
      if (!session) {
        return successResponse({ team: null, readiness: null });
      }
      const team = await TeamRepository.findByHackathonAndUser(hackathonId, session.id);
      if (!team) {
        return successResponse({ team: null, readiness: null });
      }
      const readiness = TeamService.calculateReadiness(
        team.members.length,
        team.hackathon.minTeamSize,
        team.hackathon.maxTeamSize
      );
      return successResponse({ team, readiness });
    }

    const teams = await TeamRepository.listByHackathon(hackathonId);
    return successResponse({ teams });
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
    const session = await requireRole(['PARTICIPANT', 'ORGANIZER', 'ADMIN']);
    const hackathonId = params.id;

    const body = await req.json();
    const parsed = createTeamSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse('Invalid team payload', 'VALIDATION_ERROR', 422, parsed.error.format());
    }

    const team = await TeamService.createTeam({
      hackathonId,
      userId: session.id,
      name: parsed.data.name,
    });

    const readiness = TeamService.calculateReadiness(
      team.members.length,
      team.hackathon.minTeamSize,
      team.hackathon.maxTeamSize
    );

    return successResponse({ team, readiness }, 'Team created successfully', 201);
  } catch (error: any) {
    const status = error.status || 500;
    const code = error.code || 'INTERNAL_ERROR';
    return errorResponse(error.message, code, status);
  }
}
