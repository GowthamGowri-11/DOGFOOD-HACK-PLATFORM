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
import { Badge } from '@/components/ui/Badge';
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
            const h = reg.hackathon;
            const team = teams.find((t) => t.hackathonId === h.id);
            const project = projects.find((p) => p.hackathonId === h.id);
            const submission = project?.submissions?.[0];
            const isLocked = submission?.status === 'LOCKED';

            return (
              <div
                key={reg.id}
                className="bg-white border border-[#E2E8F0] rounded-[18px] p-6 shadow-card space-y-5 hover:border-[#CBD5E1] transition-all"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant={
                          h.status === 'RESULTS_PUBLISHED'
                            ? 'emerald'
                            : h.status === 'JUDGING'
                            ? 'purple'
                            : h.status === 'SUBMISSION_OPEN'
                            ? 'blue'
                            : 'slate'
                        }
                      >
                        {h.status.replace(/_/g, ' ')}
                      </Badge>
                      <span className="text-xs text-[#64748B]">
                        Registered on {new Date(reg.registeredAt).toLocaleDateString()}
                      </span>
                    </div>
                    <h2 className="text-xl font-bold text-[#111827]">{h.title}</h2>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Link href={`/hackathons/${h.slug}`}>
                      <Button variant="outline" size="sm" icon={<ExternalLink className="w-3.5 h-3.5" />}>
                        Public Details
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* Round Progression Status Notification Banner */}
                {team && (team.progressionStatus === 'ADVANCED' || team.progressionStatus === 'ELIMINATED') && (
                  <div
                    className={`p-3.5 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                      team.progressionStatus === 'ADVANCED'
                        ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#065F46]'
                        : 'bg-[#FFFBEB] border-[#FDE68A] text-[#92400E]'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      {team.progressionStatus === 'ADVANCED' ? (
                        <Trophy className="w-4 h-4 text-[#059669] flex-shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-[#D97706] flex-shrink-0" />
                      )}
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold">
                            {team.progressionStatus === 'ADVANCED'
                              ? `Your team has been selected for the next round of ${h.title}.`
                              : `Your team was not selected for the next round of ${h.title}.`}
                          </span>
                          <Badge variant={team.progressionStatus === 'ADVANCED' ? 'emerald' : 'amber'}>
                            {team.progressionStatus === 'ADVANCED' ? `ROUND ${team.highestRound} UNLOCKED` : 'NOT SELECTED'}
                          </Badge>
                        </div>
                        <span className="text-[11px] opacity-90 block mt-0.5">
                          {team.progressionStatus === 'ADVANCED'
                            ? `Eligible to submit and participate in Round ${team.highestRound}.`
                            : 'You can still view the published leaderboard. Historical submissions and scores remain saved.'}
                        </span>
                      </div>
                    </div>

                    {team.progressionStatus === 'ELIMINATED' && (
                      <Link href="/leaderboard">
                        <Button variant="secondary" size="sm" className="font-semibold text-xs whitespace-nowrap">
                          View Leaderboard →
                        </Button>
                      </Link>
                    )}
                  </div>
                )}

                {/* Timeline and Team/Project Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                  {/* Team Box */}
                  <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
                    <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block">
                      Team Status
                    </span>
                    {team ? (
                      <div>
                        <span className="text-sm font-bold text-[#111827] block">{team.name}</span>
                        <span className="text-xs text-[#64748B]">
                          {team.members.length} Member{team.members.length === 1 ? '' : 's'} (Code: {team.inviteCode})
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <span className="text-xs text-[#D97706] font-medium block">No Team Formed</span>
                        <Link href="/participant/teams" className="text-xs text-[#2563EB] font-bold hover:underline">
                          Create / Join Team →
                        </Link>
                      </div>
                    )}
                  </div>

                  {/* Project Box */}
                  <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
                    <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block">
                      Solution Project
                    </span>
                    {project ? (
                      <div>
                        <span className="text-sm font-bold text-[#111827] block truncate">
                          {project.title}
                        </span>
                        <span className="text-xs text-[#64748B]">
                          Track: {project.track?.title || 'Selected'}
                        </span>
                      </div>
                    ) : team ? (
                      <div className="space-y-1">
                        <span className="text-xs text-[#64748B] block">No project started</span>
                        <Link href="/participant/projects" className="text-xs text-[#2563EB] font-bold hover:underline">
                          Create Project Workspace →
                        </Link>
                      </div>
                    ) : (
                      <span className="text-xs text-[#94A3B8]">Requires team first</span>
                    )}
                  </div>

                  {/* Submission Box */}
                  <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
                    <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block">
                      Submission State
                    </span>
                    {isLocked ? (
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-[#059669] flex items-center">
                          🔒 Official Submission Locked
                        </span>
                        <span className="text-[11px] text-[#64748B] block">
                          Ready for jury evaluation
                        </span>
                      </div>
                    ) : project ? (
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-[#2563EB] block">Draft in Progress</span>
                        <Link
                          href={`/participant/projects/${project.id}`}
                          className="text-xs text-[#2563EB] font-bold hover:underline"
                        >
                          Submit Solution →
                        </Link>
                      </div>
                    ) : (
                      <span className="text-xs text-[#94A3B8]">Not submitted</span>
                    )}
                  </div>
                </div>

                {/* Footer Action Strip */}
                <div className="pt-3 border-t border-[#F1F5F9] flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center space-x-2 text-[#64748B]">
                    <Clock className="w-3.5 h-3.5 text-[#2563EB]" />
                    <span>
                      Submission Window: {new Date(h.subStartTime).toLocaleDateString()} – {new Date(h.subEndTime).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    {h.status === 'RESULTS_PUBLISHED' && (
                      <Link href="/participant/results">
                        <Button variant="outline" size="sm" icon={<Award className="w-3.5 h-3.5 text-[#D97706]" />}>
                          View Official Results
                        </Button>
                      </Link>
                    )}
                    {project && (
                      <Link href={`/participant/projects/${project.id}`}>
                        <Button variant="primary" size="sm">
                          Open Project Workspace →
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
