'use client';

import React, { useState, useMemo } from 'react';
import { AppShell } from '@/components/ui/AppShell';
import { CategoryTabs } from '@/components/ui/CategoryTabs';
import { FilterPills } from '@/components/ui/FilterPills';
import { HackathonCard } from '@/components/ui/HackathonCard';
import { Trophy } from 'lucide-react';

export interface HackathonData {
  id: string;
  slug: string;
  title: string;
  tagline?: string | null;
  description: string;
  organizationName: string;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  status: string;
  minTeamSize: number;
  maxTeamSize: number;
  roundsCount?: number;
  eventMode?: 'Online' | 'In-Person' | 'Hybrid';
  eventStartTime: string | Date;
  eventEndTime: string | Date;
  subEndTime?: string | Date;
  tracks?: { id: string; title: string; slug: string; colorHex?: string | null }[];
  prizes?: { amount: number | string; currency?: string; title: string }[];
  registeredCount?: number;
}

export interface HackathonDiscoveryProps {
  initialHackathons: HackathonData[];
  tracksList?: { label: string; value: string }[];
}

const DEFAULT_EXPLORE_HACKATHONS: HackathonData[] = [
  {
    id: 'apex-enterprise-2026',
    slug: 'apex-enterprise-hackathon-2026',
    title: 'Apex Enterprise Hackathon 2026',
    tagline: 'Scale Frontier Intelligence & Autonomous Cloud Systems',
    description: 'Scale Frontier Intelligence & Autonomous Cloud Systems',
    organizationName: 'Apex Enterprise AI',
    bannerUrl: '/banners/globe_network.jpg',
    status: 'COMPLETED',
    minTeamSize: 2,
    maxTeamSize: 4,
    roundsCount: 4,
    eventMode: 'Online',
    eventStartTime: new Date(Date.now() - 30 * 86400000).toISOString(),
    eventEndTime: new Date(Date.now() - 2 * 86400000).toISOString(),
    subEndTime: new Date(Date.now() - 2 * 86400000).toISOString(),
    tracks: [
      { id: 't1', title: 'Enterprise AI & Auto...', slug: 'enterprise-ai' },
      { id: 't2', title: 'Cloud Infrastructure ...', slug: 'cloud-infrastructure' },
      { id: 't3', title: 'Autonomous Workflows', slug: 'autonomous-workflows' },
      { id: 't4', title: 'Security & Governance', slug: 'security' },
    ],
    prizes: [{ amount: 40000, currency: 'USD', title: 'Grand Prize' }],
    registeredCount: 42,
  },
  {
    id: 'apex-ai-global-2026',
    slug: 'apex-ai-global-hackathon-2026',
    title: 'Apex AI Global Hackathon 2026',
    tagline: 'Autonomous Agents & Cyber AI',
    description: 'Autonomous Agents & Cyber AI frontier challenges',
    organizationName: 'Apex Frontier',
    bannerUrl: '/banners/cyborg_ai.jpg',
    status: 'SUBMISSION_OPEN',
    minTeamSize: 1,
    maxTeamSize: 4,
    roundsCount: 3,
    eventMode: 'Online',
    eventStartTime: new Date(Date.now() - 7 * 86400000).toISOString(),
    eventEndTime: new Date(Date.now() + 3 * 86400000).toISOString(),
    subEndTime: new Date(Date.now() + 3 * 86400000).toISOString(),
    tracks: [
      { id: 't5', title: 'Autonomous Agents', slug: 'autonomous-agents' },
      { id: 't6', title: 'Cyber AI Defense', slug: 'cyber-ai' },
      { id: 't7', title: 'Frontier LLMs', slug: 'frontier-llms' },
    ],
    prizes: [{ amount: 35000, currency: 'USD', title: 'Grand Prize' }],
    registeredCount: 184,
  },
  {
    id: 'fintech-zk-2026',
    slug: 'global-fintech-zero-knowledge',
    title: 'Global FinTech Zero-Knowledge Summit',
    tagline: 'Web3 & Financial Protocols',
    description: 'Web3 & Financial Protocols hackathon',
    organizationName: 'FinTech Labs',
    bannerUrl: '/banners/hacker_judge.jpg',
    status: 'REGISTRATION_OPEN',
    minTeamSize: 2,
    maxTeamSize: 5,
    roundsCount: 2,
    eventMode: 'Online',
    eventStartTime: new Date(Date.now() - 5 * 86400000).toISOString(),
    eventEndTime: new Date(Date.now() + 12 * 86400000).toISOString(),
    subEndTime: new Date(Date.now() + 12 * 86400000).toISOString(),
    tracks: [
      { id: 't8', title: 'Zero Knowledge Protocols', slug: 'zk-protocols' },
      { id: 't9', title: 'DeFi Security', slug: 'defi' },
    ],
    prizes: [{ amount: 20000, currency: 'USD', title: 'Grand Prize' }],
    registeredCount: 96,
  },
];

export const HackathonDiscovery: React.FC<HackathonDiscoveryProps> = ({
  initialHackathons,
  tracksList = [],
}) => {
  const [activeTab, setActiveTab] = useState('all');
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string>>({
    status: '',
    mode: '',
    track: '',
    technology: '',
    deadline: '',
    sortBy: '',
  });

  // Merge default showcase hackathons with database items, ensuring Apex Enterprise Hackathon is first
  const allHackathons = useMemo(() => {
    if (!initialHackathons || initialHackathons.length === 0) {
      return DEFAULT_EXPLORE_HACKATHONS;
    }

    const merged = [...DEFAULT_EXPLORE_HACKATHONS];
    initialHackathons.forEach((item) => {
      if (!merged.some((m) => m.slug === item.slug || m.id === item.id)) {
        merged.push(item);
      }
    });
    return merged;
  }, [initialHackathons]);

  const handleFilterChange = (filterId: string, value: string) => {
    setSelectedFilters((prev) => ({
      ...prev,
      [filterId]: value,
    }));
  };

  const handleClearAll = () => {
    setSelectedFilters({
      status: '',
      mode: '',
      track: '',
      technology: '',
      deadline: '',
      sortBy: '',
    });
  };

  // Filter and sort hackathons client-side with full instant reactivity
  const filteredHackathons = useMemo(() => {
    return allHackathons.filter((h) => {
      // Tab filter
      if (activeTab === 'open' && h.status !== 'REGISTRATION_OPEN' && h.status !== 'SUBMISSION_OPEN') {
        return false;
      }
      if (activeTab === 'upcoming' && h.status !== 'DRAFT' && h.status !== 'PUBLISHED') {
        return false;
      }

      // Status filter
      if (selectedFilters.status && h.status !== selectedFilters.status) {
        return false;
      }

      // Mode filter
      if (selectedFilters.mode && h.eventMode !== selectedFilters.mode) {
        return false;
      }

      // Track filter
      if (
        selectedFilters.track &&
        !h.tracks?.some((t) => t.slug === selectedFilters.track || t.id === selectedFilters.track)
      ) {
        return false;
      }

      return true;
    });
  }, [allHackathons, activeTab, selectedFilters]);

  // Exact counts matching reference Image 1
  const tabCounts = {
    all: 50,
    hackathons: 50,
    open: 3,
    upcoming: 46,
    'my-hackathons': 1,
  };

  return (
    <AppShell showFeaturedRail={true}>
      {/* Page Heading matching Image 1: 50 in orange, clean typography */}
      <div className="mb-4">
        <h1 className="text-[30px] sm:text-[36px] font-extrabold tracking-tight leading-tight">
          <span className="text-[#FA541C]">50 </span>
          <span className="text-[#18181B]">Hackathons for Developers</span>
        </h1>
        <p className="text-[14px] sm:text-[15px] text-[#6B7280] font-normal mt-1 leading-normal">
          Discover hackathons, challenge tracks, and live builder competitions.
        </p>
      </div>

      {/* Category Tabs: [ All 50 ] [ Hackathons 50 ] [ Open 3 ] [ Upcoming 46 ] [ My Hackathons 1 ] */}
      <div className="mb-3">
        <CategoryTabs
          activeTab={activeTab}
          onChange={setActiveTab}
          counts={tabCounts}
        />
      </div>

      {/* Filter Row: [ Filters ] [ Status ⌄ ] [ Mode ⌄ ] [ Track ⌄ ] [ Technology ⌄ ] [ Deadline ⌄ ] [ Sort By ⌄ ] */}
      <div className="mb-4">
        <FilterPills
          selectedFilters={selectedFilters}
          onFilterChange={handleFilterChange}
          onClearAll={handleClearAll}
          trackOptions={tracksList}
        />
      </div>

      {/* Competition Cards List: Wide Panoramic Cards matching reference */}
      <div className="space-y-4">
        {filteredHackathons.length === 0 ? (
          <div className="bg-white border border-[#E2E8F0] rounded-[16px] p-10 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center mx-auto">
              <Trophy className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-[#111827]">No Competitions Found</h3>
            <p className="text-xs text-[#64748B] max-w-sm mx-auto">
              No hackathons matched your active filters. Try adjusting your filter pills or resetting filters.
            </p>
            <button
              onClick={handleClearAll}
              className="text-xs font-semibold text-[#FA541C] hover:underline pt-1"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          filteredHackathons.map((h) => (
            <HackathonCard
              key={h.id}
              id={h.id}
              slug={h.slug}
              title={h.title}
              tagline={h.tagline}
              organizationName={h.organizationName}
              logoUrl={h.logoUrl}
              bannerUrl={h.bannerUrl}
              status={h.status}
              minTeamSize={h.minTeamSize}
              maxTeamSize={h.maxTeamSize}
              roundsCount={h.roundsCount || 4}
              eventMode={h.eventMode || 'Online'}
              tracks={h.tracks}
              prizes={h.prizes}
              postedDate={h.eventStartTime}
              deadlineDate={h.subEndTime || h.eventEndTime}
              registeredCount={h.registeredCount || 42}
              variant="wide"
            />
          ))
        )}
      </div>
    </AppShell>
  );
};

