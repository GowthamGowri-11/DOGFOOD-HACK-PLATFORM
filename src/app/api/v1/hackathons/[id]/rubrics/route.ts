import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireHackathonOrganizer } from '@/server/permissions/guards';
import { ScoringEngine } from '@/server/services/scoring.engine';
import { RubricRepository } from '@/server/repositories/rubric.repository';
import { successResponse, errorResponse } from '@/lib/api/response';
import { AuditService } from '@/server/services/audit.service';
import prisma from '@/lib/prisma';

const criterionSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters').max(100),
  description: z.string().max(500).optional(),
  weightPercentage: z.number().min(1, 'Weight must be at least 1%').max(100),
  maxScore: z.number().min(1).max(1000).default(100),
  displayOrder: z.number().int().min(0).optional(),
  requiredFeedback: z.boolean().default(true),
});

const createRubricSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  criteria: z.array(criterionSchema).optional(),
  criterion: criterionSchema.optional(),
  title: z.string().min(2).optional(),
  description: z.string().optional(),
  weightPercentage: z.number().optional(),
  maxScore: z.number().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: hackathonId } = await params;
    const { searchParams } = new URL(req.url);
    const currentOnly = searchParams.get('current') === 'true';

    const currentRubric = await RubricRepository.findCurrentByHackathon(hackathonId);
    if (currentOnly) {
      return successResponse({ rubric: currentRubric });
    }

    const rubrics = await RubricRepository.findAllByHackathon(hackathonId);
    return successResponse({ rubrics, rubric: currentRubric || rubrics[0] || null });
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

    // Case 1: Single criterion addition (either via .criterion or top-level fields)
    const singleCriterion = parsed.data.criterion || (
      parsed.data.title ? {
        title: parsed.data.title,
        description: parsed.data.description,
        weightPercentage: parsed.data.weightPercentage ?? 25,
        maxScore: parsed.data.maxScore ?? 100,
      } : undefined
    );

    if (singleCriterion) {
      // Find current rubric or create one if none exists
      let currentRubric = await RubricRepository.findCurrentByHackathon(hackathonId);

      if (!currentRubric) {
        currentRubric = await RubricRepository.create({
          hackathonId,
          name: 'Enterprise Evaluation Rubric',
          criteria: [
            {
              title: singleCriterion.title,
              description: singleCriterion.description || `Assessment for ${singleCriterion.title}`,
              weightPercentage: singleCriterion.weightPercentage,
              maxScore: singleCriterion.maxScore ?? 100,
              displayOrder: 1,
              requiredFeedback: singleCriterion.requiredFeedback ?? true,
            },
          ],
        });
      } else {
        // Check if current rubric is locked by evaluations
        const isLocked = await RubricRepository.isLockedByEvaluations(currentRubric.id);
        if (isLocked) {
          // Clone and create next version
          const existingCriteria = currentRubric.criteria.map((c) => ({
            title: c.title,
            description: c.description,
            weightPercentage: c.weightPercentage,
            maxScore: c.maxScore,
            displayOrder: c.displayOrder,
            requiredFeedback: c.requiredFeedback,
          }));

          currentRubric = await RubricRepository.create({
            hackathonId,
            name: `${currentRubric.name} (v${currentRubric.version + 1})`,
            criteria: [
              ...existingCriteria,
              {
                title: singleCriterion.title,
                description: singleCriterion.description || `Assessment for ${singleCriterion.title}`,
                weightPercentage: singleCriterion.weightPercentage,
                maxScore: singleCriterion.maxScore ?? 100,
                displayOrder: existingCriteria.length + 1,
                requiredFeedback: singleCriterion.requiredFeedback ?? true,
              },
            ],
          });
        } else {
          // Direct append to current active rubric
          await prisma.rubricCriterion.create({
            data: {
              rubricId: currentRubric.id,
              title: singleCriterion.title,
              description: singleCriterion.description || `Assessment for ${singleCriterion.title}`,
              weightPercentage: singleCriterion.weightPercentage,
              maxScore: singleCriterion.maxScore ?? 100,
              displayOrder: currentRubric.criteria.length + 1,
              requiredFeedback: singleCriterion.requiredFeedback ?? true,
            },
          });

          currentRubric = await RubricRepository.findById(currentRubric.id) as any;
        }
      }

      await AuditService.log({
        userId: session.id,
        hackathonId,
        action: 'RUBRIC_UPDATED',
        entityType: 'Rubric',
        entityId: currentRubric.id,
        afterState: { criterionAdded: singleCriterion.title, totalCriteria: currentRubric.criteria.length },
      });

      return successResponse({ rubric: currentRubric }, 'Criterion added successfully', 201);
    }

    // Case 2: Full rubric with criteria array
    if (parsed.data.criteria && parsed.data.criteria.length > 0) {
      const { name, criteria } = parsed.data;

      const rubric = await RubricRepository.create({
        hackathonId,
        name: name || 'Enterprise Evaluation Rubric',
        criteria: criteria.map((c) => ({
          title: c.title,
          description: c.description || `Assessment for ${c.title}`,
          weightPercentage: c.weightPercentage,
          maxScore: c.maxScore ?? 100,
          displayOrder: c.displayOrder,
          requiredFeedback: c.requiredFeedback ?? true,
        })),
      });

      await AuditService.log({
        userId: session.id,
        hackathonId,
        action: 'RUBRIC_CREATED',
        entityType: 'Rubric',
        entityId: rubric.id,
        afterState: { name: rubric.name, criteriaCount: criteria.length, version: rubric.version },
      });

      return successResponse({ rubric }, 'Rubric created successfully', 201);
    }

    return errorResponse('Either criterion or criteria array is required', 'VALIDATION_ERROR', 400);
  } catch (error: any) {
    const status = error.status || 500;
    const code = error.code || 'INTERNAL_ERROR';
    return errorResponse(error.message, code, status);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: hackathonId } = await params;
    const session = await requireHackathonOrganizer(hackathonId);
    const { searchParams } = new URL(req.url);
    const criterionId = searchParams.get('criterionId');

    if (!criterionId) {
      return errorResponse('criterionId parameter is required', 'VALIDATION_ERROR', 400);
    }

    const currentRubric = await RubricRepository.findCurrentByHackathon(hackathonId);
    if (!currentRubric) {
      return errorResponse('No active rubric found', 'NOT_FOUND', 404);
    }

    const isLocked = await RubricRepository.isLockedByEvaluations(currentRubric.id);
    if (isLocked) {
      return errorResponse(
        'Cannot delete criterion because active evaluations exist for this rubric.',
        'RUBRIC_LOCKED',
        409
      );
    }

    await prisma.rubricCriterion.delete({
      where: { id: criterionId },
    });

    const updatedRubric = await RubricRepository.findById(currentRubric.id);

    await AuditService.log({
      userId: session.id,
      hackathonId,
      action: 'RUBRIC_UPDATED',
      entityType: 'Rubric',
      entityId: currentRubric.id,
      afterState: { criterionDeleted: criterionId },
    });

    return successResponse({ rubric: updatedRubric }, 'Criterion deleted successfully');
  } catch (error: any) {
    const status = error.status || 500;
    const code = error.code || 'INTERNAL_ERROR';
    return errorResponse(error.message, code, status);
  }
}
