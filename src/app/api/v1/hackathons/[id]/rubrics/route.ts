import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireHackathonOrganizer } from '@/server/permissions/guards';
import { ScoringEngine } from '@/server/services/scoring.engine';
import { RubricRepository } from '@/server/repositories/rubric.repository';
import { successResponse, errorResponse } from '@/lib/api/response';
import { AuditService } from '@/server/services/audit.service';

const createRubricSchema = z.object({
  name: z.string().min(2).max(100),
  criteria: z
    .array(
      z.object({
        title: z.string().min(2).max(100),
        description: z.string().min(2).max(500),
        weightPercentage: z.number().min(1).max(100),
        maxScore: z.number().min(1).max(1000).default(100),
        displayOrder: z.number().int().min(0).optional(),
        requiredFeedback: z.boolean().default(true),
      })
    )
    .min(1),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: hackathonId } = await params;
    const { searchParams } = new URL(req.url);
    const currentOnly = searchParams.get('current') === 'true';

    if (currentOnly) {
      const rubric = await RubricRepository.findCurrentByHackathon(hackathonId);
      return successResponse({ rubric });
    }

    const rubrics = await RubricRepository.findAllByHackathon(hackathonId);
    return successResponse({ rubrics });
  } catch (error: any) {
    const status = error.status || 500;
    const code = error.code || 'INTERNAL_ERROR';
    return errorResponse(error.message, code, status);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: hackathonId } = await params;
    const session = await requireHackathonOrganizer(hackathonId);
    const body = await req.json();
    const parsed = createRubricSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse('Invalid rubric structure', 'VALIDATION_ERROR', 422, parsed.error.format());
    }

    const { name, criteria } = parsed.data;

    // Strict validation: Total weights MUST equal 100%
    const validation = ScoringEngine.validateRubric(criteria);
    if (!validation.isValid) {
      return errorResponse(
        `Rubric validation failed: ${validation.errors.join(', ')}`,
        'INVALID_RUBRIC_WEIGHTS',
        400,
        { errors: validation.errors, totalWeight: validation.totalWeight }
      );
    }

    const rubric = await RubricRepository.create({
      hackathonId,
      name,
      criteria,
    });

    await AuditService.log({
      userId: session.id,
      hackathonId,
      action: 'RUBRIC_CREATED',
      entityType: 'Rubric',
      entityId: rubric.id,
      afterState: { name, criteriaCount: criteria.length, version: rubric.version },
    });

    return successResponse({ rubric }, 'Rubric created successfully', 201);
  } catch (error: any) {
    const status = error.status || 500;
    const code = error.code || 'INTERNAL_ERROR';
    return errorResponse(error.message, code, status);
  }
}
