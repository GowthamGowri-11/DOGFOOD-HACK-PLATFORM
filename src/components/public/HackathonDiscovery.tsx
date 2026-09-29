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
    description: 'Scale Frontier Intelligence & Autonomous Cloud Systems for enterprise scale',
    organizationName: 'Apex Enterprise AI',
    bannerUrl: '/banners/globe_network.jpg',
    status: 'COMPLETED',
    minTeamSize: 2,
    maxTeamSize: 4,
    roundsCount: 4,
    eventMode: 'Hybrid',
    eventStartTime: new Date(Date.now() - 30 * 86400000).toISOString(),
    eventEndTime: new Date(Date.now() - 2 * 86400000).toISOString(),
    subEndTime: new Date(Date.now() - 2 * 86400000).toISOString(),
    tracks: [
      { id: 't1', title: 'Enterprise AI & Automation', slug: 'enterprise-ai' },
      { id: 't2', title: 'Cloud Infrastructure', slug: 'cloud-infrastructure' },
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
    description: 'Autonomous Agents & Cyber AI frontier challenges with next-gen models',
    organizationName: 'Apex Frontier',
    bannerUrl: '/banners/cyborg_ai.jpg',
    status: 'SUBMISSION_OPEN',
    minTeamSize: 1,
    maxTeamSize: 4,
    roundsCount: 3,
    eventMode: 'Online',
    eventStartTime: new Date(Date.now() - 7 * 86400000).toISOString(),
    eventEndTime: new Date(Date.now() + 2 * 86400000).toISOString(),
    subEndTime: new Date(Date.now() + 2 * 86400000).toISOString(), // 2 days -> matches '3d' and '7d'
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
    description: 'Web3 & Financial Protocols zero-knowledge privacy hackathon',
    organizationName: 'FinTech Labs',
    bannerUrl: '/banners/hacker_judge.jpg',
    status: 'REGISTRATION_OPEN',
    minTeamSize: 2,
    maxTeamSize: 5,
    roundsCount: 2,
    eventMode: 'Online',
    eventStartTime: new Date(Date.now() - 5 * 86400000).toISOString(),
    eventEndTime: new Date(Date.now() + 5 * 86400000).toISOString(),
    subEndTime: new Date(Date.now() + 5 * 86400000).toISOString(), // 5 days -> matches '7d'
    tracks: [
      { id: 't8', title: 'Zero Knowledge Protocols', slug: 'zk-protocols' },
      { id: 't9', title: 'DeFi Security', slug: 'defi' },
    ],
    prizes: [{ amount: 20000, currency: 'USD', title: 'Grand Prize' }],
    registeredCount: 96,
  },
  {
    id: 'sf-frontier-ai-2026',
    slug: 'sf-frontier-ai-builders-2026',
    title: 'San Francisco Frontier AI Builders',
    tagline: 'Generative UI & Agentic Systems On-Site',
    description: 'In-person San Francisco hackathon constructing real-time autonomous systems',
    organizationName: 'Bay Area Builders',
    bannerUrl: '/banners/hacker_judge.jpg',
    status: 'REGISTRATION_OPEN',
    minTeamSize: 1,
    maxTeamSize: 4,
    roundsCount: 3,
    eventMode: 'In-Person',
    eventStartTime: new Date(Date.now() - 2 * 86400000).toISOString(),
    eventEndTime: new Date(Date.now() + 18 * 86400000).toISOString(),
    subEndTime: new Date(Date.now() + 18 * 86400000).toISOString(), // 18 days -> matches 'month'
    tracks: [
      { id: 't10', title: 'Agentic Systems', slug: 'agentic-systems' },
      { id: 't11', title: 'Generative UI', slug: 'generative-ui' },
    ],
    prizes: [{ amount: 50000, currency: 'USD', title: 'Grand Prize' }],
    registeredCount: 210,
  },
  {
    id: 'bangalore-cloud-devops-2026',
    slug: 'bangalore-cloud-devops-championship',
    title: 'Bangalore Cloud & DevOps Championship',
    tagline: 'Kubernetes Platforms & Resilient SRE',
    description: 'India premier in-person championship for cloud infrastructure and DevOps',
    organizationName: 'Cloud SRE Guild',
    bannerUrl: '/banners/globe_network.jpg',
    status: 'REGISTRATION_OPEN',
    minTeamSize: 2,
    maxTeamSize: 4,
    roundsCount: 3,
    eventMode: 'In-Person',
    eventStartTime: new Date(Date.now() - 1 * 86400000).toISOString(),
    eventEndTime: new Date(Date.now() + 25 * 86400000).toISOString(),
    subEndTime: new Date(Date.now() + 25 * 86400000).toISOString(),
    tracks: [
      { id: 't12', title: 'Cloud Infrastructure', slug: 'cloud-infrastructure' },
      { id: 't13', title: 'DevOps & SRE', slug: 'devops' },
    ],
    prizes: [{ amount: 25000, currency: 'USD', title: 'Grand Prize' }],
    registeredCount: 140,
  },
  {
    id: 'nextgen-fullstack-web3-2026',
    slug: 'nextgen-fullstack-web3-accelerator',
    title: 'NextGen FullStack Web3 Accelerator',
    tagline: 'Modern React, Next.js & Smart Contracts',
    description: 'Hybrid hackathon merging full stack web development with decentralized protocols',
    organizationName: 'NextDev Collective',
    bannerUrl: '/banners/cyborg_ai.jpg',
    status: 'SUBMISSION_OPEN',
    minTeamSize: 1,
    maxTeamSize: 4,
    roundsCount: 2,
    eventMode: 'Hybrid',
    eventStartTime: new Date(Date.now() - 6 * 86400000).toISOString(),
    eventEndTime: new Date(Date.now() + 6 * 86400000).toISOString(),
    subEndTime: new Date(Date.now() + 6 * 86400000).toISOString(), // 6 days -> matches '7d'
    tracks: [
      { id: 't14', title: 'FullStack Web Apps', slug: 'fullstack' },
      { id: 't15', title: 'Web3 & dApps', slug: 'web3' },
    ],
    prizes: [{ amount: 30000, currency: 'USD', title: 'Grand Prize' }],
    registeredCount: 115,
  },
  {
    id: 'cybershield-defense-2026',
    slug: 'cybershield-global-defense-league',
    title: 'CyberShield Global Defense League',
    tagline: 'Zero Trust & Vulnerability Auditing',
    description: 'Hybrid cyber defense competition evaluating security vulnerabilities and AI forensics',
    organizationName: 'Global Cyber League',
    bannerUrl: '/banners/hacker_judge.jpg',
    status: 'JUDGING',
    minTeamSize: 1,
    maxTeamSize: 4,
    roundsCount: 3,
    eventMode: 'Hybrid',
    eventStartTime: new Date(Date.now() - 14 * 86400000).toISOString(),
    eventEndTime: new Date(Date.now() - 1 * 86400000).toISOString(),
    subEndTime: new Date(Date.now() - 1 * 86400000).toISOString(),
    tracks: [
      { id: 't16', title: 'Security & Governance', slug: 'security' },
      { id: 't17', title: 'AI Cyber Defense', slug: 'cyber-ai' },
    ],
    prizes: [{ amount: 45000, currency: 'USD', title: 'Grand Prize' }],
    registeredCount: 88,
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

  // Dynamically derive all available tracks from both prop tracksList and hackathon tracks
  const availableTracks = useMemo(() => {
    const map = new Map<string, string>();
    tracksList.forEach((t) => {
      if (t.value && t.label) map.set(t.value, t.label);
    });
    allHackathons.forEach((h) => {
      h.tracks?.forEach((tr) => {
        if (tr.slug && tr.title && !map.has(tr.slug)) {
          map.set(tr.slug, tr.title);
        }
      });
    });
    return Array.from(map.entries()).map(([value, label]) => ({ value, label }));
  }, [tracksList, allHackathons]);

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

  // Helper functions for prize and deadline calculation
  const getPrizeTotal = (h: HackathonData): number => {
    if (!h.prizes || h.prizes.length === 0) return 0;
    return h.prizes.reduce((sum, p) => {
      const val = typeof p.amount === 'number' ? p.amount : parseFloat(String(p.amount)) || 0;
      return sum + val;
    }, 0);
  };

  const getDeadlineMs = (h: HackathonData): number => {
    const d = h.subEndTime || h.eventEndTime || h.eventStartTime;
    return d ? new Date(d).getTime() : 0;
  };

  // Filter and sort hackathons client-side with full instant reactivity
  const filteredHackathons = useMemo(() => {
    const now = Date.now();

    const filtered = allHackathons.filter((h) => {
      // 1. Tab filter
      if (activeTab === 'open') {
        const isOpen =
          h.status === 'REGISTRATION_OPEN' ||
          h.status === 'SUBMISSION_OPEN' ||
          h.status === 'ACTIVE' ||
          h.status === 'PUBLISHED';
        if (!isOpen) return false;
      }
      if (activeTab === 'upcoming') {
        const isUpcoming =
          h.status === 'DRAFT' ||
          h.status === 'PUBLISHED' ||
          new Date(h.eventStartTime).getTime() > now;
        if (!isUpcoming) return false;
      }

      // 2. Status filter
      if (selectedFilters.status) {
        const targetStatus = selectedFilters.status.toUpperCase();
        const currentStatus = (h.status || '').toUpperCase();

        if (targetStatus === 'REGISTRATION_OPEN') {
          if (
            currentStatus !== 'REGISTRATION_OPEN' &&
            currentStatus !== 'PUBLISHED' &&
            currentStatus !== 'ACTIVE'
          ) {
            return false;
          }
        } else if (targetStatus === 'SUBMISSION_OPEN') {
          if (currentStatus !== 'SUBMISSION_OPEN' && currentStatus !== 'ACTIVE') {
            return false;
          }
        } else if (targetStatus === 'JUDGING') {
          if (currentStatus !== 'JUDGING' && currentStatus !== 'EVALUATION') {
            return false;
          }
        } else if (targetStatus === 'COMPLETED') {
          if (
            currentStatus !== 'COMPLETED' &&
            currentStatus !== 'CLOSED' &&
            currentStatus !== 'ENDED'
          ) {
            return false;
          }
        } else if (currentStatus !== targetStatus) {
          return false;
        }
      }

      // 3. Mode filter (case-insensitive and format-agnostic)
      if (selectedFilters.mode) {
        const targetMode = selectedFilters.mode.toUpperCase().replace(/[^A-Z]/g, '');
        const currentMode = (h.eventMode || 'ONLINE').toUpperCase().replace(/[^A-Z]/g, '');

        if (targetMode === 'INPERSON') {
          if (!currentMode.includes('PERSON') && !currentMode.includes('OFFLINE') && !currentMode.includes('SITE')) {
            return false;
          }
        } else if (targetMode === 'ONLINE') {
          if (!currentMode.includes('ONLINE') && !currentMode.includes('VIRTUAL')) {
            return false;
          }
        } else if (targetMode === 'HYBRID') {
          if (!currentMode.includes('HYBRID')) {
            return false;
          }
        }
      }

      // 4. Track filter
      if (selectedFilters.track) {
        const trackKey = selectedFilters.track.toLowerCase();
        const matchesTrack = h.tracks?.some(
          (t) =>
            t.slug?.toLowerCase() === trackKey ||
            t.id?.toLowerCase() === trackKey ||
            t.title?.toLowerCase().includes(trackKey)
        );
        if (!matchesTrack) return false;
      }

      // 5. Technology filter
      if (selectedFilters.technology) {
        const techKey = selectedFilters.technology.toLowerCase();
        const corpus = [
          h.title,
          h.tagline || '',
          h.description || '',
          ...(h.tracks?.map((t) => `${t.title} ${t.slug}`) || []),
        ]
          .join(' ')
          .toLowerCase();

        let matchesTech = false;
        if (techKey === 'ai') {
          matchesTech = /ai|agent|llm|intelligence|frontier|machine learning|deep learning|vision|generative/i.test(corpus);
        } else if (techKey === 'fullstack') {
          matchesTech = /full\s*stack|web|frontend|backend|react|next|javascript|typescript|api|node|app/i.test(corpus);
        } else if (techKey === 'fintech') {
          matchesTech = /fintech|web3|defi|zk|blockchain|crypto|finance|payment|token/i.test(corpus);
        } else if (techKey === 'cloud') {
          matchesTech = /cloud|devops|infra|infrastructure|aws|azure|gcp|docker|kubernetes|serverless|sre/i.test(corpus);
        } else if (techKey === 'cybersecurity') {
          matchesTech = /security|cyber|defense|vulnerability|audit|privacy|auth|penetration/i.test(corpus);
        } else {
          matchesTech = corpus.includes(techKey);
        }

        if (!matchesTech) return false;
      }

      // 6. Deadline filter
      if (selectedFilters.deadline) {
        const deadMs = getDeadlineMs(h);
        const diffDays = (deadMs - now) / 86400000;

        if (selectedFilters.deadline === '3d') {
          // Ending in 3 days: deadline is approaching between 0 and 3.5 days from now
          if (diffDays < 0 || diffDays > 3.5) return false;
        } else if (selectedFilters.deadline === '7d') {
          // Ending in 7 days: deadline is approaching between 0 and 7.5 days from now
          if (diffDays < 0 || diffDays > 7.5) return false;
        } else if (selectedFilters.deadline === 'month') {
          // Ending this month: deadline is within next 31 days
          if (diffDays < 0 || diffDays > 31) return false;
        }
      }

      return true;
    });

    // 7. Sort By filter
    const sorted = [...filtered];
    if (selectedFilters.sortBy === 'deadline_asc') {
      sorted.sort((a, b) => {
        const deadA = getDeadlineMs(a);
        const deadB = getDeadlineMs(b);
        const aFuture = deadA >= now;
        const bFuture = deadB >= now;
        // Prioritize upcoming active deadlines before expired ones
        if (aFuture && !bFuture) return -1;
        if (!aFuture && bFuture) return 1;
        return deadA - deadB;
      });
    } else if (selectedFilters.sortBy === 'prize_desc') {
      sorted.sort((a, b) => getPrizeTotal(b) - getPrizeTotal(a));
    } else if (selectedFilters.sortBy === 'created_desc') {
      sorted.sort((a, b) => {
        const timeA = new Date(a.eventStartTime).getTime();
        const timeB = new Date(b.eventStartTime).getTime();
        return timeB - timeA;
      });
    }

    return sorted;
  }, [allHackathons, activeTab, selectedFilters]);

  // Tab counts dynamically calculated from hackathon list
  const tabCounts = useMemo(() => {
    const openCount = allHackathons.filter(
      (h) =>
        h.status === 'REGISTRATION_OPEN' ||
        h.status === 'SUBMISSION_OPEN' ||
        h.status === 'ACTIVE' ||
        h.status === 'PUBLISHED'
    ).length;
    const upcomingCount = allHackathons.filter(
      (h) =>
        h.status === 'DRAFT' ||
        h.status === 'PUBLISHED' ||
        new Date(h.eventStartTime).getTime() > Date.now()
    ).length;
    return {
      all: allHackathons.length,
      hackathons: allHackathons.length,
      open: openCount,
      upcoming: upcomingCount,
      'my-hackathons': 1,
    };
  }, [allHackathons]);

  return (
    <AppShell showFeaturedRail={false}>
      {/* Page Heading matching Image 1: dynamic count in orange, clean typography */}
      <div className="mb-4">
        <h1 className="text-[30px] sm:text-[36px] font-extrabold tracking-tight leading-tight">
          <span className="text-[#FA541C]">{filteredHackathons.length} </span>
          <span className="text-[#18181B]">Hackathons for Developers</span>
        </h1>
        <p className="text-[14px] sm:text-[15px] text-[#6B7280] font-normal mt-1 leading-normal">
          Discover hackathons, challenge tracks, and live builder competitions.
        </p>
      </div>

      {/* Category Tabs */}
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
          trackOptions={availableTracks}
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

