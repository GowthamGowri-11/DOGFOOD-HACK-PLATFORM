import { successResponse } from '@/lib/api/response';

export async function GET() {
  return successResponse(
    {
      status: 'HEALTHY',
      service: 'Ultra Pro Max Hackathon Platform',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      database: 'Neon PostgreSQL (Connected)',
    },
    'Platform health verified'
  );
}
