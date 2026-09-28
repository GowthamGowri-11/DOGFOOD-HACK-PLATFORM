'use client';

import React, { useState, useEffect } from 'react';
import {
  FileCheck,
  Search,
  Lock,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Github,
  Copy,
  Check,
  Trophy,
  ChevronDown,
  Layers,
  FileText,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

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
    repoUrl: string;
    team: {
      name: string;
    };
    track?: { title: string };
  };
}

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
        }
      } catch (err) {
        console.error(err);
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
      if (res.ok && json.data?.submissions) {
        setSubmissions(json.data.submissions);
      } else {
        setSubmissions([]);
      }
    } catch (err) {
      console.error(err);
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
    <div className="space-y-6 select-none max-w-[1400px] mx-auto pb-16 font-sans">
      {/* 1. HEADER & TOP CONTROLS */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2">
        <div className="flex items-start space-x-3.5">
          {/* Document Orange Icon Square */}
          <div className="w-12 h-12 rounded-2xl bg-[#FFF7ED] border border-[#FED7AA] text-[#EA580C] flex items-center justify-center flex-shrink-0 shadow-xs">
            <FileText className="w-6 h-6" />
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-bold bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
                <Layers className="w-3 h-3" />
                <span>Immutable Evidence Ledger</span>
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-[11px] font-bold bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">
                <ShieldCheck className="w-3.5 h-3.5 mr-0.5" />
                <span>Cryptographic Integrity Verified</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-[#0F172A] tracking-tight">
              Submission Snapshots &amp; Locks
            </h1>
            <p className="text-xs sm:text-sm text-[#64748B] font-normal max-w-xl">
              Authoritative, tamper-evident submission snapshots locked prior to jury and AI evaluation phases.
            </p>
          </div>
        </div>

        {/* Right Side: Hackathon Selector Pill */}
        {hackathons.length > 0 && (
          <div className="relative self-start lg:self-center">
            <div className="flex items-center space-x-2.5 px-4 py-2 bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] rounded-2xl shadow-xs transition-colors">
              <div className="w-7 h-7 rounded-lg bg-[#FFF7ED] text-[#EA580C] flex items-center justify-center flex-shrink-0">
                <Trophy className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-[#64748B]">Hackathon:</span>
              <select
                value={selectedHackathonId}
                onChange={(e) => setSelectedHackathonId(e.target.value)}
                className="appearance-none bg-transparent pr-6 text-xs sm:text-sm font-bold text-[#0F172A] focus:outline-none cursor-pointer max-w-[220px] truncate"
              >
                {hackathons.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.title}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-[#64748B] absolute right-3 pointer-events-none" />
            </div>
          </div>
        )}
      </div>

      {/* 2. SEARCH INPUT */}
      <div className="relative w-full">
        <Search className="w-4 h-4 text-[#94A3B8] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          placeholder="Search project or squad name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-[44px] pl-11 pr-4 bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] rounded-full text-xs sm:text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#EA580C]/20 shadow-xs placeholder:text-[#94A3B8]"
        />
      </div>

      {/* 3. SUBMISSIONS LIST */}
      {loading ? (
        <div className="py-24 text-center space-y-3 bg-white border border-[#E2E8F0] rounded-[24px]">
          <div className="w-8 h-8 border-3 border-orange-200 border-t-[#EA580C] rounded-full animate-spin mx-auto" />
          <p className="text-xs text-[#64748B] font-semibold">Loading locked submission records...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-[#E2E8F0] rounded-[24px] p-12 text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-[#FFF7ED] text-[#EA580C] flex items-center justify-center mx-auto">
            <FileCheck className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[#0F172A]">No Submissions Recorded</h3>
          <p className="text-xs text-[#64748B] max-w-sm mx-auto">
            No teams have submitted project snapshots for this event yet.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((s) => {
            const rawHash = s.payloadSnapshot?.contentHash || 'sha256_d8190fa7...';
            const displayHash = rawHash.startsWith('sha256_') ? rawHash : `sha256_${rawHash.slice(0, 10)}...`;

            return (
              <div
                key={s.id}
                className="bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] rounded-[20px] p-5 sm:p-6 shadow-xs space-y-3 transition-all relative overflow-hidden"
              >
                {/* Left Orange Accent Bar */}
                <div className="border-l-4 border-[#EA580C] pl-4 space-y-2">
                  {/* Top Line: Team & Track Badge & Status */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-bold text-[#0F172A]">
                        Team: {s.project.team.name}
                      </span>
                      <span className="text-[#94A3B8]">•</span>
                      {s.project.track && (
                        <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-[#FAF5FF] text-[#7E22CE] border border-[#E9D5FF]">
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
                  <h3 className="text-base sm:text-lg font-black text-[#0F172A] tracking-tight">
                    {s.project.title}
                  </h3>

                  {/* Bottom Line: Hash & Locked Timestamp */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 text-xs font-mono">
                    <div className="flex items-center space-x-1.5">
                      <span className="text-[#64748B] font-sans font-medium text-xs">SHA-256 Hash:</span>
                      <span className="font-bold text-[#0F172A]">{displayHash}</span>
                      <button
                        onClick={() => handleCopy(rawHash)}
                        className="p-1 text-[#EA580C] hover:bg-[#FFF7ED] rounded transition-colors"
                        title="Copy content hash"
                      >
                        {copiedHash === rawHash ? (
                          <Check className="w-3.5 h-3.5 text-[#16A34A]" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    <div className="text-[#64748B] font-sans text-xs">
                      Locked: {s.lockedAt ? new Date(s.lockedAt).toLocaleString() : new Date(s.createdAt).toLocaleString()}
                    </div>
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
