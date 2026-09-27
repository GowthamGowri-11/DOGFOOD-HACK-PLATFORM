import { NextRequest } from 'next/server';
import { z } from 'zod';
import { HackathonRepository } from '@/server/repositories/hackathon.repository';
import { HackathonLifecycleService } from '@/server/services/hackathon-lifecycle.service';
import { HackathonService } from '@/server/services/hackathon.service';
import { requireAuth, requireRole } from '@/server/permissions/guards';
import { successResponse, errorResponse } from '@/lib/api/response';
import { AuditService } from '@/server/services/audit.service';
import { EventStatus } from '@prisma/client';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

const problemStatementInputSchema = z.object({
  id: z.string().optional(),
  code: z.string().min(1),
  title: z.string().min(2),
  description: z.string().min(5),
  challengeDocUrl: z.string().optional().or(z.literal('')),
  isPublic: z.boolean().default(true),
  displayOrder: z.number().int().default(0),
});

const trackInputSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(2),
  slug: z.string().optional(),
  description: z.string().optional(),
  colorHex: z.string().optional(),
  displayOrder: z.number().int().default(0),
  problemStatements: z.array(problemStatementInputSchema).optional().default([]),
});

const createHackathonSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  slug: z.string().min(3).optional(),
  tagline: z.string().optional(),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  organizationName: z.string().min(2, 'Organization name is required'),
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
  ]).default('DRAFT'),
  minTeamSize: z.number().int().min(1).default(1),
  maxTeamSize: z.number().int().max(10).default(4),
  regStartTime: z.string().datetime().or(z.string()),
  regEndTime: z.string().datetime().or(z.string()),
  eventStartTime: z.string().datetime().or(z.string()),
  eventEndTime: z.string().datetime().or(z.string()),
  subStartTime: z.string().datetime().or(z.string()),
  subEndTime: z.string().datetime().or(z.string()),
  judgingStartTime: z.string().datetime().or(z.string()),
  judgingEndTime: z.string().datetime().or(z.string()),
  eligibilityRules: z.string().optional(),
  rulesAndGuidelines: z.string().optional(),
  // Flexible for uploaded assets + prize fields from both branches
  bannerUrl: z.string().optional().or(z.literal('')).or(z.null()),
  logoUrl: z.string().optional().or(z.literal('')).or(z.null()),
  tracks: z.array(trackInputSchema).optional().default([]),
  prizePool: z.number().optional().or(z.string()),
  currency: z.string().default('USD'),
  prizes: z.array(z.any()).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || undefined;
    const status = (searchParams.get('status') as EventStatus) || undefined;
    const trackSlug = searchParams.get('track') || undefined;
    const mine = searchParams.get('mine') === 'true';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);

    if (mine) {
      const session = await requireAuth();
      const hackathons = await HackathonRepository.listByOrganizer(session.id);
      return successResponse({
        hackathons,
        pagination: {
          total: hackathons.length,
          page: 1,
          pageSize: hackathons.length || 1,
          totalPages: 1,
          hasMore: false,
        },
      });
    }

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

    // Auto-calibrate and validate event dates
    const nowTime = Date.now();
    const finalRegStart = data.regStartTime ? new Date(data.regStartTime) : new Date(nowTime - 60000);
    let finalRegEnd = data.regEndTime ? new Date(data.regEndTime) : new Date(nowTime + 7 * 86400000);
    if (finalRegEnd <= finalRegStart) finalRegEnd = new Date(finalRegStart.getTime() + 7 * 86400000);

    let finalEventStart = data.eventStartTime ? new Date(data.eventStartTime) : finalRegEnd;
    if (finalEventStart < finalRegStart) finalEventStart = finalRegStart;
    let finalEventEnd = data.eventEndTime ? new Date(data.eventEndTime) : new Date(finalEventStart.getTime() + 3 * 86400000);
    if (finalEventEnd <= finalEventStart) finalEventEnd = new Date(finalEventStart.getTime() + 3 * 86400000);

    let finalSubStart = data.subStartTime ? new Date(data.subStartTime) : finalEventStart;
    if (finalSubStart < finalRegStart) finalSubStart = finalRegStart;
    let finalSubEnd = data.subEndTime ? new Date(data.subEndTime) : finalEventEnd;
    if (finalSubEnd <= finalSubStart) finalSubEnd = new Date(finalSubStart.getTime() + 2 * 86400000);

    let finalJudgingStart = data.judgingStartTime ? new Date(data.judgingStartTime) : finalSubEnd;
    if (finalJudgingStart < finalSubStart) finalJudgingStart = finalSubEnd;
    let finalJudgingEnd = data.judgingEndTime ? new Date(data.judgingEndTime) : new Date(finalJudgingStart.getTime() + 86400000);
    if (finalJudgingEnd <= finalJudgingStart) finalJudgingEnd = new Date(finalJudgingStart.getTime() + 86400000);

    const dateCheck = HackathonLifecycleService.validateDates({
      regStartTime: finalRegStart,
      regEndTime: finalRegEnd,
      eventStartTime: finalEventStart,
      eventEndTime: finalEventEnd,
      subStartTime: finalSubStart,
      subEndTime: finalSubEnd,
      judgingStartTime: finalJudgingStart,
      judgingEndTime: finalJudgingEnd,
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

    // Enforce organizer ownership strictly on the server:
    // Organizer creates for their own account; Admin can optionally specify target organizerId
    const finalOrganizerId = (session.role === 'ADMIN' && body.organizerId) ? body.organizerId : session.id;

    const created = await HackathonRepository.create({
      title: data.title,
      slug: resolvedSlug,
      tagline: data.tagline,
      description: data.description,
      organizationName: data.organizationName,
      organizerId: finalOrganizerId,
      status: (data.status as EventStatus) || 'DRAFT',
      minTeamSize: data.minTeamSize,
      maxTeamSize: data.maxTeamSize,
      bannerUrl: data.bannerUrl || undefined,
      logoUrl: data.logoUrl || undefined,
      regStartTime: finalRegStart,
      regEndTime: finalRegEnd,
      eventStartTime: finalEventStart,
      eventEndTime: finalEventEnd,
      subStartTime: finalSubStart,
      subEndTime: finalSubEnd,
      judgingStartTime: finalJudgingStart,
      judgingEndTime: finalJudgingEnd,
      eligibilityRules: data.eligibilityRules,
      rulesAndGuidelines: data.rulesAndGuidelines,
    });

    // Create Tracks and Problem Statements if provided (structured tracks payload)
    if (data.tracks && data.tracks.length > 0) {
      for (let tIdx = 0; tIdx < data.tracks.length; tIdx++) {
        const trackData = data.tracks[tIdx];
        const resolvedTrackSlug = (trackData.slug || trackData.title)
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '') || `track-${tIdx + 1}`;

        const createdTrack = await prisma.track.create({
          data: {
            hackathonId: created.id,
            title: trackData.title.trim(),
            slug: `${resolvedTrackSlug}-${Math.random().toString(36).substring(2, 6)}`,
            description: trackData.description?.trim(),
            colorHex: trackData.colorHex || '#2563EB',
            displayOrder: trackData.displayOrder ?? tIdx,
          },
        });

        if (trackData.problemStatements && trackData.problemStatements.length > 0) {
          for (let pIdx = 0; pIdx < trackData.problemStatements.length; pIdx++) {
            const psData = trackData.problemStatements[pIdx];
            await prisma.problemStatement.create({
              data: {
                hackathonId: created.id,
                trackId: createdTrack.id,
                code: psData.code.trim().toUpperCase() || `PS-${tIdx + 1}${pIdx + 1}`,
                title: psData.title.trim(),
                description: psData.description.trim(),
                challengeDocUrl: psData.challengeDocUrl?.trim() || null,
                isPublic: psData.isPublic !== false,
                displayOrder: psData.displayOrder ?? pIdx,
              },
            });
          }
        }
      }
    } else if (data.rulesAndGuidelines) {
      // Fallback: auto-create tracks/PSs from JSON embedded in rulesAndGuidelines
      try {
        const parsedRules = JSON.parse(data.rulesAndGuidelines);
        if (parsedRules.problemStatements && Array.isArray(parsedRules.problemStatements) && parsedRules.problemStatements.length > 0) {
          const trackMap = new Map<string, any[]>();
          for (const ps of parsedRules.problemStatements) {
            const trackName = ps.track || 'General Track';
            if (!trackMap.has(trackName)) {
              trackMap.set(trackName, []);
            }
            trackMap.get(trackName)!.push(ps);
          }

          let order = 1;
          const entries = Array.from(trackMap.entries());
          for (const [trackName, psList] of entries) {
            const trackSlug = trackName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            const createdTrack = await prisma.track.create({
              data: {
                hackathonId: created.id,
                title: trackName,
                slug: `${trackSlug}-${Date.now().toString(36)}`,
                description: `Challenge track for ${trackName}`,
                displayOrder: order++,
              },
            });

            let psOrder = 1;
            for (const ps of psList) {
              await prisma.problemStatement.create({
                data: {
                  hackathonId: created.id,
                  trackId: createdTrack.id,
                  code: ps.code || `PS-${psOrder}`,
                  title: ps.title,
                  description: ps.description || '',
                  displayOrder: psOrder++,
                  isPublic: true,
                },
              });
            }
          }
        }
      } catch {
        // Fallback gracefully if rulesAndGuidelines is plain text
      }
    }

    // Handle Prizes / Prize Pool
    const numericPrizePool = Number(data.prizePool) || 0;
    if (data.prizes && Array.isArray(data.prizes) && data.prizes.length > 0) {
      await prisma.prize.createMany({
        data: data.prizes.map((p: any, idx: number) => ({
          hackathonId: created.id,
          title: p.title || `Prize ${idx + 1}`,
          category: p.category || 'General',
          amount: Number(p.amount) || 0,
          currency: p.currency || data.currency || 'USD',
          rankOrder: p.rankOrder || idx + 1,
          description: p.description || '',
        })),
      });
    } else if (numericPrizePool > 0) {
      await prisma.prize.create({
        data: {
          hackathonId: created.id,
          title: 'Total Prize Pool',
          category: 'Grand Pool',
          amount: numericPrizePool,
          currency: data.currency || 'USD',
          rankOrder: 1,
          description: 'Platform competition reward pool',
        },
      });
    }

    await AuditService.log({
      userId: session.id,
      hackathonId: created.id,
      action: 'HACKATHON_CREATED',
      entityType: 'Hackathon',
      entityId: created.id,
      afterState: { id: created.id, title: created.title, slug: created.slug, status: created.status },
    });

    try {
      revalidatePath('/hackathons');
      revalidatePath('/organizer/hackathons');
      revalidatePath('/organizer/dashboard');
      revalidatePath('/admin/hackathons');
    } catch {
      // Ignore during build/tests
    }

    return successResponse({ hackathon: created }, 'Hackathon created successfully', 201);
  } catch (error: any) {
    const status = error.status || 500;
    const code = error.code || 'INTERNAL_ERROR';
    return errorResponse(error.message, code, status);
  }
}
