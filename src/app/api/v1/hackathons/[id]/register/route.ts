import { NextRequest } from 'next/server';
import { requireRole } from '@/server/permissions/guards';
import { RegistrationService } from '@/server/services/registration.service';
import { RegistrationRepository } from '@/server/repositories/registration.repository';
import { successResponse, errorResponse } from '@/lib/api/response';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireRole(['PARTICIPANT', 'ORGANIZER', 'ADMIN']);
    const hackathonId = params.id;
    let customAnswers = undefined;

    try {
      const body = await req.json();
      customAnswers = body.customAnswers;
    } catch {
      // Body is optional
    }

    const registration = await RegistrationService.registerParticipant({
      hackathonId,
      userId: session.id,
      customAnswers,
    });

    return successResponse(
      { registration },
      'You have successfully registered for the hackathon!',
      201
    );
  } catch (error: any) {
    const status = error.status || 500;
    const code = error.code || 'INTERNAL_ERROR';
    return errorResponse(error.message, code, status);
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireRole(['PARTICIPANT', 'ORGANIZER', 'ADMIN']);
    const hackathonId = params.id;

    const registration = await RegistrationRepository.findByUserAndHackathon(
      session.id,
      hackathonId
    );

    return successResponse({
      registered: !!registration,
      registration,
    });
  } catch (error: any) {
    const status = error.status || 500;
    const code = error.code || 'INTERNAL_ERROR';
    return errorResponse(error.message, code, status);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireRole(['PARTICIPANT', 'ORGANIZER', 'ADMIN']);
    const hackathonId = params.id;

    await RegistrationService.cancelRegistration(session.id, hackathonId);

    return successResponse(null, 'Registration cancelled successfully.');
  } catch (error: any) {
    const status = error.status || 500;
    const code = error.code || 'INTERNAL_ERROR';
    return errorResponse(error.message, code, status);
  }
}
