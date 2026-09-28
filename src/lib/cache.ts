import { getRedisClient } from './redis';

// In-memory fallback cache when Redis is unavailable or unconfigured
interface MemoryCacheEntry {
  value: any;
  expiresAt: number;
}
const memoryCache = new Map<string, MemoryCacheEntry>();

function cleanMemoryCache() {
  const now = Date.now();
  memoryCache.forEach((entry, key) => {
    if (entry.expiresAt <= now) {
      memoryCache.delete(key);
    }
  });
}

/**
 * Standard Cache Key builders
 */
export const CACHE_KEYS = {
  LEADERBOARD: (hackathonId: string) => `cache:leaderboard:${hackathonId}`,
  HACKATHON: (hackathonId: string) => `cache:hackathon:${hackathonId}`,
  HACKATHONS_PUBLIC: () => 'cache:hackathons:public',
  PROJECT: (projectId: string) => `cache:project:${projectId}`,
  GALLERY: (filterKey: string = 'default') => `cache:gallery:${filterKey}`,
  AI_EVAL: (submissionHash: string) => `cache:ai_jury:${submissionHash}`,
  VOTE_COUNT: (projectId: string) => `cache:votes:${projectId}`,
} as const;

/**
 * Retrieve an item from the cache.
 */
export async function getCache<T>(key: string): Promise<T | null> {
  const redis = getRedisClient();

  if (redis) {
    try {
      const data = await redis.get<T>(key);
      if (data !== null && data !== undefined) {
        return data;
      }
      return null;
    } catch (err) {
      console.warn(`[Cache] Redis GET failed for key "${key}", falling back to memory:`, (err as Error).message);
    }
  }

  // Fallback to memory
  cleanMemoryCache();
  const entry = memoryCache.get(key);
  if (entry && entry.expiresAt > Date.now()) {
    return entry.value as T;
  }
  return null;
}

/**
 * Set an item in the cache with a time-to-live in seconds.
 */
export async function setCache<T>(key: string, value: T, ttlSeconds = 300): Promise<boolean> {
  const redis = getRedisClient();

  if (redis) {
    try {
      if (ttlSeconds > 0) {
        await redis.set(key, value, { ex: ttlSeconds });
      } else {
        await redis.set(key, value);
      }
      return true;
    } catch (err) {
      console.warn(`[Cache] Redis SET failed for key "${key}", falling back to memory:`, (err as Error).message);
    }
  }

  // Fallback to memory
  memoryCache.set(key, {
    value,
    expiresAt: ttlSeconds > 0 ? Date.now() + ttlSeconds * 1000 : Number.MAX_SAFE_INTEGER,
  });
  return true;
}

/**
 * Delete a specific key from the cache.
 */
export async function deleteCache(key: string): Promise<boolean> {
  memoryCache.delete(key);
  const redis = getRedisClient();

  if (redis) {
    try {
      await redis.del(key);
      return true;
    } catch (err) {
      console.warn(`[Cache] Redis DEL failed for key "${key}":`, (err as Error).message);
      return false;
    }
  }
  return true;
}

/**
 * Delete keys matching a pattern (e.g. `cache:leaderboard:*`).
 */
export async function deleteCachePattern(pattern: string): Promise<number> {
  let count = 0;

  // Invalidate matching memory keys
  const regexPattern = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
  const memoryKeys = Array.from(memoryCache.keys());
  for (let i = 0; i < memoryKeys.length; i++) {
    const key = memoryKeys[i];
    if (regexPattern.test(key)) {
      memoryCache.delete(key);
      count++;
    }
  }

  const redis = getRedisClient();
  if (redis) {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        // Delete in safe chunks to avoid argument length limits
        for (let i = 0; i < keys.length; i += 100) {
          const batch = keys.slice(i, i + 100);
          await redis.del(...batch);
        }
        count += keys.length;
      }
    } catch (err) {
      console.warn(`[Cache] Redis pattern DEL failed for pattern "${pattern}":`, (err as Error).message);
    }
  }

  return count;
}

/**
 * High-order helper: Get existing cached value or execute the fetcher, cache the result, and return it.
 */
export async function getOrSetCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds = 300
): Promise<T> {
  const cached = await getCache<T>(key);
  if (cached !== null) {
    return cached;
  }

  const fresh = await fetcher();
  await setCache(key, fresh, ttlSeconds);
  return fresh;
}
