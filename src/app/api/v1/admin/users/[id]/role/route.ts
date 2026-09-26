import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/server/permissions/guards';
import { UserRepository } from '@/server/repositories/user.repository';
import { successResponse, errorResponse } from '@/lib/api/response';
import { AuditService } from '@/server/services/audit.service';
import prisma from '@/lib/prisma';

const updateRoleSchema = z.object({
  role: z.enum(['ADMIN', 'ORGANIZER', 'JUDGE', 'PARTICIPANT']),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adminSession = await requireRole('ADMIN');
    const targetUserId = params.id;

    const body = await req.json();
    const parsed = updateRoleSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse('Invalid role provided', 'VALIDATION_ERROR', 422);
    }

    const targetUser = await UserRepository.findById(targetUserId);
    if (!targetUser) {
      return errorResponse('User not found', 'USER_NOT_FOUND', 404);
    }

    // Safety constraint: Prevent last-admin lockout
    if (targetUser.role === 'ADMIN' && parsed.data.role !== 'ADMIN') {
      const activeAdminCount = await prisma.user.count({
        where: { role: 'ADMIN', isActive: true },
      });
      if (activeAdminCount <= 1) {
        return errorResponse(
          'Cannot demote the last remaining active platform administrator.',
          'LAST_ADMIN_LOCKOUT_PREVENTED',
          400
        );
      }
    }

    const updated = await UserRepository.updateRole(targetUserId, parsed.data.role);

    await AuditService.log({
      userId: adminSession.id,
      action: 'ROLE_CHANGED',
      entityType: 'User',
      entityId: targetUserId,
      beforeState: { role: targetUser.role },
      afterState: { role: updated.role },
    });

    return successResponse(
      {
        user: {
          id: updated.id,
          email: updated.email,
          fullName: updated.fullName,
          role: updated.role,
        },
      },
      'User role updated successfully'
    );
  } catch (error: any) {
    const status = error.status || 500;
    const code = error.code || 'INTERNAL_ERROR';
    return errorResponse(error.message, code, status);
  }
}
