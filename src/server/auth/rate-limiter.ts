import { getRedisClient } from '../../lib/redis';

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const memoryStore = new Map<string, RateLimitRecord>();

export class RateLimiter {
  /**
   * Synchronous rate check using local memory store.
   */
  public static checkSync(
    key: string,
    maxAttempts = 10,
    windowMs = 15 * 60 * 1000
  ): { allowed: boolean; remaining: number } {
    const now = Date.now();
    const record = memoryStore.get(key);

    if (!record || now > record.resetAt) {
      memoryStore.set(key, { count: 1, resetAt: now + windowMs });
      return { allowed: true, remaining: maxAttempts - 1 };
    }

    if (record.count >= maxAttempts) {
      return { allowed: false, remaining: 0 };
    }

    record.count += 1;
    memoryStore.set(key, record);
    return { allowed: true, remaining: maxAttempts - record.count };
  }

  /**
   * Checks if an identifier has exceeded allowed attempts using Redis atomic INCR + PEXPIRE.
   * Gracefully falls back to memory store if Redis is unavailable.
   *
   * @param key Unique key (e.g. `login:user@email.com` or `ip:127.0.0.1`)
   * @param maxAttempts Maximum allowed attempts (default 10)
   * @param windowMs Time window in milliseconds (default 15 minutes)
   * @returns { allowed: boolean, remaining: number }
   */
  public static async check(
    key: string,
    maxAttempts = 10,
    windowMs = 15 * 60 * 1000
  ): Promise<{ allowed: boolean; remaining: number }> {
    const redis = getRedisClient();

    if (redis) {
      try {
        const redisKey = `ratelimit:${key}`;
        const count = await redis.incr(redisKey);

        if (count === 1) {
          // First attempt in this window: set expiration
          const ttlSec = Math.ceil(windowMs / 1000);
          await redis.expire(redisKey, ttlSec);
        }

        const allowed = count <= maxAttempts;
        const remaining = Math.max(0, maxAttempts - count);
        return { allowed, remaining };
      } catch (err) {
        console.warn(`[RateLimiter] Redis check failed for "${key}", falling back to memory:`, (err as Error).message);
      }
    }

    return this.checkSync(key, maxAttempts, windowMs);
  }

  /**
   * Resets rate limit counter for an identifier upon successful authentication.
   */
  public static async reset(key: string): Promise<void> {
    memoryStore.delete(key);
    const redis = getRedisClient();
    if (redis) {
      try {
        await redis.del(`ratelimit:${key}`);
      } catch (err) {
        console.warn(`[RateLimiter] Redis reset failed for "${key}":`, (err as Error).message);
      }
    }
  }
}
