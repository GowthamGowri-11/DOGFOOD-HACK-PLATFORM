import { NextRequest } from 'next/server';
import { requireAuth } from '@/server/permissions/guards';
import { ResourceGuards } from '@/server/permissions/resource-guards';
import { SubmissionRepository } from '@/server/repositories/submission.repository';
import { SnapshotService } from '@/server/services/snapshot.service';
import { successResponse, errorResponse } from '@/lib/api/response';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth();
    const submissionId = params.id;

    const submission = await SubmissionRepository.findById(submissionId);
    if (!submission) {
      return errorResponse('Submission not found', 'NOT_FOUND', 404);
    }

    const isMember = submission.project.team.members.some((m) => m.userId === session.id);
    const isOrganizer = session.role === 'ORGANIZER' && (await ResourceGuards.canOrganizerAccessSubmission(session.id, submissionId));
    const isAdmin = session.role === 'ADMIN';

    if (!isMember && !isOrganizer && !isAdmin) {
      return errorResponse('You are not authorized to view this submission snapshot.', 'FORBIDDEN', 403);
    }

    const contentHash = SnapshotService.calculateContentHash(submission.payloadSnapshot as any);

    return successResponse({
      submission: {
        id: submission.id,
        projectId: submission.projectId,
        versionNumber: submission.versionNumber,
        status: submission.status,
        submittedAt: submission.submittedAt,
        lockedAt: submission.lockedAt,
        createdById: submission.createdById,
        contentHash,
        snapshot: submission.payloadSnapshot,
      },
    });
  } catch (error: any) {
    const status = error.status || 500;
    const code = error.code || 'INTERNAL_ERROR';
    return errorResponse(error.message, code, status);
  }
}
