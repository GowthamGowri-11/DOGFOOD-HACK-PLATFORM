'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
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
  ArrowUpDown,
  Filter,
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
  const [selectedHackathonId, setSelectedHackathonId] = useState<string>('all');
  const [judges, setJudges] = useState<JudgeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'available' | 'assigned'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'workload' | 'name'>('newest');

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

  // Initials badge color styling
  const getInitialsBadgeStyle = (name: string) => {
    const styles = [
      'bg-blue-50 text-blue-600 border-blue-200',
      'bg-purple-50 text-purple-600 border-purple-200',
      'bg-emerald-50 text-emerald-700 border-emerald-200',
      'bg-amber-50 text-amber-700 border-amber-200',
      'bg-rose-50 text-rose-600 border-rose-200',
      'bg-orange-50 text-orange-600 border-orange-200',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
    return styles[hash % styles.length];
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
            const defaultHackathon = json.data.selectedHackathonId || 'all';
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
          expertiseTracks: newJudgeTrack.trim()
            ? newJudgeTrack.split(',').map((t) => t.trim()).filter(Boolean)
            : ['AI & Cloud Systems'],
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

  // Tab counts
  const counts = useMemo(() => {
    const total = judges.length;
    const available = judges.filter((j) => j.assignmentsCount === 0).length;
    const assigned = judges.filter((j) => j.assignmentsCount > 0).length;
    return { total, available, assigned };
  }, [judges]);

  const filteredJudges = useMemo(() => {
    let list = judges.filter((j) => {
      if (filterTab === 'available' && j.assignmentsCount > 0) return false;
      if (filterTab === 'assigned' && j.assignmentsCount === 0) return false;

      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchesName = j.fullName.toLowerCase().includes(q);
        const matchesEmail = j.email.toLowerCase().includes(q);
        const matchesHackathon = j.hackathonTitle.toLowerCase().includes(q);
        const matchesTrack = j.expertiseTracks?.some((t) => t.toLowerCase().includes(q));
        const matchesTeam = j.assignedTeams.some((t) => t.teamName.toLowerCase().includes(q));
        return matchesName || matchesEmail || matchesHackathon || matchesTrack || matchesTeam;
      }
      return true;
    });

    list.sort((a, b) => {
      if (sortBy === 'name') return a.fullName.localeCompare(b.fullName);
      if (sortBy === 'workload') return b.assignmentsCount - a.assignmentsCount;
      return 0; // Default order
    });

    return list;
  }, [judges, search, filterTab, sortBy]);

  const selectedHackathonObj = hackathons.find((h) => h.id === selectedHackathonId);
  const calculatedTeamsPerJudge =
    stats.activeJudges > 0 ? Math.round(stats.totalTeams / stats.activeJudges) : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20 select-none font-sans">
      {/* Toast Feedback */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 animate-in fade-in slide-in-from-top-3 duration-200">
          <div
            className={`px-4 py-3 rounded-2xl shadow-xl flex items-center space-x-2 text-xs font-semibold ${
              toast.type === 'success'
                ? 'bg-zinc-900 text-white border border-zinc-700'
                : 'bg-rose-600 text-white'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-white" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Breadcrumb Navigation */}
      <nav className="flex items-center space-x-2 text-xs text-zinc-400 font-medium">
        <Link href="/" className="hover:text-orange-600 transition-colors">
          Home
        </Link>
        <span>&rsaquo;</span>
        <Link href="/admin/dashboard" className="hover:text-orange-600 transition-colors">
          Admin
        </Link>
        <span>&rsaquo;</span>
        <span className="text-zinc-800 font-semibold">Judges</span>
      </nav>

      {/* Top Header - Matching Image Reference with Orange Theme */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 gap-4 border-b border-zinc-100">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#FA541C] to-[#E03A00] flex items-center justify-center text-white shadow-md shadow-orange-500/20 flex-shrink-0">
            <Scale className="w-5 h-5 stroke-[2.3]" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">
                Judge Roster &amp; Assignment Engine
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Auto Engine Ready</span>
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5 font-normal">
              Add or remove judges, execute automated balanced team distribution, and monitor evaluation workloads.
            </p>
          </div>
        </div>

        {/* Action Buttons: Add Judge, Run Engine, Reset, Export, Refresh */}
        <div className="flex flex-col sm:items-end gap-2">
          {/* Row 1: Primary Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Add Judge Button - Orange Site Theme */}
            <button
              onClick={() => setAddJudgeModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-gradient-to-r from-[#FA541C] to-[#E03A00] hover:from-[#E03A00] hover:to-[#C83200] rounded-xl shadow-md shadow-orange-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Add Judge</span>
            </button>

            {/* Run Assignment Engine Button */}
            <button
              onClick={() => setAssignEngineModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-zinc-800 bg-white border border-zinc-200 hover:border-orange-300 hover:bg-orange-50/50 hover:text-orange-600 rounded-xl shadow-xs transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 text-[#FA541C] fill-[#FA541C]" />
              <span>Run Assignment Engine</span>
            </button>

            {/* Reset Assignments Button */}
            {stats.assignedTeams > 0 && (
              <button
                onClick={() => setResetConfirmModalOpen(true)}
                title="Reset all assignments"
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-zinc-600 bg-white border border-zinc-200 hover:bg-zinc-50 hover:text-rose-600 hover:border-rose-200 rounded-xl shadow-xs transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}

            {/* Export CSV */}
            <button
              onClick={handleExportCsv}
              disabled={filteredJudges.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-zinc-800 bg-white border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 rounded-xl shadow-xs transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-3.5 h-3.5 text-zinc-500" />
              <span>Export</span>
            </button>

            {/* Refresh */}
            <button
              onClick={() => loadJudgesData(selectedHackathonId, true)}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-zinc-800 bg-white border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 rounded-xl shadow-xs transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-zinc-500 ${refreshing ? 'animate-spin text-[#FA541C]' : ''}`} />
              <span className="hidden sm:inline">{refreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Select Hackathon Event Banner & 4 Dynamic Stat Cards */}
      <div className="bg-white border border-zinc-200/90 rounded-2xl p-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-5 transition-all">
        {/* Left: Dynamic Hackathon Selector */}
        <div className="space-y-2 flex-1 max-w-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-800 uppercase tracking-wider">
              <Trophy className="w-3.5 h-3.5 text-[#FA541C]" />
              <span>SELECT HACKATHON EVENT:</span>
            </div>
            {selectedHackathonObj && (
              <span className="text-[10px] font-bold text-zinc-400 hidden sm:inline-block">
                Status: {selectedHackathonObj.status.replace(/_/g, ' ')}
              </span>
            )}
          </div>

          <div className="relative">
            <select
              value={selectedHackathonId}
              onChange={(e) => handleHackathonChange(e.target.value)}
              className="w-full px-4 py-2.5 text-xs font-bold text-zinc-900 bg-white border border-zinc-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 rounded-xl focus:outline-none appearance-none cursor-pointer pr-10 shadow-xs transition-all hover:border-zinc-300"
            >
              <option value="all" className="font-bold text-xs">
                🌐 All Hackathons (Combined View)
              </option>
              {hackathons.map((h) => (
                <option key={h.id} value={h.id} className="font-bold text-xs">
                  {h.title} {h.status ? `(${h.status.replace(/_/g, ' ')})` : ''}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-zinc-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Active Arena Badge & Allocation Pill */}
          <div className="flex flex-wrap items-center gap-2 pt-0.5">
            <span className="text-[11px] text-zinc-400 font-medium">Active Arena:</span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-zinc-100 text-zinc-700 border border-zinc-200">
              {selectedHackathonId === 'all'
                ? 'All Events Combined'
                : selectedHackathonObj?.title || 'Selected Hackathon'}
            </span>
            {stats.totalJudges > 0 && stats.totalTeams > 0 && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-50 text-orange-600 border border-orange-200">
                Allocation: ~{calculatedTeamsPerJudge} teams per judge
              </span>
            )}
          </div>
        </div>

        {/* Right: 4 Dynamic KPI Metric Cards matching layout */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Card 1: Judges */}
          <button
            type="button"
            onClick={() => setFilterTab('all')}
            title="Click to view all judges"
            className={`group flex items-center gap-3.5 px-4 py-3 rounded-2xl min-w-[130px] border transition-all duration-300 cursor-pointer text-left hover:-translate-y-1 hover:shadow-md active:scale-95 ${
              filterTab === 'all'
                ? 'bg-orange-50/40 border-orange-300 ring-2 ring-orange-500/15 shadow-xs'
                : 'bg-zinc-50/70 border-zinc-200/90 hover:bg-white hover:border-zinc-300'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center border border-orange-200 text-[#FA541C] shadow-2xs group-hover:scale-110 transition-transform duration-300">
              <UserCheck2 className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">JUDGES</div>
              <div className="text-2xl font-black text-zinc-900 leading-none mt-0.5">{stats.totalJudges}</div>
            </div>
          </button>

          {/* Card 2: Teams */}
          <div className="group flex items-center gap-3.5 px-4 py-3 bg-zinc-50/70 border border-zinc-200/90 rounded-2xl min-w-[130px] hover:bg-white hover:border-zinc-300 transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center border border-purple-200 text-purple-600 shadow-2xs group-hover:scale-110 transition-transform duration-300">
              <Users className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">TEAMS</div>
              <div className="text-2xl font-black text-zinc-900 leading-none mt-0.5">{stats.totalTeams}</div>
            </div>
          </div>

          {/* Card 3: Assigned Teams */}
          <button
            type="button"
            onClick={() => setFilterTab(filterTab === 'assigned' ? 'all' : 'assigned')}
            title="Click to filter by assigned judges"
            className={`group flex items-center gap-3.5 px-4 py-3 rounded-2xl min-w-[145px] border transition-all duration-300 cursor-pointer text-left hover:-translate-y-1 hover:shadow-md active:scale-95 ${
              filterTab === 'assigned'
                ? 'bg-emerald-50/50 border-emerald-300 ring-2 ring-emerald-500/15 shadow-xs'
                : 'bg-zinc-50/70 border-zinc-200/90 hover:bg-white hover:border-zinc-300'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center border border-emerald-200 text-emerald-600 shadow-2xs group-hover:scale-110 transition-transform duration-300">
              <CheckCircle2 className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">ASSIGNED</div>
              <div className="text-2xl font-black text-emerald-700 leading-none mt-0.5">
                {stats.assignedTeams} / {stats.totalTeams}
              </div>
            </div>
          </button>

          {/* Card 4: Load Per Judge */}
          <div className="group flex items-center gap-3.5 px-4 py-3 bg-zinc-50/70 border border-zinc-200/90 rounded-2xl min-w-[135px] hover:bg-white hover:border-zinc-300 transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center border border-orange-200 text-orange-600 shadow-2xs group-hover:scale-110 transition-transform duration-300">
              <Layers className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-orange-600 uppercase tracking-wider">LOAD / JUDGE</div>
              <div className="text-2xl font-black text-orange-600 leading-none mt-0.5">
                {stats.avgTeamsPerJudge} teams
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar & Filter Tabs */}
      <div className="bg-white border border-zinc-200/90 rounded-2xl p-2.5 sm:p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        {/* Search Input */}
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search judges by name, email, or assigned team name..."
            className="w-full pl-10 pr-9 py-2 text-xs bg-transparent border-0 focus:outline-none text-zinc-900 placeholder:text-zinc-400 font-medium"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 p-0.5 rounded-full transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Sort & Filter Tabs */}
        <div className="flex items-center gap-2 self-end sm:self-auto border-t sm:border-t-0 pt-2 sm:pt-0 border-zinc-100">
          <div className="flex items-center gap-1.5 text-xs text-zinc-500 pr-2 border-r border-zinc-200">
            <ArrowUpDown className="w-3.5 h-3.5 text-zinc-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-xs font-bold text-zinc-700 focus:outline-none cursor-pointer"
            >
              <option value="newest">Sort: Newest</option>
              <option value="workload">Sort: Workload</option>
              <option value="name">Sort: Name</option>
            </select>
          </div>

          {/* Status Tabs with Brand Orange Active Highlight */}
          <div className="flex items-center gap-1.5">
            {[
              { key: 'all', label: 'All', count: counts.total },
              { key: 'available', label: 'Available', count: counts.available },
              { key: 'assigned', label: 'Assigned', count: counts.assigned },
            ].map((tab) => {
              const active = filterTab === tab.key;

              return (
                <button
                  key={tab.key}
                  onClick={() => setFilterTab(tab.key as any)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-1.5 hover:scale-105 active:scale-95 ${
                    active
                      ? 'bg-gradient-to-r from-[#FA541C] to-[#E03A00] text-white shadow-md shadow-orange-500/20'
                      : 'bg-white text-zinc-600 border border-zinc-200/90 hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                      active ? 'bg-white/20 text-white' : 'bg-zinc-100 text-zinc-600'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Judges Table */}
      <div className="bg-white border border-zinc-200/90 rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-xs text-zinc-500 flex flex-col items-center justify-center space-y-3">
            <RefreshCw className="w-7 h-7 animate-spin text-[#FA541C]" />
            <p className="font-bold text-zinc-900 text-sm">Loading judge roster and assignments...</p>
            <p className="text-xs text-zinc-400">Analyzing workload allocations across arenas</p>
          </div>
        ) : filteredJudges.length === 0 ? (
          <div className="py-16 text-center space-y-3 px-4">
            <div className="w-12 h-12 rounded-2xl bg-zinc-50 border border-zinc-200 flex items-center justify-center mx-auto text-zinc-400">
              <UserCheck2 className="w-6 h-6 stroke-[1.8]" />
            </div>
            <p className="text-sm font-bold text-zinc-900">No judges found</p>
            <p className="text-xs text-zinc-500 max-w-md mx-auto">
              {search || filterTab !== 'all'
                ? `No judges match filter "${filterTab}" or search "${search}". Try resetting your filters.`
                : 'No judges assigned yet to this hackathon event. Click "Add Judge" to get started.'}
            </p>
            <div className="pt-2 flex items-center justify-center gap-2">
              {(search || filterTab !== 'all') && (
                <button
                  onClick={() => {
                    setSearch('');
                    setFilterTab('all');
                  }}
                  className="px-4 py-2 text-xs font-bold text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-xl border border-orange-200 transition-colors cursor-pointer"
                >
                  Reset Filters
                </button>
              )}
              <button
                onClick={() => setAddJudgeModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-[#FA541C] to-[#E03A00] hover:from-[#E03A00] hover:to-[#C83200] rounded-xl shadow-xs transition-all cursor-pointer hover:scale-105 active:scale-95"
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
                <tr className="border-b border-zinc-100 text-[11px] font-bold text-zinc-400 uppercase tracking-wider bg-zinc-50/70">
                  <th className="py-4 px-6">JUDGE &amp; EXPERTISE</th>
                  <th className="py-4 px-6">HACKATHON</th>
                  <th className="py-4 px-6">ASSIGNED TEAMS ({stats.assignedTeams} TOTAL)</th>
                  <th className="py-4 px-6">WORKLOAD &amp; PROGRESS</th>
                  <th className="py-4 px-6 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredJudges.map((judge) => {
                  const workloadPct = Math.min(
                    100,
                    Math.round((judge.assignmentsCount / (judge.maxWorkload || 1)) * 100)
                  );
                  const initialsStyle = getInitialsBadgeStyle(judge.fullName);

                  return (
                    <tr
                      key={judge.id}
                      className="hover:bg-orange-50/20 transition-all duration-200 group"
                    >
                      {/* JUDGE & EXPERTISE */}
                      <td className="py-4 px-6 align-middle">
                        <div className="flex items-start gap-3.5">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs border flex-shrink-0 mt-0.5 shadow-2xs group-hover:scale-105 transition-transform duration-200 ${initialsStyle}`}
                          >
                            {judge.fullName.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-zinc-900 text-sm tracking-tight group-hover:text-[#FA541C] transition-colors">
                              {judge.fullName}
                            </div>
                            <div className="text-[11px] text-zinc-500 font-medium">{judge.email}</div>

                            {/* Expertise Tracks */}
                            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                              {judge.expertiseTracks?.length > 0 ? (
                                judge.expertiseTracks.map((t, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold text-zinc-700 bg-zinc-100 border border-zinc-200/90"
                                  >
                                    {t}
                                  </span>
                                ))
                              ) : (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold text-zinc-400 bg-zinc-50 border border-zinc-200/90 italic">
                                  General Track
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* HACKATHON */}
                      <td className="py-4 px-6 align-middle whitespace-nowrap">
                        <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold text-sky-800 bg-sky-50 border border-sky-200">
                          {judge.hackathonTitle}
                        </span>
                      </td>

                      {/* ASSIGNED TEAMS */}
                      <td className="py-4 px-6 align-middle">
                        <div className="space-y-1.5 max-w-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-zinc-900">
                              {judge.assignmentsCount} team{judge.assignmentsCount !== 1 ? 's' : ''} assigned
                            </span>
                            {judge.assignmentsCount > 0 && (
                              <button
                                onClick={() => setViewingJudgeTeams(judge)}
                                className="text-[11px] text-[#FA541C] hover:text-[#E03A00] hover:underline font-bold transition-colors cursor-pointer"
                              >
                                View List &rarr;
                              </button>
                            )}
                          </div>

                          {/* Team Chips Preview */}
                          <div className="flex flex-wrap items-center gap-1 max-h-16 overflow-hidden">
                            {judge.assignedTeams?.length > 0 ? (
                              judge.assignedTeams.slice(0, 3).map((t) => (
                                <span
                                  key={t.assignmentId}
                                  className="px-2.5 py-0.5 rounded-full text-xs font-semibold text-zinc-700 bg-zinc-100 border border-zinc-200/80"
                                >
                                  {t.teamName}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-zinc-400 italic">
                                No teams assigned yet &bull; Run engine to distribute
                              </span>
                            )}
                            {judge.assignedTeams?.length > 3 && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-zinc-500 bg-zinc-100 border border-zinc-200">
                                +{judge.assignedTeams.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* WORKLOAD & PROGRESS */}
                      <td className="py-4 px-6 align-middle whitespace-nowrap">
                        <div className="space-y-1.5 min-w-[140px]">
                          <div className="flex justify-between text-xs">
                            <span className="font-semibold text-zinc-900">
                              {judge.assignmentsCount} / {judge.maxWorkload} max
                            </span>
                            <span className="text-zinc-500 text-[11px] font-bold">{workloadPct}%</span>
                          </div>

                          <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-[#FA541C] to-[#E03A00] h-full rounded-full transition-all duration-300"
                              style={{ width: `${workloadPct}%` }}
                            />
                          </div>

                          <div className="text-[10px] text-zinc-500 flex items-center gap-1.5">
                            <span className="text-emerald-700 font-bold">
                              ● {judge.completedEvaluationsCount} completed
                            </span>
                            <span>&bull;</span>
                            <span className="text-amber-700 font-bold">
                              ● {judge.pendingEvaluationsCount} pending
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* ACTIONS */}
                      <td className="py-4 px-6 align-middle text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => setViewingJudgeTeams(judge)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-700 bg-white border border-zinc-200 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 rounded-xl shadow-2xs transition-all hover:scale-105 active:scale-95 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 text-zinc-500" />
                            <span>Teams</span>
                          </button>

                          <button
                            onClick={() => setDeletingJudge(judge)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 bg-white border border-zinc-200 hover:bg-rose-50 hover:border-rose-200 rounded-xl shadow-2xs transition-all hover:scale-105 active:scale-95 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
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
          <div className="bg-white rounded-3xl max-w-md w-full border border-zinc-200 shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-50 text-[#FA541C] flex items-center justify-center border border-orange-200">
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900">Add Evaluator to Roster</h3>
                  <p className="text-[11px] text-zinc-500">
                    Assign judge to {selectedHackathonObj?.title || 'Hackathon Event'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAddJudgeModalOpen(false)}
                className="p-1.5 text-zinc-400 hover:bg-zinc-100 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddJudge} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-zinc-700">Judge Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Jordan Lee"
                  value={newJudgeName}
                  onChange={(e) => setNewJudgeName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 focus:outline-none transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-zinc-700">Judge Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. jordan.lee@apex-judges.dev"
                  value={newJudgeEmail}
                  onChange={(e) => setNewJudgeEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 focus:outline-none transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-zinc-700">Expertise / Focus Track</label>
                <input
                  type="text"
                  placeholder="e.g. Fullstack Architecture, DevOps, Autonomous Agents"
                  value={newJudgeTrack}
                  onChange={(e) => setNewJudgeTrack(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 focus:outline-none transition-all"
                />
                <span className="text-[10px] text-zinc-400">Separate multiple skills with commas</span>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-zinc-700">Max Workload (Projects Capacity)</label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={newJudgeWorkload}
                  onChange={(e) => setNewJudgeWorkload(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 focus:outline-none transition-all"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setAddJudgeModalOpen(false)}
                  disabled={actionInProgress}
                  className="px-4 py-2 font-bold text-zinc-700 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionInProgress}
                  className="inline-flex items-center gap-1.5 px-4 py-2 font-bold text-white bg-gradient-to-r from-[#FA541C] to-[#E03A00] hover:from-[#E03A00] hover:to-[#C83200] rounded-xl shadow-xs transition-all hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-60"
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
          <div className="bg-white rounded-3xl max-w-md w-full border border-zinc-200 shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#FA541C] flex items-center justify-center mx-auto border border-orange-200">
              <Sparkles className="w-6 h-6 stroke-[2.2]" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-zinc-900">Auto-Assign Teams Engine</h3>
              <p className="text-xs text-zinc-500">
                Evenly and randomly distribute all teams across judges for{' '}
                <span className="font-bold text-zinc-900">{selectedHackathonObj?.title || 'Selected Event'}</span>.
              </p>
            </div>

            {/* Allocation breakdown card */}
            <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-2xl space-y-2 text-xs">
              <div className="font-bold text-zinc-900 flex items-center justify-between">
                <span>Distribution Breakdown</span>
                <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200">
                  Random Split
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                <div className="p-2 bg-white rounded-xl border border-zinc-200">
                  <span className="text-zinc-500 block">Total Teams:</span>
                  <span className="font-black text-sm text-zinc-900">{stats.totalTeams}</span>
                </div>
                <div className="p-2 bg-white rounded-xl border border-zinc-200">
                  <span className="text-zinc-500 block">Active Judges:</span>
                  <span className="font-black text-sm text-zinc-900">{stats.activeJudges}</span>
                </div>
              </div>
              <div className="pt-1 text-orange-600 font-semibold text-[11px] leading-relaxed">
                ⚡ Each judge will be randomly assigned ~{calculatedTeamsPerJudge} team
                {calculatedTeamsPerJudge !== 1 ? 's' : ''} (Fisher-Yates random shuffle).
              </div>
            </div>

            <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl text-xs text-orange-800 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#FA541C]" />
                <span>Fair &amp; Balanced Assignment:</span>
              </p>
              <p className="text-[11px] leading-relaxed text-orange-700">
                The engine analyses all participating teams, shuffles them with cryptographic randomness, and splits
                workload evenly so no judge is overburdened.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setAssignEngineModalOpen(false)}
                disabled={actionInProgress}
                className="px-4 py-2 text-xs font-bold text-zinc-700 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleExecuteEngine}
                disabled={actionInProgress || stats.activeJudges === 0 || stats.totalTeams === 0}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-[#FA541C] to-[#E03A00] hover:from-[#E03A00] hover:to-[#C83200] rounded-xl transition-all shadow-xs cursor-pointer hover:scale-105 active:scale-95 disabled:opacity-60"
              >
                {actionInProgress ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Executing Engine...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>Confirm &amp; Execute Split</span>
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
          <div className="bg-white rounded-3xl max-w-md w-full border border-zinc-200 shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
              <RotateCcw className="w-6 h-6 stroke-[2.2]" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-zinc-900">Reset Team Assignments</h3>
              <p className="text-xs text-zinc-500">
                Are you sure you want to clear all team assignments for{' '}
                <span className="font-bold text-zinc-900">{selectedHackathonObj?.title || 'this Hackathon'}</span>?
              </p>
            </div>

            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
              This will unassign all teams from their judges, allowing you to re-run the assignment engine fresh.
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setResetConfirmModalOpen(false)}
                disabled={actionInProgress}
                className="px-4 py-2 text-xs font-bold text-zinc-700 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetAssignments}
                disabled={actionInProgress}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-all cursor-pointer hover:scale-105 active:scale-95 disabled:opacity-60"
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
          <div className="bg-white rounded-3xl max-w-xl w-full border border-zinc-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-6 border-b border-zinc-100 flex items-start justify-between bg-gradient-to-r from-white to-orange-50/20">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-zinc-900">{viewingJudgeTeams.fullName}</h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold text-orange-600 bg-orange-50 border border-orange-200">
                    {viewingJudgeTeams.assignmentsCount} Teams Assigned
                  </span>
                </div>
                <p className="text-xs text-zinc-500">
                  {viewingJudgeTeams.email} &bull; {viewingJudgeTeams.hackathonTitle}
                </p>
              </div>
              <button
                onClick={() => setViewingJudgeTeams(null)}
                className="p-1.5 text-zinc-400 hover:bg-zinc-100 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content: List of Assigned Teams */}
            <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto text-xs">
              {viewingJudgeTeams.assignedTeams?.length > 0 ? (
                <div className="divide-y divide-zinc-100 border border-zinc-200 rounded-2xl overflow-hidden bg-white">
                  {viewingJudgeTeams.assignedTeams.map((t, idx) => (
                    <div
                      key={t.assignmentId}
                      className="p-3.5 flex items-center justify-between hover:bg-orange-50/20 transition-colors"
                    >
                      <div className="space-y-0.5">
                        <div className="font-bold text-sm text-zinc-900 flex items-center gap-2">
                          <span>{t.teamName}</span>
                          <span className="text-[10px] font-mono text-zinc-400">#{idx + 1}</span>
                        </div>
                        <div className="text-[11px] text-zinc-500 font-semibold">{t.projectTitle}</div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200">
                        Assigned
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-zinc-500 bg-zinc-50 rounded-2xl border border-zinc-200">
                  No teams currently assigned to this judge. Click &ldquo;Run Assignment Engine&rdquo; to distribute.
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-zinc-100 flex items-center justify-end bg-zinc-50">
              <button
                onClick={() => setViewingJudgeTeams(null)}
                className="px-4 py-2 text-xs font-bold text-zinc-700 bg-white border border-zinc-200 hover:bg-zinc-100 rounded-xl transition-colors cursor-pointer"
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
          <div className="bg-white rounded-3xl max-w-md w-full border border-zinc-200 shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
              <Trash2 className="w-6 h-6 stroke-[2.2]" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-zinc-900">Remove Judge from Roster</h3>
              <p className="text-xs text-zinc-500">
                Are you sure you want to remove{' '}
                <span className="font-bold text-zinc-900">&ldquo;{deletingJudge.fullName}&rdquo;</span> from{' '}
                {deletingJudge.hackathonTitle}?
              </p>
            </div>

            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 space-y-1">
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
                className="px-4 py-2 text-xs font-bold text-zinc-700 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={confirmRemoveJudge}
                disabled={actionInProgress}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-all shadow-xs cursor-pointer hover:scale-105 active:scale-95 disabled:opacity-60"
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
