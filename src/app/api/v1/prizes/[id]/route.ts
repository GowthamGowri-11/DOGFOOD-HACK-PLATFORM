import { NextRequest } from 'next/server';
import { z } from 'zod';
import { PrizeRepository } from '@/server/repositories/prize.repository';
import { requireRole } from '@/server/permissions/guards';
import { ResourceGuards } from '@/server/permissions/resource-guards';
import { successResponse, errorResponse } from '@/lib/api/response';
import { AuditService } from '@/server/services/audit.service';

const updatePrizeSchema = z.object({
  title: z.string().min(2).optional(),
  category: z.string().optional(),
  amount: z.number().min(0).optional(),
  currency: z.string().optional(),
  rankOrder: z.number().int().min(1).optional(),
  description: z.string().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireRole(['ORGANIZER', 'ADMIN']);
    const prizeId = params.id;

    const prize = await PrizeRepository.findById(prizeId);
    if (!prize) {
      return errorResponse('Prize not found', 'NOT_FOUND', 404);
    }

    if (session.role === 'ORGANIZER') {
      const canAccess = await ResourceGuards.canOrganizerAccessHackathon(session.id, prize.hackathon.id);
      if (!canAccess) {
        return errorResponse('You are not authorized to modify this prize', 'FORBIDDEN_RESOURCE', 403);
      }
    }

    const body = await req.json();
    const parsed = updatePrizeSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse('Invalid prize payload', 'VALIDATION_ERROR', 422, parsed.error.format());
    }

    const updated = await PrizeRepository.update(prizeId, parsed.data);

    await AuditService.log({
      userId: session.id,
      hackathonId: prize.hackathon.id,
      action: 'PRIZE_UPDATED',
      entityType: 'Prize',
      entityId: prizeId,
      beforeState: { title: prize.title, amount: Number(prize.amount) },
      afterState: { title: updated.title, amount: Number(updated.amount) },
    });

    return successResponse({ prize: updated }, 'Prize updated successfully');
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
    const prizeId = params.id;

    const prize = await PrizeRepository.findById(prizeId);
    if (!prize) {
      return errorResponse('Prize not found', 'NOT_FOUND', 404);
    }

    if (session.role === 'ORGANIZER') {
      const canAccess = await ResourceGuards.canOrganizerAccessHackathon(session.id, prize.hackathon.id);
      if (!canAccess) {
        return errorResponse('You are not authorized to delete this prize', 'FORBIDDEN_RESOURCE', 403);
      }
    }

    await PrizeRepository.delete(prizeId);

    await AuditService.log({
      userId: session.id,
      hackathonId: prize.hackathon.id,
      action: 'PRIZE_DELETED',
      entityType: 'Prize',
      entityId: prizeId,
      beforeState: { title: prize.title },
    });

    return successResponse(null, 'Prize deleted successfully');
  } catch (error: any) {
    const status = error.status || 500;
    const code = error.code || 'INTERNAL_ERROR';
    return errorResponse(error.message, code, status);
  }
}
