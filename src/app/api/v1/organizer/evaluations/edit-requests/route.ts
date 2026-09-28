import { NextRequest } from 'next/server';
import { requireRole } from '@/server/permissions/guards';
import { EvaluationEditRepository } from '@/server/repositories/evaluation-edit.repository';
import { successResponse, errorResponse } from '@/lib/api/response';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await requireRole(['ORGANIZER', 'ADMIN']);
    const { searchParams } = new URL(req.url);
    const hackathonId = searchParams.get('hackathonId') || undefined;
    const roundId = searchParams.get('roundId') || undefined;
    const status = (searchParams.get('status') as any) || undefined;
    const search = searchParams.get('search') || undefined;

    // If role is ORGANIZER, scope strictly to hackathons owned by this organizer
    let targetHackathonId = hackathonId;
    if (session.role === 'ORGANIZER') {
      const ownedHackathons = await prisma.hackathon.findMany({
        where: { organizerId: session.id },
        select: { id: true },
      });
      const ownedIds = ownedHackathons.map((h) => h.id);

      if (hackathonId) {
        if (!ownedIds.includes(hackathonId)) {
          return errorResponse(
            'Forbidden: You do not have organizer privileges for this hackathon.',
            'FORBIDDEN',
            403
          );
        }
      } else {
        // If no hackathonId query param provided, filter across all owned hackathons
        const result = await EvaluationEditRepository.listRequests({
          hackathonId: ownedIds.length === 1 ? ownedIds[0] : undefined,
          roundId,
          status,
          search,
        });

        // Ensure in-memory safety if multiple hackathons
        const filteredItems = result.items.filter((item) => ownedIds.includes(item.hackathonId));
        return successResponse({ items: filteredItems, total: filteredItems.length });
      }
    }

    const result = await EvaluationEditRepository.listRequests({
      hackathonId: targetHackathonId,
      roundId,
      status,
      search,
    });

    return successResponse(result);
  } catch (error: any) {
    const status = error.status || 500;
    const code = error.code || 'INTERNAL_ERROR';
    return errorResponse(error.message, code, status);
  }
}
