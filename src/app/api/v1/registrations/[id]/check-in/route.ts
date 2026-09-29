import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireRole } from '@/server/permissions/guards';
import { ResourceGuards } from '@/server/permissions/resource-guards';
import { RegistrationService } from '@/server/services/registration.service';
import { successResponse, errorResponse } from '@/lib/api/response';

const updateCheckInSchema = z.object({
  checkedIn: z.boolean(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireRole(['ORGANIZER', 'ADMIN']);
    const registrationId = params.id;

    if (session.role === 'ORGANIZER') {
      const canAccess = await ResourceGuards.canOrganizerAccessRegistration(session.id, registrationId);
      if (!canAccess) {
        return errorResponse('You are not authorized to update this registration.', 'FORBIDDEN_RESOURCE', 403);
      }
    }

    const body = await req.json();
    const parsed = updateCheckInSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse('Invalid check-in payload', 'VALIDATION_ERROR', 422, parsed.error.format());
    }

    const updated = await RegistrationService.updateCheckIn(
      session.id,
      registrationId,
      parsed.data.checkedIn
    );

    return successResponse(
      { registration: updated },
      parsed.data.checkedIn ? 'Participant checked in successfully' : 'Participant check-in reverted'
    );
  } catch (error: any) {
    const status = error.status || 500;
    const code = error.code || 'INTERNAL_ERROR';
    return errorResponse(error.message, code, status);
  }
}
