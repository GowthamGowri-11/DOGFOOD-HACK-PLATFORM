'use client';

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
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
  Sparkles,
  AlertCircle,
  RefreshCw,
  SlidersHorizontal,
  ChevronRight,
  Code2,
  Layers,
  Check,
  Star,
  Users,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

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
    techStack?: string[];
    track?: { id: string; title: string; colorHex?: string } | null;
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

const FALLBACK_ASSIGNMENTS: AssignmentItem[] = [
  {
    id: 'asgn_1',
    status: 'ASSIGNED',
    assignedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    judge: {
      id: 'jdg_1',
      hackathonId: 'hack_buildathon_2026',
      hackathon: {
        id: 'hack_buildathon_2026',
        title: 'Global Autonomous Systems Arena 2026',
        slug: 'autonomous-systems-2026',
        status: 'JUDGING',
      },
    },
    project: {
      id: 'proj_sentinel_ai',
      title: 'SentinelShield: Autonomous Multi-Agent Threat Neutralization',
      slug: 'sentinel-shield',
      tagline: 'Deterministic real-time cybersecurity incident response with zero human latency.',
      description: 'Distributed network of specialized autonomous agents that cross-verify anomaly signatures and orchestrate automated network isolation within 200 milliseconds.',
      repoUrl: 'https://github.com/dogfood/sentinel-shield',
      demoUrl: 'https://sentinel-shield-demo.dev',
      techStack: ['Next.js', 'Rust', 'Prisma', 'Neon', 'TailwindCSS'],
      track: { id: 'trk_1', title: 'Autonomous AI Agents', colorHex: '#8B5CF6' },
      problemStatement: { id: 'ps_1', title: 'Multi-Agent Cybersecurity Incident Triage', code: 'AI-01' },
      team: { id: 'tm_1', name: 'Team Sentinel AI' },
      submissions: [{ versionNumber: 1 }],
    },
    evaluation: null,
  },
  {
    id: 'asgn_2',
    status: 'COMPLETED',
    assignedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    completedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    judge: {
      id: 'jdg_1',
      hackathonId: 'hack_buildathon_2026',
      hackathon: {
        id: 'hack_buildathon_2026',
        title: 'Global Autonomous Systems Arena 2026',
        slug: 'autonomous-systems-2026',
        status: 'JUDGING',
      },
    },
    project: {
      id: 'proj_vericlinical',
      title: 'VeriClinical: Deterministic Diagnostic Evidence Engine',
      slug: 'vericlinical-rag',
      tagline: 'Sub-second clinical diagnostic retrieval verified against peer-reviewed trials.',
      description: 'An explainable diagnostic intelligence copilot empowering ER physicians with immediate differential diagnoses backed by citation trees.',
      repoUrl: 'https://github.com/dogfood/vericlinical',
      demoUrl: 'https://vericlinical.health',
      techStack: ['Python', 'FastAPI', 'React', 'Neon', 'OpenAI'],
      track: { id: 'trk_1', title: 'Autonomous AI Agents', colorHex: '#8B5CF6' },
      problemStatement: { id: 'ps_2', title: 'Sub-Second Clinical Diagnostic Retrieval', code: 'AI-02' },
      team: { id: 'tm_2', name: 'Team VeriClinical' },
      submissions: [{ versionNumber: 1 }],
    },
    evaluation: {
      id: 'eval_2',
      status: 'SUBMITTED',
      rawScoreSum: 92.5,
      weightedScore: 92.5,
      submittedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    },
  },
  {
    id: 'asgn_3',
    status: 'IN_PROGRESS',
    assignedAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    judge: {
      id: 'jdg_1',
      hackathonId: 'hack_buildathon_2026',
      hackathon: {
        id: 'hack_buildathon_2026',
        title: 'Global Autonomous Systems Arena 2026',
        slug: 'autonomous-systems-2026',
        status: 'JUDGING',
      },
    },
    project: {
      id: 'proj_neurosync',
      title: 'NeuroSync: Privacy-Preserving Federated Medical Graph',
      slug: 'neurosync-privacy',
      tagline: 'Zero-knowledge cross-institutional healthcare model training at planetary scale.',
      description: 'Leveraging homomorphic encryption and federated graph learning to detect rare pathologies without sharing sensitive patient telemetry.',
      repoUrl: 'https://github.com/dogfood/neurosync',
      demoUrl: 'https://neurosync.app',
      techStack: ['TypeScript', 'Rust', 'WebAssembly', 'Prisma', 'PyTorch'],
      track: { id: 'trk_2', title: 'Zero-Knowledge & Privacy', colorHex: '#0EA5E9' },
      problemStatement: { id: 'ps_3', title: 'Cross-Hospital Model Aggregation', code: 'ZK-01' },
      team: { id: 'tm_3', name: 'ZeroKnowledge Guild' },
      submissions: [{ versionNumber: 2 }],
    },
    evaluation: {
      id: 'eval_3',
      status: 'DRAFT',
      rawScoreSum: 78.0,
      weightedScore: 78.0,
      submittedAt: null,
    },
  },
  {
    id: 'asgn_4',
    status: 'ASSIGNED',
    assignedAt: new Date(Date.now() - 3600000 * 18).toISOString(),
    judge: {
      id: 'jdg_1',
      hackathonId: 'hack_buildathon_2026',
      hackathon: {
        id: 'hack_buildathon_2026',
        title: 'Global Autonomous Systems Arena 2026',
        slug: 'autonomous-systems-2026',
        status: 'JUDGING',
      },
    },
    project: {
      id: 'proj_aegis_supply',
      title: 'AegisChain: Autonomous Resilient Logistics Oracle',
      slug: 'aegis-chain',
      tagline: 'Algorithmic maritime shipping route re-allocation responding to climate volatility.',
      description: 'Real-time multi-spectral satellite imagery processing paired with autonomous container re-routing smart contracts.',
      repoUrl: 'https://github.com/dogfood/aegis-chain',
      demoUrl: 'https://aegis-logistics.io',
      techStack: ['Go', 'Solidity', 'React', 'PostgreSQL'],
      track: { id: 'trk_3', title: 'Decentralized Infrastructure', colorHex: '#10B981' },
      problemStatement: { id: 'ps_4', title: 'Climate-Adaptive Freight Dispatch', code: 'INFRA-03' },
      team: { id: 'tm_4', name: 'Hydra Logistics' },
      submissions: [{ versionNumber: 1 }],
    },
    evaluation: null,
  },
];

function JudgeAssignmentsContent() {
  const searchParams = useSearchParams();
  const initialStatusParam = searchParams.get('status')?.toUpperCase();
  const initialStatus: 'ALL' | 'PENDING' | 'COMPLETED' =
    initialStatusParam === 'PENDING'
      ? 'PENDING'
      : initialStatusParam === 'COMPLETED'
      ? 'COMPLETED'
      : 'ALL';

  const [hackathonsList, setHackathonsList] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<AssignmentItem[]>(FALLBACK_ASSIGNMENTS);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'COMPLETED'>(initialStatus);
  const [trackFilter, setTrackFilter] = useState<string>('ALL');
  const [hackathonFilter, setHackathonFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'NEWEST' | 'NAME' | 'STATUS'>('NEWEST');

  const fetchAssignments = async (targetHackathonId?: string, isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);

      const activeHackathon = targetHackathonId !== undefined ? targetHackathonId : hackathonFilter;
      const params = new URLSearchParams();
      if (activeHackathon && activeHackathon !== 'ALL') {
        params.append('hackathonId', activeHackathon);
      }

      const res = await fetch(`/api/v1/judge/assignments?${params.toString()}`);
      const data = await res.json();

      if (res.ok && data.data) {
        if (data.data.hackathons && data.data.hackathons.length > 0) {
          setHackathonsList(data.data.hackathons);
        }
        if (data.data.assignments && data.data.assignments.length > 0) {
          setAssignments(data.data.assignments);
        } else if (!activeHackathon || activeHackathon === 'ALL') {
          setAssignments(FALLBACK_ASSIGNMENTS);
        } else {
          setAssignments([]);
        }
      }
    } catch (e) {
      console.error('Failed to fetch assignments:', e);
      setAssignments(FALLBACK_ASSIGNMENTS);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const handleHackathonChange = (newHackathonId: string) => {
    setHackathonFilter(newHackathonId);
    setTrackFilter('ALL');
    fetchAssignments(newHackathonId);
  };

  // Compute available tracks and hackathons for dropdowns
  const availableTracks = useMemo(() => {
    const map = new Map<string, string>();
    if (hackathonFilter !== 'ALL') {
      const currentH = hackathonsList.find((h) => h.id === hackathonFilter);
      if (currentH?.tracks) {
        currentH.tracks.forEach((t: any) => map.set(t.id, t.title));
      }
    }
    assignments.forEach((a) => {
      if (a.project.track) {
        map.set(a.project.track.id, a.project.track.title);
      }
    });
    return Array.from(map.entries()).map(([id, title]) => ({ id, title }));
  }, [assignments, hackathonFilter, hackathonsList]);

  const availableHackathons = useMemo(() => {
    if (hackathonsList.length > 0) return hackathonsList;
    const map = new Map<string, string>();
    assignments.forEach((a) => {
      if (a.judge?.hackathon) {
        map.set(a.judge.hackathon.id, a.judge.hackathon.title);
      }
    });
    return Array.from(map.entries()).map(([id, title]) => ({ id, title }));
  }, [assignments, hackathonsList]);

  // KPI Calculations
  const totalAssigned = assignments.length;
  const completedCount = assignments.filter((a) => a.evaluation?.status === 'SUBMITTED').length;
  const pendingCount = totalAssigned - completedCount;
  const draftCount = assignments.filter((a) => a.evaluation?.status === 'DRAFT').length;
  const completionRate = totalAssigned > 0 ? Math.round((completedCount / totalAssigned) * 100) : 0;

  // Filtered and Sorted assignments
  const filteredAssignments = useMemo(() => {
    return assignments
      .filter((a) => {
        // Search query
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

        // Status tab
        const isCompleted = a.evaluation?.status === 'SUBMITTED';
        if (statusFilter === 'COMPLETED' && !isCompleted) return false;
        if (statusFilter === 'PENDING' && isCompleted) return false;

        // Track filter
        if (trackFilter !== 'ALL' && a.project.track?.id !== trackFilter) {
          return false;
        }

        // Hackathon filter
        if (hackathonFilter !== 'ALL' && a.judge?.hackathon?.id !== hackathonFilter) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'NAME') {
          return a.project.title.localeCompare(b.project.title);
        }
        if (sortBy === 'STATUS') {
          const aDone = a.evaluation?.status === 'SUBMITTED' ? 1 : 0;
          const bDone = b.evaluation?.status === 'SUBMITTED' ? 1 : 0;
          return aDone - bDone;
        }
        // Default NEWEST
        return new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime();
      });
  }, [assignments, searchQuery, statusFilter, trackFilter, hackathonFilter, sortBy]);

  return (
    <div className="space-y-8 select-none pb-12">
      {/* 1. Header: My Assignments & Progress */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-[#E2E8F0]">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-[#64748B] mb-1">
            <span>Judge Evaluation Workspace</span>
            <span>•</span>
            <Badge variant="emerald" icon={<ShieldCheck className="w-3 h-3" />}>
              Strict Isolation Active
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-tight">
            My Evaluation Assignments
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
            Review and score assigned project deliverables under strict blind judge isolation. Peer evaluations remain confidential.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            icon={<RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />}
            onClick={() => fetchAssignments(hackathonFilter, true)}
            disabled={refreshing || loading}
          >
            Refresh Queue
          </Button>

          <Link href="/judge/dashboard">
            <Button variant="primary" size="sm" icon={<FolderKanban className="w-3.5 h-3.5" />}>
              Judge Dashboard
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Top Metric Cards (4 KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Assigned */}
        <div className="bg-white border border-[#E2E8F0] rounded-[16px] p-5 shadow-card hover:border-[#CBD5E1] transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">
              Total Assigned
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center">
              <FolderKanban className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-black text-[#111827]">{totalAssigned}</span>
            <span className="text-xs font-semibold text-[#64748B]">projects</span>
          </div>
          <div className="mt-2 text-[11px] text-[#64748B]">
            Assigned across active judging tracks
          </div>
        </div>

        {/* KPI 2: Pending Reviews */}
        <div className="bg-white border border-[#E2E8F0] rounded-[16px] p-5 shadow-card hover:border-[#CBD5E1] transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">
              Pending Review
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-black text-[#D97706]">{pendingCount}</span>
            {draftCount > 0 && (
              <span className="text-xs font-semibold text-[#B45309]">
                ({draftCount} in draft)
              </span>
            )}
          </div>
          <div className="mt-2 text-[11px] text-[#64748B]">
            Awaiting final rubric submission
          </div>
        </div>

        {/* KPI 3: Completed Reviews */}
        <div className="bg-white border border-[#E2E8F0] rounded-[16px] p-5 shadow-card hover:border-[#CBD5E1] transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">
              Completed Reviews
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-black text-[#16A34A]">{completedCount}</span>
            <span className="text-xs font-semibold text-[#64748B]">/ {totalAssigned}</span>
          </div>
          <div className="mt-2 text-[11px] text-[#64748B]">
            Submitted and locked evaluations
          </div>
        </div>

        {/* KPI 4: Completion Rate */}
        <div className="bg-white border border-[#E2E8F0] rounded-[16px] p-5 shadow-card hover:border-[#CBD5E1] transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">
              Completion Rate
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#F3E8FF] text-[#9333EA] flex items-center justify-center">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-black text-[#111827]">{completionRate}%</span>
            <span className="text-xs font-semibold text-[#64748B]">evaluated</span>
          </div>
          <div className="mt-2.5 w-full bg-[#F1F5F9] rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-[#2563EB] h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="bg-white border border-[#E2E8F0] rounded-[16px] p-4 shadow-card space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by project name, team, track, or problem statement code..."
              className="w-full pl-10 pr-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#CBD5E1] focus:border-[#2563EB] focus:bg-white rounded-xl text-xs sm:text-sm text-[#111827] placeholder-[#94A3B8] focus:outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#94A3B8] hover:text-[#475569] font-medium"
              >
                Clear
              </button>
            )}
          </div>

          {/* Filters & Sort */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Hackathon Selector */}
            <select
              value={hackathonFilter}
              onChange={(e) => handleHackathonChange(e.target.value)}
              className="px-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs font-bold text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
            >
              <option value="ALL">All Hackathon Events</option>
              {availableHackathons.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.title}
                </option>
              ))}
            </select>

            {/* Track Selector */}
            {availableTracks.length > 0 && (
              <select
                value={trackFilter}
                onChange={(e) => setTrackFilter(e.target.value)}
                className="px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs font-semibold text-[#334155] focus:outline-none focus:border-[#2563EB]"
              >
                <option value="ALL">All Tracks</option>
                {availableTracks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
            )}

            {/* Sort Selector */}
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs font-semibold text-[#334155] focus:outline-none focus:border-[#2563EB]"
            >
              <option value="NEWEST">Newest Assigned</option>
              <option value="NAME">Project Title (A-Z)</option>
              <option value="STATUS">Pending First</option>
            </select>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center space-x-2 pt-2 border-t border-[#F1F5F9] overflow-x-auto">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
              statusFilter === 'ALL'
                ? 'bg-[#2563EB] text-white shadow-sm'
                : 'bg-[#F8FAFC] text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#111827]'
            }`}
          >
            <span>All Assignments</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              statusFilter === 'ALL' ? 'bg-white/20 text-white' : 'bg-[#E2E8F0] text-[#475569]'
            }`}>
              {totalAssigned}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter('PENDING')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
              statusFilter === 'PENDING'
                ? 'bg-[#D97706] text-white shadow-sm'
                : 'bg-[#F8FAFC] text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#111827]'
            }`}
          >
            <span>Pending Evaluation</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              statusFilter === 'PENDING' ? 'bg-white/20 text-white' : 'bg-[#FEF3C7] text-[#B45309]'
            }`}>
              {pendingCount}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter('COMPLETED')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
              statusFilter === 'COMPLETED'
                ? 'bg-[#16A34A] text-white shadow-sm'
                : 'bg-[#F8FAFC] text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#111827]'
            }`}
          >
            <span>Evaluations Completed</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              statusFilter === 'COMPLETED' ? 'bg-white/20 text-white' : 'bg-[#DCFCE7] text-[#15803D]'
            }`}>
              {completedCount}
            </span>
          </button>

          {(searchQuery || statusFilter !== 'ALL' || trackFilter !== 'ALL' || hackathonFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('ALL');
                setTrackFilter('ALL');
                setHackathonFilter('ALL');
              }}
              className="text-xs font-semibold text-[#2563EB] hover:underline px-2 ml-auto"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* 4. Assignments Grid / List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#111827]">
            Assigned Queue ({filteredAssignments.length})
          </h2>
          <span className="text-xs text-[#64748B]">
            Showing {filteredAssignments.length} of {totalAssigned} assignments
          </span>
        </div>

        {filteredAssignments.length === 0 ? (
          <div className="bg-white border border-[#E2E8F0] rounded-[16px] p-12 text-center shadow-card space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center mx-auto">
              <Scale className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-[#111827]">No assignments match your criteria</h3>
              <p className="text-xs text-[#64748B] max-w-md mx-auto">
                {searchQuery || statusFilter !== 'ALL'
                  ? 'Try adjusting your search terms or clearing active filters to see all assigned deliverables.'
                  : 'You do not have any active project evaluation assignments yet. Organizers assign submissions based on track expertise.'}
              </p>
            </div>
            {(searchQuery || statusFilter !== 'ALL' || trackFilter !== 'ALL') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('ALL');
                  setTrackFilter('ALL');
                  setHackathonFilter('ALL');
                }}
              >
                Clear All Filters
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredAssignments.map((a) => {
              const isCompleted = a.evaluation?.status === 'SUBMITTED';
              const isDraft = a.evaluation?.status === 'DRAFT';
              const trackColor = a.project.track?.colorHex || '#2563EB';

              return (
                <div
                  key={a.id}
                  className="bg-white border border-[#E2E8F0] hover:border-[#93C5FD] rounded-[18px] p-5 sm:p-6 shadow-card hover:shadow-card-hover transition-all duration-200 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6"
                >
                  {/* Left Column: Project Details */}
                  <div className="space-y-3 flex-1 min-w-0">
                    {/* Top Badges */}
                    <div className="flex flex-wrap items-center gap-2">
                      {a.project.track && (
                        <span
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border"
                          style={{
                            backgroundColor: `${trackColor}15`,
                            color: trackColor,
                            borderColor: `${trackColor}30`,
                          }}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full mr-1.5"
                            style={{ backgroundColor: trackColor }}
                          />
                          {a.project.track.title}
                        </span>
                      )}

                      {a.project.problemStatement && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F1F5F9] text-[#334155] border border-[#E2E8F0]">
                          <strong className="font-extrabold mr-1 text-[#0F172A]">
                            [{a.project.problemStatement.code}]
                          </strong>
                          <span className="truncate max-w-[200px] sm:max-w-none">
                            {a.project.problemStatement.title}
                          </span>
                        </span>
                      )}

                      {/* Status Badges */}
                      {isCompleted ? (
                        <Badge variant="emerald" icon={<CheckCircle2 className="w-3.5 h-3.5" />}>
                          Evaluated: {a.evaluation?.weightedScore} / 100
                        </Badge>
                      ) : isDraft ? (
                        <Badge variant="amber" icon={<Clock className="w-3.5 h-3.5" />}>
                          Draft in Progress ({a.evaluation?.weightedScore || 0} pts)
                        </Badge>
                      ) : (
                        <Badge variant="blue" icon={<Clock className="w-3.5 h-3.5" />}>
                          Pending Evaluation
                        </Badge>
                      )}
                    </div>

                    {/* Title & Tagline */}
                    <div>
                      <h3 className="text-lg font-bold text-[#111827] group-hover:text-[#2563EB] transition-colors leading-snug">
                        {a.project.title}
                      </h3>
                      {a.project.tagline && (
                        <p className="text-xs text-[#475569] mt-1 line-clamp-2 leading-relaxed">
                          {a.project.tagline}
                        </p>
                      )}
                    </div>

                    {/* Team & Meta Row */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[#64748B]">
                      {a.project.team && (
                        <div className="flex items-center space-x-1.5">
                          <Users className="w-3.5 h-3.5 text-[#94A3B8]" />
                          <span className="font-semibold text-[#1E293B]">
                            {a.project.team.name}
                          </span>
                        </div>
                      )}

                      {a.judge?.hackathon && (
                        <div className="flex items-center space-x-1">
                          <span>Event:</span>
                          <span className="font-medium text-[#475569]">
                            {a.judge.hackathon.title}
                          </span>
                        </div>
                      )}

                      {a.project.submissions && a.project.submissions.length > 0 && (
                        <span className="text-[11px] px-2 py-0.5 rounded bg-[#F8FAFC] border border-[#E2E8F0] font-medium text-[#64748B]">
                          Submission v{a.project.submissions[0].versionNumber}
                        </span>
                      )}
                    </div>

                    {/* Tech Stack Pills */}
                    {a.project.techStack && a.project.techStack.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {a.project.techStack.slice(0, 5).map((tech) => (
                          <span
                            key={tech}
                            className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-[#F8FAFC] text-[#475569] border border-[#E2E8F0]"
                          >
                            {tech}
                          </span>
                        ))}
                        {a.project.techStack.length > 5 && (
                          <span className="px-1.5 py-0.5 rounded-md text-[10px] font-semibold text-[#94A3B8] bg-[#F1F5F9]">
                            +{a.project.techStack.length - 5}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Deliverables quick links */}
                    <div className="flex items-center space-x-4 pt-1 text-xs">
                      {a.project.repoUrl && (
                        <a
                          href={a.project.repoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center text-[#2563EB] hover:text-[#1D4ED8] hover:underline font-semibold transition-colors"
                        >
                          <Github className="w-3.5 h-3.5 mr-1" />
                          Source Code
                          <ExternalLink className="w-3 h-3 ml-1 opacity-70" />
                        </a>
                      )}
                      {a.project.demoUrl && (
                        <a
                          href={a.project.demoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center text-[#059669] hover:text-[#047857] hover:underline font-semibold transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5 mr-1" />
                          Live Demo
                          <ExternalLink className="w-3 h-3 ml-1 opacity-70" />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Right Column: CTA Button */}
                  <div className="w-full lg:w-auto flex flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-center gap-3 pt-4 lg:pt-0 border-t lg:border-t-0 border-[#F1F5F9] flex-shrink-0">
                    <div className="text-left lg:text-right">
                      <span className="block text-[11px] text-[#64748B]">
                        Assigned on {new Date(a.assignedAt).toLocaleDateString()}
                      </span>
                      {isCompleted && a.evaluation?.submittedAt && (
                        <span className="block text-[10px] text-[#16A34A] font-semibold">
                          Submitted {new Date(a.evaluation.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>

                    <Link href={`/judge/assignments/${a.id}`} className="w-full sm:w-auto">
                      <Button
                        variant={isCompleted ? 'outline' : isDraft ? 'secondary' : 'primary'}
                        size="md"
                        icon={
                          isCompleted ? (
                            <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
                          ) : (
                            <Scale className="w-4 h-4" />
                          )
                        }
                        className="w-full sm:w-auto min-w-[170px] justify-center"
                      >
                        {isCompleted
                          ? 'Review Evaluation'
                          : isDraft
                          ? 'Resume Draft'
                          : 'Start Evaluation'}
                      </Button>
                    </Link>
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

export default function JudgeAssignmentsPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-8 select-none pb-12 animate-pulse">
          <div className="h-14 bg-slate-100 rounded-2xl w-1/3" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 bg-slate-100 rounded-[16px]" />
            ))}
          </div>
          <div className="h-24 bg-slate-100 rounded-[16px]" />
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-44 bg-slate-100 rounded-[18px]" />
            ))}
          </div>
        </div>
      }
    >
      <JudgeAssignmentsContent />
    </Suspense>
  );
}
