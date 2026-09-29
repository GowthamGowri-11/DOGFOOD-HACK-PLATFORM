import { NextRequest } from 'next/server';
import { requireRole } from '@/server/permissions/guards';
import { PortabilityService } from '@/server/services/portability.service';
import { successResponse, errorResponse } from '@/lib/api/response';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRole(['ADMIN', 'ORGANIZER']);
    const { id: hackathonId } = await params;

    const body = await req.json();
    const { entityType, format, content } = body;

    if (!entityType || !content) {
      return errorResponse('Missing entityType or content payload.', 'VALIDATION_ERROR', 400);
    }

    const result = await PortabilityService.bulkImport({
      hackathonId,
      entityType,
      format: format || 'csv',
      content,
      actorId: session.id,
    });

    return successResponse(result, `Bulk import finished: ${result.importedCount} records processed successfully.`);
  } catch (err: any) {
    return errorResponse(err.message || 'Bulk import failed', 'IMPORT_ERROR', err.status || 400);
  }
}
