'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Trophy,
  Award,
  Medal,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Send,
  ShieldCheck,
  Eye,
  Sliders,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

interface ResultItem {
  id: string;
  projectId: string;
  projectTitle: string;
  projectSlug: string;
  teamName: string;
  trackTitle: string;
  rawAverageScore: number;
  normalizedScore: number;
  finalScore: number;
  rank: number;
  awardCategory?: string | null;
  isWinner: boolean;
  isPublished: boolean;
}

interface VerificationReport {
  isVerified: boolean;
  totalProjects: number;
  rankedProjectsCount: number;
  hasNaNOrInfinity: boolean;
  duplicateRanks: number[];
  unassignedPrizesCount: number;
  anomalies: string[];
}

export default function OrganizerResultsPage() {
  const [hackathons, setHackathons] = useState<any[]>([]);
  const [selectedHackathonId, setSelectedHackathonId] = useState<string>('');
  const [results, setResults] = useState<ResultItem[]>([]);
  const [isPublished, setIsPublished] = useState(false);
  const [normalizationMethod, setNormalizationMethod] = useState<'Z_SCORE' | 'MIN_MAX'>('Z_SCORE');

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [verificationReport, setVerificationReport] = useState<VerificationReport | null>(null);

  // Load Hackathons
  useEffect(() => {
    async function fetchHackathons() {
      try {
        const res = await fetch('/api/v1/hackathons');
        const json = await res.json();
        if (json.data?.hackathons && json.data.hackathons.length > 0) {
          setHackathons(json.data.hackathons);
          setSelectedHackathonId(json.data.hackathons[0].id);
        }
      } catch (err) {
        console.error(err);
      }
    }
    fetchHackathons();
  }, []);

  // Load Results for selected hackathon
  const loadResults = async (hackathonId: string) => {
    if (!hackathonId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/v1/hackathons/${hackathonId}/results`);
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.message || 'Failed to load results.');
      }

      setIsPublished(json.data?.isPublished || false);
      const rawResults = json.data?.results || [];
      const formatted: ResultItem[] = rawResults.map((r: any) => ({
        id: r.id,
        projectId: r.projectId,
        projectTitle: r.project?.title || 'Untitled Project',
        projectSlug: r.project?.slug || '',
        teamName: r.project?.team?.name || 'Unknown Team',
        trackTitle: r.project?.track?.title || 'General',
        rawAverageScore: r.rawAverageScore,
        normalizedScore: r.normalizedScore,
        finalScore: r.finalScore,
        rank: r.rank,
        awardCategory: r.awardCategory,
        isWinner: r.isWinner,
        isPublished: r.isPublished,
      }));

      setResults(formatted);
    } catch (err: any) {
      setError(err.message || 'Error loading results');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedHackathonId) {
      loadResults(selectedHackathonId);
      setVerificationReport(null);
    }
  }, [selectedHackathonId]);

  // Handle Generate Results
  const handleGenerateResults = async (force = false) => {
    if (!selectedHackathonId) return;
    try {
      setActionLoading(true);
      setError(null);
      setSuccessMsg(null);

      const res = await fetch(`/api/v1/hackathons/${selectedHackathonId}/results/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: normalizationMethod,
          forceRegenerate: force,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || 'Failed to generate results.');
      }

      setSuccessMsg(json.message || 'Results generated and ranked successfully.');
      loadResults(selectedHackathonId);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Verify Results
  const handleVerifyResults = async () => {
    if (!selectedHackathonId) return;
    try {
      setActionLoading(true);
      setError(null);
      setSuccessMsg(null);

      const res = await fetch(`/api/v1/hackathons/${selectedHackathonId}/results/verify`, {
        method: 'POST',
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || 'Verification failed.');
      }

      setVerificationReport(json.data?.verificationReport || null);
      setSuccessMsg(json.message);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Publish Results
  const handlePublishResults = async () => {
    if (!selectedHackathonId) return;
    if (
      !confirm(
        'Are you sure you want to officially publish the results? Once published, the leaderboard will be publicly visible to all participants and visitors.'
      )
    ) {
      return;
    }

    try {
      setActionLoading(true);
      setError(null);
      setSuccessMsg(null);

      const res = await fetch(`/api/v1/hackathons/${selectedHackathonId}/results/publish`, {
        method: 'POST',
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || 'Failed to publish results.');
      }

      setSuccessMsg('Official results and leaderboard published successfully!');
      setIsPublished(true);
      loadResults(selectedHackathonId);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
              Results & Leaderboard Engine
            </span>
            {isPublished ? (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" /> Published Publicly
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                Internal Draft (Unpublished)
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            Final Results & Publication
          </h1>
          <p className="text-slate-500 text-sm">
            Generate normalized rankings, verify mathematical integrity, assign awards, and publish the official public leaderboard.
          </p>
        </div>

        {/* Hackathon Selector */}
        {hackathons.length > 0 && (
          <div className="flex items-center space-x-3">
            <label className="text-xs font-bold text-slate-600">Hackathon:</label>
            <select
              value={selectedHackathonId}
              onChange={(e) => setSelectedHackathonId(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
            >
              {hackathons.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.title}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-sm flex items-center">
          <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-600 flex-shrink-0" />
          {successMsg}
        </div>
      )}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-xl text-sm flex items-center">
          <AlertCircle className="w-4 h-4 mr-2 text-rose-600 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Action Toolbar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
        <div className="flex items-center space-x-3">
          <label className="text-xs font-bold text-slate-700">Normalization:</label>
          <select
            value={normalizationMethod}
            onChange={(e: any) => setNormalizationMethod(e.target.value)}
            disabled={isPublished}
            className="px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 bg-white disabled:bg-slate-100"
          >
            <option value="Z_SCORE">Z-Score Normalization (Standard)</option>
            <option value="MIN_MAX">Min-Max Scaling</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => handleGenerateResults(false)}
            disabled={actionLoading || isPublished}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors flex items-center disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${actionLoading ? 'animate-spin' : ''}`} />
            Generate Results
          </button>

          <button
            onClick={handleVerifyResults}
            disabled={actionLoading || results.length === 0}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold shadow-sm transition-colors flex items-center disabled:opacity-50"
          >
            <ShieldCheck className="w-3.5 h-3.5 mr-1.5 text-purple-600" />
            Verify Integrity
          </button>

          {!isPublished ? (
            <button
              onClick={handlePublishResults}
              disabled={actionLoading || results.length === 0}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-200 transition-colors flex items-center disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5 mr-1.5" />
              Publish Official Results
            </button>
          ) : (
            <Link
              href="/leaderboard"
              target="_blank"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors flex items-center"
            >
              <Eye className="w-3.5 h-3.5 mr-1.5" />
              View Public Leaderboard
            </Link>
          )}
        </div>
      </div>

      {/* Verification Report Card (if executed) */}
      {verificationReport && (
        <div className={`border rounded-2xl p-6 shadow-sm space-y-4 ${
          verificationReport.isVerified ? 'bg-emerald-50/60 border-emerald-200' : 'bg-amber-50/60 border-amber-200'
        }`}>
          <div className="flex items-center space-x-2">
            {verificationReport.isVerified ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-600" />
            )}
            <h2 className="text-base font-bold text-slate-900">
              Result Integrity Verification Report
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="bg-white p-3 rounded-xl border border-slate-200">
              <span className="text-slate-400">Total Projects:</span>
              <div className="font-bold text-slate-900 mt-0.5">{verificationReport.totalProjects}</div>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200">
              <span className="text-slate-400">Ranked Results:</span>
              <div className="font-bold text-slate-900 mt-0.5">{verificationReport.rankedProjectsCount}</div>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200">
              <span className="text-slate-400">NaN / Infinity Errors:</span>
              <div className="font-bold text-slate-900 mt-0.5">
                {verificationReport.hasNaNOrInfinity ? 'Yes (Error)' : 'None (Clean)'}
              </div>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200">
              <span className="text-slate-400">Duplicate Ranks:</span>
              <div className="font-bold text-slate-900 mt-0.5">
                {verificationReport.duplicateRanks.length > 0
                  ? verificationReport.duplicateRanks.join(', ')
                  : 'None (Clean)'}
              </div>
            </div>
          </div>

          {verificationReport.anomalies.length > 0 && (
            <div className="space-y-1 text-xs text-amber-800">
              <div className="font-bold">Flagged Anomalies:</div>
              <ul className="list-disc list-inside space-y-0.5">
                {verificationReport.anomalies.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Results Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm space-y-4">
        <div className="p-6 pb-0 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-900">
            Official Standings ({results.length} Ranked Projects)
          </h2>
          <span className="text-xs text-slate-400">
            Sorted descending by Final Score
          </span>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
            <p className="text-xs text-slate-500 font-medium mt-3">Loading results...</p>
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-16 space-y-2">
            <Trophy className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700">No Results Generated Yet</h3>
            <p className="text-xs text-slate-400">
              Click &quot;Generate Results&quot; above to compute normalized scores and rankings from completed judging evaluations.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-6 text-center w-16">Rank</th>
                  <th className="py-3.5 px-6">Project & Team</th>
                  <th className="py-3.5 px-6">Track</th>
                  <th className="py-3.5 px-6 text-right">Raw Avg</th>
                  <th className="py-3.5 px-6 text-right">Normalized</th>
                  <th className="py-3.5 px-6 text-right">Final Score</th>
                  <th className="py-3.5 px-6 text-right">Award Category</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {results.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 px-6 text-center font-bold">
                      {r.rank === 1 && (
                        <div className="w-7 h-7 rounded-full bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto shadow-sm">
                          <Trophy className="w-3.5 h-3.5" />
                        </div>
                      )}
                      {r.rank === 2 && (
                        <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 border border-slate-200 flex items-center justify-center mx-auto shadow-sm">
                          <Medal className="w-3.5 h-3.5" />
                        </div>
                      )}
                      {r.rank === 3 && (
                        <div className="w-7 h-7 rounded-full bg-amber-700/10 text-amber-800 border border-amber-300 flex items-center justify-center mx-auto shadow-sm">
                          <Medal className="w-3.5 h-3.5" />
                        </div>
                      )}
                      {r.rank > 3 && <span className="text-slate-500 font-medium">#{r.rank}</span>}
                    </td>

                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-900">{r.projectTitle}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">Team: {r.teamName}</div>
                    </td>

                    <td className="py-4 px-6">
                      <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200/60 font-semibold">
                        {r.trackTitle}
                      </span>
                    </td>

                    <td className="py-4 px-6 text-right font-mono text-slate-600 font-medium">
                      {r.rawAverageScore.toFixed(1)}
                    </td>

                    <td className="py-4 px-6 text-right font-mono text-purple-600 font-bold">
                      {r.normalizedScore.toFixed(1)}
                    </td>

                    <td className="py-4 px-6 text-right font-mono text-slate-900 font-black text-sm">
                      {r.finalScore.toFixed(1)}
                    </td>

                    <td className="py-4 px-6 text-right">
                      {r.awardCategory ? (
                        <span className="inline-flex items-center text-[11px] font-bold px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <Award className="w-3 h-3 mr-1 text-emerald-600" />
                          {r.awardCategory}
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
