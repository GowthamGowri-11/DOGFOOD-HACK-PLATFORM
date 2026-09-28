import { successResponse } from '@/lib/api/response';
import { checkRedisHealth } from '@/lib/redis';
import prisma from '@/lib/prisma';

export async function GET() {
  const [redisHealth, dbHealth] = await Promise.all([
    checkRedisHealth(),
    prisma
      .$queryRaw`SELECT 1`
      .then(() => ({ status: 'CONNECTED', error: undefined as string | undefined }))
      .catch((err: any) => ({ status: 'ERROR', error: (err?.message || 'Database query error') as string | undefined })),
  ]);

  const isDegraded = dbHealth.status === 'ERROR';

  return successResponse(
    {
      status: isDegraded ? 'DEGRADED' : 'HEALTHY',
      service: 'Ultra Pro Max Hackathon Platform',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      services: {
        database: {
          provider: 'Neon Serverless PostgreSQL',
          status: dbHealth.status,
          ...(dbHealth.error ? { error: dbHealth.error } : {}),
        },
        redis: {
          provider: 'Upstash Redis',
          status: redisHealth.status,
          latencyMs: redisHealth.latencyMs,
          ...(redisHealth.error ? { error: redisHealth.error } : {}),
          ...(redisHealth.url ? { endpoint: redisHealth.url } : {}),
        },
      },
    },
    isDegraded ? 'Platform running with degraded database' : 'Platform health verified'
  );
}
