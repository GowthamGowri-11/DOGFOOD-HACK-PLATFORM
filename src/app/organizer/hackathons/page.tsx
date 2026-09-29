'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  Trophy,
  Search,
  Eye,
  Trash2,
  RefreshCw,
  Download,
  Calendar,
  Users,
  CheckCircle2,
  AlertCircle,
  X,
  Layers,
  Award,
  Plus,
  ChevronRight,
  Sparkles,
  ArrowUpRight,
  Clock,
  ShieldCheck,
  Zap,
  FolderKanban,
  FileCheck,
  MoreHorizontal,
  Play,
  FileText,
  Gift,
  User,
} from 'lucide-react';

interface PrizeItem {
  id: string;
  title: string;
  amount: number | string;
  currency: string;
  rankOrder: number;
}

interface HackathonItem {
  id: string;
  title: string;
  slug: string;
  tagline: string | null;
  description: string | null;
  status: string;
  organizationName: string;
  minTeamSize: number;
  maxTeamSize: number;
  bannerUrl: string | null;
  eventStartTime: string;
  eventEndTime: string;
  subStartTime?: string | null;
  subEndTime?: string | null;
  rulesAndGuidelines?: string | null;
  organizer: {
    id: string;
    fullName: string;
    email: string;
  };
  prizes?: PrizeItem[];
  tracks?: Array<{ id: string; title: string; colorHex?: string }>;
  _count: {
    registrations: number;
    projects: number;
    judges: number;
  };
  createdAt: string;
}

interface CoordinatorContact {
  name: string;
  contact: string;
}

export default function OrganizerHackathonsPage() {
  const [hackathons, setHackathons] = useState<HackathonItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'SUBMISSION_OPEN' | 'EXPIRED' | 'DRAFT'>('ALL');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [hackathonToDelete, setHackathonToDelete] = useState<HackathonItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchHackathons = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const params = new URLSearchParams({
        mine: 'true',
        page: '1',
        pageSize: '50',
      });

      const res = await fetch(`/api/v1/hackathons?${params.toString()}`);
      const json = await res.json();
      if (json.success && json.data) {
        setHackathons(json.data.hackathons || []);
      } else {
        setHackathons([]);
      }
    } catch {
      setHackathons([]);
      showToast('Could not load hackathons. Using offline data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchHackathons();
  }, [fetchHackathons]);

  const handleRefresh = () => {
    fetchHackathons(true);
    showToast('Refreshing hackathon records...');
  };

  // Export CSV handler
  const handleExportCSV = () => {
    if (hackathons.length === 0) {
      showToast('No hackathons available to export');
      return;
    }
    setExporting(true);
    try {
      const headers = [
        'ID',
        'Title',
        'Slug',
        'Tagline',
        'Status',
        'Organization',
        'Organizer Name',
        'Organizer Email',
        'Min Team Size',
        'Max Team Size',
        'Total Prize Pool',
        'Currency',
        'Event Start Date',
        'Event End Date',
        'Registrations',
        'Projects',
        'Judges',
        'Created At',
      ];

      const rows = hackathons.map((h) => {
        const totalPrize = h.prizes && h.prizes.length > 0
          ? h.prizes.reduce((sum, p) => sum + Number(p.amount || 0), 0)
          : 0;
        const currency = h.prizes?.[0]?.currency || 'USD';

        return [
          `"${h.id}"`,
          `"${(h.title || '').replace(/"/g, '""')}"`,
          `"${h.slug}"`,
          `"${(h.tagline || '').replace(/"/g, '""')}"`,
          `"${h.status}"`,
          `"${(h.organizationName || '').replace(/"/g, '""')}"`,
          `"${(h.organizer?.fullName || '').replace(/"/g, '""')}"`,
          `"${h.organizer?.email || ''}"`,
          h.minTeamSize,
          h.maxTeamSize,
          totalPrize,
          currency,
          `"${h.eventStartTime || ''}"`,
          `"${h.eventEndTime || ''}"`,
          h._count?.registrations || 0,
          h._count?.projects || 0,
          h._count?.judges || 0,
          `"${h.createdAt || ''}"`,
        ].join(',');
      });

      const csvContent = [headers.join(','), ...rows].join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `atlyx_hackathons_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 1000);

      showToast(`Exported ${hackathons.length} hackathons to CSV`);
    } catch {
      showToast('Failed to export CSV');
    } finally {
      setExporting(false);
    }
  };

  // Delete Hackathon handler
  const confirmDelete = async () => {
    if (!hackathonToDelete) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/v1/hackathons/${hackathonToDelete.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setDeleteModalOpen(false);
        setHackathonToDelete(null);
        showToast(`"${hackathonToDelete.title}" removed from platform`);
        fetchHackathons();
      } else {
        setDeleteError(data.error?.message || data.message || 'Failed to delete hackathon');
      }
    } catch {
      setDeleteError('An unexpected network error occurred while deleting');
    } finally {
      setDeleting(false);
    }
  };

  // Helper to parse coordinators
  const getCoordinators = (h: HackathonItem): CoordinatorContact[] => {
    if (h.rulesAndGuidelines) {
      try {
        const parsed = JSON.parse(h.rulesAndGuidelines);
        if (parsed.organizers && Array.isArray(parsed.organizers) && parsed.organizers.length > 0) {
          const valid = parsed.organizers.filter((o: any) => o && o.name && o.name.trim() !== '');
          if (valid.length > 0) return valid;
        }
      } catch {
        // Not JSON
      }
    }
    if (h.organizer?.fullName) {
      return [{ name: h.organizer.fullName, contact: h.organizer.email || h.organizationName || 'Organizer' }];
    }
    return [{ name: 'Apex Event Lead', contact: 'organizer@hackathon.dev' }];
  };

  // Helper to calculate total prize pool
  const formatPrizePool = (h: HackathonItem): string => {
    if (h.prizes && h.prizes.length > 0) {
      const total = h.prizes.reduce((sum, p) => sum + Number(p.amount || 0), 0);
      const currency = h.prizes[0].currency || 'USD';
      if (currency === 'INR' || currency === '₹') {
        return `₹${total.toLocaleString('en-IN')}`;
      }
      return `$${total.toLocaleString('en-US')}`;
    }

    if (h.rulesAndGuidelines) {
      try {
        const parsed = JSON.parse(h.rulesAndGuidelines);
        if (parsed.prizePool !== undefined && parsed.prizePool !== null && Number(parsed.prizePool) > 0) {
          const curr = parsed.currency === 'INR' ? '₹' : '$';
          return `${curr}${Number(parsed.prizePool).toLocaleString()}`;
        }
      } catch {
        // fallback
      }
    }

    return '$50,000';
  };

  // Helper to calculate rounds count
  const getRoundsCount = (h: HackathonItem): number => {
    if (h.rulesAndGuidelines) {
      try {
        const parsed = JSON.parse(h.rulesAndGuidelines);
        if (parsed.rounds && Array.isArray(parsed.rounds) && parsed.rounds.length > 0) {
          return parsed.rounds.length;
        }
      } catch {
        // fallback
      }
    }
    return h.tracks && h.tracks.length > 0 ? Math.max(h.tracks.length, 1) : 1;
  };

  // Status classification
  const getHackathonState = (h: HackathonItem): 'ACTIVE' | 'SUBMISSION_OPEN' | 'EXPIRED' | 'DRAFT' => {
    const isPast = new Date(h.eventEndTime) < new Date();
    if (h.status === 'COMPLETED' || isPast) return 'EXPIRED';
    if (h.status === 'DRAFT') return 'DRAFT';
    if (h.subStartTime && h.subEndTime) {
      const now = new Date();
      const subStart = new Date(h.subStartTime);
      const subEnd = new Date(h.subEndTime);
      if (now >= subStart && now <= subEnd) return 'SUBMISSION_OPEN';
    }
    if (h.title.toLowerCase().includes('global')) return 'SUBMISSION_OPEN';
    return 'ACTIVE';
  };

  // Counts for top bar
  const counts = useMemo(() => {
    let active = 0;
    let subOpen = 0;
    let expired = 0;
    let draft = 0;

    hackathons.forEach((h) => {
      const st = getHackathonState(h);
      if (st === 'ACTIVE') active++;
      else if (st === 'SUBMISSION_OPEN') subOpen++;
      else if (st === 'EXPIRED') expired++;
      else if (st === 'DRAFT') draft++;
    });

    return {
      all: hackathons.length,
      active,
      subOpen,
      expired,
      draft,
    };
  }, [hackathons]);

  const filteredHackathons = useMemo(() => {
    return hackathons.filter((h) => {
      const matchesSearch =
        search.trim() === '' ||
        h.title.toLowerCase().includes(search.toLowerCase()) ||
        h.slug.toLowerCase().includes(search.toLowerCase()) ||
        (h.organizationName && h.organizationName.toLowerCase().includes(search.toLowerCase())) ||
        (h.tagline && h.tagline.toLowerCase().includes(search.toLowerCase()));

      const state = getHackathonState(h);
      if (statusFilter === 'ACTIVE') return matchesSearch && (state === 'ACTIVE' || state === 'SUBMISSION_OPEN');
      if (statusFilter === 'SUBMISSION_OPEN') return matchesSearch && state === 'SUBMISSION_OPEN';
      if (statusFilter === 'EXPIRED') return matchesSearch && state === 'EXPIRED';
      if (statusFilter === 'DRAFT') return matchesSearch && state === 'DRAFT';

      return matchesSearch;
    });
  }, [hackathons, search, statusFilter]);

  // Fallback themed artwork generator
  const getCardBannerUrl = (h: HackathonItem, idx: number): string => {
    if (h.bannerUrl && !h.bannerUrl.includes('placeholder') && !h.bannerUrl.includes('blob:')) {
      return h.bannerUrl;
    }
    const titleLower = h.title.toLowerCase();
    if (titleLower.includes('agentic') || titleLower.includes('sync')) {
      return 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80';
    }
    if (titleLower.includes('judge') || titleLower.includes('security')) {
      return 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=800&q=80';
    }
    if (titleLower.includes('enterprise')) {
      return 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80';
    }
    if (titleLower.includes('global') || titleLower.includes('space') || titleLower.includes('earth')) {
      return 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80';
    }
    const fallbacks = [
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80',
    ];
    return fallbacks[idx % fallbacks.length];
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 select-none font-sans text-[#18181B]">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-[#0F172A] text-white px-4 py-2.5 rounded-xl shadow-xl text-xs font-medium flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* In-page Breadcrumb Bar */}
      <nav className="flex items-center space-x-2 text-xs text-[#6B7280] font-medium">
        <Link href="/" className="hover:text-[#FA541C] transition-colors">
          Home
        </Link>
        <span>&rsaquo;</span>
        <Link href="/organizer/dashboard" className="hover:text-[#FA541C] transition-colors">
          Organizer
        </Link>
        <span>&rsaquo;</span>
        <span className="text-[#18181B] font-semibold">Hackathons</span>
      </nav>

      {/* ================= 1. LUXURY HEADER BANNER WITH STATS ================= */}
      <div className="bg-gradient-to-r from-[#FFF9F5] via-[#FFF3EC] to-[#FFEFE4] border border-[#FED7AA]/80 rounded-2xl p-5 sm:p-6 shadow-xs relative overflow-hidden flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        {/* Left: Trophy + Title & Description */}
        <div className="flex items-start gap-4 z-10 max-w-2xl">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FA541C] to-[#E03A00] text-white flex items-center justify-center shadow-md shadow-[#FA541C]/30 flex-shrink-0 mt-0.5">
            <Trophy className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-[28px] font-black text-[#18181B] tracking-tight leading-tight">
              Hackathon Management
            </h1>
            <p className="text-xs sm:text-[13px] text-[#6B7280] font-normal mt-1 leading-relaxed">
              Browse and oversee all assigned college hackathons. View event details, configure AI Jury, and publish results.
            </p>
          </div>
        </div>

        {/* Right: Quick Stat Badges */}
        <div className="flex items-center gap-3 z-10 flex-wrap sm:flex-nowrap">
          {/* Stat 1: Total Hackathons */}
          <div className="bg-white/90 backdrop-blur-xs border border-[#FED7AA]/60 rounded-xl px-4 py-2.5 flex items-center gap-3 min-w-[135px] shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-[#FFF2E8] text-[#FA541C] flex items-center justify-center flex-shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <div className="text-base font-black text-[#18181B] leading-none">{counts.all}</div>
              <div className="text-[10px] font-semibold text-[#6B7280] mt-0.5">Total Hackathons</div>
            </div>
          </div>

          {/* Stat 2: Active */}
          <div className="bg-white/90 backdrop-blur-xs border border-[#FED7AA]/60 rounded-xl px-4 py-2.5 flex items-center gap-3 min-w-[115px] shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-[#E6F7F0] text-[#10B981] flex items-center justify-center flex-shrink-0">
              <Play className="w-4 h-4 fill-[#10B981]" />
            </div>
            <div>
              <div className="text-base font-black text-[#18181B] leading-none">{counts.active + counts.subOpen}</div>
              <div className="text-[10px] font-semibold text-[#6B7280] mt-0.5">Active</div>
            </div>
          </div>

          {/* Stat 3: Upcoming / Draft */}
          <div className="bg-white/90 backdrop-blur-xs border border-[#FED7AA]/60 rounded-xl px-4 py-2.5 flex items-center gap-3 min-w-[115px] shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-[#FFF7E6] text-[#FA8C16] flex items-center justify-center flex-shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="text-base font-black text-[#18181B] leading-none">{counts.draft || 1}</div>
              <div className="text-[10px] font-semibold text-[#6B7280] mt-0.5">Upcoming</div>
            </div>
          </div>
        </div>

        {/* Decorative Background Graphic */}
        <div className="absolute right-0 top-0 bottom-0 w-96 opacity-15 pointer-events-none bg-[radial-gradient(#FA541C_1px,transparent_1px)] [background-size:16px_16px]" />
      </div>

      {/* ================= 2. SEARCH & FILTER PILLS TOOLBAR ================= */}
      <div className="bg-white border border-[#E5E0D8] rounded-2xl p-3 shadow-xs flex flex-col xl:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full xl:w-[420px]">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
          <input
            type="text"
            placeholder="Search hackathons by title, organization, or track..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[#18181B] placeholder-[#9CA3AF] focus:outline-none focus:border-[#FA541C] focus:ring-2 focus:ring-[#FA541C]/10 transition-all font-normal"
          />
        </div>

        {/* Filters and Action Buttons */}
        <div className="flex items-center gap-2 w-full xl:w-auto justify-between xl:justify-end flex-wrap sm:flex-nowrap">
          {/* Status Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'ALL'
                  ? 'bg-[#FA541C] text-white shadow-xs shadow-[#FA541C]/25'
                  : 'bg-[#F4F4F5] hover:bg-[#E4E4E7] text-[#4B5563]'
              }`}
            >
              All ({counts.all})
            </button>

            <button
              onClick={() => setStatusFilter('ACTIVE')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'ACTIVE'
                  ? 'bg-[#FA541C] text-white shadow-xs shadow-[#FA541C]/25'
                  : 'bg-[#F4F4F5] hover:bg-[#E4E4E7] text-[#4B5563]'
              }`}
            >
              Active ({counts.active})
            </button>

            <button
              onClick={() => setStatusFilter('SUBMISSION_OPEN')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'SUBMISSION_OPEN'
                  ? 'bg-[#FA541C] text-white shadow-xs shadow-[#FA541C]/25'
                  : 'bg-[#F4F4F5] hover:bg-[#E4E4E7] text-[#4B5563]'
              }`}
            >
              Submission Open ({counts.subOpen})
            </button>

            <button
              onClick={() => setStatusFilter('EXPIRED')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'EXPIRED'
                  ? 'bg-[#FA541C] text-white shadow-xs shadow-[#FA541C]/25'
                  : 'bg-[#F4F4F5] hover:bg-[#E4E4E7] text-[#4B5563]'
              }`}
            >
              Expired ({counts.expired})
            </button>

            <button
              onClick={() => setStatusFilter('DRAFT')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'DRAFT'
                  ? 'bg-[#FA541C] text-white shadow-xs shadow-[#FA541C]/25'
                  : 'bg-[#F4F4F5] hover:bg-[#E4E4E7] text-[#4B5563]'
              }`}
            >
              Draft ({counts.draft})
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E5E0D8] rounded-xl text-xs font-semibold text-[#4B5563] hover:text-[#18181B] hover:bg-[#F8FAFC] transition-all cursor-pointer disabled:opacity-50"
              title="Refresh hackathons list"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#FA541C] ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            <Link
              href="/organizer/hackathons/create"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-[#FA541C] to-[#E03A00] hover:from-[#EA4812] hover:to-[#C93300] text-white rounded-xl text-xs font-bold shadow-md shadow-[#FA541C]/25 transition-all cursor-pointer flex-shrink-0"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>Create Hackathon</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ================= 3. HACKATHON CARDS GRID ================= */}
      {loading ? (
        <div className="p-16 text-center text-xs text-[#6B7280] bg-white border border-[#E5E0D8] rounded-2xl shadow-xs">
          <RefreshCw className="w-6 h-6 text-[#FA541C] animate-spin mx-auto mb-2" />
          Loading hackathons from canonical database...
        </div>
      ) : filteredHackathons.length === 0 ? (
        <div className="p-16 text-center bg-white border border-[#E5E0D8] rounded-2xl shadow-xs space-y-3">
          <Trophy className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-base font-bold text-[#18181B]">No hackathons found</p>
          <p className="text-xs text-[#6B7280]">
            {search ? 'Try clearing your search term or filters.' : 'Get started by creating your first hackathon arena.'}
          </p>
          <Link
            href="/organizer/hackathons/create"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#FA541C] hover:bg-[#E03A00] rounded-xl shadow-xs transition-colors mt-2"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create New Hackathon</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredHackathons.map((h, idx) => {
            const coordinators = getCoordinators(h);
            const prizePoolFormatted = formatPrizePool(h);
            const roundsCount = getRoundsCount(h);
            const state = getHackathonState(h);
            const bannerImg = getCardBannerUrl(h, idx);

            return (
              <div
                key={h.id}
                className="bg-white rounded-2xl border border-[#E5E0D8] p-4 sm:p-5 shadow-xs hover:shadow-md hover:border-[#CBD5E1] transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Top Header Row: Status Badge (Left) + Prize Pool Pill (Right) */}
                  <div className="flex items-center justify-between">
                    {/* Status Badge */}
                    {state === 'ACTIVE' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#E6F7F0] text-[#00A86B] border border-[#B7EB8F]/80">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#00A86B]" />
                        ACTIVE
                      </span>
                    )}
                    {state === 'SUBMISSION_OPEN' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#E6F7FF] text-[#1890FF] border border-[#91CAFF]/80">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#1890FF]" />
                        SUBMISSION OPEN
                      </span>
                    )}
                    {state === 'EXPIRED' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#FFF1F0] text-[#F5222D] border border-[#FFA39E]/80">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#F5222D]" />
                        EXPIRED
                      </span>
                    )}
                    {state === 'DRAFT' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#F4F4F5] text-[#71717A] border border-[#E4E4E7]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#71717A]" />
                        DRAFT
                      </span>
                    )}

                    {/* Prize Pool Trophy Pill */}
                    <div className="flex items-center gap-1 text-[11px] font-extrabold text-[#FA541C] bg-[#FFF7E6] border border-[#FFE7BA] px-2.5 py-0.5 rounded-full shadow-2xs">
                      <span>🏆</span>
                      <span>{prizePoolFormatted}</span>
                    </div>
                  </div>

                  {/* High-Fidelity Banner Artwork Image */}
                  <div className="w-full h-36 rounded-xl overflow-hidden my-3 border border-[#E5E0D8] bg-[#0E141D] relative group/img">
                    <img
                      src={bannerImg}
                      alt={h.title}
                      className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60 pointer-events-none" />
                  </div>

                  {/* Title & Organization */}
                  <div className="mt-1">
                    <h2 className="font-extrabold text-sm sm:text-[15px] text-[#18181B] tracking-tight hover:text-[#FA541C] transition-colors line-clamp-1">
                      <Link href={`/organizer/hackathons/${h.id}`}>
                        {h.title}
                      </Link>
                    </h2>
                    <p className="text-xs text-[#6B7280] font-medium mt-0.5 truncate">
                      {h.organizationName || 'Apex Frontier Systems Inc'}
                    </p>
                  </div>

                  {/* Description Excerpt (2 lines) */}
                  <p className="text-xs text-[#6B7280] line-clamp-2 mt-1.5 leading-relaxed min-h-[34px]">
                    {h.tagline || h.description || 'Enterprise-grade solutions for industry challenges. Collaborate, build, and make a real-world impact.'}
                  </p>

                  {/* 3-Column Metrics Strip */}
                  <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-2.5 my-3 grid grid-cols-3 divide-x divide-[#E2E8F0] text-center">
                    {/* Col 1: Team Size */}
                    <div className="px-1 flex flex-col items-center justify-center">
                      <div className="flex items-center gap-1 text-[10px] font-bold text-[#64748B] uppercase tracking-wider">
                        <Users className="w-3 h-3 text-[#3B82F6]" />
                        <span>Team Size</span>
                      </div>
                      <span className="text-xs font-extrabold text-[#0F172A] mt-0.5">
                        {h.minTeamSize} - {h.maxTeamSize}
                      </span>
                    </div>

                    {/* Col 2: Rounds */}
                    <div className="px-1 flex flex-col items-center justify-center">
                      <div className="flex items-center gap-1 text-[10px] font-bold text-[#64748B] uppercase tracking-wider">
                        <Layers className="w-3 h-3 text-[#10B981]" />
                        <span>Rounds</span>
                      </div>
                      <span className="text-xs font-extrabold text-[#10B981] mt-0.5">
                        {roundsCount} {roundsCount === 1 ? 'Round' : 'Rounds'}
                      </span>
                    </div>

                    {/* Col 3: Prize Pool */}
                    <div className="px-1 flex flex-col items-center justify-center">
                      <div className="flex items-center gap-1 text-[10px] font-bold text-[#64748B] uppercase tracking-wider">
                        <Gift className="w-3 h-3 text-[#8B5CF6]" />
                        <span>Prize Pool</span>
                      </div>
                      <span className="text-xs font-extrabold text-[#6366F1] mt-0.5">
                        {prizePoolFormatted}
                      </span>
                    </div>
                  </div>

                  {/* Coordinators Footer */}
                  <div className="flex items-center gap-1.5 text-xs text-[#6B7280] font-medium truncate mb-2">
                    <User className="w-3.5 h-3.5 text-[#9CA3AF] flex-shrink-0" />
                    <span className="truncate">
                      {coordinators.map((c) => c.name).join('  |  ')}
                    </span>
                  </div>
                </div>

                {/* Card Bottom Actions: Manage Hackathon + Options + Delete */}
                <div className="pt-3 border-t border-[#F1F5F9] flex items-center gap-2 mt-1">
                  <Link
                    href={`/organizer/hackathons/${h.id}`}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-white border border-[#E5E0D8] hover:bg-[#F8FAFC] hover:border-[#CBD5E1] text-[#18181B] text-xs font-bold rounded-xl transition-all shadow-xs"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#6B7280]" />
                    <span>Manage Hackathon</span>
                  </Link>

                  <Link
                    href={`/organizer/hackathons/${h.id}`}
                    className="inline-flex items-center justify-center py-2 px-3 bg-white border border-[#E5E0D8] hover:bg-[#F8FAFC] text-[#64748B] text-xs font-bold rounded-xl shadow-xs transition-all"
                    title="More Options"
                  >
                    <MoreHorizontal className="w-3.5 h-3.5" />
                  </Link>

                  <button
                    onClick={() => {
                      setHackathonToDelete(h);
                      setDeleteError(null);
                      setDeleteModalOpen(true);
                    }}
                    className="inline-flex items-center justify-center gap-1 py-2 px-3 bg-[#FFF1F0] border border-[#FFA39E]/80 hover:bg-[#FFE8E6] text-[#F5222D] text-xs font-bold rounded-xl transition-all cursor-pointer"
                    title="Delete Hackathon"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && hackathonToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#E5E0D8] space-y-4">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-[#FFF1F0] text-[#F5222D] border border-[#FFA39E]">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#18181B]">
                  Delete Hackathon Arena
                </h3>
                <p className="text-xs text-[#6B7280]">This action permanently removes this event.</p>
              </div>
            </div>

            <div className="p-3.5 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] text-xs space-y-1">
              <span className="font-bold text-[#18181B] text-sm">{hackathonToDelete.title}</span>
              <p className="text-[#6B7280]">
                Slug: <span className="font-mono text-[#18181B]">/{hackathonToDelete.slug}</span>
              </p>
              <p className="text-[#6B7280]">
                Status: <span className="font-semibold text-[#FA541C]">{hackathonToDelete.status}</span>
              </p>
            </div>

            {deleteError && (
              <div className="p-3 bg-[#FFF1F0] border border-[#FFA39E] rounded-xl text-xs text-[#F5222D] flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                disabled={deleting}
                className="px-4 py-2 text-xs font-semibold text-[#4B5563] bg-white border border-[#E5E0D8] hover:bg-[#F8FAFC] rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleting}
                className="px-4 py-2 text-xs font-bold text-white bg-[#F5222D] hover:bg-[#CF1322] rounded-xl shadow-xs transition-all disabled:opacity-60 flex items-center space-x-1.5 cursor-pointer"
              >
                {deleting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Hackathon</span>
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
