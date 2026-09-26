import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/server/permissions/guards';
import { ResourceGuards } from '@/server/permissions/resource-guards';
import { successResponse, errorResponse } from '@/lib/api/response';
import prisma from '@/lib/prisma';
import { AuditService } from '@/server/services/audit.service';

const updateCommentSchema = z.object({
  content: z
    .string()
    .min(1, 'Comment cannot be empty')
    .max(1000, 'Comment exceeds maximum allowed length of 1000 characters')
    .transform((val) => val.trim()),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id: commentId } = await params;
    const body = await req.json();
    const parsed = updateCommentSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse('Invalid comment data', 'VALIDATION_ERROR', 422, parsed.error.format());
    }

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      return errorResponse('Comment not found', 'NOT_FOUND', 404);
    }

    // STRICT OWNERSHIP CHECK: User can only edit their own comment
    if (comment.userId !== session.id) {
      return errorResponse(
        'Forbidden: You can only edit your own comments.',
        'FORBIDDEN_COMMENT_EDIT',
        403
      );
    }

    const sanitizedContent = parsed.data.content
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

    const updated = await prisma.comment.update({
      where: { id: commentId },
      data: { content: sanitizedContent },
      include: {
        user: { select: { id: true, fullName: true, avatarUrl: true } },
      },
    });

    await AuditService.log({
      userId: session.id,
      action: 'COMMENT_UPDATED',
      entityType: 'Comment',
      entityId: commentId,
      afterState: { length: sanitizedContent.length },
    });

    return successResponse({ comment: updated }, 'Comment updated successfully');
  } catch (error: any) {
    const status = error.status || 500;
    const code = error.code || 'INTERNAL_ERROR';
    return errorResponse(error.message, code, status);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id: commentId } = await params;

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        project: { include: { hackathon: { select: { organizerId: true } } } },
      },
    });

    if (!comment) {
      return errorResponse('Comment not found', 'NOT_FOUND', 404);
    }

    // Authorization: Either comment author OR hackathon organizer OR platform admin can delete
    const isAuthor = comment.userId === session.id;
    const isOrganizer = session.id === comment.project.hackathon.organizerId;
    const isAdmin = session.role === 'ADMIN';

    if (!isAuthor && !isOrganizer && !isAdmin) {
      return errorResponse(
        'Forbidden: You are not authorized to delete this comment.',
        'FORBIDDEN_COMMENT_DELETE',
        403
      );
    }

    await prisma.comment.delete({
      where: { id: commentId },
    });

    await AuditService.log({
      userId: session.id,
      action: 'COMMENT_DELETED',
      entityType: 'Comment',
      entityId: commentId,
      beforeState: { deletedBy: session.role },
    });

    return successResponse(
      { commentId },
      'Comment deleted successfully'
    );
  } catch (error: any) {
    const status = error.status || 500;
    const code = error.code || 'INTERNAL_ERROR';
    return errorResponse(error.message, code, status);
  }
}
