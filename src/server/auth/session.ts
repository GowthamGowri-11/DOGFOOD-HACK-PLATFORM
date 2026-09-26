import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
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
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function getCurrentUser(): Promise<UserSession | null> {
  return getSession();
}

export async function setSessionCookie(session: UserSession) {
  const token = createSessionToken(session);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
}
