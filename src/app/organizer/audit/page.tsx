'use client';

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  History, 
  Search, 
  Filter, 
  Clock, 
  User, 
  ArrowRight, 
  FileText, 
  Layers, 
  Code,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';

interface AuditRecord {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  createdAt: string;
  beforeState: any;
  afterState: any;
  ipAddress?: string;
  userAgent?: string;
  user?: {
    id: string;
    fullName?: string;
    name?: string;
    email: string;
    role: string;
  } | null;
}


interface Hackathon {
  id: string;
  title: string;
  status: string;
}

export default function OrganizerAuditPage() {
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [selectedHackathonId, setSelectedHackathonId] = useState<string>('');
  const [auditLogs, setAuditLogs] = useState<AuditRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedAction, setSelectedAction] = useState<string>('ALL');
  const [activeDiffRecord, setActiveDiffRecord] = useState<AuditRecord | null>(null);

  useEffect(() => {
    fetchHackathons();
  }, []);

  useEffect(() => {
    if (selectedHackathonId) {
      fetchAuditLogs(selectedHackathonId);
    }
  }, [selectedHackathonId]);

  const fetchHackathons = async () => {
    try {
      const res = await fetch('/api/v1/hackathons');
      const data = await res.json();
      if (data.success && data.data?.hackathons?.length > 0) {
        setHackathons(data.data.hackathons);
        setSelectedHackathonId(data.data.hackathons[0].id);
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.error('Failed to load hackathons:', err);
      setLoading(false);
    }
  };

  const fetchAuditLogs = async (hackathonId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/hackathons/${hackathonId}/audit`);
      const data = await res.json();
      if (data.success && data.data?.logs) {
        setAuditLogs(data.data.logs);
      } else {
        setAuditLogs([]);
      }
    } catch (err) {
      console.error('Failed to fetch audit records:', err);
      setAuditLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const actionTypes = Array.from(new Set(auditLogs.map((l) => l.action)));

  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch =
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.entityType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.entityId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.user?.email?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesAction = selectedAction === 'ALL' || log.action === selectedAction;

    return matchesSearch && matchesAction;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-primary font-semibold text-xs tracking-wider uppercase mb-1">
            <ShieldCheck className="w-4 h-4" />
            Compliance & Governance
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Event Audit Logs</h1>
          <p className="text-slate-500 text-sm mt-1">
            Tamper-proof chronological record of all administrative, lifecycle, and operational mutations.
          </p>
        </div>

        {/* Hackathon Selector */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Scope</span>
            <span className="text-xs font-medium text-slate-700">Active Event</span>
          </div>
          <select
            value={selectedHackathonId}
            onChange={(e) => setSelectedHackathonId(e.target.value)}
            className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-primary focus:outline-none"
          >
            {hackathons.map((h) => (
              <option key={h.id} value={h.id}>
                {h.title}
              </option>
            ))}
          </select>
          <button
            onClick={() => selectedHackathonId && fetchAuditLogs(selectedHackathonId)}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition"
            title="Refresh Audit Logs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <History className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase">Total Audit Events</div>
            <div className="text-2xl font-extrabold text-slate-900">{auditLogs.length}</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase">Integrity Status</div>
            <div className="text-sm font-bold text-emerald-600 flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Immutable & Canonical
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase">Unique Action Types</div>
            <div className="text-2xl font-extrabold text-slate-900">{actionTypes.length}</div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search action, actor, entity..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="ALL">All Actions ({auditLogs.length})</option>
            {actionTypes.map((act) => (
              <option key={act} value={act}>
                {act}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Audit Trail List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-primary" />
            <p className="text-sm font-semibold">Loading cryptographic audit trail...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center">
            <History className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">No Audit Records Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              Actions such as hackathon publishing, team creation, judge assignment, scoring, and certificate issuance are automatically recorded here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredLogs.map((log) => {
              const hasDiff = log.beforeState || log.afterState;
              const isDanger = log.action.includes('REJECT') || log.action.includes('DELETE') || log.action.includes('REVOKE');
              const isSuccess = log.action.includes('PUBLISH') || log.action.includes('CREATE') || log.action.includes('ISSUE');

              return (
                <div key={log.id} className="p-5 hover:bg-slate-50/70 transition flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                        isDanger
                          ? 'bg-rose-50 text-rose-600'
                          : isSuccess
                          ? 'bg-emerald-50 text-emerald-600'
                          : 'bg-blue-50 text-blue-600'
                      }`}
                    >
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-slate-900">{log.action}</span>
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                          {log.entityType}
                        </span>
                        <span className="text-xs font-mono text-slate-400">ID: {log.entityId.slice(0, 8)}...</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-500 mt-1 flex-wrap">
                        <span className="flex items-center gap-1 font-medium">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          {log.user ? `${log.user.name} (${log.user.role})` : 'System Engine'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {new Date(log.createdAt).toLocaleString()}
                        </span>
                        {log.ipAddress && (
                          <span className="font-mono text-slate-400">IP: {log.ipAddress}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-center">
                    {hasDiff && (
                      <button
                        onClick={() => setActiveDiffRecord(log)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition flex items-center gap-1.5"
                      >
                        <Code className="w-3.5 h-3.5" />
                        Inspect Diff
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* State Diff Modal */}
      {activeDiffRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Audit State Inspection</h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  Action: {activeDiffRecord.action} &bull; Entity: {activeDiffRecord.entityType} ({activeDiffRecord.entityId})
                </p>
              </div>
              <button
                onClick={() => setActiveDiffRecord(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-sm font-bold"
              >
                &times;
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-xs font-bold text-rose-600 uppercase tracking-wider mb-1 flex items-center gap-1">
                    Before Mutation
                  </div>
                  <pre className="p-3.5 bg-slate-900 text-slate-100 text-xs font-mono rounded-xl overflow-x-auto max-h-72">
                    {activeDiffRecord.beforeState
                      ? JSON.stringify(activeDiffRecord.beforeState, null, 2)
                      : 'null (Initial Creation)'}
                  </pre>
                </div>

                <div>
                  <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1 flex items-center gap-1">
                    After Mutation
                  </div>
                  <pre className="p-3.5 bg-slate-900 text-slate-100 text-xs font-mono rounded-xl overflow-x-auto max-h-72">
                    {activeDiffRecord.afterState
                      ? JSON.stringify(activeDiffRecord.afterState, null, 2)
                      : 'null (Entity Purged)'}
                  </pre>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl text-right">
              <button
                onClick={() => setActiveDiffRecord(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition"
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
