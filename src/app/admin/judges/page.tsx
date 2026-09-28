'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  UserCheck2,
  Scale,
  Search,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertCircle,
  AlertTriangle,
  Play,
  Trophy,
  Plus,
  Trash2,
  RefreshCw,
  Download,
  X,
  ExternalLink,
  ChevronDown,
  Layers,
  Sparkles,
  Users,
  Eye,
  Mail,
  Shield,
  RotateCcw,
  Check,
  Copy,
} from 'lucide-react';

interface AssignedTeamInfo {
  assignmentId: string;
  projectId: string;
  projectTitle: string;
  teamId?: string;
  teamName: string;
  status: string;
  assignedAt: string;
}

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
  assignedTeams: AssignedTeamInfo[];
  completedEvaluationsCount: number;
  pendingEvaluationsCount: number;
}

interface HackathonOption {
  id: string;
  title: string;
  slug: string;
  status: string;
}

export default function AdminJudgesPage() {
  const [hackathons, setHackathons] = useState<HackathonOption[]>([]);
  const [selectedHackathonId, setSelectedHackathonId] = useState<string>('');
  const [judges, setJudges] = useState<JudgeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  // Stats
  const [stats, setStats] = useState({
    totalJudges: 0,
    activeJudges: 0,
    totalTeams: 0,
    assignedTeams: 0,
    avgTeamsPerJudge: 0,
  });

  // Modals
  const [addJudgeModalOpen, setAddJudgeModalOpen] = useState(false);
  const [assignEngineModalOpen, setAssignEngineModalOpen] = useState(false);
  const [resetConfirmModalOpen, setResetConfirmModalOpen] = useState(false);
  const [viewingJudgeTeams, setViewingJudgeTeams] = useState<JudgeItem | null>(null);
  const [deletingJudge, setDeletingJudge] = useState<JudgeItem | null>(null);
  const [actionInProgress, setActionInProgress] = useState(false);

  // Add Judge Form State
  const [newJudgeName, setNewJudgeName] = useState('');
  const [newJudgeEmail, setNewJudgeEmail] = useState('');
  const [newJudgeWorkload, setNewJudgeWorkload] = useState(25);
  const [newJudgeTrack, setNewJudgeTrack] = useState('');

  // Toast Feedback
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // Fetch Judges and Hackathons
  const loadJudgesData = useCallback(
    async (hackathonIdToFetch?: string, isManual = false) => {
      if (isManual) setRefreshing(true);
      else setLoading(true);

      try {
        const targetHackathonId = hackathonIdToFetch !== undefined ? hackathonIdToFetch : selectedHackathonId;
        const params = new URLSearchParams();
        if (targetHackathonId) {
          params.append('hackathonId', targetHackathonId);
        }

        const res = await fetch(`/api/v1/admin/judges?${params.toString()}`);
        const json = await res.json();

        if (json.success && json.data) {
          const fetchedHackathons: HackathonOption[] = json.data.hackathons || [];
          setHackathons(fetchedHackathons);

          if (!targetHackathonId && fetchedHackathons.length > 0) {
            const defaultHackathon = json.data.selectedHackathonId || fetchedHackathons[0]?.id;
            setSelectedHackathonId(defaultHackathon);
          } else if (targetHackathonId) {
            setSelectedHackathonId(targetHackathonId);
          }

          setJudges(json.data.judges || []);

          if (json.data.stats) {
            setStats(json.data.stats);
          }

          if (isManual) {
            showToast('Judge roster and workload metrics refreshed!');
          }
        } else {
          if (isManual) showToast(json.error?.message || 'Failed to load judges', 'error');
        }
      } catch (err) {
        console.error('Failed to fetch judges:', err);
        if (isManual) showToast('Network error while refreshing judges.', 'error');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [selectedHackathonId]
  );

  useEffect(() => {
    loadJudgesData();
  }, []);

  const handleHackathonChange = (newHackathonId: string) => {
    setSelectedHackathonId(newHackathonId);
    loadJudgesData(newHackathonId);
  };

  // Add Judge Handler
  const handleAddJudge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJudgeName.trim() || !newJudgeEmail.trim()) {
      showToast('Please provide both Judge Name and Email', 'error');
      return;
    }

    const targetHackathon = selectedHackathonId === 'all' ? hackathons[0]?.id : selectedHackathonId;
    if (!targetHackathon) {
      showToast('Please select a hackathon event first', 'error');
      return;
    }

    setActionInProgress(true);
    try {
      const res = await fetch('/api/v1/admin/judges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ADD_JUDGE',
          hackathonId: targetHackathon,
          fullName: newJudgeName.trim(),
          email: newJudgeEmail.trim(),
          maxWorkload: Number(newJudgeWorkload) || 25,
          expertiseTracks: newJudgeTrack.trim() ? [newJudgeTrack.trim()] : ['AI & Cloud Systems'],
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast(`Judge ${newJudgeName.trim()} added successfully!`);
        setAddJudgeModalOpen(false);
        setNewJudgeName('');
        setNewJudgeEmail('');
        setNewJudgeTrack('');
        loadJudgesData(targetHackathon);
      } else {
        showToast(data.error?.message || 'Failed to add judge', 'error');
      }
    } catch {
      showToast('Network error while adding judge', 'error');
    } finally {
      setActionInProgress(false);
    }
  };

  // Auto-Assign Engine Execution Handler
  const handleExecuteEngine = async () => {
    const targetHackathon = selectedHackathonId === 'all' ? hackathons[0]?.id : selectedHackathonId;
    if (!targetHackathon) {
      showToast('Please select a specific hackathon event first', 'error');
      return;
    }

    setActionInProgress(true);
    try {
      const res = await fetch('/api/v1/admin/judges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'AUTO_ASSIGN',
          hackathonId: targetHackathon,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'Engine distributed teams evenly across judges!');
        setAssignEngineModalOpen(false);
        loadJudgesData(targetHackathon);
      } else {
        showToast(data.error?.message || 'Failed to execute assignment engine', 'error');
      }
    } catch {
      showToast('Network error while running assignment engine', 'error');
    } finally {
      setActionInProgress(false);
    }
  };

  // Reset Assignments Handler
  const handleResetAssignments = async () => {
    const targetHackathon = selectedHackathonId === 'all' ? hackathons[0]?.id : selectedHackathonId;
    if (!targetHackathon) return;

    setActionInProgress(true);
    try {
      const res = await fetch('/api/v1/admin/judges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'RESET_ASSIGNMENTS',
          hackathonId: targetHackathon,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast('All judge assignments cleared for this hackathon.');
        setResetConfirmModalOpen(false);
        loadJudgesData(targetHackathon);
      } else {
        showToast(data.error?.message || 'Failed to reset assignments', 'error');
      }
    } catch {
      showToast('Network error while resetting assignments', 'error');
    } finally {
      setActionInProgress(false);
    }
  };

  // Remove Judge Handler
  const confirmRemoveJudge = async () => {
    if (!deletingJudge) return;

    setActionInProgress(true);
    try {
      const res = await fetch(`/api/v1/admin/judges?id=${deletingJudge.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (data.success) {
        showToast(`Judge ${deletingJudge.fullName} removed from roster.`);
        setDeletingJudge(null);
        loadJudgesData(selectedHackathonId);
      } else {
        showToast(data.error?.message || 'Failed to remove judge', 'error');
      }
    } catch {
      showToast('Network error while removing judge', 'error');
    } finally {
      setActionInProgress(false);
    }
  };

  // Export CSV
  const handleExportCsv = () => {
    if (filteredJudges.length === 0) {
      showToast('No judges to export.', 'error');
      return;
    }

    const headers = [
      'Judge Name',
      'Email',
      'Hackathon',
      'Assigned Teams Count',
      'Assigned Teams Names',
      'Max Workload',
      'Completed Evals',
      'Pending Evals',
    ];

    const rows = filteredJudges.map((j) => {
      const teamNames = j.assignedTeams.map((t) => t.teamName).join('; ');
      return [
        `"${j.fullName.replace(/"/g, '""')}"`,
        `"${j.email.replace(/"/g, '""')}"`,
        `"${j.hackathonTitle.replace(/"/g, '""')}"`,
        j.assignmentsCount,
        `"${teamNames.replace(/"/g, '""')}"`,
        j.maxWorkload,
        j.completedEvaluationsCount,
        j.pendingEvaluationsCount,
      ];
    });

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `judges_roster_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(`Exported ${filteredJudges.length} judges to CSV!`);
  };

  const filteredJudges = useMemo(() => {
    if (!search.trim()) return judges;
    const q = search.toLowerCase().trim();
    return judges.filter(
      (j) =>
        j.fullName.toLowerCase().includes(q) ||
        j.email.toLowerCase().includes(q) ||
        j.hackathonTitle.toLowerCase().includes(q) ||
        j.assignedTeams.some((t) => t.teamName.toLowerCase().includes(q))
    );
  }, [judges, search]);

  const selectedHackathonObj = hackathons.find((h) => h.id === selectedHackathonId);
  const calculatedTeamsPerJudge =
    stats.activeJudges > 0 ? Math.round(stats.totalTeams / stats.activeJudges) : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans">
      {/* Toast Feedback */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 animate-in fade-in slide-in-from-top-3 duration-200">
          <div
            className={`px-4 py-3 rounded-2xl shadow-xl flex items-center space-x-2 text-xs font-semibold ${
              toast.type === 'success'
                ? 'bg-[#0f172a] text-white border border-[#334155]'
                : 'bg-[#dc2626] text-white'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-[#10b981]" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-white" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#eff6ff] flex items-center justify-center text-[#2563eb] flex-shrink-0 border border-[#dbeafe] shadow-2xs">
            <Scale className="w-5 h-5 stroke-[2.3]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-[#0f172a] tracking-tight">
                Judge Roster & Assignment Engine
              </h1>
              <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#eff6ff] text-[#2563eb] border border-[#dbeafe]">
                Auto Engine Ready
              </span>
            </div>
            <p className="text-xs text-[#64748b] mt-0.5">
              Add or remove judges, execute automated balanced team distribution, and monitor evaluation workloads.
            </p>
          </div>
        </div>

        {/* Action Buttons: Add Judge, Run Engine, Reset, Export */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Add Judge Button */}
          <button
            onClick={() => setAddJudgeModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-[#2563eb] hover:bg-[#1d4ed8] rounded-xl shadow-xs transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Judge</span>
          </button>

          {/* Run Assignment Engine Button */}
          <button
            onClick={() => setAssignEngineModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-[#0f172a] bg-white border border-[#2563eb]/40 hover:bg-[#eff6ff] hover:text-[#2563eb] rounded-xl shadow-xs transition-all cursor-pointer active:scale-95"
          >
            <Play className="w-3.5 h-3.5 text-[#2563eb] fill-[#2563eb]" />
            <span>Run Assignment Engine</span>
          </button>

          {/* Reset Assignments Button */}
          {stats.assignedTeams > 0 && (
            <button
              onClick={() => setResetConfirmModalOpen(true)}
              title="Reset all assignments"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#64748b] bg-white border border-[#e2e8f0] hover:bg-[#f8fafc] hover:text-[#dc2626] hover:border-[#fecaca] rounded-xl shadow-2xs transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}

          {/* Export CSV */}
          <button
            onClick={handleExportCsv}
            disabled={filteredJudges.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#0f172a] bg-white border border-[#e2e8f0] hover:bg-[#f8fafc] rounded-xl shadow-2xs transition-all cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-[#64748b]" />
            <span>Export</span>
          </button>

          {/* Refresh */}
          <button
            onClick={() => loadJudgesData(selectedHackathonId, true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#0f172a] bg-white border border-[#e2e8f0] hover:bg-[#f8fafc] rounded-xl shadow-2xs transition-all cursor-pointer disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#64748b] ${refreshing ? 'animate-spin text-[#2563eb]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Select Hackathon Event Banner & Dynamic Stat Cards */}
      <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-5 transition-all">
        {/* Left: Dynamic Hackathon Selector */}
        <div className="space-y-2 flex-1 max-w-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#1e293b] uppercase tracking-wider">
              <Trophy className="w-3.5 h-3.5 text-[#2563eb]" />
              <span>SELECT HACKATHON EVENT:</span>
            </div>
            {selectedHackathonObj && (
              <span className="text-[10px] font-bold text-[#64748b] hidden sm:inline-block">
                Status: {selectedHackathonObj.status.replace(/_/g, ' ')}
              </span>
            )}
          </div>

          <div className="relative">
            <select
              value={selectedHackathonId}
              onChange={(e) => handleHackathonChange(e.target.value)}
              className="w-full px-4 py-3 text-sm font-bold text-[#0f172a] bg-white border border-[#cbd5e1] focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/15 rounded-xl focus:outline-none appearance-none cursor-pointer pr-10 shadow-2xs transition-all hover:border-[#94a3b8]"
            >
              <option value="all" className="font-bold text-sm">
                🌐 All Hackathons (Combined View)
              </option>
              {hackathons.map((h) => (
                <option key={h.id} value={h.id} className="font-bold text-sm">
                  {h.title} {h.status ? `(${h.status.replace(/_/g, ' ')})` : ''}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-[#64748b] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Active Status Badge */}
          <div className="flex flex-wrap items-center gap-2 pt-0.5">
            <span className="text-[11px] text-[#64748b] font-medium">Active Arena:</span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#f1f5f9] text-[#334155] border border-[#e2e8f0]">
              {selectedHackathonId === 'all'
                ? 'All Events Combined'
                : selectedHackathonObj?.title || 'Selected Hackathon'}
            </span>
            {stats.totalJudges > 0 && stats.totalTeams > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#eff6ff] text-[#2563eb] border border-[#dbeafe]">
                Allocation: ~{calculatedTeamsPerJudge} teams per judge
              </span>
            )}
          </div>
        </div>

        {/* Right: Dynamic KPI Metric Cards */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Total Judges */}
          <div className="flex items-center gap-3 px-5 py-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl min-w-[125px]">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center border border-[#e2e8f0] shadow-2xs">
              <UserCheck2 className="w-5 h-5 text-[#2563eb] stroke-[2.2]" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-[#64748b] uppercase tracking-wider">JUDGES</div>
              <div className="text-2xl font-black text-[#0f172a] leading-none mt-0.5">{stats.totalJudges}</div>
            </div>
          </div>

          {/* Total Teams */}
          <div className="flex items-center gap-3 px-5 py-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl min-w-[125px]">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center border border-[#e2e8f0] shadow-2xs">
              <Users className="w-5 h-5 text-[#475569] stroke-[2.2]" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-[#64748b] uppercase tracking-wider">TEAMS</div>
              <div className="text-2xl font-black text-[#0f172a] leading-none mt-0.5">{stats.totalTeams}</div>
            </div>
          </div>

          {/* Assigned Teams */}
          <div className="flex items-center gap-3 px-5 py-3 bg-[#ecfdf5] border border-[#a7f3d0] rounded-2xl min-w-[145px]">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center border border-[#a7f3d0] shadow-2xs">
              <CheckCircle2 className="w-5 h-5 text-[#059669] stroke-[2.2]" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-[#059669] uppercase tracking-wider">ASSIGNED</div>
              <div className="text-2xl font-black text-[#065f46] leading-none mt-0.5">
                {stats.assignedTeams} / {stats.totalTeams}
              </div>
            </div>
          </div>

          {/* Teams Per Judge Allocation */}
          <div className="flex items-center gap-3 px-4 py-3 bg-[#eff6ff] border border-[#dbeafe] rounded-2xl min-w-[130px]">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center border border-[#dbeafe] shadow-2xs text-[#2563eb]">
              <Sparkles className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-[#2563eb] uppercase tracking-wider">LOAD / JUDGE</div>
              <div className="text-2xl font-black text-[#1e40af] leading-none mt-0.5">
                {stats.avgTeamsPerJudge} teams
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="bg-white border border-[#e2e8f0] rounded-2xl p-2.5 sm:p-3 flex items-center justify-between shadow-2xs">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-[#94a3b8] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search judges by name, email, or assigned team name..."
            className="w-full pl-10 pr-9 py-2 text-xs bg-transparent border-0 focus:outline-none text-[#0f172a] placeholder:text-[#94a3b8] font-medium"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#0f172a] p-0.5 rounded-full"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Judges Table */}
      <div className="bg-white border border-[#e2e8f0] rounded-2xl shadow-2xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-xs text-[#64748b] flex flex-col items-center justify-center space-y-3">
            <RefreshCw className="w-7 h-7 animate-spin text-[#2563eb]" />
            <p className="font-bold text-[#0f172a] text-sm">Loading judge roster and assignments...</p>
            <p className="text-xs text-[#94a3b8]">Analyzing workload allocations from PostgreSQL</p>
          </div>
        ) : filteredJudges.length === 0 ? (
          <div className="py-16 text-center space-y-3 px-4">
            <div className="w-12 h-12 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0] flex items-center justify-center mx-auto text-[#94a3b8]">
              <UserCheck2 className="w-6 h-6 stroke-[1.8]" />
            </div>
            <p className="text-sm font-bold text-[#0f172a]">No judges found</p>
            <p className="text-xs text-[#64748b] max-w-md mx-auto">
              {search
                ? `No judges match your search "${search}". Try resetting the search.`
                : 'No judges assigned yet to this hackathon event. Click "Add Judge" to get started.'}
            </p>
            <div className="pt-2">
              <button
                onClick={() => setAddJudgeModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#2563eb] hover:bg-[#1d4ed8] rounded-xl transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add First Judge</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#f1f5f9] text-[11px] font-bold text-[#64748b] uppercase tracking-wider bg-[#fafafa]">
                  <th className="py-4 px-6">JUDGE & EXPERTISE</th>
                  <th className="py-4 px-6">HACKATHON</th>
                  <th className="py-4 px-6">ASSIGNED TEAMS ({stats.assignedTeams} TOTAL)</th>
                  <th className="py-4 px-6">WORKLOAD & PROGRESS</th>
                  <th className="py-4 px-6 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f5f9]">
                {filteredJudges.map((judge) => {
                  const workloadPct = Math.min(
                    100,
                    Math.round((judge.assignmentsCount / (judge.maxWorkload || 1)) * 100)
                  );

                  return (
                    <tr key={judge.id} className="hover:bg-[#f8faff] transition-colors group">
                      {/* JUDGE & EXPERTISE */}
                      <td className="py-4 px-6 align-middle">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#eff6ff] to-[#dbeafe] flex items-center justify-center font-bold text-[#2563eb] text-xs border border-[#bfdbfe] flex-shrink-0 mt-0.5">
                            {judge.fullName.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-[#0f172a] text-sm tracking-tight group-hover:text-[#2563eb] transition-colors">
                              {judge.fullName}
                            </div>
                            <div className="text-[11px] text-[#64748b] font-medium">{judge.email}</div>

                            {/* Expertise Tracks */}
                            <div className="flex flex-wrap items-center gap-1 mt-1">
                              {judge.expertiseTracks?.length > 0 ? (
                                judge.expertiseTracks.map((t, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-0.5 rounded-md text-[10px] font-semibold text-[#1e40af] bg-[#eff6ff] border border-[#bfdbfe]"
                                  >
                                    {t}
                                  </span>
                                ))
                              ) : (
                                <span className="text-[10px] text-[#94a3b8] italic">General Track</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* HACKATHON */}
                      <td className="py-4 px-6 align-middle whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold text-[#0369a1] bg-[#f0f9ff] border border-[#bae6fd]">
                          {judge.hackathonTitle}
                        </span>
                      </td>

                      {/* ASSIGNED TEAMS */}
                      <td className="py-4 px-6 align-middle">
                        <div className="space-y-1.5 max-w-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[#0f172a]">
                              {judge.assignmentsCount} team{judge.assignmentsCount !== 1 ? 's' : ''} assigned
                            </span>
                            {judge.assignmentsCount > 0 && (
                              <button
                                onClick={() => setViewingJudgeTeams(judge)}
                                className="text-[10px] text-[#2563eb] hover:underline font-bold"
                              >
                                View List &rarr;
                              </button>
                            )}
                          </div>

                          {/* Team Chips Preview */}
                          <div className="flex flex-wrap items-center gap-1 max-h-16 overflow-hidden">
                            {judge.assignedTeams?.length > 0 ? (
                              judge.assignedTeams.slice(0, 4).map((t) => (
                                <span
                                  key={t.assignmentId}
                                  className="px-2 py-0.5 rounded-full text-xs font-semibold text-[#334155] bg-[#f8fafc] border border-[#e2e8f0]"
                                >
                                  {t.teamName}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-[#94a3b8] italic">
                                No teams assigned yet &bull; Run engine to distribute
                              </span>
                            )}
                            {judge.assignedTeams?.length > 4 && (
                              <span className="text-[10px] font-bold text-[#64748b]">
                                +{judge.assignedTeams.length - 4} more
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* WORKLOAD & PROGRESS */}
                      <td className="py-4 px-6 align-middle whitespace-nowrap">
                        <div className="space-y-1.5 min-w-[140px]">
                          <div className="flex justify-between text-xs">
                            <span className="font-semibold text-[#0f172a]">
                              {judge.assignmentsCount} / {judge.maxWorkload} max
                            </span>
                            <span className="text-[#64748b] text-[11px] font-bold">{workloadPct}%</span>
                          </div>

                          <div className="w-full bg-[#e2e8f0] h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-[#2563eb] h-full rounded-full transition-all"
                              style={{ width: `${workloadPct}%` }}
                            />
                          </div>

                          <div className="text-[10px] text-[#64748b] flex items-center gap-1.5">
                            <span className="text-[#059669] font-bold">
                              {judge.completedEvaluationsCount} completed
                            </span>
                            <span>&bull;</span>
                            <span className="text-[#d97706] font-bold">
                              {judge.pendingEvaluationsCount} pending
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* ACTIONS */}
                      <td className="py-4 px-6 align-middle text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => setViewingJudgeTeams(judge)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#2563eb] bg-[#eff6ff] hover:bg-[#dbeafe] border border-[#bfdbfe] rounded-xl shadow-2xs transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Teams</span>
                          </button>

                          <button
                            onClick={() => setDeletingJudge(judge)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#dc2626] bg-white border border-[#e2e8f0] hover:bg-[#fef2f2] hover:border-[#fecaca] rounded-xl shadow-2xs transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-[#dc2626]" />
                            <span>Remove</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* ADD JUDGE MODAL */}
      {/* ======================================================== */}
      {addJudgeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full border border-[#e2e8f0] shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-[#f1f5f9]">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-[#eff6ff] text-[#2563eb] flex items-center justify-center border border-[#dbeafe]">
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#0f172a]">Add Evaluator to Roster</h3>
                  <p className="text-[11px] text-[#64748b]">Assign judge to {selectedHackathonObj?.title}</p>
                </div>
              </div>
              <button
                onClick={() => setAddJudgeModalOpen(false)}
                className="p-1.5 text-[#64748b] hover:bg-[#f1f5f9] rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddJudge} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-[#334155]">Judge Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Jordan Lee"
                  value={newJudgeName}
                  onChange={(e) => setNewJudgeName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#cbd5e1] focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/15 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#334155]">Judge Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. jordan.lee@apex-judges.dev"
                  value={newJudgeEmail}
                  onChange={(e) => setNewJudgeEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#cbd5e1] focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/15 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#334155]">Expertise / Focus Track</label>
                <input
                  type="text"
                  placeholder="e.g. Enterprise AI, Cloud Security, RAG"
                  value={newJudgeTrack}
                  onChange={(e) => setNewJudgeTrack(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#cbd5e1] focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/15 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#334155]">Max Workload (Projects Capacity)</label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={newJudgeWorkload}
                  onChange={(e) => setNewJudgeWorkload(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#cbd5e1] focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/15 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#f1f5f9]">
                <button
                  type="button"
                  onClick={() => setAddJudgeModalOpen(false)}
                  disabled={actionInProgress}
                  className="px-4 py-2 font-bold text-[#334155] bg-white border border-[#e2e8f0] hover:bg-[#f8fafc] rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionInProgress}
                  className="inline-flex items-center gap-1.5 px-4 py-2 font-bold text-white bg-[#2563eb] hover:bg-[#1d4ed8] rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-60"
                >
                  {actionInProgress ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Adding...</span>
                    </>
                  ) : (
                    <span>Add to Roster</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* AUTO-ASSIGNMENT ENGINE CONFIRMATION MODAL */}
      {/* ======================================================== */}
      {assignEngineModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full border border-[#e2e8f0] shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-[#eff6ff] text-[#2563eb] flex items-center justify-center mx-auto border border-[#dbeafe]">
              <Sparkles className="w-6 h-6 stroke-[2.2]" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-[#0f172a]">Auto-Assign Teams Engine</h3>
              <p className="text-xs text-[#64748b]">
                Evenly and randomly distribute all teams across judges for{' '}
                <span className="font-bold text-[#0f172a]">{selectedHackathonObj?.title}</span>.
              </p>
            </div>

            {/* Allocation breakdown card */}
            <div className="p-4 bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl space-y-2 text-xs">
              <div className="font-bold text-[#0f172a] flex items-center justify-between">
                <span>Distribution Breakdown</span>
                <span className="text-[10px] font-bold text-[#2563eb] bg-[#eff6ff] px-2 py-0.5 rounded-full border border-[#dbeafe]">
                  Random Split
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                <div className="p-2 bg-white rounded-xl border border-[#e2e8f0]">
                  <span className="text-[#64748b] block">Total Teams:</span>
                  <span className="font-black text-sm text-[#0f172a]">{stats.totalTeams}</span>
                </div>
                <div className="p-2 bg-white rounded-xl border border-[#e2e8f0]">
                  <span className="text-[#64748b] block">Active Judges:</span>
                  <span className="font-black text-sm text-[#0f172a]">{stats.activeJudges}</span>
                </div>
              </div>
              <div className="pt-1 text-[#2563eb] font-semibold text-[11px] leading-relaxed">
                ⚡ Each judge will be randomly assigned ~{calculatedTeamsPerJudge} team
                {calculatedTeamsPerJudge !== 1 ? 's' : ''} (Fisher-Yates random shuffle).
              </div>
            </div>

            <div className="p-3 bg-[#eff6ff] border border-[#bfdbfe] rounded-xl text-xs text-[#1e40af] space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#2563eb]" />
                <span>Fair & Balanced Assignment:</span>
              </p>
              <p className="text-[11px] leading-relaxed">
                The engine analyses all participating teams, shuffles them with cryptographic randomness, and splits
                workload evenly so no judge is overburdened.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setAssignEngineModalOpen(false)}
                disabled={actionInProgress}
                className="px-4 py-2 text-xs font-bold text-[#334155] bg-white border border-[#e2e8f0] hover:bg-[#f8fafc] rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleExecuteEngine}
                disabled={actionInProgress || stats.activeJudges === 0 || stats.totalTeams === 0}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#2563eb] hover:bg-[#1d4ed8] rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-60"
              >
                {actionInProgress ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Executing Engine...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>Confirm & Execute Split</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* RESET ASSIGNMENTS CONFIRMATION MODAL */}
      {/* ======================================================== */}
      {resetConfirmModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full border border-[#e2e8f0] shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-[#fee2e2] text-[#dc2626] flex items-center justify-center mx-auto border border-[#fecaca]">
              <RotateCcw className="w-6 h-6 stroke-[2.2]" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-[#0f172a]">Reset Team Assignments</h3>
              <p className="text-xs text-[#64748b]">
                Are you sure you want to clear all team assignments for{' '}
                <span className="font-bold text-[#0f172a]">{selectedHackathonObj?.title}</span>?
              </p>
            </div>

            <div className="p-3 bg-[#fef2f2] border border-[#fecaca] rounded-xl text-xs text-[#dc2626]">
              This will unassign all teams from their judges, allowing you to re-run the assignment engine fresh.
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setResetConfirmModalOpen(false)}
                disabled={actionInProgress}
                className="px-4 py-2 text-xs font-bold text-[#334155] bg-white border border-[#e2e8f0] hover:bg-[#f8fafc] rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetAssignments}
                disabled={actionInProgress}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#dc2626] hover:bg-[#b91c1c] rounded-xl transition-all cursor-pointer disabled:opacity-60"
              >
                {actionInProgress ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Resetting...</span>
                  </>
                ) : (
                  <span>Clear All Assignments</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* VIEW JUDGE ASSIGNED TEAMS MODAL */}
      {/* ======================================================== */}
      {viewingJudgeTeams && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full border border-[#e2e8f0] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-6 border-b border-[#f1f5f9] flex items-start justify-between bg-gradient-to-r from-white to-[#f8fafc]">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-[#0f172a]">{viewingJudgeTeams.fullName}</h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold text-[#2563eb] bg-[#eff6ff] border border-[#dbeafe]">
                    {viewingJudgeTeams.assignmentsCount} Teams Assigned
                  </span>
                </div>
                <p className="text-xs text-[#64748b]">
                  {viewingJudgeTeams.email} &bull; {viewingJudgeTeams.hackathonTitle}
                </p>
              </div>
              <button
                onClick={() => setViewingJudgeTeams(null)}
                className="p-1.5 text-[#64748b] hover:bg-[#f1f5f9] rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content: List of Assigned Teams */}
            <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto text-xs">
              {viewingJudgeTeams.assignedTeams?.length > 0 ? (
                <div className="divide-y divide-[#f1f5f9] border border-[#e2e8f0] rounded-2xl overflow-hidden bg-white">
                  {viewingJudgeTeams.assignedTeams.map((t, idx) => (
                    <div
                      key={t.assignmentId}
                      className="p-3.5 flex items-center justify-between hover:bg-[#f8faff] transition-colors"
                    >
                      <div className="space-y-0.5">
                        <div className="font-bold text-sm text-[#0f172a] flex items-center gap-2">
                          <span>{t.teamName}</span>
                          <span className="text-[10px] font-mono text-[#64748b]">#{idx + 1}</span>
                        </div>
                        <div className="text-[11px] text-[#2563eb] font-semibold">{t.projectTitle}</div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold text-[#059669] bg-[#ecfdf5] border border-[#a7f3d0]">
                        Assigned
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-[#64748b] bg-[#f8fafc] rounded-2xl border border-[#e2e8f0]">
                  No teams currently assigned to this judge. Click &ldquo;Run Assignment Engine&rdquo; to distribute.
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-[#f1f5f9] flex items-center justify-end bg-[#f8fafc]">
              <button
                onClick={() => setViewingJudgeTeams(null)}
                className="px-4 py-2 text-xs font-bold text-[#334155] bg-white border border-[#e2e8f0] hover:bg-[#f1f5f9] rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* REMOVE JUDGE CONFIRMATION MODAL */}
      {/* ======================================================== */}
      {deletingJudge && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full border border-[#e2e8f0] shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-[#fee2e2] text-[#dc2626] flex items-center justify-center mx-auto border border-[#fecaca]">
              <Trash2 className="w-6 h-6 stroke-[2.2]" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-[#0f172a]">Remove Judge from Roster</h3>
              <p className="text-xs text-[#64748b]">
                Are you sure you want to remove{' '}
                <span className="font-bold text-[#0f172a]">&ldquo;{deletingJudge.fullName}&rdquo;</span> from{' '}
                {deletingJudge.hackathonTitle}?
              </p>
            </div>

            <div className="p-3.5 bg-[#fef2f2] border border-[#fecaca] rounded-2xl text-xs text-[#dc2626] space-y-1">
              <p className="font-bold">Warning:</p>
              <p className="text-[11px] leading-relaxed">
                This will remove the judge from this event roster and unassign their {deletingJudge.assignmentsCount}{' '}
                assigned team(s).
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingJudge(null)}
                disabled={actionInProgress}
                className="px-4 py-2 text-xs font-bold text-[#334155] bg-white border border-[#e2e8f0] hover:bg-[#f8fafc] rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={confirmRemoveJudge}
                disabled={actionInProgress}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#dc2626] hover:bg-[#b91c1c] rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-60"
              >
                {actionInProgress ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Removing...</span>
                  </>
                ) : (
                  <span>Confirm Remove</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
