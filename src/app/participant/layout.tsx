import { AppShell } from '@/components/ui/AppShell';

export default function ParticipantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell userRole="PARTICIPANT">{children}</AppShell>;
}
