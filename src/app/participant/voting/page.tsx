'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Vote,
  Sparkles,
  Layers,
  Search,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ChevronRight,
  TrendingUp,
  RefreshCw,
  Info,
  Shield,
  Clock,
  Filter,
  ArrowRight,
  Minus,
  Plus,
  BarChart2,
  Check,
  Award,
  Trophy,
  Calendar,
  Building2,
  ChevronDown,
  Flame,
  Crown,
  LayoutGrid,
  ListOrdered,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

interface Track {
  id: string;
  title: string;
  colorHex: string;
}

interface ProblemStatement {
  id: string;
  code: string;
  title: string;
  description: string;
  trackId: string;
  trackTitle: string;
  trackColorHex: string;
  totalVotes: number;
  totalCredits: number;
  totalVoters: number;
  rank: number;
  pollVotes?: number;
  pollPercentage?: number;
  isLeading?: boolean;
}

interface Campaign {
  id: string;
  hackathonId: string;
  title: string;
  description: string;
  status: 'ACTIVE' | 'PAUSED' | 'CLOSED';
  votingMechanism: 'QUADRATIC' | 'ONE_PERSON_ONE_VOTE';
  maxCredits: number;
  hideResultsUntilClosed: boolean;
  randomizeOrder: boolean;
  startsAt: string;
  endsAt: string | null;
}

interface VoterRecord {
  problemStatementId: string;
  votes: number;
  creditsSpent: number;
}

interface VoterState {
  userId: string;
  userEmail?: string;
  totalCreditsSpent: number;
  remainingCredits: number;
  votes: Record<string, VoterRecord>;
}

interface HackathonInfo {
  id: string;
  title: string;
  slug: string;
  currentRoundNumber: number;
  status: string;
  organizationName?: string;
}

interface RoundInfo {
  id: string;
  roundNumber: number;
  name: string;
  roundType: string;
  status: string;
  startDate?: string;
  endDate?: string;
  submissionDeadline?: string;
  isCurrent?: boolean;
}

export default function ParticipantQuestionVotingPage() {
  const [loading, setLoading] = useState(true);
  const [submittingVoteId, setSubmittingVoteId] = useState<string | null>(null);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [hackathon, setHackathon] = useState<HackathonInfo | null>(null);
  const [allHackathons, setAllHackathons] = useState<Array<{ id: string; title: string; status: string }>>([]);
  const [selectedHackathonId, setSelectedHackathonId] = useState<string>('hack_apex_2026');
  const [rounds, setRounds] = useState<RoundInfo[]>([]);
  const [selectedRoundNumber, setSelectedRoundNumber] = useState<number>(1);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [problemStatements, setProblemStatements] = useState<ProblemStatement[]>([]);
  const [viewMode, setViewMode] = useState<'poll' | 'ballot'>('poll');

  const [voterState, setVoterState] = useState<VoterState>({
    userId: '',
    totalCreditsSpent: 0,
    remainingCredits: 9,
    votes: {},
  });
  const [metrics, setMetrics] = useState({
    totalVotersCount: 0,
    totalVotesCast: 0,
    isResultsHidden: false,
    topVotedProblem: null as ProblemStatement | null,
  });

  const [selectedTrack, setSelectedTrack] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMyVotesOnly, setFilterMyVotesOnly] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadData = async (targetHackathonId = selectedHackathonId) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/v1/hackathons/${targetHackathonId}/question-voting`);
      const json = await res.json();
      if (json.success && json.data) {
        setCampaign(json.data.campaign);
        if (json.data.hackathon) {
          setHackathon(json.data.hackathon);
          setSelectedRoundNumber(json.data.hackathon.currentRoundNumber || 1);
        }
        if (json.data.allHackathons) {
          setAllHackathons(json.data.allHackathons);
        }
        if (json.data.rounds) {
          setRounds(json.data.rounds);
        }
        setTracks(json.data.tracks || []);
        setProblemStatements(json.data.problemStatements || []);
        if (json.data.voterState) {
          setVoterState(json.data.voterState);
        }
        if (json.data.metrics) {
          setMetrics(json.data.metrics);
        }
      }
    } catch (err: any) {
      console.error('Failed to load voting ballot:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(selectedHackathonId);
  }, [selectedHackathonId]);

  const handleHackathonSwitch = (newId: string) => {
    setSelectedHackathonId(newId);
  };

  const handleVoteChange = async (psId: string, delta: number) => {
    if (!campaign) return;
    if (campaign.status !== 'ACTIVE') {
      setNotice({ type: 'error', message: 'Voting session is currently not active.' });
      return;
    }

    const currentVotes = voterState.votes[psId]?.votes || 0;
    const targetVotes = Math.max(0, currentVotes + delta);

    if (campaign.votingMechanism === 'ONE_PERSON_ONE_VOTE' && targetVotes > 1) {
      setNotice({ type: 'error', message: 'In One-Person-One-Vote mode, max 1 vote per question.' });
      return;
    }

    // Check quadratic credit feasibility locally before sending
    const currentCreditsForThis = voterState.votes[psId]?.creditsSpent || 0;
    const newCreditsForThis =
      campaign.votingMechanism === 'QUADRATIC' ? targetVotes * targetVotes : targetVotes;
    const creditDelta = newCreditsForThis - currentCreditsForThis;

    if (voterState.totalCreditsSpent + creditDelta > campaign.maxCredits) {
      setNotice({
        type: 'error',
        message: `Insufficient voting credits! You need ${creditDelta} more credits, but only have ${voterState.remainingCredits} left.`,
      });
      return;
    }

    try {
      setSubmittingVoteId(psId);
      setNotice(null);

      const res = await fetch(`/api/v1/hackathons/${selectedHackathonId}/question-voting/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problemStatementId: psId,
          desiredVotes: targetVotes,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || 'Failed to update vote');
      }

      setVoterState(json.data.voter);
      setNotice({
        type: 'success',
        message:
          targetVotes > currentVotes
            ? `Vote recorded for challenge ${targetVotes}x!`
            : targetVotes === 0
            ? 'Vote removed and credits returned to your wallet.'
            : `Vote updated to ${targetVotes}x.`,
      });

      // Update local problemStatement count and recalculate percentages immediately
      setProblemStatements((prev) => {
        const nextList = prev.map((p) =>
          p.id === psId
            ? {
                ...p,
                totalVotes: Math.max(0, p.totalVotes + delta),
                totalCredits: Math.max(0, p.totalCredits + creditDelta),
              }
            : p
        );
        const newTotalVotes = nextList.reduce((sum, item) => sum + item.totalVotes, 0);
        return nextList.map((p) => ({
          ...p,
          pollPercentage: newTotalVotes > 0 ? Math.round((p.totalVotes / newTotalVotes) * 100) : 0,
        }));
      });

      setMetrics((prev) => ({
        ...prev,
        totalVotesCast: Math.max(0, prev.totalVotesCast + delta),
      }));
    } catch (err: any) {
      setNotice({ type: 'error', message: err.message || 'Error casting vote' });
    } finally {
      setSubmittingVoteId(null);
    }
  };

  const filteredQuestions = useMemo(() => {
    return problemStatements.filter((item) => {
      const matchTrack = selectedTrack === 'ALL' || item.trackId === selectedTrack;
      const matchSearch =
        searchQuery.trim() === '' ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.trackTitle.toLowerCase().includes(searchQuery.toLowerCase());
      const hasMyVote = (voterState.votes[item.id]?.votes || 0) > 0;
      const matchMyVotes = !filterMyVotesOnly || hasMyVote;
      return matchTrack && matchSearch && matchMyVotes;
    });
  }, [problemStatements, selectedTrack, searchQuery, filterMyVotesOnly, voterState]);

  const votedQuestionsCount = Object.keys(voterState.votes).filter(
    (k) => voterState.votes[k]?.votes > 0
  ).length;

  const currentActiveRound = rounds.find((r) => r.roundNumber === selectedRoundNumber) || rounds[0];
  const leadingQuestion = useMemo(() => {
    if (problemStatements.length === 0) return null;
    return [...problemStatements].sort((a, b) => b.totalVotes - a.totalVotes)[0];
  }, [problemStatements]);

  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#131417] text-neutral-900 dark:text-neutral-100 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-7">

        {/* 1. HACKATHON & ROUND CONTEXT CONTROL BAR */}
        <div className="bg-white dark:bg-[#1A1C20] rounded-3xl border border-neutral-200 dark:border-neutral-800 p-5 sm:p-6 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 border-b border-neutral-100 dark:border-neutral-800 pb-5">
            {/* Hackathon Selector & Info */}
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-[#FA541C]/10 text-[#FA541C] border border-[#FA541C]/20">
                  <Trophy className="w-3 h-3 text-[#FA541C]" />
                  Active Hackathon Arena
                </span>
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                  ● {hackathon?.status || 'LIVE'}
                </span>
              </div>

              {/* Hackathon Switcher Dropdown */}
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-neutral-900 dark:text-white">
                  {hackathon?.title || 'Apex Global AI Challenge 2026'}
                </h1>

                {allHackathons.length > 1 && (
                  <div className="relative inline-block">
                    <select
                      value={selectedHackathonId}
                      onChange={(e) => handleHackathonSwitch(e.target.value)}
                      className="appearance-none pl-3 pr-8 py-1.5 rounded-xl text-xs font-bold bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#FA541C]/40"
                    >
                      {allHackathons.map((h) => (
                        <option key={h.id} value={h.id}>
                          Switch to: {h.title}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" />
                  </div>
                )}
              </div>

              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Organized by <strong className="text-neutral-700 dark:text-neutral-300">{hackathon?.organizationName || 'ATLYX Arena'}</strong> • Community Problem Selection & Voting Stage
              </p>
            </div>

            {/* Voting Session Status Pill */}
            <div className="flex items-center gap-3 self-start lg:self-center">
              <span
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider ${
                  campaign?.status === 'ACTIVE'
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                    : campaign?.status === 'PAUSED'
                    ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                    : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 border border-neutral-300 dark:border-neutral-700'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    campaign?.status === 'ACTIVE'
                      ? 'bg-emerald-500 animate-pulse'
                      : campaign?.status === 'PAUSED'
                      ? 'bg-amber-500'
                      : 'bg-neutral-400'
                  }`}
                />
                {campaign?.status === 'ACTIVE'
                  ? 'POLL OPEN • LIVE VOTING'
                  : campaign?.status === 'PAUSED'
                  ? 'POLL PAUSED'
                  : 'POLL CONCLUDED'}
              </span>

              <button
                onClick={() => loadData(selectedHackathonId)}
                disabled={loading}
                className="p-2 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                title="Refresh Live Polling Tallies"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* 2. ROUNDS STEPPER & STATUS TABS */}
          <div className="pt-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider mr-1">
                Hackathon Rounds:
              </span>
              {rounds.map((r) => {
                const isSelected = r.roundNumber === selectedRoundNumber;
                return (
                  <button
                    key={r.id || r.roundNumber}
                    onClick={() => setSelectedRoundNumber(r.roundNumber)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                      isSelected
                        ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-sm ring-2 ring-[#FA541C]/30'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                    }`}
                  >
                    <span className="w-4 h-4 rounded-full bg-[#FA541C] text-white text-[10px] font-black flex items-center justify-center">
                      {r.roundNumber}
                    </span>
                    <span>{r.name.split(':')[0]}</span>
                    {r.isCurrent && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                        Active
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
              <Clock className="w-3.5 h-3.5 text-[#FA541C]" />
              <span>
                Current Phase: <strong className="text-neutral-900 dark:text-neutral-200">{currentActiveRound?.name || 'Round 1: Problem Selection & Ideation Poll'}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Notification Toast */}
        {notice && (
          <div
            className={`p-4 rounded-2xl flex items-center justify-between gap-3 text-sm animate-in fade-in-50 ${
              notice.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800'
                : 'bg-red-50 dark:bg-red-950/50 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800'
            }`}
          >
            <div className="flex items-center gap-2">
              {notice.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600 dark:text-red-400" />
              )}
              <span>{notice.message}</span>
            </div>
            <button
              onClick={() => setNotice(null)}
              className="text-xs font-semibold underline hover:opacity-75"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* 3. VOTING BUDGET & LIVE POLL LEADERBOARD SUMMARY */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Your Voting Power Pool */}
          <div className="lg:col-span-2 bg-white dark:bg-[#1A1C20] rounded-3xl border border-neutral-200 dark:border-neutral-800 p-6 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#FA541C]/10 to-transparent rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-neutral-400">
                  Your Polling Budget
                </span>
                <h2 className="text-xl font-black flex items-center gap-2 mt-0.5">
                  <Sparkles className="w-5 h-5 text-[#FA541C]" />
                  <span>
                    {campaign?.votingMechanism === 'QUADRATIC'
                      ? 'Quadratic Voting Power Pool'
                      : 'Community Polling Power'}
                  </span>
                </h2>
              </div>

              <div className="text-right">
                <div className="text-2xl font-black text-[#FA541C]">
                  {voterState.remainingCredits} / {campaign?.maxCredits || 9}
                </div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                  Credits Available
                </div>
              </div>
            </div>

            {/* Credit Progress Bar */}
            <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-3 overflow-hidden p-0.5 mb-5">
              <div
                className="bg-gradient-to-r from-[#FA541C] to-amber-500 h-full rounded-full transition-all duration-300"
                style={{
                  width: `${
                    ((campaign?.maxCredits ? voterState.totalCreditsSpent / campaign.maxCredits : 0) * 100) || 0
                  }%`,
                }}
              />
            </div>

            {/* Breakdown Pills */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-2xl border border-neutral-200 dark:border-neutral-800">
                <div className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                  {voterState.totalCreditsSpent}
                </div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400">Credits Used</div>
              </div>
              <div className="p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-2xl border border-neutral-200 dark:border-neutral-800">
                <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                  {voterState.remainingCredits}
                </div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400">Credits Remaining</div>
              </div>
              <div className="p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-2xl border border-neutral-200 dark:border-neutral-800">
                <div className="text-lg font-bold text-[#FA541C]">{votedQuestionsCount}</div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400">Questions Backed</div>
              </div>
            </div>
          </div>

          {/* Live Polling Community Summary */}
          <div className="bg-white dark:bg-[#1A1C20] rounded-3xl border border-neutral-200 dark:border-neutral-800 p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  <BarChart2 className="w-4 h-4 text-[#FA541C]" />
                  Live Community Poll Stats
                </span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  Round 1 Active
                </span>
              </div>

              <div className="space-y-3 font-sans">
                <div className="flex justify-between items-center p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 text-xs">
                  <span className="text-neutral-500">Total Poll Votes Cast:</span>
                  <span className="font-extrabold text-sm text-neutral-900 dark:text-white">
                    {metrics.totalVotesCast} Votes
                  </span>
                </div>

                <div className="flex justify-between items-center p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 text-xs">
                  <span className="text-neutral-500">Active Voters Participating:</span>
                  <span className="font-extrabold text-sm text-neutral-900 dark:text-white">
                    {metrics.totalVotersCount} Voters
                  </span>
                </div>

                {leadingQuestion && (
                  <div className="p-3 rounded-xl bg-[#FA541C]/5 border border-[#FA541C]/20 text-xs">
                    <div className="flex items-center gap-1.5 text-[#FA541C] font-bold text-[11px] mb-1">
                      <Crown className="w-3.5 h-3.5" />
                      Leading Poll Choice:
                    </div>
                    <div className="font-bold text-neutral-900 dark:text-white truncate">
                      {leadingQuestion.title}
                    </div>
                    <div className="text-[11px] text-neutral-500 mt-0.5">
                      {leadingQuestion.pollPercentage || 0}% of all votes ({leadingQuestion.totalVotes} votes)
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
              <span className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-500" />
                Quadratic Anti-Abuse
              </span>
              <span>100% Verifiable</span>
            </div>
          </div>
        </div>

        {/* 4. TRACK FILTERS, SEARCH & VIEW MODE SWITCHER */}
        <div className="bg-white dark:bg-[#1A1C20] rounded-3xl border border-neutral-200 dark:border-neutral-800 p-4 sm:p-5 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Track Selector Tabs */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setSelectedTrack('ALL')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  selectedTrack === 'ALL'
                    ? 'bg-[#FA541C] text-white shadow-sm'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                }`}
              >
                All Tracks ({problemStatements.length})
              </button>

              {tracks.map((t) => {
                const count = problemStatements.filter((p) => p.trackId === t.id).length;
                const isSelected = selectedTrack === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTrack(t.id)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      isSelected
                        ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-sm'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: t.colorHex }}
                    />
                    <span>{t.title}</span>
                    <span className="opacity-60 text-[10px]">({count})</span>
                  </button>
                );
              })}
            </div>

            {/* View Mode Toggle: Live Poll vs Grid Ballot */}
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl border border-neutral-200 dark:border-neutral-700">
                <button
                  onClick={() => setViewMode('poll')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                    viewMode === 'poll'
                      ? 'bg-white dark:bg-neutral-900 text-[#FA541C] shadow-xs'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
                  }`}
                  title="Live Community Poll View"
                >
                  <BarChart2 className="w-3.5 h-3.5" />
                  <span>Poll View</span>
                </button>
                <button
                  onClick={() => setViewMode('ballot')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                    viewMode === 'ballot'
                      ? 'bg-white dark:bg-neutral-900 text-[#FA541C] shadow-xs'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
                  }`}
                  title="Card Ballot View"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Ballot Grid</span>
                </button>
              </div>

              {/* My Votes Filter Toggle */}
              <button
                onClick={() => setFilterMyVotesOnly(!filterMyVotesOnly)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-2 transition-all ${
                  filterMyVotesOnly
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700'
                    : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                <span>Show My Backed ({votedQuestionsCount})</span>
              </button>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search problem statements by code, title, track, or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-900/80 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#FA541C]/50 transition-all"
            />
          </div>
        </div>

        {/* 5. POLLING / PROBLEM STATEMENTS GRID */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-neutral-400">
            <RefreshCw className="w-8 h-8 animate-spin mb-3 text-[#FA541C]" />
            <p className="text-sm">Loading problem statement poll for {hackathon?.title}...</p>
          </div>
        ) : filteredQuestions.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-[#1A1C20] rounded-3xl border border-neutral-200 dark:border-neutral-800 p-8">
            <HelpCircle className="w-12 h-12 mx-auto text-neutral-300 dark:text-neutral-700 mb-3" />
            <h4 className="font-bold text-lg mb-1">No Problem Statements Found</h4>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto">
              No challenge questions match your search or filter criteria. Try resetting your track filter.
            </p>
          </div>
        ) : (
          <div className={viewMode === 'poll' ? 'space-y-4' : 'grid grid-cols-1 md:grid-cols-2 gap-6'}>
            {filteredQuestions.map((question) => {
              const myVote = voterState.votes[question.id]?.votes || 0;
              const myCredits = voterState.votes[question.id]?.creditsSpent || 0;
              const isSubmitting = submittingVoteId === question.id;
              const pollPercent = question.pollPercentage || 0;
              const isLeading = question.rank === 1 && question.totalVotes > 0;

              // Cost calculation for next vote
              const nextVotes = myVote + 1;
              const nextCredits =
                campaign?.votingMechanism === 'QUADRATIC'
                  ? nextVotes * nextVotes
                  : nextVotes;
              const additionalCreditsNeeded = nextCredits - myCredits;
              const canAffordNext =
                voterState.remainingCredits >= additionalCreditsNeeded &&
                (campaign?.votingMechanism !== 'ONE_PERSON_ONE_VOTE' || myVote === 0);

              if (viewMode === 'poll') {
                /* ============================================================ */
                /* 📊 LIVE POLL LIST VIEW                                       */
                /* ============================================================ */
                return (
                  <div
                    key={question.id}
                    className={`bg-white dark:bg-[#1A1C20] rounded-2xl border transition-all duration-200 p-5 shadow-sm relative overflow-hidden ${
                      myVote > 0
                        ? 'border-[#FA541C] ring-2 ring-[#FA541C]/20 bg-gradient-to-r from-white via-orange-50/10 to-white dark:from-[#1A1C20] dark:via-orange-950/10 dark:to-[#1A1C20]'
                        : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
                    }`}
                  >
                    {/* Header Row: Track Badge, Code & Rank Indicator */}
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-2.5">
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                          style={{
                            backgroundColor: `${question.trackColorHex}15`,
                            color: question.trackColorHex,
                          }}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: question.trackColorHex }}
                          />
                          {question.trackTitle}
                        </span>

                        <span className="font-mono text-xs font-bold px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded text-neutral-700 dark:text-neutral-300">
                          {question.code}
                        </span>

                        {isLeading && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                            <Crown className="w-3 h-3 text-amber-600" />
                            #1 Leading Poll Option
                          </span>
                        )}
                      </div>

                      {/* Your Vote status chip */}
                      {myVote > 0 ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#FA541C]/10 text-[#FA541C] border border-[#FA541C]/30">
                          <Check className="w-3.5 h-3.5" />
                          You Voted {myVote}x ({myCredits} credits)
                        </span>
                      ) : (
                        <span className="text-xs text-neutral-400">Not voted</span>
                      )}
                    </div>

                    {/* Question Title & Description */}
                    <h3 className="text-base sm:text-lg font-bold tracking-tight text-neutral-900 dark:text-white mb-1.5">
                      {question.title}
                    </h3>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed mb-4">
                      {question.description}
                    </p>

                    {/* 📊 LIVE POLL PERCENTAGE BAR */}
                    <div className="space-y-1.5 mb-4">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                          <BarChart2 className="w-3.5 h-3.5 text-[#FA541C]" />
                          Community Poll Share
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="font-black text-sm text-[#FA541C]">
                            {pollPercent}%
                          </span>
                          <span className="text-neutral-500 font-medium text-[11px]">
                            ({question.totalVotes} Votes • {question.totalVoters} Voters)
                          </span>
                        </div>
                      </div>

                      {/* Background Bar */}
                      <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-3 overflow-hidden p-0.5">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ease-out ${
                            isLeading
                              ? 'bg-gradient-to-r from-amber-500 via-[#FA541C] to-red-500'
                              : 'bg-gradient-to-r from-[#FA541C] to-amber-500'
                          }`}
                          style={{ width: `${Math.max(pollPercent, question.totalVotes > 0 ? 5 : 0)}%` }}
                        />
                      </div>
                    </div>

                    {/* Poll Voting Action Row */}
                    <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between gap-4">
                      <div className="text-xs text-neutral-500">
                        {campaign?.votingMechanism === 'QUADRATIC' ? (
                          <span>Next vote requires <strong>+{additionalCreditsNeeded} credit{additionalCreditsNeeded > 1 ? 's' : ''}</strong></span>
                        ) : (
                          <span>1 Person, 1 Vote</span>
                        )}
                      </div>

                      {/* Stepper Buttons & 1-Click Vote Button */}
                      <div className="flex items-center gap-2">
                        {myVote > 0 && (
                          <button
                            onClick={() => handleVoteChange(question.id, -1)}
                            disabled={myVote === 0 || isSubmitting || campaign?.status !== 'ACTIVE'}
                            className="px-2.5 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-30 transition-colors text-xs font-bold"
                            title="Remove 1 vote"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          onClick={() => handleVoteChange(question.id, 1)}
                          disabled={!canAffordNext || isSubmitting || campaign?.status !== 'ACTIVE'}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                            myVote > 0
                              ? 'bg-[#FA541C] text-white hover:bg-[#e04513] shadow-sm'
                              : canAffordNext && campaign?.status === 'ACTIVE'
                              ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 shadow-sm'
                              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed opacity-50'
                          }`}
                        >
                          <Vote className="w-3.5 h-3.5" />
                          <span>
                            {myVote > 0 ? `Add Another Vote (+${additionalCreditsNeeded}c)` : 'Vote in Poll'}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }

              /* ============================================================ */
              /* 🗳️ CLASSIC BALLOT GRID VIEW                                  */
              /* ============================================================ */
              return (
                <div
                  key={question.id}
                  className={`bg-white dark:bg-[#1A1C20] rounded-2xl border transition-all duration-200 p-6 flex flex-col justify-between shadow-sm relative ${
                    myVote > 0
                      ? 'border-[#FA541C] ring-2 ring-[#FA541C]/20'
                      : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
                  }`}
                >
                  <div>
                    {/* Track Badge & Code */}
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                        style={{
                          backgroundColor: `${question.trackColorHex}15`,
                          color: question.trackColorHex,
                        }}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: question.trackColorHex }}
                        />
                        {question.trackTitle}
                      </span>

                      <span className="font-mono text-xs font-bold px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded text-neutral-700 dark:text-neutral-300">
                        {question.code}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-base sm:text-lg font-bold tracking-tight mb-2 leading-snug">
                      {question.title}
                    </h3>

                    {/* Description */}
                    <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed mb-5">
                      {question.description}
                    </p>

                    {/* Poll progress bar in card view */}
                    <div className="space-y-1 mb-4">
                      <div className="flex justify-between text-[11px] font-bold">
                        <span className="text-neutral-500">Poll Consensus:</span>
                        <span className="text-[#FA541C]">{pollPercent}% ({question.totalVotes} Votes)</span>
                      </div>
                      <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-[#FA541C] to-amber-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${pollPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Voting Controls & Status Footer */}
                  <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800/80 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-300 flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5 text-[#FA541C]" />
                        {question.totalVotes} Votes ({question.totalVoters} voters)
                      </span>

                      {/* My allocation indicator */}
                      {myVote > 0 ? (
                        <span className="font-semibold text-[#FA541C] text-xs">
                          {myVote} {myVote === 1 ? 'Vote' : 'Votes'} ({myCredits} credits)
                        </span>
                      ) : (
                        <span className="text-neutral-400 text-xs">Not backed yet</span>
                      )}
                    </div>

                    {/* Stepper Button Controls */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleVoteChange(question.id, -1)}
                        disabled={myVote === 0 || isSubmitting || campaign?.status !== 'ACTIVE'}
                        className="p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="Reduce vote count"
                      >
                        <Minus className="w-4 h-4" />
                      </button>

                      <div className="flex-1 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-center font-bold text-xs sm:text-sm">
                        {myVote > 0 ? (
                          <span className="text-[#FA541C]">
                            {myVote} {myVote === 1 ? 'Vote' : 'Votes'}
                          </span>
                        ) : (
                          <span className="text-neutral-400 font-normal">0 Votes</span>
                        )}
                      </div>

                      <button
                        onClick={() => handleVoteChange(question.id, 1)}
                        disabled={!canAffordNext || isSubmitting || campaign?.status !== 'ACTIVE'}
                        className={`p-2.5 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 ${
                          canAffordNext && campaign?.status === 'ACTIVE'
                            ? 'bg-[#FA541C] text-white hover:bg-[#e04513] shadow-sm'
                            : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed opacity-50'
                        }`}
                        title={
                          !canAffordNext
                            ? `Requires ${additionalCreditsNeeded} credits, you have ${voterState.remainingCredits}`
                            : `Add 1 vote (Costs ${additionalCreditsNeeded} credits)`
                        }
                      >
                        <Plus className="w-4 h-4" />
                        {additionalCreditsNeeded > 1 && (
                          <span className="text-[10px] font-mono pr-1">
                            +{additionalCreditsNeeded}c
                          </span>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer Summary & Navigation */}
        <div className="p-6 bg-white dark:bg-[#1A1C20] rounded-3xl border border-neutral-200 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div>
            <span className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
              Ready to build for {hackathon?.title}?
            </span>
            <p className="text-neutral-500 dark:text-neutral-400 mt-0.5">
              Check in with your team in {currentActiveRound?.name} or browse project templates.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/participant/dashboard"
              className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 font-semibold transition-colors"
            >
              Participant Dashboard
            </Link>
            <Link
              href="/projects"
              className="px-4 py-2 rounded-xl bg-[#FA541C] text-white font-semibold hover:bg-[#e04513] transition-colors flex items-center gap-1.5"
            >
              <span>Explore Projects</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
