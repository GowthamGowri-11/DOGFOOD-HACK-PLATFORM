import { NextRequest } from 'next/server';
import { requireAuth } from '@/server/permissions/guards';
import { BradleyTerryEngine } from '@/server/services/bradley-terry.engine';
import { successResponse, errorResponse } from '@/lib/api/response';

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(req.url);
    const hackathonId = searchParams.get('hackathonId') || 'hack_apex_2026';

    const matchup = await BradleyTerryEngine.getNextMatchup(session.id, hackathonId);
    return successResponse(matchup, 'Pairwise matchup generated successfully');
  } catch (err: any) {
    return errorResponse(err.message || 'Error generating matchup', 'MATCHUP_ERROR', err.status || 500);
  }
}
