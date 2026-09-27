import React from 'react';
import prisma from '@/lib/prisma';
import OverviewClientView, { UserDirectoryItem } from './OverviewClientView';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  // Query live telemetry and member directory directly from PostgreSQL with error resilience
  let totalUsers = 0;
  let activeHackathons = 0;
  let totalTeams = 0;
  let totalSubmissions = 0;
  let rawUsers: any[] = [];

  try {
    const results = await Promise.all([
      prisma.user.count(),
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
      prisma.team.count(),
      prisma.submission.count({ where: { status: 'SUBMITTED' } }),
      prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
          isActive: true,
          avatarUrl: true,
          bio: true,
          createdAt: true,
        },
      }),
    ]);

    totalUsers = results[0];
    activeHackathons = results[1];
    totalTeams = results[2];
    totalSubmissions = results[3];
    rawUsers = results[4];
  } catch (err) {
    console.error('[AdminDashboardPage] DB query failed:', err);
  }

  const initialUsers: UserDirectoryItem[] = rawUsers.map((u) => ({
    id: u.id,
    fullName: u.fullName,
    email: u.email,
    role: u.role,
    isActive: u.isActive,
    avatarUrl: u.avatarUrl,
    bio: u.bio,
    createdAt: u.createdAt.toISOString(),
  }));

  const initialMetrics = {
    totalUsers,
    activeHackathons,
    totalTeams,
    totalSubmissions,
  };

  return (
    <OverviewClientView
      initialMetrics={initialMetrics}
      initialUsers={initialUsers}
    />
  );
}
