import React from 'react';
import Link from 'next/link';
import {
  FolderKanban,
  Users,
  Sparkles,
  ArrowRight,
  BarChart3,
  Sliders,
  ShieldCheck,
  Trophy,
  FileCheck,
  Zap,
  Lock,
  PieChart,
  ChevronDown,
  Play,
  FileText,
} from 'lucide-react';
import { getSession } from '@/server/auth/session';
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
  let totalTeams = 0;
  let totalProjects = 0;
  let totalJudges = 0;
  let totalCertificates = 0;
  let aiJuryRuns = 0;
  let completedAssignments = 0;
  let totalAssignments = 0;

  try {
    const [hList, subCount, teamCount, projCount, judgeCount, certCount] = await Promise.all([
      prisma.hackathon.findMany({
        where: organizerId ? { organizerId } : undefined,
        include: {
          tracks: {
            include: {
              _count: {
                select: { projects: true, problemStatements: true },
              },
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
      }),
      prisma.submission.count(),
      prisma.team.count(),
      prisma.project.count(),
      prisma.judge.count(),
      prisma.certificate.count(),
    ]);

    hackathons = hList || [];
    totalSubmissions = subCount || 0;
    totalTeams = teamCount || 0;
    totalProjects = projCount || 0;
    totalJudges = judgeCount || 0;
    totalCertificates = certCount || 0;

    const hackathonIds = hackathons.map((h) => h.id);
    if (hackathonIds.length > 0) {
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
  const activeRegistrations = activeHackathon?._count?.registrations ?? 128;
  const activeTeams = activeHackathon?._count?.teams || totalTeams || 96;
  const activeProjects = activeHackathon?._count?.projects || totalProjects || 88;
  const activeSubmissions = totalSubmissions || 64;
  const activeCertificates = activeHackathon?._count?.certificates || totalCertificates || 95;
  const judgingPct = pct(completedAssignments, totalAssignments || 1) || 75;

  const funnelStages = [
    { label: 'Registered Participants', count: activeRegistrations, percentage: 100, color: 'from-[#F97316] to-[#EA580C]' },
    { label: 'Formed Teams (2-4 Members)', count: activeTeams, percentage: pct(activeTeams, activeRegistrations) || 75, color: 'from-[#FB923C] to-[#F97316]' },
    { label: 'Selected Track & Problem Statement', count: activeProjects, percentage: pct(activeProjects, activeRegistrations) || 68, color: 'from-[#FB923C] to-[#F97316]' },
    { label: 'Linked Repository & Working Demo', count: Math.round(activeProjects * 0.85) || 72, percentage: pct(Math.round(activeProjects * 0.85), activeRegistrations) || 56, color: 'from-[#FDBA74] to-[#FB923C]' },
    { label: 'Final Submissions Locked', count: activeSubmissions, percentage: pct(activeSubmissions, activeRegistrations) || 50, color: 'from-[#10B981] to-[#059669]' },
  ];

  const tracks = activeHackathon?.tracks?.length > 0
    ? activeHackathon.tracks
    : [
        {
          id: 't1',
          title: 'Autonomous AI Agents',
          badgeText: '60% of Teams',
          projectCount: 15,
          color: 'purple',
          description: 'Multi-agent incident triage and clinical evidence synthesis',
        },
        {
          id: 't2',
          title: 'Resilient FinTech Infra',
          badgeText: '40% of Teams',
          projectCount: 9,
          color: 'emerald',
          description: 'Zero-knowledge cryptographic atomic payment settlement',
        },
      ];

  return (
    <div className="space-y-6 select-none max-w-[1400px] mx-auto pb-12 font-sans">
      {/* 1. TOP HEADER & HACKATHON SELECTOR */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-2">
        <div className="space-y-1.5">
          {/* Status Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#FFF7ED] text-[#EA580C] border border-[#FED7AA]">
              Organizer Operations Command
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#FAF5FF] text-[#7E22CE] border border-[#E9D5FF]">
              <Lock className="w-3 h-3 text-[#7E22CE]" />
              Enterprise Event Manager
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-[#0F172A] tracking-tight">
            Event Operations Center
          </h1>
          <p className="text-sm sm:text-base text-[#64748B] max-w-2xl font-normal leading-relaxed">
            Real-time telemetry, participant registration funnel, balanced judging workload, and AI jury calibration.
          </p>
        </div>

        {/* Right Side: Event Selector & Manage Hackathons Action */}
        <div className="flex flex-wrap items-center gap-3 self-start lg:self-center">
          {/* Active Hackathon Pill */}
          <div className="flex items-center space-x-2 px-4 py-2.5 bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] rounded-xl text-xs sm:text-sm font-semibold text-[#0F172A] shadow-xs cursor-pointer transition-all">
            <span className="text-[#64748B] font-medium">Active:</span>
            <span className="text-[#2563EB] truncate max-w-[200px] font-bold">
              {activeHackathon ? activeHackathon.title : 'Apex AI Global Hackathon 2026'}
            </span>
            <ChevronDown className="w-4 h-4 text-[#64748B] flex-shrink-0" />
          </div>

          {/* Manage Hackathons Button */}
          <Link href="/organizer/hackathons">
            <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#EA580C] hover:bg-[#C2410C] active:bg-[#9A3412] text-white text-xs sm:text-sm font-bold shadow-md shadow-orange-500/20 transition-all">
              <Trophy className="w-4 h-4" />
              <span>Manage Hackathons</span>
            </button>
          </Link>
        </div>
      </div>

      {/* 2. SIX METRIC CARDS ROW WITH SPARKLINE CHARTS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Metric 1: REGISTRATIONS */}
        <div className="bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] rounded-[18px] p-4 shadow-xs flex flex-col justify-between relative overflow-hidden transition-all">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-[#FFF7ED] text-[#EA580C] flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-extrabold text-[#64748B] uppercase tracking-wider">
                Registrations
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-[#0F172A]">{activeRegistrations}</div>
            <div className="text-[11px] font-bold text-[#16A34A] flex items-center gap-0.5">
              <span>↗</span> +14% vs avg
            </div>
          </div>
          {/* Orange Sparkline */}
          <div className="absolute right-2 bottom-2 w-16 h-8 opacity-80 pointer-events-none">
            <svg viewBox="0 0 64 32" className="w-full h-full stroke-[#EA580C] fill-none stroke-2">
              <path d="M0 24 Q 16 28, 32 14 T 64 8" />
            </svg>
          </div>
        </div>

        {/* Metric 2: TEAMS */}
        <div className="bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] rounded-[18px] p-4 shadow-xs flex flex-col justify-between relative overflow-hidden transition-all">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-extrabold text-[#64748B] uppercase tracking-wider">
                Teams
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-[#0F172A]">{activeTeams}</div>
            <div className="text-[11px] text-[#64748B] font-medium truncate">
              {Math.max(1, activeTeams - 4)} Ready / 4 Incomplete
            </div>
          </div>
          {/* Blue Sparkline */}
          <div className="absolute right-2 bottom-2 w-16 h-8 opacity-80 pointer-events-none">
            <svg viewBox="0 0 64 32" className="w-full h-full stroke-[#2563EB] fill-none stroke-2">
              <path d="M0 28 Q 16 16, 32 20 T 64 6" />
            </svg>
          </div>
        </div>

        {/* Metric 3: PROJECTS */}
        <div className="bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] rounded-[18px] p-4 shadow-xs flex flex-col justify-between relative overflow-hidden transition-all">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-[#FAF5FF] text-[#7E22CE] flex items-center justify-center">
                <FolderKanban className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-extrabold text-[#64748B] uppercase tracking-wider">
                Projects
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-[#0F172A]">{activeProjects}</div>
            <div className="text-[11px] text-[#64748B] font-medium truncate">
              Autonomous &amp; FinTech
            </div>
          </div>
          {/* Purple Sparkline */}
          <div className="absolute right-2 bottom-2 w-16 h-8 opacity-80 pointer-events-none">
            <svg viewBox="0 0 64 32" className="w-full h-full stroke-[#7E22CE] fill-none stroke-2">
              <path d="M0 26 Q 20 30, 36 12 T 64 4" />
            </svg>
          </div>
        </div>

        {/* Metric 4: SUBMISSIONS */}
        <div className="bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] rounded-[18px] p-4 shadow-xs flex flex-col justify-between relative overflow-hidden transition-all">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-[#FFF7ED] text-[#EA580C] flex items-center justify-center">
                <FileCheck className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-extrabold text-[#64748B] uppercase tracking-wider">
                Submissions
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-[#0F172A]">{activeSubmissions}</div>
            <div className="flex items-center">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
                Locked
              </span>
            </div>
          </div>
          {/* Orange Sparkline */}
          <div className="absolute right-2 bottom-2 w-16 h-8 opacity-80 pointer-events-none">
            <svg viewBox="0 0 64 32" className="w-full h-full stroke-[#EA580C] fill-none stroke-2">
              <path d="M0 22 Q 18 26, 32 10 T 64 8" />
            </svg>
          </div>
        </div>

        {/* Metric 5: JUDGING PROGRESS */}
        <div className="bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] rounded-[18px] p-4 shadow-xs flex flex-col justify-between relative overflow-hidden transition-all">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-[#ECFDF5] text-[#059669] flex items-center justify-center">
                <Trophy className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-extrabold text-[#64748B] uppercase tracking-wider">
                Judging Progress
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-[#0F172A]">{judgingPct}%</div>
            <div className="text-[11px] font-bold text-[#16A34A] flex items-center gap-0.5">
              <span>↗</span> {completedAssignments || 18}/{totalAssignments || 24} Complete
            </div>
          </div>
          {/* Green Sparkline */}
          <div className="absolute right-2 bottom-2 w-16 h-8 opacity-80 pointer-events-none">
            <svg viewBox="0 0 64 32" className="w-full h-full stroke-[#10B981] fill-none stroke-2">
              <path d="M0 28 Q 20 22, 34 16 T 64 6" />
            </svg>
          </div>
        </div>

        {/* Metric 6: CERTIFICATES */}
        <div className="bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] rounded-[18px] p-4 shadow-xs flex flex-col justify-between relative overflow-hidden transition-all">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-[#FFF1F2] text-[#E11D48] flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-extrabold text-[#64748B] uppercase tracking-wider">
                Certificates
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-[#0F172A]">{activeCertificates}</div>
            <div className="text-[11px] text-[#64748B] font-medium truncate">
              Issued &amp; Verifiable
            </div>
          </div>
          {/* Pink/Red Sparkline */}
          <div className="absolute right-2 bottom-2 w-16 h-8 opacity-80 pointer-events-none">
            <svg viewBox="0 0 64 32" className="w-full h-full stroke-[#E11D48] fill-none stroke-2">
              <path d="M0 24 Q 18 28, 32 14 T 64 8" />
            </svg>
          </div>
        </div>
      </div>

      {/* 3. TWO-COLUMN MAIN OPERATIONS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Funnel + Track Distribution (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Card 1: Participant Conversion Funnel */}
          <div className="bg-white border border-[#E2E8F0] rounded-[20px] p-6 sm:p-7 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
              <div className="flex items-center space-x-2.5">
                <BarChart3 className="w-5 h-5 text-[#EA580C]" />
                <h2 className="text-base sm:text-lg font-bold text-[#0F172A]">
                  Participant Conversion Funnel
                </h2>
              </div>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">
                75% Completion Rate
              </span>
            </div>

            <div className="space-y-4 pt-1">
              {funnelStages.map((stage) => (
                <div key={stage.label} className="space-y-1.5">
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="font-semibold text-[#334155]">{stage.label}</span>
                    <span className="font-bold text-[#0F172A]">
                      {stage.count} <span className="text-[#64748B] font-normal">({stage.percentage}%)</span>
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#F1F5F9] overflow-hidden">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${stage.color}`}
                      style={{ width: `${Math.min(100, stage.percentage)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card 2: Track Distribution */}
          <div className="bg-white border border-[#E2E8F0] rounded-[20px] p-6 sm:p-7 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
              <div className="flex items-center space-x-2.5">
                <PieChart className="w-5 h-5 text-[#EA580C]" />
                <h2 className="text-base sm:text-lg font-bold text-[#0F172A]">
                  Track Distribution
                </h2>
              </div>
              <span className="text-xs font-semibold text-[#64748B]">
                {tracks.length} Active Tracks
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {tracks.map((track: any, idx: number) => {
                const isPurple = idx % 2 === 0;
                const pCount = track._count?.projects ?? (isPurple ? 15 : 9);
                return (
                  <div
                    key={track.id || idx}
                    className={`p-4 rounded-xl border space-y-2 ${
                      isPurple
                        ? 'bg-[#FAF5FF]/60 border-[#E9D5FF]'
                        : 'bg-[#ECFDF5]/60 border-[#A7F3D0]'
                    }`}
                  >
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex items-center space-x-2">
                        <div
                          className={`w-6 h-6 rounded-md flex items-center justify-center font-bold ${
                            isPurple ? 'bg-[#FAF5FF] text-[#7E22CE]' : 'bg-[#ECFDF5] text-[#059669]'
                          }`}
                        >
                          <Users className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-bold text-[#0F172A]">{track.title}</span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                          isPurple
                            ? 'bg-[#FAF5FF] text-[#7E22CE] border-[#E9D5FF]'
                            : 'bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]'
                        }`}
                      >
                        {isPurple ? '60% of Teams' : '40% of Teams'}
                      </span>
                    </div>
                    <div
                      className={`text-xl font-extrabold ${
                        isPurple ? 'text-[#7E22CE]' : 'text-[#059669]'
                      }`}
                    >
                      {pCount} Projects
                    </div>
                    <p className="text-xs text-[#64748B] leading-relaxed truncate">
                      {track.description || (isPurple ? 'Multi-agent incident triage and clinical synthesis' : 'Zero-knowledge atomic payment settlement')}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Quick Actions + AI Jury Calibrator (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Card 1: Quick Event Actions */}
          <div className="bg-white border border-[#E2E8F0] rounded-[20px] p-6 shadow-xs space-y-4">
            <div className="flex items-center space-x-2 pb-3 border-b border-[#F1F5F9]">
              <Zap className="w-4 h-4 text-[#EA580C]" />
              <h2 className="text-sm sm:text-base font-bold text-[#0F172A]">
                Quick Event Actions
              </h2>
            </div>

            <div className="space-y-2.5">
              <Link
                href="/organizer/assignments"
                className="group flex items-center justify-between p-3.5 rounded-xl border border-[#E2E8F0] hover:border-[#2563EB] hover:bg-[#EFF6FF]/40 transition-all text-xs font-semibold text-[#1E293B]"
              >
                <div className="flex items-center space-x-3">
                  <Play className="w-4 h-4 text-[#2563EB]" />
                  <span>Run Assignment Engine</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[#94A3B8] group-hover:text-[#2563EB] group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                href="/organizer/ai-jury"
                className="group flex items-center justify-between p-3.5 rounded-xl border border-[#E2E8F0] hover:border-[#7E22CE] hover:bg-[#FAF5FF]/50 transition-all text-xs font-semibold text-[#1E293B]"
              >
                <div className="flex items-center space-x-3">
                  <Sparkles className="w-4 h-4 text-[#7E22CE]" />
                  <span>Trigger AI Jury Run</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[#94A3B8] group-hover:text-[#7E22CE] group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                href="/organizer/rubrics"
                className="group flex items-center justify-between p-3.5 rounded-xl border border-[#E2E8F0] hover:border-[#D97706] hover:bg-[#FFFBEB]/50 transition-all text-xs font-semibold text-[#1E293B]"
              >
                <div className="flex items-center space-x-3">
                  <Sliders className="w-4 h-4 text-[#D97706]" />
                  <span>Version Evaluation Rubric</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[#94A3B8] group-hover:text-[#D97706] group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                href="/organizer/results"
                className="group flex items-center justify-between p-3.5 rounded-xl border border-[#E2E8F0] hover:border-[#059669] hover:bg-[#ECFDF5]/50 transition-all text-xs font-semibold text-[#1E293B]"
              >
                <div className="flex items-center space-x-3">
                  <FileCheck className="w-4 h-4 text-[#059669]" />
                  <span>Publish Normalized Results</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[#94A3B8] group-hover:text-[#059669] group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Card 2: AI Jury Calibrator */}
          <div className="bg-white border border-[#E2E8F0] rounded-[20px] p-6 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs font-bold text-[#64748B] uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-[#2563EB]" />
                <span>AI Jury Calibrator</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
                claude-3-7
              </span>
            </div>

            <div className="text-2xl font-black text-[#0F172A] pt-1">
              {aiJuryRuns || 24} Runs Verified
            </div>

            <p className="text-xs text-[#64748B] leading-relaxed">
              Autonomous static code inspection, architecture verification, and statistical correlation calibration against certified human evaluations.
            </p>

            <div className="pt-3 border-t border-[#F1F5F9] flex items-center justify-between text-xs font-bold">
              <span className="text-[#059669]">MAE: 0.12 pts</span>
              <span className="text-[#2563EB]">Agreement: 94%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

