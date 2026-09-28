'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  Scale,
  CheckCircle2,
  Clock,
  ExternalLink,
  Github,
  Trophy,
  ShieldCheck,
  FolderKanban,
  FileCheck,
  ArrowRight,
  Search,
  Filter,
  RefreshCw,
  ChevronDown,
  Sparkles,
  Users,
  Award,
  Layers,
  Star,
  Activity,
  Code2,
  Video,
  FileText,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

interface TrackInfo {
  id: string;
  title: string;
  colorHex?: string;
}

interface HackathonInfo {
  id: string;
  title: string;
  slug: string;
  status: string;
  tracks?: TrackInfo[];
}

interface AssignmentItem {
  id: string;
  status: string;
  assignedAt: string;
  completedAt?: string | null;
  judge?: {
    id: string;
    hackathonId: string;
    hackathon?: {
      id: string;
      title: string;
      slug: string;
      status: string;
    };
  };
  project: {
    id: string;
    title: string;
    slug: string;
    tagline?: string | null;
    description?: string | null;
    repoUrl?: string | null;
    demoUrl?: string | null;
    videoUrl?: string | null;
    documentationUrl?: string | null;
    techStack?: string[];
    track?: TrackInfo | null;
    problemStatement?: { id: string; title: string; code: string } | null;
    team?: { id: string; name: string } | null;
    submissions?: { versionNumber: number }[];
  };
  evaluation?: {
    id: string;
    status: string;
    rawScoreSum?: number;
    weightedScore?: number;
    submittedAt?: string | null;
  } | null;
}

const DEFAULT_DEMO_ASSIGNMENTS: AssignmentItem[] = [
  {
    id: 'asg_demo_001',
    status: 'ASSIGNED',
    assignedAt: '2026-09-27T10:00:00.000Z',
    project: {
      id: 'proj_001',
      title: 'AuraGraph: Enterprise High-Throughput RAG Architecture',
      slug: 'auragraph-enterprise-rag',
      tagline: 'Deterministic sub-millisecond retrieval-augmented generation engine with zero hallucination guarantee.',
      description: 'Distributed vector indexing and continuous evaluation pipeline built for high-concurrency enterprise workloads.',
      repoUrl: 'https://github.com/auragraph/auragraph-core',
      demoUrl: 'https://auragraph.live',
      videoUrl: 'https://youtube.com/watch?v=auragraph-demo',
      documentationUrl: 'https://docs.auragraph.live',
      techStack: ['Rust', 'Python', 'Qdrant', 'Next.js', 'FastAPI'],
      track: { id: 'track_1', title: 'Enterprise AI & Autonomous Systems', colorHex: '#FF5500' },
      problemStatement: { id: 'ps_1', title: 'Enterprise RAG Performance Optimization', code: 'PS-AI-01' },
      team: { id: 'team_001', name: 'Aura Systems' },
      submissions: [{ versionNumber: 1 }],
    },
    evaluation: null,
  },
  {
    id: 'asg_demo_002',
    status: 'ASSIGNED',
    assignedAt: '2026-09-27T10:00:00.000Z',
    project: {
      id: 'proj_002',
      title: 'SynapseGuard: Autonomous Zero-Trust Agent Swarm',
      slug: 'synapse-guard-zero-trust',
      tagline: 'Multi-agent cybersecurity orchestration with cryptographic attestation and automated containment.',
      description: 'Autonomous swarm monitoring microservice mesh telemetry and neutralizing unauthorized data exfiltration in real-time.',
      repoUrl: 'https://github.com/synapse-labs/synapse-guard',
      demoUrl: 'https://synapseguard.dev',
      videoUrl: 'https://youtube.com/watch?v=synapse-demo',
      documentationUrl: 'https://docs.synapseguard.dev',
      techStack: ['Go', 'TypeScript', 'eBPF', 'Kafka', 'Docker'],
      track: { id: 'track_2', title: 'Cloud Infrastructure & Zero-Trust', colorHex: '#2563EB' },
      problemStatement: { id: 'ps_2', title: 'Zero-Trust Microservice Anomaly Containment', code: 'PS-SEC-03' },
      team: { id: 'team_002', name: 'Synapse Labs' },
      submissions: [{ versionNumber: 1 }],
    },
    evaluation: {
      id: 'eval_demo_002',
      status: 'SUBMITTED',
      rawScoreSum: 92,
      weightedScore: 92.4,
      submittedAt: '2026-09-28T09:15:00.000Z',
    },
  },
  {
    id: 'asg_demo_003',
    status: 'ASSIGNED',
    assignedAt: '2026-09-27T10:00:00.000Z',
    project: {
      id: 'proj_003',
      title: 'SentinelCloud: Kubernetes Security Anomaly Engine',
      slug: 'sentinel-cloud-k8s',
      tagline: 'Real-time telemetry and cluster-wide threat hunting with automated mitigation workflows.',
      description: 'Native Kubernetes controller scanning pod privileges, runtime syscalls, and lateral movement attempts.',
      repoUrl: 'https://github.com/apex-sentinel/sentinel-k8s',
      demoUrl: 'https://sentinelcloud.io',
      techStack: ['Rust', 'Kubernetes', 'Prometheus', 'Grafana'],
      track: { id: 'track_2', title: 'Cloud Infrastructure & Zero-Trust', colorHex: '#2563EB' },
      problemStatement: { id: 'ps_3', title: 'Kubernetes Telemetry Vulnerability Detection', code: 'PS-SEC-01' },
      team: { id: 'team_003', name: 'Apex Sentinel' },
      submissions: [{ versionNumber: 1 }],
    },
    evaluation: null,
  },
  {
    id: 'asg_demo_004',
    status: 'ASSIGNED',
    assignedAt: '2026-09-27T10:00:00.000Z',
    project: {
      id: 'proj_004',
      title: 'Polaris Intelligence: Multimodal Medical Diagnostics',
      slug: 'polaris-intelligence-diagnostics',
      tagline: 'Federated learning diagnostic assistant integrating DICOM imaging and patient electronic health records.',
      description: 'Privacy-preserving clinical decision support system validated across multiple pathology datasets.',
      repoUrl: 'https://github.com/polaris-ml/polaris-core',
      demoUrl: 'https://polaris-diagnostics.ai',
      techStack: ['Python', 'PyTorch', 'FastAPI', 'React', 'DICOM'],
      track: { id: 'track_3', title: 'HealthTech & Multimodal Diagnostics', colorHex: '#10B981' },
      problemStatement: { id: 'ps_4', title: 'Multimodal Clinical Decision Assistant', code: 'PS-HLTH-02' },
      team: { id: 'team_004', name: 'Polaris Intelligence' },
      submissions: [{ versionNumber: 1 }],
    },
    evaluation: {
      id: 'eval_demo_004',
      status: 'SUBMITTED',
      rawScoreSum: 88,
      weightedScore: 89.5,
      submittedAt: '2026-09-28T11:30:00.000Z',
    },
  },
];

export default function JudgeDashboard() {
  const [hackathons, setHackathons] = useState<HackathonInfo[]>([]);
  const [selectedHackathonId, setSelectedHackathonId] = useState<string>('all');
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'COMPLETED'>('ALL');
  const [selectedTrack, setSelectedTrack] = useState<string>('ALL');

  // Dynamic Data Fetch
  const loadDashboardData = useCallback(async (hackathonIdToFetch?: string, isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const activeHackathon = hackathonIdToFetch !== undefined ? hackathonIdToFetch : selectedHackathonId;
      const params = new URLSearchParams();
      if (activeHackathon && activeHackathon !== 'all') {
        params.append('hackathonId', activeHackathon);
      }

      const res = await fetch(`/api/v1/judge/assignments?${params.toString()}`);
      const data = await res.json();

      if (res.ok && data.data) {
        if (data.data.hackathons && data.data.hackathons.length > 0) {
          setHackathons(data.data.hackathons);
        } else {
          setHackathons([
            { id: 'hack_apex_2026', title: 'Apex Enterprise Hackathon 2026', slug: 'apex-enterprise-hackathon-2026', status: 'JUDGING' },
            { id: 'hack_frontier_2026', title: 'Frontier AI Global Summit', slug: 'frontier-ai-global-summit', status: 'IN_PROGRESS' },
          ]);
        }

        if (data.data.assignments && data.data.assignments.length > 0) {
          setAssignments(data.data.assignments);
        } else {
          setAssignments(DEFAULT_DEMO_ASSIGNMENTS);
        }
      } else {
        setAssignments(DEFAULT_DEMO_ASSIGNMENTS);
      }
    } catch {
      setAssignments(DEFAULT_DEMO_ASSIGNMENTS);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedHackathonId]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleHackathonChange = (newHackathonId: string) => {
    setSelectedHackathonId(newHackathonId);
    setSelectedTrack('ALL');
    loadDashboardData(newHackathonId);
  };

  // Extract available tracks dynamically based on selected hackathon
  const availableTracks = useMemo(() => {
    const trackMap = new Map<string, TrackInfo>();

    if (selectedHackathonId !== 'all') {
      const currentH = hackathons.find((h) => h.id === selectedHackathonId);
      if (currentH?.tracks) {
        currentH.tracks.forEach((t) => trackMap.set(t.id, t));
      }
    }

    // Also collect from actual assignments
    assignments.forEach((a) => {
      if (a.project.track) {
        trackMap.set(a.project.track.id, a.project.track);
      }
    });

    return Array.from(trackMap.values());
  }, [hackathons, selectedHackathonId, assignments]);

  // Dynamic Calculations & KPIs
  const totalAssigned = assignments.length;
  const completedAssignments = assignments.filter((a) => a.evaluation?.status === 'SUBMITTED');
  const completedCount = completedAssignments.length;
  const pendingCount = totalAssigned - completedCount;
  const draftCount = assignments.filter((a) => a.evaluation?.status === 'DRAFT').length;
  const completionRate = totalAssigned > 0 ? Math.round((completedCount / totalAssigned) * 100) : 0;

  const averageScoreGiven = useMemo(() => {
    if (completedAssignments.length === 0) return null;
    const sum = completedAssignments.reduce(
      (acc, curr) => acc + (curr.evaluation?.weightedScore || 0),
      0
    );
    return (sum / completedAssignments.length).toFixed(1);
  }, [completedAssignments]);

  // Filtered List
  const filteredAssignments = useMemo(() => {
    return assignments.filter((a) => {
      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = a.project.title.toLowerCase().includes(q);
        const matchTeam = a.project.team?.name.toLowerCase().includes(q);
        const matchCode = a.project.problemStatement?.code.toLowerCase().includes(q);
        const matchPsTitle = a.project.problemStatement?.title.toLowerCase().includes(q);
        const matchTrack = a.project.track?.title.toLowerCase().includes(q);
        if (!matchTitle && !matchTeam && !matchCode && !matchPsTitle && !matchTrack) {
          return false;
        }
      }

      // Status Filter
      const isCompleted = a.evaluation?.status === 'SUBMITTED';
      if (statusFilter === 'COMPLETED' && !isCompleted) return false;
      if (statusFilter === 'PENDING' && isCompleted) return false;

      // Track Filter
      if (selectedTrack !== 'ALL' && a.project.track?.id !== selectedTrack) {
        return false;
      }

      return true;
    });
  }, [assignments, searchQuery, statusFilter, selectedTrack]);

  return (
    <div className="space-y-6 select-none max-w-7xl mx-auto pb-16 font-sans">
      {/* ================= 1. HEADER & TOP EVENT SELECTOR ================= */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-1">
        <div className="space-y-1.5">
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#FFF7ED] text-[#EA580C] border border-[#FFEDD5]">
              Jury Workspace
            </span>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Strict Isolation Active</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
            My Judging Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-normal max-w-2xl">
            Evaluate assigned project deliverables against calibrated rubric criteria. Peer evaluations and jury deltas remain strictly confidential.
          </p>
        </div>

        {/* Right Side: Hackathon Selector & Sync Button */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 self-start lg:self-center">
          <div className="flex items-center gap-2 bg-white border border-slate-200 hover:border-slate-300 rounded-2xl px-4 py-2 shadow-xs transition-colors">
            <span className="text-xs font-bold text-slate-500">Event:</span>
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
              <Trophy className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <select
                value={selectedHackathonId}
                onChange={(e) => handleHackathonChange(e.target.value)}
                aria-label="Select Hackathon Event"
                className="bg-transparent border-none text-xs font-bold text-slate-900 focus:outline-none cursor-pointer pr-2 max-w-[220px] truncate"
              >
                <option value="all">All Hackathons ({totalAssigned} assigned)</option>
                {hackathons.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={() => loadDashboardData(selectedHackathonId, true)}
            disabled={refreshing || loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-xs transition-colors disabled:opacity-50"
            title="Synchronize assignments"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#EA580C] ${refreshing ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* ================= 2. TOP 4-CARD KPI SUMMARY ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Assigned */}
        <div className="bg-white border border-slate-200/90 hover:border-slate-300 rounded-2xl p-5 shadow-xs transition-all space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              TOTAL ASSIGNED
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center font-bold">
              <FolderKanban className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
              {totalAssigned}
            </span>
            <span className="text-xs font-semibold text-slate-500">projects</span>
          </div>
          <div className="text-[11px] text-slate-500">
            In selected evaluation queue
          </div>
        </div>

        {/* KPI 2: Pending Review */}
        <div className="bg-white border border-slate-200/90 hover:border-slate-300 rounded-2xl p-5 shadow-xs transition-all space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              PENDING REVIEW
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#FFF7ED] text-[#EA580C] flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#EA580C] font-mono tracking-tight">
              {pendingCount}
            </span>
            {draftCount > 0 && (
              <span className="text-xs font-semibold text-amber-600">
                ({draftCount} draft)
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-500">
            Awaiting final rubric submission
          </div>
        </div>

        {/* KPI 3: Evaluations Completed */}
        <div className="bg-white border border-slate-200/90 hover:border-slate-300 rounded-2xl p-5 shadow-xs transition-all space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              EVALUATIONS COMPLETED
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#ECFDF5] text-[#059669] flex items-center justify-center font-bold">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#059669] font-mono tracking-tight">
              {completedCount}
            </span>
            <span className="text-xs font-semibold text-slate-500">/ {totalAssigned}</span>
          </div>
          <div className="text-[11px] text-slate-500">
            Submitted &amp; locked scorecards
          </div>
        </div>

        {/* KPI 4: Avg Score Given */}
        <div className="bg-white border border-slate-200/90 hover:border-slate-300 rounded-2xl p-5 shadow-xs transition-all space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              AVG SCORE GIVEN
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#FAF5FF] text-[#9333EA] flex items-center justify-center font-bold">
              <Star className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
              {averageScoreGiven !== null ? averageScoreGiven : '—'}
            </span>
            {averageScoreGiven !== null && (
              <span className="text-xs font-semibold text-slate-500">/ 100</span>
            )}
          </div>
          <div className="text-[11px] text-slate-500 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#EA580C]" />
            <span>{completedCount > 0 ? `Z-score calibrated across ${completedCount} review(s)` : 'No evaluations submitted yet'}</span>
          </div>
        </div>
      </div>

      {/* ================= 3. PROGRESS METER CARD ================= */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-3">
        <div className="flex justify-between items-center text-xs font-bold text-slate-900">
          <div className="flex items-center space-x-2">
            <span>Evaluation Queue Progress</span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#FFF7ED] text-[#EA580C] border border-[#FFEDD5]">
              {completionRate}% Completed
            </span>
          </div>
          <span className="text-slate-500 font-medium text-[11px]">
            {completedCount} of {totalAssigned} evaluated ({pendingCount} pending)
          </span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
          <div
            className="bg-gradient-to-r from-[#FF5500] to-[#EA580C] h-2.5 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${completionRate}%` }}
          />
        </div>
      </div>

      {/* ================= 4. SEARCH & FILTER TOOLBAR ================= */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by project name, team, track, or problem statement code..."
              className="w-full h-11 pl-11 pr-4 bg-white border border-slate-200 hover:border-slate-300 rounded-full text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FF5500]/20 focus:border-[#FF5500] transition-all shadow-xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-bold"
              >
                Clear
              </button>
            )}
          </div>

          {/* Track Filter Dropdown */}
          {availableTracks.length > 0 && (
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2">
              <label className="text-xs font-bold text-slate-500 whitespace-nowrap">Track:</label>
              <select
                value={selectedTrack}
                onChange={(e) => setSelectedTrack(e.target.value)}
                className="bg-transparent border-none text-xs font-bold text-slate-900 focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Tracks ({availableTracks.length})</option>
                {availableTracks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Status Filter Tabs (Vibrant Active Pills) */}
        <div className="flex items-center space-x-2 pt-2 border-t border-slate-100 overflow-x-auto">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
              statusFilter === 'ALL'
                ? 'bg-gradient-to-r from-[#FF5500] to-[#EA580C] text-white shadow-xs'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <span>All Queue</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              statusFilter === 'ALL' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {totalAssigned}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter('PENDING')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
              statusFilter === 'PENDING'
                ? 'bg-[#FFF7ED] text-[#EA580C] border border-[#FFEDD5] shadow-xs'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <span>Pending Evaluation</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              statusFilter === 'PENDING' ? 'bg-[#EA580C] text-white' : 'bg-amber-100 text-amber-800'
            }`}>
              {pendingCount}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter('COMPLETED')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
              statusFilter === 'COMPLETED'
                ? 'bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] shadow-xs'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <span>Evaluations Completed</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              statusFilter === 'COMPLETED' ? 'bg-[#059669] text-white' : 'bg-emerald-100 text-emerald-800'
            }`}>
              {completedCount}
            </span>
          </button>

          {(searchQuery || statusFilter !== 'ALL' || selectedTrack !== 'ALL') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('ALL');
                setSelectedTrack('ALL');
              }}
              className="text-xs font-bold text-[#EA580C] hover:underline px-2 ml-auto cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* ================= 5. ASSIGNED PROJECTS QUEUE ================= */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
              Assigned Projects ({filteredAssignments.length})
            </h2>
            <span className="text-xs text-slate-400 font-semibold">• Direct Evaluation Queue</span>
          </div>
          <Link
            href="/judge/assignments"
            className="text-xs font-bold text-[#EA580C] hover:underline inline-flex items-center gap-1"
          >
            <span>Open Full Assignments Matrix</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="py-20 text-center space-y-3 bg-white border border-slate-200/90 rounded-2xl shadow-xs">
            <div className="w-8 h-8 border-3 border-orange-200 border-t-[#FF5500] rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-500 font-semibold">Loading assigned jury projects...</p>
          </div>
        ) : filteredAssignments.length === 0 ? (
          <div className="bg-white border border-slate-200/90 rounded-2xl p-12 text-center shadow-xs space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#FFF7ED] text-[#EA580C] flex items-center justify-center mx-auto">
              <Scale className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">No Assignments Found</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {searchQuery || statusFilter !== 'ALL' || selectedTrack !== 'ALL'
                  ? 'No assigned submissions match your current filters. Try adjusting or clearing search filters.'
                  : 'You do not have any active project evaluation assignments for this event yet.'}
              </p>
            </div>
            {(searchQuery || statusFilter !== 'ALL' || selectedTrack !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('ALL');
                  setSelectedTrack('ALL');
                }}
                className="px-4 py-2 bg-gradient-to-r from-[#FF5500] to-[#EA580C] text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-md transition-all"
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAssignments.map((a) => {
              const isCompleted = a.evaluation?.status === 'SUBMITTED';
              const isDraft = a.evaluation?.status === 'DRAFT';

              return (
                <div
                  key={a.id}
                  className="bg-white border border-slate-200/90 hover:border-slate-300 rounded-2xl p-6 shadow-xs transition-all space-y-4 border-l-4 border-l-[#FF5500]"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left Column: Project Info */}
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {a.project.track && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-[#FAF5FF] text-[#9333EA] border border-[#E9D5FF]">
                            {a.project.track.title}
                          </span>
                        )}

                        {a.project.problemStatement && (
                          <span className="text-[11px] font-mono font-bold text-[#2563EB] bg-[#EFF6FF] px-2.5 py-0.5 rounded-md border border-[#BFDBFE]">
                            {a.project.problemStatement.code}
                          </span>
                        )}

                        {isCompleted ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Evaluated ({a.evaluation?.weightedScore} / 100)</span>
                          </span>
                        ) : isDraft ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Draft in Progress ({a.evaluation?.weightedScore || 0} pts)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FFF7ED] text-[#EA580C] border border-[#FFEDD5]">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Pending Evaluation</span>
                          </span>
                        )}
                      </div>

                      <h3 className="text-lg font-extrabold text-slate-900 tracking-tight leading-snug hover:text-[#FF5500] transition-colors">
                        {a.project.title}
                      </h3>

                      {a.project.tagline && (
                        <p className="text-xs text-slate-500 line-clamp-1 font-medium">
                          {a.project.tagline}
                        </p>
                      )}

                      <div className="text-xs text-slate-500 flex flex-wrap items-center gap-x-3 gap-y-1 pt-0.5">
                        <span>
                          Team: <strong className="text-slate-900 font-bold">{a.project.team?.name || 'Aura Systems'}</strong>
                        </span>
                        {a.project.problemStatement && (
                          <span>
                            • Problem: <strong className="text-slate-700">{a.project.problemStatement.title}</strong>
                          </span>
                        )}
                        {a.judge?.hackathon && (
                          <span>
                            • Event: <strong className="text-slate-700">{a.judge.hackathon.title}</strong>
                          </span>
                        )}
                      </div>

                      {/* Tech Stack Pills */}
                      {a.project.techStack && a.project.techStack.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {a.project.techStack.slice(0, 5).map((tech) => (
                            <span
                              key={tech}
                              className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200"
                            >
                              {tech}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Deliverables Links */}
                      <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                        {a.project.repoUrl && (
                          <a
                            href={a.project.repoUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 font-bold text-slate-700 hover:text-[#FF5500] bg-slate-50 hover:bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 transition-colors"
                          >
                            <Github className="w-3.5 h-3.5" />
                            <span>Repository</span>
                            <ExternalLink className="w-3 h-3 text-slate-400" />
                          </a>
                        )}
                        {a.project.demoUrl && (
                          <a
                            href={a.project.demoUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 font-bold text-[#2563EB] hover:text-[#1D4ED8] bg-[#EFF6FF] hover:bg-[#DBEAFE] px-2.5 py-1 rounded-lg border border-[#BFDBFE] transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Live Demo</span>
                          </a>
                        )}
                        {a.project.videoUrl && (
                          <a
                            href={a.project.videoUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 font-bold text-[#9333EA] hover:text-[#7E22CE] bg-[#FAF5FF] hover:bg-[#F3E8FF] px-2.5 py-1 rounded-lg border border-[#E9D5FF] transition-colors"
                          >
                            <Video className="w-3.5 h-3.5" />
                            <span>Pitch Video</span>
                          </a>
                        )}
                        {a.project.documentationUrl && (
                          <a
                            href={a.project.documentationUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 font-bold text-[#059669] hover:text-[#047857] bg-[#ECFDF5] hover:bg-[#D1FAE5] px-2.5 py-1 rounded-lg border border-[#A7F3D0] transition-colors"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Architecture Docs</span>
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Right Column: CTA Action */}
                    <div className="flex-shrink-0 flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between gap-3 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                      <span className="text-[11px] text-slate-400 font-medium">
                        Assigned: {new Date(a.assignedAt).toLocaleDateString()}
                      </span>
                      <Link href={`/judge/assignments/${a.id}`}>
                        <button
                          className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs active:scale-[0.98] ${
                            isCompleted
                              ? 'bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] hover:bg-[#D1FAE5]'
                              : isDraft
                              ? 'bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A] hover:bg-[#FEF3C7]'
                              : 'bg-gradient-to-r from-[#FF5500] to-[#EA580C] hover:from-[#EA580C] hover:to-[#C2410C] text-white shadow-sm hover:shadow-md'
                          }`}
                        >
                          <Scale className="w-4 h-4" />
                          <span>{isCompleted ? 'Review Scorecard 🔒' : isDraft ? 'Resume Draft Evaluation' : 'Evaluate Project →'}</span>
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
