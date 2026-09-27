import { NextRequest } from 'next/server';
import { requireAuth } from '@/server/permissions/guards';
import { SubmissionRepository } from '@/server/repositories/submission.repository';
import { SnapshotService } from '@/server/services/snapshot.service';
import { successResponse, errorResponse } from '@/lib/api/response';

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();
    const submissions = await SubmissionRepository.listByUser(session.id);

    const formatted = submissions.map((sub) => {
      const contentHash = sub.payloadSnapshot
        ? SnapshotService.calculateContentHash(sub.payloadSnapshot as any)
        : null;

      return {
        ...sub,
        contentHash,
      };
    });

    return successResponse({ submissions: formatted });
  } catch (error: any) {
    const status = error.status || 500;
    const code = error.code || 'INTERNAL_ERROR';
    return errorResponse(error.message, code, status);
  }
}
