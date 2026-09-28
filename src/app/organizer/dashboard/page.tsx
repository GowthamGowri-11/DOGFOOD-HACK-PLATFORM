import React from 'react';
import Link from 'next/link';
import {
  FolderKanban,
  Scale,
  Sparkles,
  Plus,
  ArrowRight,
  BarChart3,
  Sliders,
  Award,
  Trophy,
} from 'lucide-react';
import { getSession } from '@/server/auth/session';
import { KPICard } from '@/components/ui/KPICard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

function pct(part: number, whole: number): number {
  if (!whole || whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

export default async function OrganizerDashboard() {
  const session = await getSession();
  const organizerId = session?.id;

  let hackathons: any[] = [];
  let totalSubmissions = 0;
  let aiJuryRuns = 0;
  let completedAssignments = 0;
  let totalAssignments = 0;

  try {
    hackathons = await prisma.hackathon.findMany({
      where: organizerId ? { organizerId } : undefined,
      include: {
        tracks: {
          include: {
            _count: { select: { problemStatements: true } },
          },
        },
        prizes: true,
        _count: {
          select: {
            registrations: true,
            projects: true,
            judges: true,
            certificates: true,
            teams: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const hackathonIds = hackathons.map((h) => h.id);

    if (hackathonIds.length > 0) {
      totalSubmissions = await prisma.submission.count({
        where: {
          status: 'SUBMITTED',
          project: { hackathonId: { in: hackathonIds } },
        },
      });

      aiJuryRuns = await prisma.aIJuryRun.count({
        where: { hackathonId: { in: hackathonIds } },
      }).catch(() => 0);

      totalAssignments = await prisma.judgeAssignment.count({
        where: { project: { hackathonId: { in: hackathonIds } } },
      });

      completedAssignments = await prisma.judgeAssignment.count({
        where: {
          project: { hackathonId: { in: hackathonIds } },
          status: 'COMPLETED',
        },
      });
    }
  } catch (err) {
    console.error('[OrganizerDashboard] DB query failed:', err);
  }

  const activeHackathon = hackathons[0];
  const totalRegistrations = activeHackathon?._count?.registrations ?? 0;
  const totalTeams = activeHackathon?._count?.teams ?? 0;
  const totalProjects = activeHackathon?._count?.projects ?? 0;
  const totalCertificates = activeHackathon?._count?.certificates ?? 0;
  const judgingPct = pct(completedAssignments, totalAssignments || 1);

  const funnelBase = Math.max(totalRegistrations, 1);
  const funnel = [
    { label: 'Registered Participants', count: totalRegistrations, percentage: 100, color: 'bg-[#2563EB]' },
    {
      label: 'Formed Teams',
      count: totalTeams,
      percentage: pct(totalTeams, funnelBase),
      color: 'bg-[#3B82F6]',
    },
    {
      label: 'Projects Created',
      count: totalProjects,
      percentage: pct(totalProjects, funnelBase),
      color: 'bg-[#60A5FA]',
    },
    {
      label: 'Final Submissions Locked',
      count: totalSubmissions,
      percentage: pct(totalSubmissions, funnelBase),
      color: 'bg-[#059669]',
    },
  ];

  const tracks = activeHackathon?.tracks || [];

  return (
    <div className="space-y-8 select-none font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-baseline gap-4 pb-6 border-b border-[#E2E8F0]">
        <div>
          <div className="flex items-center space-x-2 text-[13px] font-medium text-[#64748B] mb-1.5 tracking-[0.01em]">
            <span>Organizer Operations</span>
            <span className="text-[#94A3B8]">•</span>
            <span className="px-2.5 py-0.5 rounded-full text-[12px] font-medium bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB]">
              Live DB metrics
            </span>
          </div>
          <h1 className="text-[28px] sm:text-[32px] lg:text-[35px] font-bold text-[#111827] tracking-tight leading-[1.18]">
            Event Operations Center
          </h1>
          <p className="text-[15px] sm:text-[16px] text-[#64748B] mt-1.5 font-normal leading-[1.5] max-w-[680px]">
            Registration, teams, submissions, and judging progress for your hackathons.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2 px-3.5 py-2 bg-white border border-[#E2E8F0] rounded-xl text-[13px] font-medium text-[#111827]">
            <span className="text-[#64748B]">Active:</span>
            <span className="text-[#2563EB] truncate max-w-[200px] font-medium">
              {activeHackathon?.title || 'No active hackathon'}
            </span>
          </div>

          <Link href="/organizer/hackathons">
            <Button variant="primary" size="md" icon={<Trophy className="w-4 h-4" />}>
              Manage Hackathons
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <KPICard label="Registrations" value={totalRegistrations} />
        <KPICard label="Teams" value={totalTeams} subtext={`${totalTeams} formed`} />
        <KPICard label="Projects" value={totalProjects} />
        <KPICard label="Submissions" value={totalSubmissions} />
        <KPICard
          label="Judging Progress"
          value={`${judgingPct}%`}
          trend={{
            value: `${completedAssignments}/${totalAssignments} complete`,
            isPositive: judgingPct >= 50,
          }}
        />
        <KPICard label="Certificates" value={totalCertificates} subtext="Issued" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-4 h-4 text-[#2563EB]" />
                <h3 className="text-[16px] sm:text-[17px] font-bold text-[#111827]">
                  Participant Conversion Funnel
                </h3>
              </div>
              <span className="text-[13px] sm:text-[14px] font-semibold text-[#059669]">
                {pct(totalSubmissions, funnelBase)}% submission rate
              </span>
            </div>

            <div className="space-y-3.5 pt-2">
              {funnel.map((stage) => (
                <div key={stage.label} className="space-y-1.5">
                  <div className="flex justify-between text-[13px] sm:text-[14px]">
                    <span className="font-medium text-[#334155]">{stage.label}</span>
                    <span className="font-semibold text-[#111827]">
                      {stage.count}{' '}
                      <span className="text-[#64748B] font-normal">({stage.percentage}%)</span>
                    </span>
                  </div>
                  <div className="w-full h-[7px] rounded-full bg-[#F1F5F9] overflow-hidden">
                    <div
                      className={`h-full rounded-full ${stage.color}`}
                      style={{ width: `${Math.min(100, stage.percentage)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FolderKanban className="w-4 h-4 text-[#7E22CE]" />
                <h3 className="text-[16px] sm:text-[17px] font-bold text-[#111827]">
                  Track Distribution
                </h3>
              </div>
              <span className="text-[13px] text-[#64748B]">
                {tracks.length} track{tracks.length === 1 ? '' : 's'}
              </span>
            </div>

            {tracks.length === 0 ? (
              <p className="text-[13px] text-[#64748B]">No tracks configured for this hackathon yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                {tracks.map((track: any) => {
                  const psCount = track._count?.problemStatements ?? 0;
                  const share = pct(psCount, Math.max(tracks.reduce((s: number, t: any) => s + (t._count?.problemStatements || 0), 0), 1));
                  return (
                    <div key={track.id} className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
                      <div className="flex justify-between items-center text-[13px]">
                        <span className="font-semibold text-[#111827] truncate">{track.title}</span>
                        <Badge variant="purple">{share}% PS share</Badge>
                      </div>
                      <div className="text-[20px] font-bold text-[#7E22CE]">{psCount} Problems</div>
                      <p className="text-[12px] text-[#64748B] leading-[1.4] truncate">
                        {track.description || 'Challenge track'}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 space-y-4">
            <h3 className="text-[16px] sm:text-[17px] font-bold text-[#111827]">Quick Event Actions</h3>
            <div className="space-y-2.5">
              <Link
                href="/organizer/assignments"
                className="h-[46px] flex items-center justify-between px-3.5 rounded-xl bg-white hover:bg-[#F8FAFC] border border-[#E2E8F0] transition-all text-[14px] font-medium text-[#334155]"
              >
                <div className="flex items-center space-x-2.5">
                  <Scale className="w-4 h-4 text-[#2563EB]" />
                  <span>Run Assignment Engine</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[#94A3B8]" />
              </Link>
              <Link
                href="/organizer/ai-jury"
                className="h-[46px] flex items-center justify-between px-3.5 rounded-xl bg-white hover:bg-[#F8FAFC] border border-[#E2E8F0] transition-all text-[14px] font-medium text-[#334155]"
              >
                <div className="flex items-center space-x-2.5">
                  <Sparkles className="w-4 h-4 text-[#7E22CE]" />
                  <span>Trigger AI Jury Run</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[#94A3B8]" />
              </Link>
              <Link
                href="/organizer/rubrics"
                className="h-[46px] flex items-center justify-between px-3.5 rounded-xl bg-white hover:bg-[#F8FAFC] border border-[#E2E8F0] transition-all text-[14px] font-medium text-[#334155]"
              >
                <div className="flex items-center space-x-2.5">
                  <Sliders className="w-4 h-4 text-[#D97706]" />
                  <span>Version Evaluation Rubric</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[#94A3B8]" />
              </Link>
              <Link
                href="/organizer/results"
                className="h-[46px] flex items-center justify-between px-3.5 rounded-xl bg-white hover:bg-[#F8FAFC] border border-[#E2E8F0] transition-all text-[14px] font-medium text-[#334155]"
              >
                <div className="flex items-center space-x-2.5">
                  <Award className="w-4 h-4 text-[#059669]" />
                  <span>Publish Normalized Results</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[#94A3B8]" />
              </Link>
            </div>
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between text-[12px]">
              <span className="font-semibold text-[#64748B] uppercase tracking-[0.03em] flex items-center">
                <Sparkles className="w-3.5 h-3.5 mr-1.5 text-[#2563EB]" /> AI Jury
              </span>
            </div>
            <div className="text-[22px] font-bold text-[#111827]">
              {aiJuryRuns} Run{aiJuryRuns === 1 ? '' : 's'}
            </div>
            <p className="text-[12px] sm:text-[13px] text-[#64748B] leading-[1.5]">
              Count of AI jury runs recorded for your hackathons.
            </p>
            <div className="pt-2 border-t border-[#E2E8F0] text-[13px] font-semibold text-[#2563EB]">
              {totalProjects} projects in scope
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
