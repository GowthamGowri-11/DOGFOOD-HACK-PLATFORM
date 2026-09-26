import { NextRequest } from 'next/server';
import { requireAuth } from '@/server/permissions/guards';
import { ProjectRepository } from '@/server/repositories/project.repository';
import { SubmissionValidator } from '@/server/services/submission-validator.service';
import { successResponse, errorResponse } from '@/lib/api/response';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth();
    const projectId = params.id;

    const project = await ProjectRepository.findById(projectId);
    if (!project) {
      return errorResponse('Project not found', 'NOT_FOUND', 404);
    }

    const isMember = project.team.members.some((m) => m.userId === session.id);
    if (!isMember && session.role !== 'ADMIN') {
      return errorResponse('You are not authorized to validate this project.', 'FORBIDDEN', 403);
    }

    const validation = SubmissionValidator.validateProjectForSubmission(project, project.hackathon);

    return successResponse(validation);
  } catch (error: any) {
    const status = error.status || 500;
    const code = error.code || 'INTERNAL_ERROR';
    return errorResponse(error.message, code, status);
  }
}
