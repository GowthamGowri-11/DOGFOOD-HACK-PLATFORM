'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Users,
  Search,
  Trophy,
  CheckCircle2,
  Clock,
  Trash2,
  Eye,
  RefreshCw,
  Download,
  Filter,
  ChevronDown,
  X,
  AlertTriangle,
  ExternalLink,
  Shield,
  FolderGit2,
  Copy,
  Check,
  Layers,
  ArrowUpDown,
  Sparkles,
} from 'lucide-react';

interface TeamMember {
  id: string;
  isLeader: boolean;
  joinedAt: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    avatarUrl?: string | null;
  };
}

interface TeamItem {
  id: string;
  name: string;
  inviteCode: string;
  createdAt: string;
  status: 'REGISTERED' | 'PENDING';
  hackathon: {
    id: string;
    title: string;
    slug: string;
    status: string;
    minTeamSize?: number;
    maxTeamSize?: number;
  };
  members: TeamMember[];
  project?: {
    id: string;
    title: string;
    slug: string;
    repoUrl?: string;
    demoUrl?: string;
    track?: { id: string; title: string };
    problemStatement?: { id: string; title: string };
    submissions?: Array<{
      id: string;
      status: string;
      submittedAt: string | null;
      versionNumber: number;
    }>;
    judgeAssignments?: Array<{
      judge: {
        user: { fullName: string };
      };
    }>;
    evaluations?: Array<{ id: string; status: string; judgeId: string }>;
    result?: { rank: number; finalScore: number; isPublished: boolean } | null;
  } | null;
}

interface HackathonOption {
  id: string;
  title: string;
  slug: string;
  status: string;
  minTeamSize?: number;
  maxTeamSize?: number;
}

export default function AdminTeamsPage() {
  const [hackathons, setHackathons] = useState<HackathonOption[]>([]);
  const [selectedHackathonId, setSelectedHackathonId] = useState<string>('');
  const [teams, setTeams] = useState<TeamItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'REGISTERED'>('ALL');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name' | 'members'>('newest');

  // Dynamic stats loaded from database
  const [stats, setStats] = useState({
    total: 0,
    registered: 0,
    pending: 0,
  });

  // Modal dialog states
  const [viewingTeam, setViewingTeam] = useState<TeamItem | null>(null);
  const [deletingTeam, setDeletingTeam] = useState<TeamItem | null>(null);
  const [actionInProgress, setActionInProgress] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Toast feedback
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    showToast(`Invite code ${code} copied to clipboard!`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Date Formatter: "11 Aug 2026 03:32 PM"
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '—';
      const day = d.getDate();
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = monthNames[d.getMonth()];
      const year = d.getFullYear();
      let hours = d.getHours();
      const minutes = d.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      const formattedHours = hours.toString().padStart(2, '0');
      return `${day} ${month} ${year} ${formattedHours}:${minutes} ${ampm}`;
    } catch {
      return '—';
    }
  };

  // Fetch Teams and Hackathons dynamically
  const loadTeamsData = useCallback(
    async (hackathonIdToFetch?: string, isManual = false) => {
      if (isManual) setRefreshing(true);
      else setLoading(true);

      try {
        const targetHackathonId = hackathonIdToFetch !== undefined ? hackathonIdToFetch : selectedHackathonId;
        const params = new URLSearchParams();
        if (targetHackathonId) {
          params.append('hackathonId', targetHackathonId);
        }
        params.append('pageSize', '100');

        const res = await fetch(`/api/v1/admin/teams?${params.toString()}`);
        const json = await res.json();

        if (json.success && json.data) {
          const fetchedHackathons: HackathonOption[] = json.data.hackathons || [];
          setHackathons(fetchedHackathons);

          // If no hackathon currently selected, pick first active
          if (!targetHackathonId && fetchedHackathons.length > 0) {
            const defaultHackathon = json.data.selectedHackathonId || fetchedHackathons[0]?.id;
            setSelectedHackathonId(defaultHackathon);
          } else if (targetHackathonId) {
            setSelectedHackathonId(targetHackathonId);
          }

          setTeams(json.data.teams || []);

          // Completely dynamic stats from database
          if (json.data.stats) {
            setStats({
              total: json.data.stats.total ?? 0,
              registered: json.data.stats.registered ?? 0,
              pending: json.data.stats.pending ?? 0,
            });
          }

          if (isManual) {
            showToast('Teams and stats refreshed successfully!');
          }
        } else {
          if (isManual) showToast(json.error?.message || 'Failed to refresh data', 'error');
        }
      } catch (err) {
        console.error('Error fetching teams:', err);
        if (isManual) showToast('Network error while refreshing teams.', 'error');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [selectedHackathonId]
  );

  // Initial load
  useEffect(() => {
    loadTeamsData();
  }, []);

  // Handle hackathon selector change
  const handleHackathonChange = (newHackathonId: string) => {
    setSelectedHackathonId(newHackathonId);
    loadTeamsData(newHackathonId);
  };

  // Client-side search and sorting
  const displayedTeams = useMemo(() => {
    let result = teams.filter((team) => {
      if (statusFilter !== 'ALL' && team.status !== statusFilter) return false;
      if (search.trim()) {
        const query = search.toLowerCase().trim();
        const matchesName = team.name.toLowerCase().includes(query);
        const leader = team.members.find((m) => m.isLeader)?.user || team.members[0]?.user;
        const matchesLeader =
          leader?.fullName?.toLowerCase().includes(query) || leader?.email?.toLowerCase().includes(query);
        const matchesMember = team.members.some(
          (m) => m.user?.fullName?.toLowerCase().includes(query) || m.user?.email?.toLowerCase().includes(query)
        );
        const matchesCode = team.inviteCode?.toLowerCase().includes(query);
        const matchesProject = team.project?.title?.toLowerCase().includes(query);
        return matchesName || matchesLeader || matchesMember || matchesCode || matchesProject;
      }
      return true;
    });

    result.sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'members') return b.members.length - a.members.length;
      return 0;
    });

    return result;
  }, [teams, search, statusFilter, sortBy]);

  // Export CSV
  const handleExportCsv = () => {
    if (displayedTeams.length === 0) {
      showToast('No teams to export.', 'error');
      return;
    }

    const headers = [
      'Team Name',
      'Invite Code',
      'Leader Name',
      'Leader Email',
      'Members Count',
      'Members Names',
      'Status',
      'Hackathon',
      'Project Title',
      'Created At',
    ];

    const rows = displayedTeams.map((team) => {
      const leader = team.members.find((m) => m.isLeader)?.user || team.members[0]?.user;
      const otherMembers = team.members
        .filter((m) => !m.isLeader)
        .map((m) => m.user?.fullName)
        .filter(Boolean)
        .join('; ');

      return [
        `"${team.name.replace(/"/g, '""')}"`,
        `"${team.inviteCode}"`,
        `"${(leader?.fullName || '').replace(/"/g, '""')}"`,
        `"${(leader?.email || '').replace(/"/g, '""')}"`,
        team.members.length,
        `"${otherMembers.replace(/"/g, '""')}"`,
        team.status,
        `"${(team.hackathon?.title || '').replace(/"/g, '""')}"`,
        `"${(team.project?.title || 'No Project').replace(/"/g, '""')}"`,
        `"${formatDate(team.createdAt)}"`,
      ];
    });

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const activeHackathon = hackathons.find((h) => h.id === selectedHackathonId);
    const slug = activeHackathon?.slug || 'all-teams';
    link.setAttribute('href', url);
    link.setAttribute('download', `teams_${slug}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(`Exported ${displayedTeams.length} teams to CSV!`);
  };

  // Delete / Disband Team
  const confirmDeleteTeam = async () => {
    if (!deletingTeam) return;
    setActionInProgress(true);

    try {
      const res = await fetch(`/api/v1/admin/teams?id=${deletingTeam.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (data.success) {
        showToast(`Team "${deletingTeam.name}" has been disbanded.`);
        setTeams((prev) => prev.filter((t) => t.id !== deletingTeam.id));
        setStats((prev) => ({
          total: Math.max(0, prev.total - 1),
          registered:
            deletingTeam.status === 'REGISTERED' ? Math.max(0, prev.registered - 1) : prev.registered,
          pending:
            deletingTeam.status === 'PENDING' ? Math.max(0, prev.pending - 1) : prev.pending,
        }));
        setDeletingTeam(null);
      } else {
        showToast(data.error?.message || 'Failed to disband team', 'error');
      }
    } catch {
      showToast('Network error while deleting team', 'error');
    } finally {
      setActionInProgress(false);
    }
  };

  const selectedHackathonObj = hackathons.find((h) => h.id === selectedHackathonId);

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

      {/* Top Header - Matched to ApexHack Site Design */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#eff6ff] flex items-center justify-center text-[#2563eb] flex-shrink-0 border border-[#dbeafe] shadow-2xs">
            <Users className="w-5 h-5 stroke-[2.3]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-[#0f172a] tracking-tight">
                Team Management
              </h1>
              <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#eff6ff] text-[#2563eb] border border-[#dbeafe]">
                Live Sync
              </span>
            </div>
            <p className="text-xs text-[#64748b] mt-0.5">
              View participating teams and members for each hackathon.
            </p>
          </div>
        </div>

        {/* Action Buttons: Export CSV & Refresh */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCsv}
            disabled={displayedTeams.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-[#0f172a] bg-white border border-[#e2e8f0] hover:bg-[#f8fafc] hover:border-[#cbd5e1] rounded-xl shadow-2xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
          >
            <Download className="w-3.5 h-3.5 text-[#64748b]" />
            <span>Export CSV</span>
            {displayedTeams.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 bg-[#f1f5f9] text-[#475569] rounded-md text-[10px] font-extrabold">
                {displayedTeams.length}
              </span>
            )}
          </button>

          <button
            onClick={() => loadTeamsData(selectedHackathonId, true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-[#0f172a] bg-white border border-[#e2e8f0] hover:bg-[#f8fafc] hover:border-[#cbd5e1] rounded-xl shadow-2xs transition-all cursor-pointer disabled:opacity-60 active:scale-95"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#64748b] ${refreshing ? 'animate-spin text-[#2563eb]' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Select Hackathon Event Banner & Dynamic Stat Cards - Matched to ApexHack Blue Palette */}
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
                Min: {selectedHackathonObj.minTeamSize ?? 2} &bull; Max: {selectedHackathonObj.maxTeamSize ?? 4} per team
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

          {/* Event Status Badges */}
          <div className="flex flex-wrap items-center gap-2 pt-0.5">
            <span className="text-[11px] text-[#64748b] font-medium">Active Filter:</span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#f1f5f9] text-[#334155] border border-[#e2e8f0]">
              {selectedHackathonId === 'all'
                ? 'All Events Combined'
                : selectedHackathonObj?.title || 'Selected Hackathon'}
            </span>
            {selectedHackathonObj?.status && selectedHackathonId !== 'all' && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#ecfdf5] text-[#059669] border border-[#a7f3d0]">
                {selectedHackathonObj.status.replace(/_/g, ' ')}
              </span>
            )}
          </div>
        </div>

        {/* Right: Dynamic Interactive Stat Cards */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Total Teams Stat Card */}
          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            title="Click to view all teams"
            className={`flex items-center gap-3 px-5 py-3 rounded-2xl min-w-[130px] border transition-all cursor-pointer text-left ${
              statusFilter === 'ALL'
                ? 'bg-[#eff6ff] border-[#2563eb] ring-2 ring-[#2563eb]/20 shadow-xs scale-[1.02]'
                : 'bg-[#f8fafc] border-[#e2e8f0] hover:bg-[#f1f5f9] hover:border-[#cbd5e1]'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center border border-[#e2e8f0] shadow-2xs">
              <Users className="w-5 h-5 text-[#475569] stroke-[2.2]" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-[#64748b] uppercase tracking-wider">TEAMS</div>
              <div className="text-2xl font-black text-[#0f172a] leading-none mt-0.5">{stats.total}</div>
            </div>
          </button>

          {/* Registered Teams Stat Card */}
          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === 'REGISTERED' ? 'ALL' : 'REGISTERED')}
            title="Click to filter by registered teams (click again to clear)"
            className={`flex items-center gap-3 px-5 py-3 rounded-2xl min-w-[145px] border transition-all cursor-pointer text-left ${
              statusFilter === 'REGISTERED'
                ? 'bg-[#ecfdf5] border-[#059669] ring-2 ring-[#059669]/20 shadow-xs scale-[1.02]'
                : 'bg-[#f0fdf4]/60 border-[#bbf7d0] hover:bg-[#dcfce7] hover:border-[#86efac]'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center border border-[#bbf7d0] shadow-2xs">
              <CheckCircle2 className="w-5 h-5 text-[#059669] stroke-[2.2]" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-[#059669] uppercase tracking-wider">REGISTERED</div>
              <div className="text-2xl font-black text-[#065f46] leading-none mt-0.5">{stats.registered}</div>
            </div>
          </button>

          {/* Pending Teams Stat Card */}
          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === 'PENDING' ? 'ALL' : 'PENDING')}
            title="Click to filter by pending teams (click again to clear)"
            className={`flex items-center gap-3 px-5 py-3 rounded-2xl min-w-[135px] border transition-all cursor-pointer text-left ${
              statusFilter === 'PENDING'
                ? 'bg-[#fffbeb] border-[#d97706] ring-2 ring-[#d97706]/20 shadow-xs scale-[1.02]'
                : 'bg-[#fefce8]/60 border-[#fef08a] hover:bg-[#fef9c3] hover:border-[#fde047]'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center border border-[#fef08a] shadow-2xs">
              <Clock className="w-5 h-5 text-[#d97706] stroke-[2.2]" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-[#d97706] uppercase tracking-wider">PENDING</div>
              <div className="text-2xl font-black text-[#92400e] leading-none mt-0.5">{stats.pending}</div>
            </div>
          </button>
        </div>
      </div>

      {/* Search Bar & Filter Buttons */}
      <div className="bg-white border border-[#e2e8f0] rounded-2xl p-2.5 sm:p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        {/* Search Input */}
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-[#94a3b8] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search teams by name, leader, member, or code..."
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

        {/* Sort & Status Filter Controls */}
        <div className="flex items-center gap-2 self-end sm:self-auto border-t sm:border-t-0 pt-2 sm:pt-0 border-[#f1f5f9]">
          <div className="hidden md:flex items-center gap-1.5 text-xs text-[#64748b] pr-2 border-r border-[#e2e8f0]">
            <ArrowUpDown className="w-3 h-3 text-[#94a3b8]" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-xs font-semibold text-[#475569] focus:outline-none cursor-pointer"
            >
              <option value="newest">Sort: Newest</option>
              <option value="oldest">Sort: Oldest</option>
              <option value="name">Sort: Name (A-Z)</option>
              <option value="members">Sort: Most Members</option>
            </select>
          </div>

          <div className="flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-[#94a3b8] mr-1 hidden sm:inline-block" />
            {(['ALL', 'PENDING', 'REGISTERED'] as const).map((filter) => {
              const active = statusFilter === filter;
              const count =
                filter === 'ALL' ? stats.total : filter === 'PENDING' ? stats.pending : stats.registered;

              // Color matched to site theme: ALL is Apex Blue, PENDING is Amber, REGISTERED is Emerald
              const activeColorClass =
                filter === 'ALL'
                  ? 'bg-[#2563eb] text-white shadow-xs'
                  : filter === 'PENDING'
                  ? 'bg-[#d97706] text-white shadow-xs'
                  : 'bg-[#059669] text-white shadow-xs';

              return (
                <button
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                    active
                      ? activeColorClass
                      : 'text-[#64748b] hover:text-[#0f172a] hover:bg-[#f1f5f9]'
                  }`}
                >
                  <span>{filter}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                      active ? 'bg-white/20 text-white' : 'bg-[#e2e8f0] text-[#475569]'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Teams Table Container */}
      <div className="bg-white border border-[#e2e8f0] rounded-2xl shadow-2xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-xs text-[#64748b] flex flex-col items-center justify-center space-y-3">
            <RefreshCw className="w-7 h-7 animate-spin text-[#2563eb]" />
            <p className="font-bold text-[#0f172a] text-sm">Loading teams and participant records...</p>
            <p className="text-xs text-[#94a3b8]">Fetching dynamic roster data for the selected hackathon</p>
          </div>
        ) : displayedTeams.length === 0 ? (
          <div className="py-16 text-center space-y-3 px-4">
            <div className="w-12 h-12 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0] flex items-center justify-center mx-auto text-[#94a3b8]">
              <Users className="w-6 h-6 stroke-[1.8]" />
            </div>
            <p className="text-sm font-bold text-[#0f172a]">No teams found</p>
            <p className="text-xs text-[#64748b] max-w-md mx-auto">
              {search || statusFilter !== 'ALL'
                ? `No teams match the filter "${statusFilter}" or search query "${search}". Try resetting your filters.`
                : 'No participating teams registered yet for this hackathon event.'}
            </p>
            {(search || statusFilter !== 'ALL') && (
              <div className="pt-2">
                <button
                  onClick={() => {
                    setSearch('');
                    setStatusFilter('ALL');
                  }}
                  className="px-4 py-2 text-xs font-bold text-[#2563eb] bg-[#eff6ff] hover:bg-[#dbeafe] rounded-xl border border-[#bfdbfe] transition-colors cursor-pointer"
                >
                  Reset All Filters
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#f1f5f9] text-[11px] font-bold text-[#64748b] uppercase tracking-wider bg-[#fafafa]">
                  <th className="py-4 px-6">TEAM INFO</th>
                  <th className="py-4 px-6">MEMBERS</th>
                  <th className="py-4 px-6">STATUS</th>
                  <th className="py-4 px-6">CREATED AT</th>
                  <th className="py-4 px-6 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f5f9]">
                {displayedTeams.map((team) => {
                  const leader = team.members.find((m) => m.isLeader)?.user || team.members[0]?.user;
                  const otherMembers = team.members.filter((m) => !m.isLeader);
                  const minRequired = team.hackathon?.minTeamSize ?? 2;
                  const isRegistered = team.status === 'REGISTERED';

                  return (
                    <tr key={team.id} className="hover:bg-[#f8faff] transition-colors group">
                      {/* TEAM INFO */}
                      <td className="py-4 px-6 align-middle">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#eff6ff] to-[#dbeafe] flex items-center justify-center font-bold text-[#2563eb] text-xs border border-[#bfdbfe] flex-shrink-0 mt-0.5">
                            {team.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-[#0f172a] text-sm tracking-tight group-hover:text-[#2563eb] transition-colors">
                              {team.name}
                            </div>

                            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                              {/* Leader Pill */}
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold text-[#475569] bg-[#f8fafc] border border-[#e2e8f0] uppercase tracking-wider">
                                LEADER: {leader ? leader.fullName : 'UNASSIGNED'}
                              </span>

                              {/* Click-to-copy Invite Code */}
                              <button
                                type="button"
                                onClick={() => copyToClipboard(team.inviteCode)}
                                title="Click to copy invite code"
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold text-[#64748b] bg-[#f1f5f9] hover:bg-[#e2e8f0] hover:text-[#0f172a] border border-[#e2e8f0] transition-colors cursor-pointer"
                              >
                                <span>{team.inviteCode}</span>
                                {copiedCode === team.inviteCode ? (
                                  <Check className="w-2.5 h-2.5 text-[#059669]" />
                                ) : (
                                  <Copy className="w-2.5 h-2.5" />
                                )}
                              </button>

                              {/* Multi-hackathon indicator if viewing All */}
                              {selectedHackathonId === 'all' && team.hackathon?.title && (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold text-[#2563eb] bg-[#eff6ff] border border-[#dbeafe]">
                                  {team.hackathon.title}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* MEMBERS */}
                      <td className="py-4 px-6 align-middle">
                        <div className="space-y-1.5 max-w-sm">
                          <div className="flex items-center gap-1 text-[11px] font-semibold text-[#64748b]">
                            <span>{team.members.length} member{team.members.length !== 1 ? 's' : ''}</span>
                            <span className="text-[#94a3b8]">&bull;</span>
                            <span className="text-[10px] text-[#94a3b8]">
                              (Min {minRequired} required)
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-1">
                            {/* Leader Chip */}
                            {leader && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold text-[#1e40af] bg-[#eff6ff] border border-[#bfdbfe]">
                                <Shield className="w-2.5 h-2.5 text-[#2563eb]" />
                                <span>{leader.fullName}</span>
                              </span>
                            )}

                            {/* Member Chips */}
                            {otherMembers.length > 0 ? (
                              otherMembers.map((m) => (
                                <span
                                  key={m.id}
                                  className="px-2.5 py-0.5 rounded-full text-xs font-medium text-[#334155] bg-[#f8fafc] border border-[#e2e8f0]"
                                >
                                  {m.user.fullName}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-[#94a3b8] italic">No extra members</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* STATUS */}
                      <td className="py-4 px-6 align-middle">
                        {isRegistered ? (
                          <div className="inline-flex flex-col">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold text-[#059669] bg-[#ecfdf5] border border-[#a7f3d0] shadow-2xs">
                              <CheckCircle2 className="w-3 h-3 text-[#059669]" />
                              <span>REGISTERED</span>
                            </span>
                            <span className="text-[10px] text-[#059669]/80 font-medium mt-1 pl-1">
                              Ready for event
                            </span>
                          </div>
                        ) : (
                          <div className="inline-flex flex-col">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold text-[#d97706] bg-[#fffbeb] border border-[#fde68a] shadow-2xs">
                              <Clock className="w-3 h-3 text-[#d97706]" />
                              <span>PENDING</span>
                            </span>
                            <span className="text-[10px] text-[#d97706]/80 font-medium mt-1 pl-1">
                              Needs {minRequired - team.members.length} more member{minRequired - team.members.length > 1 ? 's' : ''}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* CREATED AT */}
                      <td className="py-4 px-6 align-middle whitespace-nowrap text-xs text-[#475569] font-medium">
                        {formatDate(team.createdAt)}
                      </td>

                      {/* ACTIONS */}
                      <td className="py-4 px-6 align-middle text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => setViewingTeam(team)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#334155] bg-white border border-[#e2e8f0] hover:bg-[#f8fafc] hover:border-[#cbd5e1] hover:text-[#2563eb] rounded-xl shadow-2xs transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 text-[#64748b]" />
                            <span>View</span>
                          </button>

                          <button
                            onClick={() => setDeletingTeam(team)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#dc2626] bg-white border border-[#e2e8f0] hover:bg-[#fef2f2] hover:border-[#fecaca] rounded-xl shadow-2xs transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-[#dc2626]" />
                            <span>Delete</span>
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
      {/* VIEW TEAM MODAL */}
      {/* ======================================================== */}
      {viewingTeam && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-[#e2e8f0] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-[#f1f5f9] flex items-start justify-between bg-gradient-to-r from-white to-[#f8fafc]">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <h2 className="text-xl font-bold text-[#0f172a]">{viewingTeam.name}</h2>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      viewingTeam.status === 'REGISTERED'
                        ? 'text-[#059669] bg-[#ecfdf5] border border-[#a7f3d0]'
                        : 'text-[#d97706] bg-[#fffbeb] border border-[#fde68a]'
                    }`}
                  >
                    {viewingTeam.status}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-[#64748b]">
                  <span className="font-semibold text-[#0f172a]">{viewingTeam.hackathon?.title}</span>
                  <span>&bull;</span>
                  <span>
                    Invite Code:{' '}
                    <span className="font-mono font-bold text-[#0f172a]">{viewingTeam.inviteCode}</span>
                  </span>
                  <button
                    onClick={() => copyToClipboard(viewingTeam.inviteCode)}
                    className="p-1 hover:bg-[#e2e8f0] rounded text-[#475569] transition-colors"
                    title="Copy code"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
              </div>
              <button
                onClick={() => setViewingTeam(null)}
                className="p-2 text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#0f172a] rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Leader Info Card */}
              <div className="p-4 bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl space-y-2">
                <div className="text-[10px] font-bold text-[#64748b] uppercase tracking-wider flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-[#2563eb]" />
                  <span>Team Leader Details</span>
                </div>
                {(() => {
                  const leader = viewingTeam.members.find((m) => m.isLeader)?.user || viewingTeam.members[0]?.user;
                  return (
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-sm text-[#0f172a]">{leader?.fullName || 'Not assigned'}</div>
                        <div className="text-xs text-[#64748b]">{leader?.email || '—'}</div>
                      </div>
                      <span className="text-[11px] font-bold text-[#2563eb] bg-[#eff6ff] px-2.5 py-0.5 rounded-full border border-[#dbeafe]">
                        Captain
                      </span>
                    </div>
                  );
                })()}
              </div>

              {/* Members Roster */}
              <div className="space-y-2.5">
                <div className="text-xs font-bold text-[#0f172a] flex items-center justify-between">
                  <span>Team Roster ({viewingTeam.members.length} members)</span>
                  <span className="text-[11px] text-[#64748b]">
                    Min required: {viewingTeam.hackathon?.minTeamSize ?? 2} &bull; Max allowed: {viewingTeam.hackathon?.maxTeamSize ?? 4}
                  </span>
                </div>
                <div className="divide-y divide-[#f1f5f9] border border-[#e2e8f0] rounded-2xl overflow-hidden bg-white">
                  {viewingTeam.members.map((m) => (
                    <div key={m.id} className="p-3.5 flex items-center justify-between hover:bg-[#f8fafc] transition-colors">
                      <div className="space-y-0.5">
                        <div className="text-xs font-bold text-[#0f172a] flex items-center gap-1.5">
                          <span>{m.user.fullName}</span>
                          {m.isLeader && (
                            <span className="text-[9px] font-extrabold text-[#2563eb] bg-[#eff6ff] px-1.5 py-0.5 rounded-sm border border-[#dbeafe]">
                              LEAD
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-[#64748b]">{m.user.email}</div>
                      </div>
                      <div className="text-[11px] text-[#64748b]">{formatDate(m.joinedAt)}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Project & Submission Info (if exists) */}
              {viewingTeam.project ? (
                <div className="p-4 bg-white border border-[#e2e8f0] rounded-2xl space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#0f172a] flex items-center gap-1.5">
                      <FolderGit2 className="w-3.5 h-3.5 text-[#059669]" />
                      <span>Project Submission</span>
                    </span>
                    <span className="text-[10px] font-bold text-[#059669] bg-[#ecfdf5] px-2 py-0.5 rounded-full border border-[#a7f3d0]">
                      Active Project
                    </span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#0f172a]">{viewingTeam.project.title}</h4>
                    {viewingTeam.project.track && (
                      <p className="text-xs text-[#2563eb] font-semibold mt-0.5">
                        Track: {viewingTeam.project.track.title}
                      </p>
                    )}
                  </div>
                  {viewingTeam.project.repoUrl && (
                    <div className="pt-1">
                      <a
                        href={viewingTeam.project.repoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-[#2563eb] hover:underline font-semibold"
                      >
                        <FolderGit2 className="w-3.5 h-3.5" />
                        <span>View Repository</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 bg-[#f8fafc] border border-dashed border-[#e2e8f0] rounded-2xl text-center">
                  <p className="text-xs text-[#64748b]">No project submission created yet for this team.</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#f1f5f9] flex items-center justify-end gap-2 bg-[#f8fafc]">
              <button
                onClick={() => setViewingTeam(null)}
                className="px-4 py-2 text-xs font-bold text-[#334155] bg-white border border-[#e2e8f0] hover:bg-[#f1f5f9] rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* DELETE TEAM CONFIRMATION MODAL */}
      {/* ======================================================== */}
      {deletingTeam && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full border border-[#e2e8f0] shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-[#fee2e2] text-[#dc2626] flex items-center justify-center mx-auto border border-[#fecaca]">
              <Trash2 className="w-6 h-6 stroke-[2.2]" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-[#0f172a]">Disband Team</h3>
              <p className="text-xs text-[#64748b]">
                Are you sure you want to disband and delete team{' '}
                <span className="font-bold text-[#0f172a]">&ldquo;{deletingTeam.name}&rdquo;</span>?
              </p>
            </div>

            <div className="p-3.5 bg-[#fef2f2] border border-[#fecaca] rounded-2xl text-xs text-[#dc2626] space-y-1">
              <p className="font-bold">Warning:</p>
              <p className="text-[11px] leading-relaxed">
                This will delete team registration, detach all {deletingTeam.members.length} member(s), and remove
                any associated project data. This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingTeam(null)}
                disabled={actionInProgress}
                className="px-4 py-2 text-xs font-bold text-[#334155] bg-white border border-[#e2e8f0] hover:bg-[#f8fafc] rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={confirmDeleteTeam}
                disabled={actionInProgress}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#dc2626] hover:bg-[#b91c1c] rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-60"
              >
                {actionInProgress ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Disbanding...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Confirm Disband</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
