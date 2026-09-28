import jwt from 'jsonwebtoken';
import { cookies, headers } from 'next/headers';
import crypto from 'crypto';
import { RoleType, UserSession } from '@/types';
import { SessionStore } from './session-store';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-fallback-secret-key-min-32-chars-hackathon';
const COOKIE_NAME = 'dogfood_session_token';
export const OPEN_ROLE_COOKIE = 'dogfood_open_role';

/** When true, all routes run without login — identity follows workspace role. */
export function isAuthDisabled(): boolean {
  return process.env.AUTH_DISABLED === 'true' || process.env.NEXT_PUBLIC_AUTH_DISABLED === 'true';
}

/** Seed personas so each workspace sees consistent data (not one fixed admin). */
export const OPEN_ACCESS_PERSONAS: Record<RoleType, UserSession> = {
  ADMIN: {
    id: 'usr_admin_001',
    email: 'admin@hackathon.dev',
    role: 'ADMIN',
    fullName: 'Platform Administrator',
    status: 'ACTIVE',
  },
  ORGANIZER: {
    id: 'usr_organizer_001',
    email: 'organizer@hackathon.dev',
    role: 'ORGANIZER',
    fullName: 'Apex Event Lead',
    status: 'ACTIVE',
  },
  JUDGE: {
    id: 'usr_judge_001',
    email: 'judge.alpha@hackathon.dev',
    role: 'JUDGE',
    fullName: 'Dr. Sarah Chen (Judge A)',
    status: 'ACTIVE',
  },
  PARTICIPANT: {
    id: 'usr_participant_001',
    email: 'alice.hacker@hackathon.dev',
    role: 'PARTICIPANT',
    fullName: 'Alice Hacker (Team Lead)',
    status: 'ACTIVE',
  },
};

export const OPEN_ACCESS_SESSION = OPEN_ACCESS_PERSONAS.ADMIN;

export function isValidRole(role: string | undefined | null): role is RoleType {
  return role === 'ADMIN' || role === 'ORGANIZER' || role === 'JUDGE' || role === 'PARTICIPANT';
}

export function getOpenAccessSessionForRole(role: RoleType): UserSession {
  return OPEN_ACCESS_PERSONAS[role] || OPEN_ACCESS_PERSONAS.ADMIN;
}

/**
 * Resolves session expiry duration in seconds from SESSION_EXPIRY env var (e.g. '7d', '24h', '30m', '86400').
 * Defaults to 7 days (604,800 seconds).
 */
export function getSessionExpirySeconds(): number {
  const envExpiry = process.env.SESSION_EXPIRY || '7d';
  const match = envExpiry.trim().match(/^(\d+)([dhms]?)$/i);
  if (!match) return 7 * 24 * 60 * 60;

  const value = parseInt(match[1], 10);
  const unit = match[2]?.toLowerCase();

  switch (unit) {
    case 'd':
      return value * 24 * 60 * 60;
    case 'h':
      return value * 60 * 60;
    case 'm':
      return value * 60;
    case 's':
      return value;
    default:
      return value;
  }
}

export function createSessionToken(payload: UserSession): string {
  const sessionPayload = {
    ...payload,
    sessionId: payload.sessionId || crypto.randomUUID(),
  };
  const expirySeconds = getSessionExpirySeconds();
  return jwt.sign(sessionPayload, JWT_SECRET, { expiresIn: expirySeconds });
}

export function verifySessionToken(token: string): UserSession | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as UserSession;
    if (!decoded || !decoded.id || !decoded.role) {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<UserSession | null> {
  if (isAuthDisabled()) {
    try {
      const cookieStore = await cookies();
      const roleCookie = cookieStore.get(OPEN_ROLE_COOKIE)?.value;
      const role: RoleType = isValidRole(roleCookie) ? roleCookie : 'ADMIN';
      return getOpenAccessSessionForRole(role);
    } catch {
      return OPEN_ACCESS_SESSION;
    }
  }

  let token: string | undefined;

  try {
    const cookieStore = await cookies();
    token = cookieStore.get(COOKIE_NAME)?.value;
  } catch {
    // Ignore cookie retrieval error
  }

  if (!token) {
    try {
      const headerStore = await headers();
      const authHeader = headerStore.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.slice(7).trim();
      }
    } catch {
      // Ignore header retrieval error
    }
  }

  if (!token) return null;

  const decoded = verifySessionToken(token);
  if (!decoded) return null;

  // Validate session against Redis session store (supports real-time revocation)
  if (decoded.sessionId) {
    try {
      const isValid = await SessionStore.isSessionValid(decoded.sessionId);
      if (!isValid) {
        return null;
      }
    } catch {
      // Redis offline/skipped: allow valid JWT signature
    }
  }

  return decoded;
}

export async function getCurrentUser(): Promise<UserSession | null> {
  return getSession();
}

export async function setOpenAccessRole(role: RoleType) {
  try {
    const cookieStore = await cookies();
    cookieStore.set(OPEN_ROLE_COOKIE, role, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    });
  } catch {
    // Ignore
  }
}

export async function setSessionCookie(session: UserSession) {
  if (isAuthDisabled()) {
    await setOpenAccessRole(session.role);
    return;
  }

  const sessionId = session.sessionId || crypto.randomUUID();
  const sessionWithId = { ...session, sessionId };
  const expirySeconds = getSessionExpirySeconds();

  // Register in Redis Session Store with synchronized TTL
  try {
    await SessionStore.registerSession(sessionWithId, expirySeconds);
  } catch {
    // Redis optional fallback
  }

  const token = createSessionToken(sessionWithId);
  try {
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: expirySeconds,
      path: '/',
    });
  } catch {
    // Ignore if not mutable context
  }
}

export async function clearSessionCookie() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    if (token) {
      const decoded = verifySessionToken(token);
      if (decoded?.sessionId) {
        await SessionStore.revokeSession(decoded.sessionId).catch(() => {});
      }
    }

    cookieStore.set(COOKIE_NAME, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });
    cookieStore.set(OPEN_ROLE_COOKIE, '', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });
  } catch {
    // Ignore
  }
}

