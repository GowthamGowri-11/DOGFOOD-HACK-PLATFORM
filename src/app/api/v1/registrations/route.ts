import { NextRequest } from 'next/server';
import { requireAuth } from '@/server/permissions/guards';
import { RegistrationRepository } from '@/server/repositories/registration.repository';
import { successResponse, errorResponse } from '@/lib/api/response';

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();
    const registrations = await RegistrationRepository.listByUser(session.id);
    return successResponse({ registrations });
  } catch (error: any) {
    const status = error.status || 500;
    const code = error.code || 'INTERNAL_ERROR';
    return errorResponse(error.message, code, status);
  }
}
