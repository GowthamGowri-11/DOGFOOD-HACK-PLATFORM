import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/server/permissions/guards';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    await requireRole('ADMIN');

    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        isActive: true,
        bio: true,
        createdAt: true,
      },
    });

    const headers = ['ID', 'Full Name', 'Email', 'Role', 'Status', 'Phone', 'Created At'];
    const rows = users.map((u) => {
      let phone = '';
      if (u.bio && u.bio.startsWith('Phone:')) {
        phone = u.bio.replace('Phone:', '').trim();
      }
      const roleLabel =
        u.role === 'PARTICIPANT'
          ? 'Student'
          : u.role === 'ORGANIZER'
          ? 'Organizer'
          : u.role === 'JUDGE'
          ? 'Judge'
          : u.role === 'ADMIN'
          ? 'Admin'
          : u.role;

      return [
        `"${u.id}"`,
        `"${(u.fullName || '').replace(/"/g, '""')}"`,
        `"${(u.email || '').replace(/"/g, '""')}"`,
        `"${roleLabel}"`,
        `"${u.isActive ? 'Active' : 'Inactive'}"`,
        `"${phone.replace(/"/g, '""')}"`,
        `"${u.createdAt ? new Date(u.createdAt).toISOString() : ''}"`,
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\r\n');
    const dateStr = new Date().toISOString().slice(0, 10);

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="atlyx_users_${dateStr}.csv"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Export failed' } },
      { status: 500 }
    );
  }
}
