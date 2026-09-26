import { NextRequest } from 'next/server';
import { HackathonRepository } from '@/server/repositories/hackathon.repository';
import { HackathonPublishService } from '@/server/services/hackathon-publish.service';
import { requireRole } from '@/server/permissions/guards';
import { ResourceGuards } from '@/server/permissions/resource-guards';
import { successResponse, errorResponse } from '@/lib/api/response';
import { AuditService } from '@/server/services/audit.service';

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
        return errorResponse('You are not authorized to publish this hackathon', 'FORBIDDEN_RESOURCE', 403);
      }
    }

    const current = await HackathonRepository.findById(hackathonId);
    if (!current) {
      return errorResponse('Hackathon not found', 'NOT_FOUND', 404);
    }

    // Run strict publish readiness checks
    const readiness = HackathonPublishService.validatePublishReadiness(current);
    if (!readiness.canPublish) {
      return errorResponse(
        'Hackathon is not ready for publication. Please resolve missing configuration requirements.',
        'HACKATHON_NOT_READY_TO_PUBLISH',
        422,
        { missing: readiness.missingFields }
      );
    }

    const published = await HackathonRepository.update(hackathonId, {
      status: 'PUBLISHED',
    });

    await AuditService.log({
      userId: session.id,
      hackathonId,
      action: 'HACKATHON_PUBLISHED',
      entityType: 'Hackathon',
      entityId: hackathonId,
      beforeState: { status: current.status },
      afterState: { status: 'PUBLISHED' },
    });

    return successResponse(
      { hackathon: published },
      'Hackathon published successfully. It is now publicly discoverable.'
    );
  } catch (error: any) {
    const status = error.status || 500;
    const code = error.code || 'INTERNAL_ERROR';
    return errorResponse(error.message, code, status);
  }
}
