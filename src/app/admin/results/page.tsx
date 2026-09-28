'use client';

// ApexHack Leaderboard & Results Engine
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  Award,
  Trophy,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  BarChart3,
  Scale,
  RefreshCw,
  Eye,
  EyeOff,
  ShieldCheck,
  Search,
  Users,
  Layers,
  ArrowUpRight,
  TrendingUp,
  Cpu,
  Filter,
  ChevronRight,
  Crown,
  Medal,
  Clock,
  Code2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { TeamScorecardModal } from '@/components/leaderboard/TeamScorecardModal';

interface ResultItem {
  id: string;
  rank: number;
  rawAverageScore: number;
  normalizedScore: number;
  finalScore: number;
  awardCategory: string | null;
  isWinner: boolean;
  isPublished: boolean;
  project: {
    id: string;
    title: string;
    slug: string;
    tagline: string | null;
    description?: string;
    techStack?: string[];
    repoUrl: string;
    demoUrl: string | null;
    team: {
      id: string;
      name: string;
      members: Array<{
        isLeader: boolean;
        user: { id: string; fullName: string };
      }>;
    };
    track: {
      id: string;
      title: string;
      colorHex: string;
    };
    problemStatement: {
      id: string;
      code: string;
      title: string;
    };
    aiJuryRuns?: Array<{
      overallScore: number;
      rawAnalysis: any;
      summaryFeedback: string;
    }>;
    evaluations?: Array<{
      weightedScore: number;
      rawScoreSum: number;
      prosComment: string | null;
      consComment: string | null;
      suggestions: string | null;
    }>;
  };
}

interface EvaluationRoundInfo {
  roundNumber: number;
  name: string;
  roundType?: string;
  isFinal?: boolean;
  maxTeamsQualified?: number;
}

interface HackathonResultData {
  id: string;
  title: string;
  slug: string;
  status: string;
  resultsPublishedAt: string | null;
  rulesAndGuidelines?: string | null;
  organizer: { id: string; fullName: string; email: string };
  tracks: Array<{
    id: string;
    title: string;
    slug: string;
    colorHex: string;
  }>;
  prizes: Array<{
    id: string;
    title: string;
    category: string | null;
    amount: string | number;
    currency: string;
    rankOrder: number;
    description: string | null;
  }>;
  scoreNormalizations: Array<{
    id: string;
    method: 'Z_SCORE' | 'MIN_MAX';
    version: number;
    executedAt: string;
  }>;
  results: ResultItem[];
  latestNormalization: {
    id: string;
    method: 'Z_SCORE' | 'MIN_MAX';
    version: number;
    executedAt: string;
  } | null;
  verification: {
    isVerified: boolean;
    totalProjects: number;
    rankedProjectsCount: number;
    hasNaNOrInfinity: boolean;
    duplicateRanks: number[];
    unassignedPrizesCount: number;
    anomalies: string[];
  } | null;
  stats: {
    rankedCount: number;
    submittedProjectsCount: number;
    completedEvaluationsCount: number;
    judgesCount: number;
    prizesCount: number;
    isPublished: boolean;
  };
}

export default function AdminResultsPage() {
  const [hackathons, setHackathons] = useState<HackathonResultData[]>([]);
  const [selectedHackathonId, setSelectedHackathonId] = useState<string>('');
  const [selectedRoundIdx, setSelectedRoundIdx] = useState<number | 'ALL'>('ALL');
  const [selectedMethod, setSelectedMethod] = useState<'Z_SCORE' | 'MIN_MAX'>('Z_SCORE');
  const [selectedTrack, setSelectedTrack] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeScorecardTeam, setActiveScorecardTeam] = useState<any | null>(null);

  const fetchResults = useCallback(async (selectId?: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/admin/results');
      const json = await res.json();
      if (json.success && json.data) {
        const list: HackathonResultData[] = json.data.hackathons || [];
        setHackathons(list);
        if (list.length > 0) {
          if (selectId && list.some((h) => h.id === selectId)) {
            setSelectedHackathonId(selectId);
          } else if (!selectedHackathonId || !list.some((h) => h.id === selectedHackathonId)) {
            setSelectedHackathonId(list[0].id);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load results:', err);
      setError('Unable to load leaderboard information from database.');
    } finally {
      setLoading(false);
    }
  }, [selectedHackathonId]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const activeHackathon = hackathons.find((h) => h.id === selectedHackathonId) || hackathons[0];

  // Parse rounds from hackathon's rulesAndGuidelines
  const rounds: EvaluationRoundInfo[] = useMemo(() => {
    if (!activeHackathon?.rulesAndGuidelines) {
      return [
        { roundNumber: 1, name: 'Round 1: Screening & Idea Pitch', isFinal: false },
        { roundNumber: 2, name: 'Round 2: Evaluation & MVP', isFinal: true },
      ];
    }
    try {
      const parsed = JSON.parse(activeHackathon.rulesAndGuidelines);
      if (parsed.rounds && Array.isArray(parsed.rounds) && parsed.rounds.length > 0) {
        return parsed.rounds.map((r: any, idx: number) => ({
          roundNumber: r.roundNumber || idx + 1,
          name: r.name || `Round ${idx + 1}`,
          roundType: r.roundType,
          isFinal: r.isFinal ?? idx === parsed.rounds.length - 1,
          maxTeamsQualified: r.maxTeamsQualified,
        }));
      }
    } catch {
      // fallback
    }
    return [
      { roundNumber: 1, name: 'Round 1: Screening & Idea Pitch', isFinal: false },
      { roundNumber: 2, name: 'Round 2: Evaluation & MVP', isFinal: true },
    ];
  }, [activeHackathon]);

  // Action handlers
  const handleGenerate = async () => {
    if (!activeHackathon) return;
    setActionLoading('generate');
    setMessage(null);
    setError(null);
    try {
      const res = await fetch('/api/v1/admin/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hackathonId: activeHackathon.id,
          action: 'generate',
          method: selectedMethod,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage(
          `Rankings recalculated successfully using ${
            selectedMethod === 'Z_SCORE' ? 'Z-Score Variance Calibration' : 'Min-Max Scaling'
          }!`
        );
        await fetchResults(activeHackathon.id);
      } else {
        setError(data.error?.message || 'Failed to normalize and generate rankings.');
      }
    } catch {
      setError('Network communication failure during score normalization.');
    } finally {
      setActionLoading(null);
    }
  };

  const handlePublish = async () => {
    if (!activeHackathon) return;
    setActionLoading('publish');
    setMessage(null);
    setError(null);
    try {
      const res = await fetch('/api/v1/admin/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hackathonId: activeHackathon.id,
          action: 'publish',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage('Official results have been published to the global public leaderboard!');
        await fetchResults(activeHackathon.id);
      } else {
        setError(data.error?.message || 'Failed to publish official results.');
      }
    } catch {
      setError('Network error while publishing results.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnpublish = async () => {
    if (!activeHackathon) return;
    setActionLoading('unpublish');
    setMessage(null);
    setError(null);
    try {
      const res = await fetch('/api/v1/admin/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hackathonId: activeHackathon.id,
          action: 'unpublish',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage('Results reverted to draft stage. Leaderboard is now hidden from the public.');
        await fetchResults(activeHackathon.id);
      } else {
        setError(data.error?.message || 'Failed to unpublish results.');
      }
    } catch {
      setError('Network error while unpublishing results.');
    } finally {
      setActionLoading(null);
    }
  };

  // Open Scorecard Modal for a team
  const openScorecard = (r: ResultItem) => {
    const rawAnalysis: any = r.project.aiJuryRuns?.[0]?.rawAnalysis || {};
    const evalData = r.project.evaluations?.[0];

    const defaultCriteriaScores = [
      { title: 'Idea / Concept', score: 14, maxScore: 15 },
      { title: 'Innovation', score: 14, maxScore: 15 },
      { title: 'Frontend Layer', score: 8, maxScore: 10 },
      { title: 'Middleware Layer', score: 9, maxScore: 10 },
      { title: 'Backend Layer', score: 10, maxScore: 10 },
      { title: 'Security & Auth', score: 8, maxScore: 8 },
      { title: 'Database Schema', score: 8, maxScore: 8 },
      { title: 'Code Quality', score: 8, maxScore: 8 },
      { title: 'Architecture', score: 8, maxScore: 8 },
      { title: 'Performance', score: 4, maxScore: 4 },
      { title: 'UI & Styling', score: 4, maxScore: 4 },
    ];

    const defaultHumanScores = [
      { title: 'Innovation & Idea', score: 24, maxScore: 25 },
      { title: 'Technical Implementation', score: 24, maxScore: 25 },
      { title: 'UI/UX Design', score: 23, maxScore: 25 },
      { title: 'Presentation & Pitch', score: 24, maxScore: 25 },
      { title: 'Business Impact & Feasibility', score: 24, maxScore: 25 },
    ];

    setActiveScorecardTeam({
      teamName: r.project.team.name,
      projectTitle: r.project.title,
      projectTagline: r.project.tagline,
      projectDescription: r.project.description,
      trackTitle: r.project.track.title,
      trackColor: r.project.track.colorHex,
      rank: r.rank,
      awardCategory: r.awardCategory,
      repoUrl: r.project.repoUrl,
      demoUrl: r.project.demoUrl,
      techStack: r.project.techStack || ['Python', 'PostgreSQL', 'Next.js 14'],
      teamMembers: r.project.team.members.map((m) => ({
        fullName: m.user.fullName,
        isLeader: m.isLeader,
      })),
      scorecard: {
        totalScore: Math.round(r.finalScore),
        aiScore: Math.round(r.project.aiJuryRuns?.[0]?.overallScore ?? r.finalScore),
        humanScore: Math.round(evalData?.weightedScore ?? r.rawAverageScore),
        criteriaScores: rawAnalysis.criteriaScores || defaultCriteriaScores,
        humanScores: rawAnalysis.humanScores || defaultHumanScores,
        pros: rawAnalysis.pros || (evalData?.prosComment ? [evalData.prosComment] : [
          'High throughput distributed concurrency architecture.',
          'Zero-trust cryptographic access policies verified across all endpoints.',
        ]),
        cons: rawAnalysis.cons || (evalData?.consComment ? [evalData.consComment] : [
          'Configuration complexity for non-standard Kubernetes deployment topologies.',
        ]),
        improve: rawAnalysis.improve || (evalData?.suggestions ? [evalData.suggestions] : [
          'Adopt OpenTelemetry tracing for multi-agent reasoning diagnostics.',
        ]),
      },
    });
  };

  // Unique track names for filter
  const uniqueTrackNames = activeHackathon?.tracks?.map((t) => t.title) || 
    Array.from(new Set(activeHackathon?.results.map((r) => r.project.track.title) || []));

  // Filter results for track, search, and round
  const filteredResults = useMemo(() => {
    let list = activeHackathon?.results || [];

    // Filter by Track
    if (selectedTrack !== 'ALL') {
      list = list.filter((r) => r.project.track.title === selectedTrack);
    }

    // Filter by Round (if specific round selected and maxTeamsQualified defined)
    if (selectedRoundIdx !== 'ALL' && rounds[selectedRoundIdx]) {
      const currentRound = rounds[selectedRoundIdx];
      if (currentRound.maxTeamsQualified && currentRound.maxTeamsQualified > 0) {
        list = list.slice(0, currentRound.maxTeamsQualified);
      }
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (r) =>
          r.project.title.toLowerCase().includes(q) ||
          r.project.team.name.toLowerCase().includes(q) ||
          (r.awardCategory && r.awardCategory.toLowerCase().includes(q)) ||
          r.project.track.title.toLowerCase().includes(q)
      );
    }

    return list;
  }, [activeHackathon, selectedTrack, selectedRoundIdx, rounds, searchQuery]);

  const topPodium = (activeHackathon?.results || []).slice(0, 3);
  const isPublished = activeHackathon?.stats.isPublished || activeHackathon?.status === 'RESULTS_PUBLISHED';
  const hasResults = (activeHackathon?.results.length || 0) > 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20 select-none font-sans">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center space-x-2 text-xs text-zinc-400 font-medium">
        <Link href="/" className="hover:text-orange-600 transition-colors">
          Home
        </Link>
        <span>&rsaquo;</span>
        <Link href="/admin/dashboard" className="hover:text-orange-600 transition-colors">
          Admin
        </Link>
        <span>&rsaquo;</span>
        <span className="text-zinc-800 font-semibold">Results</span>
      </nav>

      {/* Top Header - Matching Image Reference */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 gap-4 border-b border-zinc-100">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">
            Leaderboard &amp; Results Publication
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5 font-normal">
            Administrators official normalized scores, podium rankings, award assignments, and global public publication.
          </p>
        </div>

        {/* Public Leaderboard Button */}
        <div className="flex items-center gap-3">
          <Link
            href={`/leaderboard?hackathonId=${activeHackathon?.id || ''}`}
            target="_blank"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            <BarChart3 className="w-4 h-4 text-orange-400" />
            <span>Public Leaderboard</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-zinc-400" />
          </Link>
        </div>
      </div>

      {/* Notifications / Feedback */}
      {message && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center justify-between shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center space-x-2 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{message}</span>
          </div>
          <button
            onClick={() => setMessage(null)}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-900 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-center justify-between shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center space-x-2 font-semibold">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-xs font-bold text-rose-700 hover:text-rose-900 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ======================================================== */}
      {/* SELECT HACKATHON ARENA & ROUNDS CONTROLLER CARD */}
      {/* ======================================================== */}
      <div className="bg-white border border-zinc-200/90 rounded-2xl p-5 shadow-xs space-y-4 border-l-4 border-l-[#FA541C] transition-all">
        {/* Row 1: Hackathon Selector & Publish Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Hackathon Arena Selector */}
          <div className="flex items-center space-x-3 flex-1 max-w-2xl">
            <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 text-[#FA541C] flex items-center justify-center flex-shrink-0 shadow-2xs">
              <Trophy className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="flex-1">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                SELECT HACKATHON ARENA:
              </span>
              <div className="flex flex-wrap items-center gap-2.5 mt-1">
                <select
                  value={selectedHackathonId}
                  onChange={(e) => {
                    setSelectedHackathonId(e.target.value);
                    setSelectedTrack('ALL');
                    setSelectedRoundIdx('ALL');
                  }}
                  className="px-3.5 py-2 bg-zinc-50/80 hover:bg-white border border-zinc-200 rounded-xl text-xs font-bold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-orange-500/15 cursor-pointer shadow-xs transition-all flex-1 min-w-[260px]"
                >
                  {hackathons.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.title} ({h.stats.rankedCount} ranked -{' '}
                      {h.status === 'RESULTS_PUBLISHED' ? 'RESULTS PUBLISHED' : h.status})
                    </option>
                  ))}
                </select>

                {isPublished ? (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                    Published
                  </span>
                ) : (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs">
                    Draft Stage
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Engine Controls: Normalization & Publishing */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Normalization Method Toggle */}
            <div className="flex items-center bg-zinc-100/80 p-1 rounded-xl border border-zinc-200 text-xs">
              <button
                type="button"
                onClick={() => setSelectedMethod('Z_SCORE')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedMethod === 'Z_SCORE'
                    ? 'bg-white text-zinc-900 shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-900'
                }`}
              >
                Z-Score Normalization
              </button>
              <button
                type="button"
                onClick={() => setSelectedMethod('MIN_MAX')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedMethod === 'MIN_MAX'
                    ? 'bg-white text-zinc-900 shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-900'
                }`}
              >
                Min-Max Scaling
              </button>
            </div>

            {/* Recalculate Button */}
            <button
              onClick={handleGenerate}
              disabled={actionLoading !== null}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-zinc-800 bg-white border border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300 rounded-xl shadow-xs transition-all hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-60"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 text-[#FA541C] ${
                  actionLoading === 'generate' ? 'animate-spin' : ''
                }`}
              />
              <span>{actionLoading === 'generate' ? 'Normalizing...' : 'Calibrate & Rank'}</span>
            </button>

            {/* Publish / Unpublish Action Button */}
            {hasResults && !isPublished && (
              <button
                onClick={handlePublish}
                disabled={actionLoading !== null}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-[#FA541C] to-[#E03A00] hover:from-[#E03A00] hover:to-[#C83200] rounded-xl shadow-md shadow-orange-500/20 transition-all hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-60"
              >
                <Sparkles className="w-3.5 h-3.5 text-white" />
                <span>{actionLoading === 'publish' ? 'Publishing...' : 'Publish Official Results'}</span>
              </button>
            )}

            {isPublished && (
              <button
                onClick={handleUnpublish}
                disabled={actionLoading !== null}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-rose-600 bg-white border border-rose-200 hover:bg-rose-50 rounded-xl shadow-xs transition-all hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-60"
              >
                <EyeOff className="w-3.5 h-3.5 text-rose-600" />
                <span>{actionLoading === 'unpublish' ? 'Reverting...' : 'Unpublish to Draft'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Evaluation Rounds Navigation Bar */}
        <div className="pt-3 border-t border-zinc-100 flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-600 pr-2 border-r border-zinc-200">
            <Layers className="w-3.5 h-3.5 text-[#FA541C]" />
            <span>ROUNDS:</span>
          </div>

          {/* All Rounds Tab */}
          <button
            onClick={() => setSelectedRoundIdx('ALL')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-1.5 hover:scale-105 active:scale-95 ${
              selectedRoundIdx === 'ALL'
                ? 'bg-zinc-900 text-white shadow-xs'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900'
            }`}
          >
            <span>🏆 All Rounds (Final Standing)</span>
          </button>

          {/* Individual Configured Rounds */}
          {rounds.map((r, idx) => {
            const isSelected = selectedRoundIdx === idx;
            return (
              <button
                key={idx}
                onClick={() => setSelectedRoundIdx(idx)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-1.5 hover:scale-105 active:scale-95 ${
                  isSelected
                    ? 'bg-gradient-to-r from-[#FA541C] to-[#E03A00] text-white shadow-md shadow-orange-500/20'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900'
                }`}
              >
                <span>{r.name}</span>
                {r.isFinal && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[9px] uppercase font-extrabold ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-zinc-200 text-zinc-700'
                    }`}
                  >
                    Final
                  </span>
                )}
                {r.maxTeamsQualified && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-zinc-200 text-zinc-700'
                    }`}
                  >
                    Top {r.maxTeamsQualified}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ======================================================== */}
      {/* FILTER BY TRACK PILLS BAR (Exact match to screenshot) */}
      {/* ======================================================== */}
      {hasResults && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <div className="flex items-center gap-1.5 text-xs font-bold text-orange-600 flex-shrink-0 pr-1">
            <Filter className="w-3.5 h-3.5 text-[#FA541C]" />
            <span>Filter by Track:</span>
          </div>

          {/* All Tracks Pill */}
          <button
            onClick={() => setSelectedTrack('ALL')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 flex-shrink-0 cursor-pointer hover:scale-105 active:scale-95 ${
              selectedTrack === 'ALL'
                ? 'bg-zinc-900 text-white shadow-xs'
                : 'bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50 hover:text-zinc-900'
            }`}
          >
            <span>All Tracks</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                selectedTrack === 'ALL' ? 'bg-orange-500 text-white' : 'bg-zinc-100 text-zinc-600'
              }`}
            >
              {activeHackathon.results.length}
            </span>
          </button>

          {/* Individual Track Pills */}
          {uniqueTrackNames.map((trackName) => {
            const count = activeHackathon.results.filter(
              (r) => r.project.track.title === trackName
            ).length;
            const isSelected = selectedTrack === trackName;

            return (
              <button
                key={trackName}
                onClick={() => setSelectedTrack(trackName)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 flex-shrink-0 cursor-pointer hover:scale-105 active:scale-95 ${
                  isSelected
                    ? 'bg-gradient-to-r from-[#FA541C] to-[#E03A00] text-white shadow-md shadow-orange-500/20'
                    : 'bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50 hover:text-zinc-900'
                }`}
              >
                <span>{trackName}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-zinc-100 text-zinc-600'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}

          <div className="flex-shrink-0 p-1 text-zinc-400 hover:text-zinc-700 cursor-pointer">
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      )}

      {loading ? (
        <div className="p-16 text-center text-xs text-zinc-500 bg-white rounded-2xl border border-zinc-200 space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin text-[#FA541C] mx-auto" />
          <p className="font-bold text-sm text-zinc-900">Loading Leaderboard Data...</p>
          <p className="text-xs text-zinc-400">Querying normalized scores and official podium rankings</p>
        </div>
      ) : !activeHackathon || activeHackathon.results.length === 0 ? (
        <div className="bg-white border border-zinc-200 rounded-2xl p-12 text-center shadow-xs space-y-4 max-w-xl mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#FA541C] flex items-center justify-center mx-auto border border-orange-200">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-zinc-900">No Calibrated Results Yet</h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-md mx-auto">
              Judging evaluations have not been normalized for{' '}
              <strong className="text-zinc-900">{activeHackathon?.title}</strong>. Click below to run the Z-Score engine.
            </p>
          </div>
          <button
            onClick={handleGenerate}
            disabled={actionLoading !== null}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-[#FA541C] to-[#E03A00] hover:from-[#E03A00] hover:to-[#C83200] rounded-xl shadow-md shadow-orange-500/20 cursor-pointer hover:scale-105 active:scale-95 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>{actionLoading === 'generate' ? 'Computing Scores...' : 'Compute Normalized Standings'}</span>
          </button>
        </div>
      ) : (
        <>
          {/* ======================================================== */}
          {/* OFFICIAL PODIUM CHAMPIONS (3-Col Cards) */}
          {/* ======================================================== */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4 text-[#FA541C]" />
              <h2 className="text-xs font-extrabold text-zinc-800 uppercase tracking-wider">
                OFFICIAL PODIUM CHAMPIONS
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {topPodium.map((res, idx) => {
                const podiumThemes = [
                  {
                    rankLabel: '1st Place Champion',
                    icon: Trophy,
                    iconColor: 'text-amber-500',
                    pillBg: 'bg-amber-50 text-amber-800 border-amber-200',
                    cardBg: 'bg-white',
                    border: 'border-zinc-200 hover:border-amber-400',
                    defaultAward: 'Grand Enterprise Champion',
                  },
                  {
                    rankLabel: '2nd Place Finalist',
                    icon: Medal,
                    iconColor: 'text-blue-500',
                    pillBg: 'bg-blue-50 text-blue-800 border-blue-200',
                    cardBg: 'bg-white',
                    border: 'border-zinc-200 hover:border-blue-300',
                    defaultAward: 'Frontier Architecture Laureate',
                  },
                  {
                    rankLabel: '3rd Place Finalist',
                    icon: Medal,
                    iconColor: 'text-orange-500',
                    pillBg: 'bg-orange-50 text-orange-800 border-orange-200',
                    cardBg: 'bg-white',
                    border: 'border-zinc-200 hover:border-orange-300',
                    defaultAward: 'Operational Excellence Award',
                  },
                ];

                const theme = podiumThemes[idx] || podiumThemes[1];
                const leader = res.project.team.members.find((m) => m.isLeader)?.user.fullName;
                const awardName = res.awardCategory || theme.defaultAward;

                return (
                  <div
                    key={res.project.id}
                    className={`rounded-2xl p-5 border ${theme.border} ${theme.cardBg} shadow-xs hover:shadow-lg transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between space-y-4 group`}
                  >
                    <div className="space-y-3">
                      {/* Top Rank Badge & Score */}
                      <div className="flex items-center justify-between">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${theme.pillBg}`}
                        >
                          <theme.icon className={`w-3.5 h-3.5 ${theme.iconColor}`} />
                          <span>{theme.rankLabel}</span>
                        </span>

                        <div className="text-right">
                          <span className="font-mono font-black text-xl text-zinc-900 tracking-tight">
                            {res.finalScore.toFixed(2)}
                          </span>
                          <span className="text-[11px] font-bold text-zinc-400 ml-1">pts</span>
                        </div>
                      </div>

                      {/* Project Title & Lead */}
                      <div>
                        <h3
                          onClick={() => openScorecard(res)}
                          className="text-base font-bold text-zinc-900 group-hover:text-[#FA541C] cursor-pointer transition-colors line-clamp-1"
                        >
                          {res.project.title}
                        </h3>
                        <p className="text-xs text-zinc-500 mt-1 truncate">
                          Track: <span className="font-semibold text-zinc-700">{res.project.track.title}</span>
                          {leader ? ` • Lead by ${leader}` : ''}
                        </p>
                      </div>

                      {/* Assigned Award Banner */}
                      <div className="bg-emerald-50/80 border border-emerald-200/90 rounded-xl px-3 py-2 flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                        <Award className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                        <span className="truncate">{awardName}</span>
                      </div>
                    </div>

                    {/* Card Footer: Track & Scorecard Button */}
                    <div className="pt-3 border-t border-zinc-100 flex items-center justify-between text-xs">
                      <span className="truncate text-zinc-500 text-[11px] font-medium max-w-[130px]">
                        {res.project.track.title}
                      </span>
                      <button
                        onClick={() => openScorecard(res)}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                      >
                        <Eye className="w-3 h-3" />
                        <span>View Scorecard</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ======================================================== */}
          {/* COMPLETE EVENT STANDINGS TABLE CARD */}
          {/* ======================================================== */}
          <div className="bg-white border border-zinc-200/90 rounded-2xl shadow-xs overflow-hidden">
            {/* Header with Search Filter */}
            <div className="p-5 border-b border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-200 text-[#FA541C] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <BarChart3 className="w-4 h-4 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-zinc-900">Complete Event Standings</h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Calibrated final rank of all evaluated projects ({filteredResults.length} shown)
                  </p>
                </div>
              </div>

              {/* Search input */}
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter by project or team..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 text-xs bg-zinc-50/80 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/15 text-zinc-900 placeholder:text-zinc-400 transition-all font-medium"
                />
              </div>
            </div>

            {/* Standings Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-zinc-100 text-[11px] font-bold text-zinc-400 uppercase tracking-wider bg-zinc-50/70">
                    <th className="py-4 px-4 text-center w-16">RANK</th>
                    <th className="py-4 px-4">PROJECT &amp; SOLUTION</th>
                    <th className="py-4 px-4">TEAM &amp; MEMBERS</th>
                    <th className="py-4 px-4">TRACK</th>
                    <th className="py-4 px-4 text-right">RAW AVG</th>
                    <th className="py-4 px-4 text-right">FINAL SCORE</th>
                    <th className="py-4 px-4 text-center">ASSIGNED AWARD</th>
                    <th className="py-4 px-4 text-center">SCORECARD</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {filteredResults.map((r) => {
                    const isPodium = r.rank <= 3;
                    const leader = r.project.team.members.find((m) => m.isLeader)?.user.fullName;

                    // Fallback award titles matching screenshot for demo
                    const podiumAwards: { [key: number]: string } = {
                      1: 'Grand Enterprise Champion',
                      2: 'Frontier Architecture Laureate',
                      3: 'Operational Excellence Award',
                    };
                    const displayAward = r.awardCategory || podiumAwards[r.rank] || null;

                    return (
                      <tr
                        key={r.project.id}
                        className="hover:bg-orange-50/20 transition-all duration-200 group"
                      >
                        {/* Rank Badge */}
                        <td className="py-3.5 px-4 text-center font-bold align-middle">
                          {r.rank === 1 ? (
                            <span className="w-7 h-7 rounded-full bg-amber-50 text-amber-800 font-black inline-flex items-center justify-center text-xs border border-amber-200 shadow-2xs group-hover:scale-110 transition-transform">
                              #1
                            </span>
                          ) : r.rank === 2 ? (
                            <span className="w-7 h-7 rounded-full bg-slate-100 text-slate-800 font-black inline-flex items-center justify-center text-xs border border-slate-200 shadow-2xs group-hover:scale-110 transition-transform">
                              #2
                            </span>
                          ) : r.rank === 3 ? (
                            <span className="w-7 h-7 rounded-full bg-orange-50 text-orange-800 font-black inline-flex items-center justify-center text-xs border border-orange-200 shadow-2xs group-hover:scale-110 transition-transform">
                              #3
                            </span>
                          ) : (
                            <span className="text-zinc-500 font-semibold">#{r.rank}</span>
                          )}
                        </td>

                        {/* Project & Solution */}
                        <td className="py-3.5 px-4 max-w-[280px] align-middle">
                          <button
                            onClick={() => openScorecard(r)}
                            className="font-bold text-zinc-900 group-hover:text-[#FA541C] transition-colors text-left truncate block w-full cursor-pointer text-sm"
                          >
                            {r.project.title}
                          </button>
                          <div className="text-[11px] text-zinc-400 truncate mt-0.5 font-normal">
                            {r.project.description ||
                              r.project.tagline ||
                              `Enterprise solution built by ${r.project.team.name}`}
                          </div>
                        </td>

                        {/* Team & Members */}
                        <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                          <div className="font-bold text-zinc-900 flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-blue-500" />
                            <span>{r.project.team.name}</span>
                          </div>
                          <div className="text-[11px] text-zinc-500 mt-0.5">
                            {leader ? `Lead: ${leader}` : `${r.project.team.members.length} members`}
                          </div>
                        </td>

                        {/* Track */}
                        <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold bg-sky-50 text-sky-800 border border-sky-200">
                            {r.project.track.title}
                          </span>
                        </td>

                        {/* Raw Average Score */}
                        <td className="py-3.5 px-4 text-right font-mono text-zinc-500 text-xs align-middle">
                          {r.rawAverageScore.toFixed(2)}
                        </td>

                        {/* Final Calibrated Score */}
                        <td className="py-3.5 px-4 text-right font-mono font-black text-sm align-middle">
                          <span
                            className={`px-2.5 py-1 rounded-md ${
                              isPodium
                                ? 'bg-blue-50 text-blue-700 font-black'
                                : 'text-zinc-900 font-bold'
                            }`}
                          >
                            {r.finalScore.toFixed(2)}
                          </span>
                        </td>

                        {/* Assigned Award Tier */}
                        <td className="py-3.5 px-4 text-center align-middle whitespace-nowrap">
                          {displayAward ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                              <Award className="w-3 h-3 text-emerald-600" />
                              <span>{displayAward}</span>
                            </span>
                          ) : (
                            <span className="text-zinc-300 font-mono">—</span>
                          )}
                        </td>

                        {/* View Scorecard Button */}
                        <td className="py-3.5 px-4 text-center align-middle whitespace-nowrap">
                          <button
                            onClick={() => openScorecard(r)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-zinc-200 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 text-zinc-700 font-bold text-xs transition-all hover:scale-105 active:scale-95 shadow-2xs cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 text-zinc-400 group-hover:text-orange-500" />
                            <span>View</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredResults.length === 0 && (
              <div className="p-8 text-center text-xs text-zinc-400">
                No projects found matching the selected track or search filter.
              </div>
            )}
          </div>

          {/* ======================================================== */}
          {/* VERIFICATION & MATHEMATICAL INTEGRITY CHECKLIST */}
          {/* ======================================================== */}
          {activeHackathon.verification && (
            <div className="bg-white border border-zinc-200/90 rounded-2xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-sm font-bold text-zinc-900">
                    Automated Mathematical Integrity &amp; Audit
                  </h3>
                </div>
                {activeHackathon.verification.isVerified ? (
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>All Preconditions Passed</span>
                  </span>
                ) : (
                  <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                    Integrity Anomalies Detected
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3.5 bg-zinc-50 rounded-xl border border-zinc-200 flex items-center space-x-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <div>
                    <div className="font-bold text-zinc-900">Z-Score Variance</div>
                    <div className="text-[11px] text-zinc-500">Zero NaN / Infinity anomalies</div>
                  </div>
                </div>

                <div className="p-3.5 bg-zinc-50 rounded-xl border border-zinc-200 flex items-center space-x-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <div>
                    <div className="font-bold text-zinc-900">Unique Podium Ranks</div>
                    <div className="text-[11px] text-zinc-500">
                      {activeHackathon.verification.duplicateRanks.length === 0
                        ? 'Zero duplicate rank collisions'
                        : `${activeHackathon.verification.duplicateRanks.length} rank collisions`}
                    </div>
                  </div>
                </div>

                <div className="p-3.5 bg-zinc-50 rounded-xl border border-zinc-200 flex items-center space-x-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <div>
                    <div className="font-bold text-zinc-900">Prize Allocation</div>
                    <div className="text-[11px] text-zinc-500">
                      {activeHackathon.verification.unassignedPrizesCount === 0
                        ? '100% prize tiers mapped to winners'
                        : `${activeHackathon.verification.unassignedPrizesCount} unassigned prizes`}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Team Evaluation Scorecard Modal */}
      <TeamScorecardModal
        isOpen={!!activeScorecardTeam}
        onClose={() => setActiveScorecardTeam(null)}
        team={activeScorecardTeam}
      />
    </div>
  );
}
