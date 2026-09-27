import React from 'react';
import prisma from '@/lib/prisma';
import UsersManagementClientView, { UserManagementItem } from './UsersManagementClientView';

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
  let totalCount = 0;
  let rawUsers: any[] = [];

  try {
    const results = await Promise.all([
      prisma.user.count(),
      prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 100,
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
    totalCount = results[0];
    rawUsers = results[1];
  } catch (err) {
    console.error('[AdminUsersPage] DB query failed:', err);
  }

  const initialUsers: UserManagementItem[] = rawUsers.map((u) => {
    let phone: string | null = null;
    if (u.bio && u.bio.startsWith('Phone:')) {
      phone = u.bio.replace('Phone:', '').trim();
    }
    return {
      id: u.id,
      fullName: u.fullName,
      email: u.email,
      role: u.role,
      isActive: u.isActive,
      avatarUrl: u.avatarUrl,
      phone,
      bio: u.bio,
      createdAt: u.createdAt.toISOString(),
    };
  });

  return (
    <UsersManagementClientView
      initialUsers={initialUsers}
      totalCount={totalCount}
    />
  );
}
