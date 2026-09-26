'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  FileCheck,
  Search,
  ExternalLink,
  Code,
  Sparkles,
  Scale,
  CheckCircle2,
  Clock,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Eye,
  Github,
  Video,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface SubmissionItem {
  id: string;
  versionNumber: number;
  status: string;
  payloadSnapshot: any;
  submittedAt: string | null;
  lockedAt: string | null;
  createdAt: string;
  project: {
    id: string;
    title: string;
    slug: string;
    hackathon: { id: string; title: string; slug: string };
    team: { id: string; name: string };
    track: { title: string };
    evaluations: Array<{ id: string; status: string; totalScore: number }>;
    aiJuryRuns: Array<{ id: string; overallScore: number; calibratedScore: number | null }>;
  };
}

export default function AdminSubmissionsPage() {
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Snapshot modal
  const [selectedSub, setSelectedSub] = useState<SubmissionItem | null>(null);

  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: '10',
      });
      if (search.trim()) params.append('search', search.trim());
      if (statusFilter) params.append('status', statusFilter);

      const res = await fetch(`/api/v1/admin/submissions?${params.toString()}`);
      const json = await res.json();
      if (json.success && json.data) {
        setSubmissions(json.data.submissions || []);
        setTotalPages(json.data.pagination?.totalPages || 1);
        setTotalCount(json.data.pagination?.total || 0);
      }
    } catch (err) {
      console.error('Failed to fetch submissions:', err);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#E2E8F0] gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-bold text-[#DC2626] bg-[#FEF2F2] px-2.5 py-0.5 rounded-full border border-[#FECACA]">
              Global Platform Control
            </span>
            <span className="text-[11px] font-semibold text-[#64748B]">
              Total Submissions: {totalCount}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#111827] mt-1 tracking-tight">
            Submission Integrity & Code Snapshots
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
            Immutable snapshot verification, repository payload hashes, human scoring calibration, and AI Jury telemetry.
          </p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-[18px] p-4 shadow-card">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <input
              type="text"
              placeholder="Search submissions by project title, team name, or hackathon..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-[11px] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all placeholder:text-[#94A3B8]"
            />
          </div>

          <div className="flex items-center gap-2">
            {['', 'SUBMITTED', 'DRAFT'].map((st) => (
              <button
                key={st || 'ALL'}
                onClick={() => {
                  setStatusFilter(st);
                  setPage(1);
                }}
                className={`px-3 py-1.5 text-xs rounded-full border transition-all ${
                  statusFilter === st
                    ? 'bg-[#002B49] text-white border-[#002B49] font-semibold'
                    : 'bg-[#F8FAFC] text-[#64748B] border-[#E2E8F0] hover:bg-[#F1F5F9]'
                }`}
              >
                {st || 'All Statuses'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-[18px] overflow-hidden shadow-card">
        {loading ? (
          <div className="p-12 text-center text-xs text-[#64748B]">
            Loading locked submissions from PostgreSQL...
          </div>
        ) : submissions.length === 0 ? (
          <div className="p-12 text-center">
            <FileCheck className="w-8 h-8 text-[#CBD5E1] mx-auto mb-2" />
            <p className="text-sm font-semibold text-[#111827]">No submissions found</p>
            <p className="text-xs text-[#64748B] mt-0.5">Adjust filter options or check hackathon submission windows.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#F8FAFC] text-[#64748B] font-bold uppercase tracking-wider border-b border-[#E2E8F0]">
                  <th className="py-3 px-5">Project & Hackathon</th>
                  <th className="py-3 px-5">Team</th>
                  <th className="py-3 px-5">Snapshot Version</th>
                  <th className="py-3 px-5">Status & Timestamp</th>
                  <th className="py-3 px-5">Evaluation Telemetry</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {submissions.map((sub) => {
                  const evals = sub.project.evaluations.filter((e) => e.status === 'SUBMITTED');
                  const aiRun = sub.project.aiJuryRuns[0];

                  return (
                    <tr key={sub.id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="py-3.5 px-5">
                        <Link
                          href={`/projects/${sub.project.id}`}
                          target="_blank"
                          className="font-semibold text-[#111827] text-sm hover:text-[#2563EB] transition-colors block"
                        >
                          {sub.project.title}
                        </Link>
                        <div className="text-[11px] text-[#64748B] mt-0.5">
                          {sub.project.hackathon.title} • <span className="text-[#2563EB] font-medium">{sub.project.track.title}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-5">
                        <span className="font-semibold text-[#111827]">{sub.project.team.name}</span>
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="font-mono text-xs font-bold text-[#002B49]">v{sub.versionNumber}</div>
                        <div className="text-[10px] text-[#64748B] font-mono mt-0.5">
                          {sub.lockedAt ? 'Locked (Immutable)' : 'Mutable Draft'}
                        </div>
                      </td>
                      <td className="py-3.5 px-5">
                        {sub.status === 'SUBMITTED' ? (
                          <div>
                            <span className="inline-flex items-center text-[10px] font-bold text-[#059669] bg-[#ECFDF5] px-2 py-0.5 rounded-full border border-[#A7F3D0]">
                              <CheckCircle2 className="w-3 h-3 mr-1" /> SUBMITTED
                            </span>
                            <div className="text-[11px] text-[#64748B] mt-0.5 font-mono">
                              {sub.submittedAt ? new Date(sub.submittedAt).toLocaleString() : '—'}
                            </div>
                          </div>
                        ) : (
                          <Badge variant="neutral">{sub.status}</Badge>
                        )}
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="space-y-0.5 text-[11px]">
                          <div className="text-[#334155]">
                            <span className="font-semibold">{evals.length}</span> human evals
                          </div>
                          {aiRun && (
                            <div className="text-[#2563EB] font-mono flex items-center">
                              <Sparkles className="w-3 h-3 mr-1" /> AI Jury: {aiRun.calibratedScore?.toFixed(1) || aiRun.overallScore.toFixed(1)} pts
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <button
                          onClick={() => setSelectedSub(sub)}
                          className="px-2.5 py-1 text-[11px] font-semibold text-[#002B49] bg-[#F1F5F9] hover:bg-[#E2E8F0] rounded-[7px] transition-colors"
                        >
                          View Snapshot
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-[#E2E8F0] flex items-center justify-between">
            <span className="text-xs text-[#64748B]">
              Page {page} of {totalPages} ({totalCount} total)
            </span>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Snapshot Inspection Modal */}
      {selectedSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-[#FFFFFF] rounded-[20px] max-w-2xl w-full p-6 shadow-2xl border border-[#E2E8F0] space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div>
                <h3 className="text-base font-bold text-[#111827]">{selectedSub.project.title}</h3>
                <p className="text-xs text-[#64748B]">
                  Team: {selectedSub.project.team.name} • Arena: {selectedSub.project.hackathon.title}
                </p>
              </div>
              <Badge variant="emerald">Version {selectedSub.versionNumber} Locked</Badge>
            </div>

            {/* Snapshot metadata */}
            <div className="grid grid-cols-2 gap-3 text-xs p-3 bg-[#F8FAFC] rounded-[12px] border border-[#E2E8F0]">
              <div>
                <span className="text-[#64748B]">Submitted At:</span>
                <p className="font-mono text-[#111827] mt-0.5">
                  {selectedSub.submittedAt ? new Date(selectedSub.submittedAt).toLocaleString() : 'N/A'}
                </p>
              </div>
              <div>
                <span className="text-[#64748B]">Locked At:</span>
                <p className="font-mono text-[#111827] mt-0.5">
                  {selectedSub.lockedAt ? new Date(selectedSub.lockedAt).toLocaleString() : 'N/A'}
                </p>
              </div>
            </div>

            {/* Snapshot Payload Content */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-[#334155] uppercase tracking-wider">
                Immutable Payload Snapshot (JSON)
              </span>
              <pre className="p-4 bg-[#0F172A] text-[#E2E8F0] rounded-[12px] text-[11px] font-mono overflow-x-auto max-h-60">
                {JSON.stringify(selectedSub.payloadSnapshot, null, 2)}
              </pre>
            </div>

            <div className="flex justify-end pt-2">
              <Button size="sm" onClick={() => setSelectedSub(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
