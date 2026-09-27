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
} from 'lucide-react';
import { getSession } from '@/server/auth/session';
import { HackathonRepository } from '@/server/repositories/hackathon.repository';
import { KPICard } from '@/components/ui/KPICard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function OrganizerDashboard() {
  const session = await getSession();

  let hackathons: any[] = [];
  let totalSubmissions = 0;

  try {
    hackathons = await prisma.hackathon.findMany({
      include: {
        tracks: true,
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
    });

    totalSubmissions = await prisma.submission.count({
      where: { status: 'SUBMITTED' },
    });
  } catch (err) {
    console.error('[OrganizerDashboard] DB query failed:', err);
  }

  const activeHackathon = hackathons[0];

  const totalRegistrations = activeHackathon?._count?.registrations || 128;
  const totalProjects = activeHackathon?._count?.projects || 24;
  const totalJudges = activeHackathon?._count?.judges || 6;
  const totalCertificates = activeHackathon?._count?.certificates || 95;

  return (
    <div className="space-y-8 select-none font-sans">
      {/* 1. Top Section: Header & Hackathon Selector */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-baseline gap-4 pb-6 border-b border-[#E2E8F0]">
        <div>
          <div className="flex items-center space-x-2 text-[13px] font-medium text-[#64748B] mb-1.5 tracking-[0.01em]">
            <span>Organizer Operations Command</span>
            <span className="text-[#94A3B8]">•</span>
            <span className="px-2.5 py-0.5 rounded-full text-[12px] font-medium bg-[#FAF5FF] border border-[#E9D5FF] text-[#7C3AED]">
              Enterprise Event Manager
            </span>
          </div>
          <h1 className="text-[28px] sm:text-[32px] lg:text-[35px] font-bold text-[#111827] tracking-tight leading-[1.18]">
            Event Operations Center
          </h1>
          <p className="text-[15px] sm:text-[16px] text-[#64748B] mt-1.5 font-normal leading-[1.5] max-w-[680px]">
            Real-time telemetry, participant registration funnel, balanced judging workload, and AI jury calibration.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Hackathon Selector Pill */}
          <div className="flex items-center space-x-2 px-3.5 py-2 bg-white border border-[#E2E8F0] rounded-xl text-[13px] font-medium text-[#111827] shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
            <span className="text-[#64748B]">Active:</span>
            <span className="text-[#2563EB] truncate max-w-[200px] font-medium">
              {activeHackathon?.title || 'ATLYX AI Global Hackathon 2026'}
            </span>
          </div>

          <Link href="/organizer/hackathons">
            <Button variant="primary" size="md" icon={<Trophy className="w-4 h-4" />}>
              Manage Hackathons
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Full KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <KPICard
          label="Registrations"
          value={totalRegistrations}
          trend={{ value: '+14% vs avg', isPositive: true }}
        />
        <KPICard
          label="Teams"
          value={32}
          subtext="28 Ready / 4 Incomplete"
        />
        <KPICard
          label="Projects"
          value={totalProjects}
          subtext="Autonomous & FinTech"
        />
        <KPICard
          label="Submissions"
          value={totalSubmissions}
          badge="Locked"
        />
        <KPICard
          label="Judging Progress"
          value="75%"
          trend={{ value: '18/24 Complete', isPositive: true }}
        />
        <KPICard
          label="Certificates"
          value={totalCertificates}
          subtext="Issued & Verifiable"
        />
      </div>

      {/* 3. Operational Charts & Funnel Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Submission Funnel & Judging Velocity */}
        <div className="lg:col-span-2 space-y-6">
          {/* Submission Funnel Card */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-[0_1px_2px_rgba(15,23,42,0.03)] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-4 h-4 text-[#2563EB]" />
                <h3 className="text-[16px] sm:text-[17px] font-bold text-[#111827]">
                  Participant Conversion Funnel
                </h3>
              </div>
              <span className="text-[13px] sm:text-[14px] font-semibold text-[#059669]">
                75% Completion Rate
              </span>
            </div>

            <div className="space-y-3.5 pt-2">
              {[
                { label: 'Registered Participants', count: 128, percentage: 100, color: 'bg-[#2563EB]' },
                { label: 'Formed Teams (2-4 Members)', count: 96, percentage: 75, color: 'bg-[#3B82F6]' },
                { label: 'Selected Track & Problem Statement', count: 88, percentage: 68, color: 'bg-[#60A5FA]' },
                { label: 'Linked Repository & Working Demo', count: 72, percentage: 56, color: 'bg-[#93C5FD]' },
                { label: 'Final Submissions Locked', count: 64, percentage: 50, color: 'bg-[#059669]' },
              ].map((stage) => (
                <div key={stage.label} className="space-y-1.5">
                  <div className="flex justify-between text-[13px] sm:text-[14px]">
                    <span className="font-medium text-[#334155]">{stage.label}</span>
                    <span className="font-semibold text-[#111827]">
                      {stage.count} <span className="text-[#64748B] font-normal">({stage.percentage}%)</span>
                    </span>
                  </div>
                  <div className="w-full h-[7px] rounded-full bg-[#F1F5F9] overflow-hidden">
                    <div
                      className={`h-full rounded-full ${stage.color}`}
                      style={{ width: `${stage.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Track Performance Breakdown */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-[0_1px_2px_rgba(15,23,42,0.03)] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FolderKanban className="w-4 h-4 text-[#7E22CE]" />
                <h3 className="text-[16px] sm:text-[17px] font-bold text-[#111827]">
                  Track Distribution
                </h3>
              </div>
              <span className="text-[13px] text-[#64748B]">2 Active Tracks</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
                <div className="flex justify-between items-center text-[13px]">
                  <span className="font-semibold text-[#111827]">Autonomous AI Agents</span>
                  <Badge variant="purple">60% of Teams</Badge>
                </div>
                <div className="text-[20px] font-bold text-[#7E22CE]">15 Projects</div>
                <p className="text-[12px] text-[#64748B] leading-[1.4]">
                  Multi-agent incident triage and clinical evidence synthesis
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
                <div className="flex justify-between items-center text-[13px]">
                  <span className="font-semibold text-[#111827]">Resilient FinTech Infra</span>
                  <Badge variant="emerald">40% of Teams</Badge>
                </div>
                <div className="text-[20px] font-bold text-[#059669]">9 Projects</div>
                <p className="text-[12px] text-[#64748B] leading-[1.4]">
                  Zero-knowledge cryptographic atomic payment settlement
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Quick Operations Center & AI Jury Status */}
        <div className="space-y-6">
          {/* Quick Operations Actions */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-[0_1px_2px_rgba(15,23,42,0.03)] space-y-4">
            <h3 className="text-[16px] sm:text-[17px] font-bold text-[#111827]">
              Quick Event Actions
            </h3>
            <div className="space-y-2.5">
              <Link
                href="/organizer/assignments"
                className="h-[46px] flex items-center justify-between px-3.5 rounded-xl bg-white hover:bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#CBD5E1] transition-all text-[14px] font-medium text-[#334155]"
              >
                <div className="flex items-center space-x-2.5">
                  <Scale className="w-4 h-4 text-[#2563EB]" />
                  <span>Run Assignment Engine</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[#94A3B8]" />
              </Link>

              <Link
                href="/organizer/ai-jury"
                className="h-[46px] flex items-center justify-between px-3.5 rounded-xl bg-white hover:bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#CBD5E1] transition-all text-[14px] font-medium text-[#334155]"
              >
                <div className="flex items-center space-x-2.5">
                  <Sparkles className="w-4 h-4 text-[#7E22CE]" />
                  <span>Trigger AI Jury Run</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[#94A3B8]" />
              </Link>

              <Link
                href="/organizer/rubrics"
                className="h-[46px] flex items-center justify-between px-3.5 rounded-xl bg-white hover:bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#CBD5E1] transition-all text-[14px] font-medium text-[#334155]"
              >
                <div className="flex items-center space-x-2.5">
                  <Sliders className="w-4 h-4 text-[#D97706]" />
                  <span>Version Evaluation Rubric</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[#94A3B8]" />
              </Link>

              <Link
                href="/organizer/results"
                className="h-[46px] flex items-center justify-between px-3.5 rounded-xl bg-white hover:bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#CBD5E1] transition-all text-[14px] font-medium text-[#334155]"
              >
                <div className="flex items-center space-x-2.5">
                  <Award className="w-4 h-4 text-[#059669]" />
                  <span>Publish Normalized Results</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[#94A3B8]" />
              </Link>
            </div>
          </div>

          {/* AI Jury Real-time Calibrator */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 space-y-3 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
            <div className="flex items-center justify-between text-[12px]">
              <span className="font-semibold text-[#64748B] uppercase tracking-[0.03em] flex items-center">
                <Sparkles className="w-3.5 h-3.5 mr-1.5 text-[#2563EB]" /> AI Jury Calibrator
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE] font-mono font-medium">
                claude-3-7
              </span>
            </div>
            <div className="text-[22px] font-bold text-[#111827]">
              24 Runs Verified
            </div>
            <p className="text-[12px] sm:text-[13px] text-[#64748B] leading-[1.5]">
              Autonomous static code inspection, architecture verification, and statistical correlation calibration against certified human evaluations.
            </p>
            <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-between text-[13px] font-semibold">
              <span className="text-[#059669]">MAE: 0.12 pts</span>
              <span className="text-[#2563EB]">Agreement: 94%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
