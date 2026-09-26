import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireHackathonOrganizer } from '@/server/permissions/guards';
import { successResponse, errorResponse } from '@/lib/api/response';
import prisma from '@/lib/prisma';
import { AuditService } from '@/server/services/audit.service';

const updateJudgeSchema = z.object({
  isActive: z.boolean().optional(),
  maxWorkload: z.number().int().min(1).max(100).optional(),
  expertiseTracks: z.array(z.string()).optional(),
  conflictTeamIds: z.array(z.string()).optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; judgeId: string }> }
) {
  try {
    const { id: hackathonId, judgeId } = await params;
    await requireHackathonOrganizer(hackathonId);

    const judge = await prisma.judge.findUnique({
      where: { id: judgeId },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatarUrl: true,
          },
        },
        assignments: {
          include: {
            project: { select: { id: true, title: true } },
            evaluation: { select: { id: true, status: true, weightedScore: true } },
          },
        },
      },
    });

    if (!judge || judge.hackathonId !== hackathonId) {
      return errorResponse('Judge not found', 'NOT_FOUND', 404);
    }

    return successResponse({ judge });
  } catch (error: any) {
    const status = error.status || 500;
    const code = error.code || 'INTERNAL_ERROR';
    return errorResponse(error.message, code, status);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; judgeId: string }> }
) {
  try {
    const { id: hackathonId, judgeId } = await params;
    const session = await requireHackathonOrganizer(hackathonId);
    const body = await req.json();
    const parsed = updateJudgeSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse('Invalid judge update data', 'VALIDATION_ERROR', 422, parsed.error.format());
    }

    const existingJudge = await prisma.judge.findUnique({
      where: { id: judgeId },
    });

    if (!existingJudge || existingJudge.hackathonId !== hackathonId) {
      return errorResponse('Judge not found', 'NOT_FOUND', 404);
    }

    const updatedJudge = await prisma.judge.update({
      where: { id: judgeId },
      data: parsed.data,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    await AuditService.log({
      userId: session.id,
      hackathonId,
      action: 'JUDGE_UPDATED',
      entityType: 'Judge',
      entityId: judgeId,
      beforeState: { isActive: existingJudge.isActive, maxWorkload: existingJudge.maxWorkload },
      afterState: parsed.data,
    });

    return successResponse({ judge: updatedJudge }, 'Judge updated successfully');
  } catch (error: any) {
    const status = error.status || 500;
    const code = error.code || 'INTERNAL_ERROR';
    return errorResponse(error.message, code, status);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; judgeId: string }> }
) {
  try {
    const { id: hackathonId, judgeId } = await params;
    const session = await requireHackathonOrganizer(hackathonId);

    const existingJudge = await prisma.judge.findUnique({
      where: { id: judgeId },
    });

    if (!existingJudge || existingJudge.hackathonId !== hackathonId) {
      return errorResponse('Judge not found', 'NOT_FOUND', 404);
    }

    // Deactivate judge rather than cascading delete to preserve historical integrity
    const deactivated = await prisma.judge.update({
      where: { id: judgeId },
      data: { isActive: false },
    });

    await AuditService.log({
      userId: session.id,
      hackathonId,
      action: 'JUDGE_REMOVED',
      entityType: 'Judge',
      entityId: judgeId,
      afterState: { isActive: false },
    });

    return successResponse({ judge: deactivated }, 'Judge deactivated successfully');
  } catch (error: any) {
    const status = error.status || 500;
    const code = error.code || 'INTERNAL_ERROR';
    return errorResponse(error.message, code, status);
  }
}
