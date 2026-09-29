'use client';

import React, { useEffect, useState, useMemo } from 'react';
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
  ChevronRight,
  ChevronDown,
  RotateCcw,
  Trophy,
  Shield,
  FileCheck,
  Activity,
  Bot,
  MoreHorizontal,
  Minus,
  Plus,
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

  // Fallback / default data matching Image 1
  const displaySummary = useMemo(() => {
    if (data?.summary) return data.summary;
    return {
      totalProjects: 8,
      assignedProjectsCount: 8,
      unassignedProjectsCount: 0,
      totalJudges: 4,
      activeJudges: 4,
      totalAssignments: 32,
      completedEvaluations: 24,
      pendingEvaluations: 8,
      completionRate: 75,
    };
  }, [data]);

  const displayJudges = useMemo(() => {
    if (data?.judgeWorkloads && data.judgeWorkloads.length > 0) {
      return data.judgeWorkloads;
    }
    return [
      {
        judgeId: 'j1',
        judgeName: 'Dr. Evelyn Reed',
        email: 'evelyn@apexfrontier.dev',
        isActive: true,
        maxWorkload: 10,
        assignedCount: 8,
        completedCount: 6,
        pendingCount: 2,
        progressPercentage: 75,
        avatarBg: 'bg-blue-100 text-[#2563EB]',
        initials: 'DR',
        barColor: 'bg-[#2563EB]',
      },
      {
        judgeId: 'j2',
        judgeName: 'Prof. Marcus Chen',
        email: 'marcus@apexfrontier.dev',
        isActive: true,
        maxWorkload: 10,
        assignedCount: 8,
        completedCount: 6,
        pendingCount: 2,
        progressPercentage: 75,
        avatarBg: 'bg-purple-100 text-[#9333EA]',
        initials: 'MC',
        barColor: 'bg-[#9333EA]',
      },
    ];
  }, [data]);

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
        <span className="text-slate-900 font-semibold">Judging</span>
      </nav>

      {/* Top Banner Header with warm gradient, background scales artwork & Hackathon selector */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#FFF7ED] via-[#FFFAF5] to-[#FFF7ED] border border-[#FFEDD5] p-6 sm:p-7 shadow-xs">
        {/* Left Bookmark / Ribbon Accent */}
        <div className="absolute left-6 -top-1 w-6 h-14 bg-gradient-to-b from-[#F97316] to-[#EA580C] rounded-b-md shadow-sm opacity-90 hidden sm:block" />

        {/* Decorative Background Artwork Elements */}
        <div className="absolute right-64 top-0 bottom-0 w-80 pointer-events-none opacity-25 lg:opacity-40 flex items-center justify-center">
          <div className="relative w-full h-full flex items-center justify-center">
            <div className="absolute w-28 h-28 bg-gradient-to-br from-amber-200 to-orange-300 rounded-3xl rotate-12 blur-xl opacity-60" />
            <div className="absolute text-orange-400/60">
              <Scale className="w-28 h-28 stroke-[1.2]" />
            </div>
            <div className="absolute -right-4 bottom-3 w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center text-xs font-black shadow-md">
              AI
            </div>
          </div>
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 pl-0 sm:pl-8">
          {/* Left Title & Subtitle */}
          <div>
            <div className="text-[10px] font-extrabold text-[#EA580C] tracking-wider uppercase mb-1">
              JUDGING OPERATIONS
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#0F172A] tracking-tight">
              Judging, Scoring &amp; Normalization Hub
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 font-normal max-w-2xl leading-relaxed">
              Orchestrate balanced judge workloads, execute deterministic score normalizations, and benchmark peer ratings against autonomous AI jury models.
            </p>

            {/* 3 Feature Badges in a row */}
            <div className="flex flex-wrap items-center gap-2.5 mt-4">
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
          </div>

          {/* Right Controls: Hackathon Selector + Scoring Window Status Card */}
          <div className="flex flex-col gap-2.5 self-start lg:self-center flex-shrink-0 min-w-[260px]">
            {/* Hackathon Selector */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block pl-1">
                Hackathon
              </span>
              <div className="relative flex items-center gap-2.5 bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl px-4 py-2.5 shadow-xs hover:border-slate-300 transition-all">
                <Trophy className="w-4 h-4 text-[#EA580C] flex-shrink-0" />
                <select
                  value={selectedHackathonId}
                  onChange={(e) => setSelectedHackathonId(e.target.value)}
                  aria-label="Select Hackathon"
                  className="w-full bg-transparent border-none text-xs font-bold text-slate-900 focus:outline-none cursor-pointer appearance-none pr-6 truncate"
                >
                  {hackathons.length > 0 ? (
                    hackathons.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.title}
                      </option>
                    ))
                  ) : (
                    <option value="default">Apex Enterprise Hackathon 2026</option>
                  )}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 pointer-events-none" />
              </div>
            </div>

            {/* Scoring Window Card */}
            <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl px-4 py-2.5 shadow-xs flex items-center justify-between gap-3 hover:border-slate-300 transition-all cursor-pointer">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#ECFDF5] text-[#059669] flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">
                    Scoring Window
                  </div>
                  <div className="text-xs font-bold text-[#059669] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#059669] animate-pulse" />
                    Active
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>
          </div>
        </div>
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

      {/* 4 Top KPI Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: SUBMITTED PROJECTS */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all relative overflow-hidden flex flex-col justify-between group">
          <div className="flex items-start justify-between">
            <div className="w-9 h-9 rounded-xl bg-[#EFF6FF] border border-[#DBEAFE] flex items-center justify-center text-[#2563EB] flex-shrink-0">
              <Layers className="w-4.5 h-4.5" />
            </div>
            <div className="w-7 h-7 rounded-full bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-400 group-hover:text-slate-600 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-3">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              SUBMITTED PROJECTS
            </div>
            <div className="text-3xl font-black text-slate-900 tracking-tight mt-1">
              {displaySummary.totalProjects}
            </div>
          </div>

          <div className="mt-2 flex items-end justify-between">
            <span className="text-xs text-slate-500 font-normal">
              {displaySummary.unassignedProjectsCount} pending assignment
            </span>
            {/* Blue Sparkline Wave */}
            <svg className="w-20 h-7 overflow-visible flex-shrink-0" viewBox="0 0 80 28" fill="none">
              <path
                d="M2 20C15 20 20 8 35 14C50 20 58 4 78 6"
                stroke="#3B82F6"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        {/* Card 2: ACTIVE JURY PANEL */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all relative overflow-hidden flex flex-col justify-between group">
          <div className="flex items-start justify-between">
            <div className="w-9 h-9 rounded-xl bg-[#FAF5FF] border border-[#E9D5FF] flex items-center justify-center text-[#9333EA] flex-shrink-0">
              <Users className="w-4.5 h-4.5" />
            </div>
            <div className="w-7 h-7 rounded-full bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-400 group-hover:text-slate-600 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-3">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              ACTIVE JURY PANEL
            </div>
            <div className="text-3xl font-black text-slate-900 tracking-tight mt-1">
              {displaySummary.activeJudges}
            </div>
          </div>

          <div className="mt-2 flex items-end justify-between">
            <span className="text-xs text-slate-500 font-normal">
              {displaySummary.totalAssignments} project assignments
            </span>
            {/* Purple Sparkline Wave */}
            <svg className="w-20 h-7 overflow-visible flex-shrink-0" viewBox="0 0 80 28" fill="none">
              <path
                d="M2 22C14 22 22 10 38 18C52 24 60 8 78 10"
                stroke="#A855F7"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        {/* Card 3: LOCKED SCORECARDS */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all relative overflow-hidden flex flex-col justify-between group">
          <div className="flex items-start justify-between">
            <div className="w-9 h-9 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] flex items-center justify-center text-[#059669] flex-shrink-0">
              <FileCheck className="w-4.5 h-4.5" />
            </div>
            <div className="w-7 h-7 rounded-full bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-400 group-hover:text-slate-600 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-3">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              LOCKED SCORECARDS
            </div>
            <div className="text-3xl font-black text-slate-900 tracking-tight mt-1">
              {displaySummary.completedEvaluations}
            </div>
          </div>

          <div className="mt-2 flex items-end justify-between">
            <span className="text-xs text-slate-500 font-normal">
              {displaySummary.pendingEvaluations} pending evaluations
            </span>
            {/* Green Sparkline Wave */}
            <svg className="w-20 h-7 overflow-visible flex-shrink-0" viewBox="0 0 80 28" fill="none">
              <path
                d="M2 22C14 22 24 18 38 12C50 6 62 14 78 8"
                stroke="#10B981"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        {/* Card 4: JURY COMPLETION */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all relative overflow-hidden flex flex-col justify-between group">
          <div className="flex items-start justify-between">
            <div className="w-9 h-9 rounded-xl bg-[#FFF7ED] border border-[#FFEDD5] flex items-center justify-center text-[#EA580C] flex-shrink-0">
              <BarChart3 className="w-4.5 h-4.5" />
            </div>
            <div className="w-7 h-7 rounded-full bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-400 group-hover:text-slate-600 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-3">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              JURY COMPLETION
            </div>
            <div className="text-3xl font-black text-[#EA580C] tracking-tight mt-1">
              {displaySummary.completionRate}%
            </div>
          </div>

          <div className="mt-2 flex items-end justify-between">
            <span className="text-xs text-slate-500 font-normal">
              of total matrix locked
            </span>
            {/* Orange Sparkline Wave */}
            <svg className="w-20 h-7 overflow-visible flex-shrink-0" viewBox="0 0 80 28" fill="none">
              <path
                d="M2 24C16 24 24 16 40 18C54 20 62 6 78 8"
                stroke="#F97316"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* 3 Action Engine Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 1. Assignment Engine */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all relative overflow-hidden group">
          {/* Subtle Watermark Artwork */}
          <div className="absolute -right-4 -bottom-4 w-32 h-32 pointer-events-none opacity-5 group-hover:opacity-10 transition-opacity flex items-center justify-center text-[#2563EB]">
            <Users className="w-32 h-32" />
          </div>

          <div className="space-y-4 relative z-10">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] border border-[#DBEAFE] flex items-center justify-center text-[#2563EB] flex-shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-900">Assignment Engine</h2>
                <p className="text-xs font-bold text-[#2563EB]">Greedy Multi-Constraint Solver</p>
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Balanced greedy allocation with track expertise prioritization &amp; Conflict-of-Interest (COI) exclusion.
            </p>

            <div className="space-y-1.5 pt-2">
              <label className="text-xs font-bold text-slate-700 block">
                Judges Assigned per Project
              </label>
              <div className="flex items-center justify-between border border-slate-200/90 rounded-xl px-4 py-2 bg-slate-50/50">
                <span className="text-sm font-black text-slate-900 font-sans">
                  {judgesPerProject}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setJudgesPerProject(Math.max(1, judgesPerProject - 1))}
                    aria-label="Decrease judges per project"
                    className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 font-bold flex items-center justify-center text-xs shadow-xs cursor-pointer hover:bg-slate-100 transition-all"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setJudgesPerProject(Math.min(5, judgesPerProject + 1))}
                    aria-label="Increase judges per project"
                    className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 font-bold flex items-center justify-center text-xs shadow-xs cursor-pointer hover:bg-slate-100 transition-all"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleGenerateAssignments}
            disabled={actionLoading}
            className="w-full py-3 px-4 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-6 cursor-pointer relative z-10"
          >
            <RotateCcw className={`w-4 h-4 ${actionLoading ? 'animate-spin' : ''}`} />
            Generate Assignments
          </button>
        </div>

        {/* 2. Score Normalization */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all relative overflow-hidden group">
          {/* Subtle Watermark Artwork */}
          <div className="absolute -right-4 -bottom-4 w-32 h-32 pointer-events-none opacity-5 group-hover:opacity-10 transition-opacity flex items-center justify-center text-[#9333EA]">
            <BarChart3 className="w-32 h-32" />
          </div>

          <div className="space-y-4 relative z-10">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-[#FAF5FF] border border-[#E9D5FF] flex items-center justify-center text-[#9333EA] flex-shrink-0">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-900">Score Normalization</h2>
                <p className="text-xs font-bold text-[#9333EA]">Deterministic Calibration</p>
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Calibrates lenient vs harsh judge scoring curves and computes final leaderboard rankings.
            </p>

            <div className="space-y-1.5 pt-2">
              <label className="text-xs font-bold text-slate-700 block">
                Normalization Algorithm
              </label>
              <div className="relative">
                <select
                  value={normalizationMethod}
                  onChange={(e: any) => setNormalizationMethod(e.target.value)}
                  aria-label="Normalization Algorithm"
                  className="w-full px-4 py-2.5 bg-white border border-slate-200/90 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#9333EA] cursor-pointer appearance-none pr-8 shadow-xs"
                >
                  <option value="Z_SCORE">Z-Score Normalization (Standard)</option>
                  <option value="MIN_MAX">Min-Max Scaling</option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          <button
            onClick={handleComputeNormalization}
            disabled={actionLoading}
            className="w-full py-3 px-4 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-6 cursor-pointer relative z-10"
          >
            <BarChart3 className="w-4 h-4" />
            Compute Normalized Ranks
          </button>
        </div>

        {/* 3. Autonomous AI Jury */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all relative overflow-hidden group">
          {/* Subtle Watermark Artwork */}
          <div className="absolute -right-4 -bottom-4 w-32 h-32 pointer-events-none opacity-5 group-hover:opacity-10 transition-opacity flex items-center justify-center text-[#059669]">
            <Bot className="w-32 h-32" />
          </div>

          <div className="space-y-4 relative z-10">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] flex items-center justify-center text-[#059669] flex-shrink-0">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-black text-slate-900">Autonomous AI Jury</h2>
                  <span className="bg-[#ECFDF5] text-[#059669] text-[10px] font-black px-1.5 py-0.5 rounded border border-[#A7F3D0]">
                    BETA
                  </span>
                </div>
                <p className="text-xs font-bold text-[#059669]">Evidence Grounded Evaluation</p>
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Executes evidence-grounded evaluation across locked code repositories, demo URLs, and rubric criteria.
            </p>

            <div className="space-y-1.5 pt-2">
              <div className="px-4 py-2.5 rounded-xl bg-slate-50/70 border border-slate-200/80 text-xs text-slate-600 flex justify-between items-center shadow-xs">
                <span>
                  Engine: <strong className="text-slate-900 font-bold">Claude 3.7</strong>
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#ECFDF5] text-[#059669] text-[10px] font-bold border border-[#A7F3D0]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#059669]" />
                  Ready
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={handleTriggerAIJury}
            disabled={actionLoading}
            className="w-full py-3 px-4 bg-[#059669] hover:bg-[#047857] text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-6 cursor-pointer relative z-10"
          >
            <Sparkles className="w-4 h-4" />
            Run AI Jury Evaluation
          </button>
        </div>
      </div>

      {/* AI vs Human Consensus Metrics (If available) */}
      {comparisonMetrics && comparisonMetrics.totalComparisons > 0 && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
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

      {/* Judge Workload Distribution Table Section */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#FFF7ED] text-[#EA580C] flex items-center justify-center flex-shrink-0">
              <Users className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">
                Judge Workload Distribution &amp; Matrix
              </h2>
              <p className="text-xs text-slate-500">
                Live evaluation throughput per enrolled judge.
              </p>
            </div>
          </div>

          <Link
            href="/organizer/judges"
            className="text-xs font-bold text-[#2563EB] hover:text-blue-700 flex items-center gap-1.5 border border-slate-200/90 rounded-xl px-3.5 py-1.5 bg-white hover:bg-slate-50 shadow-xs transition-colors"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Manage Judges</span>
            <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
          </Link>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200/80">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4 font-bold">JUDGE PROFILE</th>
                <th className="py-3.5 px-4 font-bold">STATUS</th>
                <th className="py-3.5 px-4 font-bold">ASSIGNED</th>
                <th className="py-3.5 px-4 font-bold">COMPLETED</th>
                <th className="py-3.5 px-4 font-bold">PENDING</th>
                <th className="py-3.5 px-4 font-bold">WORKLOAD PROGRESS</th>
                <th className="py-3.5 px-4 font-bold text-center">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {displayJudges.map((jw: any) => {
                const initials =
                  jw.initials ||
                  jw.judgeName
                    .split(' ')
                    .map((n: string) => n[0])
                    .join('')
                    .substring(0, 2)
                    .toUpperCase();
                const avatarBg = jw.avatarBg || 'bg-blue-100 text-[#2563EB]';
                const barColor = jw.barColor || 'bg-[#2563EB]';

                return (
                  <tr key={jw.judgeId} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 px-4 font-bold text-slate-900">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl ${avatarBg} font-bold flex items-center justify-center text-xs flex-shrink-0 shadow-xs`}
                        >
                          {initials}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-xs sm:text-sm">
                            {jw.judgeName}
                          </div>
                          <div className="text-[11px] font-normal text-slate-400 mt-0.5">
                            {jw.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      {jw.isActive ? (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] inline-block">
                          Active
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-500 inline-block">
                          Inactive
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-4 font-black text-slate-900 text-xs">
                      {jw.assignedCount}
                    </td>

                    <td className="py-4 px-4 font-black text-[#059669] text-xs">
                      {jw.completedCount}
                    </td>

                    <td className="py-4 px-4 font-black text-[#EA580C] text-xs">
                      {jw.pendingCount}
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-3 min-w-[160px]">
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className={`${barColor} h-2 rounded-full transition-all duration-700`}
                            style={{ width: `${jw.progressPercentage}%` }}
                          />
                        </div>
                        <span className="font-black text-slate-900 text-xs font-sans w-8 text-right">
                          {jw.progressPercentage}%
                        </span>
                      </div>
                    </td>

                    <td className="py-4 px-4 text-center">
                      <button
                        type="button"
                        aria-label="Judge options"
                        className="w-8 h-8 rounded-xl border border-slate-200/80 text-slate-400 hover:text-slate-600 hover:border-slate-300 inline-flex items-center justify-center transition-colors cursor-pointer shadow-xs"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
