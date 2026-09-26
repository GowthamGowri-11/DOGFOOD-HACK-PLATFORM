import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole } from '@/server/permissions/guards';
import { successResponse, errorResponse } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await requireRole('ADMIN');

    const [
      totalUsers,
      participantCount,
      organizerCount,
      judgeCount,
      adminCount,
      totalHackathons,
      activeHackathons,
      completedHackathons,
      totalTeams,
      totalProjects,
      totalSubmissions,
      certificatesIssued,
      publishedResults,
      recentAuditLogs,
      recentHackathons,
      recentUsers,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'PARTICIPANT' } }),
      prisma.user.count({ where: { role: 'ORGANIZER' } }),
      prisma.user.count({ where: { role: 'JUDGE' } }),
      prisma.user.count({ where: { role: 'ADMIN' } }),
      prisma.hackathon.count(),
      prisma.hackathon.count({
        where: {
          status: {
            in: [
              'PUBLISHED',
              'REGISTRATION_OPEN',
              'REGISTRATION_CLOSED',
              'EVENT_ACTIVE',
              'SUBMISSION_OPEN',
              'SUBMISSION_CLOSED',
              'JUDGING',
              'RESULTS_PENDING',
            ],
          },
        },
      }),
      prisma.hackathon.count({ where: { status: 'COMPLETED' } }),
      prisma.team.count(),
      prisma.project.count(),
      prisma.submission.count({ where: { status: 'SUBMITTED' } }),
      prisma.certificate.count({ where: { status: 'ISSUED' } }),
      prisma.result.count({ where: { isPublished: true } }),
      prisma.auditLog.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, fullName: true, email: true } },
        },
      }),
      prisma.hackathon.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          organizer: { select: { id: true, fullName: true, email: true } },
          _count: {
            select: {
              registrations: true,
              projects: true,
            },
          },
        },
      }),
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
      }),
    ]);

    const formattedRecentUsers = recentUsers.map((u) => ({
      ...u,
      status: u.isActive ? 'ACTIVE' : 'INACTIVE',
    }));

    return successResponse({
      metrics: {
        totalUsers,
        participantCount,
        organizerCount,
        judgeCount,
        adminCount,
        totalHackathons,
        activeHackathons,
        completedHackathons,
        totalTeams,
        totalProjects,
        totalSubmissions,
        certificatesIssued,
        publishedResults,
      },
      recentAuditLogs,
      recentHackathons,
      recentUsers: formattedRecentUsers,
    });
  } catch (error: any) {
    if (error.status === 403 || error.code === 'FORBIDDEN_ROLE') {
      return errorResponse(error.message, 'FORBIDDEN', 403);
    }
    if (error.status === 401 || error.code === 'UNAUTHORIZED') {
      return errorResponse(error.message, 'UNAUTHORIZED', 401);
    }
    return errorResponse(error.message || 'Failed to fetch admin metrics', 'INTERNAL_ERROR', 500);
  }
}
