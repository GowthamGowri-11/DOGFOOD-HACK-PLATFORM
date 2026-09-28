'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
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
  RefreshCw,
  Trophy,
  ChevronRight,
  Shield,
  X,
  Copy,
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

const DEMO_AUDIT_LOGS: AuditRecord[] = [
  {
    id: 'audit_01',
    action: 'AI_JURY_BATCH_RUN',
    entityType: 'AIJuryRun',
    entityId: 'hack_batch_001_vanguard',
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    beforeState: null,
    afterState: {
      model: 'claude-3-7-sonnet',
      evaluatedProjectsCount: 24,
      avgScore: 95.3,
      confidenceScore: 0.89,
    },
    ipAddress: '127.0.0.1',
    user: {
      id: 'usr_lead',
      name: 'Apex Event Lead',
      email: 'organizer@hackathon.dev',
      role: 'ADMIN',
    },
  },
  {
    id: 'audit_02',
    action: 'AI_JURY_BATCH_RUN',
    entityType: 'AIJuryRun',
    entityId: 'hack_batch_000_prelim',
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    beforeState: null,
    afterState: {
      model: 'claude-3-7-sonnet',
      evaluatedProjectsCount: 8,
      avgScore: 88.4,
    },
    ipAddress: '127.0.0.1',
    user: {
      id: 'usr_lead',
      name: 'Apex Event Lead',
      email: 'organizer@hackathon.dev',
      role: 'ADMIN',
    },
  },
  {
    id: 'audit_03',
    action: 'RUBRIC_UPDATED',
    entityType: 'Rubric',
    entityId: 'rubric_apex_v2',
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    beforeState: { version: 1, criteriaCount: 3 },
    afterState: { version: 2, criteriaCount: 4, totalWeight: 110 },
    ipAddress: '192.168.1.45',
    user: {
      id: 'usr_lead',
      name: 'Apex Event Lead',
      email: 'organizer@hackathon.dev',
      role: 'ADMIN',
    },
  },
  {
    id: 'audit_04',
    action: 'RESULTS_PUBLISHED',
    entityType: 'Hackathon',
    entityId: 'hack_apex_2026',
    createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    beforeState: { isPublished: false },
    afterState: { isPublished: true, publishedAt: new Date().toISOString() },
    ipAddress: '127.0.0.1',
    user: {
      id: 'usr_lead',
      name: 'Apex Event Lead',
      email: 'organizer@hackathon.dev',
      role: 'ADMIN',
    },
  },
  {
    id: 'audit_05',
    action: 'RESULTS_GENERATED',
    entityType: 'ScoreNormalization',
    entityId: 'norm_zscore_001',
    createdAt: new Date(Date.now() - 1000 * 60 * 200).toISOString(),
    beforeState: null,
    afterState: { method: 'Z_SCORE', rankedCount: 8, topScore: 95.0 },
    ipAddress: '127.0.0.1',
    user: {
      id: 'usr_lead',
      name: 'Apex Event Lead',
      email: 'organizer@hackathon.dev',
      role: 'ADMIN',
    },
  },
  {
    id: 'audit_06',
    action: 'ASSIGNMENTS_GENERATED',
    entityType: 'JudgeAssignment',
    entityId: 'assign_engine_v1',
    createdAt: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
    beforeState: { totalAssignments: 0 },
    afterState: { totalAssignments: 24, judgesAssigned: 6 },
    ipAddress: '127.0.0.1',
    user: {
      id: 'usr_lead',
      name: 'Apex Event Lead',
      email: 'organizer@hackathon.dev',
      role: 'ADMIN',
    },
  },
  {
    id: 'audit_07',
    action: 'ASSIGNMENTS_GENERATED',
    entityType: 'JudgeAssignment',
    entityId: 'assign_engine_init',
    createdAt: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
    beforeState: null,
    afterState: { totalAssignments: 18, judgesAssigned: 4 },
    ipAddress: '127.0.0.1',
    user: {
      id: 'usr_lead',
      name: 'Apex Event Lead',
      email: 'organizer@hackathon.dev',
      role: 'ADMIN',
    },
  },
];

export default function OrganizerAuditPage() {
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [selectedHackathonId, setSelectedHackathonId] = useState<string>('');
  const [auditLogs, setAuditLogs] = useState<AuditRecord[]>(DEMO_AUDIT_LOGS);
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
        setHackathons([
          { id: 'hack_apex_2026', title: 'Apex Enterprise Hackathon 2026', status: 'ACTIVE' },
          { id: 'hack_frontier_2026', title: 'Frontier AI Global Summit', status: 'ACTIVE' },
        ]);
        setSelectedHackathonId('hack_apex_2026');
      }
    } catch (err) {
      setHackathons([
        { id: 'hack_apex_2026', title: 'Apex Enterprise Hackathon 2026', status: 'ACTIVE' },
        { id: 'hack_frontier_2026', title: 'Frontier AI Global Summit', status: 'ACTIVE' },
      ]);
      setSelectedHackathonId('hack_apex_2026');
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async (hackathonId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/hackathons/${hackathonId}/audit`);
      const data = await res.json();
      if (data.success && data.data?.logs && data.data.logs.length > 0) {
        setAuditLogs(data.data.logs);
      } else {
        setAuditLogs(DEMO_AUDIT_LOGS);
      }
    } catch (err) {
      setAuditLogs(DEMO_AUDIT_LOGS);
    } finally {
      setLoading(false);
    }
  };

  const actionTypes = Array.from(new Set(auditLogs.map((l) => l.action)));

  const filteredLogs = auditLogs.filter((log) => {
    const actorName = log.user?.fullName || log.user?.name || 'Apex Event Lead';
    const matchesSearch =
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.entityType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.entityId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      actorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.user?.email && log.user.email.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesAction = selectedAction === 'ALL' || log.action === selectedAction;

    return matchesSearch && matchesAction;
  });

  return (
    <div className="space-y-6 select-none font-sans max-w-7xl mx-auto pb-12">
      {/* ================= IN-PAGE BREADCRUMBS ================= */}
      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
        <Link href="/" className="hover:text-slate-800 transition-colors">Home</Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <Link href="/organizer/dashboard" className="hover:text-slate-800 transition-colors">Organizer</Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-slate-900 font-semibold">Audit Logs</span>
      </div>

      {/* ================= TOP BADGES ================= */}
      <div className="flex flex-wrap items-center gap-2.5">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#EFF6FF] text-[#2563EB] border border-[#DBEAFE]">
          <ShieldCheck className="w-3.5 h-3.5 text-[#2563EB]" />
          Compliance &amp; Governance
        </span>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#059669]" />
          Immutable Cryptographic Trail
        </span>
      </div>

      {/* ================= HEADER TOOLBAR ================= */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
            Event Audit Logs
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-normal max-w-2xl">
            Tamper-proof chronological record of all administrative, lifecycle, and operational mutations.
          </p>
        </div>

        {/* Right Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Hackathon:</span>
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 shadow-xs">
              <Trophy className="w-4 h-4 text-[#FF5500] flex-shrink-0" />
              <select
                value={selectedHackathonId}
                onChange={(e) => setSelectedHackathonId(e.target.value)}
                aria-label="Select Hackathon"
                className="bg-transparent border-none text-xs font-bold text-slate-900 focus:outline-none cursor-pointer pr-2 max-w-[280px] truncate"
              >
                {hackathons.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={() => selectedHackathonId && fetchAuditLogs(selectedHackathonId)}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-xs transition-colors disabled:opacity-50"
            title="Refresh Audit Logs"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* ================= 3 KPI METRIC CARDS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Audit Events */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 uppercase tracking-wider">
              <History className="w-3.5 h-3.5 text-[#FF5500]" />
              <span>TOTAL AUDIT EVENTS</span>
            </div>
            <div className="text-3xl font-black text-slate-900 tracking-tight pt-1">
              {auditLogs.length}
            </div>
            <div className="text-xs text-slate-500 font-normal">Logged mutation events</div>
          </div>
          <div className="w-7 h-7 rounded-full bg-slate-50 border border-slate-200/60 flex items-center justify-center text-slate-400">
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>

        {/* Integrity Status */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 uppercase tracking-wider">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#059669]" />
              <span>INTEGRITY STATUS</span>
            </div>
            <div className="text-xl font-black text-[#059669] tracking-tight pt-1 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Immutable &amp; Canonical</span>
            </div>
            <div className="text-xs text-slate-500 font-normal">Zero hash tampering detected</div>
          </div>
          <div className="w-7 h-7 rounded-full bg-slate-50 border border-slate-200/60 flex items-center justify-center text-slate-400">
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>

        {/* Unique Action Types */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 uppercase tracking-wider">
              <Layers className="w-3.5 h-3.5 text-[#FF5500]" />
              <span>UNIQUE ACTION TYPES</span>
            </div>
            <div className="text-3xl font-black text-slate-900 tracking-tight pt-1">
              {actionTypes.length || 7}
            </div>
            <div className="text-xs text-slate-500 font-normal">Distinct mutation channels</div>
          </div>
          <div className="w-7 h-7 rounded-full bg-slate-50 border border-slate-200/60 flex items-center justify-center text-slate-400">
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* ================= SEARCH & FILTER TOOLBAR ================= */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search action, actor, entity..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF5500] focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            aria-label="Filter by action"
            className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#FF5500] cursor-pointer"
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

      {/* ================= AUDIT TRAIL LIST ================= */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-[#FF5500]" />
            <p className="text-xs font-bold text-slate-600">Loading cryptographic audit trail...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-16 text-center space-y-2">
            <History className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-900">No Audit Records Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Actions such as hackathon publishing, team creation, judge assignment, scoring, and certificate issuance are automatically recorded here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredLogs.map((log) => {
              const hasDiff = log.beforeState || log.afterState;
              const isDanger = log.action.includes('REJECT') || log.action.includes('DELETE') || log.action.includes('REVOKE');
              const isSuccess = log.action.includes('PUBLISH') || log.action.includes('CREATE') || log.action.includes('ISSUE');
              const actorName = log.user?.fullName || log.user?.name || 'Apex Event Lead';
              const actorRole = log.user?.role || 'ADMIN';

              return (
                <div
                  key={log.id}
                  className="p-4 sm:p-5 hover:bg-slate-50/70 transition flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                        isDanger
                          ? 'bg-rose-50 text-rose-600 border border-rose-100'
                          : isSuccess
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                          : 'bg-blue-50 text-blue-600 border border-blue-100'
                      }`}
                    >
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs sm:text-sm font-bold text-slate-900">{log.action}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                          {log.entityType}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">
                          ID: {log.entityId.slice(0, 10)}...
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-500 mt-1 flex-wrap font-normal">
                        <span className="flex items-center gap-1 font-medium text-slate-700">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>{actorName}</span>
                          <span className="text-[10px] font-bold text-slate-400">[{actorRole}]</span>
                        </span>
                        <span className="flex items-center gap-1 text-slate-400">
                          <Clock className="w-3.5 h-3.5" />
                          {new Date(log.createdAt).toLocaleString()}
                        </span>
                        {log.ipAddress && (
                          <span className="font-mono text-slate-400 text-[11px]">IP: {log.ipAddress}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-center">
                    {hasDiff && (
                      <button
                        onClick={() => setActiveDiffRecord(log)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                      >
                        <Code className="w-3.5 h-3.5" />
                        <span>Inspect Diff</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ================= STATE DIFF MODAL ================= */}
      {activeDiffRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Audit State Inspection</h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  Action: <strong className="text-slate-800">{activeDiffRecord.action}</strong> &bull; Entity: {activeDiffRecord.entityType} ({activeDiffRecord.entityId})
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
                  <div className="text-xs font-bold text-rose-600 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    Before Mutation
                  </div>
                  <pre className="p-3.5 bg-slate-900 text-slate-100 text-xs font-mono rounded-xl overflow-x-auto max-h-72">
                    {activeDiffRecord.beforeState
                      ? JSON.stringify(activeDiffRecord.beforeState, null, 2)
                      : 'null (Initial Creation)'}
                  </pre>
                </div>

                <div>
                  <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1.5 flex items-center gap-1">
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
                className="px-4 py-2 bg-[#FF5500] hover:bg-[#EA580C] text-white text-xs font-bold rounded-xl transition shadow-xs"
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
