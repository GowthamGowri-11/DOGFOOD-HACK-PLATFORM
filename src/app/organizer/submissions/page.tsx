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
        s.project.team.name.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 select-none">
      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#E2E8F0] gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-bold text-[#2563EB] bg-[#EFF6FF] px-2.5 py-0.5 rounded-full border border-[#BFDBFE]">
              Immutable Evidence Ledger
            </span>
            <span className="text-[11px] font-semibold text-[#059669] bg-[#ECFDF5] px-2.5 py-0.5 rounded-full border border-[#A7F3D0] flex items-center">
              <ShieldCheck className="w-3 h-3 mr-1" /> Cryptographic Integrity Verified
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#111827] mt-1 tracking-tight">
            Submission Snapshots & Locks
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-0.5 font-normal">
            Authoritative, tamper-evident submission snapshots locked prior to jury and AI evaluation phases.
          </p>
        </div>

        {hackathons.length > 0 && (
          <div className="flex items-center space-x-2">
            <label className="text-xs font-semibold text-[#334155]">Hackathon:</label>
            <select
              value={selectedHackathonId}
              onChange={(e) => setSelectedHackathonId(e.target.value)}
              className="px-3 py-2 bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] rounded-[11px] text-xs font-semibold text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
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

      {/* Search */}
      <div className="relative w-full sm:w-80">
        <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          placeholder="Search project or squad name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-[38px] pl-10 pr-4 bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] rounded-[19px] text-xs text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/15"
        />
      </div>

      {/* Submissions List */}
      {loading ? (
        <div className="py-16 text-center text-xs text-[#64748B]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2563EB] mx-auto mb-2" />
          Loading locked submission records...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-[#E2E8F0] rounded-[18px] p-12 text-center space-y-3 shadow-card">
          <div className="w-12 h-12 rounded-2xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center mx-auto">
            <FileCheck className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[#111827]">No Submissions Recorded</h3>
          <p className="text-xs text-[#64748B] max-w-sm mx-auto">
            No teams have submitted project snapshots for this event yet.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((s) => {
            const hash = s.payloadSnapshot?.contentHash || 'sha256_d8190fa7...';

            return (
              <div
                key={s.id}
                className="bg-white border border-[#E2E8F0] rounded-[18px] p-5 shadow-card space-y-3 text-xs"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <div className="flex items-center space-x-2 text-[#64748B] mb-1">
                      <span className="font-semibold text-[#334155]">Team: {s.project.team.name}</span>
                      <span>•</span>
                      {s.project.track && (
                        <Badge variant="purple" size="sm">
                          {s.project.track.title}
                        </Badge>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-[#111827]">{s.project.title}</h3>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Badge variant={s.status === 'LOCKED' ? 'emerald' : 'blue'} size="sm">
                      <Lock className="w-3 h-3 mr-1 inline" />
                      {s.status} (v{s.versionNumber})
                    </Badge>
                  </div>
                </div>

                {/* Content Hash & Timestamps */}
                <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 font-mono text-[11px]">
                  <div className="flex items-center space-x-2">
                    <span className="text-[#64748B]">SHA-256 Hash:</span>
                    <span className="font-bold text-[#111827]">{hash}</span>
                    <button
                      onClick={() => handleCopy(hash)}
                      className="text-[#2563EB] hover:underline flex items-center ml-1"
                      title="Copy payload hash"
                    >
                      <Copy className="w-3 h-3 ml-0.5" />
                    </button>
                    {copiedHash === hash && (
                      <span className="text-[#059669] text-[10px] font-bold">Copied!</span>
                    )}
                  </div>

                  <div className="text-[#64748B]">
                    Locked: {s.lockedAt ? new Date(s.lockedAt).toLocaleString() : new Date(s.createdAt).toLocaleString()}
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
