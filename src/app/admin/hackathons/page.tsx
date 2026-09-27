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
      if (statusFilter) params.append('status', statusFilter);

      const res = await fetch(`/api/v1/admin/hackathons?${params.toString()}`);
      const json = await res.json();
      if (json.success && json.data) {
        setHackathons(json.data.hackathons || []);
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

  // Status Badge matching site colors
  const renderStatusBadge = (h: HackathonItem) => {
    const isPast = new Date(h.eventEndTime) < new Date();
    if (h.status === 'COMPLETED' || isPast) {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-[#f1f5f9] text-[#64748b] border border-[#e2e8f0]">
          EXPIRED
        </span>
      );
    }

    if (h.status === 'PUBLISHED' || h.status === 'EVENT_ACTIVE' || h.status === 'REGISTRATION_OPEN') {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-[#ecfdf5] text-[#059669] border border-[#a7f3d0]">
          ACTIVE
        </span>
      );
    }

    if (h.status === 'JUDGING') {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-[#eff6ff] text-[#2563eb] border border-[#bfdbfe]">
          JUDGING
        </span>
      );
    }

    return (
      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-[#f8fafc] text-[#94a3b8] border border-[#e2e8f0]">
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
    <div className="space-y-6 max-w-7xl mx-auto pb-12 select-none">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-[#0f172a] text-white px-4 py-2.5 rounded-xl shadow-xl text-xs font-medium flex items-center gap-2 border border-[#334155] animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-[#10b981]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Breadcrumb Bar */}
      <nav className="flex items-center space-x-2 text-xs text-[#64748b] font-medium">
        <Link href="/" className="hover:text-[#2563eb] transition-colors">
          Home
        </Link>
        <span>&rsaquo;</span>
        <Link href="/admin/dashboard" className="hover:text-[#2563eb] transition-colors">
          Admin
        </Link>
        <span>&rsaquo;</span>
        <span className="text-[#0f172a] font-semibold">Hackathons</span>
      </nav>

      {/* Top Header Matching Site UI/UX */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#eff6ff] flex items-center justify-center text-[#2563eb] flex-shrink-0 mt-0.5 border border-[#dbeafe]">
            <Trophy className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0f172a] tracking-tight">
              Hackathon Management
            </h1>
            <p className="text-xs text-[#64748b] mt-1 font-normal">
              Browse and oversee all college hackathons. View event details, configure AI Jury, and publish results.
            </p>
          </div>
        </div>

        {/* Action Buttons Matching Site Style */}
        <div className="flex items-center gap-2.5 self-start sm:self-center flex-wrap">
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={exporting}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-[#e2e8f0] rounded-xl text-xs font-semibold text-[#334155] hover:bg-[#f8fafc] hover:border-[#cbd5e1] hover:text-[#2563eb] shadow-xs transition-all cursor-pointer disabled:opacity-50"
            title="Download CSV report"
          >
            <Download className="w-3.5 h-3.5 text-[#64748b]" />
            <span>{exporting ? 'Exporting...' : 'Export CSV'}</span>
          </button>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-[#e2e8f0] rounded-xl text-xs font-semibold text-[#334155] hover:bg-[#f8fafc] hover:border-[#cbd5e1] hover:text-[#2563eb] shadow-xs transition-all cursor-pointer disabled:opacity-50"
            title="Refresh hackathons list"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-[#2563eb] ${refreshing ? 'animate-spin' : ''}`}
            />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>

          <Link
            href="/admin/hackathons/create"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Create Hackathon</span>
          </Link>
        </div>
      </div>

      {/* Search & Counters Bar */}
      <div className="bg-white border border-[#e2e8f0] rounded-2xl p-3.5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
          <input
            type="text"
            placeholder="Search hackathons by title or slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-[#f8fafc] border border-[#e2e8f0] rounded-xl text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/10 transition-all"
          />
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center space-x-1 text-xs">
            {['', 'ACTIVE', 'EXPIRED', 'DRAFT'].map((st) => (
              <button
                key={st || 'ALL'}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                  statusFilter === st
                    ? 'bg-[#2563eb] text-white shadow-xs'
                    : 'bg-white border border-[#e2e8f0] text-[#64748b] hover:bg-[#f8fafc] hover:text-[#0f172a]'
                }`}
              >
                {st || 'All'}
              </button>
            ))}
          </div>

          <span className="text-xs font-medium text-[#64748b] whitespace-nowrap">
            Showing <strong className="text-[#0f172a] font-bold">{filteredHackathons.length}</strong> hackathons
          </span>
        </div>
      </div>

      {/* Cards Grid */}
      {loading ? (
        <div className="p-16 text-center text-xs text-[#64748b] bg-white border border-[#e2e8f0] rounded-2xl shadow-xs">
          <RefreshCw className="w-6 h-6 text-[#2563eb] animate-spin mx-auto mb-2" />
          Loading hackathons from canonical database...
        </div>
      ) : filteredHackathons.length === 0 ? (
        <div className="p-16 text-center bg-white border border-[#e2e8f0] rounded-2xl shadow-xs space-y-3">
          <Trophy className="w-10 h-10 text-[#cbd5e1] mx-auto" />
          <p className="text-base font-bold text-[#0f172a]">No hackathons found</p>
          <p className="text-xs text-[#64748b]">
            {search ? 'Try clearing your search term or filters.' : 'Get started by creating your first hackathon arena.'}
          </p>
          <Link
            href="/admin/hackathons/create"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#2563eb] hover:bg-[#1d4ed8] rounded-xl shadow-xs transition-colors mt-2"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create New Hackathon</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredHackathons.map((h) => {
            const coordinators = getCoordinators(h);
            const prizePoolFormatted = formatPrizePool(h);
            const roundsCount = getRoundsCount(h);

            return (
              <div
                key={h.id}
                className="bg-white rounded-2xl border border-[#e2e8f0] p-5 shadow-xs hover:shadow-md hover:border-[#cbd5e1] transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Status Badge */}
                  <div className="mb-2">
                    {renderStatusBadge(h)}
                  </div>

                  {/* Banner Box / Preview */}
                  <div className="w-full bg-gradient-to-br from-[#eff6ff] to-[#f8fafc] border border-[#dbeafe] rounded-xl p-5 my-2 text-center flex flex-col items-center justify-center min-h-[130px] relative overflow-hidden group/banner">
                    {h.bannerUrl ? (
                      <div className="absolute inset-0 w-full h-full">
                        <img
                          src={h.bannerUrl}
                          alt={h.title}
                          className="w-full h-full object-cover group-hover/banner:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-3 text-left">
                          <h2 className="text-white font-bold text-sm tracking-wide">{h.title}</h2>
                          {h.tagline && <p className="text-white/80 text-[11px] truncate">{h.tagline}</p>}
                        </div>
                      </div>
                    ) : (
                      <>
                        <h2 className="text-xl sm:text-2xl font-black text-[#1e40af] tracking-tight uppercase leading-tight font-sans">
                          {h.title}
                        </h2>
                        <p className="text-xs text-[#2563eb] font-mono mt-1 font-semibold tracking-wide">
                          {h.tagline || h.organizationName || 'Empowering Builders'}
                        </p>
                      </>
                    )}
                  </div>

                  {/* Title & Tagline */}
                  <div className="mt-3">
                    <h3 className="font-bold text-base text-[#0f172a] tracking-tight hover:text-[#2563eb] transition-colors">
                      <Link href={`/admin/hackathons/${h.id}`}>
                        {h.title}
                      </Link>
                    </h3>
                    <p className="text-xs text-[#64748b] font-medium mt-0.5">
                      {h.tagline || h.organizationName || ''}
                    </p>
                  </div>

                  {/* Stats Box (Team Size, Tracks, Rounds, Prize Pool) */}
                  <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-3 my-3 grid grid-cols-4 divide-x divide-[#e2e8f0] text-center">
                    <div className="px-1">
                      <span className="text-[9px] font-bold text-[#64748b] uppercase tracking-wider block">
                        TEAM SIZE
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-[#6366f1] mt-0.5 block">
                        {h.minTeamSize}-{h.maxTeamSize}
                      </span>
                    </div>

                    <div className="px-1">
                      <span className="text-[9px] font-bold text-[#64748b] uppercase tracking-wider block">
                        TRACKS
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-[#8b5cf6] mt-0.5 block">
                        {h.tracks?.length || 0} Tracks
                      </span>
                    </div>

                    <div className="px-1">
                      <span className="text-[9px] font-bold text-[#64748b] uppercase tracking-wider block">
                        ROUNDS
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-[#059669] mt-0.5 block">
                        {roundsCount}
                      </span>
                    </div>

                    <div className="px-1">
                      <span className="text-[9px] font-bold text-[#64748b] uppercase tracking-wider block">
                        PRIZE POOL
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-[#2563eb] mt-0.5 block">
                        {prizePoolFormatted}
                      </span>
                    </div>
                  </div>

                  {/* Coordinators List */}
                  {coordinators.length > 0 && (
                    <div className="space-y-1 my-3 text-xs text-[#475569] font-medium">
                      {coordinators.map((c, idx) => (
                        <div key={idx} className="flex items-center text-[11px]">
                          <span className="text-[#64748b]">{c.name}:</span>
                          <span className="font-semibold text-[#0f172a] ml-1">{c.contact}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Card Bottom Actions: Manage Hackathon + Delete */}
                <div className="pt-3 border-t border-[#f1f5f9] flex items-center space-x-2 mt-2">
                  <Link
                    href={`/admin/hackathons/${h.id}`}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-white border border-[#e2e8f0] hover:bg-[#f8fafc] hover:border-[#cbd5e1] hover:text-[#2563eb] text-[#334155] text-xs font-semibold rounded-xl transition-all shadow-xs"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#64748b]" />
                    <span>Manage Hackathon</span>
                  </Link>

                  <button
                    onClick={() => {
                      setHackathonToDelete(h);
                      setDeleteError(null);
                      setDeleteModalOpen(true);
                    }}
                    className="inline-flex items-center justify-center gap-1 py-2 px-3 bg-[#fef2f2] border border-[#fecaca] hover:bg-[#fee2e2] text-[#dc2626] text-xs font-semibold rounded-xl transition-all"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#e2e8f0] space-y-4">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-[#fef2f2] text-[#dc2626] border border-[#fecaca]">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#0f172a]">
                  Delete Hackathon Arena
                </h3>
                <p className="text-xs text-[#64748b]">This action permanently removes this event.</p>
              </div>
            </div>

            <div className="p-3.5 bg-[#f8fafc] rounded-xl border border-[#e2e8f0] text-xs space-y-1">
              <span className="font-bold text-[#0f172a] text-sm">{hackathonToDelete.title}</span>
              <p className="text-[#64748b]">
                Slug: <span className="font-mono text-[#0f172a]">/{hackathonToDelete.slug}</span>
              </p>
              <p className="text-[#64748b]">
                Status: <span className="font-semibold text-[#2563eb]">{hackathonToDelete.status}</span>
              </p>
            </div>

            {deleteError && (
              <div className="p-3 bg-[#fef2f2] border border-[#fecaca] rounded-xl text-xs text-[#dc2626] flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                disabled={deleting}
                className="px-4 py-2 text-xs font-semibold text-[#334155] bg-white border border-[#e2e8f0] hover:bg-[#f8fafc] rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleting}
                className="px-4 py-2 text-xs font-bold text-white bg-[#dc2626] hover:bg-[#b91c1c] rounded-xl shadow-xs transition-all disabled:opacity-60 flex items-center space-x-1.5"
              >
                {deleting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Confirm Delete</span>
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
