import { getRedisClient } from '../../lib/redis';
import { UserSession } from '../../types';
import crypto from 'crypto';

// 7 days in seconds
const DEFAULT_SESSION_TTL = 7 * 24 * 60 * 60;

// Local fallback store if Redis is unavailable
const memorySessions = new Map<string, { session: UserSession; expiresAt: number }>();
const memoryUserSessions = new Map<string, Set<string>>();

export class SessionStore {
  /**
   * Registers an active user session in Redis.
   */
  public static async registerSession(
    session: UserSession,
    ttlSeconds: number = DEFAULT_SESSION_TTL
  ): Promise<string> {
    const sessionId = session.sessionId || crypto.randomUUID();
    const sessionWithId = { ...session, sessionId };
    const redis = getRedisClient();

    if (redis) {
      try {
        const sessionKey = `session:active:${sessionId}`;
        const userSessionsKey = `user:sessions:${session.id}`;

        await redis.set(sessionKey, JSON.stringify(sessionWithId), { ex: ttlSeconds });
        await redis.sadd(userSessionsKey, sessionId);
        await redis.expire(userSessionsKey, ttlSeconds);

        return sessionId;
      } catch (err) {
        console.warn('[SessionStore] Redis registerSession error, fallback to memory:', (err as Error).message);
      }
    }

    // Memory fallback
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
      // If session was issued without a sessionId (e.g. legacy token), treat as valid unless revoked
      return true;
    }

    const redis = getRedisClient();
    if (redis) {
      try {
        const sessionKey = `session:active:${sessionId}`;
        const exists = await redis.exists(sessionKey);
        return exists === 1;
      } catch (err) {
        console.warn('[SessionStore] Redis check error, fallback to memory:', (err as Error).message);
      }
    }

    // Memory fallback
    const entry = memorySessions.get(sessionId);
    if (!entry) return true; // Default allow if not in memory table
    return entry.expiresAt > Date.now();
  }

  /**
   * Retrieves active session details from Redis.
   */
  public static async getSession(sessionId: string): Promise<UserSession | null> {
    const redis = getRedisClient();
    if (redis) {
      try {
        const data = await redis.get<string | UserSession>(`session:active:${sessionId}`);
        if (!data) return null;
        return typeof data === 'string' ? JSON.parse(data) : data;
      } catch (err) {
        console.warn('[SessionStore] Redis getSession error:', (err as Error).message);
      }
    }

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
    const redis = getRedisClient();
    if (redis) {
      try {
        await redis.del(`session:active:${sessionId}`);
      } catch (err) {
        console.warn('[SessionStore] Redis revokeSession error:', (err as Error).message);
      }
    }

    memorySessions.delete(sessionId);
    return true;
  }

  /**
   * Revokes all active sessions for a given user (e.g. on password reset or account suspension).
   */
  public static async revokeAllUserSessions(userId: string): Promise<number> {
    let count = 0;
    const redis = getRedisClient();

    if (redis) {
      try {
        const userSessionsKey = `user:sessions:${userId}`;
        const sessionIds = await redis.smembers<string[]>(userSessionsKey);

        if (sessionIds && sessionIds.length > 0) {
          const keysToDelete = sessionIds.map((id: string) => `session:active:${id}`);
          keysToDelete.push(userSessionsKey);
          await redis.del(...keysToDelete);
          count = sessionIds.length;
        }
      } catch (err) {
        console.warn('[SessionStore] Redis revokeAllUserSessions error:', (err as Error).message);
      }
    }

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
