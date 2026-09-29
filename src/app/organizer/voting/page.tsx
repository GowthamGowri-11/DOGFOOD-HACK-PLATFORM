'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Vote,
  Settings,
  Plus,
  Download,
  Eye,
  EyeOff,
  Shuffle,
  Shield,
  BarChart2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Award,
  Layers,
  Sparkles,
  Sliders,
  FileSpreadsheet,
  Clock,
  Users,
  ChevronRight,
  ExternalLink,
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

export default function OrganizerQuestionVotingPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [problemStatements, setProblemStatements] = useState<ProblemStatement[]>([]);
  const [metrics, setMetrics] = useState({
    totalVotersCount: 0,
    totalVotesCast: 0,
    isResultsHidden: false,
    topVotedProblem: null as ProblemStatement | null,
  });

  const [selectedTrackFilter, setSelectedTrackFilter] = useState<string>('ALL');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form states for creating new problem statement
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTrackId, setNewTrackId] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [addingProblem, setAddingProblem] = useState(false);

  const hackathonId = 'hack_apex_2026';

  const loadCampaignData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/v1/hackathons/${hackathonId}/question-voting`);
      const json = await res.json();
      if (json.success && json.data) {
        setCampaign(json.data.campaign);
        setTracks(json.data.tracks || []);
        setProblemStatements(json.data.problemStatements || []);
        if (json.data.metrics) {
          setMetrics(json.data.metrics);
        }
        if (json.data.tracks && json.data.tracks.length > 0 && !newTrackId) {
          setNewTrackId(json.data.tracks[0].id);
        }
      }
    } catch (err: any) {
      console.error('Failed to load campaign data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCampaignData();
  }, []);

  const handleUpdateCampaign = async (updates: Partial<Campaign>) => {
    if (!campaign) return;
    try {
      setSaving(true);
      const res = await fetch(`/api/v1/hackathons/${hackathonId}/question-voting/manage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || 'Failed to update campaign settings');
      }
      setCampaign(json.data);
      setToast({ type: 'success', message: 'Voting settings updated successfully!' });
      loadCampaignData();
    } catch (err: any) {
      setToast({ type: 'error', message: err.message || 'Error updating settings' });
    } finally {
      setSaving(false);
    }
  };

  const handleCreateProblemStatement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTrackId || !newCode || !newTitle || !newDescription) {
      setToast({ type: 'error', message: 'Please complete all required fields.' });
      return;
    }

    try {
      setAddingProblem(true);
      const res = await fetch(
        `/api/v1/hackathons/${hackathonId}/question-voting/problem-statements`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            trackId: newTrackId,
            code: newCode,
            title: newTitle,
            description: newDescription,
          }),
        }
      );
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || 'Failed to create challenge question');
      }

      setToast({ type: 'success', message: `Challenge ${newCode} added to voting ballot!` });
      setShowAddModal(false);
      setNewCode('');
      setNewTitle('');
      setNewDescription('');
      loadCampaignData();
    } catch (err: any) {
      setToast({ type: 'error', message: err.message || 'Error adding problem statement' });
    } finally {
      setAddingProblem(false);
    }
  };

  const handleExportCsv = () => {
    window.open(`/api/v1/hackathons/${hackathonId}/question-voting/export`, '_blank');
  };

  const filteredProblems = problemStatements.filter(
    (p) => selectedTrackFilter === 'ALL' || p.trackId === selectedTrackFilter
  );

  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#131417] text-neutral-900 dark:text-neutral-100 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header and Quick Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#FA541C] uppercase tracking-wider mb-1">
              <Vote className="w-4 h-4" />
              <span>Organizer Governance Hub</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Track & Problem Statement Voting
            </h1>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
              Configure quadratic voting campaigns, manage challenge questions, and inspect live community tallies.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/participant/voting"
              target="_blank"
              className="px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <span>Preview Participant Ballot</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>

            <button
              onClick={handleExportCsv}
              className="px-3.5 py-2 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:opacity-90 text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Results (CSV)</span>
            </button>

            <button
              onClick={() => setShowAddModal(true)}
              className="px-3.5 py-2 rounded-xl bg-[#FA541C] text-white hover:bg-[#e04513] text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Challenge Question</span>
            </button>
          </div>
        </div>

        {/* Toast Alert */}
        {toast && (
          <div
            className={`p-4 rounded-xl flex items-center justify-between gap-3 text-sm animate-in fade-in-50 ${
              toast.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800'
                : 'bg-red-50 dark:bg-red-950/50 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800'
            }`}
          >
            <div className="flex items-center gap-2">
              {toast.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600 dark:text-red-400" />
              )}
              <span>{toast.message}</span>
            </div>
            <button
              onClick={() => setToast(null)}
              className="text-xs font-semibold underline hover:opacity-75"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Metrics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white dark:bg-[#1A1C20] rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                Participation
              </span>
              <Users className="w-4 h-4 text-[#FA541C]" />
            </div>
            <div className="text-2xl font-black">{metrics.totalVotersCount}</div>
            <div className="text-xs text-neutral-500 mt-1">Unique Participants Voted</div>
          </div>

          <div className="bg-white dark:bg-[#1A1C20] rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                Total Influence Cast
              </span>
              <Vote className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-black">{metrics.totalVotesCast}</div>
            <div className="text-xs text-neutral-500 mt-1">Total Votes Allocated</div>
          </div>

          <div className="bg-white dark:bg-[#1A1C20] rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                Active Mechanism
              </span>
              <Sparkles className="w-4 h-4 text-purple-500" />
            </div>
            <div className="text-lg font-black truncate">
              {campaign?.votingMechanism === 'QUADRATIC' ? 'Quadratic Voting' : '1 Person 1 Vote'}
            </div>
            <div className="text-xs text-neutral-500 mt-1">
              Budget: {campaign?.maxCredits || 9} credits/voter
            </div>
          </div>

          <div className="bg-white dark:bg-[#1A1C20] rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                Leading Challenge
              </span>
              <Award className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-lg font-black truncate">
              {problemStatements[0]?.code || 'N/A'}
            </div>
            <div className="text-xs text-neutral-500 mt-1 truncate">
              {problemStatements[0]?.title || 'No votes yet'}
            </div>
          </div>
        </div>

        {/* Campaign Control Center */}
        <div className="bg-white dark:bg-[#1A1C20] rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 shadow-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-100 dark:border-neutral-800 pb-4">
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Settings className="w-5 h-5 text-[#FA541C]" />
                <span>Voting Session Configuration</span>
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                Customize ballot rules, anti-abuse parameters, and privacy settings.
              </p>
            </div>

            {/* Campaign Status Toggle */}
            <div className="flex items-center gap-2 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl">
              {(['ACTIVE', 'PAUSED', 'CLOSED'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => handleUpdateCampaign({ status })}
                  disabled={saving}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    campaign?.status === status
                      ? status === 'ACTIVE'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : status === 'PAUSED'
                        ? 'bg-amber-600 text-white shadow-sm'
                        : 'bg-neutral-800 text-white dark:bg-neutral-600 shadow-sm'
                      : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Configuration Options Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Voting Mechanism */}
            <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-500 block">
                Voting Calculation Mechanism
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-2.5 text-xs font-semibold cursor-pointer">
                  <input
                    type="radio"
                    name="mechanism"
                    checked={campaign?.votingMechanism === 'QUADRATIC'}
                    onChange={() => handleUpdateCampaign({ votingMechanism: 'QUADRATIC' })}
                    className="text-[#FA541C] focus:ring-[#FA541C]"
                  />
                  <span>Quadratic Voting (n² Cost)</span>
                </label>
                <label className="flex items-center gap-2.5 text-xs font-semibold cursor-pointer">
                  <input
                    type="radio"
                    name="mechanism"
                    checked={campaign?.votingMechanism === 'ONE_PERSON_ONE_VOTE'}
                    onChange={() =>
                      handleUpdateCampaign({ votingMechanism: 'ONE_PERSON_ONE_VOTE' })
                    }
                    className="text-[#FA541C] focus:ring-[#FA541C]"
                  />
                  <span>One-Person-One-Vote (Standard)</span>
                </label>
              </div>
              <p className="text-[11px] text-neutral-400">
                Quadratic stops minority capture by pricing excessive single-problem votes exponentially.
              </p>
            </div>

            {/* Voter Credit Budget */}
            <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                  Credit Budget Per Voter
                </label>
                <span className="font-bold text-xs text-[#FA541C]">
                  {campaign?.maxCredits || 9} Credits
                </span>
              </div>
              <div className="flex items-center gap-2">
                {[4, 9, 16, 25].map((credits) => (
                  <button
                    key={credits}
                    onClick={() => handleUpdateCampaign({ maxCredits: credits })}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                      campaign?.maxCredits === credits
                        ? 'bg-[#FA541C] text-white border-[#FA541C]'
                        : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                    }`}
                  >
                    {credits}c
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-neutral-400">
                9 credits allow up to 3 votes on one challenge (3² = 9), or 9 single votes.
              </p>
            </div>

            {/* Safeguards & Anti-Bias (T3 Rubric Compliance) */}
            <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-500 block">
                T3 Anti-Bias Safeguards
              </label>
              <div className="space-y-2">
                <label className="flex items-center justify-between text-xs font-semibold cursor-pointer">
                  <span className="flex items-center gap-1.5">
                    {campaign?.hideResultsUntilClosed ? (
                      <EyeOff className="w-3.5 h-3.5 text-amber-500" />
                    ) : (
                      <Eye className="w-3.5 h-3.5 text-neutral-400" />
                    )}
                    <span>Blind Ballot (Shield Live Tallies)</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={campaign?.hideResultsUntilClosed ?? true}
                    onChange={(e) =>
                      handleUpdateCampaign({ hideResultsUntilClosed: e.target.checked })
                    }
                    className="rounded text-[#FA541C] focus:ring-[#FA541C]"
                  />
                </label>

                <label className="flex items-center justify-between text-xs font-semibold cursor-pointer">
                  <span className="flex items-center gap-1.5">
                    <Shuffle className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Randomized Ballot Order</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={campaign?.randomizeOrder ?? true}
                    onChange={(e) => handleUpdateCampaign({ randomizeOrder: e.target.checked })}
                    className="rounded text-[#FA541C] focus:ring-[#FA541C]"
                  />
                </label>
              </div>
              <p className="text-[11px] text-neutral-400">
                Eliminates position bias and bandwagon voting during open ballots.
              </p>
            </div>
          </div>
        </div>

        {/* Live Leaderboard & Problem Statements Breakdown */}
        <div className="bg-white dark:bg-[#1A1C20] rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 shadow-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-[#FA541C]" />
                <span>Live Problem Statement Vote Tallies</span>
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                Organizers have continuous real-time visibility into all track and problem votes.
              </p>
            </div>

            {/* Track Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setSelectedTrackFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  selectedTrackFilter === 'ALL'
                    ? 'bg-[#FA541C] text-white shadow-sm'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200'
                }`}
              >
                All Tracks ({problemStatements.length})
              </button>
              {tracks.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTrackFilter(t.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    selectedTrackFilter === t.id
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-sm'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: t.colorHex }}
                  />
                  <span>{t.title}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Problem Statements Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-3">Rank</th>
                  <th className="py-3 px-3">Code</th>
                  <th className="py-3 px-3">Challenge Question</th>
                  <th className="py-3 px-3">Track</th>
                  <th className="py-3 px-3 text-center">Votes</th>
                  <th className="py-3 px-3 text-center">Quadratic Credits</th>
                  <th className="py-3 px-3 text-center">Unique Voters</th>
                  <th className="py-3 px-3 text-right">Influence Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60">
                {filteredProblems.map((ps, idx) => {
                  const sharePct =
                    metrics.totalVotesCast > 0
                      ? Math.round((ps.totalVotes / metrics.totalVotesCast) * 100)
                      : 0;

                  return (
                    <tr
                      key={ps.id}
                      className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-3 font-bold">
                        <span
                          className={`w-6 h-6 rounded-full inline-flex items-center justify-center text-[11px] ${
                            idx === 0
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : idx === 1
                              ? 'bg-neutral-200 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-200'
                              : idx === 2
                              ? 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300'
                              : 'text-neutral-400'
                          }`}
                        >
                          {idx + 1}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 font-mono font-bold text-neutral-800 dark:text-neutral-200">
                        {ps.code}
                      </td>

                      <td className="py-3.5 px-3 max-w-md">
                        <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                          {ps.title}
                        </div>
                        <div className="text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-1 mt-0.5">
                          {ps.description}
                        </div>
                      </td>

                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span
                          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold"
                          style={{
                            backgroundColor: `${ps.trackColorHex}15`,
                            color: ps.trackColorHex,
                          }}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: ps.trackColorHex }}
                          />
                          {ps.trackTitle}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-center font-bold text-sm text-[#FA541C]">
                        {ps.totalVotes}
                      </td>

                      <td className="py-3.5 px-3 text-center font-mono text-xs text-neutral-600 dark:text-neutral-300">
                        {ps.totalCredits}c
                      </td>

                      <td className="py-3.5 px-3 text-center text-xs text-neutral-600 dark:text-neutral-300">
                        {ps.totalVoters}
                      </td>

                      <td className="py-3.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 bg-neutral-100 dark:bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-[#FA541C] h-full rounded-full"
                              style={{ width: `${sharePct}%` }}
                            />
                          </div>
                          <span className="font-mono text-[11px] text-neutral-500 w-8 text-right">
                            {sharePct}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Problem Statement Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in-50">
          <div className="bg-white dark:bg-[#1A1C20] rounded-2xl border border-neutral-200 dark:border-neutral-800 max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#FA541C]" />
                <span>Add Challenge Question to Track</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateProblemStatement} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 block mb-1">
                  Select Hackathon Track
                </label>
                <select
                  value={newTrackId}
                  onChange={(e) => setNewTrackId(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#FA541C]"
                >
                  {tracks.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 block mb-1">
                  Problem Code (e.g. AI-04, FT-03)
                </label>
                <input
                  type="text"
                  placeholder="AI-04"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs sm:text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-[#FA541C]"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 block mb-1">
                  Challenge Title
                </label>
                <input
                  type="text"
                  placeholder="Autonomous Zero-Knowledge Validator Swarm"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#FA541C]"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 block mb-1">
                  Challenge Description & Technical Scope
                </label>
                <textarea
                  rows={4}
                  placeholder="Describe the problem, objectives, and acceptance criteria for participants..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#FA541C]"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 text-xs font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingProblem}
                  className="px-4 py-2 rounded-xl bg-[#FA541C] text-white text-xs font-semibold hover:bg-[#e04513] transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  {addingProblem ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Plus className="w-3.5 h-3.5" />
                  )}
                  <span>Publish Challenge</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
