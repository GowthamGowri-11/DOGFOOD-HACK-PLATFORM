import { NextRequest } from 'next/server';
import { z } from 'zod';
import { HackathonRepository } from '@/server/repositories/hackathon.repository';
import { HackathonLifecycleService } from '@/server/services/hackathon-lifecycle.service';
import { HackathonService } from '@/server/services/hackathon.service';
import { requireRole } from '@/server/permissions/guards';
import { successResponse, errorResponse } from '@/lib/api/response';
import { AuditService } from '@/server/services/audit.service';
import { EventStatus } from '@prisma/client';

const createHackathonSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  slug: z.string().min(3).optional(),
  tagline: z.string().optional(),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  organizationName: z.string().min(2, 'Organization name is required'),
  minTeamSize: z.number().int().min(1).default(1),
  maxTeamSize: z.number().int().max(10).default(4),
  regStartTime: z.string().datetime(),
  regEndTime: z.string().datetime(),
  eventStartTime: z.string().datetime(),
  eventEndTime: z.string().datetime(),
  subStartTime: z.string().datetime(),
  subEndTime: z.string().datetime(),
  judgingStartTime: z.string().datetime(),
  judgingEndTime: z.string().datetime(),
  eligibilityRules: z.string().optional(),
  rulesAndGuidelines: z.string().optional(),
  bannerUrl: z.string().url().optional().or(z.literal('')),
  logoUrl: z.string().url().optional().or(z.literal('')),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || undefined;
    const status = (searchParams.get('status') as EventStatus) || undefined;
    const trackSlug = searchParams.get('track') || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);

    const result = await HackathonRepository.listPublic({
      search,
      status,
      trackSlug,
      page,
      pageSize,
    });

    return successResponse(result);
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to list hackathons', 'INTERNAL_ERROR', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireRole(['ORGANIZER', 'ADMIN']);
    const body = await req.json();
    const parsed = createHackathonSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse('Invalid hackathon configuration', 'VALIDATION_ERROR', 422, parsed.error.format());
    }

    const data = parsed.data;

    // Validate event dates
    const dateCheck = HackathonLifecycleService.validateDates({
      regStartTime: data.regStartTime,
      regEndTime: data.regEndTime,
      eventStartTime: data.eventStartTime,
      eventEndTime: data.eventEndTime,
      subStartTime: data.subStartTime,
      subEndTime: data.subEndTime,
      judgingStartTime: data.judgingStartTime,
      judgingEndTime: data.judgingEndTime,
    });

    if (!dateCheck.isValid) {
      return errorResponse('Invalid event date configuration', 'INVALID_DATES', 422, {
        errors: dateCheck.errors,
      });
    }

    // Generate unique slug
    const resolvedSlug = data.slug
      ? await HackathonService.generateUniqueSlug(data.slug)
      : await HackathonService.generateUniqueSlug(data.title);

    const created = await HackathonRepository.create({
      title: data.title,
      slug: resolvedSlug,
      tagline: data.tagline,
      description: data.description,
      organizationName: data.organizationName,
      organizerId: session.id,
      status: 'DRAFT',
      minTeamSize: data.minTeamSize,
      maxTeamSize: data.maxTeamSize,
      bannerUrl: data.bannerUrl || undefined,
      logoUrl: data.logoUrl || undefined,
      regStartTime: new Date(data.regStartTime),
      regEndTime: new Date(data.regEndTime),
      eventStartTime: new Date(data.eventStartTime),
      eventEndTime: new Date(data.eventEndTime),
      subStartTime: new Date(data.subStartTime),
      subEndTime: new Date(data.subEndTime),
      judgingStartTime: new Date(data.judgingStartTime),
      judgingEndTime: new Date(data.judgingEndTime),
      eligibilityRules: data.eligibilityRules,
      rulesAndGuidelines: data.rulesAndGuidelines,
    });

    await AuditService.log({
      userId: session.id,
      hackathonId: created.id,
      action: 'HACKATHON_CREATED',
      entityType: 'Hackathon',
      entityId: created.id,
      afterState: { id: created.id, title: created.title, slug: created.slug },
    });

    return successResponse({ hackathon: created }, 'Hackathon draft created successfully', 201);
  } catch (error: any) {
    const status = error.status || 500;
    const code = error.code || 'INTERNAL_ERROR';
    return errorResponse(error.message, code, status);
  }
}
