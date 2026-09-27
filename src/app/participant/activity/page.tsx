'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Activity,
  Trophy,
  Users,
  FolderKanban,
  FileCheck,
  Award,
  QrCode,
  Heart,
  ChevronRight,
  Filter,
  Calendar,
  Clock,
  ArrowRight,
  ExternalLink,
  RefreshCw,
  Sparkles,
  Compass,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface ActivityItem {
  id: string;
  type: 'HACKATHON' | 'TEAM' | 'PROJECT' | 'SUBMISSION' | 'RESULT' | 'CERTIFICATE' | 'ATTENDANCE' | 'COMMUNITY';
  title: string;
  description: string;
  entityType: string;
  entityId: string;
  timestamp: string;
  status?: string;
  hackathonTitle?: string;
  href?: string;
}

interface Pagination {
  total: number;
  page: number;
  totalPages: number;
}

const TYPE_FILTERS = [
  { label: 'All', value: 'ALL' },
  { label: 'Hackathons', value: 'HACKATHON' },
  { label: 'Teams', value: 'TEAM' },
  { label: 'Projects', value: 'PROJECT' },
  { label: 'Submissions', value: 'SUBMISSION' },
  { label: 'Results', value: 'RESULT' },
  { label: 'Certificates', value: 'CERTIFICATE' },
  { label: 'Attendance', value: 'ATTENDANCE' },
  { label: 'Community', value: 'COMMUNITY' },
];

const TIME_FILTERS = [
  { label: 'All Time', value: 'ALL' },
  { label: 'Today', value: 'TODAY' },
  { label: 'This Week', value: 'THIS_WEEK' },
  { label: 'This Month', value: 'THIS_MONTH' },
];

export default function ParticipantActivityPage() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, totalPages: 1 });
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedTime, setSelectedTime] = useState<string>('ALL');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActivities = async (page = 1, type = selectedType, time = selectedTime) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (type !== 'ALL') params.set('type', type);
      if (time !== 'ALL') params.set('dateRange', time);
      params.set('page', page.toString());
      params.set('limit', '20');

      const res = await fetch(`/api/v1/participants/me/activity?${params.toString()}`);
      const json = await res.json();

      if (json.success && json.data) {
        setActivities(json.data.items || []);
        if (json.data.pagination) {
          setPagination(json.data.pagination);
        }
      } else {
        setError(json.error?.message || 'Failed to load activity stream.');
      }
    } catch (err: any) {
      console.error('Failed to fetch participant activity:', err);
      setError('Unable to load activity. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities(1, selectedType, selectedTime);
  }, [selectedType, selectedTime]);

  const formatTimestamp = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);

      const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      if (diffHours < 24 && date.getDate() === now.getDate()) {
        return `Today • ${timeStr}`;
      }

      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      if (date.getDate() === yesterday.getDate() && date.getMonth() === yesterday.getMonth() && date.getFullYear() === yesterday.getFullYear()) {
        return `Yesterday • ${timeStr}`;
      }

      return `${date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })} • ${timeStr}`;
    } catch {
      return isoString;
    }
  };

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'HACKATHON':
        return <Trophy className="w-4 h-4 text-[#2563EB]" />;
      case 'TEAM':
        return <Users className="w-4 h-4 text-indigo-600" />;
      case 'PROJECT':
        return <FolderKanban className="w-4 h-4 text-emerald-600" />;
      case 'SUBMISSION':
        return <FileCheck className="w-4 h-4 text-amber-600" />;
      case 'RESULT':
        return <Award className="w-4 h-4 text-purple-600" />;
      case 'CERTIFICATE':
        return <Award className="w-4 h-4 text-blue-600" />;
      case 'ATTENDANCE':
        return <QrCode className="w-4 h-4 text-cyan-600" />;
      case 'COMMUNITY':
        return <Heart className="w-4 h-4 text-rose-600" />;
      default:
        return <Activity className="w-4 h-4 text-[#2563EB]" />;
    }
  };

  const getActivityBadgeStyle = (type: ActivityItem['type']) => {
    switch (type) {
      case 'HACKATHON':
        return 'bg-blue-50 text-[#2563EB] border-blue-200';
      case 'TEAM':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'PROJECT':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'SUBMISSION':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'RESULT':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'CERTIFICATE':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'ATTENDANCE':
        return 'bg-cyan-50 text-cyan-700 border-cyan-200';
      case 'COMMUNITY':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-5xl">
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-xs font-medium text-[#64748B]">
        <Link href="/" className="hover:text-[#111827] transition-colors">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-[#94A3B8]" />
        <span className="text-[#111827] font-semibold">My Activity</span>
      </nav>

      {/* Page Header Banner */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 sm:p-7 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-[#2563EB] text-xs font-bold uppercase tracking-wider mb-1.5">
            <Activity className="w-4 h-4" />
            <span>Personal Activity Stream</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111827]">
            My Activity
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1 max-w-2xl">
            Track your registrations, team milestones, project iterations, submission snapshots, evaluation outcomes, and verified credentials in real time.
          </p>
        </div>

        <button
          onClick={() => fetchActivities(pagination.page, selectedType, selectedTime)}
          disabled={loading}
          className="self-start sm:self-auto inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] hover:bg-[#F1F5F9] text-xs font-semibold text-[#334155] transition"
          title="Refresh Activity Stream"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter Rails */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-sm space-y-3">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          <span className="text-xs font-semibold text-[#64748B] flex items-center gap-1.5 mr-1 shrink-0">
            <Filter className="w-3.5 h-3.5 text-[#94A3B8]" />
            Category:
          </span>
          {TYPE_FILTERS.map((f) => {
            const active = selectedType === f.value;
            return (
              <button
                key={f.value}
                onClick={() => setSelectedType(f.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition shrink-0 ${
                  active
                    ? 'bg-[#2563EB] text-white shadow-sm'
                    : 'bg-[#F8FAFC] text-[#475569] hover:bg-[#F1F5F9] border border-[#E2E8F0]'
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        {/* Time Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-slate-100 no-scrollbar">
          <span className="text-xs font-semibold text-[#64748B] flex items-center gap-1.5 mr-1 shrink-0">
            <Calendar className="w-3.5 h-3.5 text-[#94A3B8]" />
            Timeframe:
          </span>
          {TIME_FILTERS.map((t) => {
            const active = selectedTime === t.value;
            return (
              <button
                key={t.value}
                onClick={() => setSelectedTime(t.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition shrink-0 ${
                  active
                    ? 'bg-[#1E293B] text-white shadow-sm'
                    : 'bg-[#F8FAFC] text-[#475569] hover:bg-[#F1F5F9] border border-[#E2E8F0]'
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Timeline Section */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm">
        {loading ? (
          /* Loading Skeleton */
          <div className="space-y-6 py-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-start space-x-4 animate-pulse">
                <div className="w-10 h-10 rounded-xl bg-slate-100 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-100 rounded w-1/4" />
                  <div className="h-3 bg-slate-100 rounded w-3/4" />
                  <div className="h-3 bg-slate-100 rounded w-1/6" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          /* Error State */
          <div className="text-center py-12">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#111827]">Unable to load activity stream</h3>
            <p className="text-xs text-[#64748B] mt-1 max-w-sm mx-auto">{error}</p>
            <button
              onClick={() => fetchActivities(1, selectedType, selectedTime)}
              className="mt-4 px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold rounded-xl transition"
            >
              Retry
            </button>
          </div>
        ) : activities.length === 0 ? (
          /* Empty State */
          <div className="text-center py-16">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#2563EB] flex items-center justify-center mx-auto mb-3.5 border border-blue-100">
              <Compass className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-[#111827]">No activity recorded yet</h3>
            <p className="text-xs text-[#64748B] max-w-sm mx-auto mt-1 leading-relaxed">
              Your hackathon registrations, team formations, project updates, and verified credentials will appear in this chronological timeline.
            </p>
            <div className="mt-5">
              <Link
                href="/hackathons"
                className="inline-flex items-center space-x-2 px-5 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold rounded-full shadow-sm transition"
              >
                <span>Explore Competitions</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ) : (
          /* Clean Timeline Feed */
          <div className="relative pl-6 sm:pl-8 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-[#E2E8F0]">
            <div className="space-y-6">
              {activities.map((item) => (
                <div key={item.id} className="relative group">
                  {/* Timeline Dot Node */}
                  <div className="absolute -left-6 sm:-left-8 top-1.5 w-6 h-6 rounded-full bg-white border-2 border-[#2563EB] flex items-center justify-center shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-[#2563EB]" />
                  </div>

                  {/* Activity Card */}
                  <div className="p-4 sm:p-5 rounded-xl border border-[#E2E8F0] hover:border-[#CBD5E1] bg-[#F8FAFC]/50 hover:bg-[#F8FAFC] transition duration-150 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-start space-x-3.5">
                      <div className="w-10 h-10 rounded-xl bg-white border border-[#E2E8F0] flex items-center justify-center shrink-0 shadow-xs">
                        {getActivityIcon(item.type)}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getActivityBadgeStyle(item.type)}`}>
                            {item.type}
                          </span>
                          {item.status && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                              {item.status}
                            </span>
                          )}
                          <h4 className="text-sm font-bold text-[#111827]">{item.title}</h4>
                        </div>

                        <p className="text-xs text-[#475569] leading-relaxed">
                          {item.description}
                        </p>

                        <div className="flex items-center gap-3 text-[11px] text-[#94A3B8] pt-0.5 flex-wrap">
                          <span className="flex items-center gap-1 font-medium text-[#64748B]">
                            <Clock className="w-3 h-3 text-[#94A3B8]" />
                            {formatTimestamp(item.timestamp)}
                          </span>
                          {item.hackathonTitle && (
                            <span className="flex items-center gap-1 text-[#2563EB] font-medium">
                              &bull; {item.hackathonTitle}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Quick Link Action */}
                    {item.href && (
                      <Link
                        href={item.href}
                        className="self-start sm:self-center shrink-0 inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#2563EB] bg-blue-50/80 hover:bg-blue-100 hover:text-[#1D4ED8] transition"
                      >
                        <span>View</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pagination Controls */}
        {pagination.totalPages > 1 && (
          <div className="mt-8 pt-4 border-t border-[#E2E8F0] flex items-center justify-between">
            <span className="text-xs text-[#64748B]">
              Page <span className="font-bold text-[#111827]">{pagination.page}</span> of{' '}
              <span className="font-bold text-[#111827]">{pagination.totalPages}</span>
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => fetchActivities(pagination.page - 1)}
                disabled={pagination.page <= 1 || loading}
                className="px-3 py-1.5 rounded-lg border border-[#E2E8F0] text-xs font-semibold text-[#334155] hover:bg-[#F8FAFC] disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Previous
              </button>
              <button
                onClick={() => fetchActivities(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages || loading}
                className="px-3 py-1.5 rounded-lg border border-[#E2E8F0] text-xs font-semibold text-[#334155] hover:bg-[#F8FAFC] disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
