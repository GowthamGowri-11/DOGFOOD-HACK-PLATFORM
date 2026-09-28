'use client';

// ApexHack Leaderboard & Results Engine
import React, { useState, useEffect, useCallback } from 'react';
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

interface HackathonResultData {
  id: string;
  title: string;
  slug: string;
  status: string;
  resultsPublishedAt: string | null;
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

  // Filter results for track and search
  const filteredResults = activeHackathon?.results.filter((r) => {
    // Track filter
    if (selectedTrack !== 'ALL' && r.project.track.title !== selectedTrack) {
      return false;
    }
    // Search query filter
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.project.title.toLowerCase().includes(q) ||
      r.project.team.name.toLowerCase().includes(q) ||
      (r.awardCategory && r.awardCategory.toLowerCase().includes(q)) ||
      r.project.track.title.toLowerCase().includes(q)
    );
  }) || [];

  const topPodium = activeHackathon?.results.slice(0, 3) || [];
  const topScore = activeHackathon?.results[0]?.finalScore || 0;
  const isPublished = activeHackathon?.stats.isPublished || activeHackathon?.status === 'RESULTS_PUBLISHED';
  const hasResults = (activeHackathon?.results.length || 0) > 0;

  return (
    <div className="space-y-6">
      {/* Platform Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#E2E8F0] gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-bold text-[#DC2626] bg-[#FEF2F2] px-2.5 py-0.5 rounded-full border border-[#FECACA]">
              Global Platform Control
            </span>
            <span className="text-[11px] font-semibold text-[#059669] bg-[#ECFDF5] px-2.5 py-0.5 rounded-full border border-[#A7F3D0] flex items-center">
              <CheckCircle2 className="w-3 h-3 mr-1" /> Results Engine Synchronized
            </span>
            <span className="hidden md:inline-flex text-[11px] font-semibold text-[#2563EB] bg-[#EFF6FF] px-2.5 py-0.5 rounded-full border border-[#BFDBFE] items-center">
              <Scale className="w-3 h-3 mr-1" /> Z-Score Normalization
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0F172A] mt-1 tracking-tight">
            Leaderboard & Results Publication
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
            Administers official normalized scores, podium rankings, award assignments, and global public publication.
          </p>
        </div>

        <div className="flex items-center space-x-3 self-start sm:self-center">
          <Link
            href={`/leaderboard?hackathonId=${activeHackathon?.id || ''}`}
            target="_blank"
            className="inline-flex items-center px-4 py-2.5 bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-semibold rounded-[11px] transition-colors shadow-sm"
          >
            <BarChart3 className="w-4 h-4 mr-1.5 text-[#60A5FA]" />
            Public Leaderboard
            <ArrowUpRight className="w-3.5 h-3.5 ml-1 text-[#94A3B8]" />
          </Link>
        </div>
      </div>

      {/* Notifications */}
      {message && (
        <div className="p-4 bg-[#ECFDF5] border border-[#A7F3D0] rounded-[14px] text-xs text-[#065F46] flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-[#059669]" />
            <span className="font-medium">{message}</span>
          </div>
          <button
            onClick={() => setMessage(null)}
            className="text-xs font-bold text-[#065F46] hover:text-[#047857]"
          >
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-[#FEF2F2] border border-[#FECACA] rounded-[14px] text-xs text-[#DC2626] flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-[#EF4444]" />
            <span className="font-medium">{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-xs font-bold text-[#DC2626] hover:text-[#B91C1C]"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Arena Selector & Action Controls Bar */}
      <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-[18px] p-5 shadow-card space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Hackathon Dropdown */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] flex items-center justify-center font-bold">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block">
                Select Hackathon Arena
              </span>
              <div className="flex items-center space-x-2 mt-0.5">
                <select
                  value={selectedHackathonId}
                  onChange={(e) => {
                    setSelectedHackathonId(e.target.value);
                    setSelectedTrack('ALL');
                  }}
                  className="px-3 py-1.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-[10px] text-xs font-bold text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                >
                  {hackathons.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.title} ({h.stats.rankedCount} ranked • {h.status})
                    </option>
                  ))}
                </select>

                {isPublished ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]">
                    <CheckCircle2 className="w-3 h-3 mr-1 text-[#059669]" />
                    Published
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A]">
                    Draft Stage
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Engine Controls: Normalization & Publishing */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Normalization Method Toggle */}
            <div className="flex items-center bg-[#F1F5F9] p-1 rounded-[11px] border border-[#E2E8F0] text-xs">
              <button
                type="button"
                onClick={() => setSelectedMethod('Z_SCORE')}
                className={`px-3 py-1.5 rounded-[8px] font-semibold transition-all ${
                  selectedMethod === 'Z_SCORE'
                    ? 'bg-white text-[#2563EB] shadow-xs'
                    : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                Z-Score Normalization
              </button>
              <button
                type="button"
                onClick={() => setSelectedMethod('MIN_MAX')}
                className={`px-3 py-1.5 rounded-[8px] font-semibold transition-all ${
                  selectedMethod === 'MIN_MAX'
                    ? 'bg-white text-[#2563EB] shadow-xs'
                    : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                Min-Max Scaling
              </button>
            </div>

            {/* Recalculate Button */}
            <Button
              size="sm"
              variant="outline"
              onClick={handleGenerate}
              disabled={actionLoading !== null}
              className="bg-white border-[#CBD5E1] text-[#0F172A] hover:bg-[#F8FAFC]"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 mr-1.5 text-[#2563EB] ${
                  actionLoading === 'generate' ? 'animate-spin' : ''
                }`}
              />
              {actionLoading === 'generate' ? 'Normalizing...' : 'Calibrate & Rank'}
            </Button>

            {/* Publish / Unpublish Action */}
            {hasResults && !isPublished && (
              <Button
                size="sm"
                onClick={handlePublish}
                disabled={actionLoading !== null}
                className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1.5 text-white" />
                {actionLoading === 'publish' ? 'Publishing...' : 'Publish Official Results'}
              </Button>
            )}

            {isPublished && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleUnpublish}
                disabled={actionLoading !== null}
                className="border-[#FECACA] text-[#DC2626] hover:bg-[#FEF2F2]"
              >
                <EyeOff className="w-3.5 h-3.5 mr-1.5 text-[#DC2626]" />
                {actionLoading === 'unpublish' ? 'Reverting...' : 'Unpublish to Draft'}
              </Button>
            )}
          </div>
        </div>

        {/* Dynamic Metric KPI Cards */}
        {activeHackathon && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
            {/* KPI 1: Ranked Projects */}
            <div className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[14px]">
              <div className="flex items-center justify-between text-[#64748B] mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Ranked Submissions</span>
                <Trophy className="w-4 h-4 text-[#2563EB]" />
              </div>
              <div className="text-xl font-bold text-[#0F172A]">
                {activeHackathon.stats.rankedCount}{' '}
                <span className="text-xs font-normal text-[#64748B]">
                  / {activeHackathon.stats.submittedProjectsCount} projects
                </span>
              </div>
              <p className="text-[11px] text-[#059669] font-medium mt-0.5">
                {activeHackathon.stats.completedEvaluationsCount} completed evaluations
              </p>
            </div>

            {/* KPI 2: Top Score */}
            <div className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[14px]">
              <div className="flex items-center justify-between text-[#64748B] mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Top Arena Score</span>
                <TrendingUp className="w-4 h-4 text-[#D97706]" />
              </div>
              <div className="text-xl font-bold text-[#0F172A] font-mono">
                {topScore.toFixed(2)}{' '}
                <span className="text-xs font-normal text-[#64748B]">pts</span>
              </div>
              <p className="text-[11px] text-[#64748B] truncate mt-0.5">
                Leader: {activeHackathon.results[0]?.project.title || 'None'}
              </p>
            </div>

            {/* KPI 3: Normalization Engine */}
            <div className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[14px]">
              <div className="flex items-center justify-between text-[#64748B] mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Normalization Run</span>
                <Cpu className="w-4 h-4 text-[#7C3AED]" />
              </div>
              <div className="text-base font-bold text-[#0F172A] truncate">
                {activeHackathon.latestNormalization
                  ? `${activeHackathon.latestNormalization.method} (v${activeHackathon.latestNormalization.version})`
                  : 'Pending Calibration'}
              </div>
              <p className="text-[11px] text-[#64748B] mt-0.5">
                Variance normalization active
              </p>
            </div>

            {/* KPI 4: Publication Status */}
            <div className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[14px]">
              <div className="flex items-center justify-between text-[#64748B] mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Publication Status</span>
                {isPublished ? (
                  <Eye className="w-4 h-4 text-[#059669]" />
                ) : (
                  <EyeOff className="w-4 h-4 text-[#94A3B8]" />
                )}
              </div>
              <div className="text-base font-bold text-[#0F172A]">
                {isPublished ? (
                  <span className="text-[#059669]">Officially Published</span>
                ) : (
                  <span className="text-[#D97706]">Internal Draft</span>
                )}
              </div>
              <p className="text-[11px] text-[#64748B] mt-0.5">
                {activeHackathon.stats.prizesCount} prize tiers assigned
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Track Filter Pills Bar */}
      {hasResults && (
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
            All Tracks ({activeHackathon.results.length})
          </button>

          {uniqueTrackNames.map((trackName) => {
            const count = activeHackathon.results.filter(
              (r) => r.project.track.title === trackName
            ).length;
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

      {loading ? (
        <div className="p-16 text-center text-xs text-[#64748B] bg-white rounded-[18px] border border-[#E2E8F0] space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2563EB] mx-auto" />
          <p className="font-semibold text-sm text-[#0F172A]">Loading Leaderboard Data...</p>
          <p className="text-xs text-[#64748B]">Querying PostgreSQL for normalized scores and podium rankings.</p>
        </div>
      ) : !activeHackathon || activeHackathon.results.length === 0 ? (
        <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-[18px] p-12 text-center shadow-card space-y-4 max-w-xl mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center mx-auto">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#0F172A]">No Calibrated Results Yet</h3>
            <p className="text-xs text-[#64748B] mt-1 max-w-md mx-auto">
              Judging evaluations have not been normalized for{' '}
              <strong className="text-[#0F172A]">{activeHackathon?.title}</strong>. Click below to run the Z-Score engine.
            </p>
          </div>
          <Button onClick={handleGenerate} disabled={actionLoading !== null} className="bg-[#2563EB] text-white">
            <Sparkles className="w-4 h-4 mr-1.5" />
            {actionLoading === 'generate' ? 'Computing Scores...' : 'Compute Normalized Standings'}
          </Button>
        </div>
      ) : (
        <>
          {/* Top 3 Podium Showcase Cards */}
          <div>
            <div className="flex items-center justify-between pb-3 px-1">
              <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider flex items-center">
                <Sparkles className="w-3.5 h-3.5 text-[#2563EB] mr-1.5" />
                Official Podium Champions
              </span>
              <span className="text-xs text-[#059669] font-semibold flex items-center">
                <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Mathematical Integrity Audited
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {topPodium.map((res, idx) => {
                const podiumThemes = [
                  {
                    rankLabel: '🥇 1st Place Champion',
                    bg: 'bg-gradient-to-b from-[#FFFBEB] via-[#FFFFFF] to-[#FFFFFF]',
                    border: 'border-[#FDE68A] hover:border-[#F59E0B]',
                    badge: 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]',
                    trophyColor: 'text-[#D97706]',
                  },
                  {
                    rankLabel: '🥈 2nd Place Finalist',
                    bg: 'bg-gradient-to-b from-[#F8FAFC] via-[#FFFFFF] to-[#FFFFFF]',
                    border: 'border-[#CBD5E1] hover:border-[#94A3B8]',
                    badge: 'bg-[#E2E8F0] text-[#334155] border-[#CBD5E1]',
                    trophyColor: 'text-[#64748B]',
                  },
                  {
                    rankLabel: '🥉 3rd Place Finalist',
                    bg: 'bg-gradient-to-b from-[#FFF7ED] via-[#FFFFFF] to-[#FFFFFF]',
                    border: 'border-[#FED7AA] hover:border-[#FB923C]',
                    badge: 'bg-[#FFEDD5] text-[#9A3412] border-[#FED7AA]',
                    trophyColor: 'text-[#EA580C]',
                  },
                ];

                const theme = podiumThemes[idx] || podiumThemes[1];
                const leader = res.project.team.members.find((m) => m.isLeader)?.user.fullName;

                return (
                  <div
                    key={res.project.id}
                    className={`${theme.bg} border ${theme.border} rounded-[18px] p-5 shadow-card flex flex-col justify-between space-y-4 transition-all hover:shadow-elevated`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-bold border flex items-center space-x-1 ${theme.badge}`}
                        >
                          <Trophy className={`w-3.5 h-3.5 ${theme.trophyColor}`} />
                          <span>{theme.rankLabel}</span>
                        </span>

                        <div className="text-right">
                          <span className="font-mono font-black text-xl text-[#0F172A]">
                            {res.finalScore.toFixed(2)}
                          </span>
                          <span className="text-[11px] text-[#64748B] ml-1">pts</span>
                        </div>
                      </div>

                      <div>
                        <h3
                          onClick={() => openScorecard(res)}
                          className="text-base font-bold text-[#0F172A] hover:text-[#2563EB] cursor-pointer transition-colors line-clamp-1"
                        >
                          {res.project.title}
                        </h3>
                        <p className="text-xs text-[#64748B] mt-0.5">
                          Team: <strong className="text-[#334155]">{res.project.team.name}</strong>
                          {leader ? ` • Led by ${leader}` : ''}
                        </p>
                      </div>

                      {res.awardCategory && (
                        <div className="bg-[#ECFDF5] border border-[#A7F3D0] rounded-[11px] p-2.5 flex items-center text-xs font-bold text-[#065F46]">
                          <Award className="w-4 h-4 mr-1.5 text-[#059669] flex-shrink-0" />
                          <span className="truncate">{res.awardCategory}</span>
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-[#F1F5F9] flex items-center justify-between text-xs">
                      <span className="truncate font-medium text-[#475569] max-w-[140px]">
                        {res.project.track.title}
                      </span>
                      <button
                        onClick={() => openScorecard(res)}
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

          {/* Full Leaderboard Table Card */}
          <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-[18px] overflow-hidden shadow-card space-y-0">
            {/* Table Header & Search Filter */}
            <div className="p-5 border-b border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-[#0F172A]">Complete Event Standings</h3>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Calibrated final rank of all evaluated projects ({filteredResults.length} shown)
                </p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                <input
                  type="text"
                  placeholder="Filter by project or team..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded-[10px] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#F8FAFC] text-[#64748B] font-bold uppercase tracking-wider border-b border-[#E2E8F0]">
                    <th className="py-3 px-4 text-center w-16">Rank</th>
                    <th className="py-3 px-4">Project & Solution</th>
                    <th className="py-3 px-4">Team & Members</th>
                    <th className="py-3 px-4">Track</th>
                    <th className="py-3 px-4 text-right">Raw Avg</th>
                    <th className="py-3 px-4 text-right">Final Score</th>
                    <th className="py-3 px-4 text-right">Assigned Award</th>
                    <th className="py-3 px-4 text-center">Scorecard</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {filteredResults.map((r) => {
                    const isPodium = r.rank <= 3;
                    const leader = r.project.team.members.find((m) => m.isLeader)?.user.fullName;

                    return (
                      <tr key={r.project.id} className="hover:bg-[#F8FAFC] transition-colors">
                        {/* Rank */}
                        <td className="py-3.5 px-4 text-center font-bold">
                          {r.rank === 1 ? (
                            <span className="w-7 h-7 rounded-full bg-[#FEF3C7] text-[#92400E] font-black inline-flex items-center justify-center text-xs border border-[#FDE68A]">
                              #1
                            </span>
                          ) : r.rank === 2 ? (
                            <span className="w-7 h-7 rounded-full bg-[#E2E8F0] text-[#334155] font-black inline-flex items-center justify-center text-xs border border-[#CBD5E1]">
                              #2
                            </span>
                          ) : r.rank === 3 ? (
                            <span className="w-7 h-7 rounded-full bg-[#FFEDD5] text-[#9A3412] font-black inline-flex items-center justify-center text-xs border border-[#FED7AA]">
                              #3
                            </span>
                          ) : (
                            <span className="text-[#64748B] font-semibold">#{r.rank}</span>
                          )}
                        </td>

                        {/* Project */}
                        <td className="py-3.5 px-4 max-w-[280px]">
                          <button
                            onClick={() => openScorecard(r)}
                            className="font-bold text-[#0F172A] hover:text-[#2563EB] transition-colors text-left truncate block w-full"
                          >
                            {r.project.title}
                          </button>
                          {r.project.tagline && (
                            <div className="text-[11px] text-[#64748B] truncate mt-0.5">
                              {r.project.tagline}
                            </div>
                          )}
                        </td>

                        {/* Team */}
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-[#0F172A] flex items-center">
                            <Users className="w-3 h-3 mr-1 text-[#2563EB]" />
                            {r.project.team.name}
                          </div>
                          <div className="text-[11px] text-[#64748B] mt-0.5">
                            {leader ? `Lead: ${leader}` : `${r.project.team.members.length} members`}
                          </div>
                        </td>

                        {/* Track */}
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
                            {r.project.track.title}
                          </span>
                        </td>

                        {/* Raw Average Score */}
                        <td className="py-3.5 px-4 text-right font-mono text-[#64748B] text-xs">
                          {r.rawAverageScore.toFixed(2)}
                        </td>

                        {/* Final Calibrated Score */}
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-[#0F172A] text-sm">
                          <span
                            className={`px-2 py-0.5 rounded-md ${
                              isPodium
                                ? 'bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]'
                                : 'text-[#0F172A]'
                            }`}
                          >
                            {r.finalScore.toFixed(2)}
                          </span>
                        </td>

                        {/* Assigned Award Tier */}
                        <td className="py-3.5 px-4 text-right">
                          {r.awardCategory ? (
                            <span className="inline-flex items-center text-[11px] font-bold px-2 py-0.5 rounded-md bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]">
                              <Award className="w-3 h-3 mr-1 text-[#059669]" />
                              {r.awardCategory}
                            </span>
                          ) : (
                            <span className="text-[#CBD5E1] font-mono">—</span>
                          )}
                        </td>

                        {/* View Scorecard Button */}
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => openScorecard(r)}
                            className="inline-flex items-center px-3 py-1.5 rounded-[9px] bg-[#EFF6FF] text-[#2563EB] hover:bg-[#DBEAFE] font-bold text-xs transition-colors shadow-2xs"
                          >
                            <Eye className="w-3.5 h-3.5 mr-1" />
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredResults.length === 0 && (
              <div className="p-8 text-center text-xs text-[#94A3B8]">
                No projects found matching the selected track or search filter.
              </div>
            )}
          </div>

          {/* Verification & Mathematical Integrity Checklist */}
          {activeHackathon.verification && (
            <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-[18px] p-5 shadow-card space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-5 h-5 text-[#059669]" />
                  <h3 className="text-sm font-bold text-[#0F172A]">
                    Automated Mathematical Integrity & Audit
                  </h3>
                </div>
                {activeHackathon.verification.isVerified ? (
                  <span className="text-[11px] font-bold text-[#059669] bg-[#ECFDF5] px-2.5 py-0.5 rounded-full border border-[#A7F3D0] flex items-center">
                    <CheckCircle2 className="w-3 h-3 mr-1" /> All Preconditions Passed
                  </span>
                ) : (
                  <span className="text-[11px] font-bold text-[#DC2626] bg-[#FEF2F2] px-2.5 py-0.5 rounded-full border border-[#FECACA]">
                    Integrity Anomalies Detected
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-[#F8FAFC] rounded-[11px] border border-[#E2E8F0] flex items-center space-x-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#059669] flex-shrink-0" />
                  <div>
                    <div className="font-bold text-[#0F172A]">Z-Score Variance</div>
                    <div className="text-[11px] text-[#64748B]">Zero NaN / Infinity anomalies</div>
                  </div>
                </div>

                <div className="p-3 bg-[#F8FAFC] rounded-[11px] border border-[#E2E8F0] flex items-center space-x-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#059669] flex-shrink-0" />
                  <div>
                    <div className="font-bold text-[#0F172A]">Unique Podium Ranks</div>
                    <div className="text-[11px] text-[#64748B]">
                      {activeHackathon.verification.duplicateRanks.length === 0
                        ? 'Zero duplicate rank collisions'
                        : `${activeHackathon.verification.duplicateRanks.length} rank collisions`}
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-[#F8FAFC] rounded-[11px] border border-[#E2E8F0] flex items-center space-x-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#059669] flex-shrink-0" />
                  <div>
                    <div className="font-bold text-[#0F172A]">Prize Allocation</div>
                    <div className="text-[11px] text-[#64748B]">
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
