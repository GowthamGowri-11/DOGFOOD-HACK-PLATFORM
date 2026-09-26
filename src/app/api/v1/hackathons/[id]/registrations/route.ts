import { NextRequest } from 'next/server';
import { requireRole } from '@/server/permissions/guards';
import { ResourceGuards } from '@/server/permissions/resource-guards';
import { RegistrationRepository } from '@/server/repositories/registration.repository';
import { successResponse, errorResponse } from '@/lib/api/response';
import { RegistrationStatus } from '@prisma/client';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireRole(['ORGANIZER', 'ADMIN']);
    const hackathonId = params.id;

    if (session.role === 'ORGANIZER') {
      const canAccess = await ResourceGuards.canOrganizerAccessHackathon(session.id, hackathonId);
      if (!canAccess) {
        return errorResponse('You are not authorized to view registrations for this hackathon.', 'FORBIDDEN_RESOURCE', 403);
      }
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') as RegistrationStatus | undefined;
    const search = searchParams.get('search') || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);

    const result = await RegistrationRepository.listByHackathon({
      hackathonId,
      status: status || undefined,
      search,
      page,
      pageSize,
    });

    return successResponse(result);
  } catch (error: any) {
    const status = error.status || 500;
    const code = error.code || 'INTERNAL_ERROR';
    return errorResponse(error.message, code, status);
  }
}
