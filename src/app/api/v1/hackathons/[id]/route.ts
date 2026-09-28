import { NextRequest } from 'next/server';
import { z } from 'zod';
import { HackathonRepository } from '@/server/repositories/hackathon.repository';
import { HackathonLifecycleService } from '@/server/services/hackathon-lifecycle.service';
import { HackathonService } from '@/server/services/hackathon.service';
import { SubmissionWindowService } from '@/server/services/submission-window.service';
import { deadlineScheduler } from '@/server/services/deadline-scheduler.service';
import { eventBus } from '@/server/realtime/event-bus';
import { RealtimeRoomBuilder } from '@/server/realtime/event-types';
import { requireAuth, requireRole } from '@/server/permissions/guards';
import { ResourceGuards } from '@/server/permissions/resource-guards';
import { successResponse, errorResponse } from '@/lib/api/response';
import { AuditService } from '@/server/services/audit.service';
import { EventStatus } from '@prisma/client';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

const updateHackathonSchema = z.object({
  title: z.string().min(3).optional(),
  slug: z.string().min(3).optional(),
  tagline: z.string().optional(),
  description: z.string().min(10).optional(),
  organizationName: z.string().min(2).optional(),
  status: z.enum([
    'DRAFT',
    'PUBLISHED',
    'REGISTRATION_OPEN',
    'REGISTRATION_CLOSED',
    'EVENT_ACTIVE',
    'SUBMISSION_OPEN',
    'SUBMISSION_CLOSED',
    'JUDGING',
    'RESULTS_PENDING',
    'RESULTS_PUBLISHED',
    'COMPLETED',
  ]).optional(),
  minTeamSize: z.number().int().min(1).optional(),
  maxTeamSize: z.number().int().max(10).optional(),
  regStartTime: z.string().datetime().optional(),
  regEndTime: z.string().datetime().optional(),
  eventStartTime: z.string().datetime().optional(),
  eventEndTime: z.string().datetime().optional(),
  subStartTime: z.string().datetime().optional(),
  subEndTime: z.string().datetime().optional(),
  judgingStartTime: z.string().datetime().optional(),
  judgingEndTime: z.string().datetime().optional(),
  eligibilityRules: z.string().optional(),
  rulesAndGuidelines: z.string().optional(),
  // Flexible URLs for uploaded banners/logos + prize fields from both branches
  bannerUrl: z.string().optional().or(z.literal('')).or(z.null()),
  logoUrl: z.string().optional().or(z.literal('')).or(z.null()),
  prizePool: z.number().optional().or(z.string()),
  currency: z.string().optional(),
  prizes: z.array(z.any()).optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const hackathon = await HackathonRepository.findById(params.id);
    if (!hackathon) {
      return errorResponse('Hackathon not found', 'NOT_FOUND', 404);
    }

    // If DRAFT, check organizer authorization
    if (hackathon.status === 'DRAFT') {
      const session = await requireAuth();
      if (session.role !== 'ADMIN' && hackathon.organizerId !== session.id) {
        return errorResponse('Hackathon not found or access forbidden', 'FORBIDDEN_RESOURCE', 403);
      }
    }

    const operationalStatus = HackathonLifecycleService.getOperationalStatus(hackathon);
    const submissionWindow = SubmissionWindowService.getSubmissionWindowDetails(hackathon);

    return successResponse({
      hackathon,
      operationalStatus,
      submissionWindow,
    });
  } catch (error: any) {
    const status = error.status || 500;
    const code = error.code || 'INTERNAL_ERROR';
    return errorResponse(error.message, code, status);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireRole(['ORGANIZER', 'ADMIN']);
    const hackathonId = params.id;

    // Resource guard: Organizer must own this hackathon (or be admin)
    if (session.role === 'ORGANIZER') {
      const canAccess = await ResourceGuards.canOrganizerAccessHackathon(session.id, hackathonId);
      if (!canAccess) {
        return errorResponse('You are not authorized to modify this hackathon', 'FORBIDDEN_RESOURCE', 403);
      }
    }

    const current = await HackathonRepository.findById(hackathonId);
    if (!current) {
      return errorResponse('Hackathon not found', 'NOT_FOUND', 404);
    }

    const body = await req.json();
    const parsed = updateHackathonSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse('Invalid update payload', 'VALIDATION_ERROR', 422, parsed.error.format());
    }

    const data = parsed.data;

    // Check status transition validity if status is changing
    if (data.status && data.status !== current.status) {
      const validTransition = HackathonLifecycleService.canTransition(current.status, data.status as EventStatus);
      if (!validTransition) {
        return errorResponse(
          `Invalid lifecycle status transition from ${current.status} to ${data.status}`,
          'INVALID_STATUS_TRANSITION',
          422
        );
      }
    }

    // Validate dates if any date field is provided
    if (
      data.regStartTime ||
      data.regEndTime ||
      data.eventStartTime ||
      data.eventEndTime ||
      data.subStartTime ||
      data.subEndTime ||
      data.judgingStartTime ||
      data.judgingEndTime
    ) {
      const dateCheck = HackathonLifecycleService.validateDates({
        regStartTime: data.regStartTime || current.regStartTime,
        regEndTime: data.regEndTime || current.regEndTime,
        eventStartTime: data.eventStartTime || current.eventStartTime,
        eventEndTime: data.eventEndTime || current.eventEndTime,
        subStartTime: data.subStartTime || current.subStartTime,
        subEndTime: data.subEndTime || current.subEndTime,
        judgingStartTime: data.judgingStartTime || current.judgingStartTime,
        judgingEndTime: data.judgingEndTime || current.judgingEndTime,
      });

      if (!dateCheck.isValid) {
        return errorResponse('Invalid event date configuration', 'INVALID_DATES', 422, {
          errors: dateCheck.errors,
        });
      }
    }

    // Handle slug update if provided
    let newSlug: string | undefined = undefined;
    if (data.slug && data.slug !== current.slug) {
      newSlug = await HackathonService.generateUniqueSlug(data.slug, current.id);
    }

    const updated = await HackathonRepository.update(hackathonId, {
      title: data.title,
      slug: newSlug,
      tagline: data.tagline,
      description: data.description,
      organizationName: data.organizationName,
      status: data.status as EventStatus | undefined,
      minTeamSize: data.minTeamSize,
      maxTeamSize: data.maxTeamSize,
      bannerUrl: data.bannerUrl,
      logoUrl: data.logoUrl,
      regStartTime: data.regStartTime ? new Date(data.regStartTime) : undefined,
      regEndTime: data.regEndTime ? new Date(data.regEndTime) : undefined,
      eventStartTime: data.eventStartTime ? new Date(data.eventStartTime) : undefined,
      eventEndTime: data.eventEndTime ? new Date(data.eventEndTime) : undefined,
      subStartTime: data.subStartTime ? new Date(data.subStartTime) : undefined,
      subEndTime: data.subEndTime ? new Date(data.subEndTime) : undefined,
      judgingStartTime: data.judgingStartTime ? new Date(data.judgingStartTime) : undefined,
      judgingEndTime: data.judgingEndTime ? new Date(data.judgingEndTime) : undefined,
      eligibilityRules: data.eligibilityRules,
      rulesAndGuidelines: data.rulesAndGuidelines,
    });

    // Handle Prize Pool update if provided
    if (data.prizePool !== undefined && Number(data.prizePool) >= 0) {
      const existingPrizePool = await prisma.prize.findFirst({
        where: { hackathonId, category: 'Grand Pool' },
      });

      if (existingPrizePool) {
        await prisma.prize.update({
          where: { id: existingPrizePool.id },
          data: {
            amount: Number(data.prizePool),
            currency: data.currency || existingPrizePool.currency,
          },
        });
      } else if (Number(data.prizePool) > 0) {
        await prisma.prize.create({
          data: {
            hackathonId,
            title: 'Total Prize Pool',
            category: 'Grand Pool',
            amount: Number(data.prizePool),
            currency: data.currency || 'USD',
            rankOrder: 1,
            description: 'Platform competition reward pool',
          },
        });
      }
    }

    const windowUpdated =
      (data.subStartTime && new Date(data.subStartTime).getTime() !== new Date(current.subStartTime).getTime()) ||
      (data.subEndTime && new Date(data.subEndTime).getTime() !== new Date(current.subEndTime).getTime());

    if (windowUpdated) {
      deadlineScheduler.invalidateHackathon(hackathonId);

      await AuditService.log({
        userId: session.id,
        hackathonId,
        action: 'SUBMISSION_WINDOW_UPDATED',
        entityType: 'Hackathon',
        entityId: hackathonId,
        beforeState: { subStartTime: current.subStartTime, subEndTime: current.subEndTime },
        afterState: { subStartTime: updated.subStartTime, subEndTime: updated.subEndTime },
      });

      await eventBus.publish({
        type: 'SUBMISSION_WINDOW_UPDATED',
        hackathonId,
        rooms: [
          RealtimeRoomBuilder.hackathon(hackathonId),
          RealtimeRoomBuilder.organizer(hackathonId),
        ],
        payload: {
          subStartTime: updated.subStartTime.toISOString(),
          subEndTime: updated.subEndTime.toISOString(),
          submissionWindow: SubmissionWindowService.getSubmissionWindowDetails(updated),
        },
      });
    }

    await AuditService.log({
      userId: session.id,
      hackathonId,
      action: 'HACKATHON_UPDATED',
      entityType: 'Hackathon',
      entityId: hackathonId,
      beforeState: { title: current.title, status: current.status },
      afterState: { title: updated.title, status: updated.status },
    });

    try {
      revalidatePath('/hackathons');
      revalidatePath(`/hackathons/${updated.slug}`);
      revalidatePath('/organizer/hackathons');
      revalidatePath(`/organizer/hackathons/${hackathonId}`);
      revalidatePath('/admin/hackathons');
    } catch {
      // Ignore during test/static builds
    }

    const submissionWindow = SubmissionWindowService.getSubmissionWindowDetails(updated);

    return successResponse(
      { hackathon: updated, submissionWindow },
      'Hackathon updated successfully'
    );
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
    const hackathonId = params.id;

    if (session.role === 'ORGANIZER') {
      const canAccess = await ResourceGuards.canOrganizerAccessHackathon(session.id, hackathonId);
      if (!canAccess) {
        return errorResponse('You are not authorized to delete this hackathon', 'FORBIDDEN_RESOURCE', 403);
      }
    }

    const current = await HackathonRepository.findById(hackathonId);
    if (!current) {
      return errorResponse('Hackathon not found', 'NOT_FOUND', 404);
    }

    // Safety check: Don't hard delete if registrations/projects already exist
    if (current._count.registrations > 0 || current._count.projects > 0) {
      return errorResponse(
        'Cannot delete hackathon with existing registrations or project submissions. Please archive instead.',
        'HACKATHON_HAS_DEPENDENCIES',
        409
      );
    }

    await HackathonRepository.delete(hackathonId);

    await AuditService.log({
      userId: session.id,
      hackathonId,
      action: 'HACKATHON_DELETED',
      entityType: 'Hackathon',
      entityId: hackathonId,
      beforeState: { title: current.title },
    });

    try {
      revalidatePath('/hackathons');
      revalidatePath('/organizer/hackathons');
      revalidatePath('/admin/hackathons');
    } catch {
      // Ignore during test/static builds
    }

    return successResponse(null, 'Hackathon deleted successfully');
  } catch (error: any) {
    const status = error.status || 500;
    const code = error.code || 'INTERNAL_ERROR';
    return errorResponse(error.message, code, status);
  }
}
