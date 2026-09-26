'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Scale,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Users,
  Layers,
  Sparkles,
  BarChart3,
  RefreshCw,
  Award,
  AlertCircle,
  Sliders,
  Cpu,
} from 'lucide-react';

interface JudgingOverview {
  summary: {
    totalProjects: number;
    assignedProjectsCount: number;
    unassignedProjectsCount: number;
    totalJudges: number;
    activeJudges: number;
    totalAssignments: number;
    completedEvaluations: number;
    pendingEvaluations: number;
    completionRate: number;
  };
  judgeWorkloads: {
    judgeId: string;
    judgeName: string;
    email: string;
    isActive: boolean;
    maxWorkload: number;
    assignedCount: number;
    completedCount: number;
    pendingCount: number;
    progressPercentage: number;
  }[];
  activeRubric?: {
    id: string;
    name: string;
    version: number;
    criteriaCount: number;
  } | null;
  normalizationRuns: any[];
}

export default function OrganizerJudgingDashboard() {
  const [hackathons, setHackathons] = useState<any[]>([]);
  const [selectedHackathonId, setSelectedHackathonId] = useState<string>('');
  const [data, setData] = useState<JudgingOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Auto-Assign configuration
  const [judgesPerProject, setJudgesPerProject] = useState(2);
  const [normalizationMethod, setNormalizationMethod] = useState<'Z_SCORE' | 'MIN_MAX'>('Z_SCORE');

  // AI Comparison metrics
  const [comparisonMetrics, setComparisonMetrics] = useState<any | null>(null);

  // Fetch organizer hackathons
  useEffect(() => {
    async function loadHackathons() {
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
    loadHackathons();
  }, []);

  // Fetch judging stats for selected hackathon
  const loadJudgingStats = async (hackathonId: string) => {
    if (!hackathonId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/v1/hackathons/${hackathonId}/judging`);
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || 'Failed to fetch judging overview.');
      }
      setData(json.data);

      // Also try fetching AI comparison metrics if available
      const compRes = await fetch(`/api/v1/ai-comparison?hackathonId=${hackathonId}`);
      if (compRes.ok) {
        const compJson = await compRes.json();
        setComparisonMetrics(compJson.data?.metrics || null);
      }
    } catch (err: any) {
      setError(err.message || 'Error loading judging stats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedHackathonId) {
      loadJudgingStats(selectedHackathonId);
    }
  }, [selectedHackathonId]);

  // Handle Generate Assignments
  const handleGenerateAssignments = async () => {
    if (!selectedHackathonId) return;
    try {
      setActionLoading(true);
      setError(null);
      setSuccessMsg(null);

      const res = await fetch(`/api/v1/hackathons/${selectedHackathonId}/assignments/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          judgesPerProject,
          prioritizeTrackExpertise: true,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || 'Failed to generate assignments.');
      }

      setSuccessMsg(json.message || 'Assignments generated successfully.');
      loadJudgingStats(selectedHackathonId);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Compute Normalization
  const handleComputeNormalization = async () => {
    if (!selectedHackathonId) return;
    try {
      setActionLoading(true);
      setError(null);
      setSuccessMsg(null);

      const res = await fetch('/api/v1/normalization/compute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hackathonId: selectedHackathonId,
          method: normalizationMethod,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || 'Failed to compute normalization.');
      }

      setSuccessMsg(
        `Normalized scores and rankings generated successfully using ${normalizationMethod} method.`
      );
      loadJudgingStats(selectedHackathonId);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Trigger AI Jury Run
  const handleTriggerAIJury = async () => {
    if (!selectedHackathonId) return;
    try {
      setActionLoading(true);
      setError(null);
      setSuccessMsg(null);

      const res = await fetch(`/api/v1/hackathons/${selectedHackathonId}/ai-jury/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || 'Failed to trigger AI Jury evaluation.');
      }

      setSuccessMsg(
        `Autonomous AI Jury evaluation completed for ${json.data?.evaluatedProjects?.length || 0} projects with evidence extraction.`
      );
      loadJudgingStats(selectedHackathonId);
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
              Organizer Judging & Scoring Hub
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              COI Protection Engine Active
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            Judging, Scoring & AI Consensus
          </h1>
          <p className="text-slate-500 text-sm">
            Orchestrate judge workloads, execute deterministic score normalizations, and evaluate independent AI Jury benchmarks.
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

      {loading && (
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
          <p className="text-sm text-slate-500 font-medium mt-3">Loading judging metrics...</p>
        </div>
      )}

      {!loading && data && (
        <>
          {/* Metrics Overview Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider">Submitted Projects</span>
                <Layers className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-2xl font-black text-slate-900">{data.summary.totalProjects}</div>
              <div className="text-xs text-slate-500">
                {data.summary.unassignedProjectsCount} unassigned
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider">Active Judges</span>
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-black text-slate-900">{data.summary.activeJudges}</div>
              <div className="text-xs text-slate-500">
                {data.summary.totalAssignments} total assignments
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider">Completed Evals</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-slate-900">{data.summary.completedEvaluations}</div>
              <div className="text-xs text-slate-500">
                {data.summary.pendingEvaluations} pending review
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider">Progress Rate</span>
                <BarChart3 className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-2xl font-black text-purple-600">{data.summary.completionRate}%</div>
              <div className="text-xs text-slate-500">of total assignments locked</div>
            </div>
          </div>

          {/* Action Hub: Assignment Generation & Normalization & AI Jury */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 1. Assignment Engine Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-purple-600" />
                <h2 className="text-base font-bold text-slate-900">Assignment Engine</h2>
              </div>
              <p className="text-xs text-slate-500">
                Balanced greedy allocation with track expertise prioritization & Conflict-of-Interest (COI) exclusion.
              </p>

              <div className="space-y-3 pt-2">
                <div>
                  <label className="text-xs font-semibold text-slate-700">Judges per Project</label>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={judgesPerProject}
                    onChange={(e) => setJudgesPerProject(parseInt(e.target.value) || 2)}
                    className="mt-1 w-full px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
                  />
                </div>

                <button
                  onClick={handleGenerateAssignments}
                  disabled={actionLoading}
                  className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors flex items-center justify-center disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${actionLoading ? 'animate-spin' : ''}`} />
                  Generate Assignments
                </button>
              </div>
            </div>

            {/* 2. Normalization Engine Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center space-x-2">
                <Sliders className="w-5 h-5 text-blue-600" />
                <h2 className="text-base font-bold text-slate-900">Score Normalization</h2>
              </div>
              <p className="text-xs text-slate-500">
                Calibrates lenient vs harsh judge scoring curves and computes final leaderboard rankings.
              </p>

              <div className="space-y-3 pt-2">
                <div>
                  <label className="text-xs font-semibold text-slate-700">Normalization Method</label>
                  <select
                    value={normalizationMethod}
                    onChange={(e: any) => setNormalizationMethod(e.target.value)}
                    className="mt-1 w-full px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 bg-white"
                  >
                    <option value="Z_SCORE">Z-Score Normalization (Standard)</option>
                    <option value="MIN_MAX">Min-Max Scaling</option>
                  </select>
                </div>

                <button
                  onClick={handleComputeNormalization}
                  disabled={actionLoading || data.summary.completedEvaluations === 0}
                  className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors flex items-center justify-center disabled:opacity-50"
                >
                  <Award className="w-3.5 h-3.5 mr-1.5" />
                  Compute Normalized Ranks
                </button>
              </div>
            </div>

            {/* 3. Autonomous AI Jury Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center space-x-2">
                <Cpu className="w-5 h-5 text-emerald-600" />
                <h2 className="text-base font-bold text-slate-900">Autonomous AI Jury</h2>
              </div>
              <p className="text-xs text-slate-500">
                Executes evidence-grounded evaluation across locked code repositories, demo URLs, and rubric criteria.
              </p>

              <div className="space-y-3 pt-2">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex justify-between">
                  <span>Model Version: <strong>v1.4</strong></span>
                  <span>Prompt: <strong>v3</strong></span>
                </div>

                <button
                  onClick={handleTriggerAIJury}
                  disabled={actionLoading || data.summary.totalProjects === 0}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors flex items-center justify-center disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                  Run AI Jury Evaluation
                </button>
              </div>
            </div>
          </div>

          {/* AI vs Human Consensus Metrics (If available) */}
          {comparisonMetrics && comparisonMetrics.totalComparisons > 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  <h2 className="text-base font-bold text-slate-900">
                    AI Jury vs Human Judge Consensus Metrics
                  </h2>
                </div>
                <span className="text-xs text-slate-400">
                  {comparisonMetrics.totalComparisons} criterion comparison pairs
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-xs text-slate-400 font-medium">Agreement Rate</div>
                  <div className="text-xl font-black text-emerald-600">
                    {comparisonMetrics.agreementRate}%
                  </div>
                  <div className="text-[10px] text-slate-400">within ±10% tolerance</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-xs text-slate-400 font-medium">Mean Absolute Error (MAE)</div>
                  <div className="text-xl font-black text-purple-600">{comparisonMetrics.mae}</div>
                  <div className="text-[10px] text-slate-400">points deviation</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-xs text-slate-400 font-medium">Root Mean Squared Error (RMSE)</div>
                  <div className="text-xl font-black text-slate-900">{comparisonMetrics.rmse}</div>
                  <div className="text-[10px] text-slate-400">variance penalty</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-xs text-slate-400 font-medium">Pearson Correlation</div>
                  <div className="text-xl font-black text-blue-600">{comparisonMetrics.correlation}</div>
                  <div className="text-[10px] text-slate-400">scale -1.0 to 1.0</div>
                </div>
              </div>
            </div>
          )}

          {/* Judge Workload Distribution Table */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900">Judge Workload Distribution</h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Judge Name</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Assigned</th>
                    <th className="py-3 px-4">Completed</th>
                    <th className="py-3 px-4">Pending</th>
                    <th className="py-3 px-4">Progress</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.judgeWorkloads.map((jw) => (
                    <tr key={jw.judgeId} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {jw.judgeName}
                        <div className="text-[10px] font-normal text-slate-400">{jw.email}</div>
                      </td>
                      <td className="py-3 px-4">
                        {jw.isActive ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Active
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500">
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-700">{jw.assignedCount}</td>
                      <td className="py-3 px-4 font-semibold text-emerald-600">{jw.completedCount}</td>
                      <td className="py-3 px-4 font-semibold text-amber-600">{jw.pendingCount}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-20 bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-purple-600 h-2 rounded-full"
                              style={{ width: `${jw.progressPercentage}%` }}
                            />
                          </div>
                          <span className="font-bold text-slate-600">{jw.progressPercentage}%</span>
                        </div>
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
  );
}
