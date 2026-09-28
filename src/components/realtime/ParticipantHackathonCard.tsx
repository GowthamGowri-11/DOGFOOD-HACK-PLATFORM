'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Clock,
  ExternalLink,
  Lock,
  CheckCircle2,
  Award,
  AlertTriangle,
  ArrowRight,
  Trophy,
  AlertCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { SubmissionCountdown } from './SubmissionCountdown';

export interface ParticipantHackathonCardProps {
  registration: any;
  team: any;
  project: any;
}

export function ParticipantHackathonCard({
  registration,
  team,
  project,
}: ParticipantHackathonCardProps) {
  const h = registration.hackathon;
  const submission = project?.submissions?.[0];
  const isLocked = submission?.status === 'LOCKED' || submission?.status === 'SUBMITTED';

  const [windowState, setWindowState] = useState<'UPCOMING' | 'SUBMISSION_OPEN' | 'SUBMISSION_CLOSED'>(
    'SUBMISSION_OPEN'
  );

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-[20px] p-6 shadow-card space-y-5 hover:border-[#CBD5E1] transition-all">
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

            {/* Realtime Submission Window Badge */}
            <SubmissionCountdown
              hackathonId={h.id}
              subStartTime={h.subStartTime}
              subEndTime={h.subEndTime}
              isLocked={isLocked}
              compact={true}
              onStateChange={(state) => setWindowState(state)}
            />

            <span className="text-xs text-[#64748B]">
              Registered {new Date(registration.registeredAt).toLocaleDateString()}
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

      {/* Submission Countdown Bar */}
      <SubmissionCountdown
        hackathonId={h.id}
        subStartTime={h.subStartTime}
        subEndTime={h.subEndTime}
        isLocked={isLocked}
        showCard={true}
        onStateChange={(state) => setWindowState(state)}
      />

      {/* Timeline and Team/Project Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
        {/* Team Box */}
        <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
          <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block">
            Team Status
          </span>
          {team ? (
            <div>
              <span className="text-sm font-bold text-[#111827] block">{team.name}</span>
              <span className="text-xs text-[#64748B]">
                {team.members?.length || 0} Member{team.members?.length === 1 ? '' : 's'} (Code: {team.inviteCode})
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
                Track: {project.track?.title || 'Selected Track'}
              </span>
            </div>
          ) : team ? (
            <div className="space-y-1">
              <span className="text-xs text-[#64748B] block">No project workspace</span>
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
                Snapshot frozen for jury evaluation
              </span>
            </div>
          ) : windowState === 'SUBMISSION_CLOSED' ? (
            <div className="space-y-1">
              <span className="text-xs font-bold text-[#DC2626] block">
                🔒 Submission Window Closed
              </span>
              <span className="text-[11px] text-[#64748B] block">
                Deadline passed
              </span>
            </div>
          ) : windowState === 'UPCOMING' ? (
            <div className="space-y-1">
              <span className="text-xs font-semibold text-[#64748B] block">
                ⏳ Not Open Yet
              </span>
              <span className="text-[11px] text-[#64748B] block">
                Opens soon
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
            Window: {new Date(h.subStartTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })} – {new Date(h.subEndTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
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
              <Button
                variant={isLocked ? 'outline' : windowState === 'SUBMISSION_CLOSED' ? 'secondary' : 'primary'}
                size="sm"
              >
                {isLocked
                  ? 'View Submission Snapshot →'
                  : windowState === 'SUBMISSION_CLOSED'
                  ? 'View Workspace (Closed)'
                  : windowState === 'UPCOMING'
                  ? 'Open Workspace (Pending Open)'
                  : 'Open Workspace & Submit →'}
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
