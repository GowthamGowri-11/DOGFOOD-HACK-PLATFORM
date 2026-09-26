'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  UserCheck2,
  Scale,
  Search,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertCircle,
  Play,
  Trophy,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface JudgeItem {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  hackathonId: string;
  hackathonTitle: string;
  hackathonStatus: string;
  maxWorkload: number;
  isActive: boolean;
  expertiseTracks: string[];
  assignmentsCount: number;
  completedEvaluationsCount: number;
  pendingEvaluationsCount: number;
}

export default function AdminJudgesPage() {
  const [judges, setJudges] = useState<JudgeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Auto-assign modal
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [hackathons, setHackathons] = useState<Array<{ id: string; title: string }>>([]);
  const [selectedHackathonId, setSelectedHackathonId] = useState('');
  const [judgesPerProject, setJudgesPerProject] = useState(2);
  const [assigning, setAssigning] = useState(false);
  const [assignMessage, setAssignMessage] = useState<string | null>(null);
  const [assignError, setAssignError] = useState<string | null>(null);

  const fetchJudges = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/admin/judges');
      const json = await res.json();
      if (json.success && json.data) {
        setJudges(json.data.judges || []);
      }
    } catch (err) {
      console.error('Failed to fetch judges:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJudges();
  }, [fetchJudges]);

  const openAssignModal = async () => {
    setAssignMessage(null);
    setAssignError(null);
    try {
      const res = await fetch('/api/v1/admin/hackathons?pageSize=50');
      const json = await res.json();
      if (json.success && json.data?.hackathons) {
        setHackathons(json.data.hackathons);
        if (json.data.hackathons.length > 0) {
          setSelectedHackathonId(json.data.hackathons[0].id);
        }
        setAssignModalOpen(true);
      }
    } catch (err) {
      console.error('Failed to load hackathons for assignment:', err);
    }
  };

  const handleTriggerAssignment = async () => {
    if (!selectedHackathonId) return;
    setAssigning(true);
    setAssignMessage(null);
    setAssignError(null);
    try {
      const res = await fetch('/api/v1/admin/judges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hackathonId: selectedHackathonId,
          judgesPerProject,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAssignMessage(data.message || 'Assignments generated successfully');
        fetchJudges();
      } else {
        setAssignError(data.error?.message || 'Assignment distribution failed');
      }
    } catch {
      setAssignError('Network error while distributing assignments');
    } finally {
      setAssigning(false);
    }
  };

  const filteredJudges = judges.filter((j) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      j.fullName.toLowerCase().includes(q) ||
      j.email.toLowerCase().includes(q) ||
      j.hackathonTitle.toLowerCase().includes(q)
    );
  });

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
              Active Evaluators: {judges.length}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#111827] mt-1 tracking-tight">
            Judge Roster & Assignment Engine
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
            Monitors evaluator workloads, prevents Conflicts of Interest (COI), and executes balanced assignment distribution.
          </p>
        </div>

        <Button
          onClick={openAssignModal}
          size="sm"
          className="self-start sm:self-center"
        >
          <Play className="w-3.5 h-3.5 mr-1.5" />
          Run Assignment Engine
        </Button>
      </div>

      {/* Search */}
      <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-[18px] p-4 shadow-card">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
          <input
            type="text"
            placeholder="Search judges by name, email, or hackathon arena..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-[11px] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all placeholder:text-[#94A3B8]"
          />
        </div>
      </div>

      {/* Judges Table */}
      <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-[18px] overflow-hidden shadow-card">
        {loading ? (
          <div className="p-12 text-center text-xs text-[#64748B]">
            Loading judges and workload distributions from PostgreSQL...
          </div>
        ) : filteredJudges.length === 0 ? (
          <div className="p-12 text-center">
            <UserCheck2 className="w-8 h-8 text-[#CBD5E1] mx-auto mb-2" />
            <p className="text-sm font-semibold text-[#111827]">No judges found</p>
            <p className="text-xs text-[#64748B] mt-0.5">No judges assigned to hackathons match the query.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#F8FAFC] text-[#64748B] font-bold uppercase tracking-wider border-b border-[#E2E8F0]">
                  <th className="py-3 px-5">Judge Name & Email</th>
                  <th className="py-3 px-5">Assigned Hackathon</th>
                  <th className="py-3 px-5">Workload Capacity</th>
                  <th className="py-3 px-5">Evaluation Progress</th>
                  <th className="py-3 px-5 text-right">COI Protection</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {filteredJudges.map((judge) => (
                  <tr key={judge.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="py-3.5 px-5">
                      <div className="font-semibold text-[#111827] text-sm">{judge.fullName}</div>
                      <div className="text-[11px] text-[#64748B] font-mono mt-0.5">{judge.email}</div>
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="font-medium text-[#111827]">{judge.hackathonTitle}</div>
                      <span className="text-[10px] font-mono uppercase text-[#64748B]">{judge.hackathonStatus}</span>
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="font-semibold text-[#111827]">
                            {judge.assignmentsCount} / {judge.maxWorkload} projects
                          </span>
                          <span className="text-[#64748B]">
                            {Math.round((judge.assignmentsCount / (judge.maxWorkload || 1)) * 100)}%
                          </span>
                        </div>
                        <div className="w-28 bg-[#E2E8F0] h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-[#2563EB] h-full"
                            style={{
                              width: `${Math.min(100, (judge.assignmentsCount / (judge.maxWorkload || 1)) * 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="space-y-0.5 text-[11px]">
                        <span className="text-[#059669] font-semibold">
                          {judge.completedEvaluationsCount} completed
                        </span>{' '}
                        •{' '}
                        <span className="text-[#D97706] font-semibold">
                          {judge.pendingEvaluationsCount} pending
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <span className="inline-flex items-center text-[10px] font-semibold text-[#059669] bg-[#ECFDF5] px-2 py-0.5 rounded-full border border-[#A7F3D0]">
                        <ShieldCheck className="w-3 h-3 mr-1" /> Active & Isolated
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Auto-Assignment Engine Modal */}
      {assignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-[#FFFFFF] rounded-[20px] max-w-md w-full p-6 shadow-2xl border border-[#E2E8F0] space-y-4">
            <div className="flex items-center space-x-2">
              <Scale className="w-5 h-5 text-[#2563EB]" />
              <h3 className="text-base font-bold text-[#111827]">
                Execute Assignment Engine
              </h3>
            </div>
            <p className="text-xs text-[#64748B]">
              Distributes submitted projects to active judges using greedy constraint satisfaction, track expertise matching, and COI exclusion.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#334155]">Select Target Hackathon:</label>
              <select
                value={selectedHackathonId}
                onChange={(e) => setSelectedHackathonId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-[11px] focus:outline-none focus:border-[#2563EB]"
              >
                {hackathons.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#334155]">Judges Per Project (K):</label>
              <input
                type="number"
                min={1}
                max={5}
                value={judgesPerProject}
                onChange={(e) => setJudgesPerProject(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-[11px] focus:outline-none focus:border-[#2563EB]"
              />
            </div>

            {assignMessage && (
              <div className="p-3 bg-[#ECFDF5] border border-[#A7F3D0] rounded-[11px] text-xs text-[#065F46] flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{assignMessage}</span>
              </div>
            )}

            {assignError && (
              <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-[11px] text-xs text-[#DC2626] flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{assignError}</span>
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAssignModalOpen(false)}
                disabled={assigning}
              >
                Close
              </Button>
              <Button
                size="sm"
                onClick={handleTriggerAssignment}
                disabled={assigning}
              >
                {assigning ? 'Distributing...' : 'Execute Distribution'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
