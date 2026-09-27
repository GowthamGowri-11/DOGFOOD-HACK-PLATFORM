import { NextRequest } from 'next/server';
import { requireAuth, requireRole } from '@/server/permissions/guards';
import { TeamFormService } from '@/server/services/team-form.service';
import { successResponse, errorResponse } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const hackathonId = params.id;
    const form = await TeamFormService.getForm(hackathonId);
    return successResponse({ form });
  } catch (error: any) {
    const status = error.status || 500;
    const code = error.code || 'INTERNAL_ERROR';
    return errorResponse(error.message || 'Failed to fetch team member form', code, status);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireRole(['ORGANIZER', 'ADMIN']);
    const hackathonId = params.id;
    const body = await req.json();

    const updatedForm = await TeamFormService.saveForm(
      hackathonId,
      session.id,
      session.role,
      body
    );

    return successResponse({ form: updatedForm }, 'Team member form updated successfully');
  } catch (error: any) {
    const status = error.status || 500;
    const code = error.code || 'INTERNAL_ERROR';
    return errorResponse(error.message || 'Failed to save team member form', code, status);
  }
}
