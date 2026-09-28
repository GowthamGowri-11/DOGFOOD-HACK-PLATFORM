import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/server/permissions/guards';
import { UserRepository } from '@/server/repositories/user.repository';
import { successResponse, errorResponse } from '@/lib/api/response';
import { AuditService } from '@/server/services/audit.service';
import prisma from '@/lib/prisma';

const updateStatusSchema = z.object({
  isActive: z.boolean(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adminSession = await requireRole('ADMIN');
    const targetUserId = params.id;

    const body = await req.json();
    const parsed = updateStatusSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse('Invalid status boolean provided', 'VALIDATION_ERROR', 422);
    }

    const targetUser = await UserRepository.findById(targetUserId);
    if (!targetUser) {
      return errorResponse('User not found', 'USER_NOT_FOUND', 404);
    }

    // Safety constraint: Prevent last-admin lockout via deactivation
    if (targetUser.role === 'ADMIN' && !parsed.data.isActive) {
      const activeAdminCount = await prisma.user.count({
        where: { role: 'ADMIN', isActive: true },
      });
      if (activeAdminCount <= 1) {
        return errorResponse(
          'Cannot deactivate the last remaining active platform administrator.',
          'LAST_ADMIN_LOCKOUT_PREVENTED',
          400
        );
      }
    }

    const updated = await UserRepository.updateStatus(targetUserId, parsed.data.isActive);

    // If account was suspended, revoke all active sessions across all devices immediately
    if (!parsed.data.isActive) {
      const { SessionStore } = await import('@/server/auth/session-store');
      await SessionStore.revokeAllUserSessions(targetUserId);
    }

    await AuditService.log({
      userId: adminSession.id,
      action: parsed.data.isActive ? 'USER_ENABLED' : 'USER_SUSPENDED',
      entityType: 'User',
      entityId: targetUserId,
      beforeState: { isActive: targetUser.isActive },
      afterState: { isActive: updated.isActive },
    });

    return successResponse(
      {
        user: {
          id: updated.id,
          email: updated.email,
          fullName: updated.fullName,
          role: updated.role,
          status: updated.isActive ? 'ACTIVE' : 'INACTIVE',
        },
      },
      `User account ${updated.isActive ? 'activated' : 'suspended'} successfully`
    );
  } catch (error: any) {
    const status = error.status || 500;
    const code = error.code || 'INTERNAL_ERROR';
    return errorResponse(error.message, code, status);
  }
}
