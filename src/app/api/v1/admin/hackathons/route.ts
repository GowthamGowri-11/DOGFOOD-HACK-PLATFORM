import { NextRequest } from 'next/server';
import { requireRole } from '@/server/permissions/guards';
import { HackathonRepository } from '@/server/repositories/hackathon.repository';
import { HackathonLifecycleService } from '@/server/services/hackathon-lifecycle.service';
import { AuditService } from '@/server/services/audit.service';
import { successResponse, errorResponse } from '@/lib/api/response';
import { EventStatus } from '@prisma/client';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await requireRole('ADMIN');

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || undefined;
    const status = (searchParams.get('status') as EventStatus) || undefined;
    const organizerId = searchParams.get('organizerId') || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);

    const result = await HackathonRepository.listAdminPaginated({
      search,
      status,
      organizerId,
      page,
      pageSize,
    });

    return successResponse(result);
  } catch (error: any) {
    if (error.status === 403 || error.code === 'FORBIDDEN_ROLE') {
      return errorResponse(error.message, 'FORBIDDEN', 403);
    }
    if (error.status === 401 || error.code === 'UNAUTHORIZED') {
      return errorResponse(error.message, 'UNAUTHORIZED', 401);
    }
    return errorResponse(error.message || 'Failed to list hackathons', 'INTERNAL_ERROR', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireRole('ADMIN');
    const body = await req.json();

    const {
      title,
      slug,
      tagline,
      description,
      organizationName,
      organizerId,
      status = 'DRAFT',
      minTeamSize = 1,
      maxTeamSize = 4,
      bannerUrl,
      logoUrl,
      regStartTime,
      regEndTime,
      eventStartTime,
      eventEndTime,
      subStartTime,
      subEndTime,
      judgingStartTime,
      judgingEndTime,
      eligibilityRules,
      rulesAndGuidelines,
    } = body;

    // Validate required fields
    if (!title || !slug || !description || !organizationName) {
      return errorResponse('Title, slug, description, and organization name are required', 'VALIDATION_ERROR', 400);
    }

    // Auto-calibrate lifecycle window dates to ensure valid sequencing
    const nowTime = Date.now();
    const finalRegStart = regStartTime ? new Date(regStartTime) : new Date(nowTime - 60000);
    let finalRegEnd = regEndTime ? new Date(regEndTime) : new Date(nowTime + 7 * 86400000);
    if (finalRegEnd <= finalRegStart) finalRegEnd = new Date(finalRegStart.getTime() + 7 * 86400000);

    let finalEventStart = eventStartTime ? new Date(eventStartTime) : finalRegEnd;
    if (finalEventStart < finalRegStart) finalEventStart = finalRegStart;
    let finalEventEnd = eventEndTime ? new Date(eventEndTime) : new Date(finalEventStart.getTime() + 3 * 86400000);
    if (finalEventEnd <= finalEventStart) finalEventEnd = new Date(finalEventStart.getTime() + 3 * 86400000);

    let finalSubStart = subStartTime ? new Date(subStartTime) : finalEventStart;
    if (finalSubStart < finalRegStart) finalSubStart = finalRegStart;
    let finalSubEnd = subEndTime ? new Date(subEndTime) : finalEventEnd;
    if (finalSubEnd <= finalSubStart) finalSubEnd = new Date(finalSubStart.getTime() + 2 * 86400000);

    let finalJudgingStart = judgingStartTime ? new Date(judgingStartTime) : finalSubEnd;
    if (finalJudgingStart < finalSubStart) finalJudgingStart = finalSubEnd;
    let finalJudgingEnd = judgingEndTime ? new Date(judgingEndTime) : new Date(finalJudgingStart.getTime() + 86400000);
    if (finalJudgingEnd <= finalJudgingStart) finalJudgingEnd = new Date(finalJudgingStart.getTime() + 86400000);

    // Validate dates
    const dateValidation = HackathonLifecycleService.validateDates({
      regStartTime: finalRegStart,
      regEndTime: finalRegEnd,
      eventStartTime: finalEventStart,
      eventEndTime: finalEventEnd,
      subStartTime: finalSubStart,
      subEndTime: finalSubEnd,
      judgingStartTime: finalJudgingStart,
      judgingEndTime: finalJudgingEnd,
    });

    if (!dateValidation.isValid) {
      return errorResponse(dateValidation.errors.join('; '), 'VALIDATION_ERROR', 400);
    }

    // Check slug uniqueness
    const slugExists = await HackathonRepository.checkSlugExists(slug);
    if (slugExists) {
      return errorResponse(`Hackathon slug "${slug}" is already in use.`, 'CONFLICT', 409);
    }

    // Determine target organizer
    const finalOrganizerId = organizerId || session.id;
    const targetOrganizer = await prisma.user.findUnique({
      where: { id: finalOrganizerId },
    });

    if (!targetOrganizer) {
      return errorResponse('Assigned organizer not found', 'NOT_FOUND', 404);
    }

    // Create hackathon
    const hackathon = await HackathonRepository.create({
      title,
      slug,
      tagline,
      description,
      organizationName,
      organizerId: finalOrganizerId,
      status: status as EventStatus,
      minTeamSize: Number(minTeamSize),
      maxTeamSize: Number(maxTeamSize),
      bannerUrl,
      logoUrl,
      regStartTime: finalRegStart,
      regEndTime: finalRegEnd,
      eventStartTime: finalEventStart,
      eventEndTime: finalEventEnd,
      subStartTime: finalSubStart,
      subEndTime: finalSubEnd,
      judgingStartTime: finalJudgingStart,
      judgingEndTime: finalJudgingEnd,
      eligibilityRules,
      rulesAndGuidelines,
    });

    // Handle Prizes / Prize Pool
    if (body.prizes && Array.isArray(body.prizes) && body.prizes.length > 0) {
      await prisma.prize.createMany({
        data: body.prizes.map((p: any, idx: number) => ({
          hackathonId: hackathon.id,
          title: p.title || `Prize ${idx + 1}`,
          category: p.category || 'General',
          amount: Number(p.amount) || 0,
          currency: p.currency || body.currency || 'USD',
          rankOrder: p.rankOrder || idx + 1,
          description: p.description || '',
        })),
      });
    } else if (body.prizePool !== undefined && Number(body.prizePool) > 0) {
      await prisma.prize.create({
        data: {
          hackathonId: hackathon.id,
          title: 'Total Prize Pool',
          category: 'Grand Pool',
          amount: Number(body.prizePool),
          currency: body.currency || 'USD',
          rankOrder: 1,
          description: 'Platform competition prize pool',
        },
      });
    }

    // Handle Tracks & Problem Statements
    if (body.tracks && Array.isArray(body.tracks) && body.tracks.length > 0) {
      for (let tIdx = 0; tIdx < body.tracks.length; tIdx++) {
        const trackData = body.tracks[tIdx];
        const resolvedTrackSlug = (trackData.slug || trackData.title)
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '') || `track-${tIdx + 1}`;

        const createdTrack = await prisma.track.create({
          data: {
            hackathonId: hackathon.id,
            title: trackData.title.trim(),
            slug: `${resolvedTrackSlug}-${Math.random().toString(36).substring(2, 6)}`,
            description: trackData.description?.trim() || null,
            colorHex: trackData.colorHex || '#2563EB',
            displayOrder: trackData.displayOrder ?? tIdx,
          },
        });

        if (trackData.problemStatements && Array.isArray(trackData.problemStatements)) {
          for (let pIdx = 0; pIdx < trackData.problemStatements.length; pIdx++) {
            const psData = trackData.problemStatements[pIdx];
            if (psData.title?.trim()) {
              await prisma.problemStatement.create({
                data: {
                  hackathonId: hackathon.id,
                  trackId: createdTrack.id,
                  code: psData.code?.trim().toUpperCase() || `PS-${tIdx + 1}${pIdx + 1}`,
                  title: psData.title.trim(),
                  description: psData.description?.trim() || psData.title.trim(),
                  challengeDocUrl: psData.challengeDocUrl?.trim() || null,
                  isPublic: psData.isPublic !== false,
                  displayOrder: psData.displayOrder ?? pIdx,
                },
              });
            }
          }
        }
      }
    }

    // Audit log
    await AuditService.log({
      userId: session.id,
      hackathonId: hackathon.id,
      action: 'HACKATHON_CREATED',
      entityType: 'Hackathon',
      entityId: hackathon.id,
      afterState: {
        title: hackathon.title,
        slug: hackathon.slug,
        organizerId: hackathon.organizerId,
        status: hackathon.status,
      },
    });

    // Revalidate paths for cross-role propagation
    try {
      revalidatePath('/hackathons');
      revalidatePath('/admin/hackathons');
      revalidatePath('/organizer/hackathons');
      revalidatePath('/organizer/dashboard');
    } catch {
      // Ignore during test/static builds
    }

    return successResponse(hackathon, 'Hackathon created successfully', 201);
  } catch (error: any) {
    if (error.status === 403 || error.code === 'FORBIDDEN_ROLE') {
      return errorResponse(error.message, 'FORBIDDEN', 403);
    }
    if (error.status === 401 || error.code === 'UNAUTHORIZED') {
      return errorResponse(error.message, 'UNAUTHORIZED', 401);
    }
    return errorResponse(error.message || 'Failed to create hackathon', 'INTERNAL_ERROR', 500);
  }
}
