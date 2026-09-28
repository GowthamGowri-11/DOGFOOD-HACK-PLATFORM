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
import { useAuth } from '@/context/AuthContext';

const CATEGORY_TABS = [
  { label: 'All', value: 'ALL' },
  { label: 'AI & Agents', value: 'AI' },
  { label: 'Web3 & FinTech', value: 'WEB3' },
  { label: 'Cloud & Systems', value: 'CLOUD' },
  { label: 'Security & Privacy', value: 'SECURITY' },
];

// Baseline competitions matching the user's reference mockup
const EXACT_FEATURED_COMPETITIONS: HackathonCardProps[] = [
  {
    id: 'hack_apex_enterprise_2026',
    slug: 'apex-enterprise-hackathon-2026',
    title: 'Apex Enterprise Hackathon 2026',
    tagline: 'Scale Frontier Intelligence & Autonomous Cloud..',
    organizationName: 'ATLYX Platform',
    bannerUrl: '/banners/globe_network.jpg',
    status: 'COMPLETED',
    minTeamSize: 2,
    maxTeamSize: 4,
    roundsCount: 4,
    eventMode: 'Online',
    tracks: [
      { id: 'trk_1', title: 'Enterprise AI & Auto...' },
      { id: 'trk_2', title: 'Cloud Infrastructure' },
      { id: 'trk_3', title: '+ 2 more' },
    ],
    prizes: [{ amount: 40000, currency: 'USD', title: 'Grand Prize' }],
    deadlineDate: new Date(Date.now() - 86400000 * 2), // Ended
    registeredCount: 48,
    isHighlighted: false,
  },
  {
    id: 'hack_apex_ai_2026',
    slug: 'apex-ai-global-hackathon-2026',
    title: 'Apex AI Global Hackathon 2026',
    tagline: 'Building Enterprise Intelligent Agents at Planetary..',
    organizationName: 'Apex Frontier Systems',
    bannerUrl: '/banners/cyborg_ai.jpg',
    status: 'SUBMISSION_OPEN',
    minTeamSize: 1,
    maxTeamSize: 4,
    roundsCount: 2,
    eventMode: 'Online',
    tracks: [
      { id: 'trk_ai_1', title: 'Resilient FinTech Infr...' },
      { id: 'trk_ai_2', title: 'Autonomous AI Age...' },
    ],
    prizes: [{ amount: 35000, currency: 'USD', title: 'Grand Champion' }],
    deadlineDate: new Date(Date.now() + 86400000 * 7), // Deadline in 7 days
    registeredCount: 5,
    isHighlighted: false,
  },
  {
    id: 'hack_hacked_judge_2026',
    slug: 'hacked-by-judge',
    title: 'Hacked by Judge',
    tagline: 'Admin verified and monitored competition arena',
    organizationName: 'ATLYX Security Team',
    bannerUrl: '/banners/hacker_judge.jpg',
    status: 'REGISTRATION_OPEN',
    minTeamSize: 2,
    maxTeamSize: 4,
    roundsCount: 2,
    eventMode: 'Online',
    tracks: [
      { id: 'trk_hj_1', title: 'Autonomous AI Age...' },
      { id: 'trk_hj_2', title: 'High-Throughput Di...' },
    ],
    prizes: [{ amount: 50000, currency: 'USD', title: 'Security Bounty' }],
    deadlineDate: new Date(Date.now() + 86400000 * 11), // Deadline in 11 days
    registeredCount: 4,
    isHighlighted: false,
  },
];

export default function HomePage() {
  const { currentUser } = useAuth();
  const [hackathons, setHackathons] = useState<HackathonCardProps[]>(EXACT_FEATURED_COMPETITIONS);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  useEffect(() => {
    fetchHackathons();
  }, []);

  const fetchHackathons = async () => {
    try {
      const res = await fetch('/api/v1/hackathons?page=1&pageSize=10');
      const data = await res.json();
      if (data.success && Array.isArray(data.data?.hackathons) && data.data.hackathons.length > 0) {
        const dbItems: HackathonCardProps[] = data.data.hackathons.map((h: any) => ({
          id: h.id,
          slug: h.slug,
          title: h.title,
          organizationName: h.organizationName || 'ATLYX Platform',
          logoUrl: h.logoUrl,
          bannerUrl: h.bannerUrl || '/banners/globe_network.jpg',
          status: h.status,
          minTeamSize: h.minTeamSize || 1,
          maxTeamSize: h.maxTeamSize || 4,
          eventMode: 'Online',
          tracks: h.tracks?.map((t: any) => ({ id: t.id, title: t.title, colorHex: t.colorHex })) || [],
          prizes: h.prizes?.map((p: any) => ({ amount: Number(p.amount), currency: p.currency, title: p.title })) || [],
          deadlineDate: h.subEndTime ? new Date(h.subEndTime) : (h.regEndTime ? new Date(h.regEndTime) : new Date(Date.now() + 86400000 * 5)),
          registeredCount: h._count?.registrations || 0,
          featured: Boolean(h.isFeatured),
          rulesAndGuidelines: h.rulesAndGuidelines,
        }));

        // Merge DB hackathons with baseline showcase, prioritizing the exact visual cards
        const existingSlugs = new Set(EXACT_FEATURED_COMPETITIONS.map((c) => c.slug));
        const additional = dbItems.filter((item) => !existingSlugs.has(item.slug));
        setHackathons([...EXACT_FEATURED_COMPETITIONS, ...additional]);
      }
    } catch {
      // In case DB is sleeping or unreachable, keep robust mock showcase
      setHackathons(EXACT_FEATURED_COMPETITIONS);
    }
  };

  const filteredHackathons = hackathons.filter((h) => {
    if (selectedCategory === 'ALL') return true;
    if (selectedCategory === 'AI') {
      return (
        h.title.toLowerCase().includes('ai') ||
        h.tagline?.toLowerCase().includes('ai') ||
        h.tracks?.some((t) => t.title.toLowerCase().includes('ai') || t.title.toLowerCase().includes('agent'))
      );
    }
    if (selectedCategory === 'WEB3') {
      return (
        h.title.toLowerCase().includes('fintech') ||
        h.title.toLowerCase().includes('web3') ||
        h.tracks?.some((t) => t.title.toLowerCase().includes('zk') || t.title.toLowerCase().includes('fintech') || t.title.toLowerCase().includes('defi'))
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
        h.title.toLowerCase().includes('hacked') ||
        h.title.toLowerCase().includes('cyber') ||
        h.tracks?.some((t) => t.title.toLowerCase().includes('security') || t.title.toLowerCase().includes('cyber'))
      );
    }
    return true;
  });

  return (
    <AppShell showFeaturedRail={false}>
      <div className="space-y-6">
        {/* Role Workspace Active Banner — displays for Admin, Organizer, or Judge */}
        {currentUser && currentUser.role?.toUpperCase() !== 'PARTICIPANT' && (
          <div className="bg-gradient-to-r from-[#18181B] via-[#242220] to-[#18181B] text-white rounded-2xl p-4 sm:p-5 border border-[#3A3530] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg shadow-black/10">
            <div className="flex items-center space-x-3.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FA541C] to-[#E03A00] flex items-center justify-center text-white flex-shrink-0 shadow-md shadow-[#FA541C]/30">
                <ShieldCheck className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-extrabold text-[14.5px] text-white">
                    {currentUser.name}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#FA541C] text-white shadow-xs">
                    {currentUser.role?.toUpperCase() === 'ADMIN' ? 'SUPER ADMIN' : currentUser.role?.toUpperCase()} WORKSPACE ACTIVE
                  </span>
                </div>
                <p className="text-xs text-[#A1A1AA] mt-0.5">
                  You are browsing the public competition arena while authenticated with{' '}
                  <span className="text-[#FED7AA] font-semibold">{currentUser.role}</span> role privileges.
                </p>
              </div>
            </div>
            <Link
              href={
                currentUser.role?.toUpperCase() === 'ADMIN'
                  ? '/admin/dashboard'
                  : currentUser.role?.toUpperCase() === 'ORGANIZER'
                  ? '/organizer/dashboard'
                  : '/judge/dashboard'
              }
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FA541C] to-[#E03A00] hover:from-[#FF6636] hover:to-[#D4380D] text-white text-xs font-bold transition-all shadow-md shadow-[#FA541C]/25 hover:shadow-lg cursor-pointer whitespace-nowrap self-stretch sm:self-auto justify-center"
            >
              <span>Return to {currentUser.role?.toUpperCase() === 'ADMIN' ? 'Admin Dashboard' : `${currentUser.role} Workspace`}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {/* 1. Header Row: Discover & Compete + Taglines */}
        <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-4 pb-1">
          <div>
            <h1 className="text-[32px] sm:text-[38px] font-extrabold tracking-tight leading-tight">
              <span className="text-[#18181B]">Discover & </span>
              <span className="text-[#FA541C]">Compete</span>
            </h1>
            <p className="text-xs sm:text-[14px] text-[#6B7280] mt-1 font-normal">
              The enterprise platform for student, developer and AI competitions with calibrated judging.
            </p>
          </div>

          {/* Right Taglines Navigation with Orange Underline Indicator */}
          <div className="flex items-center space-x-2 sm:space-x-3 text-xs sm:text-[13px] text-[#71717A] font-medium self-start md:self-end">
            <span className="hover:text-[#FA541C] transition-colors cursor-pointer">Ideas</span>
            <span className="text-[#D4D4D8]">|</span>
            <span className="hover:text-[#FA541C] transition-colors cursor-pointer">Build</span>
            <span className="text-[#D4D4D8]">|</span>
            <span className="hover:text-[#FA541C] transition-colors cursor-pointer">Collaborate</span>
            <span className="text-[#D4D4D8]">|</span>
            <span className="relative pb-1 text-[#18181B] font-semibold cursor-pointer">
              Get Verified
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#FA541C] rounded-full" />
            </span>
          </div>
        </div>

        {/* 2. Hero Promotional Banner Card */}
        <div className="bg-[#F4EFEA] border border-[#E5DFD6] rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 grid grid-cols-1 lg:grid-cols-12 items-stretch group/hero">
          {/* Left Content */}
          <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-center space-y-3.5">
            <div>
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#FFEDE1] text-[#FA541C] text-[11px] font-bold border border-[#FED7AA] animate-pulse-subtle">
                <span>🔥</span>
                <span>New Season Competitions Active</span>
              </span>
            </div>

            <h2 className="text-2xl sm:text-[32px] font-black text-[#18181B] tracking-tight leading-[1.2]">
              Build Solutions. Compete Globally. Get Verified.
            </h2>

            <p className="text-xs sm:text-[13.5px] text-[#4B5563] leading-relaxed max-w-xl">
              Participate in transparent hackathons powered by strict judge isolation, balanced workload assignment, and autonomous AI jury evidence analysis.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/hackathons"
                className="inline-flex items-center space-x-2 px-5 py-2.5 bg-[#FA541C] hover:bg-[#EA4812] hover:shadow-lg hover:shadow-[#FA541C]/30 hover:-translate-y-0.5 active:translate-y-0 text-white text-xs font-bold rounded-lg shadow-sm transition-all duration-200 group/btn cursor-pointer"
              >
                <span>Explore Hackathons</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover/btn:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/projects"
                className="inline-flex items-center px-5 py-2.5 bg-white hover:bg-[#F9FAFB] hover:border-[#9CA3AF] hover:-translate-y-0.5 active:translate-y-0 text-[#374151] border border-[#D1D5DB] text-xs font-semibold rounded-lg shadow-xs transition-all duration-200 cursor-pointer"
              >
                <span>View Project Showcase</span>
              </Link>
            </div>
          </div>

          {/* Right Image */}
          <div className="lg:col-span-5 relative min-h-[220px] lg:min-h-full overflow-hidden">
            <img
              src="/atlyx-hero-arena.jpg"
              alt="ATLYX Competition Arena - Ideas today Impact tomorrow"
              className="w-full h-full object-cover object-center group-hover/hero:scale-105 transition-transform duration-700 ease-out"
            />
          </div>
        </div>

        {/* 3. Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
          <span className="text-xs font-semibold text-[#6B7280] flex items-center gap-1.5 mr-1 shrink-0">
            <Filter className="w-3.5 h-3.5 text-[#9CA3AF]" />
            Category:
          </span>
          {CATEGORY_TABS.map((tab) => {
            const active = selectedCategory === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setSelectedCategory(tab.value)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 shrink-0 cursor-pointer hover:-translate-y-0.5 active:scale-95 ${
                  active
                    ? 'bg-[#FA541C] text-white shadow-md shadow-[#FA541C]/25'
                    : 'bg-white text-[#4B5563] hover:text-[#111827] hover:border-[#CBD5E1] border border-[#E5E0D8]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* 4. Active Competitions Section */}
        <div className="space-y-4 pt-1">
          <div className="flex items-center justify-between pb-1 border-b border-[#ECE6DD]">
            <div className="flex items-center space-x-2">
              <h3 className="text-lg sm:text-[21px] font-bold text-[#18181B]">Active Competitions</h3>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FFEDE1] text-[#FA541C]">
                10
              </span>
            </div>
            <Link
              href="/hackathons"
              className="text-xs font-semibold text-[#FA541C] hover:text-[#EA4812] inline-flex items-center space-x-1 group/viewall transition-colors"
            >
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover/viewall:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* 3-Column Card Grid Matching Reference */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 py-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white border border-[#E5E0D8] rounded-2xl p-4 animate-pulse space-y-3 min-h-[380px]">
                  <div className="h-36 bg-slate-100 rounded-xl w-full" />
                  <div className="h-5 bg-slate-100 rounded w-3/4" />
                  <div className="h-16 bg-slate-100 rounded-xl w-full" />
                  <div className="h-10 bg-slate-100 rounded-xl w-full mt-auto" />
                </div>
              ))}
            </div>
          ) : filteredHackathons.length === 0 ? (
            <div className="bg-white border border-[#E5E0D8] rounded-2xl p-10 text-center">
              <Compass className="w-10 h-10 text-[#9CA3AF] mx-auto mb-2" />
              <h4 className="text-sm font-bold text-[#18181B]">No competitions found in this category</h4>
              <p className="text-xs text-[#6B7280] mt-1">Try selecting &quot;All&quot; to explore all active and upcoming competitions.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredHackathons.map((h) => (
                <HackathonCard key={h.id} {...h} variant="grid" />
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
