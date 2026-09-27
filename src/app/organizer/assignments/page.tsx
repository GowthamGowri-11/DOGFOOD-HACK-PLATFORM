'use client';

import React, { useState, useEffect } from 'react';
import {
  Scale,
  RefreshCw,
  Users,
  FolderKanban,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface AssignmentItem {
  id: string;
  status: string;
  assignedAt: string;
  completedAt?: string | null;
  project: {
    id: string;
    title: string;
    team: { name: string };
    track?: { title: string };
  };
  judge: {
    id: string;
    user: {
      fullName: string;
      email: string;
    };
  };
}

export default function OrganizerAssignmentsPage() {
  const [hackathons, setHackathons] = useState<any[]>([]);
  const [selectedHackathonId, setSelectedHackathonId] = useState<string>('');
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [judgesPerProject, setJudgesPerProject] = useState(2);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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

  const fetchAssignments = async (hId: string) => {
    if (!hId) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/v1/hackathons/${hId}/assignments`);
      const json = await res.json();
      if (res.ok && json.data?.assignments) {
        setAssignments(json.data.assignments);
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to fetch assignments' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedHackathonId) {
      fetchAssignments(selectedHackathonId);
    }
  }, [selectedHackathonId]);

  const handleRunAutoAssign = async () => {
    if (!selectedHackathonId) return;
    try {
      setRunning(true);
      setMessage(null);
      const res = await fetch(`/api/v1/hackathons/${selectedHackathonId}/assignments/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          judgesPerProject,
          prioritizeTrackExpertise: true,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Auto-assignment failed');
      setMessage({ type: 'success', text: json.message || 'Assignments generated and balanced across judges.' });
      fetchAssignments(selectedHackathonId);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-6 select-none">
      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#E2E8F0] gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-bold text-[#2563EB] bg-[#EFF6FF] px-2.5 py-0.5 rounded-full border border-[#BFDBFE]">
              Assignment Engine
            </span>
            <span className="text-[11px] font-semibold text-[#059669] bg-[#ECFDF5] px-2.5 py-0.5 rounded-full border border-[#A7F3D0] flex items-center">
              <ShieldCheck className="w-3 h-3 mr-1" /> Balanced Greedy Allocation
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#111827] mt-1 tracking-tight">
            Judge Assignment Distribution
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-0.5 font-normal">
            Distribute submissions fairly with track expertise matching and automatic Conflict-of-Interest (COI) prevention.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap xl:flex-nowrap sm:justify-end">
          {hackathons.length > 0 && (
            <select
              value={selectedHackathonId}
              onChange={(e) => setSelectedHackathonId(e.target.value)}
              className="h-10 px-3 py-2 bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] rounded-[10px] text-xs font-semibold text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2563EB] shadow-2xs cursor-pointer"
            >
              {hackathons.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.title}
                </option>
              ))}
            </select>
          )}

          <div className="flex items-center h-10 px-3 bg-white border border-[#E2E8F0] rounded-[10px] text-xs font-medium text-[#475569] shadow-2xs gap-2">
            <span className="text-[#64748B] font-semibold whitespace-nowrap">Judges / Project:</span>
            <input
              type="number"
              min={1}
              max={5}
              value={judgesPerProject}
              onChange={(e) => setJudgesPerProject(parseInt(e.target.value) || 2)}
              className="w-8 text-center font-bold text-[#111827] bg-[#F8FAFC] border border-[#CBD5E1] rounded px-1 py-0.5 focus:outline-none focus:border-[#2563EB]"
              title="Judges per project"
            />
          </div>

          <Button
            variant="outline"
            size="md"
            onClick={() => fetchAssignments(selectedHackathonId)}
            disabled={loading}
            icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
            className="whitespace-nowrap font-semibold text-xs h-10"
          >
            Refresh
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={handleRunAutoAssign}
            disabled={running}
            isLoading={running}
            icon={<Zap className="w-4 h-4" />}
            className="whitespace-nowrap font-semibold text-xs h-10 shadow-sm"
          >
            <span>{running ? 'Allocating Judges...' : 'Run Assignment Engine'}</span>
          </Button>
        </div>
      </div>

      {/* Notifications */}
      {message && (
        <div
          className={`p-4 rounded-[12px] text-xs font-medium flex items-center shadow-xs ${
            message.type === 'success'
              ? 'bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46]'
              : 'bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B]'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 mr-2 text-[#059669] flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 mr-2 text-[#DC2626] flex-shrink-0" />
          )}
          {message.text}
        </div>
      )}

      {/* Assignments Table */}
      <div className="bg-white border border-[#E2E8F0] rounded-[18px] overflow-hidden shadow-card">
        {loading ? (
          <div className="py-16 text-center text-xs text-[#64748B]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2563EB] mx-auto mb-2" />
            Loading judge assignments...
          </div>
        ) : assignments.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#94A3B8]">
            No judge assignments created yet. Click &quot;Run Assignment Engine&quot; to automatically distribute projects to the jury.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#F8FAFC] text-[#64748B] font-bold uppercase tracking-wider border-b border-[#E2E8F0]">
                  <th className="py-3 px-5">Project</th>
                  <th className="py-3 px-5">Team</th>
                  <th className="py-3 px-5">Assigned Judge</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5">Assigned At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {assignments.map((a) => (
                  <tr key={a.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="py-3.5 px-5 font-bold text-[#111827]">{a.project.title}</td>
                    <td className="py-3.5 px-5 text-[#475569]">{a.project.team.name}</td>
                    <td className="py-3.5 px-5">
                      <div className="font-semibold text-[#111827]">{a.judge.user.fullName}</div>
                      <div className="text-[10px] text-[#64748B]">{a.judge.user.email}</div>
                    </td>
                    <td className="py-3.5 px-5">
                      <Badge
                        variant={
                          a.status === 'COMPLETED'
                            ? 'emerald'
                            : a.status === 'IN_PROGRESS'
                            ? 'blue'
                            : 'neutral'
                        }
                        size="sm"
                      >
                        {a.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-5 text-[#64748B]">
                      {new Date(a.assignedAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
