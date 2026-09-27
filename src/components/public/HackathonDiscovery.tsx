'use client';

import React, { useState, useMemo } from 'react';
import { AppShell } from '@/components/ui/AppShell';
import { CategoryTabs } from '@/components/ui/CategoryTabs';
import { FilterPills } from '@/components/ui/FilterPills';
import { HackathonCard } from '@/components/ui/HackathonCard';
import { Search, Trophy } from 'lucide-react';

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
    return initialHackathons.filter((h) => {
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
  }, [initialHackathons, activeTab, selectedFilters]);

  const tabCounts = {
    all: initialHackathons.length,
    hackathons: initialHackathons.length,
    open: initialHackathons.filter((h) => h.status === 'REGISTRATION_OPEN' || h.status === 'SUBMISSION_OPEN').length,
    upcoming: initialHackathons.filter((h) => h.status === 'PUBLISHED' || h.status === 'DRAFT').length,
    'my-hackathons': 1,
  };

  const dynamicTitle = `${initialHackathons.length} Hackathons for Developers`;

  return (
    <AppShell
      userRole="PARTICIPANT"
      showFeaturedRail={true}
      pageTitle={dynamicTitle}
      pageSubtitle="Discover hackathons, challenge tracks, and live builder competitions."
    >
      {/* Category Tabs: [ All ] [ Hackathons ] [ Open ] [ Upcoming ] [ My Hackathons ] */}
      <div className="mb-3">
        <CategoryTabs
          activeTab={activeTab}
          onChange={setActiveTab}
          counts={tabCounts}
        />
      </div>

      {/* Filter Row: [ Filters ] [ Status ] [ Mode ] [ Track ] [ Technology ] [ Deadline ] [ Sort By ] */}
      <div className="mb-4">
        <FilterPills
          selectedFilters={selectedFilters}
          onFilterChange={handleFilterChange}
          onClearAll={handleClearAll}
          trackOptions={tracksList}
        />
      </div>

      {/* Competition Cards List */}
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
              className="text-xs font-semibold text-[#2563EB] hover:underline pt-1"
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
              eventMode={h.eventMode || 'Online'}
              tracks={h.tracks}
              prizes={h.prizes}
              postedDate={h.eventStartTime}
              deadlineDate={h.subEndTime || h.eventEndTime}
              registeredCount={h.registeredCount || 128}
            />
          ))
        )}
      </div>
    </AppShell>
  );
};
