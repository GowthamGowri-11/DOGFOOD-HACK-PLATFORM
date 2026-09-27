import { NextRequest } from 'next/server';
import { requireRole } from '@/server/permissions/guards';
import { TeamFormService } from '@/server/services/team-form.service';
import { successResponse, errorResponse } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireRole(['ORGANIZER', 'ADMIN']);
    const hackathonId = params.id;

    const publishedForm = await TeamFormService.publishForm(
      hackathonId,
      session.id,
      session.role
    );

    return successResponse({ form: publishedForm }, 'Team member form published successfully');
  } catch (error: any) {
    const status = error.status || 500;
    const code = error.code || 'INTERNAL_ERROR';
    return errorResponse(error.message || 'Failed to publish team member form', code, status);
  }
}
