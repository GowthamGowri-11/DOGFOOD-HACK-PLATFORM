interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const memoryStore = new Map<string, RateLimitRecord>();

export class RateLimiter {
  /**
   * Checks if an identifier has exceeded allowed attempts in a given time window.
   * @param key Unique key (e.g. `login:user@email.com` or `ip:127.0.0.1`)
   * @param maxAttempts Maximum allowed attempts (e.g. 5)
   * @param windowMs Time window in milliseconds (e.g. 15 minutes = 900,000 ms)
   * @returns true if allowed, false if rate limited
   */
  public static check(key: string, maxAttempts = 10, windowMs = 15 * 60 * 1000): { allowed: boolean; remaining: number } {
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
   * Resets rate limit for an identifier upon successful authentication.
   */
  public static reset(key: string): void {
    memoryStore.delete(key);
  }
}
