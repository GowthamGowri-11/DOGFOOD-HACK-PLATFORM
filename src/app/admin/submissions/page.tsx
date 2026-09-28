'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  FileCheck,
  Search,
  ExternalLink,
  Code,
  Sparkles,
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
  const [selectedHackathonId, setSelectedHackathonId] = useState<string>('');
  const [items, setItems] = useState<SubmissionTeamItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SUBMITTED' | 'NOT_SUBMITTED'>('ALL');
  const [sortBy, setSortBy] = useState<'team' | 'status' | 'newest'>('newest');

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

  // Fetch Submissions and Teams dynamically
  const loadSubmissionsData = useCallback(
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

        const res = await fetch(`/api/v1/admin/submissions?${params.toString()}`);
        const json = await res.json();

        if (json.success && json.data) {
          const fetchedHackathons: HackathonOption[] = json.data.hackathons || [];
          setHackathons(fetchedHackathons);

          // If no hackathon currently selected, pick default
          if (!targetHackathonId && fetchedHackathons.length > 0) {
            const defaultHackathon = json.data.selectedHackathonId || fetchedHackathons[0]?.id;
            setSelectedHackathonId(defaultHackathon);
          } else if (targetHackathonId) {
            setSelectedHackathonId(targetHackathonId);
          }

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
      // default newest
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
            <FileCheck className="w-5 h-5 stroke-[2.3]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-[#0f172a] tracking-tight">
                Submissions Management
              </h1>
              <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#eff6ff] text-[#2563eb] border border-[#dbeafe]">
                Live Integrity
              </span>
            </div>
            <p className="text-xs text-[#64748b] mt-0.5">
              Track project submission status, repository integrity, and unsubmitted teams across hackathons.
            </p>
          </div>
        </div>

        {/* Action Buttons: Export CSV & Refresh */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCsv}
            disabled={displayedItems.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-[#0f172a] bg-white border border-[#e2e8f0] hover:bg-[#f8fafc] hover:border-[#cbd5e1] rounded-xl shadow-2xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
          >
            <Download className="w-3.5 h-3.5 text-[#64748b]" />
            <span>Export Report</span>
            {displayedItems.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 bg-[#f1f5f9] text-[#475569] rounded-md text-[10px] font-extrabold">
                {displayedItems.length}
              </span>
            )}
          </button>

          <button
            onClick={() => loadSubmissionsData(selectedHackathonId, true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-[#0f172a] bg-white border border-[#e2e8f0] hover:bg-[#f8fafc] hover:border-[#cbd5e1] rounded-xl shadow-2xs transition-all cursor-pointer disabled:opacity-60 active:scale-95"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#64748b] ${refreshing ? 'animate-spin text-[#2563eb]' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
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
            {selectedHackathonObj?.subEndTime && (
              <span className="text-[10px] font-bold text-[#64748b] hidden sm:inline-block">
                Deadline: {formatDate(selectedHackathonObj.subEndTime)}
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
            <span className="text-[11px] text-[#64748b] font-medium">Active Event:</span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#f1f5f9] text-[#334155] border border-[#e2e8f0]">
              {selectedHackathonId === 'all'
                ? 'All Hackathon Events'
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
          {/* Total Teams Card */}
          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            title="Click to view all teams"
            className={`flex items-center gap-3 px-5 py-3 rounded-2xl min-w-[125px] border transition-all cursor-pointer text-left ${
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

          {/* Submitted Teams Card */}
          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === 'SUBMITTED' ? 'ALL' : 'SUBMITTED')}
            title="Click to filter by submitted teams"
            className={`flex items-center gap-3 px-5 py-3 rounded-2xl min-w-[145px] border transition-all cursor-pointer text-left ${
              statusFilter === 'SUBMITTED'
                ? 'bg-[#ecfdf5] border-[#059669] ring-2 ring-[#059669]/20 shadow-xs scale-[1.02]'
                : 'bg-[#f0fdf4]/60 border-[#bbf7d0] hover:bg-[#dcfce7] hover:border-[#86efac]'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center border border-[#bbf7d0] shadow-2xs">
              <CheckCircle2 className="w-5 h-5 text-[#059669] stroke-[2.2]" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-[#059669] uppercase tracking-wider">SUBMITTED</div>
              <div className="text-2xl font-black text-[#065f46] leading-none mt-0.5">{stats.submitted}</div>
            </div>
          </button>

          {/* Not Submitted Teams Card */}
          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === 'NOT_SUBMITTED' ? 'ALL' : 'NOT_SUBMITTED')}
            title="Click to filter by not submitted teams"
            className={`flex items-center gap-3 px-5 py-3 rounded-2xl min-w-[155px] border transition-all cursor-pointer text-left ${
              statusFilter === 'NOT_SUBMITTED'
                ? 'bg-[#fffbeb] border-[#d97706] ring-2 ring-[#d97706]/20 shadow-xs scale-[1.02]'
                : 'bg-[#fefce8]/60 border-[#fef08a] hover:bg-[#fef9c3] hover:border-[#fde047]'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center border border-[#fef08a] shadow-2xs">
              <Clock className="w-5 h-5 text-[#d97706] stroke-[2.2]" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-[#d97706] uppercase tracking-wider">NOT SUBMITTED</div>
              <div className="text-2xl font-black text-[#92400e] leading-none mt-0.5">{stats.notSubmitted}</div>
            </div>
          </button>

          {/* Submission Rate Gauge */}
          <div className="flex items-center gap-3 px-4 py-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl min-w-[130px]">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center border border-[#e2e8f0] shadow-2xs text-[#2563eb]">
              <Sparkles className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-[#64748b] uppercase tracking-wider">RATE</div>
              <div className="text-2xl font-black text-[#2563eb] leading-none mt-0.5">{stats.submissionRate}%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar & Filter Controls */}
      <div className="bg-white border border-[#e2e8f0] rounded-2xl p-2.5 sm:p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        {/* Search Input */}
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-[#94a3b8] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by team name, leader, email, or project title..."
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
              <option value="status">Sort: Status</option>
              <option value="team">Sort: Team Name</option>
            </select>
          </div>

          <div className="flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-[#94a3b8] mr-1 hidden sm:inline-block" />
            {(
              [
                { key: 'ALL', label: 'ALL TEAMS', count: stats.total, color: 'bg-[#2563eb]' },
                { key: 'SUBMITTED', label: 'SUBMITTED', count: stats.submitted, color: 'bg-[#059669]' },
                { key: 'NOT_SUBMITTED', label: 'NOT SUBMITTED', count: stats.notSubmitted, color: 'bg-[#d97706]' },
              ] as const
            ).map((filter) => {
              const active = statusFilter === filter.key;
              return (
                <button
                  key={filter.key}
                  onClick={() => setStatusFilter(filter.key)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                    active
                      ? `${filter.color} text-white shadow-xs`
                      : 'text-[#64748b] hover:text-[#0f172a] hover:bg-[#f1f5f9]'
                  }`}
                >
                  <span>{filter.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                      active ? 'bg-white/20 text-white' : 'bg-[#e2e8f0] text-[#475569]'
                    }`}
                  >
                    {filter.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Submissions Table */}
      <div className="bg-white border border-[#e2e8f0] rounded-2xl shadow-2xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-xs text-[#64748b] flex flex-col items-center justify-center space-y-3">
            <RefreshCw className="w-7 h-7 animate-spin text-[#2563eb]" />
            <p className="font-bold text-[#0f172a] text-sm">Loading submission records across teams...</p>
            <p className="text-xs text-[#94a3b8]">Verifying repository snapshots and participant deliverables</p>
          </div>
        ) : displayedItems.length === 0 ? (
          <div className="py-16 text-center space-y-3 px-4">
            <div className="w-12 h-12 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0] flex items-center justify-center mx-auto text-[#94a3b8]">
              <FileCheck className="w-6 h-6 stroke-[1.8]" />
            </div>
            <p className="text-sm font-bold text-[#0f172a]">No team submissions found</p>
            <p className="text-xs text-[#64748b] max-w-md mx-auto">
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
                  <th className="py-4 px-6">TEAM & LEADER</th>
                  <th className="py-4 px-6">HACKATHON</th>
                  <th className="py-4 px-6">PROJECT DELIVERABLE</th>
                  <th className="py-4 px-6">SUBMISSION STATUS</th>
                  <th className="py-4 px-6 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f5f9]">
                {displayedItems.map((item) => {
                  const isSubmitted = item.submissionStatus === 'SUBMITTED';

                  return (
                    <tr key={item.id} className="hover:bg-[#f8faff] transition-colors group">
                      {/* TEAM & LEADER */}
                      <td className="py-4 px-6 align-middle">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#eff6ff] to-[#dbeafe] flex items-center justify-center font-bold text-[#2563eb] text-xs border border-[#bfdbfe] flex-shrink-0 mt-0.5">
                            {item.team.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-[#0f172a] text-sm tracking-tight group-hover:text-[#2563eb] transition-colors">
                              {item.team.name}
                            </div>

                            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                              {/* Leader Pill */}
                              {item.team.leader ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold text-[#1e40af] bg-[#eff6ff] border border-[#bfdbfe]">
                                  <Shield className="w-2.5 h-2.5 text-[#2563eb]" />
                                  <span>{item.team.leader.fullName}</span>
                                </span>
                              ) : (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold text-[#64748b] bg-[#f8fafc] border border-[#e2e8f0]">
                                  Leader Unassigned
                                </span>
                              )}

                              {/* Members Count */}
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-medium text-[#64748b] bg-[#f1f5f9] border border-[#e2e8f0]">
                                {item.team.membersCount} member{item.team.membersCount !== 1 ? 's' : ''}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* HACKATHON */}
                      <td className="py-4 px-6 align-middle whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold text-[#0369a1] bg-[#f0f9ff] border border-[#bae6fd]">
                          {item.hackathon.title}
                        </span>
                      </td>

                      {/* PROJECT DELIVERABLE */}
                      <td className="py-4 px-6 align-middle">
                        {item.project ? (
                          <div className="space-y-1 max-w-md">
                            <div className="font-bold text-sm text-[#0f172a] tracking-tight">
                              {item.project.title}
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5">
                              {item.project.track && (
                                <span className="text-[10px] font-semibold text-[#2563eb] bg-[#eff6ff] px-2 py-0.5 rounded border border-[#dbeafe]">
                                  Track: {item.project.track.title}
                                </span>
                              )}
                              {item.project.repoUrl && (
                                <a
                                  href={item.project.repoUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 text-[11px] text-[#2563eb] hover:underline font-semibold"
                                >
                                  <Github className="w-3 h-3" />
                                  <span>Repository</span>
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs text-[#94a3b8] italic">
                            No project submission created yet
                          </div>
                        )}
                      </td>

                      {/* SUBMISSION STATUS */}
                      <td className="py-4 px-6 align-middle whitespace-nowrap">
                        {isSubmitted ? (
                          <div className="inline-flex flex-col">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold text-[#059669] bg-[#ecfdf5] border border-[#a7f3d0] shadow-2xs w-fit">
                              <CheckCircle2 className="w-3 h-3 text-[#059669]" />
                              <span>SUBMITTED</span>
                            </span>
                            <span className="text-[10px] text-[#059669]/80 font-medium mt-1 pl-1">
                              {item.submission?.submittedAt
                                ? formatDate(item.submission.submittedAt)
                                : 'Deliverable Locked'}
                            </span>
                          </div>
                        ) : (
                          <div className="inline-flex flex-col">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold text-[#d97706] bg-[#fffbeb] border border-[#fde68a] shadow-2xs w-fit">
                              <Clock className="w-3 h-3 text-[#d97706]" />
                              <span>NOT SUBMITTED</span>
                            </span>
                            <span className="text-[10px] text-[#d97706]/80 font-medium mt-1 pl-1">
                              Awaiting team submission
                            </span>
                          </div>
                        )}
                      </td>

                      {/* ACTIONS */}
                      <td className="py-4 px-6 align-middle text-right whitespace-nowrap">
                        {isSubmitted ? (
                          <button
                            onClick={() => setInspectingItem(item)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#2563eb] bg-[#eff6ff] hover:bg-[#dbeafe] border border-[#bfdbfe] rounded-xl shadow-2xs transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View Snapshot</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => setContactingTeam(item)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#475569] bg-white border border-[#e2e8f0] hover:bg-[#f8fafc] hover:text-[#0f172a] rounded-xl shadow-2xs transition-colors cursor-pointer"
                          >
                            <Mail className="w-3.5 h-3.5 text-[#64748b]" />
                            <span>Contact Team</span>
                          </button>
                        )}
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
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-[#e2e8f0] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-[#f1f5f9] flex items-start justify-between bg-gradient-to-r from-white to-[#f8fafc]">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <h2 className="text-xl font-bold text-[#0f172a]">
                    {inspectingItem.project?.title || inspectingItem.team.name}
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold text-[#059669] bg-[#ecfdf5] border border-[#a7f3d0]">
                    Version {inspectingItem.submission?.versionNumber ?? 1} Locked
                  </span>
                </div>
                <p className="text-xs text-[#64748b]">
                  Team: <span className="font-semibold text-[#0f172a]">{inspectingItem.team.name}</span> &bull;{' '}
                  Arena: <span className="font-semibold text-[#0f172a]">{inspectingItem.hackathon.title}</span>
                </p>
              </div>
              <button
                onClick={() => setInspectingItem(null)}
                className="p-2 text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#0f172a] rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto text-xs">
              {/* Submission Timestamps */}
              <div className="grid grid-cols-2 gap-3 p-4 bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl">
                <div>
                  <span className="text-[10px] font-bold text-[#64748b] uppercase tracking-wider block">
                    Submitted At:
                  </span>
                  <p className="font-medium text-[#0f172a] mt-0.5">
                    {formatDate(inspectingItem.submission?.submittedAt || null)}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#64748b] uppercase tracking-wider block">
                    Locked (Immutable):
                  </span>
                  <p className="font-medium text-[#0f172a] mt-0.5">
                    {formatDate(inspectingItem.submission?.lockedAt || null)}
                  </p>
                </div>
              </div>

              {/* Repository & Demo links */}
              {inspectingItem.project && (
                <div className="p-4 bg-white border border-[#e2e8f0] rounded-2xl space-y-2">
                  <div className="text-[10px] font-bold text-[#64748b] uppercase tracking-wider">
                    Repository & Deliverables
                  </div>
                  <div className="flex flex-col gap-2">
                    {inspectingItem.project.repoUrl && (
                      <div className="flex items-center justify-between">
                        <span className="text-[#64748b]">Code Repository:</span>
                        <a
                          href={inspectingItem.project.repoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="font-semibold text-[#2563eb] hover:underline flex items-center gap-1"
                        >
                          <Github className="w-3.5 h-3.5" />
                          <span>{inspectingItem.project.repoUrl}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                    {inspectingItem.project.demoUrl && (
                      <div className="flex items-center justify-between">
                        <span className="text-[#64748b]">Live Demo URL:</span>
                        <a
                          href={inspectingItem.project.demoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="font-semibold text-[#2563eb] hover:underline flex items-center gap-1"
                        >
                          <span>{inspectingItem.project.demoUrl}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Immutable Snapshot JSON */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#1e293b] uppercase tracking-wider flex items-center gap-1.5">
                    <Code className="w-3.5 h-3.5 text-[#2563eb]" />
                    <span>Payload Snapshot (Immutable Audit Trail)</span>
                  </span>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        JSON.stringify(inspectingItem.submission?.payloadSnapshot, null, 2),
                        'Snapshot JSON'
                      )
                    }
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#2563eb] hover:underline cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Copy JSON</span>
                  </button>
                </div>
                <pre className="p-4 bg-[#0f172a] text-[#e2e8f0] rounded-2xl text-[11px] font-mono overflow-x-auto max-h-60 border border-[#334155]">
                  {JSON.stringify(inspectingItem.submission?.payloadSnapshot, null, 2)}
                </pre>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#f1f5f9] flex items-center justify-end gap-2 bg-[#f8fafc]">
              <button
                onClick={() => setInspectingItem(null)}
                className="px-4 py-2 text-xs font-bold text-[#334155] bg-white border border-[#e2e8f0] hover:bg-[#f1f5f9] rounded-xl transition-colors cursor-pointer"
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
          <div className="bg-white rounded-3xl max-w-lg w-full border border-[#e2e8f0] shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold text-[#d97706] bg-[#fffbeb] border border-[#fde68a]">
                  Pending Submission
                </span>
                <h3 className="text-lg font-bold text-[#0f172a] mt-1">{contactingTeam.team.name}</h3>
                <p className="text-xs text-[#64748b]">{contactingTeam.hackathon.title}</p>
              </div>
              <button
                onClick={() => setContactingTeam(null)}
                className="p-1.5 text-[#64748b] hover:bg-[#f1f5f9] rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Warning Alert */}
            <div className="p-3.5 bg-[#fffbeb] border border-[#fde68a] rounded-2xl text-xs text-[#92400e] space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-[#d97706]" />
                <span>Deliverable Not Yet Submitted</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                This team has not locked their final project submission code snapshot for this hackathon. You can
                reach out to the team leader to provide support or send a deadline reminder.
              </p>
            </div>

            {/* Leader Contact Details */}
            <div className="p-4 bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl space-y-2">
              <div className="text-[10px] font-bold text-[#64748b] uppercase tracking-wider flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-[#2563eb]" />
                <span>Team Leader Contact</span>
              </div>
              {contactingTeam.team.leader ? (
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-sm text-[#0f172a]">
                      {contactingTeam.team.leader.fullName}
                    </div>
                    <div className="text-xs text-[#64748b]">{contactingTeam.team.leader.email}</div>
                  </div>
                  <button
                    onClick={() =>
                      copyToClipboard(contactingTeam.team.leader!.email, 'Leader Email')
                    }
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-[#e2e8f0] hover:bg-[#eff6ff] hover:text-[#2563eb] hover:border-[#bfdbfe] rounded-xl text-xs font-semibold text-[#334155] shadow-2xs transition-colors cursor-pointer"
                  >
                    <Mail className="w-3 h-3" />
                    <span>Copy Email</span>
                  </button>
                </div>
              ) : (
                <p className="text-xs text-[#64748b]">No designated leader assigned to this team.</p>
              )}
            </div>

            {/* Roster overview */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-[#0f172a]">
                Team Members ({contactingTeam.team.membersCount})
              </span>
              <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                {contactingTeam.team.members.map((m) => (
                  <span
                    key={m.id}
                    className="px-2.5 py-0.5 rounded-full text-xs font-medium text-[#334155] bg-[#f8fafc] border border-[#e2e8f0]"
                  >
                    {m.fullName}
                  </span>
                ))}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#f1f5f9]">
              <button
                type="button"
                onClick={() => setContactingTeam(null)}
                className="px-4 py-2 text-xs font-bold text-[#334155] bg-white border border-[#e2e8f0] hover:bg-[#f8fafc] rounded-xl transition-colors cursor-pointer"
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
