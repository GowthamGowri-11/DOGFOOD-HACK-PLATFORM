import { NextRequest } from 'next/server';
import { requireRole } from '@/server/permissions/guards';
import { EvaluationEditRepository } from '@/server/repositories/evaluation-edit.repository';
import { successResponse, errorResponse } from '@/lib/api/response';

export async function GET(req: NextRequest) {
  try {
    await requireRole(['ADMIN']);
    const { searchParams } = new URL(req.url);
    const hackathonId = searchParams.get('hackathonId') || undefined;
    const roundId = searchParams.get('roundId') || undefined;
    const status = (searchParams.get('status') as any) || undefined;
    const judgeUserId = searchParams.get('judgeUserId') || undefined;
    const search = searchParams.get('search') || undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 50;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!, 10) : 0;

    const result = await EvaluationEditRepository.listRequests({
      hackathonId,
      roundId,
      status,
      judgeUserId,
      search,
      limit,
      offset,
    });

    return successResponse(result);
  } catch (error: any) {
    const status = error.status || 500;
    const code = error.code || 'INTERNAL_ERROR';
    return errorResponse(error.message, code, status);
  }
}
