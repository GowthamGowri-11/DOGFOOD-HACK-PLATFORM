import { NextRequest } from 'next/server';
import { z } from 'zod';
import { PrizeRepository } from '@/server/repositories/prize.repository';
import { HackathonRepository } from '@/server/repositories/hackathon.repository';
import { requireRole } from '@/server/permissions/guards';
import { ResourceGuards } from '@/server/permissions/resource-guards';
import { successResponse, errorResponse } from '@/lib/api/response';
import { AuditService } from '@/server/services/audit.service';

const createPrizeSchema = z.object({
  title: z.string().min(2, 'Prize title must be at least 2 characters'),
  category: z.string().optional(),
  amount: z.number().min(0, 'Amount must be non-negative').default(0),
  currency: z.string().min(1).default('USD'),
  rankOrder: z.number().int().min(1).default(1),
  description: z.string().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const hackathonId = params.id;
    const prizes = await PrizeRepository.listByHackathon(hackathonId);
    return successResponse({ prizes });
  } catch (error: any) {
    return errorResponse(error.message || 'Failed to list prizes', 'INTERNAL_ERROR', 500);
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
        return errorResponse('You are not authorized to add prizes to this hackathon', 'FORBIDDEN_RESOURCE', 403);
      }
    }

    const hackathon = await HackathonRepository.findById(hackathonId);
    if (!hackathon) {
      return errorResponse('Hackathon not found', 'NOT_FOUND', 404);
    }

    const body = await req.json();
    const parsed = createPrizeSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse('Invalid prize payload', 'VALIDATION_ERROR', 422, parsed.error.format());
    }

    const data = parsed.data;
    const prize = await PrizeRepository.create({
      hackathonId,
      title: data.title,
      category: data.category,
      amount: data.amount,
      currency: data.currency,
      rankOrder: data.rankOrder,
      description: data.description,
    });

    await AuditService.log({
      userId: session.id,
      hackathonId,
      action: 'PRIZE_CREATED',
      entityType: 'Prize',
      entityId: prize.id,
      afterState: { id: prize.id, title: prize.title, amount: Number(prize.amount) },
    });

    return successResponse({ prize }, 'Prize created successfully', 201);
  } catch (error: any) {
    const status = error.status || 500;
    const code = error.code || 'INTERNAL_ERROR';
    return errorResponse(error.message, code, status);
  }
}
