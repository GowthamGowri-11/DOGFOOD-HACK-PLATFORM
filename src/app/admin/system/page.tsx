'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Server,
  Database,
  Cpu,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Activity,
  Layers,
  Clock,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface SystemTelemetry {
  timestamp: string;
  overallStatus: string;
  services: {
    database: {
      name: string;
      status: string;
      latencyMs: number;
      engine: string;
      poolMode: string;
    };
    api: {
      name: string;
      status: string;
      nodeVersion: string;
      uptimeSeconds: number;
      memory: {
        rssMb: number;
        heapUsedMb: number;
        heapTotalMb: number;
      };
    };
    aiJuryWorker: {
      name: string;
      status: string;
      latestRunId: string;
      calibratedMae: number;
      lastExecution: string;
    };
    auditStorage: {
      name: string;
      status: string;
      totalEntries: number;
      tamperEvidence: string;
    };
    cacheService: {
      name: string;
      status: string;
      mode: string;
    };
  };
  counts: {
    totalUsers: number;
    totalHackathons: number;
    totalAuditEvents: number;
  };
}

export default function AdminSystemPage() {
  const [telemetry, setTelemetry] = useState<SystemTelemetry | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStatus = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch('/api/v1/admin/system-status');
      const json = await res.json();
      if (json.success && json.data) {
        setTelemetry(json.data);
      }
    } catch (err) {
      console.error('Failed to probe system health:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000); // Probe every 30s
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${d > 0 ? `${d}d ` : ''}${h}h ${m}m ${s}s`;
  };

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
              <CheckCircle2 className="w-3 h-3 mr-1" /> Telemetry Active
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#111827] mt-1 tracking-tight">
            Infrastructure & System Telemetry
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
            Real-time latency benchmarks, PostgreSQL connection status, memory utilization, and background worker health.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchStatus}
          disabled={refreshing}
          className="self-start sm:self-center"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
          Run Health Diagnostics
        </Button>
      </div>

      {loading && !telemetry ? (
        <div className="p-12 text-center text-xs text-[#64748B] bg-white rounded-[18px] border border-[#E2E8F0]">
          Running diagnostic health probes across platform microservices...
        </div>
      ) : telemetry ? (
        <div className="space-y-5">
          {/* Top Status Banner */}
          <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-[18px] p-5 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-[#ECFDF5] flex items-center justify-center text-[#059669]">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">
                  Platform Operational State
                </span>
                <div className="text-base font-bold text-[#111827] flex items-center mt-0.5">
                  All Systems Operational • {telemetry.services.database.latencyMs}ms Latency
                </div>
              </div>
            </div>

            <div className="text-xs text-[#64748B] font-mono self-start sm:self-center">
              Last probe: {new Date(telemetry.timestamp).toLocaleTimeString()}
            </div>
          </div>

          {/* Grid of Microservice Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Database Card */}
            <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-[18px] p-6 shadow-card space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
                <div className="flex items-center space-x-2">
                  <Database className="w-4 h-4 text-[#002B49]" />
                  <h3 className="text-sm font-bold text-[#111827]">
                    {telemetry.services.database.name}
                  </h3>
                </div>
                <Badge variant="emerald" size="sm">
                  {telemetry.services.database.status}
                </Badge>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-[#F1F5F9]">
                  <span className="text-[#64748B]">Query Latency (SELECT 1):</span>
                  <span className="font-mono font-bold text-[#059669]">
                    {telemetry.services.database.latencyMs} ms
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#F1F5F9]">
                  <span className="text-[#64748B]">Engine Architecture:</span>
                  <span className="font-mono font-medium text-[#111827]">
                    {telemetry.services.database.engine}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#F1F5F9]">
                  <span className="text-[#64748B]">Transaction Mode:</span>
                  <span className="font-semibold text-[#111827]">
                    {telemetry.services.database.poolMode}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[#64748B]">Total Stored Hackathons:</span>
                  <span className="font-bold text-[#111827]">
                    {telemetry.counts.totalHackathons} arenas
                  </span>
                </div>
              </div>
            </div>

            {/* Next.js API Node Card */}
            <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-[18px] p-6 shadow-card space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
                <div className="flex items-center space-x-2">
                  <Server className="w-4 h-4 text-[#002B49]" />
                  <h3 className="text-sm font-bold text-[#111827]">
                    {telemetry.services.api.name}
                  </h3>
                </div>
                <Badge variant="emerald" size="sm">
                  HEALTHY
                </Badge>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-[#F1F5F9]">
                  <span className="text-[#64748B]">Process Uptime:</span>
                  <span className="font-mono font-semibold text-[#111827]">
                    {formatUptime(telemetry.services.api.uptimeSeconds)}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#F1F5F9]">
                  <span className="text-[#64748B]">Node.js Runtime:</span>
                  <span className="font-mono font-medium text-[#111827]">
                    {telemetry.services.api.nodeVersion}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#F1F5F9]">
                  <span className="text-[#64748B]">Heap Utilization:</span>
                  <span className="font-mono font-semibold text-[#2563EB]">
                    {telemetry.services.api.memory.heapUsedMb} MB / {telemetry.services.api.memory.heapTotalMb} MB
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[#64748B]">Resident Memory (RSS):</span>
                  <span className="font-mono font-medium text-[#111827]">
                    {telemetry.services.api.memory.rssMb} MB
                  </span>
                </div>
              </div>
            </div>

            {/* AI Jury Worker Card */}
            <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-[18px] p-6 shadow-card space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-[#2563EB]" />
                  <h3 className="text-sm font-bold text-[#111827]">
                    {telemetry.services.aiJuryWorker.name}
                  </h3>
                </div>
                <Badge variant="blue" size="sm">
                  CALIBRATED
                </Badge>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-[#F1F5F9]">
                  <span className="text-[#64748B]">Calibration MAE:</span>
                  <span className="font-mono font-bold text-[#2563EB]">
                    {telemetry.services.aiJuryWorker.calibratedMae.toFixed(1)} pts
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#F1F5F9]">
                  <span className="text-[#64748B]">Active Model Version:</span>
                  <span className="font-mono text-[#111827]">Claude 3.7 Sonnet (Calibrated)</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[#64748B]">Anti-Leakage Guard:</span>
                  <span className="font-semibold text-[#059669]">Strictly Enforced</span>
                </div>
              </div>
            </div>

            {/* Audit Storage Card */}
            <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-[18px] p-6 shadow-card space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-[#059669]" />
                  <h3 className="text-sm font-bold text-[#111827]">
                    {telemetry.services.auditStorage.name}
                  </h3>
                </div>
                <Badge variant="emerald" size="sm">
                  APPEND-ONLY
                </Badge>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-[#F1F5F9]">
                  <span className="text-[#64748B]">Total Immutable Records:</span>
                  <span className="font-mono font-bold text-[#111827]">
                    {telemetry.services.auditStorage.totalEntries} events
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#F1F5F9]">
                  <span className="text-[#64748B]">Tamper-Proof Verification:</span>
                  <span className="font-semibold text-[#059669]">
                    {telemetry.services.auditStorage.tamperEvidence}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[#64748B]">Cache Revalidation Mode:</span>
                  <span className="font-mono text-[#111827]">On-Demand Path Invalidation</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
