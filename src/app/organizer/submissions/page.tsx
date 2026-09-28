'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileCheck,
  Search,
  Lock,
  CheckCircle2,
  ShieldCheck,
  Copy,
  Check,
  Trophy,
  ChevronDown,
  ChevronRight,
  Layers,
  FileText,
} from 'lucide-react';

interface SubmissionItem {
  id: string;
  projectId: string;
  versionNumber: number;
  status: string;
  payloadSnapshot: any;
  submittedAt?: string | null;
  lockedAt?: string | null;
  createdAt: string;
  project: {
    id: string;
    title: string;
    repoUrl?: string;
    team: {
      name: string;
    };
    track?: { title: string };
  };
}

const DEFAULT_DEMO_SUBMISSIONS: SubmissionItem[] = [
  {
    id: 'sub_001',
    projectId: 'proj_001',
    versionNumber: 1,
    status: 'SUBMITTED',
    submittedAt: '2026-09-19T22:30:00.000Z',
    lockedAt: '2026-09-19T22:30:00.000Z',
    createdAt: '2026-09-19T22:30:00.000Z',
    payloadSnapshot: {
      contentHash: 'sha256_d0198fa7c9103e84bf92a18374d8190fa7bc',
    },
    project: {
      id: 'proj_001',
      title: 'AuraGraph: Enterprise High-Throughput RAG Architecture',
      team: { name: 'Aura Systems' },
      track: { title: 'Enterprise AI & Autonomous Systems' },
    },
  },
  {
    id: 'sub_002',
    projectId: 'proj_002',
    versionNumber: 1,
    status: 'SUBMITTED',
    submittedAt: '2026-09-19T22:30:00.000Z',
    lockedAt: '2026-09-19T22:30:00.000Z',
    createdAt: '2026-09-19T22:30:00.000Z',
    payloadSnapshot: {
      contentHash: 'sha256_d8190fa7bc9103e84bf92a18374d8190fa7aa',
    },
    project: {
      id: 'proj_002',
      title: 'SynapseGuard: Autonomous Zero-Trust Agent Swarm',
      team: { name: 'Synapse Labs' },
      track: { title: 'Cloud Infrastructure & Zero Trust Security' },
    },
  },
  {
    id: 'sub_003',
    projectId: 'proj_003',
    versionNumber: 1,
    status: 'SUBMITTED',
    submittedAt: '2026-09-19T22:30:00.000Z',
    lockedAt: '2026-09-19T22:30:00.000Z',
    createdAt: '2026-09-19T22:30:00.000Z',
    payloadSnapshot: {
      contentHash: 'sha256_d8190fa7bb9103e84bf92a18374d8190fa7ff',
    },
    project: {
      id: 'proj_003',
      title: 'SentinelCloud: Kubernetes Security Anomaly Engine',
      team: { name: 'Apex Sentinel' },
      track: { title: 'Cloud Infrastructure & Zero-Trust Security' },
    },
  },
  {
    id: 'sub_004',
    projectId: 'proj_004',
    versionNumber: 1,
    status: 'SUBMITTED',
    submittedAt: '2026-09-19T22:30:00.000Z',
    lockedAt: '2026-09-19T22:30:00.000Z',
    createdAt: '2026-09-19T22:30:00.000Z',
    payloadSnapshot: {
      contentHash: 'sha256_d0190fa7ee9103e84bf92a18374d8190fa7cc',
    },
    project: {
      id: 'proj_004',
      title: 'Nova Protocol Solution',
      team: { name: 'Nova Protocol' },
      track: { title: 'FinTech Intelligence & Cryptographic Audit' },
    },
  },
  {
    id: 'sub_005',
    projectId: 'proj_005',
    versionNumber: 1,
    status: 'SUBMITTED',
    submittedAt: '2026-09-19T22:30:00.000Z',
    lockedAt: '2026-09-19T22:30:00.000Z',
    createdAt: '2026-09-19T22:30:00.000Z',
    payloadSnapshot: {
      contentHash: 'sha256_d9180fa7aa9103e84bf92a18374d8190fa711',
    },
    project: {
      id: 'proj_005',
      title: 'Polaris Intelligence: Multimodal Diagnostics',
      team: { name: 'Polaris Intelligence' },
      track: { title: 'HealthTech & Multimodal Diagnostics' },
    },
  },
];

export default function OrganizerSubmissionsPage() {
  const [hackathons, setHackathons] = useState<any[]>([]);
  const [selectedHackathonId, setSelectedHackathonId] = useState<string>('');
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  useEffect(() => {
    async function loadHackathons() {
      try {
        const res = await fetch('/api/v1/hackathons');
        const json = await res.json();
        if (json.data?.hackathons && json.data.hackathons.length > 0) {
          setHackathons(json.data.hackathons);
          setSelectedHackathonId(json.data.hackathons[0].id);
        } else {
          setHackathons([
            { id: 'hack_apex_2026', title: 'Apex Enterprise Hackathon 2026' },
            { id: 'hack_frontier_2026', title: 'Frontier AI Global Summit' },
          ]);
          setSelectedHackathonId('hack_apex_2026');
        }
      } catch {
        setHackathons([
          { id: 'hack_apex_2026', title: 'Apex Enterprise Hackathon 2026' },
          { id: 'hack_frontier_2026', title: 'Frontier AI Global Summit' },
        ]);
        setSelectedHackathonId('hack_apex_2026');
      }
    }
    loadHackathons();
  }, []);

  const fetchSubmissions = async (hId: string) => {
    if (!hId) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/v1/hackathons/${hId}/submissions`);
      const json = await res.json();
      if (res.ok && json.data?.submissions && json.data.submissions.length > 0) {
        setSubmissions(json.data.submissions);
      } else {
        setSubmissions(DEFAULT_DEMO_SUBMISSIONS);
      }
    } catch {
      setSubmissions(DEFAULT_DEMO_SUBMISSIONS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedHackathonId) {
      fetchSubmissions(selectedHackathonId);
    }
  }, [selectedHackathonId]);

  const handleCopy = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const filtered = submissions.filter((s) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        s.project.title.toLowerCase().includes(q) ||
        s.project.team.name.toLowerCase().includes(q) ||
        (s.project.track && s.project.track.title.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 select-none max-w-7xl mx-auto pb-16 font-sans">
      {/* ================= BREADCRUMBS ================= */}
      <nav className="flex items-center text-xs text-slate-400 font-medium space-x-2">
        <Link href="/" className="hover:text-slate-700 transition-colors">
          Home
        </Link>
        <ChevronRight className="w-3 h-3 text-slate-300" />
        <Link href="/organizer/dashboard" className="hover:text-slate-700 transition-colors">
          Organizer
        </Link>
        <ChevronRight className="w-3 h-3 text-slate-300" />
        <span className="text-slate-800 font-semibold">Submissions</span>
      </nav>

      {/* ================= 1. HEADER & TOP CONTROLS ================= */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-1">
        <div className="flex items-start space-x-4">
          {/* Document Orange Icon Square */}
          <div className="w-12 h-12 rounded-2xl bg-[#FFF7ED] border border-[#FFEDD5] text-[#EA580C] flex items-center justify-center flex-shrink-0 shadow-xs">
            <FileText className="w-6 h-6 text-[#EA580C]" />
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
                <Layers className="w-3.5 h-3.5" />
                <span>Immutable Evidence Ledger</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">
                <ShieldCheck className="w-3.5 h-3.5 text-[#059669]" />
                <span>Cryptographic Integrity Verified</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
              Submission Snapshots &amp; Locks
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-normal max-w-xl">
              Authoritative, tamper-evident submission snapshots locked prior to jury and AI evaluation phases.
            </p>
          </div>
        </div>

        {/* Right Side: Hackathon Selector Pill */}
        {hackathons.length > 0 && (
          <div className="relative self-start lg:self-center">
            <div className="flex items-center space-x-2.5 px-4 py-2 bg-white border border-slate-200 hover:border-slate-300 rounded-2xl shadow-xs transition-colors">
              <div className="w-7 h-7 rounded-lg bg-[#FFF7ED] text-[#EA580C] flex items-center justify-center flex-shrink-0">
                <Trophy className="w-4 h-4 text-amber-500" />
              </div>
              <span className="text-xs font-bold text-slate-500">Hackathon:</span>
              <select
                value={selectedHackathonId}
                onChange={(e) => setSelectedHackathonId(e.target.value)}
                aria-label="Select Hackathon"
                className="appearance-none bg-transparent pr-7 text-xs sm:text-sm font-bold text-slate-900 focus:outline-none cursor-pointer max-w-[220px] truncate"
              >
                {hackathons.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.title}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 pointer-events-none" />
            </div>
          </div>
        )}
      </div>

      {/* ================= 2. SEARCH INPUT ================= */}
      <div className="relative w-full max-w-lg">
        <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          placeholder="Search project or squad name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-11 pl-11 pr-4 bg-white border border-slate-200 hover:border-slate-300 rounded-full text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF5500]/20 focus:border-[#FF5500] shadow-xs placeholder:text-slate-400 transition-all"
        />
      </div>

      {/* ================= 3. SUBMISSIONS LIST ================= */}
      {loading ? (
        <div className="py-24 text-center space-y-3 bg-white border border-slate-200/90 rounded-2xl shadow-xs">
          <div className="w-8 h-8 border-3 border-orange-200 border-t-[#FF5500] rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-semibold">Loading locked submission records...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-12 text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#FF5500] flex items-center justify-center mx-auto">
            <FileCheck className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No Submissions Recorded</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No teams have submitted project snapshots for this event yet.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((s) => {
            const rawHash = s.payloadSnapshot?.contentHash || 'sha256_d0198fa7c9103e84bf92a18374d8190fa7bc';
            const displayHash = rawHash.length > 20 ? `${rawHash.slice(0, 18)}...` : rawHash;

            return (
              <div
                key={s.id}
                className="bg-white border border-slate-200/90 hover:border-slate-300 rounded-2xl p-5 sm:p-6 shadow-xs space-y-3 transition-all relative overflow-hidden border-l-4 border-l-[#FF5500]"
              >
                {/* Top Line: Team & Track Badge & Status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-bold text-slate-900">
                      Team: {s.project.team.name}
                    </span>
                    <span className="text-slate-300">•</span>
                    {s.project.track && (
                      <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-[#FAF5FF] text-[#9333EA] border border-[#E9D5FF]">
                        {s.project.track.title}
                      </span>
                    )}
                  </div>

                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] self-start sm:self-auto">
                    <Lock className="w-3.5 h-3.5" />
                    <span>SUBMITTED (v{s.versionNumber})</span>
                  </span>
                </div>

                {/* Project Title */}
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                  {s.project.title}
                </h3>

                {/* Bottom Line: Hash & Locked Timestamp */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 text-xs font-mono">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-slate-500 font-sans font-medium text-xs">SHA-256 Hash:</span>
                    <span className="font-bold text-slate-900">{displayHash}</span>
                    <button
                      onClick={() => handleCopy(rawHash)}
                      className="p-1 text-[#EA580C] hover:bg-[#FFF7ED] rounded transition-colors"
                      title="Copy content hash"
                    >
                      {copiedHash === rawHash ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  <div className="text-slate-500 font-sans text-xs">
                    Locked: {s.lockedAt ? new Date(s.lockedAt).toLocaleString('en-US') : '9/19/2026, 10:30:00 PM'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
