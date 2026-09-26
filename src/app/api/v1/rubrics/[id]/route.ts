import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireHackathonOrganizer } from '@/server/permissions/guards';
import { RubricRepository } from '@/server/repositories/rubric.repository';
import { ScoringEngine } from '@/server/services/scoring.engine';
import { successResponse, errorResponse } from '@/lib/api/response';
import prisma from '@/lib/prisma';
import { AuditService } from '@/server/services/audit.service';

const updateRubricSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  isCurrent: z.boolean().optional(),
  criteria: z
    .array(
      z.object({
        id: z.string().uuid().optional(),
        title: z.string().min(2).max(100),
        description: z.string().min(2).max(500),
        weightPercentage: z.number().min(1).max(100),
        maxScore: z.number().min(1).max(1000).default(100),
        displayOrder: z.number().int().min(0).optional(),
        requiredFeedback: z.boolean().default(true),
      })
    )
    .optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const rubric = await RubricRepository.findById(id);

    if (!rubric) {
      return errorResponse('Rubric not found', 'NOT_FOUND', 404);
    }

    return successResponse({ rubric });
  } catch (error: any) {
    const status = error.status || 500;
    const code = error.code || 'INTERNAL_ERROR';
    return errorResponse(error.message, code, status);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: rubricId } = await params;
    const rubric = await RubricRepository.findById(rubricId);

    if (!rubric) {
      return errorResponse('Rubric not found', 'NOT_FOUND', 404);
    }

    const session = await requireHackathonOrganizer(rubric.hackathonId);
    const body = await req.json();
    const parsed = updateRubricSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse('Invalid rubric update', 'VALIDATION_ERROR', 422, parsed.error.format());
    }

    // IMMUTABILITY GUARD: If evaluations already exist for this rubric, it is locked.
    // The organizer must create a new rubric version instead.
    const isLocked = await RubricRepository.isLockedByEvaluations(rubricId);
    if (isLocked) {
      return errorResponse(
        'Cannot modify this rubric because completed or active human evaluations exist. Create a new Rubric version to update criteria.',
        'RUBRIC_VERSION_IMMUTABLE',
        409
      );
    }

    const { name, isCurrent, criteria } = parsed.data;

    if (criteria && criteria.length > 0) {
      const validation = ScoringEngine.validateRubric(criteria);
      if (!validation.isValid) {
        return errorResponse(
          `Rubric validation failed: ${validation.errors.join(', ')}`,
          'INVALID_RUBRIC_WEIGHTS',
          400,
          { errors: validation.errors }
        );
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (isCurrent) {
        await tx.rubric.updateMany({
          where: { hackathonId: rubric.hackathonId, isCurrent: true },
          data: { isCurrent: false },
        });
      }

      if (criteria && criteria.length > 0) {
        // Delete old criteria and recreate
        await tx.rubricCriterion.deleteMany({
          where: { rubricId },
        });

        await tx.rubricCriterion.createMany({
          data: criteria.map((c, idx) => ({
            rubricId,
            title: c.title,
            description: c.description,
            weightPercentage: c.weightPercentage,
            maxScore: c.maxScore ?? 100,
            displayOrder: c.displayOrder ?? idx,
            requiredFeedback: c.requiredFeedback ?? true,
          })),
        });
      }

      return tx.rubric.update({
        where: { id: rubricId },
        data: {
          name: name ?? rubric.name,
          isCurrent: isCurrent ?? rubric.isCurrent,
        },
        include: {
          criteria: {
            orderBy: { displayOrder: 'asc' },
          },
        },
      });
    });

    await AuditService.log({
      userId: session.id,
      hackathonId: rubric.hackathonId,
      action: 'RUBRIC_UPDATED',
      entityType: 'Rubric',
      entityId: rubricId,
      afterState: { name: updated.name, isCurrent: updated.isCurrent },
    });

    return successResponse({ rubric: updated }, 'Rubric updated successfully');
  } catch (error: any) {
    const status = error.status || 500;
    const code = error.code || 'INTERNAL_ERROR';
    return errorResponse(error.message, code, status);
  }
}
