import { NextRequest } from 'next/server';
import { requireAuth } from '@/server/permissions/guards';
import { ProjectRepository } from '@/server/repositories/project.repository';
import { successResponse, errorResponse } from '@/lib/api/response';

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();
    const projects = await ProjectRepository.listByUser(session.id);

    return successResponse({ projects });
  } catch (error: any) {
    const status = error.status || 500;
    const code = error.code || 'INTERNAL_ERROR';
    return errorResponse(error.message, code, status);
  }
}
