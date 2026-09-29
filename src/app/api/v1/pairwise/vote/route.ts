import { NextRequest } from 'next/server';
import { requireAuth } from '@/server/permissions/guards';
import { BradleyTerryEngine } from '@/server/services/bradley-terry.engine';
import { successResponse, errorResponse } from '@/lib/api/response';

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await req.json();
    const { hackathonId, projectAId, projectBId, winnerId } = body;

    if (!projectAId || !projectBId || !winnerId) {
      return errorResponse('projectAId, projectBId, and winnerId are required.', 'VALIDATION_ERROR', 400);
    }

    const recorded = await BradleyTerryEngine.recordComparison({
      judgeId: session.id,
      hackathonId: hackathonId || 'hack_apex_2026',
      projectAId,
      projectBId,
      winnerId,
    });

    return successResponse(recorded, 'Pairwise decision recorded successfully');
  } catch (err: any) {
    return errorResponse(err.message || 'Error recording vote', 'PAIRWISE_ERROR', err.status || 500);
  }
}
