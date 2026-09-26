import { NextRequest } from 'next/server';
import { requireRole } from '@/server/permissions/guards';
import { AuditService } from '@/server/services/audit.service';
import { successResponse, errorResponse } from '@/lib/api/response';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireRole('ADMIN');
    const { id } = params;
    const body = await req.json();
    const { organizerId } = body;

    if (!organizerId) {
      return errorResponse('organizerId is required', 'VALIDATION_ERROR', 400);
    }

    const hackathon = await prisma.hackathon.findUnique({
      where: { id },
      include: {
        organizer: { select: { id: true, fullName: true, email: true } },
      },
    });

    if (!hackathon) {
      return errorResponse('Hackathon not found', 'NOT_FOUND', 404);
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: organizerId },
    });

    if (!targetUser) {
      return errorResponse('Target user not found', 'NOT_FOUND', 404);
    }

    const updated = await prisma.hackathon.update({
      where: { id },
      data: { organizerId },
      include: {
        organizer: {
          select: { id: true, fullName: true, email: true, role: true },
        },
      },
    });

    await AuditService.log({
      userId: session.id,
      hackathonId: id,
      action: 'ORGANIZER_ASSIGNED',
      entityType: 'Hackathon',
      entityId: id,
      beforeState: { organizerId: hackathon.organizerId, organizerName: hackathon.organizer.fullName },
      afterState: { organizerId: updated.organizerId, organizerName: updated.organizer.fullName },
    });

    try {
      revalidatePath('/admin/hackathons');
      revalidatePath(`/admin/hackathons/${id}`);
      revalidatePath('/organizer/hackathons');
      revalidatePath('/organizer/dashboard');
    } catch {
      // Ignore during test/static builds
    }

    return successResponse(
      updated,
      `Organizer successfully updated to ${updated.organizer.fullName}`
    );
  } catch (error: any) {
    if (error.status === 403 || error.code === 'FORBIDDEN_ROLE') {
      return errorResponse(error.message, 'FORBIDDEN', 403);
    }
    if (error.status === 401 || error.code === 'UNAUTHORIZED') {
      return errorResponse(error.message, 'UNAUTHORIZED', 401);
    }
    return errorResponse(error.message || 'Failed to assign organizer', 'INTERNAL_ERROR', 500);
  }
}
