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
    await requireHackathonOrganizer(hackathonId);

    const report = await ResultService.verifyResults(hackathonId);

    return successResponse(
      { verificationReport: report },
      report.isVerified
        ? 'Results mathematically and structurally verified. Ready for publication.'
        : 'Result verification flagged anomalies.'
    );
  } catch (error: any) {
    const status = error.status || 500;
    const code = error.code || 'INTERNAL_ERROR';
    return errorResponse(error.message, code, status);
  }
}
