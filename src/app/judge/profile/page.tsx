'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  UserCheck2,
  Scale,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Trophy,
  Mail,
  Award,
  Layers,
  ArrowRight,
  FolderKanban,
  Star,
  Activity,
  Sliders,
  Settings,
  Sparkles,
  Zap,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

export default function JudgeProfilePage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalAssigned: 4,
    completedCount: 2,
    pendingCount: 2,
    avgScore: '90.9',
  });
  const [hackathons, setHackathons] = useState<any[]>([
    { id: 'hack_apex_2026', title: 'Apex Enterprise Hackathon 2026' },
    { id: 'hack_frontier_2026', title: 'Frontier AI Global Summit' },
  ]);

  useEffect(() => {
    async function loadStats() {
      try {
        setLoading(true);
        const res = await fetch('/api/v1/judge/assignments');
        const data = await res.json();
        if (res.ok && data.data) {
          const assignments = data.data.assignments || [];
          if (assignments.length > 0) {
            const completed = assignments.filter((a: any) => a.evaluation?.status === 'SUBMITTED');
            const sumScores = completed.reduce((acc: number, curr: any) => acc + (curr.evaluation?.weightedScore || 0), 0);
            const avg = completed.length > 0 ? (sumScores / completed.length).toFixed(1) : '—';

            setStats({
              totalAssigned: assignments.length,
              completedCount: completed.length,
              pendingCount: assignments.length - completed.length,
              avgScore: avg,
            });
          }

          if (data.data.hackathons && data.data.hackathons.length > 0) {
            setHackathons(data.data.hackathons);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  return (
    <div className="space-y-6 select-none pb-16 max-w-5xl mx-auto font-sans">
      {/* ================= 1. HEADER ================= */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-1">
        <div className="space-y-1.5">
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#FFF7ED] text-[#EA580C] border border-[#FFEDD5]">
              Juror Credential
            </span>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Official Jury Member</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
            Judge Profile &amp; Evaluation Record
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-normal max-w-2xl">
            Review your verified jury credentials, assigned tracks, and workload calibration metrics.
          </p>
        </div>

        <Link href="/judge/dashboard">
          <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#FF5500] to-[#EA580C] hover:from-[#EA580C] hover:to-[#C2410C] text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-md transition-all active:scale-[0.98]">
            <Scale className="w-4 h-4" />
            <span>Judge Dashboard</span>
          </button>
        </Link>
      </div>

      {/* ================= 2. PROFILE CARD ================= */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6 border-l-4 border-l-[#FF5500]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#FF5500] to-[#EA580C] text-white flex items-center justify-center font-black text-2xl shadow-md shadow-orange-500/20 flex-shrink-0">
            J
          </div>
          <div className="space-y-1 flex-1">
            <div className="flex items-center space-x-3">
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Senior Jury Member</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#FFF7ED] text-[#EA580C] border border-[#FFEDD5] uppercase tracking-wider">
                Active Juror
              </span>
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span>judge.alpha@hackathon.dev</span>
            </p>
            <p className="text-xs text-slate-500 pt-0.5">
              Strict isolation enabled: Peer scores remain encrypted and confidential until official results publication.
            </p>
          </div>
        </div>

        {/* Certified Domains */}
        <div className="pt-4 border-t border-slate-100 space-y-2.5">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
            CERTIFIED EVALUATION TRACKS
          </span>
          <div className="flex flex-wrap gap-2">
            {[
              { label: 'Autonomous AI Agents', color: '#8B5CF6', bg: '#FAF5FF', border: '#E9D5FF' },
              { label: 'Cloud Infrastructure & Zero-Trust', color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE' },
              { label: 'FinTech & Cryptographic Audit', color: '#059669', bg: '#ECFDF5', border: '#A7F3D0' },
              { label: 'HealthTech & Multimodal AI', color: '#EA580C', bg: '#FFF7ED', border: '#FFEDD5' },
            ].map((d) => (
              <span
                key={d.label}
                className="inline-flex items-center px-3 py-1 rounded-xl text-xs font-bold border"
                style={{
                  backgroundColor: d.bg,
                  color: d.color,
                  borderColor: d.border,
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full mr-2"
                  style={{ backgroundColor: d.color }}
                />
                {d.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ================= 3. STATS GRID ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Assigned</span>
          <div className="text-2xl font-black text-slate-900 font-mono">{stats.totalAssigned}</div>
          <span className="text-[11px] text-slate-500 block">Deliverables in queue</span>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Completed</span>
          <div className="text-2xl font-black text-[#059669] font-mono">{stats.completedCount}</div>
          <span className="text-[11px] text-slate-500 block">Locked evaluations</span>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Pending</span>
          <div className="text-2xl font-black text-[#EA580C] font-mono">{stats.pendingCount}</div>
          <span className="text-[11px] text-slate-500 block">Awaiting scoring</span>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Average Given</span>
          <div className="text-2xl font-black text-slate-900 font-mono">{stats.avgScore} <span className="text-xs text-slate-400 font-normal">/ 100</span></div>
          <span className="text-[11px] text-slate-500 block">Normalized score delta</span>
        </div>
      </div>

      {/* ================= 4. ASSIGNED EVENTS ================= */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-extrabold text-slate-900 tracking-tight">Active Hackathon Appointments</h3>
          <span className="text-xs font-semibold text-[#EA580C]">
            {hackathons.length} Arenas
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {hackathons.map((h) => (
            <div key={h.id} className="py-3.5 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-xl bg-[#FFF7ED] text-[#EA580C] flex items-center justify-center font-bold text-xs">
                  <Trophy className="w-4 h-4 text-amber-500" />
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-bold text-slate-900">{h.title}</div>
                  <div className="text-[11px] text-slate-400 font-mono">{h.id}</div>
                </div>
              </div>

              <Link href="/judge/dashboard">
                <button className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-[#EA580C] bg-[#FFF7ED] hover:bg-[#FFEDD5] border border-[#FFEDD5] transition-colors">
                  Open Queue
                </button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
