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
} from 'lucide-react';
import { AppShell } from '@/components/ui/AppShell';
import { Badge } from '@/components/ui/Badge';

interface StandingItem {
  rank: number;
  projectId: string;
  projectTitle: string;
  projectSlug: string;
  teamName: string;
  track: string;
  trackColor?: string;
  problemStatement: string;
  finalScore: number;
  awardCategory?: string | null;
  isWinner: boolean;
  communityVotesCount: number;
}

export default function PublicLeaderboardPage() {
  const [hackathons, setHackathons] = useState<any[]>([]);
  const [selectedHackathonId, setSelectedHackathonId] = useState<string>('');
  const [standings, setStandings] = useState<StandingItem[]>([]);
  const [hackathonInfo, setHackathonInfo] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadHackathons() {
      try {
        const res = await fetch('/api/v1/hackathons');
        const json = await res.json();
        if (json.data?.hackathons && json.data.hackathons.length > 0) {
          setHackathons(json.data.hackathons);
          // Prefer hackathons with RESULTS_PUBLISHED
          const published = json.data.hackathons.find(
            (h: any) => h.status === 'RESULTS_PUBLISHED'
          );
          setSelectedHackathonId(published ? published.id : json.data.hackathons[0].id);
        }
      } catch (err) {
        console.error('Failed to load hackathons list', err);
      }
    }
    loadHackathons();
  }, []);

  useEffect(() => {
    async function fetchLeaderboard() {
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
      } catch (err: any) {
        setError(err.message);
        setStandings([]);
        setHackathonInfo(null);
      } finally {
        setLoading(false);
      }
    }

    fetchLeaderboard();
  }, [selectedHackathonId]);

  return (
    <AppShell
      userRole="PARTICIPANT"
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
        ) : standings.length === 0 ? (
          <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-[18px] p-12 text-center text-xs text-[#94A3B8] shadow-card">
            No projects have been ranked for this hackathon yet.
          </div>
        ) : (
          <>
            {/* Top 3 Visual Podium Cards (Unstop Champions Showcase) */}
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
                {standings.slice(0, 3).map((s, idx) => {
                  // Curated podium themes: Gold, Silver, Bronze
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
                        {/* Rank Pill & Normalized Score */}
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

                        {/* Project Title & Team */}
                        <div>
                          <Link href={`/projects/${s.projectId}`}>
                            <h3 className="text-base font-bold text-[#111827] hover:text-[#2563EB] transition-colors line-clamp-1">
                              {s.projectTitle}
                            </h3>
                          </Link>
                          <p className="text-xs text-[#64748B] mt-0.5 font-medium">
                            Team: <strong className="text-[#334155]">{s.teamName}</strong>
                          </p>
                        </div>

                        {/* Award Tier if assigned */}
                        {s.awardCategory && (
                          <div className="bg-[#ECFDF5] border border-[#A7F3D0] rounded-[11px] p-2 flex items-center text-xs font-semibold text-[#065F46]">
                            <Award className="w-3.5 h-3.5 mr-1.5 text-[#059669] flex-shrink-0" />
                            <span className="truncate">{s.awardCategory}</span>
                          </div>
                        )}
                      </div>

                      {/* Card Footer: Track & Community Votes */}
                      <div className="pt-3 border-t border-[#F1F5F9] flex items-center justify-between text-xs text-[#64748B]">
                        <span className="font-medium text-[#475569] truncate max-w-[130px]">
                          {s.track}
                        </span>

                        <span className="flex items-center text-[#DC2626] font-semibold">
                          <Heart className="w-3.5 h-3.5 mr-1 fill-rose-50" />
                          {s.communityVotesCount}
                        </span>
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
                    Calibrated final ranking of all evaluated solutions
                  </p>
                </div>
                <div className="flex items-center space-x-2 text-xs text-[#065F46] bg-[#ECFDF5] px-2.5 py-1 rounded-[8px] border border-[#A7F3D0] self-start sm:self-center font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#059669]" />
                  <span>Jury Scorecard Verified</span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#F8FAFC] text-[#64748B] font-bold uppercase tracking-wider border-b border-[#E2E8F0]">
                      <th className="py-3 px-5 text-center w-16">Rank</th>
                      <th className="py-3 px-5">Project & Team</th>
                      <th className="py-3 px-5">Track</th>
                      <th className="py-3 px-5 text-right">Z-Score</th>
                      <th className="py-3 px-5 text-right">Award Tier</th>
                      <th className="py-3 px-5 text-right">Community Votes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F5F9]">
                    {standings.map((s) => (
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
                          <Link
                            href={`/projects/${s.projectId}`}
                            className="font-bold text-[#111827] hover:text-[#2563EB] transition-colors"
                          >
                            {s.projectTitle}
                          </Link>
                          <div className="text-[11px] text-[#64748B] mt-0.5">
                            Team: {s.teamName}
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

                        <td className="py-3.5 px-5 text-right font-semibold text-[#475569]">
                          <span className="inline-flex items-center">
                            <Heart className="w-3.5 h-3.5 mr-1 text-[#DC2626] fill-rose-50" />
                            {s.communityVotesCount}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
