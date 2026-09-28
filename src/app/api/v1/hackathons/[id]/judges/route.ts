import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireHackathonOrganizer } from '@/server/permissions/guards';
import { successResponse, errorResponse } from '@/lib/api/response';
import prisma from '@/lib/prisma';
import { AuditService } from '@/server/services/audit.service';
import { JudgeRepository } from '@/server/repositories/judge.repository';

const addJudgeSchema = z.object({
  userId: z.string().min(1).optional(),
  email: z.string().email().optional(),
  fullName: z.string().min(1).max(100).optional(),
  expertiseTracks: z.array(z.string()).default([]),
  maxWorkload: z.number().int().min(1).max(100).default(10),
  conflictTeamIds: z.array(z.string()).default([]),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: hackathonId } = await params;
    await requireHackathonOrganizer(hackathonId);

    const judges = await JudgeRepository.findJudgesByHackathon(hackathonId);

    return successResponse({ judges });
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
    const { id: hackathonId } = await params;
    const session = await requireHackathonOrganizer(hackathonId);
    const body = await req.json();
    const parsed = addJudgeSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse('Invalid judge data', 'VALIDATION_ERROR', 422, parsed.error.format());
    }

    const { userId, email, fullName, expertiseTracks, maxWorkload, conflictTeamIds } = parsed.data;

    if (!userId && !email) {
      return errorResponse('Either userId or email must be provided', 'VALIDATION_ERROR', 400);
    }

    const normalizedEmail = email ? email.trim().toLowerCase() : undefined;

    // Resolve target user or auto-provision invited judge
    let targetUser = await prisma.user.findFirst({
      where: userId ? { id: userId } : { email: normalizedEmail },
    });

    if (!targetUser && normalizedEmail) {
      const emailPrefix = normalizedEmail.split('@')[0];
      const derivedName = fullName?.trim() || emailPrefix
        .replace(/[._-]/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase());

      targetUser = await prisma.user.create({
        data: {
          email: normalizedEmail,
          fullName: derivedName || 'Expert Judge',
          passwordHash: '$2a$12$eX4mPLeH4sH.d0Gf00dH4ckP14tf0rmJvdg3', // safe initial hash
          role: 'JUDGE',
          isActive: true,
        },
      });
    }

    if (!targetUser) {
      return errorResponse('User not found to add as judge', 'USER_NOT_FOUND', 404);
    }

    // Automatically detect teams in this hackathon where user is a member (COI detection)
    const userTeamIds = await JudgeRepository.findUserTeamIdsInHackathon(targetUser.id, hackathonId);
    const mergedConflictTeams = Array.from(new Set([...conflictTeamIds, ...userTeamIds]));

    // Check if user is already a judge for this hackathon
    const existing = await prisma.judge.findUnique({
      where: {
        hackathonId_userId: {
          hackathonId,
          userId: targetUser.id,
        },
      },
    });

    if (existing) {
      return errorResponse('User is already configured as a judge for this hackathon', 'DUPLICATE_JUDGE', 409);
    }

    // Upsert or update role to JUDGE if currently PARTICIPANT
    if (targetUser.role === 'PARTICIPANT') {
      await prisma.user.update({
        where: { id: targetUser.id },
        data: { role: 'JUDGE' },
      });
    }

    const judge = await prisma.judge.create({
      data: {
        hackathonId,
        userId: targetUser.id,
        expertiseTracks,
        maxWorkload,
        conflictTeamIds: mergedConflictTeams,
        isActive: true,
      },
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
      action: 'JUDGE_ADDED',
      entityType: 'Judge',
      entityId: judge.id,
      afterState: { judgeUserId: targetUser.id, maxWorkload },
    });

    return successResponse({ judge }, 'Judge added successfully', 201);
  } catch (error: any) {
    const status = error.status || 500;
    const code = error.code || 'INTERNAL_ERROR';
    return errorResponse(error.message, code, status);
  }
}
