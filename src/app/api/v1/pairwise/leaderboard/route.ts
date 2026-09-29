import { NextRequest } from 'next/server';
import { BradleyTerryEngine } from '@/server/services/bradley-terry.engine';
import { successResponse, errorResponse } from '@/lib/api/response';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const hackathonId = searchParams.get('hackathonId') || 'hack_apex_2026';

    const rankings = BradleyTerryEngine.computeRankings(hackathonId);
    return successResponse({ rankings }, 'Bradley-Terry pairwise rankings computed successfully');
  } catch (err: any) {
    return errorResponse(err.message || 'Error computing rankings', 'PAIRWISE_LEADERBOARD_ERROR', 500);
  }
}
