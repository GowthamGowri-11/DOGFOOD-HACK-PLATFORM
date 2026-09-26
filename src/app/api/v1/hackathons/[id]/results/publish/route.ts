import { NextRequest } from 'next/server';
import { requireHackathonOrganizer } from '@/server/permissions/guards';
import { ResultService } from '@/server/services/result.service';
import { successResponse, errorResponse } from '@/lib/api/response';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: hackathonId } = await params;
    const session = await requireHackathonOrganizer(hackathonId);

    const publication = await ResultService.publishResults(hackathonId, session.id);

    return successResponse(
      publication,
      'Official leaderboard and winner results published successfully to the public.'
    );
  } catch (error: any) {
    const status = error.status || 500;
    const code = error.code || 'INTERNAL_ERROR';
    return errorResponse(error.message, code, status);
  }
}
