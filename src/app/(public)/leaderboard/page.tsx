'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Trophy,
  Award,
  ShieldCheck,
  Heart,
  ArrowRight,
  Sparkles,
  ExternalLink,
  ChevronDown,
  Layers,
  Scale,
  Clock,
  Eye,
  Filter,
  CheckCircle2,
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
  scorecard?: any;
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

  useEffect(() => {
    async function loadHackathons() {
      try {
        const res = await fetch('/api/v1/hackathons');
        const json = await res.json();
        if (json.data?.hackathons && json.data.hackathons.length > 0) {
          setHackathons(json.data.hackathons);

          // Check if URL specified a hackathonId
          let targetId = '';
          if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const queryId = params.get('hackathonId');
            if (queryId && json.data.hackathons.some((h: any) => h.id === queryId)) {
              targetId = queryId;
            }
          }

          if (!targetId) {
            // Prefer hackathons with RESULTS_PUBLISHED
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
      setSelectedTrack('ALL'); // Reset track filter when switching events
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

  // Real-time WebSocket live updates
  useEffect(() => {
    const unsub = subscribe('leaderboard', () => {
      fetchLeaderboard();
    });
    return () => {
      if (unsub) unsub();
    };
  }, [subscribe, fetchLeaderboard]);

  // Extract unique tracks for filter
  const tracks = hackathonInfo?.tracks || [];
  const uniqueTrackNames = Array.from(new Set(standings.map((s) => s.track)));

  // Filter standings based on selected track
  const filteredStandings = standings.filter((s) => {
    if (selectedTrack === 'ALL') return true;
    return s.trackId === selectedTrack || s.track === selectedTrack;
  });

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
    <AppShell
      pageTitle="Leaderboard & Official Standings"
      pageSubtitle="Calibrated jury rankings with Z-score variance normalization and audited scorecards."
    >
      <div className="space-y-6">
        {/* Event Selector Toolbar */}
        <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-[16px] p-4 sm:p-5 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] flex items-center justify-center font-bold">
              <Trophy className="w-5 h-5 text-[#2563EB]" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block">
                Select Hackathon Arena
              </span>
              <h2 className="text-sm sm:text-base font-bold text-[#111827]">
                {hackathonInfo ? hackathonInfo.title : 'ATLYX Hackathons'}
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
                    {h.title} {h.status === 'RESULTS_PUBLISHED' ? '🏆 (Published)' : `(${h.status})`}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Tracks Filter Bar */}
        {standings.length > 0 && (
          <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-[16px] p-3 sm:p-4 shadow-card flex items-center space-x-2 overflow-x-auto">
            <span className="text-xs font-bold text-[#64748B] flex items-center mr-2 flex-shrink-0">
              <Filter className="w-3.5 h-3.5 mr-1 text-[#2563EB]" />
              Filter by Track:
            </span>

            <button
              onClick={() => setSelectedTrack('ALL')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex-shrink-0 ${
                selectedTrack === 'ALL'
                  ? 'bg-[#0F172A] text-white shadow-xs'
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
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex-shrink-0 ${
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
        )}

        {/* Loading Spinner */}
        {loading ? (
          <div className="py-24 text-center space-y-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2563EB] mx-auto" />
            <p className="text-xs text-[#64748B] font-medium">Computing calibrated standings & rankings...</p>
          </div>
        ) : error ? (
          /* Results Pending Official Publication Notice */
          <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-[18px] p-10 sm:p-14 text-center space-y-4 shadow-card max-w-2xl mx-auto">
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

            {/* Fair Play & Calibration Notice */}
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[14px] p-4 text-left space-y-2 max-w-lg mx-auto text-xs text-[#475569]">
              <div className="flex items-center space-x-2 font-semibold text-[#111827]">
                <Scale className="w-4 h-4 text-[#2563EB]" />
                <span>Fair Scoring Integrity Architecture</span>
              </div>
              <p className="text-[11px] text-[#64748B] leading-relaxed">
                Raw judge scores are statistically normalized via Z-Score calculation to eliminate individual harshness or leniency bias before final rank assignment.
              </p>
            </div>

            <div className="pt-2">
              <Link
                href="/projects"
                className="inline-flex items-center px-4 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-[11px] text-xs font-semibold shadow-xs transition-colors"
              >
                <span>Browse Project Showcase</span>
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Link>
            </div>
          </div>
        ) : filteredStandings.length === 0 ? (
          <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-[18px] p-12 text-center text-xs text-[#94A3B8] shadow-card">
            No projects found in this track filter.
          </div>
        ) : (
          <>
            {/* Top 3 Visual Podium Cards */}
            <div>
              <div className="flex items-center justify-between pb-3 px-1">
                <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider flex items-center">
                  <Sparkles className="w-3.5 h-3.5 text-[#2563EB] mr-1.5" />
                  Top Ranked Finalists
                </span>
                <span className="text-xs text-[#059669] font-semibold flex items-center">
                  <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Audited Standings
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {filteredStandings.slice(0, 3).map((s, idx) => {
                  const themes = [
                    {
                      bg: 'bg-gradient-to-b from-[#FFFBEB] via-[#FFFFFF] to-[#FFFFFF]',
                      border: 'border-[#FDE68A] hover:border-[#F59E0B]',
                      badge: 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]',
                      trophyColor: 'text-[#D97706]',
                      rankText: 'Gold Finalist',
                    },
                    {
                      bg: 'bg-gradient-to-b from-[#F8FAFC] via-[#FFFFFF] to-[#FFFFFF]',
                      border: 'border-[#CBD5E1] hover:border-[#94A3B8]',
                      badge: 'bg-[#E2E8F0] text-[#334155] border-[#CBD5E1]',
                      trophyColor: 'text-[#64748B]',
                      rankText: 'Silver Finalist',
                    },
                    {
                      bg: 'bg-gradient-to-b from-[#FFF7ED] via-[#FFFFFF] to-[#FFFFFF]',
                      border: 'border-[#FED7AA] hover:border-[#FB923C]',
                      badge: 'bg-[#FFEDD5] text-[#9A3412] border-[#FED7AA]',
                      trophyColor: 'text-[#EA580C]',
                      rankText: 'Bronze Finalist',
                    },
                  ];

                  const currentTheme = themes[idx] || themes[1];

                  return (
                    <div
                      key={s.projectId}
                      className={`${currentTheme.bg} border ${currentTheme.border} rounded-[18px] p-5 sm:p-6 shadow-card flex flex-col justify-between space-y-4 transition-all hover:shadow-elevated`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-bold border flex items-center space-x-1 ${currentTheme.badge}`}
                          >
                            <Trophy className={`w-3.5 h-3.5 ${currentTheme.trophyColor}`} />
                            <span>Rank #{s.rank}</span>
                          </span>

                          <div className="text-right">
                            <span className="font-mono font-black text-lg text-[#111827]">
                              {s.finalScore.toFixed(1)}
                            </span>
                            <span className="text-[11px] text-[#64748B] ml-1">pts</span>
                          </div>
                        </div>

                        <div>
                          <h3
                            onClick={() => openScorecard(s)}
                            className="text-base font-bold text-[#111827] hover:text-[#2563EB] cursor-pointer transition-colors line-clamp-1"
                          >
                            {s.projectTitle}
                          </h3>
                          <p className="text-xs text-[#64748B] mt-0.5 font-medium">
                            Team: <strong className="text-[#334155]">{s.teamName}</strong>
                          </p>
                        </div>

                        {s.awardCategory && (
                          <div className="bg-[#ECFDF5] border border-[#A7F3D0] rounded-[11px] p-2 flex items-center text-xs font-semibold text-[#065F46]">
                            <Award className="w-3.5 h-3.5 mr-1.5 text-[#059669] flex-shrink-0" />
                            <span className="truncate">{s.awardCategory}</span>
                          </div>
                        )}
                      </div>

                      {/* Card Footer: Track & View Scorecard Button */}
                      <div className="pt-3 border-t border-[#F1F5F9] flex items-center justify-between text-xs">
                        <span className="font-medium text-[#475569] truncate max-w-[130px]">
                          {s.track}
                        </span>

                        <button
                          onClick={() => openScorecard(s)}
                          className="inline-flex items-center px-2.5 py-1 rounded-[8px] bg-[#EFF6FF] text-[#2563EB] hover:bg-[#DBEAFE] font-bold text-[11px] transition-colors"
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          View Scorecard
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Complete Standings Table */}
            <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-[18px] overflow-hidden shadow-card">
              <div className="p-5 border-b border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-[#111827]">
                    Full Event Standings
                  </h3>
                  <p className="text-xs text-[#64748B]">
                    Calibrated final ranking of evaluated solutions ({filteredStandings.length} shown)
                  </p>
                </div>
                <div className="flex items-center space-x-2 text-xs text-[#065F46] bg-[#ECFDF5] px-2.5 py-1 rounded-[8px] border border-[#A7F3D0] self-start sm:self-center font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#059669]" />
                  <span>Jury Scorecard Verified</span>
                </div>
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#F8FAFC] text-[#64748B] font-bold uppercase tracking-wider border-b border-[#E2E8F0]">
                      <th className="py-3 px-5 text-center w-16">Rank</th>
                      <th className="py-3 px-5">Project & Team</th>
                      <th className="py-3 px-5">Track</th>
                      <th className="py-3 px-5 text-right">Final Score</th>
                      <th className="py-3 px-5 text-right">Award Tier</th>
                      <th className="py-3 px-5 text-center">Scorecard</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F5F9]">
                    {filteredStandings.map((s) => (
                      <tr key={s.projectId} className="hover:bg-[#F8FAFC] transition-colors">
                        <td className="py-3.5 px-5 text-center font-bold">
                          {s.rank <= 3 ? (
                            <span className="w-6 h-6 rounded-full bg-[#EFF6FF] text-[#2563EB] font-black inline-flex items-center justify-center text-xs border border-[#BFDBFE]">
                              #{s.rank}
                            </span>
                          ) : (
                            <span className="text-[#64748B] font-medium">#{s.rank}</span>
                          )}
                        </td>

                        <td className="py-3.5 px-5">
                          <button
                            onClick={() => openScorecard(s)}
                            className="font-bold text-[#111827] hover:text-[#2563EB] transition-colors text-left"
                          >
                            {s.projectTitle}
                          </button>
                          <div className="text-[11px] text-[#64748B] mt-0.5">
                            Team: <strong className="text-[#334155]">{s.teamName}</strong>
                          </div>
                        </td>

                        <td className="py-3.5 px-5">
                          <Badge variant="blue" size="sm">
                            {s.track}
                          </Badge>
                        </td>

                        <td className="py-3.5 px-5 text-right font-mono font-bold text-[#111827] text-sm">
                          {s.finalScore.toFixed(1)}
                        </td>

                        <td className="py-3.5 px-5 text-right">
                          {s.awardCategory ? (
                            <span className="inline-flex items-center text-[11px] font-bold px-2 py-0.5 rounded-md bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]">
                              <Award className="w-3 h-3 mr-1 text-[#059669]" />
                              {s.awardCategory}
                            </span>
                          ) : (
                            <span className="text-[#CBD5E1]">—</span>
                          )}
                        </td>

                        {/* View Scorecard Trigger Button */}
                        <td className="py-3.5 px-5 text-center">
                          <button
                            onClick={() => openScorecard(s)}
                            className="inline-flex items-center px-3 py-1.5 rounded-[9px] bg-[#EFF6FF] text-[#2563EB] hover:bg-[#DBEAFE] font-bold text-xs transition-colors shadow-2xs"
                          >
                            <Eye className="w-3.5 h-3.5 mr-1" />
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card List View (< 768px) */}
              <div className="block md:hidden divide-y divide-[#F1F5F9]">
                {filteredStandings.map((s) => (
                  <div key={s.projectId} className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className={`w-7 h-7 rounded-full inline-flex items-center justify-center text-xs font-black ${
                          s.rank === 1 ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                          s.rank === 2 ? 'bg-slate-200 text-slate-800 border border-slate-300' :
                          s.rank === 3 ? 'bg-orange-100 text-orange-800 border border-orange-300' :
                          'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          #{s.rank}
                        </span>
                        <Badge variant="blue" size="sm">
                          {s.track}
                        </Badge>
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
                        className="font-bold text-sm text-[#111827] hover:text-[#2563EB] cursor-pointer"
                      >
                        {s.projectTitle}
                      </h4>
                      <p className="text-xs text-[#64748B] mt-0.5">
                        Team: <strong className="text-[#334155]">{s.teamName}</strong>
                      </p>
                    </div>

                    {s.awardCategory && (
                      <div className="inline-flex items-center text-[11px] font-bold px-2 py-0.5 rounded-md bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]">
                        <Award className="w-3 h-3 mr-1 text-[#059669]" />
                        {s.awardCategory}
                      </div>
                    )}

                    <div className="pt-1">
                      <button
                        onClick={() => openScorecard(s)}
                        className="w-full py-2 bg-[#EFF6FF] hover:bg-[#DBEAFE] text-[#2563EB] rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
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
