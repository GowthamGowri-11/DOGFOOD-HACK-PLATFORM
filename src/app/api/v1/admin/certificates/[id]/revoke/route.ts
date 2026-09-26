import { NextRequest } from 'next/server';
import { requireRole } from '@/server/permissions/guards';
import { successResponse, errorResponse } from '@/lib/api/response';
import prisma from '@/lib/prisma';
import { AuditService } from '@/server/services/audit.service';
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
    const { reason = 'Revoked by Platform Administrator' } = body;

    const cert = await prisma.certificate.findUnique({
      where: { id },
    });

    if (!cert) {
      return errorResponse('Certificate not found', 'NOT_FOUND', 404);
    }

    const updated = await prisma.certificate.update({
      where: { id },
      data: {
        status: 'REVOKED',
        revokedAt: new Date(),
        revocationReason: reason,
      },
    });

    await AuditService.log({
      userId: session.id,
      hackathonId: cert.hackathonId,
      action: 'CERTIFICATE_UPDATED',
      entityType: 'Certificate',
      entityId: id,
      beforeState: { status: cert.status },
      afterState: { status: updated.status, revocationReason: reason },
    });

    try {
      revalidatePath('/participant/certificates');
      revalidatePath(`/verify/${cert.verificationCode}`);
      revalidatePath('/admin/certificates');
    } catch {
      // Ignore during test/static builds
    }

    return successResponse(updated, 'Certificate has been revoked');
  } catch (error: any) {
    if (error.status === 403 || error.code === 'FORBIDDEN_ROLE') {
      return errorResponse(error.message, 'FORBIDDEN', 403);
    }
    if (error.status === 401 || error.code === 'UNAUTHORIZED') {
      return errorResponse(error.message, 'UNAUTHORIZED', 401);
    }
    return errorResponse(error.message || 'Failed to revoke certificate', 'INTERNAL_ERROR', 500);
  }
}
