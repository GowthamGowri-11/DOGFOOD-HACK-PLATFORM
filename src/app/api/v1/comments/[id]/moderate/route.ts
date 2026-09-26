import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/server/permissions/guards';
import { ResourceGuards } from '@/server/permissions/resource-guards';
import { successResponse, errorResponse } from '@/lib/api/response';
import prisma from '@/lib/prisma';
import { AuditService } from '@/server/services/audit.service';

const moderateSchema = z.object({
  action: z.enum(['HIDE', 'RESTORE']),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id: commentId } = await params;
    const body = await req.json();
    const parsed = moderateSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse('Invalid moderation action. Must be HIDE or RESTORE.', 'VALIDATION_ERROR', 422);
    }

    const { action } = parsed.data;

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        project: { include: { hackathon: true } },
      },
    });

    if (!comment) {
      return errorResponse('Comment not found', 'NOT_FOUND', 404);
    }

    // Authorization: Must be hackathon organizer or admin
    const isOrganizer = await ResourceGuards.canOrganizerModerateComment(session.id, commentId);
    const isAdmin = session.role === 'ADMIN';

    if (!isOrganizer && !isAdmin) {
      return errorResponse(
        'Forbidden: You are not authorized to moderate comments in this hackathon.',
        'FORBIDDEN_MODERATION',
        403
      );
    }

    const isFlagged = action === 'HIDE';

    const updated = await prisma.comment.update({
      where: { id: commentId },
      data: { isFlagged },
    });

    await AuditService.log({
      userId: session.id,
      hackathonId: comment.project.hackathonId,
      action: action === 'HIDE' ? 'COMMENT_HIDDEN' : 'COMMENT_RESTORED',
      entityType: 'Comment',
      entityId: commentId,
      afterState: { isFlagged },
    });

    return successResponse(
      { commentId: updated.id, isFlagged: updated.isFlagged },
      `Comment successfully ${isFlagged ? 'hidden from public view' : 'restored to public view'}.`
    );
  } catch (error: any) {
    const status = error.status || 500;
    const code = error.code || 'INTERNAL_ERROR';
    return errorResponse(error.message, code, status);
  }
}
