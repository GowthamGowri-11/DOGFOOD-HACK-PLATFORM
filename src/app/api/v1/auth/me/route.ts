<<<<<<< HEAD
import { requireAuth } from '@/server/permissions/guards';
import { isAuthDisabled } from '@/server/auth/session';
=======
import { getSession } from '@/server/auth/session';
>>>>>>> 955df85a1823fdc70d72489433820b8abade5940
import { UserRepository } from '@/server/repositories/user.repository';
import { successResponse, errorResponse } from '@/lib/api/response';

export async function GET() {
  try {
    const session = await getSession();

    // No session — return 200 with authenticated: false (not a 401 error)
    if (!session) {
      return Response.json(
        { success: false, data: null, authenticated: false },
        { status: 200 }
      );
    }

    // Verify user still exists and remains active in database
    const user = await UserRepository.findById(session.id);
    if (!user || !user.isActive) {
<<<<<<< HEAD
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
=======
      return Response.json(
        { success: false, data: null, authenticated: false },
        { status: 200 }
      );
>>>>>>> 955df85a1823fdc70d72489433820b8abade5940
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
  } catch {
    return Response.json(
      { success: false, data: null, authenticated: false },
      { status: 200 }
    );
  }
}
