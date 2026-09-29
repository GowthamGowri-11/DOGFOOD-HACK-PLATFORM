import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/server/permissions/guards';
import { QuestionVotingService } from '@/server/services/question-voting.service';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(['ADMIN', 'ORGANIZER']);
    const { id: hackathonId } = await params;

    const csvContent = await QuestionVotingService.exportResultsCsv(hackathonId);

    const filename = `question-voting-results-${hackathonId}-${new Date().toISOString().slice(0, 10)}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error: any) {
    console.error('[API /question-voting/export GET] Error:', error);
    return new NextResponse('Export failed: ' + (error.message || 'Unauthorized'), {
      status: error.status || 500,
    });
  }
}
