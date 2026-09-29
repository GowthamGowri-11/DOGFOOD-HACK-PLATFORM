import { NextRequest } from 'next/server';
import { requireAuth } from '@/server/permissions/guards';
import { JudgeRecordService } from '@/server/services/judge-record.service';
import { successResponse, errorResponse } from '@/lib/api/response';

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(req.url);
    const hackathonId = searchParams.get('hackathonId') || 'hack_apex_2026';

    const record = await JudgeRecordService.getOrMintJudgeRecord(session.id, hackathonId);
    return successResponse(record, 'Judge participation credential retrieved successfully');
  } catch (err: any) {
    return errorResponse(err.message || 'Unauthorized', 'JUDGE_CREDENTIAL_ERROR', err.status || 401);
  }
}
