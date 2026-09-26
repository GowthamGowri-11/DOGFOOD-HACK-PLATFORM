import { NextRequest } from 'next/server';
import { z } from 'zod';
import { ProblemStatementRepository } from '@/server/repositories/problem-statement.repository';
import { requireRole } from '@/server/permissions/guards';
import { ResourceGuards } from '@/server/permissions/resource-guards';
import { successResponse, errorResponse } from '@/lib/api/response';
import { AuditService } from '@/server/services/audit.service';

const updateProblemSchema = z.object({
  code: z.string().min(2).optional(),
  title: z.string().min(3).optional(),
  description: z.string().min(10).optional(),
  challengeDocUrl: z.string().url().optional().or(z.literal('')),
  isPublic: z.boolean().optional(),
  displayOrder: z.number().int().min(0).optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const problem = await ProblemStatementRepository.findById(params.id);
    if (!problem) {
      return errorResponse('Problem statement not found', 'NOT_FOUND', 404);
    }

    return successResponse({ problemStatement: problem });
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to get problem statement', 'INTERNAL_ERROR', 500);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireRole(['ORGANIZER', 'ADMIN']);
    const problemId = params.id;

    const problem = await ProblemStatementRepository.findById(problemId);
    if (!problem) {
      return errorResponse('Problem statement not found', 'NOT_FOUND', 404);
    }

    if (session.role === 'ORGANIZER') {
      const canAccess = await ResourceGuards.canOrganizerAccessHackathon(session.id, problem.hackathon.id);
      if (!canAccess) {
        return errorResponse('You are not authorized to modify this problem statement', 'FORBIDDEN_RESOURCE', 403);
      }
    }

    const body = await req.json();
    const parsed = updateProblemSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse('Invalid problem statement payload', 'VALIDATION_ERROR', 422, parsed.error.format());
    }

    const updated = await ProblemStatementRepository.update(problemId, parsed.data);

    await AuditService.log({
      userId: session.id,
      hackathonId: problem.hackathon.id,
      action: 'PROBLEM_STATEMENT_UPDATED',
      entityType: 'ProblemStatement',
      entityId: problemId,
      beforeState: { title: problem.title, code: problem.code },
      afterState: { title: updated.title, code: updated.code },
    });

    return successResponse({ problemStatement: updated }, 'Problem statement updated successfully');
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
    const session = await requireRole(['ORGANIZER', 'ADMIN']);
    const problemId = params.id;

    const problem = await ProblemStatementRepository.findById(problemId);
    if (!problem) {
      return errorResponse('Problem statement not found', 'NOT_FOUND', 404);
    }

    if (session.role === 'ORGANIZER') {
      const canAccess = await ResourceGuards.canOrganizerAccessHackathon(session.id, problem.hackathon.id);
      if (!canAccess) {
        return errorResponse('You are not authorized to delete this problem statement', 'FORBIDDEN_RESOURCE', 403);
      }
    }

    await ProblemStatementRepository.delete(problemId);

    await AuditService.log({
      userId: session.id,
      hackathonId: problem.hackathon.id,
      action: 'PROBLEM_STATEMENT_DELETED',
      entityType: 'ProblemStatement',
      entityId: problemId,
      beforeState: { title: problem.title, code: problem.code },
    });

    return successResponse(null, 'Problem statement deleted successfully');
  } catch (error: any) {
    const status = error.status || 500;
    const code = error.code || 'INTERNAL_ERROR';
    return errorResponse(error.message, code, status);
  }
}
