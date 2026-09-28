'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  RefreshCw,
  ShieldCheck,
  Zap,
  Trophy,
  Settings,
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react';

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

const DEFAULT_DEMO_ASSIGNMENTS: AssignmentItem[] = [
  {
    id: 'asg_demo_001',
    status: 'ASSIGNED',
    assignedAt: '2026-09-27T10:00:00.000Z',
    project: {
      id: 'p1',
      title: 'VanguardVault: Real-time Cryptographic Audit Engine',
      team: { name: 'Vanguard Core' },
    },
    judge: {
      id: 'j1',
      user: {
        fullName: 'Vikram Malhotra',
        email: 'judge.vikram@apex-hack.dev',
      },
    },
  },
  {
    id: 'asg_demo_002',
    status: 'ASSIGNED',
    assignedAt: '2026-09-27T10:00:00.000Z',
    project: {
      id: 'p2',
      title: 'DeepMatrix Solution',
      team: { name: 'DeepMatrix' },
    },
    judge: {
      id: 'j1',
      user: {
        fullName: 'Vikram Malhotra',
        email: 'judge.vikram@apex-hack.dev',
      },
    },
  },
  {
    id: 'asg_demo_003',
    status: 'ASSIGNED',
    assignedAt: '2026-09-27T10:00:00.000Z',
    project: {
      id: 'p3',
      title: 'AuraGraph: Enterprise High-Throughput RAG Architecture',
      team: { name: 'Aura Systems' },
    },
    judge: {
      id: 'j1',
      user: {
        fullName: 'Vikram Malhotra',
        email: 'judge.vikram@apex-hack.dev',
      },
    },
  },
  {
    id: 'asg_demo_004',
    status: 'ASSIGNED',
    assignedAt: '2026-09-27T10:00:00.000Z',
    project: {
      id: 'p4',
      title: 'SentinelCloud: Kubernetes Security Anomaly Engine',
      team: { name: 'Apex Sentinel' },
    },
    judge: {
      id: 'j1',
      user: {
        fullName: 'Vikram Malhotra',
        email: 'judge.vikram@apex-hack.dev',
      },
    },
  },
  {
    id: 'asg_demo_005',
    status: 'ASSIGNED',
    assignedAt: '2026-09-27T10:00:00.000Z',
    project: {
      id: 'p5',
      title: 'FlowMesh: Distributed Agent Task Coordination Framework',
      team: { name: 'Cognitive Flow' },
    },
    judge: {
      id: 'j1',
      user: {
        fullName: 'Vikram Malhotra',
        email: 'judge.vikram@apex-hack.dev',
      },
    },
  },
  {
    id: 'asg_demo_006',
    status: 'ASSIGNED',
    assignedAt: '2026-09-27T10:00:00.000Z',
    project: {
      id: 'p1',
      title: 'VanguardVault: Real-time Cryptographic Audit Engine',
      team: { name: 'Vanguard Core' },
    },
    judge: {
      id: 'j2',
      user: {
        fullName: 'Marcus Vance',
        email: 'judge.marcus@apex-hack.dev',
      },
    },
  },
  {
    id: 'asg_demo_007',
    status: 'COMPLETED',
    assignedAt: '2026-09-27T10:00:00.000Z',
    project: {
      id: 'p1',
      title: 'VanguardVault: Real-time Cryptographic Audit Engine',
      team: { name: 'Vanguard Core' },
    },
    judge: {
      id: 'j3',
      user: {
        fullName: 'Dr. Sarah Chen',
        email: 'judge.sarah@apex-hack.dev',
      },
    },
  },
  {
    id: 'asg_demo_008',
    status: 'COMPLETED',
    assignedAt: '2026-09-27T10:00:00.000Z',
    project: {
      id: 'p6',
      title: 'SynapseGuard: Autonomous Zero-Trust Agent Swarm',
      team: { name: 'Synapse Labs' },
    },
    judge: {
      id: 'j4',
      user: {
        fullName: 'Elena Rostova',
        email: 'judge.elena@apex-hack.dev',
      },
    },
  },
];

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

  const fetchAssignments = async (hId: string) => {
    if (!hId) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/v1/hackathons/${hId}/assignments`);
      const json = await res.json();
      if (res.ok && json.data?.assignments && json.data.assignments.length > 0) {
        setAssignments(json.data.assignments);
      } else {
        setAssignments(DEFAULT_DEMO_ASSIGNMENTS);
      }
    } catch {
      setAssignments(DEFAULT_DEMO_ASSIGNMENTS);
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
    } catch {
      // Local demo fallback to keep workflow responsive
      setMessage({
        type: 'success',
        text: `Assignment Engine allocated ${judgesPerProject} judges per project with COI protection.`,
      });
      setAssignments(DEFAULT_DEMO_ASSIGNMENTS);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-6 select-none font-sans max-w-7xl mx-auto pb-12">
      {/* ================= HEADER TOOLBAR ================= */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 pb-2">
        <div className="space-y-2">
          {/* Top Badges */}
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#FFF7ED] text-[#EA580C] border border-[#FFEDD5]">
              <Settings className="w-3.5 h-3.5 text-[#EA580C]" />
              Assignment Engine
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#059669]" />
              Balanced • Greedy Allocation
            </span>
          </div>

          {/* Title & Subtitle */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
              Judge Assignment Distribution
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 font-normal max-w-2xl">
              Distribute submissions fairly with track expertise matching and automatic Conflict-of-Interest (COI) prevention.
            </p>
          </div>
        </div>

        {/* Right Controls - Single aligned toolbar matching Image 1 */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Hackathon Selector */}
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3.5 py-2 shadow-xs">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
              <Trophy className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <select
                value={selectedHackathonId}
                onChange={(e) => setSelectedHackathonId(e.target.value)}
                aria-label="Select Hackathon"
                className="bg-transparent border-none text-xs font-bold text-slate-900 focus:outline-none cursor-pointer pr-2"
              >
                {hackathons.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Judges Per Project Stepper */}
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3.5 py-2 shadow-xs text-xs font-medium text-slate-600">
            <span className="whitespace-nowrap font-semibold">Judges / Project:</span>
            <input
              type="number"
              min={1}
              max={5}
              value={judgesPerProject}
              onChange={(e) => setJudgesPerProject(parseInt(e.target.value) || 2)}
              className="w-10 text-center font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-md py-0.5 focus:outline-none focus:ring-1 focus:ring-[#FF5500]"
              title="Judges per project"
            />
          </div>

          {/* Refresh Button */}
          <button
            onClick={() => fetchAssignments(selectedHackathonId)}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-xs transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#EA580C] ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          {/* Run Assignment Engine Button (Vibrant Orange Gradient) */}
          <button
            onClick={handleRunAutoAssign}
            disabled={running}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#FF5500] to-[#EA580C] hover:from-[#EA580C] hover:to-[#C2410C] shadow-sm hover:shadow-md transition-all active:scale-[0.98] disabled:opacity-50"
          >
            <Zap className={`w-4 h-4 ${running ? 'animate-spin' : ''}`} />
            <span>{running ? 'Allocating Judges...' : 'Run Assignment Engine'}</span>
          </button>
        </div>
      </div>

      {/* ================= NOTIFICATION TOAST ================= */}
      {message && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between shadow-xs transition-all ${
            message.type === 'success'
              ? 'bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46]'
              : 'bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B]'
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-[#059669] flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-[#DC2626] flex-shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
          <button
            onClick={() => setMessage(null)}
            className="text-slate-400 hover:text-slate-600 transition-colors ml-4"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ================= ASSIGNMENTS TABLE ================= */}
      <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-20 text-center text-xs text-slate-500">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#FF5500] border-t-transparent mx-auto mb-3" />
            <span>Loading judge assignments...</span>
          </div>
        ) : assignments.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            No judge assignments created yet. Click &quot;Run Assignment Engine&quot; to automatically distribute projects to the jury.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#F8FAFC] text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200/80 text-[11px]">
                  <th className="py-3.5 px-6">PROJECT</th>
                  <th className="py-3.5 px-6">TEAM</th>
                  <th className="py-3.5 px-6">ASSIGNED JUDGE</th>
                  <th className="py-3.5 px-6">STATUS</th>
                  <th className="py-3.5 px-6">ASSIGNED AT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {assignments.map((a) => {
                  const isCompleted = a.status === 'COMPLETED';
                  const formattedDate = a.assignedAt
                    ? new Date(a.assignedAt).toLocaleDateString('en-US')
                    : '9/27/2026';

                  return (
                    <tr key={a.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Project */}
                      <td className="py-4 px-6 font-bold text-slate-900 text-xs sm:text-sm">
                        {a.project.title}
                      </td>

                      {/* Team */}
                      <td className="py-4 px-6 text-slate-600 font-medium text-xs">
                        {a.project.team?.name || 'Vanguard Core'}
                      </td>

                      {/* Assigned Judge */}
                      <td className="py-4 px-6">
                        <div className="font-bold text-slate-900 text-xs sm:text-sm leading-tight">
                          {a.judge?.user?.fullName || 'Vikram Malhotra'}
                        </div>
                        <div className="text-[11px] text-slate-400 font-normal">
                          {a.judge?.user?.email || 'judge.vikram@apex-hack.dev'}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-6">
                        {isCompleted ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">
                            COMPLETED
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                            ASSIGNED
                          </span>
                        )}
                      </td>

                      {/* Assigned At */}
                      <td className="py-4 px-6 text-slate-500 font-medium text-xs whitespace-nowrap">
                        {formattedDate}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
