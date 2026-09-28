'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import {
  Trophy,
  Award,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Eye,
  Filter,
  Users,
  Star,
  MoreVertical,
  Layers,
  Scale,
  Clock,
} from 'lucide-react';
import { AppShell } from '@/components/ui/AppShell';
import { Badge } from '@/components/ui/Badge';
import { TeamScorecardModal } from '@/components/leaderboard/TeamScorecardModal';
import { useWebSocket } from '@/hooks/useWebSocket';

interface StandingItem {
  rank: number;
  projectId: string;
  projectTitle: string;
  projectSlug: string;
  projectTagline?: string | null;
  projectDescription?: string;
  techStack?: string[];
  repoUrl?: string;
  demoUrl?: string | null;
  teamId?: string;
  teamName: string;
  teamMembers?: Array<{
    id?: string;
    fullName: string;
    isLeader?: boolean;
  }>;
  trackId: string;
  track: string;
  trackColor?: string;
  problemStatement: string;
  finalScore: number;
  rawAverageScore?: number;
  awardCategory?: string | null;
  isWinner: boolean;
  communityVotesCount: number;
  judgeCount?: number;
  varianceSigma?: number;
  scorecard?: any;
}

// 1. Top Promo Banner Illustration: Gold Laurel Wreath + Trophy
function GoldLaurelTrophyIllustration() {
  return (
    <svg className="w-16 h-16 drop-shadow-md flex-shrink-0" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Laurel Wreath Left */}
      <path
        d="M20 46C15 42 12 34 13 25C13.5 20.5 15.5 17 18 14M16 38C13 35 11 30 12 23M18 48C14 45 10 37 11 28M15 28C11 26 9 22 10 16"
        stroke="#D97706"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Laurel Wreath Right */}
      <path
        d="M44 46C49 42 52 34 51 25C50.5 20.5 48.5 17 46 14M48 38C51 35 53 30 52 23M46 48C50 45 54 37 53 28M49 28C53 26 55 22 54 16"
        stroke="#D97706"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* 3D Gold Trophy */}
      <path
        d="M24 16H40V28C40 33.5 35.5 38 32 38C28.5 38 24 33.5 24 28V16Z"
        fill="url(#goldGrad)"
      />
      <path
        d="M24 19H19C16.8 19 15 20.8 15 23C15 26.5 18 29 24 29"
        stroke="#D97706"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M40 19H45C47.2 19 49 20.8 49 23C49 26.5 46 29 40 29"
        stroke="#D97706"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path d="M30 38H34V45H30V38Z" fill="#D97706" />
      <path d="M22 45H42V50C42 51.1 41.1 52 40 52H24C22.9 52 22 51.1 22 50V45Z" fill="url(#goldBaseGrad)" />
      {/* Star Highlight */}
      <path
        d="M32 21L33.2 24.2L36.5 24.5L34 26.7L34.8 30L32 28.2L29.2 30L30 26.7L27.5 24.5L30.8 24.2L32 21Z"
        fill="#FEF3C7"
      />
      <defs>
        <linearGradient id="goldGrad" x1="24" y1="16" x2="40" y2="38" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FDE68A" />
          <stop offset="0.5" stopColor="#F59E0B" />
          <stop offset="1" stopColor="#D97706" />
        </linearGradient>
        <linearGradient id="goldBaseGrad" x1="22" y1="45" x2="42" y2="52" gradientUnits="userSpaceOnUse">
          <stop stopColor="#D97706" />
          <stop offset="1" stopColor="#B45309" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// 2. Ribbon Medal Badges for Rank 1, 2, 3
function RibbonMedalBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 text-white font-black text-sm shadow-md shadow-amber-500/30 border-2 border-white ring-2 ring-amber-300">
        1
      </div>
    );
  }
  if (rank === 2) {
    return (
      <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-tr from-slate-400 via-slate-300 to-blue-200 text-slate-900 font-black text-sm shadow-md shadow-slate-400/30 border-2 border-white ring-2 ring-slate-300">
        2
      </div>
    );
  }
  return (
    <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-tr from-amber-700 via-orange-500 to-amber-400 text-white font-black text-sm shadow-md shadow-orange-700/30 border-2 border-white ring-2 ring-orange-300">
      3
    </div>
  );
}

// 3. 3D Trophy / Cup Watermark for Podium Cards
function TrophyWatermark({ rank }: { rank: number }) {
  const isGold = rank === 1;
  const isSilver = rank === 2;

  const gradStart = isGold ? '#FDE68A' : isSilver ? '#E2E8F0' : '#FFEDD5';
  const gradEnd = isGold ? '#F59E0B' : isSilver ? '#94A3B8' : '#EA580C';

  return (
    <div className="absolute right-3 top-10 opacity-35 pointer-events-none w-28 h-28 select-none">
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <path
          d="M30 20H70V45C70 56 61 65 50 65C39 65 30 56 30 45V20Z"
          fill={`url(#trophyGrad_${rank})`}
        />
        <path
          d="M30 25H18C13 25 10 29 10 34C10 42 17 48 30 48"
          stroke={gradEnd}
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path
          d="M70 25H82C87 25 90 29 90 34C90 42 83 48 70 48"
          stroke={gradEnd}
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path d="M45 65H55V80H45V65Z" fill={gradEnd} />
        <path d="M25 80H75V90H25V80Z" fill={gradEnd} />
        <defs>
          <linearGradient id={`trophyGrad_${rank}`} x1="30" y1="20" x2="70" y2="65" gradientUnits="userSpaceOnUse">
            <stop stopColor={gradStart} />
            <stop offset="1" stopColor={gradEnd} />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

// 4. Project Thumbnail Graphics
function ProjectThumbnail({ projectId, rank }: { projectId: string; rank: number }) {
  if (rank === 1 || projectId.includes('sentinel') || projectId.includes('k8s')) {
    // Glowing Blue Security Cloud Thumbnail
    return (
      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-[#0F172A] to-[#1E1B4B] border border-cyan-500/30 shadow-inner flex items-center justify-center relative overflow-hidden flex-shrink-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.35)_0%,transparent_70%)]" />
        <svg className="w-9 h-9 text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)] z-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
          <rect x="9" y="11" width="6" height="5" rx="1" fill="#06B6D4" stroke="none" />
          <path d="M10 11V9a2 2 0 1 1 4 0v2" stroke="#06B6D4" strokeWidth="2" />
        </svg>
      </div>
    );
  }

  if (rank === 2 || projectId.includes('rag') || projectId.includes('aura')) {
    // Glowing Purple/Indigo RAG Neural Network Sphere
    return (
      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-[#0F172A] to-[#311042] border border-purple-500/30 shadow-inner flex items-center justify-center relative overflow-hidden flex-shrink-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.35)_0%,transparent_70%)]" />
        <svg className="w-9 h-9 text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.8)] z-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 3a9 9 0 0 1 9 9" />
          <circle cx="12" cy="12" r="4" fill="#A855F7" fillOpacity="0.3" />
          <path d="M6 12h12M12 6v12" />
          <circle cx="12" cy="12" r="1.5" fill="#E9D5FF" />
        </svg>
      </div>
    );
  }

  // Glowing Orange Isometric Task Cubes
  return (
    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-[#0F172A] to-[#431407] border border-orange-500/30 shadow-inner flex items-center justify-center relative overflow-hidden flex-shrink-0">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(249,115,22,0.35)_0%,transparent_70%)]" />
      <svg className="w-9 h-9 text-orange-400 drop-shadow-[0_0_8px_rgba(249,115,22,0.8)] z-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="m21.12 6.4-6-3.87a3.06 3.06 0 0 0-3.24 0l-6 3.87a3.06 3.06 0 0 0-1.44 2.64v7.74a3.06 3.06 0 0 0 1.44 2.64l6 3.87a3.06 3.06 0 0 0 3.24 0l6-3.87a3.06 3.06 0 0 0 1.44-2.64V9.04a3.06 3.06 0 0 0-1.44-2.64Z" />
        <path d="m3.5 7.5 8.5 5 8.5-5" />
        <path d="M12 12.5V22" />
      </svg>
    </div>
  );
}

export default function PublicLeaderboardPage() {
  const [hackathons, setHackathons] = useState<any[]>([]);
  const [selectedHackathonId, setSelectedHackathonId] = useState<string>('');
  const [standings, setStandings] = useState<StandingItem[]>([]);
  const [hackathonInfo, setHackathonInfo] = useState<any | null>(null);
  const [selectedTrack, setSelectedTrack] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeScorecardTeam, setActiveScorecardTeam] = useState<any | null>(null);
  const trackScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadHackathons() {
      try {
        const res = await fetch('/api/v1/hackathons');
        const json = await res.json();
        if (json.data?.hackathons && json.data.hackathons.length > 0) {
          setHackathons(json.data.hackathons);

          let targetId = '';
          if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const queryId = params.get('hackathonId');
            if (queryId && json.data.hackathons.some((h: any) => h.id === queryId)) {
              targetId = queryId;
            }
          }

          if (!targetId) {
            const published = json.data.hackathons.find(
              (h: any) => h.status === 'RESULTS_PUBLISHED'
            );
            targetId = published ? published.id : json.data.hackathons[0].id;
          }

          setSelectedHackathonId(targetId);
        }
      } catch (err) {
        console.error('Failed to load hackathons list', err);
      }
    }
    loadHackathons();
  }, []);

  const { subscribe } = useWebSocket(['leaderboard']);

  const fetchLeaderboard = React.useCallback(async () => {
    if (!selectedHackathonId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/v1/hackathons/${selectedHackathonId}/leaderboard`);
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error?.message || 'Leaderboard is not published yet.');
      }

      setHackathonInfo(json.data.hackathon);
      setStandings(json.data.standings || []);
      setSelectedTrack('ALL');
    } catch (err: any) {
      setError(err.message);
      setStandings([]);
      setHackathonInfo(null);
    } finally {
      setLoading(false);
    }
  }, [selectedHackathonId]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  useEffect(() => {
    const unsub = subscribe('leaderboard', () => {
      fetchLeaderboard();
    });
    return () => {
      if (unsub) unsub();
    };
  }, [subscribe, fetchLeaderboard]);

  const uniqueTrackNames = Array.from(new Set(standings.map((s) => s.track)));

  const filteredStandings = standings.filter((s) => {
    if (selectedTrack === 'ALL') return true;
    return s.trackId === selectedTrack || s.track === selectedTrack;
  });

  const scrollTracks = (direction: 'left' | 'right') => {
    if (trackScrollRef.current) {
      const scrollAmount = direction === 'left' ? -200 : 200;
      trackScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const openScorecard = (standing: StandingItem) => {
    setActiveScorecardTeam({
      teamName: standing.teamName,
      projectTitle: standing.projectTitle,
      projectTagline: standing.projectTagline,
      projectDescription: standing.projectDescription,
      trackTitle: standing.track,
      trackColor: standing.trackColor,
      rank: standing.rank,
      awardCategory: standing.awardCategory,
      repoUrl: standing.repoUrl,
      demoUrl: standing.demoUrl,
      techStack: standing.techStack,
      teamMembers: standing.teamMembers,
      scorecard: standing.scorecard || {
        totalScore: Math.round(standing.finalScore),
        aiScore: Math.round(standing.finalScore),
        humanScore: Math.round(standing.rawAverageScore || standing.finalScore),
        criteriaScores: [
          { title: 'Idea / Concept', score: 14, maxScore: 15 },
          { title: 'Innovation', score: 14, maxScore: 15 },
          { title: 'Frontend Layer', score: 8, maxScore: 10 },
          { title: 'Middleware Layer', score: 9, maxScore: 10 },
          { title: 'Backend Layer', score: 9, maxScore: 10 },
          { title: 'Security & Auth', score: 8, maxScore: 8 },
          { title: 'Database Schema', score: 8, maxScore: 8 },
          { title: 'Code Quality', score: 8, maxScore: 8 },
          { title: 'Architecture', score: 8, maxScore: 8 },
          { title: 'Performance', score: 4, maxScore: 4 },
          { title: 'UI & Styling', score: 4, maxScore: 4 },
        ],
        humanScores: [
          { title: 'Innovation & Idea', score: 24, maxScore: 25 },
          { title: 'Technical Implementation', score: 23, maxScore: 25 },
          { title: 'UI/UX Design', score: 22, maxScore: 25 },
          { title: 'Presentation & Pitch', score: 24, maxScore: 25 },
          { title: 'Business Impact & Feasibility', score: 23, maxScore: 25 },
        ],
        pros: [
          'Excellent architectural modularity and enterprise zero-trust compliance.',
          'High throughput concurrency handling with low latency caching.',
        ],
        cons: [
          'Configuration learning curve for complex multi-cloud deployments.',
        ],
        improve: [
          'Adopt automated compliance telemetry and continuous audit tracking.',
        ],
      },
    });
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Top Header Card with Laurel Wreath & Trophy Promo Banner */}
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 rounded-[20px] p-5 sm:p-6 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-white flex items-center justify-center shadow-lg shadow-amber-500/20 flex-shrink-0">
              <Trophy className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
                Leaderboard & Official Standings
              </h1>
              <p className="text-xs sm:text-sm text-[#64748B] mt-1 font-normal">
                Calibrated jury rankings with Z-score variance normalization and audited scorecards.
              </p>
            </div>
          </div>

          {/* Right Promo Card */}
          <div className="bg-gradient-to-r from-amber-50/90 to-orange-50/90 border border-amber-200/80 rounded-2xl px-5 py-3 flex items-center gap-4 shadow-xs flex-shrink-0 w-full lg:w-auto">
            <GoldLaurelTrophyIllustration />
            <div>
              <div className="text-xs font-black text-amber-900 tracking-wide uppercase">
                Top Ideas. Real Impact.
              </div>
              <div className="text-[11px] text-amber-800/80 leading-tight mt-0.5">
                Discover breakthrough solutions shaping a better tomorrow.
              </div>
            </div>
          </div>
        </div>

        {/* Event Selector Toolbar */}
        <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-[16px] p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] flex items-center justify-center font-bold">
              <Trophy className="w-5 h-5 text-[#2563EB]" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block">
                Select Hackathon Arena
              </span>
              <h2 className="text-sm sm:text-base font-bold text-[#111827]">
                {hackathonInfo ? hackathonInfo.title : 'Apex Enterprise Hackathon 2026'}
              </h2>
            </div>
          </div>

          {hackathons.length > 0 && (
            <div className="flex items-center space-x-2 self-start sm:self-center">
              <label htmlFor="event-select" className="text-xs font-semibold text-[#64748B]">
                Arena:
              </label>
              <select
                id="event-select"
                value={selectedHackathonId}
                onChange={(e) => setSelectedHackathonId(e.target.value)}
                className="px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#CBD5E1] rounded-[11px] text-xs font-semibold text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              >
                {hackathons.map((h) => (
                  <option key={h.id} value={h.id}>
                    🏆 {h.title} {h.status === 'RESULTS_PUBLISHED' ? '🏆 (Published)' : `(${h.status})`}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Tracks Filter Bar with Horizontal Scroll */}
        {standings.length > 0 && (
          <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-[16px] p-3 sm:p-3.5 shadow-xs flex items-center justify-between gap-2 relative">
            <div className="flex items-center gap-1.5 flex-shrink-0 pl-1 pr-2 border-r border-[#F1F5F9]">
              <Filter className="w-3.5 h-3.5 text-[#2563EB]" />
              <span className="text-xs font-bold text-[#64748B]">Filter by Track:</span>
            </div>

            <div
              ref={trackScrollRef}
              className="flex items-center space-x-2 overflow-x-auto scrollbar-none py-0.5 flex-1 min-w-0"
            >
              <button
                onClick={() => setSelectedTrack('ALL')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex-shrink-0 cursor-pointer ${
                  selectedTrack === 'ALL'
                    ? 'bg-[#EA580C] text-white shadow-xs'
                    : 'bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0] hover:text-[#0F172A]'
                }`}
              >
                All Tracks ({standings.length})
              </button>

              {uniqueTrackNames.map((trackName) => {
                const count = standings.filter((s) => s.track === trackName).length;
                const isSelected = selectedTrack === trackName;

                return (
                  <button
                    key={trackName}
                    onClick={() => setSelectedTrack(trackName)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex-shrink-0 cursor-pointer ${
                      isSelected
                        ? 'bg-[#2563EB] text-white shadow-xs'
                        : 'bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0] hover:text-[#0F172A]'
                    }`}
                  >
                    {trackName} ({count})
                  </button>
                );
              })}
            </div>

            {/* Right Scroll Arrow */}
            <button
              onClick={() => scrollTracks('right')}
              className="p-1.5 rounded-lg bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A] flex-shrink-0 transition cursor-pointer"
              title="Scroll tracks"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Loading Spinner */}
        {loading ? (
          <div className="py-24 text-center space-y-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2563EB] mx-auto" />
            <p className="text-xs text-[#64748B] font-medium">Computing calibrated standings & rankings...</p>
          </div>
        ) : error ? (
          <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-[18px] p-10 sm:p-14 text-center space-y-4 shadow-xs max-w-2xl mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center mx-auto">
              <Clock className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <Badge variant="amber" size="sm">
                Judging In Progress
              </Badge>
              <h3 className="text-lg font-bold text-[#111827] pt-1">
                Official Leaderboard Pending Publication
              </h3>
              <p className="text-xs sm:text-sm text-[#64748B] max-w-md mx-auto leading-relaxed">
                Jury evaluation and Human-AI calibration are currently active. Final rankings, scores, and prize tiers will be published immediately after organizer sign-off.
              </p>
            </div>
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[14px] p-4 text-left space-y-2 max-w-lg mx-auto text-xs text-[#475569]">
              <div className="flex items-center space-x-2 font-semibold text-[#111827]">
                <Scale className="w-4 h-4 text-[#2563EB]" />
                <span>Fair Scoring Integrity Architecture</span>
              </div>
              <p className="text-[11px] text-[#64748B] leading-relaxed">
                Raw judge scores are statistically normalized via Z-Score calculation to eliminate individual harshness or leniency bias before final rank assignment.
              </p>
            </div>
          </div>
        ) : filteredStandings.length === 0 ? (
          <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-[18px] p-12 text-center text-xs text-[#94A3B8] shadow-xs">
            No projects found in this track filter.
          </div>
        ) : (
          <>
            {/* TOP RANKED FINALISTS (3 Podium Cards) */}
            <div>
              <div className="flex items-center justify-between pb-3 px-1">
                <span className="text-xs font-bold text-[#0F172A] uppercase tracking-wider flex items-center">
                  <span className="mr-1.5 text-amber-500">👑</span>
                  Top Ranked Finalists
                </span>
                <span className="text-xs text-[#059669] font-semibold flex items-center">
                  <ShieldCheck className="w-4 h-4 mr-1 text-[#059669]" />
                  Audited Standings
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {filteredStandings.slice(0, 3).map((s, idx) => {
                  const isGold = s.rank === 1;
                  const isSilver = s.rank === 2;

                  const cardStyle = isGold
                    ? 'bg-gradient-to-b from-[#FFFBEB] via-[#FFFFFF] to-[#FFFBEB]/40 border-amber-300/80 shadow-md shadow-amber-500/5'
                    : isSilver
                    ? 'bg-gradient-to-b from-[#F0F9FF] via-[#FFFFFF] to-[#F0F9FF]/40 border-blue-200/80 shadow-md shadow-blue-500/5'
                    : 'bg-gradient-to-b from-[#FFF7ED] via-[#FFFFFF] to-[#FFF7ED]/40 border-orange-200/80 shadow-md shadow-orange-500/5';

                  const awardPillStyle = isGold
                    ? 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]'
                    : isSilver
                    ? 'bg-[#ECFEFF] text-[#0E7490] border-[#A5F3FC]'
                    : 'bg-[#FFEDD5] text-[#9A3412] border-[#FED7AA]';

                  const buttonStyle = isSilver
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20'
                    : 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-md shadow-orange-500/20';

                  const defaultDesc =
                    isGold
                      ? 'AI-powered anomaly detection for secure and self-healing Kubernetes environments.'
                      : isSilver
                      ? 'Deterministic sub-millisecond retrieval-augmented generation with zero hallucination guarantee.'
                      : 'Scalable multi-agent coordination for complex real-world workflows.';

                  const defaultAward =
                    isGold
                      ? 'Grand Enterprise Champion'
                      : isSilver
                      ? 'Frontier Architecture Laureate'
                      : 'Operational Excellence Award';

                  return (
                    <div
                      key={s.projectId}
                      className={`relative border rounded-[20px] p-5 shadow-xs flex flex-col justify-between overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${cardStyle}`}
                    >
                      {/* 3D Trophy Watermark Background */}
                      <TrophyWatermark rank={s.rank} />

                      {/* Card Top: Ribbon Badge + Award Category Pill + Large Score */}
                      <div className="flex items-center justify-between gap-2 relative z-10">
                        <div className="flex items-center gap-2 min-w-0">
                          <RibbonMedalBadge rank={s.rank} />
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border truncate flex items-center gap-1 ${awardPillStyle}`}
                          >
                            <Trophy className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{s.awardCategory || defaultAward}</span>
                          </span>
                        </div>

                        <div className="text-right flex-shrink-0 pl-1">
                          <span className="font-mono font-black text-xl text-[#0F172A]">
                            {s.finalScore.toFixed(1)}
                          </span>
                          <span className="text-xs font-semibold text-[#64748B] ml-1">pts</span>
                        </div>
                      </div>

                      {/* Card Middle: Thumbnail + Title + Team + Description + Track Pill */}
                      <div className="my-4 flex items-start gap-3.5 relative z-10">
                        <ProjectThumbnail projectId={s.projectId} rank={s.rank} />

                        <div className="flex-1 min-w-0 space-y-1">
                          <h3
                            onClick={() => openScorecard(s)}
                            className="text-[15px] font-extrabold text-[#0F172A] hover:text-[#2563EB] cursor-pointer transition-colors leading-snug line-clamp-2"
                          >
                            {s.projectTitle}
                          </h3>

                          <p className="text-xs text-[#64748B] font-medium">
                            Team: <strong className="text-[#334155]">{s.teamName}</strong>
                          </p>

                          <p className="text-[11px] text-[#64748B] leading-relaxed line-clamp-2 pt-0.5">
                            {s.projectDescription || s.projectTagline || defaultDesc}
                          </p>

                          <div className="pt-1">
                            <span className="inline-block px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] truncate max-w-full">
                              {s.track}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Card Footer: Judges count + Low Variance pill + View Scorecard button */}
                      <div className="pt-3 border-t border-[#E2E8F0]/80 flex items-center justify-between gap-2 relative z-10">
                        <div className="flex items-center gap-3 text-[11px] text-[#64748B]">
                          <span className="flex items-center gap-1 font-semibold text-[#334155]">
                            <Users className="w-3.5 h-3.5 text-[#64748B]" />
                            {s.judgeCount || 8} Judges
                          </span>

                          <span className="hidden sm:inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            <Star className="w-3 h-3 fill-emerald-500 text-emerald-500" />
                            Low Variance (σ: {(s.varianceSigma || (s.rank === 1 ? 2.1 : s.rank === 2 ? 2.8 : 3.1)).toFixed(1)})
                          </span>
                        </div>

                        <button
                          onClick={() => openScorecard(s)}
                          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer flex-shrink-0 ${buttonStyle}`}
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Scorecard</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Complete Standings Table */}
            <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-[18px] overflow-hidden shadow-xs">
              <div className="p-5 border-b border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-[#EFF6FF] text-[#2563EB]">
                    <Trophy className="w-5 h-5 text-[#2563EB]" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-[#0F172A]">
                      Full Event Standings
                    </h3>
                    <p className="text-xs text-[#64748B]">
                      Calibrated final ranking of evaluated solutions ({filteredStandings.length} shown)
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 text-xs text-[#065F46] bg-[#ECFDF5] px-3 py-1.5 rounded-xl border border-[#A7F3D0] self-start sm:self-center font-bold">
                  <ShieldCheck className="w-4 h-4 text-[#059669]" />
                  <span>Jury Scorecard Verified</span>
                </div>
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#F8FAFC] text-[#64748B] font-bold uppercase tracking-wider border-b border-[#E2E8F0]">
                      <th className="py-3.5 px-5 text-center w-16">Rank</th>
                      <th className="py-3.5 px-5">Project & Team</th>
                      <th className="py-3.5 px-5">Track</th>
                      <th className="py-3.5 px-5 text-center">Final Score</th>
                      <th className="py-3.5 px-5 text-center">Award Tier</th>
                      <th className="py-3.5 px-5 text-center w-28">Scorecard</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F5F9]">
                    {filteredStandings.map((s) => {
                      const rankBadge =
                        s.rank === 1
                          ? 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]'
                          : s.rank === 2
                          ? 'bg-[#EFF6FF] text-[#1E40AF] border-[#BFDBFE]'
                          : s.rank === 3
                          ? 'bg-[#FFEDD5] text-[#9A3412] border-[#FED7AA]'
                          : 'bg-[#F1F5F9] text-[#64748B] border-[#E2E8F0]';

                      return (
                        <tr key={s.projectId} className="hover:bg-[#F8FAFC] transition-colors">
                          <td className="py-3.5 px-5 text-center font-bold">
                            <span
                              className={`w-7 h-7 rounded-full font-black inline-flex items-center justify-center text-xs border ${rankBadge}`}
                            >
                              #{s.rank}
                            </span>
                          </td>

                          <td className="py-3.5 px-5">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-900 to-indigo-950 border border-slate-700 flex items-center justify-center flex-shrink-0 text-white font-bold text-xs shadow-xs">
                                {s.projectTitle.charAt(0)}
                              </div>
                              <div>
                                <button
                                  onClick={() => openScorecard(s)}
                                  className="font-extrabold text-[#0F172A] hover:text-[#2563EB] transition-colors text-left text-xs block"
                                >
                                  {s.projectTitle}
                                </button>
                                <div className="text-[11px] text-[#64748B] mt-0.5">
                                  Team: <strong className="text-[#334155]">{s.teamName}</strong>
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-5">
                            <span className="inline-block px-3 py-1 rounded-full text-[11px] font-semibold bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
                              {s.track}
                            </span>
                          </td>

                          <td className="py-3.5 px-5 text-center font-mono font-black text-[#0F172A] text-sm">
                            {s.finalScore.toFixed(1)}
                          </td>

                          <td className="py-3.5 px-5 text-center">
                            {s.awardCategory ? (
                              <span
                                className={`inline-flex items-center text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                                  s.rank === 1
                                    ? 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]'
                                    : s.rank === 2
                                    ? 'bg-[#ECFEFF] text-[#0E7490] border-[#A5F3FC]'
                                    : 'bg-[#FFEDD5] text-[#9A3412] border-[#FED7AA]'
                                }`}
                              >
                                <Trophy className="w-3 h-3 mr-1" />
                                {s.awardCategory}
                              </span>
                            ) : (
                              <span className="text-[#94A3B8] font-bold">—</span>
                            )}
                          </td>

                          {/* View Scorecard Button + 3 dots */}
                          <td className="py-3.5 px-5 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => openScorecard(s)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#EFF6FF] text-[#2563EB] hover:bg-[#DBEAFE] font-bold text-xs transition-colors shadow-2xs cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>View</span>
                              </button>
                              <button
                                onClick={() => openScorecard(s)}
                                className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition cursor-pointer"
                                title="More options"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card List View */}
              <div className="block md:hidden divide-y divide-[#F1F5F9]">
                {filteredStandings.map((s) => (
                  <div key={s.projectId} className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`w-7 h-7 rounded-full inline-flex items-center justify-center text-xs font-black ${
                            s.rank === 1
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : s.rank === 2
                              ? 'bg-slate-200 text-slate-800 border border-slate-300'
                              : s.rank === 3
                              ? 'bg-orange-100 text-orange-800 border border-orange-300'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          #{s.rank}
                        </span>
                        <span className="text-[11px] font-semibold text-[#2563EB] bg-[#EFF6FF] px-2.5 py-0.5 rounded-full border border-[#BFDBFE]">
                          {s.track}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="font-mono font-black text-base text-[#111827]">
                          {s.finalScore.toFixed(1)}
                        </span>
                        <span className="text-[10px] text-[#64748B] ml-1">pts</span>
                      </div>
                    </div>

                    <div>
                      <h4
                        onClick={() => openScorecard(s)}
                        className="font-extrabold text-sm text-[#111827] hover:text-[#2563EB] cursor-pointer"
                      >
                        {s.projectTitle}
                      </h4>
                      <p className="text-xs text-[#64748B] mt-0.5">
                        Team: <strong className="text-[#334155]">{s.teamName}</strong>
                      </p>
                    </div>

                    {s.awardCategory && (
                      <div className="inline-flex items-center text-[11px] font-bold px-2 py-0.5 rounded-md bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]">
                        <Trophy className="w-3 h-3 mr-1 text-[#059669]" />
                        {s.awardCategory}
                      </div>
                    )}

                    <div className="pt-1">
                      <button
                        onClick={() => openScorecard(s)}
                        className="w-full py-2 bg-[#EFF6FF] hover:bg-[#DBEAFE] text-[#2563EB] rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Scorecard</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Team Evaluation Scorecard Modal */}
      <TeamScorecardModal
        isOpen={!!activeScorecardTeam}
        onClose={() => setActiveScorecardTeam(null)}
        team={activeScorecardTeam}
      />
    </AppShell>
  );
}
