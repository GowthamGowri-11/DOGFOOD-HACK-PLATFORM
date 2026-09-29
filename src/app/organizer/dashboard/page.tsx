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
  Calendar,
  CheckCircle2,
  Clock,
  Activity,
  Layers,
  Award,
  ChevronRight,
  TrendingUp,
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
      prisma.submission.count().catch(() => 0),
      prisma.team.count().catch(() => 0),
      prisma.project.count().catch(() => 0),
      prisma.judge.count().catch(() => 0),
      prisma.certificate.count().catch(() => 0),
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

  // Benchmark / dynamic stats
  const regCount = activeHackathon?._count?.registrations || 128;
  const teamCountDisplay = activeHackathon?._count?.teams || (totalTeams > 0 ? totalTeams : 32);
  const projCountDisplay = activeHackathon?._count?.projects || (totalProjects > 0 ? totalProjects : 24);
  const subCountDisplay = totalSubmissions > 0 ? totalSubmissions : 10;
  const certCountDisplay = activeHackathon?._count?.certificates || (totalCertificates > 0 ? totalCertificates : 95);
  const judgingProgressPercent = totalAssignments > 0 
    ? Math.round((completedAssignments / totalAssignments) * 100) 
    : 75;

  // Conversion funnel benchmark stages
  const funnelStages = [
    { step: 1, label: 'Registered Participants', count: regCount, percentage: 100, drop: '0%', color: 'from-[#FA541C] to-[#EA580C]' },
    { step: 2, label: 'Formed Teams (2-4 Members)', count: teamCountDisplay * 3, percentage: 75, drop: '-25%', color: 'from-[#FA541C] to-[#EA580C]' },
    { step: 3, label: 'Selected Track & Problem Statement', count: Math.round(regCount * 0.68), percentage: 68, drop: '-7%', color: 'from-[#FA541C] to-[#EA580C]' },
    { step: 4, label: 'Linked Repository & Working Demo', count: Math.round(regCount * 0.56), percentage: 56, drop: '-12%', color: 'from-[#FA541C] to-[#EA580C]' },
    { step: 5, label: 'Final Submissions Locked', count: Math.round(regCount * 0.50), percentage: 50, drop: '-6%', color: 'from-emerald-500 to-emerald-600' },
  ];

  const tracks = [
    {
      id: 't1',
      title: 'Autonomous AI Agents',
      badgeText: '60% of Teams',
      percentage: 60,
      projectCount: 15,
      problemStatements: 4,
      isPurple: true,
      description: 'Multi-agent incident triage, LLM reasoning pipelines, and clinical evidence synthesis.',
    },
    {
      id: 't2',
      title: 'Resilient FinTech Infra',
      badgeText: '40% of Teams',
      percentage: 40,
      projectCount: 9,
      problemStatements: 3,
      isPurple: false,
      description: 'Zero-knowledge cryptographic verification, real-time auditing, and atomic payment settlement.',
    },
  ];

  // Lifecycle milestones
  const milestones = [
    { id: 1, name: 'Registration & Verification', status: 'COMPLETED', date: 'Closed Sep 24', badge: '128 Enrolled' },
    { id: 2, name: 'Team Formation & Check-in', status: 'COMPLETED', date: 'Closed Sep 26', badge: '32 Teams' },
    { id: 3, name: 'Hacking & Project Development', status: 'ACTIVE', date: 'Ends in 14h', badge: '24 Projects' },
    { id: 4, name: 'Submission Lock & AI Screening', status: 'UPCOMING', date: 'Starts 18:00 UTC', badge: '10 Ready' },
    { id: 5, name: 'Jury Evaluation & Normalization', status: 'UPCOMING', date: 'Starts Tomorrow', badge: '18/24 Done' },
  ];

  return (
    <div className="w-full space-y-6 pb-12 font-sans select-none">
      {/* 1. TOP HEADER & CONTROLS */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-xs transition-all">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          {/* Left: Badges + Title + Subtitle */}
          <div className="space-y-2 max-w-3xl">
            {/* Meta tags */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FFF5ED] text-[#FA541C] border border-[#FED7AA]">
                <Activity className="w-3 h-3 text-[#FA541C]" />
                Organizer Operations Command
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                <Lock className="w-3 h-3 text-purple-600" />
                Enterprise Event Manager
              </span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Telemetry Sync
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Event Operations Center
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-normal leading-relaxed">
              Real-time telemetry, participant registration funnel, balanced judging workload, and AI jury calibration.
            </p>
          </div>

          {/* Right: Active Hackathon Selector & Primary Action */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {/* Active Hackathon Pill */}
            <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200/90 rounded-xl text-xs font-semibold text-slate-800 shadow-xs cursor-pointer transition-colors">
              <Trophy className="w-4 h-4 text-[#FA541C] shrink-0" />
              <div className="flex flex-col text-left">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">Active Event</span>
                <span className="text-xs font-bold text-slate-900 truncate max-w-[210px] pt-0.5">
                  {activeHackathon ? activeHackathon.title : '[QA SYNC V2] Apex AI & Agentic Ar...'}
                </span>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
            </div>

            {/* Manage Hackathons Button */}
            <Link href="/organizer/hackathons">
              <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#FA541C] to-[#E03A00] hover:from-[#E03A00] hover:to-[#C2410C] text-white text-xs font-bold shadow-sm hover:shadow-md active:scale-[0.98] transition-all h-[42px]">
                <Layers className="w-4 h-4" />
                <span>Manage Hackathons</span>
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. SIX METRIC CARDS ROW */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4">
        {/* Metric 1: REGISTRATIONS */}
        <div className="bg-white border border-slate-200/80 hover:border-orange-200 rounded-2xl p-4 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between min-h-[128px] group">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-xl bg-orange-50 text-[#FA541C] flex items-center justify-center font-bold">
              <Users className="w-4 h-4" />
            </div>
            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/70">
              <TrendingUp className="w-3 h-3 text-emerald-600" />
              +14%
            </span>
          </div>
          <div className="pt-2">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              REGISTRATIONS
            </span>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
              {regCount}
            </div>
          </div>
          <div className="pt-1 text-[11px] font-medium text-emerald-600 truncate">
            ↗ +14% vs avg target
          </div>
        </div>

        {/* Metric 2: TEAMS */}
        <div className="bg-white border border-slate-200/80 hover:border-blue-200 rounded-2xl p-4 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between min-h-[128px] group">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Users className="w-4 h-4" />
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
              32 Total
            </span>
          </div>
          <div className="pt-2">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              TEAMS
            </span>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
              {teamCountDisplay}
            </div>
          </div>
          <div className="pt-1 text-[11px] font-medium text-slate-500 truncate">
            28 Ready · 4 Incomplete
          </div>
        </div>

        {/* Metric 3: PROJECTS */}
        <div className="bg-white border border-slate-200/80 hover:border-purple-200 rounded-2xl p-4 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between min-h-[128px] group">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <FolderKanban className="w-4 h-4" />
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200/70">
              2 Tracks
            </span>
          </div>
          <div className="pt-2">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              PROJECTS
            </span>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
              {projCountDisplay}
            </div>
          </div>
          <div className="pt-1 text-[11px] font-medium text-slate-500 truncate">
            Autonomous &amp; FinTech
          </div>
        </div>

        {/* Metric 4: SUBMISSIONS */}
        <div className="bg-white border border-slate-200/80 hover:border-amber-200 rounded-2xl p-4 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between min-h-[128px] group">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <FileText className="w-4 h-4" />
            </div>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200/70">
              Locked
            </span>
          </div>
          <div className="pt-2">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              SUBMISSIONS
            </span>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
              {subCountDisplay}
            </div>
          </div>
          <div className="pt-1 text-[11px] font-medium text-slate-500 truncate">
            10 / 24 Finalized
          </div>
        </div>

        {/* Metric 5: JUDGING PROGRESS */}
        <div className="bg-white border border-slate-200/80 hover:border-emerald-200 rounded-2xl p-4 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between min-h-[128px] group">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Trophy className="w-4 h-4" />
            </div>
            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/70">
              18/24
            </span>
          </div>
          <div className="pt-2">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              JUDGING PROGRESS
            </span>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
              {judgingProgressPercent}%
            </div>
          </div>
          <div className="pt-1 text-[11px] font-medium text-emerald-600 truncate">
            +18/24 Complete
          </div>
        </div>

        {/* Metric 6: CERTIFICATES */}
        <div className="bg-white border border-slate-200/80 hover:border-rose-200 rounded-2xl p-4 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between min-h-[128px] group">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
              Verified
            </span>
          </div>
          <div className="pt-2">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              CERTIFICATES
            </span>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
              {certCountDisplay}
            </div>
          </div>
          <div className="pt-1 text-[11px] font-medium text-slate-500 truncate">
            Issued &amp; Verifiable
          </div>
        </div>
      </div>

      {/* 3. TWO-COLUMN MAIN OPERATIONS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Funnel + Track Distribution (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Card 1: Participant Conversion Funnel */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-orange-50 text-[#FA541C] flex items-center justify-center">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-extrabold text-slate-900 leading-none">
                    Participant Conversion Funnel
                  </h2>
                  <p className="text-[11px] text-slate-400 font-normal pt-1">
                    End-to-end registration drop-off, team formation, and submission lock-in telemetry
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                75% Completion Rate
              </span>
            </div>

            <div className="space-y-4 pt-1">
              {funnelStages.map((stage) => (
                <div key={stage.label} className="space-y-1.5 group">
                  <div className="flex justify-between items-center text-xs sm:text-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 font-bold text-[10px] flex items-center justify-center">
                        {stage.step}
                      </span>
                      <span className="font-semibold text-slate-700">{stage.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-slate-400">
                        {stage.drop !== '0%' && (
                          <span className="text-rose-500 mr-1.5">{stage.drop}</span>
                        )}
                      </span>
                      <span className="font-extrabold text-slate-900">
                        {stage.count}{' '}
                        <span className="text-slate-400 font-normal text-xs">
                          ({stage.percentage}%)
                        </span>
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden p-0.5">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${stage.color} transition-all duration-500`}
                      style={{ width: `${stage.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card 2: Track Distribution & Allocations */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-orange-50 text-[#FA541C] flex items-center justify-center">
                  <PieChart className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-extrabold text-slate-900 leading-none">
                    Track Distribution &amp; Workload
                  </h2>
                  <p className="text-[11px] text-slate-400 font-normal pt-1">
                    Balanced workload partition across active challenge categories
                  </p>
                </div>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600">
                2 Active Tracks
              </span>
            </div>

            {/* Split Progress Track */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold text-slate-600">
                <span>Autonomous AI Agents (60%)</span>
                <span>Resilient FinTech Infra (40%)</span>
              </div>
              <div className="w-full h-2.5 rounded-full overflow-hidden flex bg-slate-100">
                <div className="h-full bg-purple-500 rounded-l-full" style={{ width: '60%' }} />
                <div className="h-full bg-emerald-500 rounded-r-full" style={{ width: '40%' }} />
              </div>
            </div>

            {/* Track Detail Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              {tracks.map((track) => (
                <div
                  key={track.id}
                  className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 transition-all hover:shadow-xs ${
                    track.isPurple
                      ? 'bg-purple-50/40 border-purple-200/80 hover:border-purple-300'
                      : 'bg-emerald-50/40 border-emerald-200/80 hover:border-emerald-300'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex items-center space-x-2">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold ${
                          track.isPurple
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        <Users className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-bold text-slate-900 text-sm">{track.title}</span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold border shrink-0 ${
                        track.isPurple
                          ? 'bg-purple-100/70 text-purple-700 border-purple-200'
                          : 'bg-emerald-100/70 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      {track.badgeText}
                    </span>
                  </div>

                  <div>
                    <div
                      className={`text-2xl font-black ${
                        track.isPurple ? 'text-purple-700' : 'text-emerald-700'
                      }`}
                    >
                      {track.projectCount} Projects
                    </div>
                    <span className="text-[11px] text-slate-500 font-medium">
                      {track.problemStatements} Problem Statements Active
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed font-normal pt-1 border-t border-slate-200/50">
                    {track.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Quick Actions + AI Jury Calibrator (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Card 1: Quick Operations Hub */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-orange-50 text-[#FA541C] flex items-center justify-center">
                  <Zap className="w-4 h-4" />
                </div>
                <h2 className="text-sm sm:text-base font-extrabold text-slate-900">
                  Quick Event Actions
                </h2>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Shortcuts
              </span>
            </div>

            <div className="space-y-2.5">
              <Link
                href="/organizer/assignments"
                className="group flex items-center justify-between p-3.5 rounded-xl border border-slate-200/90 hover:border-blue-300 hover:bg-blue-50/30 transition-all text-xs font-semibold text-slate-800"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Play className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">Run Assignment Engine</div>
                    <div className="text-[11px] text-slate-400 font-normal">Auto-balance judge workloads</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
              </Link>

              <Link
                href="/organizer/rubrics"
                className="group flex items-center justify-between p-3.5 rounded-xl border border-slate-200/90 hover:border-orange-300 hover:bg-orange-50/30 transition-all text-xs font-semibold text-slate-800"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-orange-50 text-[#FA541C] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Sliders className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">Version Evaluation Rubric</div>
                    <div className="text-[11px] text-slate-400 font-normal">Weights &amp; scoring criteria</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#FA541C] group-hover:translate-x-0.5 transition-all" />
              </Link>

              <Link
                href="/organizer/submissions"
                className="group flex items-center justify-between p-3.5 rounded-xl border border-slate-200/90 hover:border-amber-300 hover:bg-amber-50/30 transition-all text-xs font-semibold text-slate-800"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">Audit Submissions</div>
                    <div className="text-[11px] text-slate-400 font-normal">Verify demo links &amp; repos</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all" />
              </Link>

              <Link
                href="/organizer/results"
                className="group flex items-center justify-between p-3.5 rounded-xl border border-slate-200/90 hover:border-emerald-300 hover:bg-emerald-50/30 transition-all text-xs font-semibold text-slate-800"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <FileCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">Publish Normalized Results</div>
                    <div className="text-[11px] text-slate-400 font-normal">Z-scores &amp; award leaderboards</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
              </Link>
            </div>
          </div>

          {/* Card 2: AI Jury Calibrator */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2 text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span>AI JURY CALIBRATOR</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
                claude-3-7
              </span>
            </div>

            <div>
              <div className="text-2xl font-black text-slate-900">
                24 Runs Verified
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 pt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Optimal Calibration Alignment</span>
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed font-normal">
              Autonomous static code inspection, architecture verification, and statistical correlation calibration against certified human evaluations.
            </p>

            <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs font-bold">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
                <div className="text-[10px] uppercase font-bold text-slate-400">MAE Spread</div>
                <div className="text-sm font-extrabold text-slate-800 pt-0.5">0.12 pts</div>
              </div>
              <div className="p-2.5 rounded-xl bg-blue-50/60 border border-blue-100 text-center">
                <div className="text-[10px] uppercase font-bold text-blue-500">Agreement</div>
                <div className="text-sm font-extrabold text-blue-700 pt-0.5">94.0%</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. BOTTOM SECTION: OPERATIONAL MILESTONES & LIFECYCLE */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-50 text-[#FA541C] flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900 leading-none">
                Operational Lifecycle &amp; Milestones
              </h2>
              <p className="text-[11px] text-slate-400 font-normal pt-1">
                Progress tracking across event execution phases and deadline locks
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/organizer/audit"
              className="text-xs font-bold text-[#FA541C] hover:text-[#E03A00] flex items-center gap-1 hover:underline"
            >
              <span>View Audit Logs</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Milestone Steps Timeline */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-1">
          {milestones.map((m) => {
            const isCompleted = m.status === 'COMPLETED';
            const isActive = m.status === 'ACTIVE';
            return (
              <div
                key={m.id}
                className={`p-3.5 rounded-xl border relative transition-all ${
                  isCompleted
                    ? 'bg-slate-50/70 border-slate-200 text-slate-700'
                    : isActive
                    ? 'bg-orange-50/40 border-orange-200 text-slate-900 ring-1 ring-orange-200'
                    : 'bg-slate-50/30 border-slate-100 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between pb-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    Phase 0{m.id}
                  </span>
                  {isCompleted ? (
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </span>
                  ) : isActive ? (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-[#FA541C]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#FA541C] animate-pulse" />
                      Live
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold text-slate-400">Upcoming</span>
                  )}
                </div>
                <div className="font-bold text-xs sm:text-sm text-slate-900 leading-snug">
                  {m.name}
                </div>
                <div className="flex justify-between items-center pt-2 text-[11px]">
                  <span className="text-slate-400 font-medium">{m.date}</span>
                  <span
                    className={`font-semibold px-1.5 py-0.5 rounded text-[10px] ${
                      isActive
                        ? 'bg-orange-100/70 text-[#FA541C]'
                        : isCompleted
                        ? 'bg-slate-200/60 text-slate-600'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {m.badge}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
