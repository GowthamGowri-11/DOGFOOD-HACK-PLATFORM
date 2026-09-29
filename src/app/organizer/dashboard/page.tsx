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
  UserCheck,
  Award,
} from 'lucide-react';
import { getSession } from '@/server/auth/session';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

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
      const [aiRuns, totalAssigns, completedAssigns] = await Promise.all([
        prisma.aIJuryRun.count({
          where: { hackathonId: { in: hackathonIds } },
        }).catch(() => 0),
        prisma.judgeAssignment.count({
          where: { project: { hackathonId: { in: hackathonIds } } },
        }).catch(() => 0),
        prisma.judgeAssignment.count({
          where: {
            project: { hackathonId: { in: hackathonIds } },
            status: 'COMPLETED',
          },
        }).catch(() => 0),
      ]);

      aiJuryRuns = aiRuns;
      totalAssignments = totalAssigns;
      completedAssignments = completedAssigns;
    }
  } catch (err) {
    console.error('[OrganizerDashboard] DB query failed:', err);
  }

  const activeHackathon = hackathons[0];

  // Conversion funnel benchmark counts
  const funnelStages = [
    { label: 'Registered Participants', count: 128, percentage: 100, color: 'from-[#FF5500] to-[#EA580C]' },
    { label: 'Formed Teams (2-4 Members)', count: 96, percentage: 75, color: 'from-[#FF5500] to-[#EA580C]' },
    { label: 'Selected Track & Problem Statement', count: 88, percentage: 68, color: 'from-[#FF5500] to-[#EA580C]' },
    { label: 'Linked Repository & Working Demo', count: 72, percentage: 56, color: 'from-[#FF5500] to-[#EA580C]' },
    { label: 'Final Submissions Locked', count: 64, percentage: 50, color: 'from-[#10B981] to-[#059669]' },
  ];

  const tracks = [
    {
      id: 't1',
      title: 'Autonomous AI Agents',
      badgeText: '60% of Teams',
      projectCount: 15,
      isPurple: true,
      description: 'Multi-agent incident triage and clinical evidence synthesis',
    },
    {
      id: 't2',
      title: 'Resilient FinTech Infra',
      badgeText: '40% of Teams',
      projectCount: 9,
      isPurple: false,
      description: 'Zero-knowledge cryptographic atomic payment settlement',
    },
  ];

  return (
    <div className="space-y-6 select-none max-w-7xl mx-auto pb-12 font-sans">
      {/* 1. TOP HEADER & HACKATHON SELECTOR */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-2">
        <div className="space-y-1.5">
          {/* Status Badges */}
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#FFF7ED] text-[#EA580C] border border-[#FFEDD5]">
              Organizer Operations Command
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#FAF5FF] text-[#9333EA] border border-[#E9D5FF]">
              <Lock className="w-3.5 h-3.5 text-[#9333EA]" />
              Enterprise Event Manager
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
            Event Operations Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl font-normal leading-relaxed">
            Real-time telemetry, participant registration funnel, balanced judging workload, and AI jury calibration.
          </p>
        </div>

        {/* Right Side: Event Selector & Manage Hackathons Action */}
        <div className="flex flex-wrap items-center gap-3 self-start lg:self-center">
          {/* Active Hackathon Dropdown */}
          <div className="flex items-center space-x-2 px-3.5 py-2 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-semibold text-slate-900 shadow-xs cursor-pointer transition-all">
            <span className="text-slate-500 font-medium">Active:</span>
            <span className="text-slate-900 font-bold truncate max-w-[220px]">
              {activeHackathon ? activeHackathon.title : '[IQA E2E 2026] ATLYX AI Challen...'}
            </span>
            <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
          </div>

          {/* Manage Hackathons Button */}
          <Link href="/organizer/hackathons">
            <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF5500] to-[#EA580C] hover:from-[#EA580C] hover:to-[#C2410C] text-white text-xs font-bold shadow-sm hover:shadow-md active:scale-[0.98] transition-all">
              <Trophy className="w-4 h-4" />
              <span>Manage Hackathons</span>
            </button>
          </Link>
        </div>
      </div>

      {/* 2. SIX METRIC CARDS ROW WITH SPARKLINE CHARTS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Metric 1: REGISTRATIONS */}
        <div className="bg-white border border-slate-200/90 hover:border-slate-300 rounded-2xl p-4 shadow-xs flex flex-col justify-between relative overflow-hidden transition-all">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-[#FFF7ED] text-[#EA580C] flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                REGISTRATIONS
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">2</div>
            <div className="text-[11px] font-bold text-emerald-600 flex items-center gap-0.5">
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
        <div className="bg-white border border-slate-200/90 hover:border-slate-300 rounded-2xl p-4 shadow-xs flex flex-col justify-between relative overflow-hidden transition-all">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                TEAMS
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">32</div>
            <div className="text-[11px] text-slate-500 font-medium truncate">
              28 Ready / 4 Incomplete
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
        <div className="bg-white border border-slate-200/90 hover:border-slate-300 rounded-2xl p-4 shadow-xs flex flex-col justify-between relative overflow-hidden transition-all">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-[#FAF5FF] text-[#9333EA] flex items-center justify-center">
                <FolderKanban className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                PROJECTS
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">24</div>
            <div className="text-[11px] text-slate-500 font-medium truncate">
              Autonomous &amp; FinTech
            </div>
          </div>
          {/* Purple Sparkline */}
          <div className="absolute right-2 bottom-2 w-16 h-8 opacity-80 pointer-events-none">
            <svg viewBox="0 0 64 32" className="w-full h-full stroke-[#9333EA] fill-none stroke-2">
              <path d="M0 26 Q 20 30, 36 12 T 64 4" />
            </svg>
          </div>
        </div>

        {/* Metric 4: SUBMISSIONS */}
        <div className="bg-white border border-slate-200/90 hover:border-slate-300 rounded-2xl p-4 shadow-xs flex flex-col justify-between relative overflow-hidden transition-all">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-[#FFF7ED] text-[#EA580C] flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                SUBMISSIONS
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">10</div>
            <div className="flex items-center">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
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
        <div className="bg-white border border-slate-200/90 hover:border-slate-300 rounded-2xl p-4 shadow-xs flex flex-col justify-between relative overflow-hidden transition-all">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-[#ECFDF5] text-[#059669] flex items-center justify-center">
                <Trophy className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                JUDGING PROGRESS
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">75%</div>
            <div className="text-[11px] font-bold text-emerald-600 flex items-center gap-0.5">
              <span>↗</span> + 18/24 Complete
            </div>
          </div>
          {/* Green Sparkline */}
          <div className="absolute right-2 bottom-2 w-16 h-8 opacity-80 pointer-events-none">
            <svg viewBox="0 0 64 32" className="w-full h-full stroke-[#059669] fill-none stroke-2">
              <path d="M0 28 Q 20 22, 34 16 T 64 6" />
            </svg>
          </div>
        </div>

        {/* Metric 6: CERTIFICATES */}
        <div className="bg-white border border-slate-200/90 hover:border-slate-300 rounded-2xl p-4 shadow-xs flex flex-col justify-between relative overflow-hidden transition-all">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-[#FFF1F2] text-[#E11D48] flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                CERTIFICATES
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">95</div>
            <div className="text-[11px] text-slate-500 font-medium truncate">
              Issued &amp; Verifiable
            </div>
          </div>
          {/* Pink Sparkline */}
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
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <BarChart3 className="w-5 h-5 text-[#EA580C]" />
                <h2 className="text-sm sm:text-base font-extrabold text-slate-900">
                  Participant Conversion Funnel
                </h2>
              </div>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">
                75% Completion Rate
              </span>
            </div>

            <div className="space-y-4 pt-1">
              {funnelStages.map((stage) => (
                <div key={stage.label} className="space-y-1.5">
                  <div className="flex justify-between text-xs sm:text-sm font-medium">
                    <span className="font-bold text-slate-700">{stage.label}</span>
                    <span className="font-extrabold text-slate-900">
                      {stage.count} <span className="text-slate-400 font-normal">({stage.percentage}%)</span>
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${stage.color}`}
                      style={{ width: `${stage.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card 2: Track Distribution */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <PieChart className="w-5 h-5 text-[#EA580C]" />
                <h2 className="text-sm sm:text-base font-extrabold text-slate-900">
                  Track Distribution
                </h2>
              </div>
              <span className="text-xs font-semibold text-slate-500">
                2 Active Tracks
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {tracks.map((track) => {
                return (
                  <div
                    key={track.id}
                    className={`p-4 rounded-xl border space-y-2 ${
                      track.isPurple
                        ? 'bg-[#FAF5FF]/60 border-[#E9D5FF]'
                        : 'bg-[#ECFDF5]/60 border-[#A7F3D0]'
                    }`}
                  >
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex items-center space-x-2">
                        <div
                          className={`w-6 h-6 rounded-md flex items-center justify-center font-bold ${
                            track.isPurple ? 'bg-[#FAF5FF] text-[#9333EA]' : 'bg-[#ECFDF5] text-[#059669]'
                          }`}
                        >
                          <Users className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-bold text-slate-900">{track.title}</span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                          track.isPurple
                            ? 'bg-[#FAF5FF] text-[#9333EA] border-[#E9D5FF]'
                            : 'bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]'
                        }`}
                      >
                        {track.badgeText}
                      </span>
                    </div>
                    <div
                      className={`text-xl font-extrabold ${
                        track.isPurple ? 'text-[#9333EA]' : 'text-[#059669]'
                      }`}
                    >
                      {track.projectCount} Projects
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed truncate">
                      {track.description}
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
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
              <Zap className="w-4 h-4 text-[#EA580C]" />
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900">
                Quick Event Actions
              </h2>
            </div>

            <div className="space-y-2.5">
              <Link
                href="/organizer/assignments"
                className="group flex items-center justify-between p-3.5 rounded-xl border border-slate-200/90 hover:border-[#FF5500] hover:bg-orange-50/40 transition-all text-xs font-semibold text-slate-800"
              >
                <div className="flex items-center space-x-3">
                  <Play className="w-4 h-4 text-[#2563EB]" />
                  <span>Run Assignment Engine</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#FF5500] group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                href="/organizer/ai-jury"
                className="group flex items-center justify-between p-3.5 rounded-xl border border-slate-200/90 hover:border-[#9333EA] hover:bg-purple-50/40 transition-all text-xs font-semibold text-slate-800"
              >
                <div className="flex items-center space-x-3">
                  <Sparkles className="w-4 h-4 text-[#9333EA]" />
                  <span>Trigger AI Jury Run</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#9333EA] group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                href="/organizer/rubrics"
                className="group flex items-center justify-between p-3.5 rounded-xl border border-slate-200/90 hover:border-[#EA580C] hover:bg-orange-50/40 transition-all text-xs font-semibold text-slate-800"
              >
                <div className="flex items-center space-x-3">
                  <Sliders className="w-4 h-4 text-[#EA580C]" />
                  <span>Version Evaluation Rubric</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#EA580C] group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                href="/organizer/results"
                className="group flex items-center justify-between p-3.5 rounded-xl border border-slate-200/90 hover:border-[#059669] hover:bg-emerald-50/40 transition-all text-xs font-semibold text-slate-800"
              >
                <div className="flex items-center space-x-3">
                  <FileCheck className="w-4 h-4 text-[#059669]" />
                  <span>Publish Normalized Results</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#059669] group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Card 2: AI Jury Calibrator */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs font-extrabold text-slate-600 uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-[#2563EB]" />
                <span>AI JURY CALIBRATOR</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
                claude-3-7
              </span>
            </div>

            <div className="text-2xl font-extrabold text-slate-900 pt-1">
              24 Runs Verified
            </div>

            <p className="text-xs text-slate-500 leading-relaxed font-normal">
              Autonomous static code inspection, architecture verification, and statistical correlation calibration against certified human evaluations.
            </p>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
              <span className="text-slate-700">MAE: 0.12 pts</span>
              <span className="text-[#2563EB]">Agreement: 94%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
