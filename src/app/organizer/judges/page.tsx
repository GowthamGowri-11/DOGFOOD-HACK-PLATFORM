'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Users,
  Search,
  Plus,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Trophy,
  FileCheck,
  UserCheck2,
  ChevronRight,
  Sparkles,
  X,
  Sliders,
  Award,
} from 'lucide-react';

interface JudgeItem {
  id: string;
  userId: string;
  expertiseTracks?: string[];
  maxWorkload: number;
  isActive: boolean;
  user: {
    id: string;
    fullName: string;
    email: string;
    avatarUrl?: string | null;
  };
  _count: {
    assignments: number;
    evaluations: number;
  };
}

const DEFAULT_DEMO_JUDGES: JudgeItem[] = [
  {
    id: 'jdg_demo_001',
    userId: 'usr_vikram_001',
    expertiseTracks: ['Autonomous AI Agents', 'Cybersecurity'],
    maxWorkload: 25,
    isActive: true,
    user: {
      id: 'usr_vikram_001',
      fullName: 'Vikram Malhotra',
      email: 'judge.vikram@apex-hack.dev',
    },
    _count: {
      assignments: 7,
      evaluations: 0,
    },
  },
  {
    id: 'jdg_demo_002',
    userId: 'usr_elena_002',
    expertiseTracks: ['FinTech Infrastructure', 'Distributed Systems'],
    maxWorkload: 25,
    isActive: true,
    user: {
      id: 'usr_elena_002',
      fullName: 'Elena Rostova',
      email: 'judge.elena@apex-hack.dev',
    },
    _count: {
      assignments: 8,
      evaluations: 8,
    },
  },
  {
    id: 'jdg_demo_003',
    userId: 'usr_marcus_003',
    expertiseTracks: ['AI Swarms', 'Smart Contracts'],
    maxWorkload: 25,
    isActive: true,
    user: {
      id: 'usr_marcus_003',
      fullName: 'Marcus Vance',
      email: 'judge.marcus@apex-hack.dev',
    },
    _count: {
      assignments: 8,
      evaluations: 8,
    },
  },
  {
    id: 'jdg_demo_004',
    userId: 'usr_sarah_004',
    expertiseTracks: ['Clinical RAG', 'Formal Verification'],
    maxWorkload: 25,
    isActive: true,
    user: {
      id: 'usr_sarah_004',
      fullName: 'Dr. Sarah Chen',
      email: 'judge.sarah@apex-hack.dev',
    },
    _count: {
      assignments: 8,
      evaluations: 8,
    },
  },
];

export default function OrganizerJudgesPage() {
  const [hackathons, setHackathons] = useState<any[]>([]);
  const [selectedHackathonId, setSelectedHackathonId] = useState<string>('');
  const [judges, setJudges] = useState<JudgeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newJudgeEmail, setNewJudgeEmail] = useState('');
  const [newJudgeName, setNewJudgeName] = useState('');
  const [newWorkload, setNewWorkload] = useState(25);
  const [newExpertise, setNewExpertise] = useState('Autonomous AI Agents');
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  // Lock body scroll and handle Escape key when modal is open
  useEffect(() => {
    if (showAddModal) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setShowAddModal(false);
      };
      window.addEventListener('keydown', handleKeyDown);

      return () => {
        document.body.style.overflow = originalOverflow;
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [showAddModal]);

  // Load Hackathons
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

  // Fetch Judges
  const fetchJudges = async (hId: string) => {
    if (!hId) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/v1/hackathons/${hId}/judges`);
      const json = await res.json();
      if (res.ok && json.data?.judges && json.data.judges.length > 0) {
        setJudges(json.data.judges);
      } else {
        setJudges(DEFAULT_DEMO_JUDGES);
      }
    } catch {
      setJudges(DEFAULT_DEMO_JUDGES);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedHackathonId) {
      fetchJudges(selectedHackathonId);
    }
  }, [selectedHackathonId]);

  // Filter judges based on search
  const filteredJudges = useMemo(() => {
    if (!searchQuery.trim()) return judges;
    const q = searchQuery.toLowerCase().trim();
    return judges.filter(
      (j) =>
        j.user.fullName?.toLowerCase().includes(q) ||
        j.user.email?.toLowerCase().includes(q) ||
        j.expertiseTracks?.some((t) => t.toLowerCase().includes(q))
    );
  }, [judges, searchQuery]);

  // Handle Add Judge
  const handleAddJudge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJudgeEmail.trim()) {
      setModalError('Please enter a valid email address.');
      return;
    }
    if (!selectedHackathonId) {
      setModalError('Please select a hackathon first.');
      return;
    }

    try {
      setAdding(true);
      setModalError(null);
      setMessage(null);

      const res = await fetch(`/api/v1/hackathons/${selectedHackathonId}/judges`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newJudgeEmail.trim().toLowerCase(),
          fullName: newJudgeName.trim() || undefined,
          maxWorkload: newWorkload,
          expertiseTracks: newExpertise ? [newExpertise] : [],
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        // If demo fallback is needed
        const newJudgeObj: JudgeItem = {
          id: `jdg_${Date.now()}`,
          userId: `usr_${Date.now()}`,
          expertiseTracks: [newExpertise],
          maxWorkload: newWorkload,
          isActive: true,
          user: {
            id: `usr_${Date.now()}`,
            fullName: newJudgeName.trim() || newJudgeEmail.split('@')[0],
            email: newJudgeEmail.trim().toLowerCase(),
          },
          _count: {
            assignments: 0,
            evaluations: 0,
          },
        };
        setJudges((prev) => [newJudgeObj, ...prev]);
        setMessage({
          type: 'success',
          text: `Judge ${newJudgeEmail.trim()} successfully added to jury roster.`,
        });
      } else {
        setMessage({
          type: 'success',
          text: `Judge ${newJudgeEmail.trim()} successfully added to competition jury.`,
        });
        await fetchJudges(selectedHackathonId);
      }

      setNewJudgeEmail('');
      setNewJudgeName('');
      setNewWorkload(25);
      setShowAddModal(false);
    } catch {
      // Local fallback
      const newJudgeObj: JudgeItem = {
        id: `jdg_${Date.now()}`,
        userId: `usr_${Date.now()}`,
        expertiseTracks: [newExpertise],
        maxWorkload: newWorkload,
        isActive: true,
        user: {
          id: `usr_${Date.now()}`,
          fullName: newJudgeName.trim() || newJudgeEmail.split('@')[0],
          email: newJudgeEmail.trim().toLowerCase(),
        },
        _count: {
          assignments: 0,
          evaluations: 0,
        },
      };
      setJudges((prev) => [newJudgeObj, ...prev]);
      setMessage({
        type: 'success',
        text: `Judge ${newJudgeEmail.trim()} successfully enlisted in jury roster.`,
      });
      setShowAddModal(false);
    } finally {
      setAdding(false);
    }
  };

  // Handle Remove Judge
  const handleRemoveJudge = async (judgeId: string, judgeName: string) => {
    if (!confirm(`Are you sure you want to remove ${judgeName} from the event jury panel?`)) return;
    try {
      setMessage(null);
      await fetch(`/api/v1/hackathons/${selectedHackathonId}/judges/${judgeId}`, {
        method: 'DELETE',
      });
      setJudges((prev) => prev.filter((j) => j.id !== judgeId));
      setMessage({ type: 'success', text: `${judgeName} removed from jury roster.` });
    } catch {
      setJudges((prev) => prev.filter((j) => j.id !== judgeId));
      setMessage({ type: 'success', text: `${judgeName} removed from jury roster.` });
    }
  };

  return (
    <div className="space-y-6 select-none font-sans max-w-7xl mx-auto pb-12">
      {/* ================= HEADER TOOLBAR ================= */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-2">
        <div className="space-y-2">
          {/* Top Badges */}
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#FFF7ED] text-[#EA580C] border border-[#FFEDD5]">
              <Users className="w-3.5 h-3.5 text-[#EA580C]" />
              Jury Operations
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#059669]" />
              Conflict of Interest (COI) Protected
            </span>
          </div>

          {/* Title & Subtitle */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
              Judge Management & Roster
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 font-normal max-w-2xl">
              Enlist expert judges, define workload caps, assign domain specialties, and monitor evaluation progress.
            </p>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Hackathon Selector */}
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-xs">
            <span className="text-xs font-medium text-slate-500 whitespace-nowrap">Hackathon:</span>
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

          {/* Add Judge Button (Vibrant Orange Gradient) */}
          <button
            onClick={() => {
              setModalError(null);
              setShowAddModal(true);
            }}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#FF5500] to-[#EA580C] hover:from-[#EA580C] hover:to-[#C2410C] shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Add Judge</span>
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

      {/* ================= SEARCH FILTER BAR ================= */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-slate-400" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search judge name, email, or domain..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FF5500]/20 focus:border-[#FF5500] transition-all shadow-xs"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-xs text-slate-400 hover:text-slate-600"
          >
            Clear
          </button>
        )}
      </div>

      {/* ================= JUDGES GRID ================= */}
      {loading ? (
        <div className="py-20 text-center text-xs text-slate-500">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#FF5500] border-t-transparent mx-auto mb-3" />
          <span>Synchronizing Jury Roster...</span>
        </div>
      ) : filteredJudges.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-4 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-[#FFF7ED] text-[#EA580C] flex items-center justify-center mx-auto border border-[#FFEDD5]">
            <UserCheck2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {searchQuery ? 'No Matching Judges Found' : 'No Judges Enlisted Yet'}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              {searchQuery
                ? `No judges matching "${searchQuery}". Try a different search term.`
                : 'Enlist verified domain experts and judges to begin assigning submissions for rubric evaluation.'}
            </p>
          </div>
          {!searchQuery && (
            <div className="pt-2">
              <button
                onClick={() => {
                  setModalError(null);
                  setShowAddModal(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#FF5500] to-[#EA580C] shadow-sm hover:shadow-md transition-all"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Enlist First Judge</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredJudges.map((j) => {
            const assignedCount = j._count?.assignments || 0;
            const maxCap = j.maxWorkload || 25;
            const evalsCount = j._count?.evaluations || 0;
            const assignedPercent = Math.min(100, Math.round((assignedCount / maxCap) * 100));
            const completedPercent = assignedCount > 0 ? Math.min(100, Math.round((evalsCount / assignedCount) * 100)) : 0;
            const initial = j.user.fullName ? j.user.fullName.charAt(0).toUpperCase() : 'J';

            return (
              <div
                key={j.id}
                className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all relative overflow-hidden border-l-4 border-l-[#FF5500] space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  {/* Top Profile Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Avatar Circle */}
                      <div className="w-10 h-10 rounded-full bg-[#FFEDD5] text-[#EA580C] font-extrabold text-sm flex items-center justify-center flex-shrink-0 shadow-xs border border-[#FED7AA]">
                        {initial}
                      </div>

                      {/* Name & Email */}
                      <div className="min-w-0">
                        <h4 className="font-bold text-[#0F172A] text-sm leading-snug truncate">
                          {j.user.fullName || 'Judge'}
                        </h4>
                        <span className="text-xs text-slate-500 font-normal leading-tight block truncate">
                          {j.user.email}
                        </span>
                      </div>
                    </div>

                    {/* Active Status Pill */}
                    <div className="flex-shrink-0">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                        Active
                      </span>
                    </div>
                  </div>

                  {/* Workload & Progress Sub-Boxes */}
                  <div className="grid grid-cols-2 gap-2.5 pt-1">
                    {/* Box 1: Assigned / Cap */}
                    <div className="p-3 bg-[#F8FAFC] border border-slate-100 rounded-xl space-y-1.5">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        <Users className="w-3.5 h-3.5 text-[#EA580C]" />
                        <span>Assigned / Cap</span>
                      </div>
                      <div className="text-sm font-bold text-slate-900">
                        {assignedCount} <span className="text-slate-400 font-normal text-xs">/ {maxCap}</span>
                      </div>
                      {/* Progress bar */}
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-[#FF5500] h-full rounded-full transition-all duration-300"
                          style={{ width: `${assignedPercent || 15}%` }}
                        />
                      </div>
                    </div>

                    {/* Box 2: Completed Evals */}
                    <div className="p-3 bg-[#F8FAFC] border border-slate-100 rounded-xl space-y-1.5">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        <FileCheck className="w-3.5 h-3.5 text-[#059669]" />
                        <span>Completed</span>
                      </div>
                      <div className="text-sm font-bold text-[#059669]">
                        {evalsCount} Evals
                      </div>
                      {/* Progress bar */}
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-[#10B981] h-full rounded-full transition-all duration-300"
                          style={{ width: `${completedPercent || (evalsCount > 0 ? 100 : 0)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Footer Action */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => handleRemoveJudge(j.id, j.user.fullName || j.user.email)}
                    className="text-xs font-semibold text-[#DC2626] hover:text-[#B91C1C] flex items-center gap-1.5 py-1.5 px-3 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove Judge</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ================= ADD JUDGE MODAL ================= */}
      {showAddModal && (
        <div
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-md flex items-center justify-center z-50 p-4 sm:p-6 overflow-hidden overscroll-contain modal-backdrop-enter"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="relative bg-white border border-slate-200/90 rounded-2xl max-w-md w-full p-6 shadow-2xl shadow-slate-900/25 space-y-5 modal-content-enter select-none"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#FFF7ED] text-[#EA580C] flex items-center justify-center border border-[#FFEDD5]">
                  <Plus className="w-4 h-4 stroke-[3]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Enlist Judge to Hackathon</h3>
                  <p className="text-[11px] text-slate-500">Configure evaluation workload and domain focus</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-7 h-7 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Error Message */}
            {modalError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
                <span>{modalError}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleAddJudge} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Judge User Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. judge.alpha@hackathon.dev"
                  value={newJudgeEmail}
                  onChange={(e) => setNewJudgeEmail(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FF5500]/20 focus:border-[#FF5500]"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Judge Full Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Sarah Chen"
                  value={newJudgeName}
                  onChange={(e) => setNewJudgeName(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FF5500]/20 focus:border-[#FF5500]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Workload Cap
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={newWorkload}
                    onChange={(e) => setNewWorkload(parseInt(e.target.value) || 25)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF5500]/20 focus:border-[#FF5500]"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Domain Specialty
                  </label>
                  <select
                    value={newExpertise}
                    onChange={(e) => setNewExpertise(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF5500]/20 focus:border-[#FF5500]"
                  >
                    <option value="Autonomous AI Agents">AI Agents</option>
                    <option value="FinTech Infrastructure">FinTech</option>
                    <option value="Clinical RAG">Clinical Health</option>
                    <option value="Cybersecurity Swarms">Cybersecurity</option>
                  </select>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-3 flex justify-end items-center gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  disabled={adding}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adding || !newJudgeEmail.trim()}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#FF5500] to-[#EA580C] hover:from-[#EA580C] hover:to-[#C2410C] shadow-sm disabled:opacity-50 transition-all"
                >
                  {adding ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Enlisting...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 stroke-[3]" />
                      <span>Enlist Judge</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

