import { NextRequest } from 'next/server';
import { z } from 'zod';
import { TrackRepository } from '@/server/repositories/track.repository';
import { requireRole } from '@/server/permissions/guards';
import { ResourceGuards } from '@/server/permissions/resource-guards';
import { successResponse, errorResponse } from '@/lib/api/response';
import { AuditService } from '@/server/services/audit.service';

const updateTrackSchema = z.object({
  title: z.string().min(2).optional(),
  slug: z.string().min(2).optional(),
  description: z.string().optional(),
  colorHex: z.string().regex(/^#([0-9a-fA-F]{3}){1,2}$/, 'Invalid Hex color').optional(),
  displayOrder: z.number().int().min(0).optional(),
});

export async function PATCH(
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
        return errorResponse('You are not authorized to modify this track', 'FORBIDDEN_RESOURCE', 403);
      }
    }

    const body = await req.json();
    const parsed = updateTrackSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse('Invalid track payload', 'VALIDATION_ERROR', 422, parsed.error.format());
    }

    const updated = await TrackRepository.update(trackId, parsed.data);

    await AuditService.log({
      userId: session.id,
      hackathonId: track.hackathon.id,
      action: 'TRACK_UPDATED',
      entityType: 'Track',
      entityId: trackId,
      beforeState: { title: track.title },
      afterState: { title: updated.title },
    });

    return successResponse({ track: updated }, 'Track updated successfully');
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
    const trackId = params.id;

    const track = await TrackRepository.findById(trackId);
    if (!track) {
      return errorResponse('Track not found', 'NOT_FOUND', 404);
    }

    if (session.role === 'ORGANIZER') {
      const canAccess = await ResourceGuards.canOrganizerAccessHackathon(session.id, track.hackathon.id);
      if (!canAccess) {
        return errorResponse('You are not authorized to delete this track', 'FORBIDDEN_RESOURCE', 403);
      }
    }

    await TrackRepository.delete(trackId);

    await AuditService.log({
      userId: session.id,
      hackathonId: track.hackathon.id,
      action: 'TRACK_DELETED',
      entityType: 'Track',
      entityId: trackId,
      beforeState: { title: track.title },
    });

    return successResponse(null, 'Track deleted successfully');
  } catch (error: any) {
    const status = error.status || 500;
    const code = error.code || 'INTERNAL_ERROR';
    return errorResponse(error.message, code, status);
  }
}
