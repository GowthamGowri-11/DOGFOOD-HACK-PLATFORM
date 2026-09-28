import crypto from 'crypto';

// In-memory mutex locks with expiration
const localLocks = new Map<string, { token: string; expiresAt: number }>();

/**
 * Mutex Lock Utility
 *
 * Provides concurrency locking with automatic TTL timeout and token verification.
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
    const existing = localLocks.get(key);
    if (existing && existing.token === token) {
      localLocks.delete(key);
      return true;
    }
    return false;
  }

  /**
   * Executes a callback within a lock, guaranteeing automatic release.
   */
  public static async withLock<T>(
    key: string,
    action: () => Promise<T>,
    ttlSeconds = 30
  ): Promise<T> {
    const token = await DistributedLock.acquire(key, ttlSeconds);
    if (!token) {
      throw new Error(`Could not acquire lock for resource: "${key}". Process already running.`);
    }

    try {
      return await action();
    } finally {
      await DistributedLock.release(key, token);
    }
  }
}
