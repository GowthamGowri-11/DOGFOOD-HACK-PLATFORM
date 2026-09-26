import { AppShell } from '@/components/ui/AppShell';

export default function JudgeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppShell userRole="JUDGE">
      {children}
    </AppShell>
  );
}
