'use client';

import React from 'react';
import Link from 'next/link';
import {
  Trophy,
  Users,
  Cpu,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Globe,
  Clock,
} from 'lucide-react';
import { AppShell } from '@/components/ui/AppShell';
import { HackathonCard } from '@/components/ui/HackathonCard';
import { Badge } from '@/components/ui/Badge';

export default function HomePage() {
  return (
    <AppShell
      userRole="PARTICIPANT"
      showFeaturedRail={true}
      pageTitle="Discover & Compete"
      pageSubtitle="The enterprise platform for student, developer and AI competitions with calibrated judging."
    >
      {/* Hero Announcement Banner */}
      <div className="bg-gradient-to-r from-[#EFF6FF] via-[#F8FAFC] to-[#F1F5F9] border border-[#BFDBFE] rounded-[18px] p-6 sm:p-7 shadow-card space-y-3.5">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white border border-[#BFDBFE] text-[#2563EB] text-xs font-semibold shadow-card">
          <Sparkles className="w-3.5 h-3.5 text-[#2563EB]" />
          <span>New Season Competitions Active</span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-tight leading-snug">
          Build Solutions. Compete Globally. Get Verified.
        </h2>

        <p className="text-sm text-[#475569] max-w-xl leading-relaxed">
          Participate in transparent hackathons powered by strict judge isolation, balanced workload assignment, and autonomous AI jury evidence analysis.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Link
            href="/hackathons"
            className="inline-flex items-center px-4 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold rounded-[10px] shadow-sm transition-all"
          >
            <span>Explore Hackathons</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
          </Link>
          <Link
            href="/projects"
            className="inline-flex items-center px-4 py-2.5 bg-white hover:bg-[#F8FAFC] text-[#334155] border border-[#CBD5E1] text-xs font-semibold rounded-[10px] transition-all"
          >
            <span>View Project Showcase</span>
          </Link>
        </div>
      </div>

      {/* Featured Competition Section */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-[#111827]">Active Competitions</h3>
          <Link
            href="/hackathons"
            className="text-xs font-semibold text-[#2563EB] hover:underline inline-flex items-center"
          >
            <span>View all</span>
            <ArrowRight className="w-3 h-3 ml-1" />
          </Link>
        </div>

        {/* Featured Hackathon Card */}
        <HackathonCard
          id="hack_apex_2026"
          slug="apex-ai-global-hackathon-2026"
          title="Apex AI Global Hackathon 2026"
          tagline="Building Enterprise Intelligent Agents at Planetary Scale"
          organizationName="Apex Frontier Systems"
          status="JUDGING"
          minTeamSize={1}
          maxTeamSize={4}
          eventMode="Online"
          tracks={[
            { id: 'trk_1', title: 'Autonomous AI Agents' },
            { id: 'trk_2', title: 'Resilient FinTech Infra' },
          ]}
          prizes={[{ amount: 35000, currency: 'USD', title: 'Grand Champion' }]}
          deadlineDate={new Date(Date.now() + 86400000 * 3)}
          registeredCount={142}
          featured={true}
        />
      </div>

      {/* Value Pillars Cards */}
      <div className="pt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-[#E2E8F0] rounded-[16px] p-5 shadow-card space-y-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-bold text-[#111827]">Strict Judge Isolation</h4>
          <p className="text-xs text-[#64748B] leading-relaxed">
            Judges evaluate assigned projects in complete isolation without seeing peer scores or private deliberations.
          </p>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-[16px] p-5 shadow-card space-y-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#FAF5FF] border border-[#E9D5FF] text-[#7E22CE] flex items-center justify-center">
            <Cpu className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-bold text-[#111827]">Autonomous AI Jury</h4>
          <p className="text-xs text-[#64748B] leading-relaxed">
            AI Jury inspects repositories, documentation, and architecture to extract objective evidence and confidence ratings.
          </p>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-[16px] p-5 shadow-card space-y-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] text-[#059669] flex items-center justify-center">
            <Zap className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-bold text-[#111827]">Statistical Normalization</h4>
          <p className="text-xs text-[#64748B] leading-relaxed">
            Z-Score and Trimmed-Mean algorithms balance judge leniency and strictness for fair, reproducible rankings.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
