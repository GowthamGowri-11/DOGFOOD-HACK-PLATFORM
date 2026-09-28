import { NextRequest } from 'next/server';
import { requireRole } from '@/server/permissions/guards';
import { ResourceGuards } from '@/server/permissions/resource-guards';
import { RoundProgressionService } from '@/server/services/round-progression.service';
import { successResponse, errorResponse } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; roundNumber: string } }
) {
  try {
    const session = await requireRole(['ADMIN', 'ORGANIZER']);
    const hackathonId = params.id;
    const roundNumber = parseInt(params.roundNumber, 10);

    if (isNaN(roundNumber) || roundNumber < 1) {
      return errorResponse('Invalid round number. Must be >= 1.', 'INVALID_ROUND', 400);
    }

    if (session.role === 'ORGANIZER') {
      const canAccess = await ResourceGuards.canOrganizerAccessHackathon(session.id, hackathonId);
      if (!canAccess) {
        return errorResponse('You are not authorized to manage this hackathon', 'FORBIDDEN_RESOURCE', 403);
      }
    }

    let options = {};
    try {
      options = await req.json();
    } catch {
      // Body may be empty
    }

    const result = await RoundProgressionService.finalizeRoundResults(
      hackathonId,
      roundNumber,
      session.id,
      options
    );

    return successResponse(
      result,
      `Round ${roundNumber} results finalized successfully. ${result.selectedTeamsCount} teams advanced, ${result.eliminatedTeamsCount} teams eliminated.`,
      200
    );
  } catch (error: any) {
    const status = error.status || 500;
    const code = error.code || 'INTERNAL_ERROR';
    return errorResponse(error.message, code, status, error.details);
  }
}
