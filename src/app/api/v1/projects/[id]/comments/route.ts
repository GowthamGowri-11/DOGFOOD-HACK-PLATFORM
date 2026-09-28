import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/server/permissions/guards';
import { getCurrentUser } from '@/server/auth/session';
import { successResponse, errorResponse } from '@/lib/api/response';
import prisma from '@/lib/prisma';
import { AuditService } from '@/server/services/audit.service';
import { eventBus } from '@/server/realtime/event-bus';
import { RealtimeRoomBuilder } from '@/server/realtime/event-types';

const createCommentSchema = z.object({
  content: z
    .string()
    .min(1, 'Comment cannot be empty')
    .max(1000, 'Comment exceeds maximum allowed length of 1000 characters')
    .transform((val) => val.trim()),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const session = await getCurrentUser();

    // Check project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { hackathon: { select: { organizerId: true } } },
    });

    if (!project) {
      return errorResponse('Project not found', 'NOT_FOUND', 404);
    }

    const isModerator =
      session && (session.role === 'ADMIN' || session.id === project.hackathon.organizerId);

    // Fetch comments (hide flagged comments from regular public users)
    const comments = await prisma.comment.findMany({
      where: {
        projectId,
        ...(isModerator ? {} : { isFlagged: false }),
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return successResponse({
      projectId,
      totalCount: comments.length,
      comments,
    });
  } catch (error: any) {
    const status = error.status || 500;
    const code = error.code || 'INTERNAL_ERROR';
    return errorResponse(error.message, code, status);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id: projectId } = await params;
    const body = await req.json();
    const parsed = createCommentSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse('Invalid comment payload', 'VALIDATION_ERROR', 422, parsed.error.format());
    }

    const { content } = parsed.data;

    // Check project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return errorResponse('Project not found', 'NOT_FOUND', 404);
    }

    // Sanitize against HTML / stored XSS tags
    const sanitizedContent = content
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

    const comment = await prisma.comment.create({
      data: {
        projectId,
        userId: session.id,
        content: sanitizedContent,
        isFlagged: false,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
            role: true,
          },
        },
      },
    });

    await AuditService.log({
      userId: session.id,
      hackathonId: project.hackathonId,
      action: 'COMMENT_CREATED',
      entityType: 'Comment',
      entityId: comment.id,
      afterState: { projectId, length: sanitizedContent.length },
    });

    await eventBus.publish({
      type: 'COMMENT_CREATED',
      hackathonId: project.hackathonId,
      projectId,
      userId: session.id,
      actorId: session.id,
      rooms: [
        RealtimeRoomBuilder.hackathon(project.hackathonId),
        RealtimeRoomBuilder.project(projectId),
      ],
      payload: {
        comment,
      },
    });

    return successResponse({ comment }, 'Comment posted successfully', 201);
  } catch (error: any) {
    const status = error.status || 500;
    const code = error.code || 'INTERNAL_ERROR';
    return errorResponse(error.message, code, status);
  }
}
