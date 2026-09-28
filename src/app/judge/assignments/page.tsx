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
  Eye,
  Calendar,
  MoreVertical,
  Award,
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
    assignedAt: '2026-09-28T12:00:00.000Z',
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
    status: 'IN_PROGRESS',
    assignedAt: '2026-09-28T10:00:00.000Z',
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
      slug: 'neurosync-graph',
      tagline: 'Zero-knowledge cross-institutional healthcare model training at planetary scale.',
      description: 'A decentralized federated graph neural network enabling multi-hospital cancer marker discovery without raw patient record exchange.',
      repoUrl: 'https://github.com/dogfood/neurosync',
      demoUrl: 'https://neurosync.health',
      techStack: ['Python', 'PyTorch', 'PostgreSQL', 'Docker', 'FastAPI'],
      track: { id: 'trk_2', title: 'Zero-Knowledge & Privacy', colorHex: '#06B6D4' },
      problemStatement: { id: 'ps_2', title: 'Cross-Hospital Model Aggregation', code: 'ZK-01' },
      team: { id: 'tm_2', name: 'ZeroKnowledge Guild' },
      submissions: [{ versionNumber: 2 }],
    },
    evaluation: {
      id: 'eval_2',
      status: 'DRAFT',
      rawScoreSum: 78.0,
      weightedScore: 78.0,
    },
  },
  {
    id: 'asgn_3',
    status: 'ASSIGNED',
    assignedAt: '2026-09-28T09:00:00.000Z',
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
      id: 'proj_flowmesh',
      title: 'FlowMesh: Distributed Agent Task Coordination Framework',
      slug: 'flowmesh-engine',
      tagline: 'Scalable multi-agent coordination for complex real-world workflows.',
      description: 'Low-overhead DAG orchestrator coordinating high-concurrency micro-agents with Byzantine fault tolerance and verifiable consensus logs.',
      repoUrl: 'https://github.com/dogfood/flowmesh',
      demoUrl: 'https://flowmesh.app',
      techStack: ['Go', 'TypeScript', 'gRPC', 'Redis', 'TailwindCSS'],
      track: { id: 'trk_1', title: 'Autonomous AI Agents', colorHex: '#8B5CF6' },
      problemStatement: { id: 'ps_3', title: 'High-Concurrency Task Pipeline', code: 'AI-03' },
      team: { id: 'tm_3', name: 'Cognitive Flow' },
      submissions: [{ versionNumber: 1 }],
    },
    evaluation: null,
  },
  {
    id: 'asgn_4',
    status: 'COMPLETED',
    assignedAt: '2026-09-27T16:00:00.000Z',
    completedAt: '2026-09-28T14:00:00.000Z',
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
      problemStatement: { id: 'ps_4', title: 'Sub-Second Clinical Diagnostic Retrieval', code: 'AI-02' },
      team: { id: 'tm_4', name: 'Team VeriClinical' },
      submissions: [{ versionNumber: 1 }],
    },
    evaluation: {
      id: 'eval_4',
      status: 'SUBMITTED',
      rawScoreSum: 92.5,
      weightedScore: 92.5,
      submittedAt: '2026-09-28T14:00:00.000Z',
    },
  },
];

// Project Glowing Thumbnail Graphic based on project ID / title
function AssignmentThumbnail({
  projectId,
  title,
  status,
  score,
}: {
  projectId: string;
  title: string;
  status: 'COMPLETED' | 'DRAFT' | 'PENDING';
  score?: number;
}) {
  const isSecurity = projectId.includes('sentinel') || title.toLowerCase().includes('shield');
  const isBrain = projectId.includes('neuro') || title.toLowerCase().includes('neural') || title.toLowerCase().includes('graph');
  const isCubes = projectId.includes('flow') || title.toLowerCase().includes('mesh');

  return (
    <div className="w-full xl:w-56 h-36 rounded-2xl bg-gradient-to-br from-[#0B0F19] via-[#0F172A] to-[#1E1B4B] border border-cyan-500/20 shadow-inner flex items-center justify-center relative overflow-hidden flex-shrink-0 group">
      {/* Background radial ambient glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.25)_0%,transparent_70%)]" />

      {/* Floating Status Pill on top of thumbnail */}
      <div className="absolute top-2.5 left-2.5 z-20">
        {status === 'COMPLETED' ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Evaluation Locked ({score} pts)
          </span>
        ) : status === 'DRAFT' ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/80 text-amber-300 border border-amber-500/40 backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            Draft in Progress
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/80 text-amber-300 border border-amber-500/40 backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            Pending Evaluation
          </span>
        )}
      </div>

      {/* Center Artwork */}
      {isSecurity ? (
        <svg className="w-16 h-16 text-cyan-400 drop-shadow-[0_0_12px_rgba(6,182,212,0.8)] z-10 transition-transform duration-300 group-hover:scale-105" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="m9 12 2 2 4-4" stroke="#06B6D4" strokeWidth="2" />
        </svg>
      ) : isBrain ? (
        <svg className="w-16 h-16 text-cyan-300 drop-shadow-[0_0_12px_rgba(6,182,212,0.8)] z-10 transition-transform duration-300 group-hover:scale-105" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="8" />
          <path d="M12 4a8 8 0 0 1 8 8" />
          <circle cx="12" cy="12" r="3" fill="#06B6D4" fillOpacity="0.4" />
          <path d="M8 12h8M12 8v8" />
        </svg>
      ) : isCubes ? (
        <svg className="w-16 h-16 text-amber-400 drop-shadow-[0_0_12px_rgba(245,158,11,0.8)] z-10 transition-transform duration-300 group-hover:scale-105" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="m21.12 6.4-6-3.87a3.06 3.06 0 0 0-3.24 0l-6 3.87a3.06 3.06 0 0 0-1.44 2.64v7.74a3.06 3.06 0 0 0 1.44 2.64l6 3.87a3.06 3.06 0 0 0 3.24 0l6-3.87a3.06 3.06 0 0 0 1.44-2.64V9.04a3.06 3.06 0 0 0-1.44-2.64Z" />
          <path d="m3.5 7.5 8.5 5 8.5-5" />
          <path d="M12 12.5V22" />
        </svg>
      ) : (
        <svg className="w-16 h-16 text-indigo-400 drop-shadow-[0_0_12px_rgba(99,102,241,0.8)] z-10 transition-transform duration-300 group-hover:scale-105" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="m10 15 5-3-5-3v6Z" fill="#818CF8" />
        </svg>
      )}
    </div>
  );
}

function JudgeAssignmentsContent() {
  const searchParams = useSearchParams();
  const initialHackathonId = searchParams.get('hackathonId') || 'ALL';

  const [assignments, setAssignments] = useState<AssignmentItem[]>(FALLBACK_ASSIGNMENTS);
  const [hackathonsList, setHackathonsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'COMPLETED'>('ALL');
  const [trackFilter, setTrackFilter] = useState('ALL');
  const [hackathonFilter, setHackathonFilter] = useState(initialHackathonId);
  const [sortBy, setSortBy] = useState<'NEWEST' | 'NAME' | 'STATUS'>('NEWEST');

  const fetchAssignments = async (targetHackathonId: string = hackathonFilter, isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);

      const url =
        targetHackathonId && targetHackathonId !== 'ALL'
          ? `/api/v1/judge/assignments?hackathonId=${targetHackathonId}`
          : `/api/v1/judge/assignments`;

      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        if (json.data && json.data.assignments && json.data.assignments.length > 0) {
          setAssignments(json.data.assignments);
          if (json.data.hackathons) {
            setHackathonsList(json.data.hackathons);
          }
        } else {
          setAssignments(FALLBACK_ASSIGNMENTS);
        }
      } else {
        setAssignments(FALLBACK_ASSIGNMENTS);
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

  const availableTracks = useMemo(() => {
    const map = new Map<string, string>();
    assignments.forEach((a) => {
      if (a.project.track) {
        map.set(a.project.track.id, a.project.track.title);
      }
    });
    return Array.from(map.entries()).map(([id, title]) => ({ id, title }));
  }, [assignments]);

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

        const isCompleted = a.evaluation?.status === 'SUBMITTED';
        if (statusFilter === 'COMPLETED' && !isCompleted) return false;
        if (statusFilter === 'PENDING' && isCompleted) return false;

        if (trackFilter !== 'ALL' && a.project.track?.id !== trackFilter) {
          return false;
        }

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
        return new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime();
      });
  }, [assignments, searchQuery, statusFilter, trackFilter, hackathonFilter, sortBy]);

  return (
    <div className="space-y-6 select-none max-w-[1400px] mx-auto pb-12">
      {/* 1. Header: My Evaluation Assignments & Action Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-orange-50 text-orange-600 border border-orange-200">
              Jury Workspace
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Strict Isolation Active
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
            My Evaluation Assignments
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1 font-normal">
            Review and score assigned project deliverables under strict blind judge isolation. Peer evaluations remain confidential.
          </p>
        </div>

        {/* Right Toolbar Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Event Dropdown Selector */}
          <div className="flex items-center bg-white border border-[#E2E8F0] rounded-xl px-3 py-1.5 shadow-xs">
            <span className="text-xs text-[#64748B] mr-2 font-medium">Event:</span>
            <select
              value={hackathonFilter}
              onChange={(e) => handleHackathonChange(e.target.value)}
              className="bg-transparent text-xs font-bold text-[#0F172A] focus:outline-none cursor-pointer pr-2"
            >
              <option value="ALL">🏆 All Hackathons ({totalAssigned} assigned)</option>
              {availableHackathons.map((h) => (
                <option key={h.id} value={h.id}>
                  🏆 {h.title}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => fetchAssignments(hackathonFilter, true)}
            disabled={refreshing || loading}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] text-xs font-bold text-[#334155] rounded-xl shadow-xs transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-orange-500 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>

          <Link href="/judge/dashboard">
            <button className="flex items-center gap-2 px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-xs font-bold text-white rounded-xl shadow-md shadow-blue-500/20 transition cursor-pointer">
              <FolderKanban className="w-3.5 h-3.5" />
              <span>Judge Dashboard</span>
            </button>
          </Link>
        </div>
      </div>

      {/* 2. Top Metric Cards (4 KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Assigned */}
        <div className="bg-white border border-[#E2E8F0] rounded-[18px] p-5 shadow-xs hover:border-[#CBD5E1] transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
              Total Assigned
            </span>
            <div className="w-8 h-8 rounded-full bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center">
              <FileCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-black text-[#0F172A]">{totalAssigned}</span>
            <span className="text-xs font-semibold text-[#64748B]">projects</span>
          </div>
          <div className="mt-2 text-[11px] text-[#64748B]">
            Assigned across active judging tracks
          </div>
        </div>

        {/* KPI 2: Pending Review */}
        <div className="bg-white border border-[#E2E8F0] rounded-[18px] p-5 shadow-xs hover:border-[#CBD5E1] transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
              Pending Review
            </span>
            <div className="w-8 h-8 rounded-full bg-[#FFF7ED] text-[#EA580C] flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-black text-[#EA580C]">{pendingCount}</span>
            {draftCount > 0 && (
              <span className="text-xs font-bold text-[#EA580C]">
                ({draftCount} in draft)
              </span>
            )}
          </div>
          <div className="mt-2 text-[11px] text-[#64748B]">
            Awaiting final rubric submission
          </div>
        </div>

        {/* KPI 3: Completed Reviews */}
        <div className="bg-white border border-[#E2E8F0] rounded-[18px] p-5 shadow-xs hover:border-[#CBD5E1] transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
              Completed Reviews
            </span>
            <div className="w-8 h-8 rounded-full bg-[#ECFDF5] text-[#059669] flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-black text-[#059669]">{completedCount}</span>
            <span className="text-xs font-semibold text-[#64748B]">/ {totalAssigned}</span>
          </div>
          <div className="mt-2 text-[11px] text-[#64748B]">
            Submitted and locked evaluations
          </div>
        </div>

        {/* KPI 4: Completion Rate */}
        <div className="bg-white border border-[#E2E8F0] rounded-[18px] p-5 shadow-xs hover:border-[#CBD5E1] transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
              Completion Rate
            </span>
            <div className="w-8 h-8 rounded-full bg-[#FAF5FF] text-[#9333EA] flex items-center justify-center">
              <Star className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-black text-[#0F172A]">{completionRate}%</span>
            <span className="text-xs font-semibold text-[#64748B]">evaluated</span>
          </div>
          <div className="mt-2.5 w-full bg-[#F1F5F9] rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-[#EA580C] h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${completionRate}%` }}
            />
          </div>
          <div className="mt-1.5 text-[10px] text-[#64748B]">
            {completedCount} of {totalAssigned} completed
          </div>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="bg-white border border-[#E2E8F0] rounded-[18px] p-4 shadow-xs space-y-3.5">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by project name, team, track, or problem statement code..."
              className="w-full pl-10 pr-4 py-2 bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#CBD5E1] focus:border-[#2563EB] focus:bg-white rounded-xl text-xs text-[#0F172A] placeholder-[#94A3B8] focus:outline-none transition-all"
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

          {/* Dropdown Selectors */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={hackathonFilter}
              onChange={(e) => handleHackathonChange(e.target.value)}
              className="px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs font-semibold text-[#0F172A] focus:outline-none focus:border-[#2563EB] cursor-pointer"
            >
              <option value="ALL">All Hackathon Events</option>
              {availableHackathons.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.title}
                </option>
              ))}
            </select>

            <select
              value={trackFilter}
              onChange={(e) => setTrackFilter(e.target.value)}
              className="px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs font-semibold text-[#334155] focus:outline-none focus:border-[#2563EB] cursor-pointer"
            >
              <option value="ALL">All Tracks</option>
              {availableTracks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs font-semibold text-[#334155] focus:outline-none focus:border-[#2563EB] cursor-pointer"
            >
              <option value="NEWEST">Newest Assigned</option>
              <option value="NAME">Project Title (A-Z)</option>
              <option value="STATUS">Pending First</option>
            </select>
          </div>
        </div>

        {/* Quick Filter Pill Buttons */}
        <div className="flex items-center space-x-2 pt-2 border-t border-[#F1F5F9] overflow-x-auto">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
              statusFilter === 'ALL'
                ? 'bg-[#EA580C] text-white shadow-xs'
                : 'bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0] hover:text-[#0F172A]'
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
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
              statusFilter === 'PENDING'
                ? 'bg-[#EA580C] text-white shadow-xs'
                : 'bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0] hover:text-[#0F172A]'
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
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
              statusFilter === 'COMPLETED'
                ? 'bg-[#EA580C] text-white shadow-xs'
                : 'bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0] hover:text-[#0F172A]'
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
              className="text-xs font-semibold text-[#2563EB] hover:underline px-2 ml-auto cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* 4. Assigned Queue List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-[#0F172A]">
            Assigned Queue ({filteredAssignments.length})
          </h2>
          <span className="text-xs font-bold text-[#EA580C]">
            Showing {filteredAssignments.length} of {totalAssigned} assignments
          </span>
        </div>

        {filteredAssignments.length === 0 ? (
          <div className="bg-white border border-[#E2E8F0] rounded-[18px] p-12 text-center shadow-xs space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center mx-auto">
              <Scale className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-[#0F172A]">No assignments match your criteria</h3>
              <p className="text-xs text-[#64748B] max-w-md mx-auto">
                Try adjusting your search terms or clearing active filters to see all assigned deliverables.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredAssignments.map((a) => {
              const isCompleted = a.evaluation?.status === 'SUBMITTED';
              const isDraft = a.evaluation?.status === 'DRAFT';
              const status: 'COMPLETED' | 'DRAFT' | 'PENDING' = isCompleted
                ? 'COMPLETED'
                : isDraft
                ? 'DRAFT'
                : 'PENDING';

              return (
                <div
                  key={a.id}
                  className="bg-white border border-[#E2E8F0] border-l-4 border-l-[#EA580C] hover:border-slate-300 rounded-[20px] p-5 sm:p-6 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6"
                >
                  {/* Left Column: Glowing Artwork Thumbnail */}
                  <AssignmentThumbnail
                    projectId={a.project.id}
                    title={a.project.title}
                    status={status}
                    score={a.evaluation?.weightedScore}
                  />

                  {/* Middle Column: Metadata, Title, Description, Tech Stack */}
                  <div className="space-y-2 flex-1 min-w-0">
                    {/* Track & Problem Statement Badges */}
                    <div className="flex flex-wrap items-center gap-2">
                      {a.project.track && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#7C3AED] mr-1.5" />
                          {a.project.track.title}
                        </span>
                      )}

                      {a.project.problemStatement && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F8FAFC] text-[#334155] border border-[#E2E8F0]">
                          <strong className="font-extrabold mr-1 text-[#0F172A]">
                            [{a.project.problemStatement.code}]
                          </strong>
                          <span className="truncate max-w-[200px] sm:max-w-none text-xs">
                            {a.project.problemStatement.title}
                          </span>
                        </span>
                      )}
                    </div>

                    {/* Project Title */}
                    <div>
                      <h3 className="text-base sm:text-lg font-extrabold text-[#0F172A] leading-snug">
                        {a.project.title}
                      </h3>
                      <p className="text-xs text-[#64748B] mt-0.5 line-clamp-2 leading-relaxed">
                        {a.project.tagline || a.project.description}
                      </p>
                    </div>

                    {/* Team & Hackathon Meta Line */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#64748B]">
                      {a.project.team && (
                        <div className="flex items-center space-x-1 font-semibold text-[#334155]">
                          <Users className="w-3.5 h-3.5 text-[#64748B]" />
                          <span>Team {a.project.team.name}</span>
                        </div>
                      )}

                      <span>•</span>

                      {a.judge?.hackathon && (
                        <span>Event: {a.judge.hackathon.title}</span>
                      )}

                      {a.project.submissions && a.project.submissions.length > 0 && (
                        <span className="text-[11px] px-2 py-0.5 rounded bg-[#F8FAFC] border border-[#E2E8F0] font-medium text-[#64748B]">
                          Submission v{a.project.submissions[0].versionNumber}
                        </span>
                      )}
                    </div>

                    {/* Tech Stack Pills & Action Links */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {a.project.techStack?.map((tech, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md text-[11px] font-medium text-[#475569]"
                        >
                          {tech}
                        </span>
                      ))}

                      {a.project.repoUrl && (
                        <a
                          href={a.project.repoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-xs font-semibold text-[#2563EB] hover:underline ml-2 gap-1"
                        >
                          <Github className="w-3.5 h-3.5 text-[#2563EB]" />
                          <span>Source Code</span>
                        </a>
                      )}

                      {a.project.demoUrl && (
                        <a
                          href={a.project.demoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-xs font-semibold text-[#2563EB] hover:underline ml-2 gap-1"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-[#2563EB]" />
                          <span>Live Demo</span>
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Deadlines & Action Buttons */}
                  <div className="flex flex-col items-start xl:items-end justify-between space-y-4 w-full xl:w-auto flex-shrink-0 pt-2 xl:pt-0 border-t xl:border-t-0 border-[#F1F5F9]">
                    <div className="flex items-center justify-between w-full xl:w-auto gap-4">
                      <div className="flex items-center gap-1.5 text-xs text-[#64748B]">
                        <Calendar className="w-3.5 h-3.5 text-[#94A3B8]" />
                        <span>Assigned on Sep 28, 2026</span>
                      </div>
                      <button className="p-1 rounded text-[#94A3B8] hover:text-[#0F172A] transition cursor-pointer">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-[#EA580C] font-semibold">
                      <Clock className="w-3.5 h-3.5 text-[#EA580C]" />
                      <span>
                        {isCompleted
                          ? 'Review Submitted & Verified'
                          : isDraft
                          ? 'Review Deadline Oct 04, 2026 (6 days left)'
                          : 'Review Deadline Oct 05, 2026 (7 days left)'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 w-full xl:w-auto">
                      <Link
                        href={`/judge/evaluations/${a.project.id}`}
                        className="flex-1 xl:flex-none"
                      >
                        <button
                          className={`w-full xl:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-md transition cursor-pointer ${
                            isCompleted
                              ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                              : 'bg-[#EA580C] hover:bg-[#C2410C] shadow-orange-500/20'
                          }`}
                        >
                          <Scale className="w-4 h-4" />
                          <span>
                            {isCompleted
                              ? 'View Evaluation'
                              : isDraft
                              ? 'Resume Draft'
                              : 'Start Evaluation'}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </Link>

                      <Link href={`/judge/evaluations/${a.project.id}`}>
                        <button
                          className="p-2.5 rounded-xl border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#64748B] hover:text-[#0F172A] transition cursor-pointer"
                          title="Quick View"
                        >
                          <Eye className="w-4 h-4" />
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

export default function JudgeAssignmentsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-xs text-[#64748B]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2563EB] mx-auto mb-3" />
          Loading assignments workspace...
        </div>
      }
    >
      <JudgeAssignmentsContent />
    </Suspense>
  );
}
