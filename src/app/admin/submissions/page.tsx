'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  FileCheck,
  Search,
  ExternalLink,
  Code,
  CheckCircle2,
  Clock,
  ChevronDown,
  RefreshCw,
  Download,
  Filter,
  X,
  AlertTriangle,
  FolderGit2,
  Trophy,
  Users,
  Shield,
  Copy,
  Check,
  ArrowUpDown,
  Mail,
  Send,
  Eye,
  Github,
  Layers,
  TrendingUp,
  MoreVertical,
  User,
} from 'lucide-react';

interface TeamMemberItem {
  id: string;
  fullName: string;
  email: string;
  isLeader: boolean;
}

interface SubmissionTeamItem {
  id: string;
  team: {
    id: string;
    name: string;
    inviteCode: string;
    leader: { id: string; fullName: string; email: string } | null;
    membersCount: number;
    members: TeamMemberItem[];
  };
  hackathon: {
    id: string;
    title: string;
    slug: string;
    status: string;
    subEndTime: string;
    minTeamSize?: number;
    maxTeamSize?: number;
  };
  submissionStatus: 'SUBMITTED' | 'NOT_SUBMITTED' | 'DRAFT';
  project: {
    id: string;
    title: string;
    slug: string;
    repoUrl?: string;
    demoUrl?: string;
    techStack: string[];
    track?: { id: string; title: string };
    problemStatement?: { id: string; title: string };
    evaluationsCount: number;
    aiJuryScore: number | null;
  } | null;
  submission: {
    id: string;
    versionNumber: number;
    status: string;
    submittedAt: string | null;
    lockedAt: string | null;
    payloadSnapshot: any;
  } | null;
  createdAt: string;
}

interface HackathonOption {
  id: string;
  title: string;
  slug: string;
  status: string;
  subEndTime: string;
}

export default function AdminSubmissionsPage() {
  const [hackathons, setHackathons] = useState<HackathonOption[]>([]);
  const [selectedHackathonId, setSelectedHackathonId] = useState<string>('all');
  const [items, setItems] = useState<SubmissionTeamItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SUBMITTED' | 'NOT_SUBMITTED'>('ALL');
  const [sortBy, setSortBy] = useState<'newest' | 'status' | 'team'>('newest');

  // Dynamic Stats
  const [stats, setStats] = useState({
    total: 0,
    submitted: 0,
    notSubmitted: 0,
    submissionRate: 0,
  });

  // Modal dialog states
  const [inspectingItem, setInspectingItem] = useState<SubmissionTeamItem | null>(null);
  const [contactingTeam, setContactingTeam] = useState<SubmissionTeamItem | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Toast feedback
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  const copyToClipboard = (text: string, label = 'Copied') => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    showToast(`${label} copied to clipboard!`);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Date Formatter
  const formatDate = (dateStr: string | null) => {
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

  // Initials badge color styling
  const getInitialsBadgeStyle = (name: string) => {
    const styles = [
      'bg-blue-50 text-blue-600 border-blue-200',
      'bg-purple-50 text-purple-600 border-purple-200',
      'bg-amber-50 text-amber-700 border-amber-200',
      'bg-emerald-50 text-emerald-700 border-emerald-200',
      'bg-rose-50 text-rose-600 border-rose-200',
      'bg-orange-50 text-orange-600 border-orange-200',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
    return styles[hash % styles.length];
  };

  // Fetch Submissions and Teams dynamically
  const loadSubmissionsData = useCallback(
    async (hackathonIdToFetch?: string, isManual = false) => {
      if (isManual) setRefreshing(true);
      else setLoading(true);

      try {
        const targetHackathonId = hackathonIdToFetch !== undefined ? hackathonIdToFetch : selectedHackathonId;
        const params = new URLSearchParams();
        if (targetHackathonId && targetHackathonId !== 'all') {
          params.append('hackathonId', targetHackathonId);
        }
        params.append('pageSize', '150');

        const res = await fetch(`/api/v1/admin/submissions?${params.toString()}`);
        const json = await res.json();

        if (json.success && json.data) {
          const fetchedHackathons: HackathonOption[] = json.data.hackathons || [];
          setHackathons(fetchedHackathons);

          setItems(json.data.items || []);

          if (json.data.stats) {
            setStats({
              total: json.data.stats.total ?? 0,
              submitted: json.data.stats.submitted ?? 0,
              notSubmitted: json.data.stats.notSubmitted ?? 0,
              submissionRate: json.data.stats.submissionRate ?? 0,
            });
          }

          if (isManual) {
            showToast('Submissions roster and metrics refreshed successfully!');
          }
        } else {
          if (isManual) showToast(json.error?.message || 'Failed to refresh data', 'error');
        }
      } catch (err) {
        console.error('Error fetching submissions:', err);
        if (isManual) showToast('Network error while refreshing submissions.', 'error');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [selectedHackathonId]
  );

  useEffect(() => {
    loadSubmissionsData();
  }, []);

  const handleHackathonChange = (newHackathonId: string) => {
    setSelectedHackathonId(newHackathonId);
    loadSubmissionsData(newHackathonId);
  };

  // Client-side search and sorting
  const displayedItems = useMemo(() => {
    let result = items.filter((item) => {
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'SUBMITTED' && item.submissionStatus !== 'SUBMITTED') return false;
        if (statusFilter === 'NOT_SUBMITTED' && item.submissionStatus === 'SUBMITTED') return false;
      }

      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchesTeam = item.team.name.toLowerCase().includes(q);
        const matchesLeader =
          item.team.leader?.fullName?.toLowerCase().includes(q) ||
          item.team.leader?.email?.toLowerCase().includes(q);
        const matchesProject = item.project?.title?.toLowerCase().includes(q);
        const matchesCode = item.team.inviteCode?.toLowerCase().includes(q);
        const matchesHackathon = item.hackathon?.title?.toLowerCase().includes(q);
        return matchesTeam || matchesLeader || matchesProject || matchesCode || matchesHackathon;
      }
      return true;
    });

    result.sort((a, b) => {
      if (sortBy === 'team') return a.team.name.localeCompare(b.team.name);
      if (sortBy === 'status') {
        if (a.submissionStatus === b.submissionStatus) return 0;
        return a.submissionStatus === 'SUBMITTED' ? -1 : 1;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return result;
  }, [items, search, statusFilter, sortBy]);

  // Export CSV Audit Report
  const handleExportCsv = () => {
    if (displayedItems.length === 0) {
      showToast('No submissions to export.', 'error');
      return;
    }

    const headers = [
      'Team Name',
      'Invite Code',
      'Leader Name',
      'Leader Email',
      'Members Count',
      'Hackathon',
      'Submission Status',
      'Project Title',
      'Repository URL',
      'Snapshot Version',
      'Submitted At',
    ];

    const rows = displayedItems.map((item) => {
      return [
        `"${item.team.name.replace(/"/g, '""')}"`,
        `"${item.team.inviteCode}"`,
        `"${(item.team.leader?.fullName || '').replace(/"/g, '""')}"`,
        `"${(item.team.leader?.email || '').replace(/"/g, '""')}"`,
        item.team.membersCount,
        `"${(item.hackathon?.title || '').replace(/"/g, '""')}"`,
        item.submissionStatus,
        `"${(item.project?.title || 'Not Created').replace(/"/g, '""')}"`,
        `"${(item.project?.repoUrl || '').replace(/"/g, '""')}"`,
        item.submission?.versionNumber ? `v${item.submission.versionNumber}` : '—',
        `"${formatDate(item.submission?.submittedAt || null)}"`,
      ];
    });

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const activeHackathon = hackathons.find((h) => h.id === selectedHackathonId);
    const slug = activeHackathon?.slug || 'all-hackathons';
    link.setAttribute('href', url);
    link.setAttribute('download', `submissions_report_${slug}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(`Exported ${displayedItems.length} submission records to CSV!`);
  };

  const selectedHackathonObj = hackathons.find((h) => h.id === selectedHackathonId);

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
        <span className="text-zinc-800 font-semibold">Submissions</span>
      </nav>

      {/* Top Header - Matching Image Reference with Orange Theme */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 gap-4 border-b border-zinc-100">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#FA541C] to-[#E03A00] flex items-center justify-center text-white shadow-md shadow-orange-500/20 flex-shrink-0">
            <FileCheck className="w-5 h-5 stroke-[2.3]" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">
                Submissions Management
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Live Integrity</span>
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5 font-normal">
              Track project submission status, repository integrity, and unsubmitted teams across hackathons.
            </p>
          </div>
        </div>

        {/* Action Buttons: Export Report & Refresh */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCsv}
            disabled={displayedItems.length === 0}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-zinc-800 bg-white border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
          >
            <Download className="w-3.5 h-3.5 text-zinc-500" />
            <span>Export Report</span>
            {displayedItems.length > 0 && (
              <span className="ml-0.5 px-1.5 py-0.5 bg-zinc-100 text-zinc-600 rounded-md text-[10px] font-extrabold">
                {displayedItems.length}
              </span>
            )}
          </button>

          <button
            onClick={() => loadSubmissionsData(selectedHackathonId, true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-zinc-800 bg-white border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-60 hover:scale-[1.02] active:scale-[0.98]"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-zinc-500 ${refreshing ? 'animate-spin text-[#FA541C]' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Select Hackathon Event Banner & 4 Dynamic Metric Cards */}
      <div className="bg-white border border-zinc-200/90 rounded-2xl p-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-5 transition-all">
        {/* Left: Hackathon Selector */}
        <div className="space-y-2 flex-1 max-w-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-800 uppercase tracking-wider">
              <Trophy className="w-3.5 h-3.5 text-[#FA541C]" />
              <span>SELECT HACKATHON EVENT:</span>
            </div>
            {selectedHackathonObj?.subEndTime && (
              <span className="text-[10px] font-bold text-zinc-400 hidden sm:inline-block">
                Deadline: {formatDate(selectedHackathonObj.subEndTime)}
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

          {/* Active Event Pill */}
          <div className="flex flex-wrap items-center gap-2 pt-0.5">
            <span className="text-[11px] text-zinc-400 font-medium">Active Event:</span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-zinc-100 text-zinc-700 border border-zinc-200">
              {selectedHackathonId === 'all'
                ? 'All Hackathon Events'
                : selectedHackathonObj?.title || 'Selected Hackathon'}
            </span>
            {selectedHackathonObj?.status && selectedHackathonId !== 'all' && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                {selectedHackathonObj.status.replace(/_/g, ' ')}
              </span>
            )}
          </div>
        </div>

        {/* Right: 4 Stat Cards */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Card 1: Total Teams */}
          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            title="Click to view all teams"
            className={`group flex items-center gap-3.5 px-4 py-3 rounded-2xl min-w-[130px] border transition-all duration-300 cursor-pointer text-left hover:-translate-y-1 hover:shadow-md active:scale-95 ${
              statusFilter === 'ALL'
                ? 'bg-blue-50/40 border-blue-300 ring-2 ring-blue-500/15 shadow-xs'
                : 'bg-zinc-50/70 border-zinc-200/90 hover:bg-white hover:border-zinc-300'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-200 text-blue-600 shadow-2xs group-hover:scale-110 transition-transform duration-300">
              <Users className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">TEAMS</div>
              <div className="text-2xl font-black text-zinc-900 leading-none mt-0.5">{stats.total}</div>
            </div>
          </button>

          {/* Card 2: Submitted */}
          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === 'SUBMITTED' ? 'ALL' : 'SUBMITTED')}
            title="Click to filter by submitted deliverables"
            className={`group flex items-center gap-3.5 px-4 py-3 rounded-2xl min-w-[140px] border transition-all duration-300 cursor-pointer text-left hover:-translate-y-1 hover:shadow-md active:scale-95 ${
              statusFilter === 'SUBMITTED'
                ? 'bg-emerald-50/50 border-emerald-300 ring-2 ring-emerald-500/15 shadow-xs'
                : 'bg-zinc-50/70 border-zinc-200/90 hover:bg-white hover:border-zinc-300'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center border border-emerald-200 text-emerald-600 shadow-2xs group-hover:scale-110 transition-transform duration-300">
              <CheckCircle2 className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">SUBMITTED</div>
              <div className="text-2xl font-black text-zinc-900 leading-none mt-0.5">{stats.submitted}</div>
            </div>
          </button>

          {/* Card 3: Not Submitted */}
          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === 'NOT_SUBMITTED' ? 'ALL' : 'NOT_SUBMITTED')}
            title="Click to filter by unsubmitted teams"
            className={`group flex items-center gap-3.5 px-4 py-3 rounded-2xl min-w-[150px] border transition-all duration-300 cursor-pointer text-left hover:-translate-y-1 hover:shadow-md active:scale-95 ${
              statusFilter === 'NOT_SUBMITTED'
                ? 'bg-amber-50/50 border-amber-300 ring-2 ring-amber-500/15 shadow-xs'
                : 'bg-zinc-50/70 border-zinc-200/90 hover:bg-white hover:border-zinc-300'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center border border-amber-200 text-amber-600 shadow-2xs group-hover:scale-110 transition-transform duration-300">
              <Clock className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">NOT SUBMITTED</div>
              <div className="text-2xl font-black text-zinc-900 leading-none mt-0.5">{stats.notSubmitted}</div>
            </div>
          </button>

          {/* Card 4: Submission Rate */}
          <div className="group flex items-center gap-3.5 px-4 py-3 bg-zinc-50/70 border border-zinc-200/90 rounded-2xl min-w-[130px] hover:bg-white hover:border-zinc-300 transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-200 text-blue-600 shadow-2xs group-hover:scale-110 transition-transform duration-300">
              <TrendingUp className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">RATE</div>
              <div className="text-2xl font-black text-blue-600 leading-none mt-0.5">{stats.submissionRate}%</div>
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
            placeholder="Search by team name, leader, email, or project title..."
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

        {/* Sort & Status Filter Controls */}
        <div className="flex items-center gap-2 self-end sm:self-auto border-t sm:border-t-0 pt-2 sm:pt-0 border-zinc-100">
          <div className="flex items-center gap-1.5 text-xs text-zinc-500 pr-2 border-r border-zinc-200">
            <ArrowUpDown className="w-3.5 h-3.5 text-zinc-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-xs font-bold text-zinc-700 focus:outline-none cursor-pointer"
            >
              <option value="newest">Sort: Newest</option>
              <option value="status">Sort: Status</option>
              <option value="team">Sort: Team Name</option>
            </select>
          </div>

          <button
            type="button"
            className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer"
            title="Filters"
          >
            <Filter className="w-4 h-4" />
          </button>

          {/* Status Tabs with Brand Orange Active Highlight & crisp borders */}
          <div className="flex items-center gap-1.5">
            {[
              { key: 'ALL', label: 'ALL TEAMS', count: stats.total },
              { key: 'SUBMITTED', label: 'SUBMITTED', count: stats.submitted },
              { key: 'NOT_SUBMITTED', label: 'NOT SUBMITTED', count: stats.notSubmitted },
            ].map((tab) => {
              const active = statusFilter === tab.key;

              return (
                <button
                  key={tab.key}
                  onClick={() => setStatusFilter(tab.key as any)}
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

      {/* Submissions Table */}
      <div className="bg-white border border-zinc-200/90 rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-xs text-zinc-500 flex flex-col items-center justify-center space-y-3">
            <RefreshCw className="w-7 h-7 animate-spin text-[#FA541C]" />
            <p className="font-bold text-zinc-900 text-sm">Loading submission records across teams...</p>
            <p className="text-xs text-zinc-400">Verifying repository snapshots and participant deliverables</p>
          </div>
        ) : displayedItems.length === 0 ? (
          <div className="py-16 text-center space-y-3 px-4">
            <div className="w-12 h-12 rounded-2xl bg-zinc-50 border border-zinc-200 flex items-center justify-center mx-auto text-zinc-400">
              <FileCheck className="w-6 h-6 stroke-[1.8]" />
            </div>
            <p className="text-sm font-bold text-zinc-900">No team submissions found</p>
            <p className="text-xs text-zinc-500 max-w-md mx-auto">
              {search || statusFilter !== 'ALL'
                ? `No teams match the filter "${statusFilter}" or search query "${search}". Try resetting your filters.`
                : 'No participating teams registered for this hackathon event.'}
            </p>
            {(search || statusFilter !== 'ALL') && (
              <div className="pt-2">
                <button
                  onClick={() => {
                    setSearch('');
                    setStatusFilter('ALL');
                  }}
                  className="px-4 py-2 text-xs font-bold text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-xl border border-orange-200 transition-colors cursor-pointer"
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
                <tr className="border-b border-zinc-100 text-[11px] font-bold text-zinc-400 uppercase tracking-wider bg-zinc-50/70">
                  <th className="py-4 px-6">TEAM &amp; LEADER</th>
                  <th className="py-4 px-6">HACKATHON</th>
                  <th className="py-4 px-6">PROJECT DELIVERABLE</th>
                  <th className="py-4 px-6">SUBMISSION STATUS</th>
                  <th className="py-4 px-6 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {displayedItems.map((item) => {
                  const isSubmitted = item.submissionStatus === 'SUBMITTED';
                  const initialsStyle = getInitialsBadgeStyle(item.team.name);

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-orange-50/20 transition-all duration-200 group"
                    >
                      {/* TEAM & LEADER */}
                      <td className="py-4 px-6 align-middle">
                        <div className="flex items-start gap-3.5">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs border flex-shrink-0 mt-0.5 shadow-2xs group-hover:scale-105 transition-transform duration-200 ${initialsStyle}`}
                          >
                            {item.team.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-zinc-900 text-sm tracking-tight group-hover:text-[#FA541C] transition-colors">
                              {item.team.name}
                            </div>

                            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                              {/* Leader Pill */}
                              {item.team.leader ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold text-zinc-700 bg-zinc-100 border border-zinc-200/90">
                                  <User className="w-2.5 h-2.5 text-zinc-500" />
                                  <span>{item.team.leader.fullName}</span>
                                </span>
                              ) : (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold text-zinc-400 bg-zinc-50 border border-zinc-200/90">
                                  Leader Unassigned
                                </span>
                              )}

                              {/* Invite Code */}
                              <button
                                type="button"
                                onClick={() => copyToClipboard(item.team.inviteCode, 'Invite Code')}
                                title="Click to copy invite code"
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold text-zinc-500 bg-zinc-100 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 border border-zinc-200 transition-all cursor-pointer"
                              >
                                <span>{item.team.inviteCode}</span>
                                {copiedText === item.team.inviteCode ? (
                                  <Check className="w-2.5 h-2.5 text-emerald-600" />
                                ) : (
                                  <Copy className="w-2.5 h-2.5" />
                                )}
                              </button>

                              {/* Member Count */}
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium text-zinc-600 bg-zinc-100 border border-zinc-200">
                                <Users className="w-2.5 h-2.5 text-zinc-400" />
                                <span>{item.team.membersCount} members</span>
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* HACKATHON */}
                      <td className="py-4 px-6 align-middle whitespace-nowrap">
                        <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold text-sky-800 bg-sky-50 border border-sky-200">
                          {item.hackathon.title}
                        </span>
                      </td>

                      {/* PROJECT DELIVERABLE */}
                      <td className="py-4 px-6 align-middle">
                        {item.project ? (
                          <div className="space-y-1 max-w-md">
                            <div className="font-bold text-sm text-zinc-900 tracking-tight">
                              {item.project.title}
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5">
                              {item.project.track && (
                                <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-200">
                                  Track: {item.project.track.title}
                                </span>
                              )}
                              {item.project.repoUrl && (
                                <a
                                  href={item.project.repoUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-700 hover:underline font-semibold"
                                >
                                  <Github className="w-3 h-3" />
                                  <span>Repository</span>
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs text-zinc-400 italic">
                            No project submission created yet
                          </div>
                        )}
                      </td>

                      {/* SUBMISSION STATUS */}
                      <td className="py-4 px-6 align-middle whitespace-nowrap">
                        {isSubmitted ? (
                          <div className="inline-flex flex-col">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 shadow-2xs w-fit">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>SUBMITTED</span>
                            </span>
                            <span className="text-[10px] text-emerald-600/90 font-medium mt-1 pl-1">
                              {item.submission?.submittedAt
                                ? formatDate(item.submission.submittedAt)
                                : 'Deliverable Locked'}
                            </span>
                          </div>
                        ) : (
                          <div className="inline-flex flex-col">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 shadow-2xs w-fit">
                              <Clock className="w-3.5 h-3.5 text-amber-600" />
                              <span>NOT SUBMITTED</span>
                            </span>
                            <span className="text-[10px] text-amber-600/90 font-medium mt-1 pl-1">
                              Awaiting team submission
                            </span>
                          </div>
                        )}
                      </td>

                      {/* ACTIONS */}
                      <td className="py-4 px-6 align-middle text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 relative">
                          <button
                            onClick={() => setContactingTeam(item)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-zinc-700 bg-white border border-zinc-200 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 rounded-xl shadow-2xs transition-all hover:scale-105 active:scale-95 cursor-pointer"
                          >
                            <Mail className="w-3.5 h-3.5 text-zinc-500" />
                            <span>Contact Team</span>
                          </button>

                          {/* 3-dots more menu */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() =>
                                setActiveMenuId(activeMenuId === item.id ? null : item.id)
                              }
                              className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-xl transition-colors cursor-pointer"
                              title="More options"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            {activeMenuId === item.id && (
                              <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-zinc-200 rounded-xl shadow-lg py-1 z-30 animate-in fade-in zoom-in-95 duration-150">
                                {isSubmitted && (
                                  <button
                                    onClick={() => {
                                      setActiveMenuId(null);
                                      setInspectingItem(item);
                                    }}
                                    className="w-full px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-orange-50 hover:text-orange-600 flex items-center gap-2 text-left"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>View Snapshot</span>
                                  </button>
                                )}
                                <button
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    copyToClipboard(item.team.inviteCode, 'Invite Code');
                                  }}
                                  className="w-full px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 flex items-center gap-2 text-left"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>Copy Invite Code</span>
                                </button>
                                {item.team.leader?.email && (
                                  <button
                                    onClick={() => {
                                      setActiveMenuId(null);
                                      copyToClipboard(item.team.leader!.email, 'Leader Email');
                                    }}
                                    className="w-full px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 flex items-center gap-2 text-left"
                                  >
                                    <Mail className="w-3.5 h-3.5" />
                                    <span>Copy Leader Email</span>
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
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
      {/* VIEW SUBMISSION SNAPSHOT MODAL */}
      {/* ======================================================== */}
      {inspectingItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-zinc-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-zinc-100 flex items-start justify-between bg-gradient-to-r from-white to-orange-50/20">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <h2 className="text-xl font-bold text-zinc-900">
                    {inspectingItem.project?.title || inspectingItem.team.name}
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200">
                    Version {inspectingItem.submission?.versionNumber ?? 1} Locked
                  </span>
                </div>
                <p className="text-xs text-zinc-500">
                  Team: <span className="font-semibold text-zinc-800">{inspectingItem.team.name}</span> &bull;{' '}
                  Arena: <span className="font-semibold text-zinc-800">{inspectingItem.hackathon.title}</span>
                </p>
              </div>
              <button
                onClick={() => setInspectingItem(null)}
                className="p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-800 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto text-xs">
              {/* Submission Timestamps */}
              <div className="grid grid-cols-2 gap-3 p-4 bg-zinc-50 border border-zinc-200 rounded-2xl">
                <div>
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                    Submitted At:
                  </span>
                  <p className="font-medium text-zinc-900 mt-0.5">
                    {formatDate(inspectingItem.submission?.submittedAt || null)}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                    Locked (Immutable):
                  </span>
                  <p className="font-medium text-zinc-900 mt-0.5">
                    {formatDate(inspectingItem.submission?.lockedAt || null)}
                  </p>
                </div>
              </div>

              {/* Repository & Demo links */}
              {inspectingItem.project && (
                <div className="p-4 bg-white border border-zinc-200 rounded-2xl space-y-2">
                  <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                    Repository &amp; Deliverables
                  </div>
                  <div className="flex flex-col gap-2">
                    {inspectingItem.project.repoUrl && (
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-500">Code Repository:</span>
                        <a
                          href={inspectingItem.project.repoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="font-semibold text-orange-600 hover:text-orange-700 hover:underline flex items-center gap-1"
                        >
                          <Github className="w-3.5 h-3.5" />
                          <span>{inspectingItem.project.repoUrl}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                    {inspectingItem.project.demoUrl && (
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-500">Live Demo URL:</span>
                        <a
                          href={inspectingItem.project.demoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="font-semibold text-orange-600 hover:text-orange-700 hover:underline flex items-center gap-1"
                        >
                          <span>{inspectingItem.project.demoUrl}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Payload Snapshot JSON */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Code className="w-3.5 h-3.5 text-[#FA541C]" />
                    <span>Payload Snapshot (Immutable Audit Trail)</span>
                  </span>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        JSON.stringify(inspectingItem.submission?.payloadSnapshot, null, 2),
                        'Snapshot JSON'
                      )
                    }
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-orange-600 hover:underline cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Copy JSON</span>
                  </button>
                </div>
                <pre className="p-4 bg-zinc-950 text-zinc-200 rounded-2xl text-[11px] font-mono overflow-x-auto max-h-60 border border-zinc-800">
                  {JSON.stringify(inspectingItem.submission?.payloadSnapshot, null, 2)}
                </pre>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-zinc-100 flex items-center justify-end gap-2 bg-zinc-50">
              <button
                onClick={() => setInspectingItem(null)}
                className="px-4 py-2 text-xs font-bold text-zinc-700 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-xl transition-colors cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* CONTACT / VIEW UN-SUBMITTED TEAM MODAL */}
      {/* ======================================================== */}
      {contactingTeam && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-zinc-200 shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200">
                  Pending Submission
                </span>
                <h3 className="text-lg font-bold text-zinc-900 mt-1">{contactingTeam.team.name}</h3>
                <p className="text-xs text-zinc-500">{contactingTeam.hackathon.title}</p>
              </div>
              <button
                onClick={() => setContactingTeam(null)}
                className="p-1.5 text-zinc-400 hover:bg-zinc-100 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Warning Alert */}
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>Deliverable Not Yet Submitted</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                This team has not locked their final project submission code snapshot for this hackathon. You can
                reach out to the team leader to provide support or send a deadline reminder.
              </p>
            </div>

            {/* Leader Contact Details */}
            <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-2xl space-y-2">
              <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-[#FA541C]" />
                <span>Team Leader Contact</span>
              </div>
              {contactingTeam.team.leader ? (
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-sm text-zinc-900">
                      {contactingTeam.team.leader.fullName}
                    </div>
                    <div className="text-xs text-zinc-500">{contactingTeam.team.leader.email}</div>
                  </div>
                  <button
                    onClick={() =>
                      copyToClipboard(contactingTeam.team.leader!.email, 'Leader Email')
                    }
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-zinc-200 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 rounded-xl text-xs font-semibold text-zinc-700 shadow-2xs transition-all cursor-pointer"
                  >
                    <Mail className="w-3 h-3" />
                    <span>Copy Email</span>
                  </button>
                </div>
              ) : (
                <p className="text-xs text-zinc-500">No designated leader assigned to this team.</p>
              )}
            </div>

            {/* Roster overview */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-zinc-900">
                Team Members ({contactingTeam.team.membersCount})
              </span>
              <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                {contactingTeam.team.members.map((m) => (
                  <span
                    key={m.id}
                    className="px-2.5 py-0.5 rounded-full text-xs font-medium text-zinc-700 bg-white border border-zinc-200"
                  >
                    {m.fullName}
                  </span>
                ))}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
              <button
                type="button"
                onClick={() => setContactingTeam(null)}
                className="px-4 py-2 text-xs font-bold text-zinc-700 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
