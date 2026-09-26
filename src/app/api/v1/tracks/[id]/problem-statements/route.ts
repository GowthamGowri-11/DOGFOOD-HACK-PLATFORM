import { NextRequest } from 'next/server';
import { z } from 'zod';
import { ProblemStatementRepository } from '@/server/repositories/problem-statement.repository';
import { TrackRepository } from '@/server/repositories/track.repository';
import { requireRole } from '@/server/permissions/guards';
import { ResourceGuards } from '@/server/permissions/resource-guards';
import { successResponse, errorResponse } from '@/lib/api/response';
import { AuditService } from '@/server/services/audit.service';

const createProblemSchema = z.object({
  code: z.string().min(2, 'Code must be at least 2 characters (e.g. AI-01)'),
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  challengeDocUrl: z.string().url().optional().or(z.literal('')),
  isPublic: z.boolean().default(true),
  displayOrder: z.number().int().min(0).default(0),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const trackId = params.id;
    const { searchParams } = new URL(req.url);
    const publicOnly = searchParams.get('publicOnly') === 'true';

    const problemStatements = await ProblemStatementRepository.listByTrack(trackId, publicOnly);
    return successResponse({ problemStatements });
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to list problem statements', 'INTERNAL_ERROR', 500);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireRole(['ORGANIZER', 'ADMIN']);
    const trackId = params.id;

    const track = await TrackRepository.findById(trackId);
    if (!track) {
      return errorResponse('Track not found', 'NOT_FOUND', 404);
    }

    if (session.role === 'ORGANIZER') {
      const canAccess = await ResourceGuards.canOrganizerAccessHackathon(session.id, track.hackathon.id);
      if (!canAccess) {
        return errorResponse('You are not authorized to add problem statements to this track', 'FORBIDDEN_RESOURCE', 403);
      }
    }

    const body = await req.json();
    const parsed = createProblemSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse('Invalid problem statement payload', 'VALIDATION_ERROR', 422, parsed.error.format());
    }

    const data = parsed.data;
    const problem = await ProblemStatementRepository.create({
      hackathonId: track.hackathon.id,
      trackId,
      code: data.code,
      title: data.title,
      description: data.description,
      challengeDocUrl: data.challengeDocUrl || undefined,
      isPublic: data.isPublic,
      displayOrder: data.displayOrder,
    });

    await AuditService.log({
      userId: session.id,
      hackathonId: track.hackathon.id,
      action: 'PROBLEM_STATEMENT_CREATED',
      entityType: 'ProblemStatement',
      entityId: problem.id,
      afterState: { id: problem.id, code: problem.code, title: problem.title },
    });

    return successResponse({ problemStatement: problem }, 'Problem statement created successfully', 201);
  } catch (error: any) {
    const status = error.status || 500;
    const code = error.code || 'INTERNAL_ERROR';
    return errorResponse(error.message, code, status);
  }
}
