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
  ArrowRight,
  TrendingUp,
  Activity,
  ChevronRight,
  Zap,
  FileCheck,
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
    <div className="space-y-6 max-w-7xl mx-auto font-sans select-none pb-12">
      
      {/* In-page Breadcrumb Bar */}
      <nav className="flex items-center space-x-2 text-xs text-slate-500 font-medium">
        <Link href="/" className="hover:text-blue-600 transition-colors">
          Home
        </Link>
        <span className="text-slate-400">&rsaquo;</span>
        <Link href="/organizer/dashboard" className="hover:text-blue-600 transition-colors">
          Organizer
        </Link>
        <span className="text-slate-400">&rsaquo;</span>
        <span className="text-slate-900 font-semibold">Judging &amp; Scoring Hub</span>
      </nav>

      {/* Top Status Badges */}
      <div className="flex flex-wrap items-center gap-2.5">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#EFF6FF] text-[#2563EB] border border-[#DBEAFE]">
          <Scale className="w-3.5 h-3.5 text-[#2563EB]" />
          Judging &amp; Scoring Operations
        </span>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">
          <ShieldCheck className="w-3.5 h-3.5 text-[#059669]" />
          COI Protection Guard Active
        </span>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#FAF5FF] text-[#9333EA] border border-[#E9D5FF]">
          <Sparkles className="w-3.5 h-3.5 text-[#9333EA]" />
          AI Jury Consensus
        </span>
      </div>

      {/* Header Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#0F172A] tracking-tight">
            Judging, Scoring &amp; Normalization Hub
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-normal max-w-2xl">
            Orchestrate balanced judge workloads, execute deterministic score normalizations, and benchmark peer ratings against autonomous AI jury models.
          </p>
        </div>

        {/* Hackathon Selector */}
        {hackathons.length > 0 && (
          <div className="flex items-center space-x-2 self-start lg:self-center">
            <span className="text-xs font-medium text-slate-500">Hackathon:</span>
            <div className="flex items-center gap-2 bg-white border border-slate-200/90 rounded-2xl px-4 py-2.5 shadow-xs">
              <Award className="w-4 h-4 text-[#EA580C] flex-shrink-0" />
              <select
                value={selectedHackathonId}
                onChange={(e) => setSelectedHackathonId(e.target.value)}
                aria-label="Select Hackathon"
                className="bg-transparent border-none text-xs font-bold text-slate-900 focus:outline-none cursor-pointer pr-2 max-w-[260px] truncate"
              >
                {hackathons.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl text-xs font-medium flex items-center shadow-xs">
          <CheckCircle2 className="w-4 h-4 mr-2.5 text-emerald-600 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-2xl text-xs font-medium flex items-center shadow-xs">
          <AlertCircle className="w-4 h-4 mr-2.5 text-rose-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading Spinner */}
      {loading && (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2563EB] mx-auto"></div>
          <p className="text-xs text-slate-500 font-medium mt-3">Loading judging metrics &amp; workloads...</p>
        </div>
      )}

      {!loading && data && (
        <>
          {/* 4 KPI Metric Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Card 1: SUBMITTED PROJECTS */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex items-center justify-between group hover:border-slate-300 transition-all">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#EFF6FF] border border-[#DBEAFE] flex items-center justify-center text-[#2563EB]">
                    <Layers className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    SUBMITTED PROJECTS
                  </span>
                </div>
                <div className="text-3xl font-black text-slate-900 tracking-tight pt-1">
                  {data.summary.totalProjects}
                </div>
                <div className="text-xs text-slate-500 font-normal">
                  {data.summary.unassignedProjectsCount} pending assignment
                </div>
              </div>
              <div className="w-7 h-7 rounded-full bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-400 group-hover:text-slate-600 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>

            {/* Card 2: ACTIVE JURY PANEL */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex items-center justify-between group hover:border-slate-300 transition-all">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#FAF5FF] border border-[#E9D5FF] flex items-center justify-center text-[#9333EA]">
                    <Users className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    ACTIVE JURY PANEL
                  </span>
                </div>
                <div className="text-3xl font-black text-slate-900 tracking-tight pt-1">
                  {data.summary.activeJudges}
                </div>
                <div className="text-xs text-slate-500 font-normal">
                  {data.summary.totalAssignments} project assignments
                </div>
              </div>
              <div className="w-7 h-7 rounded-full bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-400 group-hover:text-slate-600 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>

            {/* Card 3: LOCKED SCORECARDS */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex items-center justify-between group hover:border-slate-300 transition-all">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] flex items-center justify-center text-[#059669]">
                    <FileCheck className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    LOCKED SCORECARDS
                  </span>
                </div>
                <div className="text-3xl font-black text-emerald-600 tracking-tight pt-1">
                  {data.summary.completedEvaluations}
                </div>
                <div className="text-xs text-slate-500 font-normal">
                  {data.summary.pendingEvaluations} pending evaluations
                </div>
              </div>
              <div className="w-7 h-7 rounded-full bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-400 group-hover:text-slate-600 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>

            {/* Card 4: JURY COMPLETION */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex items-center justify-between group hover:border-slate-300 transition-all">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#FFF7ED] border border-[#FFEDD5] flex items-center justify-center text-[#EA580C]">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    JURY COMPLETION
                  </span>
                </div>
                <div className="text-3xl font-black text-[#EA580C] tracking-tight pt-1">
                  {data.summary.completionRate}%
                </div>
                <div className="text-xs text-slate-500 font-normal">
                  of total matrix locked
                </div>
              </div>
              <div className="w-7 h-7 rounded-full bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-400 group-hover:text-slate-600 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* 3 Action Engines Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* 1. Assignment Engine */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4 flex flex-col justify-between hover:border-slate-300 transition-all">
              <div className="space-y-3">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#EFF6FF] border border-[#DBEAFE] flex items-center justify-center text-[#2563EB]">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900">Assignment Engine</h2>
                    <p className="text-[11px] text-[#2563EB] font-semibold">Greedy Multi-Constraint Solver</p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed font-normal">
                  Balanced greedy allocation with track expertise prioritization &amp; Conflict-of-Interest (COI) exclusion.
                </p>

                <div className="space-y-3 pt-2">
                  <div>
                    <label className="text-xs font-bold text-slate-700">Judges Assigned per Project</label>
                    <input
                      type="number"
                      min={1}
                      max={5}
                      value={judgesPerProject}
                      onChange={(e) => setJudgesPerProject(parseInt(e.target.value) || 2)}
                      className="mt-1 w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#2563EB]"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={handleGenerateAssignments}
                disabled={actionLoading}
                className="w-full py-2.5 px-4 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center justify-center disabled:opacity-50 mt-4 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 mr-2 ${actionLoading ? 'animate-spin' : ''}`} />
                Generate Assignments
              </button>
            </div>

            {/* 2. Score Normalization */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4 flex flex-col justify-between hover:border-slate-300 transition-all">
              <div className="space-y-3">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#FAF5FF] border border-[#E9D5FF] flex items-center justify-center text-[#9333EA]">
                    <Sliders className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900">Score Normalization</h2>
                    <p className="text-[11px] text-[#9333EA] font-semibold">Deterministic Calibration</p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed font-normal">
                  Calibrates lenient vs harsh judge scoring curves and computes final leaderboard rankings.
                </p>

                <div className="space-y-3 pt-2">
                  <div>
                    <label className="text-xs font-bold text-slate-700">Normalization Algorithm</label>
                    <select
                      value={normalizationMethod}
                      onChange={(e: any) => setNormalizationMethod(e.target.value)}
                      className="mt-1 w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#9333EA] cursor-pointer"
                    >
                      <option value="Z_SCORE">Z-Score Normalization (Standard)</option>
                      <option value="MIN_MAX">Min-Max Scaling</option>
                    </select>
                  </div>
                </div>
              </div>

              <button
                onClick={handleComputeNormalization}
                disabled={actionLoading || data.summary.completedEvaluations === 0}
                className="w-full py-2.5 px-4 bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center justify-center disabled:opacity-50 mt-4 cursor-pointer"
              >
                <Award className="w-3.5 h-3.5 mr-2" />
                Compute Normalized Ranks
              </button>
            </div>

            {/* 3. Autonomous AI Jury */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4 flex flex-col justify-between hover:border-slate-300 transition-all">
              <div className="space-y-3">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] flex items-center justify-center text-[#059669]">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900">Autonomous AI Jury</h2>
                    <p className="text-[11px] text-[#059669] font-semibold">Evidence Grounded Evaluation</p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed font-normal">
                  Executes evidence-grounded evaluation across locked code repositories, demo URLs, and rubric criteria.
                </p>

                <div className="space-y-3 pt-2">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 flex justify-between items-center">
                    <span>Engine: <strong className="text-slate-900">Claude 3.7</strong></span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">Ready</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleTriggerAIJury}
                disabled={actionLoading || data.summary.totalProjects === 0}
                className="w-full py-2.5 px-4 bg-[#059669] hover:bg-[#047857] text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center justify-center disabled:opacity-50 mt-4 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 mr-2" />
                Run AI Jury Evaluation
              </button>
            </div>
          </div>

          {/* AI vs Human Consensus Metrics (If available) */}
          {comparisonMetrics && comparisonMetrics.totalComparisons > 0 && (
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center space-x-2.5">
                  <Sparkles className="w-5 h-5 text-[#9333EA]" />
                  <h2 className="text-base font-extrabold text-slate-900">
                    AI Jury vs Human Judge Consensus Metrics
                  </h2>
                </div>
                <span className="text-xs text-slate-400 font-mono">
                  {comparisonMetrics.totalComparisons} criterion evaluation pairs analyzed
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="text-xs text-slate-500 font-medium">Agreement Rate</div>
                  <div className="text-2xl font-black text-emerald-600 mt-1">
                    {comparisonMetrics.agreementRate}%
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">within ±10% tolerance</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="text-xs text-slate-500 font-medium">MAE</div>
                  <div className="text-2xl font-black text-[#9333EA] mt-1">
                    {comparisonMetrics.mae}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">points deviation</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="text-xs text-slate-500 font-medium">RMSE</div>
                  <div className="text-2xl font-black text-slate-900 mt-1">
                    {comparisonMetrics.rmse}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">variance penalty</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="text-xs text-slate-500 font-medium">Pearson Correlation</div>
                  <div className="text-2xl font-black text-[#2563EB] mt-1">
                    {comparisonMetrics.correlation}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">scale -1.0 to 1.0</div>
                </div>
              </div>
            </div>
          )}

          {/* Judge Workload Distribution Table */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">Judge Workload Distribution &amp; Matrix</h2>
                <p className="text-xs text-slate-500">Live evaluation throughput per enrolled judge</p>
              </div>
              <Link
                href="/organizer/judges"
                className="text-xs font-bold text-[#2563EB] hover:text-blue-800 flex items-center gap-1 transition-colors"
              >
                <span>Manage Judges</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200/80">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Judge Profile</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Assigned</th>
                    <th className="py-3 px-4">Completed</th>
                    <th className="py-3 px-4">Pending</th>
                    <th className="py-3 px-4">Workload Progress</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {data.judgeWorkloads.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                        No judges enrolled for this hackathon yet. Click &quot;Manage Judges&quot; to invite evaluators.
                      </td>
                    </tr>
                  ) : (
                    data.judgeWorkloads.map((jw) => (
                      <tr key={jw.judgeId} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          {jw.judgeName}
                          <div className="text-[10px] font-normal text-slate-400">{jw.email}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          {jw.isActive ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Active
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500">
                              Inactive
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-700">{jw.assignedCount}</td>
                        <td className="py-3.5 px-4 font-semibold text-emerald-600">{jw.completedCount}</td>
                        <td className="py-3.5 px-4 font-semibold text-amber-600">{jw.pendingCount}</td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center space-x-2">
                            <div className="w-24 bg-slate-100 rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-[#2563EB] h-2 rounded-full transition-all"
                                style={{ width: `${jw.progressPercentage}%` }}
                              />
                            </div>
                            <span className="font-bold text-slate-700 text-[11px]">{jw.progressPercentage}%</span>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
