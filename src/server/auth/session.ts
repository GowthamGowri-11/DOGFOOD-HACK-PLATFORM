import jwt from 'jsonwebtoken';
import { cookies, headers } from 'next/headers';
import { UserSession } from '@/types';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-fallback-secret-key-min-32-chars-hackathon';
const COOKIE_NAME = 'dogfood_session_token';

export function createSessionToken(payload: UserSession): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
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
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (token) {
      const session = verifySessionToken(token);
      if (session) return session;
    }
  } catch {
    // Ignore cookie retrieval error if context doesn't support it
  }

  try {
    const headerStore = await headers();
    const authHeader = headerStore.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7).trim();
      const session = verifySessionToken(token);
      if (session) return session;
    }
  } catch {
    // Ignore header retrieval error
  }

  return null;
}

export async function getCurrentUser(): Promise<UserSession | null> {
  return getSession();
}

export async function setSessionCookie(session: UserSession) {
  try {
    const token = createSessionToken(session);
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });
  } catch {
    // Ignore if not in a mutable cookie context
  }
}

export async function clearSessionCookie() {
  try {
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });
  } catch {
    // Ignore
  }
}
