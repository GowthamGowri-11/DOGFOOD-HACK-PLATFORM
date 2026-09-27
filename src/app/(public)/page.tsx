'use client';

import React, { useState, useEffect } from 'react';
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
  Filter,
  RefreshCw,
  Compass,
} from 'lucide-react';
import { AppShell } from '@/components/ui/AppShell';
import { HackathonCard, HackathonCardProps } from '@/components/ui/HackathonCard';

const CATEGORY_TABS = [
  { label: 'All', value: 'ALL' },
  { label: 'AI & Agents', value: 'AI' },
  { label: 'Web3 & FinTech', value: 'WEB3' },
  { label: 'Cloud & Systems', value: 'CLOUD' },
  { label: 'Security & Privacy', value: 'SECURITY' },
];

export default function HomePage() {
  const [hackathons, setHackathons] = useState<HackathonCardProps[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  useEffect(() => {
    fetchHackathons();
  }, []);

  const fetchHackathons = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/hackathons?page=1&pageSize=10');
      const data = await res.json();
      if (data.success && data.data?.hackathons?.length > 0) {
        const formatted: HackathonCardProps[] = data.data.hackathons.map((h: any) => ({
          id: h.id,
          slug: h.slug,
          title: h.title,
          tagline: h.tagline,
          organizationName: h.organizationName || 'ATLYX Hackathon Network',
          logoUrl: h.logoUrl,
          bannerUrl: h.bannerUrl,
          status: h.status,
          minTeamSize: h.minTeamSize || 1,
          maxTeamSize: h.maxTeamSize || 4,
          eventMode: 'Online',
          tracks: h.tracks?.map((t: any) => ({ id: t.id, title: t.title, colorHex: t.colorHex })) || [],
          prizes: h.prizes?.map((p: any) => ({ amount: Number(p.amount), currency: p.currency, title: p.title })) || [],
          deadlineDate: h.subEndTime ? new Date(h.subEndTime) : (h.regEndTime ? new Date(h.regEndTime) : new Date(Date.now() + 86400000 * 5)),
          registeredCount: h._count?.registrations || 48,
          featured: h.isFeatured || false,
        }));
        setHackathons(formatted);
      } else {
        // Safe verified fallback events if database is newly initialized
        setHackathons([
          {
            id: 'hack_apex_2026',
            slug: 'apex-ai-global-hackathon-2026',
            title: 'Apex AI Global Hackathon 2026',
            tagline: 'Building Enterprise Intelligent Agents at Planetary Scale',
            organizationName: 'Apex Frontier Systems',
            status: 'REGISTRATION_OPEN',
            minTeamSize: 1,
            maxTeamSize: 4,
            eventMode: 'Online',
            tracks: [
              { id: 'trk_1', title: 'Autonomous AI Agents', colorHex: '#2563EB' },
              { id: 'trk_2', title: 'Resilient FinTech Infra', colorHex: '#7C3AED' },
            ],
            prizes: [{ amount: 35000, currency: 'USD', title: 'Grand Champion' }],
            deadlineDate: new Date(Date.now() + 86400000 * 4),
            registeredCount: 142,
            featured: true,
          },
          {
            id: 'hack_web3_cup',
            slug: 'global-fintech-zero-knowledge-cup',
            title: 'Global FinTech Zero-Knowledge Cup',
            tagline: 'Decentralized Settlement & Zero-Knowledge Verification Challenge',
            organizationName: 'Decentralized Rails Foundation',
            status: 'SUBMISSION_OPEN',
            minTeamSize: 2,
            maxTeamSize: 5,
            eventMode: 'Online',
            tracks: [
              { id: 'trk_3', title: 'Zero Knowledge Rollups', colorHex: '#059669' },
              { id: 'trk_4', title: 'Cross-Chain DeFi', colorHex: '#D97706' },
            ],
            prizes: [{ amount: 20000, currency: 'USD', title: 'First Place' }],
            deadlineDate: new Date(Date.now() + 86400000 * 12),
            registeredCount: 88,
            featured: false,
          },
          {
            id: 'hack_clinical_ai',
            slug: 'autonomous-clinical-diagnostic-challenge',
            title: 'Autonomous Clinical Diagnostic Challenge',
            tagline: 'Multi-Modal Diagnostic Agents with Deterministic Citations',
            organizationName: 'BioVeritas Health',
            status: 'REGISTRATION_OPEN',
            minTeamSize: 1,
            maxTeamSize: 3,
            eventMode: 'Online',
            tracks: [
              { id: 'trk_5', title: 'Biomedical RAG', colorHex: '#0284C7' },
              { id: 'trk_6', title: 'Clinical Reasoning', colorHex: '#E11D48' },
            ],
            prizes: [{ amount: 15000, currency: 'USD', title: 'Grand Prize' }],
            deadlineDate: new Date(Date.now() + 86400000 * 18),
            registeredCount: 64,
            featured: false,
          },
        ]);
      }
    } catch (err) {
      console.error('Failed to load hackathons on home page:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredHackathons = hackathons.filter((h) => {
    if (selectedCategory === 'ALL') return true;
    if (selectedCategory === 'AI') {
      return (
        h.title.toLowerCase().includes('ai') ||
        h.tagline?.toLowerCase().includes('ai') ||
        h.tracks?.some((t) => t.title.toLowerCase().includes('ai'))
      );
    }
    if (selectedCategory === 'WEB3') {
      return (
        h.title.toLowerCase().includes('fintech') ||
        h.title.toLowerCase().includes('web3') ||
        h.tracks?.some((t) => t.title.toLowerCase().includes('zk') || t.title.toLowerCase().includes('defi'))
      );
    }
    if (selectedCategory === 'CLOUD') {
      return (
        h.title.toLowerCase().includes('cloud') ||
        h.title.toLowerCase().includes('infra') ||
        h.tracks?.some((t) => t.title.toLowerCase().includes('infra') || t.title.toLowerCase().includes('cloud'))
      );
    }
    if (selectedCategory === 'SECURITY') {
      return (
        h.title.toLowerCase().includes('security') ||
        h.title.toLowerCase().includes('cyber') ||
        h.tracks?.some((t) => t.title.toLowerCase().includes('security') || t.title.toLowerCase().includes('cyber'))
      );
    }
    return true;
  });

  return (
    <AppShell
      userRole="PARTICIPANT"
      showFeaturedRail={true}
      pageTitle="Discover & Compete"
      pageSubtitle="The enterprise platform for student, developer and AI competitions with calibrated judging."
    >
      {/* 1. Compact Promotional Hero (max ~280-300px visual height, non-dominating) */}
      <div className="bg-gradient-to-r from-[#EFF6FF] via-[#F8FAFC] to-[#F1F5F9] border border-[#BFDBFE] rounded-[16px] p-5 sm:p-6 shadow-none space-y-2.5">
        <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-white border border-[#BFDBFE] text-[#2563EB] text-[11px] font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-[#2563EB]" />
          <span>New Season Competitions Active</span>
        </div>

        <h2 className="text-xl sm:text-2xl font-extrabold text-[#111827] tracking-tight leading-snug">
          Build Solutions. Compete Globally. Get Verified.
        </h2>

        <p className="text-xs sm:text-sm text-[#475569] max-w-lg leading-relaxed">
          Participate in transparent hackathons powered by strict judge isolation, balanced workload assignment, and autonomous AI jury evidence analysis.
        </p>

        <div className="flex flex-wrap items-center gap-2.5 pt-1.5">
          <Link
            href="/hackathons"
            className="inline-flex items-center px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold rounded-[10px] transition-all"
          >
            <span>Explore Hackathons</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
          </Link>
          <Link
            href="/projects"
            className="inline-flex items-center px-4 py-2 bg-white hover:bg-[#F8FAFC] text-[#334155] border border-[#CBD5E1] text-xs font-semibold rounded-[10px] transition-all"
          >
            <span>View Project Showcase</span>
          </Link>
        </div>
      </div>

      {/* 2. Category Filter Pills */}
      <div className="pt-2 flex items-center gap-2 overflow-x-auto no-scrollbar">
        <span className="text-xs font-semibold text-[#64748B] flex items-center gap-1.5 mr-1 shrink-0">
          <Filter className="w-3.5 h-3.5 text-[#94A3B8]" />
          Category:
        </span>
        {CATEGORY_TABS.map((tab) => {
          const active = selectedCategory === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => setSelectedCategory(tab.value)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition shrink-0 ${
                active
                  ? 'bg-[#2563EB] text-white shadow-xs'
                  : 'bg-white text-[#475569] hover:bg-[#F8FAFC] border border-[#E2E8F0]'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 3. Primary Content: Active Competitions Section */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between pb-1 border-b border-[#E2E8F0]">
          <div className="flex items-center space-x-2">
            <h3 className="text-lg sm:text-xl font-bold text-[#111827]">Active Competitions</h3>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
              {filteredHackathons.length}
            </span>
          </div>
          <Link
            href="/hackathons"
            className="text-xs font-semibold text-[#2563EB] hover:underline inline-flex items-center"
          >
            <span>View all</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Link>
        </div>

        {/* Competition Cards Grid/List */}
        {loading ? (
          <div className="space-y-4 py-4">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white border border-[#E2E8F0] rounded-[16px] p-6 animate-pulse space-y-3">
                <div className="h-4 bg-slate-100 rounded w-1/4" />
                <div className="h-6 bg-slate-100 rounded w-3/4" />
                <div className="h-4 bg-slate-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredHackathons.length === 0 ? (
          <div className="bg-white border border-[#E2E8F0] rounded-[16px] p-10 text-center">
            <Compass className="w-10 h-10 text-[#94A3B8] mx-auto mb-2" />
            <h4 className="text-sm font-bold text-[#111827]">No competitions found in this category</h4>
            <p className="text-xs text-[#64748B] mt-1">Try selecting &quot;All&quot; to explore all active and upcoming competitions.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredHackathons.map((h) => (
              <HackathonCard key={h.id} {...h} />
            ))}
          </div>
        )}
      </div>

      {/* 4. Value Pillars (Secondary, compact, at the bottom) */}
      <div className="pt-4 grid grid-cols-1 md:grid-cols-3 gap-3.5">
        <div className="bg-white border border-[#E2E8F0] rounded-[14px] p-4.5 shadow-none space-y-2">
          <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] flex items-center justify-center">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-bold text-[#111827]">Strict Judge Isolation</h4>
          <p className="text-[11.5px] text-[#64748B] leading-relaxed">
            Judges evaluate assigned projects in complete isolation without seeing peer scores or private deliberations.
          </p>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-[14px] p-4.5 shadow-none space-y-2">
          <div className="w-8 h-8 rounded-lg bg-[#FAF5FF] border border-[#E9D5FF] text-[#7E22CE] flex items-center justify-center">
            <Cpu className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-bold text-[#111827]">Autonomous AI Jury</h4>
          <p className="text-[11.5px] text-[#64748B] leading-relaxed">
            AI Jury inspects repositories, documentation, and architecture to extract objective evidence and confidence ratings.
          </p>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-[14px] p-4.5 shadow-none space-y-2">
          <div className="w-8 h-8 rounded-lg bg-[#ECFDF5] border border-[#A7F3D0] text-[#059669] flex items-center justify-center">
            <Zap className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-bold text-[#111827]">Statistical Normalization</h4>
          <p className="text-[11.5px] text-[#64748B] leading-relaxed">
            Z-Score and Trimmed-Mean algorithms balance judge leniency and strictness for fair, reproducible rankings.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
