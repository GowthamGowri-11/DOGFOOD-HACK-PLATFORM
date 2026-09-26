import React from 'react';
import { AppShell } from '@/components/ui/AppShell';
import AdminDashboardPage from '../admin/dashboard/page';

export const dynamic = 'force-dynamic';

export default async function StandaloneOverviewPage() {
  return (
    <AppShell userRole="ADMIN">
      <AdminDashboardPage />
    </AppShell>
  );
}
