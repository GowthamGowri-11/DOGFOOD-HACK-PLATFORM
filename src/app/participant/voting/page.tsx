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

export default function ParticipantQuestionVotingPage() {
  const [loading, setLoading] = useState(true);
  const [submittingVoteId, setSubmittingVoteId] = useState<string | null>(null);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [problemStatements, setProblemStatements] = useState<ProblemStatement[]>([]);
  const [voterState, setVoterState] = useState<VoterState>({
    userId: '',
    totalCreditsSpent: 0,
    remainingCredits: 9,
    votes: {},
  });
  const [metrics, setMetrics] = useState({
    totalVotersCount: 0,
    totalVotesCast: 0,
    isResultsHidden: true,
  });

  const [selectedTrack, setSelectedTrack] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMyVotesOnly, setFilterMyVotesOnly] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const hackathonId = 'hack_apex_2026';

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/v1/hackathons/${hackathonId}/question-voting`);
      const json = await res.json();
      if (json.success && json.data) {
        setCampaign(json.data.campaign);
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
    loadData();
  }, []);

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

      const res = await fetch(`/api/v1/hackathons/${hackathonId}/question-voting/vote`, {
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

      // Update local problemStatement count if results are visible
      if (!metrics.isResultsHidden) {
        setProblemStatements((prev) =>
          prev.map((p) =>
            p.id === psId
              ? {
                  ...p,
                  totalVotes: p.totalVotes + delta,
                  totalCredits: p.totalCredits + creditDelta,
                }
              : p
          )
        );
      }
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

  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#131417] text-neutral-900 dark:text-neutral-100 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Top Breadcrumb & Status */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#FA541C] uppercase tracking-wider mb-1">
              <Vote className="w-4 h-4" />
              <span>Participant Governance & Problem Selection</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Vote for Hackathon Problem Statements
            </h1>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
              Cast your quadratic influence on the tracks and challenge questions you want to solve during the hackathon.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
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
                ? 'Voting Window Open'
                : campaign?.status === 'PAUSED'
                ? 'Voting Paused'
                : 'Voting Concluded'}
            </span>

            <button
              onClick={loadData}
              disabled={loading}
              className="p-2 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              title="Refresh ballot"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Notification Toast */}
        {notice && (
          <div
            className={`p-4 rounded-xl flex items-center justify-between gap-3 text-sm animate-in fade-in-50 ${
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

        {/* Voting Power & Quadratic Credit Budget Card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white dark:bg-[#1A1C20] rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#FA541C]/10 to-transparent rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  Your Voter Budget
                </span>
                <h2 className="text-xl font-bold flex items-center gap-2 mt-0.5">
                  <Sparkles className="w-5 h-5 text-[#FA541C]" />
                  <span>
                    {campaign?.votingMechanism === 'QUADRATIC'
                      ? 'Quadratic Voting Power Pool'
                      : 'Standard Ballot Budget'}
                  </span>
                </h2>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-2xl font-black text-[#FA541C]">
                    {voterState.remainingCredits} / {campaign?.maxCredits || 9}
                  </div>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                    Credits Remaining
                  </div>
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
              <div className="p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200 dark:border-neutral-800">
                <div className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                  {voterState.totalCreditsSpent}
                </div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400">Credits Used</div>
              </div>
              <div className="p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200 dark:border-neutral-800">
                <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                  {voterState.remainingCredits}
                </div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400">Credits Available</div>
              </div>
              <div className="p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200 dark:border-neutral-800">
                <div className="text-lg font-bold text-[#FA541C]">{votedQuestionsCount}</div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400">Questions Backed</div>
              </div>
            </div>
          </div>

          {/* Quadratic Voting Rules Infobox */}
          <div className="bg-white dark:bg-[#1A1C20] rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-2">
                <Info className="w-4 h-4 text-[#FA541C]" />
                <span>How Quadratic Voting Protects You</span>
              </div>
              <h3 className="text-base font-bold mb-2">Quadratic Cost Formula</h3>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed mb-4">
                Casting <strong className="text-neutral-900 dark:text-neutral-200">n votes</strong> on a single challenge costs{' '}
                <strong className="text-[#FA541C]">n² credits</strong>. This stops a loud minority from dominating the hackathon, rewarding challenges that have genuine broad consensus.
              </p>

              <div className="space-y-1.5 text-xs bg-neutral-50 dark:bg-neutral-800/70 p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 font-mono">
                <div className="flex justify-between">
                  <span>1 Vote:</span>
                  <span className="font-semibold text-neutral-900 dark:text-neutral-100">1 Credit (1²)</span>
                </div>
                <div className="flex justify-between">
                  <span>2 Votes:</span>
                  <span className="font-semibold text-neutral-900 dark:text-neutral-100">4 Credits (2²)</span>
                </div>
                <div className="flex justify-between">
                  <span>3 Votes:</span>
                  <span className="font-semibold text-[#FA541C]">9 Credits (3²)</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
              <span className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-500" />
                Anti-Abuse & Ballot Shuffled
              </span>
              <span>Audit Logged</span>
            </div>
          </div>
        </div>

        {/* Track Filters and Search Bar */}
        <div className="bg-white dark:bg-[#1A1C20] rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4 sm:p-5 shadow-sm space-y-4">
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

          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search problem statements by code, title, keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-900/80 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#FA541C]/50 transition-all"
            />
          </div>
        </div>

        {/* Results Masking Notice (T3 Compliant) */}
        {metrics.isResultsHidden && (
          <div className="p-4 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center gap-3 text-xs text-neutral-600 dark:text-neutral-400">
            <Shield className="w-4 h-4 text-[#FA541C] flex-shrink-0" />
            <span>
              <strong>Blind Ballot Safeguard Active:</strong> Community vote tallies and rankings are shielded during the open window to eliminate position bias. Results will unlock publicly once the organizer concludes voting.
            </span>
          </div>
        )}

        {/* Questions Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-neutral-400">
            <RefreshCw className="w-8 h-8 animate-spin mb-3 text-[#FA541C]" />
            <p className="text-sm">Loading problem statement ballot...</p>
          </div>
        ) : filteredQuestions.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-[#1A1C20] rounded-2xl border border-neutral-200 dark:border-neutral-800 p-8">
            <HelpCircle className="w-12 h-12 mx-auto text-neutral-300 dark:text-neutral-700 mb-3" />
            <h4 className="font-bold text-lg mb-1">No Problem Statements Found</h4>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto">
              No challenge questions match your search or filter criteria. Try resetting your track filter.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredQuestions.map((question) => {
              const myVote = voterState.votes[question.id]?.votes || 0;
              const myCredits = voterState.votes[question.id]?.creditsSpent || 0;
              const isSubmitting = submittingVoteId === question.id;

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

              return (
                <div
                  key={question.id}
                  className={`bg-white dark:bg-[#1A1C20] rounded-2xl border transition-all duration-200 p-6 flex flex-col justify-between shadow-sm relative ${
                    myVote > 0
                      ? 'border-[#FA541C] ring-1 ring-[#FA541C]/30'
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
                  </div>

                  {/* Voting Controls & Status Footer */}
                  <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800/80 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      {/* Community Tally (if unmasked) or Masked Badge */}
                      {metrics.isResultsHidden ? (
                        <span className="text-[11px] text-neutral-400 flex items-center gap-1">
                          <Shield className="w-3 h-3 text-neutral-400" />
                          Live tallies shielded
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-300 flex items-center gap-1.5">
                          <TrendingUp className="w-3.5 h-3.5 text-[#FA541C]" />
                          {question.totalVotes} Votes ({question.totalVoters} voters)
                        </span>
                      )}

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
                      {/* Decrease / Remove Vote */}
                      <button
                        onClick={() => handleVoteChange(question.id, -1)}
                        disabled={myVote === 0 || isSubmitting || campaign?.status !== 'ACTIVE'}
                        className="p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="Reduce vote count"
                      >
                        <Minus className="w-4 h-4" />
                      </button>

                      {/* Vote Count Badge */}
                      <div className="flex-1 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-center font-bold text-xs sm:text-sm">
                        {myVote > 0 ? (
                          <span className="text-[#FA541C]">
                            {myVote} {myVote === 1 ? 'Vote' : 'Votes'}
                          </span>
                        ) : (
                          <span className="text-neutral-400 font-normal">0 Votes</span>
                        )}
                      </div>

                      {/* Increase Vote */}
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
        <div className="p-6 bg-white dark:bg-[#1A1C20] rounded-2xl border border-neutral-200 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div>
            <span className="font-semibold text-neutral-900 dark:text-neutral-100">
              Ready to build?
            </span>
            <p className="text-neutral-500 dark:text-neutral-400 mt-0.5">
              Check in with your team or explore project templates in the participant dashboard.
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
