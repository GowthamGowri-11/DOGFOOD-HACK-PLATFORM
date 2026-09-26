import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/server/permissions/guards';
import { TeamService } from '@/server/services/team.service';
import { successResponse, errorResponse } from '@/lib/api/response';

const removeMemberSchema = z.object({
  userId: z.string().min(1, 'Target user ID is required'),
});

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth();
    const teamId = params.id;

    const body = await req.json();
    const parsed = removeMemberSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse('Invalid payload', 'VALIDATION_ERROR', 422, parsed.error.format());
    }

    const result = await TeamService.removeMember({
      teamId,
      targetUserId: parsed.data.userId,
      actorUserId: session.id,
      actorRole: session.role,
    });

    return successResponse(result, result.disbanded ? 'Team disbanded as no members remain' : 'Member removed successfully');
  } catch (error: any) {
    const status = error.status || 500;
    const code = error.code || 'INTERNAL_ERROR';
    return errorResponse(error.message, code, status);
  }
}
