import { Redis } from '@upstash/redis';

declare global {
  // eslint-disable-next-line no-var
  var __redisClient: Redis | undefined;
}

/**
 * Returns true if Upstash Redis environment variables are defined.
 */
export function isRedisConfigured(): boolean {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  );
}

/**
 * Singleton Redis client instance using @upstash/redis.
 * In development, reuses instance across Next.js HMR cycles.
 */
export function getRedisClient(): Redis | null {
  if (!isRedisConfigured()) {
    return null;
  }

  if (process.env.NODE_ENV === 'production') {
    return new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
  }

  if (!global.__redisClient) {
    global.__redisClient = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
  }

  return global.__redisClient;
}

export const redis = getRedisClient();

export interface RedisHealthResult {
  status: 'CONNECTED' | 'NOT_CONFIGURED' | 'ERROR';
  latencyMs?: number;
  error?: string;
  url?: string;
}

/**
 * Health check probe for Redis.
 */
export async function checkRedisHealth(): Promise<RedisHealthResult> {
  const client = getRedisClient();
  if (!client) {
    return {
      status: 'NOT_CONFIGURED',
      error: 'UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN is missing',
    };
  }

  const start = Date.now();
  try {
    const pong = await client.ping();
    const latencyMs = Date.now() - start;
    if (pong === 'PONG' || pong === 'pong') {
      return {
        status: 'CONNECTED',
        latencyMs,
        url: process.env.UPSTASH_REDIS_REST_URL?.replace(/^(https?:\/\/[^.]+).*/, '$1...'),
      };
    }
    return {
      status: 'ERROR',
      error: `Unexpected ping response: ${String(pong)}`,
      latencyMs,
    };
  } catch (err: any) {
    return {
      status: 'ERROR',
      latencyMs: Date.now() - start,
      error: err?.message || 'Failed to ping Redis',
    };
  }
}
