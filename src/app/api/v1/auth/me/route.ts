import { getSession, isAuthDisabled } from '@/server/auth/session';
import { UserRepository } from '@/server/repositories/user.repository';
import { successResponse } from '@/lib/api/response';

// In-memory fast cache to avoid repeated remote database latency on every route transition
const USER_CACHE = new Map<string, { user: any; expiresAt: number }>();
const CACHE_TTL_MS = 60 * 1000; // 60 seconds

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

    // Check fast memory cache
    const now = Date.now();
    const cached = USER_CACHE.get(session.id);
    if (cached && cached.expiresAt > now) {
      return successResponse({ user: cached.user });
    }

    // Fast DB verification with 800ms race timeout, fallback directly to session
    let user: any = null;
    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('DB_TIMEOUT')), 800)
      );
      user = await Promise.race([
        UserRepository.findById(session.id),
        timeoutPromise,
      ]);
    } catch {
      // Fallback silently to session payload
    }

    if (user) {
      if (!user.isActive) {
        USER_CACHE.delete(session.id);
        return Response.json(
          { success: false, data: null, authenticated: false },
          { status: 200 }
        );
      }

      const userData = {
        id: user.id,
        name: user.fullName,
        email: user.email,
        role: user.role,
        status: user.isActive ? 'ACTIVE' : 'INACTIVE',
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
      };

      USER_CACHE.set(session.id, { user: userData, expiresAt: now + CACHE_TTL_MS });

      return successResponse({ user: userData });
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


