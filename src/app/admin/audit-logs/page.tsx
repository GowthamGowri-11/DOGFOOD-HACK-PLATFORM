'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#E2E8F0] gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-bold text-[#DC2626] bg-[#FEF2F2] px-2.5 py-0.5 rounded-full border border-[#FECACA]">
              Global Platform Control
            </span>
            <span className="text-[11px] font-semibold text-[#059669] bg-[#ECFDF5] px-2.5 py-0.5 rounded-full border border-[#A7F3D0] flex items-center">
              <Lock className="w-3 h-3 mr-1" /> Append-Only Immutable Storage
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#111827] mt-1 tracking-tight">
            Security & Governance Audit Trail
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
            Complete cryptographic audit log of all administrative actions, role transitions, organizer assignments, and publication events.
          </p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-[18px] p-4 shadow-card">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <input
              type="text"
              placeholder="Search by action, actor, entity ID, or hackathon..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-[11px] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all placeholder:text-[#94A3B8]"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            {['', 'ROLE_CHANGED', 'HACKATHON_CREATED', 'ORGANIZER_ASSIGNED', 'JUDGE_ASSIGNED', 'RESULTS_PUBLISHED', 'CERTIFICATE_ISSUED'].map((act) => (
              <button
                key={act || 'ALL'}
                onClick={() => {
                  setActionFilter(act);
                  setPage(1);
                }}
                className={`px-3 py-1.5 text-xs rounded-full border transition-all whitespace-nowrap ${
                  actionFilter === act
                    ? 'bg-[#002B49] text-white border-[#002B49] font-semibold'
                    : 'bg-[#F8FAFC] text-[#64748B] border-[#E2E8F0] hover:bg-[#F1F5F9]'
                }`}
              >
                {act || 'All Actions'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-[18px] overflow-hidden shadow-card">
        {loading ? (
          <div className="p-12 text-center text-xs text-[#64748B]">
            Loading audit trails from immutable storage...
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center">
            <History className="w-8 h-8 text-[#CBD5E1] mx-auto mb-2" />
            <p className="text-sm font-semibold text-[#111827]">No audit logs found</p>
            <p className="text-xs text-[#64748B] mt-0.5">Adjust filter criteria to view historical records.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#F8FAFC] text-[#64748B] font-bold uppercase tracking-wider border-b border-[#E2E8F0]">
                  <th className="py-3 px-5">Timestamp</th>
                  <th className="py-3 px-5">Actor Attribution</th>
                  <th className="py-3 px-5">Action Performed</th>
                  <th className="py-3 px-5">Target Entity</th>
                  <th className="py-3 px-5">Arena Context</th>
                  <th className="py-3 px-5 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="py-3.5 px-5 font-mono text-[#64748B] whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString([], {
                        month: 'short',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="font-semibold text-[#111827]">
                        {log.user?.fullName || 'System Automated Worker'}
                      </div>
                      <div className="text-[11px] text-[#64748B] font-mono">
                        {log.user ? `${log.user.email} (${log.user.role})` : 'system@platform.internal'}
                      </div>
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE]">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="font-medium text-[#111827]">{log.entityType}</div>
                      <div className="text-[10px] text-[#64748B] font-mono truncate max-w-[120px]">
                        {log.entityId}
                      </div>
                    </td>
                    <td className="py-3.5 px-5 text-[#64748B]">
                      {log.hackathon ? log.hackathon.title : 'Global Platform'}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="px-2.5 py-1 text-[11px] font-semibold text-[#002B49] bg-[#F1F5F9] hover:bg-[#E2E8F0] rounded-[7px] transition-colors"
                      >
                        Inspect Diff
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-[#E2E8F0] flex items-center justify-between">
            <span className="text-xs text-[#64748B]">
              Page {page} of {totalPages} ({totalCount} total events)
            </span>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* State Diff Inspector Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-[#FFFFFF] rounded-[20px] max-w-2xl w-full p-6 shadow-2xl border border-[#E2E8F0] space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div>
                <h3 className="text-base font-bold text-[#111827]">{selectedLog.action}</h3>
                <p className="text-xs text-[#64748B]">
                  Target: {selectedLog.entityType} ({selectedLog.entityId})
                </p>
              </div>
              <span className="inline-flex items-center text-[10px] font-semibold text-[#059669] bg-[#ECFDF5] px-2 py-0.5 rounded-full border border-[#A7F3D0]">
                <CheckCircle2 className="w-3 h-3 mr-1" /> Verified Append-Only
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider block mb-1">
                  Before State
                </span>
                <pre className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[10px] text-[11px] font-mono overflow-x-auto max-h-56">
                  {selectedLog.beforeState ? JSON.stringify(selectedLog.beforeState, null, 2) : 'null (Created or Initial)'}
                </pre>
              </div>

              <div>
                <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider block mb-1">
                  After State
                </span>
                <pre className="p-3 bg-[#0F172A] text-[#E2E8F0] rounded-[10px] text-[11px] font-mono overflow-x-auto max-h-56">
                  {selectedLog.afterState ? JSON.stringify(selectedLog.afterState, null, 2) : 'null (Deleted)'}
                </pre>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button size="sm" onClick={() => setSelectedLog(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
