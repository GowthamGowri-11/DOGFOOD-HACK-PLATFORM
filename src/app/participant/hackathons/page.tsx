import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  Trophy,
  Users,
  FolderKanban,
  FileCheck,
  Award,
  Clock,
  ArrowRight,
  ExternalLink,
  Calendar,
  AlertCircle,
  Plus,
} from 'lucide-react';
import { getSession } from '@/server/auth/session';
import { RegistrationRepository } from '@/server/repositories/registration.repository';
import { TeamRepository } from '@/server/repositories/team.repository';
import { ProjectRepository } from '@/server/repositories/project.repository';
import { ParticipantHackathonCard } from '@/components/realtime/ParticipantHackathonCard';
import { Button } from '@/components/ui/Button';

export const dynamic = 'force-dynamic';

export default async function ParticipantHackathonsPage() {
  const session = await getSession();
  if (!session) {
    redirect('/login?from=/participant/hackathons');
  }

  const [registrations, teams, projects] = await Promise.all([
    RegistrationRepository.listByUser(session.id),
    TeamRepository.listByUser(session.id),
    ProjectRepository.listByUser(session.id),
  ]);

  return (
    <div className="space-y-6 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-[#E2E8F0]">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-bold text-[#2563EB] bg-[#EFF6FF] px-2.5 py-0.5 rounded-full border border-[#BFDBFE]">
              My Competitions
            </span>
            <span className="text-[11px] font-semibold text-[#64748B]">
              {registrations.length} Registered Event{registrations.length === 1 ? '' : 's'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#111827] mt-1 tracking-tight">
            Registered Hackathons
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-0.5 font-normal">
            Track your stage progression, team rosters, and solution submissions across all registered events.
          </p>
        </div>

        <Link href="/hackathons">
          <Button variant="primary" size="md" icon={<Plus className="w-4 h-4" />}>
            Explore More Hackathons
          </Button>
        </Link>
      </div>

      {registrations.length === 0 ? (
        <div className="bg-white border border-[#E2E8F0] rounded-[18px] p-12 text-center space-y-3 shadow-card max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center mx-auto">
            <Trophy className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[#111827]">No Registered Hackathons Yet</h3>
          <p className="text-xs text-[#64748B] leading-relaxed">
            You haven&apos;t enrolled in any hackathons. Browse active competitions to register and start building with your team.
          </p>
          <div className="pt-2">
            <Link href="/hackathons">
              <Button variant="primary" size="sm">
                Explore Hackathons
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {registrations.map((reg) => {
            const team = teams.find((t) => t.hackathonId === reg.hackathon.id);
            const project = projects.find((p) => p.hackathonId === reg.hackathon.id);

            return (
              <ParticipantHackathonCard
                key={reg.id}
                registration={reg}
                team={team}
                project={project}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
