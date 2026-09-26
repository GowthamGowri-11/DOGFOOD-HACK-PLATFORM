import { AppShell } from '@/components/ui/AppShell';

export default function OrganizerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppShell userRole="ORGANIZER">
      {children}
    </AppShell>
  );
}
