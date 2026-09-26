import { NextRequest } from 'next/server';
import { z } from 'zod';
import { TrackRepository } from '@/server/repositories/track.repository';
import { HackathonRepository } from '@/server/repositories/hackathon.repository';
import { requireRole } from '@/server/permissions/guards';
import { ResourceGuards } from '@/server/permissions/resource-guards';
import { successResponse, errorResponse } from '@/lib/api/response';
import { AuditService } from '@/server/services/audit.service';

const createTrackSchema = z.object({
  title: z.string().min(2, 'Track title must be at least 2 characters'),
  slug: z.string().min(2).optional(),
  description: z.string().optional(),
  colorHex: z.string().regex(/^#([0-9a-fA-F]{3}){1,2}$/, 'Invalid Hex color').optional(),
  displayOrder: z.number().int().min(0).default(0),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const hackathonId = params.id;
    const tracks = await TrackRepository.listByHackathon(hackathonId);
    return successResponse({ tracks });
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to list tracks', 'INTERNAL_ERROR', 500);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireRole(['ORGANIZER', 'ADMIN']);
    const hackathonId = params.id;

    if (session.role === 'ORGANIZER') {
      const canAccess = await ResourceGuards.canOrganizerAccessHackathon(session.id, hackathonId);
      if (!canAccess) {
        return errorResponse('You are not authorized to add tracks to this hackathon', 'FORBIDDEN_RESOURCE', 403);
      }
    }

    const hackathon = await HackathonRepository.findById(hackathonId);
    if (!hackathon) {
      return errorResponse('Hackathon not found', 'NOT_FOUND', 404);
    }

    const body = await req.json();
    const parsed = createTrackSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse('Invalid track payload', 'VALIDATION_ERROR', 422, parsed.error.format());
    }

    const data = parsed.data;
    const resolvedSlug = (data.slug || data.title)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const track = await TrackRepository.create({
      hackathonId,
      title: data.title,
      slug: resolvedSlug,
      description: data.description,
      colorHex: data.colorHex,
      displayOrder: data.displayOrder,
    });

    await AuditService.log({
      userId: session.id,
      hackathonId,
      action: 'TRACK_CREATED',
      entityType: 'Track',
      entityId: track.id,
      afterState: { id: track.id, title: track.title },
    });

    return successResponse({ track }, 'Track created successfully', 201);
  } catch (error: any) {
    const status = error.status || 500;
    const code = error.code || 'INTERNAL_ERROR';
    return errorResponse(error.message, code, status);
  }
}
