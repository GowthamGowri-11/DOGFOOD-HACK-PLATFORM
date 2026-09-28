import { NextRequest } from 'next/server';
import { HackathonRepository } from '@/server/repositories/hackathon.repository';
import { SubmissionWindowService } from '@/server/services/submission-window.service';
import { successResponse, errorResponse } from '@/lib/api/response';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const hackathon = await HackathonRepository.findById(params.id);
    if (!hackathon) {
      return errorResponse('Hackathon not found', 'NOT_FOUND', 404);
    }

    const windowInfo = SubmissionWindowService.getSubmissionWindowDetails(hackathon);

    return successResponse({
      status: windowInfo.status,
      submissionOpensAt: windowInfo.opensAt,
      submissionDeadline: windowInfo.deadline,
      serverTime: windowInfo.serverTime,
      submissionWindow: windowInfo,
    });
  } catch (error: any) {
    const status = error.status || 500;
    const code = error.code || 'INTERNAL_ERROR';
    return errorResponse(error.message, code, status);
  }
}
