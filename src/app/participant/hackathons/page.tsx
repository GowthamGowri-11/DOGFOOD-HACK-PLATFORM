import React from 'react';
import Link from 'next/link';
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
    return <div className="p-8 text-sm text-slate-500">Unable to load session.</div>;
  }

  const [registrations, teams, projects] = await Promise.all([
    RegistrationRepository.listByUser(session.id),
    TeamRepository.listByUser(session.id),
    ProjectRepository.listByUser(session.id),
  ]);

  return (
    <div className="space-y-6 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-[#E5E0D8]">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-bold text-[#FA541C] bg-[#FFE8D6] px-2.5 py-0.5 rounded-full border border-[#FED7AA]">
              My Competitions
            </span>
            <span className="text-[11px] font-semibold text-[#6B7280]">
              {registrations.length} Registered Event{registrations.length === 1 ? '' : 's'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111827] mt-1 tracking-tight">
            Registered Hackathons
          </h1>
          <p className="text-xs sm:text-sm text-[#6B7280] mt-0.5 font-normal">
            Track your stage progression, team rosters, and solution submissions across all registered events.
          </p>
        </div>

        <Link
          href="/hackathons"
          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-[#FA541C] hover:bg-[#EA4812] hover:shadow-lg hover:shadow-[#FA541C]/30 text-white text-xs font-bold rounded-xl shadow-sm transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Explore More Hackathons</span>
        </Link>
      </div>

      {registrations.length === 0 ? (
        <div className="bg-white border border-[#E5E0D8] rounded-[18px] p-12 text-center space-y-3 shadow-xs max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-[#FFE8D6] text-[#FA541C] flex items-center justify-center mx-auto">
            <Trophy className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[#111827]">No Registered Hackathons Yet</h3>
          <p className="text-xs text-[#6B7280] leading-relaxed">
            You haven&apos;t enrolled in any hackathons. Browse active competitions to register and start building with your team.
          </p>
          <div className="pt-2">
            <Link
              href="/hackathons"
              className="inline-flex items-center px-4 py-2 bg-[#FA541C] hover:bg-[#EA4812] text-white text-xs font-bold rounded-xl shadow-sm transition-all"
            >
              Explore Hackathons
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
