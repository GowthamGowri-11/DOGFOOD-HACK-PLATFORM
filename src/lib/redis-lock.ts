import { getRedisClient } from './redis';
import crypto from 'crypto';

// In-memory fallback mutex locks
const localLocks = new Map<string, { token: string; expiresAt: number }>();

/**
 * Distributed Lock Utility using Redis SET with NX and EX.
 * Safe fallback to process-local locks when Redis is unavailable.
 */
export class DistributedLock {
  /**
   * Attempts to acquire a lock on a key.
   * @param key Lock identifier (e.g. `lock:results:generate:${hackathonId}`)
   * @param ttlSeconds Lock timeout in seconds (default 30s)
   * @returns lock token if acquired, or null if already held
   */
  public static async acquire(key: string, ttlSeconds = 30): Promise<string | null> {
    const token = crypto.randomUUID();
    const redis = getRedisClient();

    if (redis) {
      try {
        // SET key token EX ttl NX
        const result = await redis.set(key, token, {
          nx: true,
          ex: ttlSeconds,
        });

        if (result === 'OK') {
          return token;
        }
        return null;
      } catch (err) {
        console.warn(`[Lock] Redis acquire failed for "${key}", falling back to local:`, (err as Error).message);
      }
    }

    // Local fallback
    const now = Date.now();
    const existing = localLocks.get(key);
    if (existing && existing.expiresAt > now) {
      return null;
    }

    localLocks.set(key, { token, expiresAt: now + ttlSeconds * 1000 });
    return token;
  }

  /**
   * Releases a previously acquired lock, ensuring ownership matches the token.
   */
  public static async release(key: string, token: string): Promise<boolean> {
    const redis = getRedisClient();

    if (redis) {
      try {
        // Lua script or token check to prevent releasing another process's lock
        const currentToken = await redis.get<string>(key);
        if (currentToken === token) {
          await redis.del(key);
          return true;
        }
        return false;
      } catch (err) {
        console.warn(`[Lock] Redis release failed for "${key}":`, (err as Error).message);
      }
    }

    // Local fallback
    const existing = localLocks.get(key);
    if (existing && existing.token === token) {
      localLocks.delete(key);
      return true;
    }
    return false;
  }

  /**
   * Executes a callback within a distributed lock, guaranteeing automatic release.
   */
  public static async withLock<T>(
    key: string,
    action: () => Promise<T>,
    ttlSeconds = 30
  ): Promise<T> {
    const token = await DistributedLock.acquire(key, ttlSeconds);
    if (!token) {
      throw new Error(`Could not acquire distributed lock for resource: "${key}". Process already running.`);
    }

    try {
      return await action();
    } finally {
      await DistributedLock.release(key, token);
    }
  }
}
