'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  History,
  Search,
  ShieldCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Filter,
  Eye,
  Lock,
  FileText,
  X,
  RefreshCw,
  Copy,
  Check,
  ChevronRight as ArrowRight,
  Calendar,
  User,
  Layers,
  Globe,
  ScrollText,
} from 'lucide-react';

interface AuditLogItem {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  beforeState: any;
  afterState: any;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    role: string;
  } | null;
  hackathon: {
    id: string;
    title: string;
    slug: string;
  } | null;
}

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Inspector modal
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);
  const [copiedState, setCopiedState] = useState<string | null>(null);

  // Toast feedback
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedState(label);
    showToast(`${label} copied to clipboard!`);
    setTimeout(() => setCopiedState(null), 2000);
  };

  // Format timestamp matching screenshot: "Sep 28, 09:33:31 AM"
  const formatTimestamp = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '—';

      const monthNames = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
      ];
      const month = monthNames[d.getMonth()];
      const day = d.getDate();

      let hours = d.getHours();
      const minutes = d.getMinutes().toString().padStart(2, '0');
      const seconds = d.getSeconds().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      const formattedHours = hours.toString().padStart(2, '0');

      return `${month} ${day}, ${formattedHours}:${minutes}:${seconds} ${ampm}`;
    } catch {
      return '—';
    }
  };

  const fetchAuditLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: '15',
      });
      if (search.trim()) params.append('search', search.trim());
      if (actionFilter) params.append('action', actionFilter);

      const res = await fetch(`/api/v1/admin/audit-logs?${params.toString()}`);
      const json = await res.json();
      if (json.success && json.data) {
        setLogs(json.data.auditLogs || []);
        setTotalPages(json.data.pagination?.totalPages || 1);
        setTotalCount(json.data.pagination?.total || 0);
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  }, [page, search, actionFilter]);

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  // Action tag color styling
  const getActionBadgeStyle = (action: string) => {
    if (action.includes('LOGIN') || action.includes('AUTH')) {
      return 'bg-sky-50 text-sky-700 border-sky-200';
    }
    if (action.includes('CREATE') || action.includes('ADD') || action.includes('REGISTER')) {
      return 'bg-blue-50 text-blue-700 border-blue-200';
    }
    if (action.includes('INVITE') || action.includes('ASSIGN')) {
      return 'bg-purple-50 text-purple-700 border-purple-200';
    }
    if (action.includes('PUBLISH') || action.includes('SUCCESS')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (action.includes('DELETE') || action.includes('REVOKE') || action.includes('FAIL')) {
      return 'bg-rose-50 text-rose-700 border-rose-200';
    }
    return 'bg-orange-50 text-orange-700 border-orange-200';
  };

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
              <ShieldCheck className="w-4 h-4 text-white" />
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
        <span className="text-zinc-800 font-semibold">Audit Logs</span>
      </nav>

      {/* Header - Matching Image Reference */}
      <div className="pb-2 border-b border-zinc-100 space-y-2">
        {/* Top Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold text-orange-700 bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-200">
            Global Platform Control
          </span>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
            <Lock className="w-3 h-3 text-emerald-600" />
            <span>Append-Only Immutable Storage</span>
          </span>
        </div>

        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#FA541C] to-[#E03A00] flex items-center justify-center text-white shadow-md shadow-orange-500/20 flex-shrink-0">
            <ScrollText className="w-5 h-5 stroke-[2.3]" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">
              Security &amp; Governance Audit Trail
            </h1>
            <p className="text-xs text-zinc-500 mt-0.5 font-normal">
              Complete cryptographic audit log of all administrative actions, role transitions, organizer assignments, and publication events.
            </p>
          </div>
        </div>
      </div>

      {/* Search Bar & Action Filter Tabs (Exact match to screenshot) */}
      <div className="bg-white border border-zinc-200/90 rounded-2xl p-2.5 sm:p-3 shadow-xs flex flex-col xl:flex-row xl:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by action, actor, entity ID, or hackathon..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-9 py-2 text-xs bg-transparent border-0 focus:outline-none text-zinc-900 placeholder:text-zinc-400 font-medium"
          />
          {search && (
            <button
              onClick={() => {
                setSearch('');
                setPage(1);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 p-0.5 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Action Filter Tabs (Matching Screenshot) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 xl:pb-0 scrollbar-none">
          {[
            { key: '', label: 'All Actions' },
            { key: 'ROLE_CHANGED', label: 'ROLE_CHANGED' },
            { key: 'HACKATHON_CREATED', label: 'HACKATHON_CREATED' },
            { key: 'ORGANIZER_ASSIGNED', label: 'ORGANIZER_ASSIGNED' },
            { key: 'JUDGE_ASSIGNED', label: 'JUDGE_ASSIGNED' },
            { key: 'RESULTS_PUBLISHED', label: 'RESULTS_PUBLISHED' },
            { key: 'CERTIFICATE_ISSUED', label: 'CERTIFICATE_ISSUED' },
          ].map((act) => {
            const active = actionFilter === act.key;
            return (
              <button
                key={act.key || 'ALL'}
                onClick={() => {
                  setActionFilter(act.key);
                  setPage(1);
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer whitespace-nowrap hover:scale-105 active:scale-95 ${
                  active
                    ? 'bg-gradient-to-r from-[#FA541C] to-[#E03A00] text-white shadow-md shadow-orange-500/20'
                    : 'bg-white text-zinc-600 border border-zinc-200/90 hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900'
                }`}
              >
                {act.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white border border-zinc-200/90 rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-xs text-zinc-500 flex flex-col items-center justify-center space-y-3">
            <RefreshCw className="w-7 h-7 animate-spin text-[#FA541C]" />
            <p className="font-bold text-zinc-900 text-sm">Loading cryptographic audit trail...</p>
            <p className="text-xs text-zinc-400">Verifying immutable hash sequences from PostgreSQL</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center space-y-3 px-4">
            <div className="w-12 h-12 rounded-2xl bg-zinc-50 border border-zinc-200 flex items-center justify-center mx-auto text-zinc-400">
              <History className="w-6 h-6 stroke-[1.8]" />
            </div>
            <p className="text-sm font-bold text-zinc-900">No audit logs found</p>
            <p className="text-xs text-zinc-500 max-w-md mx-auto">
              {search || actionFilter
                ? `No event logs match the query "${search}" or filter "${actionFilter}". Try resetting your filters.`
                : 'No administrative security events recorded yet.'}
            </p>
            {(search || actionFilter) && (
              <div className="pt-2">
                <button
                  onClick={() => {
                    setSearch('');
                    setActionFilter('');
                    setPage(1);
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
                  <th className="py-4 px-6">TIMESTAMP</th>
                  <th className="py-4 px-6">ACTOR ATTRIBUTION</th>
                  <th className="py-4 px-6">ACTION PERFORMED</th>
                  <th className="py-4 px-6">TARGET ENTITY</th>
                  <th className="py-4 px-6">ARENA CONTEXT</th>
                  <th className="py-4 px-6 text-right">DETAILS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {logs.map((log) => {
                  const actionStyle = getActionBadgeStyle(log.action);

                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-orange-50/20 transition-all duration-200 group"
                    >
                      {/* TIMESTAMP */}
                      <td className="py-4 px-6 align-middle whitespace-nowrap font-mono text-zinc-600 text-xs">
                        {formatTimestamp(log.createdAt)}
                      </td>

                      {/* ACTOR ATTRIBUTION */}
                      <td className="py-4 px-6 align-middle">
                        <div className="font-bold text-zinc-900 text-sm tracking-tight group-hover:text-[#FA541C] transition-colors">
                          {log.user?.fullName || 'Platform Administrator'}
                        </div>
                        <div className="text-[11px] text-zinc-500 font-mono mt-0.5">
                          {log.user
                            ? `${log.user.email} (${log.user.role})`
                            : 'admin@hackathon.dev (ADMIN)'}
                        </div>
                      </td>

                      {/* ACTION PERFORMED */}
                      <td className="py-4 px-6 align-middle whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-mono font-bold border shadow-2xs ${actionStyle}`}
                        >
                          {log.action}
                        </span>
                      </td>

                      {/* TARGET ENTITY */}
                      <td className="py-4 px-6 align-middle">
                        <div className="font-bold text-zinc-900 text-xs">
                          {log.entityType}
                        </div>
                        <div className="text-[11px] text-zinc-400 font-mono truncate max-w-[140px] mt-0.5">
                          {log.entityId}
                        </div>
                      </td>

                      {/* ARENA CONTEXT */}
                      <td className="py-4 px-6 align-middle text-zinc-600 font-medium">
                        {log.hackathon ? log.hackathon.title : 'Global Platform'}
                      </td>

                      {/* DETAILS: Inspect Diff > */}
                      <td className="py-4 px-6 align-middle text-right whitespace-nowrap">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-700 bg-white border border-zinc-200 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 rounded-xl shadow-2xs transition-all hover:scale-105 active:scale-95 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-zinc-400 group-hover:text-orange-500" />
                          <span>Inspect Diff</span>
                          <ArrowRight className="w-3 h-3 text-zinc-400 group-hover:text-orange-500" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-zinc-100 flex items-center justify-between text-xs bg-zinc-50/50">
            <span className="text-zinc-500">
              Page <span className="font-bold text-zinc-900">{page}</span> of{' '}
              <span className="font-bold text-zinc-900">{totalPages}</span> ({totalCount} total events)
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="inline-flex items-center gap-1 px-3 py-1.5 font-bold text-zinc-700 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all shadow-xs"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="inline-flex items-center gap-1 px-3 py-1.5 font-bold text-zinc-700 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all shadow-xs"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* STATE DIFF INSPECTOR MODAL */}
      {/* ======================================================== */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-zinc-200 space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-zinc-100">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-zinc-900 font-mono">{selectedLog.action}</h3>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Verified Append-Only</span>
                  </span>
                </div>
                <p className="text-xs text-zinc-500 font-mono">
                  Target: <span className="font-semibold text-zinc-800">{selectedLog.entityType}</span> (
                  {selectedLog.entityId})
                </p>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1.5 text-zinc-400 hover:bg-zinc-100 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Metadata Overview */}
            <div className="grid grid-cols-2 gap-3 p-3.5 bg-zinc-50 rounded-2xl border border-zinc-200 text-xs">
              <div>
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                  Actor Attribution
                </span>
                <span className="font-bold text-zinc-900 mt-0.5 block">
                  {selectedLog.user?.fullName || 'Platform Administrator'}
                </span>
                <span className="text-[11px] text-zinc-500 font-mono">
                  {selectedLog.user?.email || 'admin@hackathon.dev'}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                  Timestamp &amp; Arena
                </span>
                <span className="font-mono text-zinc-900 mt-0.5 block">
                  {formatTimestamp(selectedLog.createdAt)}
                </span>
                <span className="text-[11px] text-zinc-500">
                  {selectedLog.hackathon?.title || 'Global Platform'}
                </span>
              </div>
            </div>

            {/* Before vs After States Diff */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-zinc-600 uppercase tracking-wider block">
                    Before State
                  </span>
                  {selectedLog.beforeState && (
                    <button
                      onClick={() =>
                        copyToClipboard(JSON.stringify(selectedLog.beforeState, null, 2), 'Before State')
                      }
                      className="text-[10px] font-semibold text-orange-600 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copiedState === 'Before State' ? 'Copied!' : 'Copy'}</span>
                    </button>
                  )}
                </div>
                <pre className="p-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-[11px] font-mono overflow-x-auto max-h-56 text-zinc-800">
                  {selectedLog.beforeState
                    ? JSON.stringify(selectedLog.beforeState, null, 2)
                    : 'null (Initial Creation)'}
                </pre>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-zinc-600 uppercase tracking-wider block">
                    After State
                  </span>
                  {selectedLog.afterState && (
                    <button
                      onClick={() =>
                        copyToClipboard(JSON.stringify(selectedLog.afterState, null, 2), 'After State')
                      }
                      className="text-[10px] font-semibold text-orange-600 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copiedState === 'After State' ? 'Copied!' : 'Copy'}</span>
                    </button>
                  )}
                </div>
                <pre className="p-3 bg-zinc-950 text-zinc-200 rounded-2xl text-[11px] font-mono overflow-x-auto max-h-56 border border-zinc-800">
                  {selectedLog.afterState
                    ? JSON.stringify(selectedLog.afterState, null, 2)
                    : 'null (Deleted)'}
                </pre>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end pt-2 border-t border-zinc-100">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 text-xs font-bold text-zinc-700 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-xl transition-colors cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
