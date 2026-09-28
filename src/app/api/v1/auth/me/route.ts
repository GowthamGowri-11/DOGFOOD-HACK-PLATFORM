import { requireAuth } from '@/server/permissions/guards';
import { isAuthDisabled } from '@/server/auth/session';
import { UserRepository } from '@/server/repositories/user.repository';
import { successResponse, errorResponse } from '@/lib/api/response';

export async function GET() {
  try {
    const session = await requireAuth();

    // Verify user still exists and remains active in database
    const user = await UserRepository.findById(session.id);
    if (!user || !user.isActive) {
      if (isAuthDisabled()) {
        return successResponse({
          user: {
            id: session.id,
            name: session.fullName,
            email: session.email,
            role: session.role,
            status: session.status,
            avatarUrl: null,
            createdAt: new Date().toISOString(),
          },
        });
      }
      return errorResponse('Session is invalid or account is inactive', 'UNAUTHORIZED', 401);
    }

    return successResponse({
      user: {
        id: user.id,
        name: user.fullName,
        email: user.email,
        role: user.role,
        status: user.isActive ? 'ACTIVE' : 'INACTIVE',
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
      },
    });
  } catch (error: any) {
    const status = error.status || 401;
    const code = error.code || 'UNAUTHORIZED';
    return errorResponse(error.message || 'Unauthenticated', code, status);
  }
}
