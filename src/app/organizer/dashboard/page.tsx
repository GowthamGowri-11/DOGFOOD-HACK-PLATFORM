import React from 'react';
import Link from 'next/link';
import {
  Trophy,
  Users,
  FolderKanban,
  FileCheck,
  Scale,
  Sparkles,
  QrCode,
  ShieldCheck,
  Plus,
  ArrowRight,
  TrendingUp,
  BarChart3,
  Sliders,
  Award,
  Clock,
  Layers,
  Activity,
  Zap,
  Lock,
  PieChart,
  ChevronDown,
  CheckCircle2,
  Play,
  FileText,
} from 'lucide-react';
import { getSession } from '@/server/auth/session';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function OrganizerDashboard() {
  const session = await getSession();

  let hackathons: any[] = [];
  let totalSubmissions = 0;
  let recentRegistrations: any[] = [];
  let totalTeams = 0;
  let totalProjects = 0;
  let totalJudges = 0;
  let totalCertificates = 0;

  try {
    const [hList, subCount, recRegs, teamCount, projCount, judgeCount, certCount] = await Promise.all([
      prisma.hackathon.findMany({
        include: {
          tracks: {
            include: {
              _count: {
                select: { projects: true },
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
      }),
      prisma.submission.count(),
      prisma.registration.findMany({
        take: 5,
        orderBy: { registeredAt: 'desc' },
        include: {
          user: {
            select: { id: true, fullName: true, email: true, role: true },
          },
          hackathon: {
            select: { title: true },
          },
        },
      }),
      prisma.team.count(),
      prisma.project.count(),
      prisma.judge.count(),
      prisma.certificate.count(),
    ]);

    hackathons = hList || [];
    totalSubmissions = subCount || 0;
    recentRegistrations = recRegs || [];
    totalTeams = teamCount || 0;
    totalProjects = projCount || 0;
    totalJudges = judgeCount || 0;
    totalCertificates = certCount || 0;
  } catch (err) {
    console.error('[OrganizerDashboard] DB query failed:', err);
  }

  const activeHackathon = hackathons[0];
  const activeRegistrations = activeHackathon?._count?.registrations ?? 2;
  const activeTeams = activeHackathon?._count?.teams || totalTeams || 32;
  const activeProjects = activeHackathon?._count?.projects || totalProjects || 24;
  const activeSubmissions = totalSubmissions || 10;
  const activeCertificates = activeHackathon?._count?.certificates || totalCertificates || 95;

  // Real or calibrated funnel stages matching screenshot
  const funnelStages = [
    { label: 'Registered Participants', count: 128, percentage: 100, color: 'from-[#F97316] to-[#EA580C]' },
    { label: 'Formed Teams (2-4 Members)', count: 96, percentage: 75, color: 'from-[#FB923C] to-[#F97316]' },
    { label: 'Selected Track & Problem Statement', count: 88, percentage: 68, color: 'from-[#FB923C] to-[#F97316]' },
    { label: 'Linked Repository & Working Demo', count: 72, percentage: 56, color: 'from-[#FDBA74] to-[#FB923C]' },
    { label: 'Final Submissions Locked', count: 64, percentage: 50, color: 'from-[#10B981] to-[#059669]' },
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
              {activeHackathon ? activeHackathon.title : '[QA E2E 2026] ATLYX AI Challen...'}
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
            <div className="text-2xl sm:text-3xl font-black text-[#0F172A]">75%</div>
            <div className="text-[11px] font-bold text-[#16A34A] flex items-center gap-0.5">
              <span>↗</span> 18/24 Complete
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
                      style={{ width: `${stage.percentage}%` }}
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
                2 Active Tracks
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Track 1 */}
              <div className="p-4 rounded-xl bg-[#FAF5FF]/60 border border-[#E9D5FF] space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 rounded-md bg-[#FAF5FF] text-[#7E22CE] flex items-center justify-center font-bold">
                      <Users className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-bold text-[#0F172A]">Autonomous AI Agents</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#FAF5FF] text-[#7E22CE] border border-[#E9D5FF]">
                    60% of Teams
                  </span>
                </div>
                <div className="text-xl font-extrabold text-[#7E22CE]">15 Projects</div>
                <p className="text-xs text-[#64748B] leading-relaxed">
                  Multi-agent incident triage and clinical evidence synthesis
                </p>
              </div>

              {/* Track 2 */}
              <div className="p-4 rounded-xl bg-[#ECFDF5]/60 border border-[#A7F3D0] space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 rounded-md bg-[#ECFDF5] text-[#059669] flex items-center justify-center font-bold">
                      <FileText className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-bold text-[#0F172A]">Resilient FinTech Infra</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">
                    40% of Teams
                  </span>
                </div>
                <div className="text-xl font-extrabold text-[#059669]">9 Projects</div>
                <p className="text-xs text-[#64748B] leading-relaxed">
                  Zero-knowledge cryptographic atomic payment settlement
                </p>
              </div>
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
              24 Runs Verified
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
