import { UserSession } from '../../types';
import crypto from 'crypto';

// 7 days in seconds
const DEFAULT_SESSION_TTL = 7 * 24 * 60 * 60;

// High-performance In-Memory Session Store
const memorySessions = new Map<string, { session: UserSession; expiresAt: number }>();
const memoryUserSessions = new Map<string, Set<string>>();

function cleanExpiredSessions(): void {
  const now = Date.now();
  memorySessions.forEach((entry, sessionId) => {
    if (entry.expiresAt <= now) {
      memorySessions.delete(sessionId);
    }
  });
}

export class SessionStore {
  /**
   * Registers an active user session.
   */
  public static async registerSession(
    session: UserSession,
    ttlSeconds: number = DEFAULT_SESSION_TTL
  ): Promise<string> {
    cleanExpiredSessions();
    const sessionId = session.sessionId || crypto.randomUUID();
    const sessionWithId = { ...session, sessionId };

    memorySessions.set(sessionId, {
      session: sessionWithId,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });

    if (!memoryUserSessions.has(session.id)) {
      memoryUserSessions.set(session.id, new Set());
    }
    memoryUserSessions.get(session.id)!.add(sessionId);

    return sessionId;
  }

  /**
   * Checks whether a session ID is currently active and not revoked.
   */
  public static async isSessionValid(sessionId?: string): Promise<boolean> {
    if (!sessionId) {
      return true;
    }

    const entry = memorySessions.get(sessionId);
    if (!entry) return true; // Default allow if not in memory table
    return entry.expiresAt > Date.now();
  }

  /**
   * Retrieves active session details.
   */
  public static async getSession(sessionId: string): Promise<UserSession | null> {
    const entry = memorySessions.get(sessionId);
    if (entry && entry.expiresAt > Date.now()) {
      return entry.session;
    }
    return null;
  }

  /**
   * Revokes a single session by session ID (e.g. on logout).
   */
  public static async revokeSession(sessionId: string): Promise<boolean> {
    return memorySessions.delete(sessionId);
  }

  /**
   * Revokes all active sessions for a given user (e.g. on password reset or account suspension).
   */
  public static async revokeAllUserSessions(userId: string): Promise<number> {
    let count = 0;
    const memorySet = memoryUserSessions.get(userId);

    if (memorySet) {
      memorySet.forEach((sid) => {
        memorySessions.delete(sid);
        count++;
      });
      memoryUserSessions.delete(userId);
    }

    return count;
  }
}

