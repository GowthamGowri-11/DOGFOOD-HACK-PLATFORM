'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  Trophy,
  Search,
  Plus,
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
  Sparkles,
  ExternalLink,
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
  status: string;
  organizationName: string;
  minTeamSize: number;
  maxTeamSize: number;
  bannerUrl: string | null;
  eventStartTime: string;
  eventEndTime: string;
  rulesAndGuidelines?: string | null;
  organizer: {
    id: string;
    fullName: string;
    email: string;
  };
  prizes?: PrizeItem[];
  tracks?: Array<{ id: string; title: string }>;
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

export default function AdminHackathonsPage() {
  const [hackathons, setHackathons] = useState<HackathonItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
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
        page: '1',
        pageSize: '50',
      });
      if (search.trim()) params.append('search', search.trim());
      if (statusFilter === 'DRAFT') params.append('status', 'DRAFT');

      const res = await fetch(`/api/v1/admin/hackathons?${params.toString()}`);
      const json = await res.json();
      if (json.success && json.data) {
        setHackathons(json.data.hackathons || []);
      } else {
        setHackathons([]);
        showToast(json.error?.message || 'Failed to load hackathons');
      }
    } catch (err) {
      console.error('Failed to fetch hackathons:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    fetchHackathons();
  }, [fetchHackathons]);

  const handleRefresh = async () => {
    await fetchHackathons(true);
    showToast('Hackathon directory refreshed successfully');
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
      const res = await fetch(`/api/v1/admin/hackathons/${hackathonToDelete.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setDeleteModalOpen(false);
        setHackathonToDelete(null);
        showToast(`"${hackathonToDelete.title}" removed from platform`);
        fetchHackathons();
      } else {
        setDeleteError(data.error?.message || 'Failed to delete hackathon');
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
    return [];
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

    return '$0';
  };

  // Helper to calculate rounds count
  const getRoundsCount = (h: HackathonItem): number => {
    if (h.rulesAndGuidelines) {
      try {
        const parsed = JSON.parse(h.rulesAndGuidelines);
        if (parsed.rounds && Array.isArray(parsed.rounds)) {
          return parsed.rounds.length;
        }
      } catch {
        // fallback
      }
    }
    return h.tracks && h.tracks.length > 0 ? h.tracks.length : 1;
  };

  // Status Badge matching the exact screenshot (ACTIVE in green, DRAFT in grey, EXPIRED in dark)
  const renderStatusBadge = (h: HackathonItem) => {
    const isPast = new Date(h.eventEndTime) < new Date();
    if (h.status === 'DRAFT') {
      return (
        <span className="px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase bg-[#ECEAE4] text-[#6B7280]">
          DRAFT
        </span>
      );
    }

    if (h.status === 'COMPLETED' || isPast) {
      return (
        <span className="px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase bg-black/60 text-white">
          EXPIRED
        </span>
      );
    }

    if (h.status === 'PUBLISHED' || h.status === 'EVENT_ACTIVE' || h.status === 'REGISTRATION_OPEN') {
      return (
        <span className="px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase bg-[#ECFDF5] text-[#059669]">
          ACTIVE
        </span>
      );
    }

    if (h.status === 'JUDGING') {
      return (
        <span className="px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase bg-[#EFF6FF] text-[#2563EB]">
          JUDGING
        </span>
      );
    }

    return (
      <span className="px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase bg-[#FAF8F5] text-[#6B7280]">
        {h.status}
      </span>
    );
  };

  const filteredHackathons = useMemo(() => {
    return hackathons.filter((h) => {
      const matchesSearch =
        search.trim() === '' ||
        h.title.toLowerCase().includes(search.toLowerCase()) ||
        h.slug.toLowerCase().includes(search.toLowerCase()) ||
        (h.tagline && h.tagline.toLowerCase().includes(search.toLowerCase()));

      const isPast = new Date(h.eventEndTime) < new Date();
      if (statusFilter === 'EXPIRED') return matchesSearch && (h.status === 'COMPLETED' || isPast);
      if (statusFilter === 'ACTIVE') return matchesSearch && (h.status === 'PUBLISHED' || h.status === 'EVENT_ACTIVE' || h.status === 'REGISTRATION_OPEN');
      if (statusFilter === 'DRAFT') return matchesSearch && h.status === 'DRAFT';

      return matchesSearch;
    });
  }, [hackathons, search, statusFilter]);

  return (
    <div className="space-y-6 max-w-[1440px] mx-auto pb-12 select-none animate-in fade-in duration-300">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-[#18181B] text-white px-4 py-2.5 rounded-xl shadow-xl text-xs font-semibold flex items-center gap-2 border border-[#3F3F46] animate-in fade-in slide-in-from-top-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Breadcrumb Bar matching screenshot: Home > Admin > Hackathons */}
      <nav className="flex items-center space-x-2 text-xs text-[#64748B] font-medium pt-1">
        <Link href="/" className="hover:text-[#FA541C] transition-colors">
          Home
        </Link>
        <span className="text-[#9CA3AF]">&rsaquo;</span>
        <Link href="/admin/dashboard" className="hover:text-[#FA541C] transition-colors">
          Admin
        </Link>
        <span className="text-[#9CA3AF]">&rsaquo;</span>
        <span className="text-[#18181B] font-bold">Hackathons</span>
      </nav>

      {/* Top Header matching screenshot */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div className="flex items-start gap-3.5">
          {/* Orange squircle with trophy icon */}
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FA541C] to-[#E03A00] flex items-center justify-center text-white flex-shrink-0 shadow-md shadow-[#FA541C]/25 mt-0.5">
            <Trophy className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#111827] tracking-tight leading-tight">
              Hackathon Management
            </h1>
            <p className="text-xs sm:text-[13px] text-[#6B7280] font-normal mt-1">
              Browse and oversee all college hackathons. View event details, configure AI Jury, and publish results.
            </p>
          </div>
        </div>

        {/* 3 Action Buttons: Export CSV, Refresh, + Create Hackathon */}
        <div className="flex items-center gap-2.5 self-start sm:self-center flex-wrap">
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={exporting}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-[#E5E0D8] rounded-xl text-xs font-semibold text-[#18181B] hover:bg-[#FAF8F5] hover:border-[#D1D5DB] shadow-xs hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            title="Download CSV report"
          >
            <Download className="w-3.5 h-3.5 text-[#64748B]" />
            <span>{exporting ? 'Exporting...' : 'Export CSV'}</span>
          </button>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-[#E5E0D8] rounded-xl text-xs font-semibold text-[#18181B] hover:bg-[#FAF8F5] hover:border-[#D1D5DB] shadow-xs hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            title="Refresh hackathons list"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-[#4B5563] transition-transform duration-500 ${
                refreshing ? 'animate-spin text-[#FA541C]' : ''
              }`}
            />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>

          <Link
            href="/admin/hackathons/create"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-[#FA541C] to-[#E03A00] hover:from-[#FF6636] hover:to-[#D4380D] text-white rounded-xl text-xs font-bold shadow-md shadow-[#FA541C]/25 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.8]" />
            <span>Create Hackathon</span>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar Container matching screenshot */}
      <div className="bg-white border border-[#E5E0D8] rounded-2xl p-4 shadow-xs flex flex-col lg:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full lg:max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none" />
          <input
            type="text"
            placeholder="Search hackathons by title or slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-11 pl-10 pr-9 text-xs bg-white border border-[#E5E0D8] rounded-xl text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#FA541C] focus:ring-2 focus:ring-[#FA541C]/15 transition-all shadow-2xs hover:border-[#D1D5DB]"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#111827] p-1 rounded-full hover:bg-[#F3F4F6] transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status Tabs matching screenshot */}
        <div className="flex items-center space-x-3 w-full lg:w-auto justify-between lg:justify-end flex-wrap gap-2">
          <div className="flex items-center space-x-1.5 text-xs">
            {[
              { id: '', label: 'All' },
              { id: 'ACTIVE', label: 'Active' },
              { id: 'EXPIRED', label: 'Expired' },
              { id: 'DRAFT', label: 'Draft' },
            ].map((tab) => (
              <button
                key={tab.id || 'ALL'}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === tab.id
                    ? 'bg-[#FA541C] text-white shadow-sm shadow-[#FA541C]/30 scale-105'
                    : 'bg-white border border-[#E5E0D8] text-[#4B5563] hover:bg-[#FAF8F5] hover:text-[#111827]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <span className="text-xs font-medium text-[#6B7280] whitespace-nowrap pl-2">
            Showing <strong className="text-[#111827] font-bold">{filteredHackathons.length}</strong> hackathons
          </span>
        </div>
      </div>

      {/* Cards Grid matching screenshot */}
      {loading ? (
        <div className="p-16 text-center text-xs text-[#6B7280] bg-white border border-[#E5E0D8] rounded-3xl shadow-xs">
          <RefreshCw className="w-6 h-6 text-[#FA541C] animate-spin mx-auto mb-2" />
          Loading hackathons from platform registry...
        </div>
      ) : filteredHackathons.length === 0 ? (
        <div className="p-16 text-center bg-white border border-[#E5E0D8] rounded-3xl shadow-xs space-y-3">
          <Trophy className="w-12 h-12 text-[#D1D5DB] mx-auto stroke-[1.5]" />
          <p className="text-base font-bold text-[#111827]">No hackathons found</p>
          <p className="text-xs text-[#6B7280]">
            {search ? 'Try clearing your search term or filters.' : 'Get started by creating your first hackathon arena.'}
          </p>
          <Link
            href="/admin/hackathons/create"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-[#FA541C] to-[#E03A00] rounded-xl shadow-md shadow-[#FA541C]/25 hover:shadow-lg transition-all mt-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Hackathon</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredHackathons.map((h) => {
            const coordinators = getCoordinators(h);
            const prizePoolFormatted = formatPrizePool(h);
            const roundsCount = getRoundsCount(h);
            const tracksCount = h.tracks?.length || 0;

            return (
              <div
                key={h.id}
                className="bg-white rounded-3xl border border-[#E5E0D8] p-4 sm:p-5 shadow-xs hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 group flex flex-col justify-between overflow-hidden"
              >
                <div>
                  {/* Banner Box / Preview matching screenshot */}
                  <div className="w-full h-44 rounded-2xl overflow-hidden relative group/banner flex flex-col justify-between p-3.5 bg-gradient-to-br from-[#1E293B] via-[#0F172A] to-black">
                    {/* Status Badge top left */}
                    <div className="relative z-10">
                      {renderStatusBadge(h)}
                    </div>

                    {/* Banner Image with hover zoom */}
                    {h.bannerUrl ? (
                      <img
                        src={h.bannerUrl}
                        alt={h.title}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-[#1E1B2E] via-[#0F172A] to-[#111215] flex flex-col justify-center items-center p-4 text-center">
                        <span className="text-xs font-bold tracking-widest text-[#FA541C] uppercase mb-1">
                          ATLYX ARENA
                        </span>
                        <h2 className="text-white font-extrabold text-sm sm:text-base line-clamp-2">
                          {h.title}
                        </h2>
                      </div>
                    )}

                    {/* Dark gradient overlay for title legibility */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent pointer-events-none" />

                    {/* Bottom row inside banner */}
                    <div className="relative z-10 mt-auto text-left">
                      <span className="text-[10px] font-bold text-white/80 tracking-wider uppercase block">
                        ATLYX
                      </span>
                      <h2 className="text-white font-black text-sm sm:text-[15px] tracking-tight line-clamp-1 leading-snug">
                        {h.title}
                      </h2>
                      {h.tagline && (
                        <p className="text-white/70 text-[11px] truncate mt-0.5 font-normal">
                          {h.tagline}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Title & Tagline outside banner */}
                  <div className="mt-3.5">
                    <h3 className="font-bold text-[15px] sm:text-base text-[#111827] tracking-tight group-hover:text-[#FA541C] transition-colors line-clamp-1">
                      <Link href={`/admin/hackathons/${h.id}`}>
                        {h.title}
                      </Link>
                    </h3>
                    <p className="text-xs text-[#6B7280] font-normal mt-0.5 line-clamp-1">
                      {h.tagline || h.organizationName || 'Verified Competition Arena'}
                    </p>
                  </div>

                  {/* 4-Col Stat Bar (TEAM SIZE, TRACKS, ROUNDS, PRIZE POOL) matching screenshot */}
                  <div className="bg-[#FAF8F5] border border-[#F1ECE4] rounded-xl p-2.5 my-3.5 grid grid-cols-4 divide-x divide-[#ECE6DD] text-center">
                    <div className="px-1">
                      <span className="text-[9.5px] font-bold text-[#6B7280] uppercase tracking-wider block">
                        TEAM SIZE
                      </span>
                      <div className="flex items-center justify-center gap-1 mt-1 text-[#2563EB]">
                        <Users className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="text-xs font-bold text-[#111827]">
                          {h.minTeamSize} - {h.maxTeamSize}
                        </span>
                      </div>
                    </div>

                    <div className="px-1">
                      <span className="text-[9.5px] font-bold text-[#6B7280] uppercase tracking-wider block">
                        TRACKS
                      </span>
                      <div className="flex items-center justify-center gap-1 mt-1 text-[#7C3AED]">
                        <Layers className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="text-xs font-bold text-[#7C3AED]">
                          {tracksCount} Tracks
                        </span>
                      </div>
                    </div>

                    <div className="px-1">
                      <span className="text-[9.5px] font-bold text-[#6B7280] uppercase tracking-wider block">
                        ROUNDS
                      </span>
                      <div className="flex items-center justify-center gap-1 mt-1 text-[#059669]">
                        <Layers className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="text-xs font-bold text-[#059669]">
                          {roundsCount}
                        </span>
                      </div>
                    </div>

                    <div className="px-1">
                      <span className="text-[9.5px] font-bold text-[#6B7280] uppercase tracking-wider block">
                        PRIZE POOL
                      </span>
                      <div className="flex items-center justify-center gap-1 mt-1 text-[#D97706]">
                        <Trophy className="w-3.5 h-3.5 flex-shrink-0 text-[#EAB308]" />
                        <span className="text-xs font-bold text-[#D97706] truncate">
                          {prizePoolFormatted}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Organizer Row matching screenshot */}
                  <div className="flex items-center space-x-2.5 my-2.5 text-xs">
                    <div className="w-7 h-7 rounded-full bg-[#F4F1EB] flex items-center justify-center text-[#6B7280] flex-shrink-0">
                      <Users className="w-3.5 h-3.5" />
                    </div>
                    <div className="truncate">
                      <span className="font-bold text-[#111827] text-xs block leading-tight truncate">
                        {coordinators[0]?.name || h.organizer?.fullName || 'Platform Lead'}
                      </span>
                      <span className="text-[11px] text-[#6B7280] block truncate font-mono mt-0.5">
                        {coordinators[0]?.contact || h.organizer?.email || 'admin@atlyx.io'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Bottom Actions: Manage Hackathon + Delete matching screenshot */}
                <div className="pt-3 border-t border-[#F1ECE4] flex items-center space-x-2 mt-2">
                  <Link
                    href={`/admin/hackathons/${h.id}`}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-white border border-[#E5E0D8] hover:bg-[#FAF8F5] hover:border-[#CBD5E1] hover:text-[#FA541C] text-[#374151] text-xs font-semibold rounded-xl transition-all shadow-2xs hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#6B7280]" />
                    <span>Manage Hackathon</span>
                  </Link>

                  <button
                    onClick={() => {
                      setHackathonToDelete(h);
                      setDeleteError(null);
                      setDeleteModalOpen(true);
                    }}
                    className="inline-flex items-center justify-center gap-1 py-2 px-3 bg-[#FEF2F2] border border-[#FECACA] hover:bg-[#FEE2E2] hover:border-[#F87171] text-[#DC2626] text-xs font-semibold rounded-xl transition-all shadow-2xs hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-[#FECACA] space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-[#FEF2F2] border border-[#FECACA] flex items-center justify-center text-[#DC2626]">
                <Trash2 className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#DC2626]">
                  Delete Hackathon Arena
                </h3>
                <p className="text-xs text-[#6B7280]">This action permanently removes this event.</p>
              </div>
            </div>

            <div className="p-3.5 bg-[#FAF8F5] rounded-2xl border border-[#E5E0D8] text-xs space-y-1">
              <span className="font-bold text-[#111827] text-sm block">{hackathonToDelete.title}</span>
              <span className="text-[#6B7280] font-mono text-[11px] block">{hackathonToDelete.slug}</span>
            </div>

            {deleteError && (
              <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-xl text-xs text-[#DC2626] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2.5 border border-[#E5E0D8] rounded-xl text-xs font-semibold text-[#64748B] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleting}
                className="px-5 py-2.5 bg-[#DC2626] hover:bg-[#B91C1C] text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md shadow-[#DC2626]/25 disabled:opacity-50"
              >
                {deleting ? 'Removing...' : 'Confirm Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
