import { NextRequest } from 'next/server';
import { requireRole } from '@/server/permissions/guards';
import { HackathonRepository } from '@/server/repositories/hackathon.repository';
import { HackathonLifecycleService } from '@/server/services/hackathon-lifecycle.service';
import { AuditService } from '@/server/services/audit.service';
import { successResponse, errorResponse } from '@/lib/api/response';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireRole('ADMIN');
    const { id } = params;

    const hackathon = await prisma.hackathon.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      include: {
        organizer: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
          },
        },
        tracks: {
          include: {
            problemStatements: true,
          },
          orderBy: { displayOrder: 'asc' },
        },
        prizes: {
          orderBy: { rankOrder: 'asc' },
        },
        judges: {
          include: {
            user: { select: { id: true, fullName: true, email: true } },
          },
        },
        _count: {
          select: {
            registrations: true,
            projects: true,
            judges: true,
          },
        },
      },
    });

    if (!hackathon) {
      return errorResponse('Hackathon not found', 'NOT_FOUND', 404);
    }

    const submissionCount = await prisma.submission.count({
      where: {
        project: { hackathonId: hackathon.id },
        status: { in: ['SUBMITTED', 'LOCKED'] },
      },
    });

    return successResponse({
      ...hackathon,
      _count: {
        ...hackathon._count,
        submissions: submissionCount,
      },
    });
  } catch (error: any) {
    if (error.status === 403 || error.code === 'FORBIDDEN_ROLE' || error.code === 'FORBIDDEN') {
      return errorResponse(error.message, 'FORBIDDEN', 403);
    }
    if (error.status === 401 || error.code === 'UNAUTHORIZED') {
      return errorResponse(error.message, 'UNAUTHORIZED', 401);
    }
    return errorResponse(error.message || 'Failed to fetch hackathon', 'INTERNAL_ERROR', 500);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireRole('ADMIN');
    const { id } = params;
    const body = await req.json();

    const existing = (await HackathonRepository.findById(id)) || (await HackathonRepository.findBySlug(id, true));
    if (!existing) {
      return errorResponse('Hackathon not found', 'NOT_FOUND', 404);
    }
    const resolvedId = existing.id;

    // Check slug uniqueness if changed
    if (body.slug && body.slug !== existing.slug) {
      const slugExists = await HackathonRepository.checkSlugExists(body.slug, resolvedId);
      if (slugExists) {
        return errorResponse(`Hackathon slug "${body.slug}" is already in use.`, 'CONFLICT', 409);
      }
    }

    // If dates are provided, validate them
    if (
      body.regStartTime ||
      body.regEndTime ||
      body.eventStartTime ||
      body.eventEndTime ||
      body.subStartTime ||
      body.subEndTime ||
      body.judgingStartTime ||
      body.judgingEndTime
    ) {
      const datesToValidate = {
        regStartTime: body.regStartTime || existing.regStartTime,
        regEndTime: body.regEndTime || existing.regEndTime,
        eventStartTime: body.eventStartTime || existing.eventStartTime,
        eventEndTime: body.eventEndTime || existing.eventEndTime,
        subStartTime: body.subStartTime || existing.subStartTime,
        subEndTime: body.subEndTime || existing.subEndTime,
        judgingStartTime: body.judgingStartTime || existing.judgingStartTime,
        judgingEndTime: body.judgingEndTime || existing.judgingEndTime,
      };

      const dateValidation = HackathonLifecycleService.validateDates(datesToValidate);
      if (!dateValidation.isValid) {
        return errorResponse(dateValidation.errors.join('; '), 'VALIDATION_ERROR', 400);
      }
    }

    const updateData: any = {};
    const allowedFields = [
      'title',
      'slug',
      'tagline',
      'description',
      'organizationName',
      'minTeamSize',
      'maxTeamSize',
      'bannerUrl',
      'logoUrl',
      'eligibilityRules',
      'rulesAndGuidelines',
      'progressionMode',
    ];

    allowedFields.forEach((field) => {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    });

    const dateFields = [
      'regStartTime',
      'regEndTime',
      'eventStartTime',
      'eventEndTime',
      'subStartTime',
      'subEndTime',
      'judgingStartTime',
      'judgingEndTime',
    ];

    dateFields.forEach((field) => {
      if (body[field]) {
        updateData[field] = new Date(body[field]);
      }
    });

    const updated = await HackathonRepository.update(resolvedId, updateData);

    // Sync rounds if provided
    let roundsToSync: any[] = [];
    if (Array.isArray(body.rounds)) {
      roundsToSync = body.rounds;
    } else if (body.rulesAndGuidelines) {
      try {
        const parsed = JSON.parse(body.rulesAndGuidelines);
        if (Array.isArray(parsed.rounds)) roundsToSync = parsed.rounds;
      } catch {
        // ignore
      }
    }
    if (roundsToSync.length > 0) {
      const { RoundProgressionService } = await import('@/server/services/round-progression.service');
      await RoundProgressionService.syncRoundsFromConfig(resolvedId, roundsToSync);
    }

    // Handle Prizes / Prize Pool updates
    if (body.prizes && Array.isArray(body.prizes)) {
      await prisma.prize.deleteMany({ where: { hackathonId: resolvedId } });
      if (body.prizes.length > 0) {
        await prisma.prize.createMany({
          data: body.prizes.map((p: any, idx: number) => ({
            hackathonId: resolvedId,
            title: p.title || `Prize ${idx + 1}`,
            category: p.category || 'General',
            amount: Number(p.amount) || 0,
            currency: p.currency || body.currency || 'USD',
            rankOrder: p.rankOrder || idx + 1,
            description: p.description || '',
          })),
        });
      }
    } else if (body.prizePool !== undefined) {
      const amount = Number(body.prizePool) || 0;
      await prisma.prize.deleteMany({ where: { hackathonId: resolvedId } });
      if (amount > 0) {
        await prisma.prize.create({
          data: {
            hackathonId: resolvedId,
            title: 'Total Prize Pool',
            category: 'Grand Pool',
            amount: amount,
            currency: body.currency || 'USD',
            rankOrder: 1,
            description: 'Platform competition prize pool',
          },
        });
      }
    }

    // Handle Tracks & Problem Statements updates
    if (body.tracks && Array.isArray(body.tracks)) {
      const existingTracks = await prisma.track.findMany({
        where: { hackathonId: resolvedId },
        include: { problemStatements: true },
      });

      const processedTrackIds = new Set<string>();

      // Upsert tracks & problem statements
      for (let tIdx = 0; tIdx < body.tracks.length; tIdx++) {
        const t = body.tracks[tIdx];
        if (!t.title?.trim()) continue;

        const resolvedSlug = (t.slug || t.title)
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '') || `track-${tIdx + 1}`;

        // Match existing track by ID or by exact title
        const matchedTrack = existingTracks.find(
          (et) => (t.id && et.id === t.id) || et.title.toLowerCase().trim() === t.title.toLowerCase().trim()
        );

        let currentTrackId: string;

        if (matchedTrack) {
          currentTrackId = matchedTrack.id;
          await prisma.track.update({
            where: { id: matchedTrack.id },
            data: {
              title: t.title.trim(),
              description: t.description?.trim() || null,
              colorHex: t.colorHex || '#2563EB',
              displayOrder: t.displayOrder ?? tIdx,
            },
          });
        } else {
          // Create new track
          const newTrack = await prisma.track.create({
            data: {
              hackathonId: resolvedId,
              title: t.title.trim(),
              slug: `${resolvedSlug}-${Math.random().toString(36).substring(2, 6)}`,
              description: t.description?.trim() || null,
              colorHex: t.colorHex || '#2563EB',
              displayOrder: t.displayOrder ?? tIdx,
            },
          });
          currentTrackId = newTrack.id;
        }

        processedTrackIds.add(currentTrackId);

        // Handle Problem Statements for this track
        if (t.problemStatements && Array.isArray(t.problemStatements)) {
          const existingProblems = await prisma.problemStatement.findMany({
            where: { trackId: currentTrackId },
          });

          const processedProblemIds = new Set<string>();

          // Upsert problem statements safely without uniqueness collisions
          for (let pIdx = 0; pIdx < t.problemStatements.length; pIdx++) {
            const p = t.problemStatements[pIdx];
            if (!p.title?.trim()) continue;

            const codeVal = (p.code?.trim().toUpperCase() || `PS-${tIdx + 1}${pIdx + 1}`);

            // Find existing by ID or by (hackathonId, code) or by title within this track
            const existingProblemInDb = await prisma.problemStatement.findFirst({
              where: {
                hackathonId: resolvedId,
                OR: [
                  ...(p.id ? [{ id: p.id }] : []),
                  { code: codeVal },
                  { title: { equals: p.title.trim(), mode: 'insensitive' }, trackId: currentTrackId },
                ],
              },
            });

            if (existingProblemInDb) {
              processedProblemIds.add(existingProblemInDb.id);
              await prisma.problemStatement.update({
                where: { id: existingProblemInDb.id },
                data: {
                  trackId: currentTrackId,
                  code: codeVal,
                  title: p.title.trim(),
                  description: p.description?.trim() || p.title.trim(),
                  challengeDocUrl: p.challengeDocUrl?.trim() || null,
                  isPublic: p.isPublic !== false,
                  displayOrder: p.displayOrder ?? pIdx,
                },
              });
            } else {
              let finalCode = codeVal;
              let collision = await prisma.problemStatement.findUnique({
                where: { hackathonId_code: { hackathonId: resolvedId, code: finalCode } },
              });
              let suffix = 1;
              while (collision) {
                finalCode = `${codeVal}-${suffix++}`;
                collision = await prisma.problemStatement.findUnique({
                  where: { hackathonId_code: { hackathonId: resolvedId, code: finalCode } },
                });
              }

              const createdPs = await prisma.problemStatement.create({
                data: {
                  hackathonId: resolvedId,
                  trackId: currentTrackId,
                  code: finalCode,
                  title: p.title.trim(),
                  description: p.description?.trim() || p.title.trim(),
                  challengeDocUrl: p.challengeDocUrl?.trim() || null,
                  isPublic: p.isPublic !== false,
                  displayOrder: p.displayOrder ?? pIdx,
                },
              });
              processedProblemIds.add(createdPs.id);
            }
          }

          // Delete unreferenced removed problems safely
          for (const exProb of existingProblems) {
            if (!processedProblemIds.has(exProb.id)) {
              const projCount = await prisma.project.count({ where: { problemId: exProb.id } });
              if (projCount === 0) {
                try {
                  await prisma.problemStatement.delete({ where: { id: exProb.id } });
                } catch {
                  // Ignore foreign key restrictions
                }
              }
            }
          }
        }
      }

      // Delete removed tracks only if completely unreferenced by projects or problem statements
      for (const exTrack of existingTracks) {
        if (!processedTrackIds.has(exTrack.id)) {
          const referencedProjectCount = await prisma.project.count({
            where: {
              OR: [
                { trackId: exTrack.id },
                { problemStatement: { trackId: exTrack.id } },
              ],
            },
          });
          if (referencedProjectCount === 0) {
            try {
              await prisma.problemStatement.deleteMany({ where: { trackId: exTrack.id } });
              await prisma.track.delete({ where: { id: exTrack.id } });
            } catch {
              // Ignore foreign key restrictions
            }
          }
        }
      }
    }

    await AuditService.log({
      userId: session.id,
      hackathonId: resolvedId,
      action: 'HACKATHON_UPDATED',
      entityType: 'Hackathon',
      entityId: resolvedId,
      beforeState: {
        title: existing.title,
        slug: existing.slug,
        organizationName: existing.organizationName,
      },
      afterState: updateData,
    });

    try {
      revalidatePath('/hackathons');
      revalidatePath(`/hackathons/${updated.slug}`);
      revalidatePath('/admin/hackathons');
      revalidatePath(`/admin/hackathons/${id}`);
      revalidatePath('/organizer/hackathons');
    } catch {
      // Ignore during test/static builds
    }

    return successResponse(updated, 'Hackathon updated successfully');
  } catch (error: any) {
    if (error.status === 403 || error.code === 'FORBIDDEN_ROLE') {
      return errorResponse(error.message, 'FORBIDDEN', 403);
    }
    if (error.status === 401 || error.code === 'UNAUTHORIZED') {
      return errorResponse(error.message, 'UNAUTHORIZED', 401);
    }
    return errorResponse(error.message || 'Failed to update hackathon', 'INTERNAL_ERROR', 500);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireRole('ADMIN');
    const { id } = params;

    const existing = (await HackathonRepository.findById(id)) || (await HackathonRepository.findBySlug(id, true));
    if (!existing) {
      return errorResponse('Hackathon not found', 'NOT_FOUND', 404);
    }
    const resolvedId = existing.id;

    // Safety checks: reject if submissions, results, or certificates exist
    const [submissionCount, resultCount, certificateCount] = await Promise.all([
      prisma.submission.count({
        where: { project: { hackathonId: resolvedId } },
      }),
      prisma.result.count({
        where: { hackathonId: resolvedId },
      }),
      prisma.certificate.count({
        where: { hackathonId: resolvedId },
      }),
    ]);

    if (submissionCount > 0 || resultCount > 0 || certificateCount > 0) {
      return errorResponse(
        `Cannot hard-delete hackathon with active historical records (${submissionCount} submissions, ${resultCount} results, ${certificateCount} certificates). Please archive or transition status instead.`,
        'BUSINESS_RULE_VIOLATION',
        400
      );
    }

    await prisma.$transaction(async (tx) => {
      // Clean up child dependencies safely
      await tx.problemStatement.deleteMany({
        where: { track: { hackathonId: resolvedId } },
      });
      await tx.track.deleteMany({ where: { hackathonId: resolvedId } });
      await tx.prize.deleteMany({ where: { hackathonId: resolvedId } });
      await tx.judge.deleteMany({ where: { hackathonId: resolvedId } });
      await tx.teamMember.deleteMany({ where: { team: { hackathonId: resolvedId } } });
      await tx.team.deleteMany({ where: { hackathonId: resolvedId } });
      await tx.registration.deleteMany({ where: { hackathonId: resolvedId } });
      await tx.hackathon.delete({ where: { id: resolvedId } });
    });

    await AuditService.log({
      userId: session.id,
      action: 'HACKATHON_DELETED',
      entityType: 'Hackathon',
      entityId: resolvedId,
      beforeState: { title: existing.title, slug: existing.slug },
    });

    try {
      revalidatePath('/hackathons');
      revalidatePath('/admin/hackathons');
      revalidatePath('/organizer/hackathons');
    } catch {
      // Ignore during test/static builds
    }

    return successResponse({ deleted: true }, 'Hackathon deleted safely');
  } catch (error: any) {
    if (error.status === 403 || error.code === 'FORBIDDEN_ROLE') {
      return errorResponse(error.message, 'FORBIDDEN', 403);
    }
    if (error.status === 401 || error.code === 'UNAUTHORIZED') {
      return errorResponse(error.message, 'UNAUTHORIZED', 401);
    }
    return errorResponse(error.message || 'Failed to delete hackathon', 'INTERNAL_ERROR', 500);
  }
}
