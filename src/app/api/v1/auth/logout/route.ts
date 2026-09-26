import { clearSessionCookie, getSession } from '@/server/auth/session';
import { successResponse } from '@/lib/api/response';
import { AuditService } from '@/server/services/audit.service';

export async function POST() {
  const session = await getSession();
  if (session) {
    await AuditService.log({
      userId: session.id,
      action: 'LOGOUT',
      entityType: 'User',
      entityId: session.id,
    });
  }

  await clearSessionCookie();
  return successResponse(null, 'Logged out successfully');
}
