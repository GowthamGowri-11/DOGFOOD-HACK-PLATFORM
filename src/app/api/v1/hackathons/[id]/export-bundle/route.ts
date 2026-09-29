import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/server/permissions/guards';
import { PortabilityService } from '@/server/services/portability.service';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(['ADMIN', 'ORGANIZER']);
    const { id: hackathonId } = await params;

    const snapshot = await PortabilityService.exportFullHackathonSnapshot(hackathonId);
    const jsonString = JSON.stringify(snapshot, null, 2);

    const filename = `hackathon-full-archive-${hackathonId}-${new Date().toISOString().slice(0, 10)}.json`;

    return new NextResponse(jsonString, {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err: any) {
    return new NextResponse(JSON.stringify({ error: err.message || 'Export failed' }), {
      status: err.status || 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
