import { NextRequest } from 'next/server';
import { requireRole } from '@/server/permissions/guards';
import { UserRepository } from '@/server/repositories/user.repository';
import { successResponse, errorResponse } from '@/lib/api/response';
import prisma from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireRole('ADMIN');
    const userId = params.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        registrations: {
          include: {
            hackathon: {
              select: {
                id: true,
                title: true,
                slug: true,
                status: true,
              },
            },
          },
          orderBy: { registeredAt: 'desc' },
        },
        teamMembers: {
          include: {
            team: {
              include: {
                hackathon: { select: { id: true, title: true, slug: true } },
                project: { select: { id: true, title: true, slug: true } },
              },
            },
          },
        },
        certificates: {
          include: {
            hackathon: { select: { id: true, title: true } },
          },
          orderBy: { issuedAt: 'desc' },
        },
        auditLogs: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) {
      return errorResponse('User not found', 'NOT_FOUND', 404);
    }

    // Never expose passwordHash
    const safeUser = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      status: user.isActive ? 'ACTIVE' : 'INACTIVE',
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      githubUrl: user.githubUrl,
      linkedinUrl: user.linkedinUrl,
      createdAt: user.createdAt,
      registrations: user.registrations.map((r) => ({
        id: r.id,
        hackathonId: r.hackathonId,
        hackathonTitle: r.hackathon.title,
        hackathonSlug: r.hackathon.slug,
        hackathonStatus: r.hackathon.status,
        status: r.status,
        registeredAt: r.registeredAt,
      })),
      teams: user.teamMembers.map((tm) => ({
        id: tm.team.id,
        name: tm.team.name,
        isLeader: tm.isLeader,
        hackathonTitle: tm.team.hackathon.title,
        project: tm.team.project
          ? {
              id: tm.team.project.id,
              title: tm.team.project.title,
              slug: tm.team.project.slug,
            }
          : null,
      })),
      certificates: user.certificates.map((c) => ({
        id: c.id,
        verificationCode: c.verificationCode,
        title: c.title,
        status: c.status,
        hackathonTitle: c.hackathon.title,
        issuedAt: c.issuedAt,
      })),
      recentActivity: user.auditLogs.map((l) => ({
        id: l.id,
        action: l.action,
        entityType: l.entityType,
        createdAt: l.createdAt,
      })),
    };

    return successResponse({ user: safeUser });
  } catch (error: any) {
    const status = error.status || 500;
    const code = error.code || 'INTERNAL_ERROR';
    return errorResponse(error.message, code, status);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adminSession = await requireRole('ADMIN');
    const userId = params.id;
    const body = await req.json();

    const existing = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existing) {
      return errorResponse('User not found', 'NOT_FOUND', 404);
    }

    let targetRole = body.role;
    if (targetRole === 'Student') targetRole = 'PARTICIPANT';
    if (targetRole && !['ADMIN', 'ORGANIZER', 'JUDGE', 'PARTICIPANT'].includes(targetRole)) {
      return errorResponse('Invalid user role', 'INVALID_ROLE', 400);
    }

    let targetIsActive = body.isActive;
    if (targetIsActive === undefined && body.status !== undefined) {
      targetIsActive = body.status === 'ACTIVE' || body.status === 'Active';
    }

    // Last-admin lockout protection
    if (existing.role === 'ADMIN' && targetRole && targetRole !== 'ADMIN') {
      const activeAdmins = await prisma.user.count({
        where: { role: 'ADMIN', isActive: true },
      });
      if (activeAdmins <= 1) {
        return errorResponse(
          'Cannot demote the final platform administrator.',
          'LAST_ADMIN_LOCKOUT_PREVENTION',
          400
        );
      }
    }

    if (existing.role === 'ADMIN' && targetIsActive === false) {
      const activeAdmins = await prisma.user.count({
        where: { role: 'ADMIN', isActive: true },
      });
      if (activeAdmins <= 1) {
        return errorResponse(
          'Cannot deactivate the final platform administrator.',
          'LAST_ADMIN_LOCKOUT_PREVENTION',
          400
        );
      }
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(body.fullName ? { fullName: body.fullName.trim() } : {}),
        ...(targetRole ? { role: targetRole } : {}),
        ...(body.bio !== undefined ? { bio: body.bio } : {}),
        ...(targetIsActive !== undefined ? { isActive: Boolean(targetIsActive) } : {}),
      },
    });

    return successResponse({
      user: {
        id: updated.id,
        fullName: updated.fullName,
        email: updated.email,
        role: updated.role,
        isActive: updated.isActive,
        bio: updated.bio,
      },
    }, 'User updated successfully');
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
    const adminSession = await requireRole('ADMIN');
    const userId = params.id;

    const existing = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existing) {
      return errorResponse('User not found', 'NOT_FOUND', 404);
    }

    if (existing.role === 'ADMIN') {
      const activeAdmins = await prisma.user.count({
        where: { role: 'ADMIN', isActive: true },
      });
      if (activeAdmins <= 1) {
        return errorResponse(
          'Cannot delete the final platform administrator.',
          'LAST_ADMIN_LOCKOUT_PREVENTION',
          400
        );
      }
    }

    await prisma.user.delete({
      where: { id: userId },
    });

    return successResponse({ deleted: true }, 'User deleted successfully');
  } catch (error: any) {
    const status = error.status || 500;
    const code = error.code || 'INTERNAL_ERROR';
    return errorResponse(error.message, code, status);
  }
}
