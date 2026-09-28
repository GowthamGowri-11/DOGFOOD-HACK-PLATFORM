interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const memoryStore = new Map<string, RateLimitRecord>();

function cleanExpiredRateLimits(): void {
  const now = Date.now();
  memoryStore.forEach((record, key) => {
    if (now > record.resetAt) {
      memoryStore.delete(key);
    }
  });
}

export class RateLimiter {
  /**
   * Synchronous rate check using local memory store.
   */
  public static checkSync(
    key: string,
    maxAttempts = 10,
    windowMs = 15 * 60 * 1000
  ): { allowed: boolean; remaining: number } {
    cleanExpiredRateLimits();
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
   * Checks if an identifier has exceeded allowed attempts.
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
    return this.checkSync(key, maxAttempts, windowMs);
  }

  /**
   * Resets rate limit counter for an identifier upon successful authentication.
   */
  public static async reset(key: string): Promise<void> {
    memoryStore.delete(key);
  }
}
