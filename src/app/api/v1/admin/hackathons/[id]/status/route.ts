import { NextRequest } from 'next/server';
import { requireRole } from '@/server/permissions/guards';
import { HackathonLifecycleService } from '@/server/services/hackathon-lifecycle.service';
import { AuditService } from '@/server/services/audit.service';
import { successResponse, errorResponse } from '@/lib/api/response';
import { EventStatus } from '@prisma/client';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireRole('ADMIN');
    const { id } = params;
    const body = await req.json();
    const { status } = body as { status: EventStatus };

    if (!status) {
      return errorResponse('status is required', 'VALIDATION_ERROR', 400);
    }

    const hackathon = await prisma.hackathon.findUnique({
      where: { id },
    });

    if (!hackathon) {
      return errorResponse('Hackathon not found', 'NOT_FOUND', 404);
    }

    // Verify lifecycle transition validity
    const canTransition = HackathonLifecycleService.canTransition(hackathon.status, status);
    if (!canTransition) {
      return errorResponse(
        `Invalid lifecycle transition from ${hackathon.status} to ${status}. Respect domain lifecycle state machine.`,
        'INVALID_STATE_TRANSITION',
        400
      );
    }

    const updated = await prisma.hackathon.update({
      where: { id },
      data: {
        status,
      },
    });

    await AuditService.log({
      userId: session.id,
      hackathonId: id,
      action: status === 'PUBLISHED' ? 'HACKATHON_PUBLISHED' : 'HACKATHON_STATUS_CHANGED',
      entityType: 'Hackathon',
      entityId: id,
      beforeState: { status: hackathon.status },
      afterState: { status: updated.status },
    });

    try {
      revalidatePath('/hackathons');
      revalidatePath(`/hackathons/${updated.slug}`);
      revalidatePath('/admin/hackathons');
      revalidatePath(`/admin/hackathons/${id}`);
      revalidatePath('/organizer/hackathons');
      revalidatePath('/organizer/dashboard');
      revalidatePath('/participant/dashboard');
    } catch {
      // Ignore during test/static builds
    }

    return successResponse(
      updated,
      `Hackathon lifecycle status transitioned from ${hackathon.status} to ${status}`
    );
  } catch (error: any) {
    if (error.status === 403 || error.code === 'FORBIDDEN_ROLE') {
      return errorResponse(error.message, 'FORBIDDEN', 403);
    }
    if (error.status === 401 || error.code === 'UNAUTHORIZED') {
      return errorResponse(error.message, 'UNAUTHORIZED', 401);
    }
    return errorResponse(error.message || 'Failed to update status', 'INTERNAL_ERROR', 500);
  }
}
