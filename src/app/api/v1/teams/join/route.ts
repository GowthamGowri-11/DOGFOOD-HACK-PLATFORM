import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/server/permissions/guards';
import { TeamService } from '@/server/services/team.service';
import { successResponse, errorResponse } from '@/lib/api/response';

const joinTeamSchema = z.object({
  inviteCode: z.string().min(3, 'Valid invite code is required'),
});

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();

    const body = await req.json();
    const parsed = joinTeamSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse('Invalid join payload', 'VALIDATION_ERROR', 422, parsed.error.format());
    }

    const result = await TeamService.joinTeamByCode(session.id, parsed.data.inviteCode);

    return successResponse(result, 'Successfully joined team!');
  } catch (error: any) {
    const status = error.status || 500;
    const code = error.code || 'INTERNAL_ERROR';
    return errorResponse(error.message, code, status);
  }
}
