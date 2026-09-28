/**
 * In-Memory High-Performance Cache Service
 *
 * Provides fast, zero-dependency in-memory caching with automatic TTL eviction,
 * pattern-based invalidation, and type-safe cache keys.
 */

interface CacheEntry<T = any> {
  value: T;
  expiresAt: number;
}

const memoryCache = new Map<string, CacheEntry>();

function cleanExpiredEntries(): void {
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
  cleanExpiredEntries();
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
  return memoryCache.delete(key);
}

/**
 * Delete keys matching a pattern (e.g. `cache:leaderboard:*`).
 */
export async function deleteCachePattern(pattern: string): Promise<number> {
  let count = 0;
  const regexPattern = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
  const memoryKeys = Array.from(memoryCache.keys());

  for (let i = 0; i < memoryKeys.length; i++) {
    const key = memoryKeys[i];
    if (regexPattern.test(key)) {
      memoryCache.delete(key);
      count++;
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
