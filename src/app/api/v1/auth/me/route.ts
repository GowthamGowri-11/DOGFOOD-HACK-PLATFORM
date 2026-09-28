import { getSession, isAuthDisabled } from '@/server/auth/session';
import { UserRepository } from '@/server/repositories/user.repository';
import { successResponse } from '@/lib/api/response';

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

    if (isAuthDisabled()) {
      return successResponse({
        user: {
          id: session.id,
          name: session.fullName,
          email: session.email,
          role: session.role,
          status: session.status || 'ACTIVE',
          avatarUrl: session.avatarUrl || null,
          createdAt: new Date().toISOString(),
        },
      });
    }

    // Verify user in database with timeout, or fallback to session
    let user: any = null;
    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('DB_TIMEOUT')), 3000)
      );
      user = await Promise.race([
        UserRepository.findById(session.id),
        timeoutPromise,
      ]);
    } catch (dbErr) {
      console.warn('[auth/me] DB lookup timed out or failed, using session cache:', dbErr);
    }

    if (user) {
      if (!user.isActive) {
        return Response.json(
          { success: false, data: null, authenticated: false },
          { status: 200 }
        );
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
    }

    // Resilient fallback using session payload
    return successResponse({
      user: {
        id: session.id,
        name: session.fullName,
        email: session.email,
        role: session.role,
        status: session.status || 'ACTIVE',
        avatarUrl: session.avatarUrl,
        createdAt: new Date().toISOString(),
      },
    });
  } catch {
    return Response.json(
      { success: false, data: null, authenticated: false },
      { status: 200 }
    );
  }
}


