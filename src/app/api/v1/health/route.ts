import { successResponse } from '@/lib/api/response';
import prisma from '@/lib/prisma';

export async function GET() {
  const dbHealth = await prisma
    .$queryRaw`SELECT 1`
    .then(() => ({ status: 'CONNECTED', error: undefined as string | undefined }))
    .catch((err: any) => ({ status: 'ERROR', error: (err?.message || 'Database query error') as string | undefined }));

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
        cache: {
          provider: 'In-Memory High-Performance Store',
          status: 'CONNECTED',
        },
      },
    },
    isDegraded ? 'Platform running with degraded database' : 'Platform health verified'
  );
}
