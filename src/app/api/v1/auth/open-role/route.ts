import { NextRequest } from 'next/server';
import {
  isAuthDisabled,
  isValidRole,
  setOpenAccessRole,
  getOpenAccessSessionForRole,
} from '@/server/auth/session';
import { successResponse, errorResponse } from '@/lib/api/response';
import { RoleType } from '@/types';

/**
 * Switch open-access persona when AUTH_DISABLED=true.
 * Keeps admin/organizer/judge/participant workspaces consistent with seed users.
 */
export async function POST(req: NextRequest) {
  try {
    if (!isAuthDisabled()) {
      return errorResponse('Open-role switch is only available when auth is disabled', 'FORBIDDEN', 403);
    }

    const body = await req.json().catch(() => ({}));
    const role = body.role as string;

    if (!isValidRole(role)) {
      return errorResponse('Invalid role. Use ADMIN, ORGANIZER, JUDGE, or PARTICIPANT', 'VALIDATION_ERROR', 422);
    }

    await setOpenAccessRole(role as RoleType);
    const user = getOpenAccessSessionForRole(role as RoleType);

    return successResponse({
      user: {
        id: user.id,
        name: user.fullName,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    }, `Switched to ${role} workspace identity`);
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to switch role', 'INTERNAL_ERROR', 500);
  }
}
