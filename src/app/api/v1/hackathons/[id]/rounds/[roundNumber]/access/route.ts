import { NextRequest } from 'next/server';
import { requireAuth } from '@/server/permissions/guards';
import { RoundProgressionService } from '@/server/services/round-progression.service';
import { successResponse, errorResponse } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string; roundNumber: string } }
) {
  try {
    const session = await requireAuth();
    const hackathonId = params.id;
    const roundNumber = parseInt(params.roundNumber, 10) || 1;

    const access = await RoundProgressionService.checkTeamRoundAccess(
      session.id,
      hackathonId,
      roundNumber
    );

    if (!access.allowed) {
      return errorResponse(access.message, access.code, access.status as any, {
        highestRound: access.highestRound,
        progressionStatus: access.progressionStatus,
      });
    }

    return successResponse({
      allowed: true,
      highestRound: access.highestRound,
      progressionStatus: access.progressionStatus,
      teamId: access.team?.id,
      teamName: access.team?.name,
    });
  } catch (error: any) {
    const status = error.status || 500;
    const code = error.code || 'INTERNAL_ERROR';
    return errorResponse(error.message, code, status);
  }
}
