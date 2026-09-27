import { NextRequest, NextResponse } from 'next/server';
import { AuditService } from '@/server/services/audit.service';
import { getCurrentUser } from '@/server/auth/session';
import { ResourceGuards } from '@/server/permissions/resource-guards';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } },
        { status: 401 }
      );
    }

    const { id: hackathonId } = params;

    // Strict Resource Guard: Only Hackathon Organizer or Admin can access
    if (user.role !== 'ADMIN') {
      const isAuthorized = await ResourceGuards.canOrganizerAccessHackathon(user.id, hackathonId);
      if (!isAuthorized) {
        return NextResponse.json(
          { success: false, error: { code: 'FORBIDDEN', message: 'Resource access denied. You do not manage this hackathon.' } },
          { status: 403 }
        );
      }
    }

    const logs = await AuditService.listByHackathon(hackathonId, 100);

    return NextResponse.json({
      success: true,
      data: { logs },
    });
  } catch (error: any) {
    console.error('[API][Audit] Failed to fetch audit logs:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message || 'Failed to fetch audit records.' } },
      { status: 500 }
    );
  }
}
