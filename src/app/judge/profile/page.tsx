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
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export default function JudgeProfilePage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalAssigned: 0,
    completedCount: 0,
    pendingCount: 0,
    avgScore: '—',
  });
  const [hackathons, setHackathons] = useState<any[]>([]);

  useEffect(() => {
    async function loadStats() {
      try {
        setLoading(true);
        const res = await fetch('/api/v1/judge/assignments');
        const data = await res.json();
        if (res.ok && data.data) {
          const assignments = data.data.assignments || [];
          const completed = assignments.filter((a: any) => a.evaluation?.status === 'SUBMITTED');
          const sumScores = completed.reduce((acc: number, curr: any) => acc + (curr.evaluation?.weightedScore || 0), 0);
          const avg = completed.length > 0 ? (sumScores / completed.length).toFixed(1) : '—';

          setStats({
            totalAssigned: assignments.length,
            completedCount: completed.length,
            pendingCount: assignments.length - completed.length,
            avgScore: avg,
          });

          if (data.data.hackathons) {
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
    <div className="space-y-8 select-none pb-12 max-w-5xl mx-auto">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-[#E2E8F0]">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-[#64748B] mb-1">
            <span>Judge Portal</span>
            <span>•</span>
            <Badge variant="emerald" icon={<ShieldCheck className="w-3 h-3" />}>
              Official Juror
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-tight">
            Judge Profile & Expertise
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
            Review your evaluation credentials, assigned hackathon events, and workload capacity.
          </p>
        </div>

        <Link href="/judge/assignments">
          <Button variant="primary" size="md" icon={<Scale className="w-4 h-4" />}>
            View Evaluation Queue
          </Button>
        </Link>
      </div>

      {/* 2. Profile Card */}
      <div className="bg-white border border-[#E2E8F0] rounded-[20px] p-6 sm:p-8 shadow-card space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-[#2563EB] to-[#60A5FA] text-white flex items-center justify-center font-black text-2xl shadow-md shadow-blue-500/20">
            J
          </div>
          <div className="space-y-1 flex-1">
            <div className="flex items-center space-x-3">
              <h2 className="text-xl font-bold text-[#111827]">Senior Jury Member</h2>
              <Badge variant="blue">Active Juror</Badge>
            </div>
            <p className="text-xs sm:text-sm text-[#64748B] flex items-center">
              <Mail className="w-3.5 h-3.5 mr-1.5 text-[#94A3B8]" /> judge@hackathon.dev
            </p>
            <p className="text-xs text-[#64748B] pt-0.5">
              Strict isolation enabled: Peer scores remain private until official results publication.
            </p>
          </div>
        </div>

        {/* Expertise Tracks */}
        <div className="pt-4 border-t border-[#F1F5F9] space-y-2">
          <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider block">
            Expertise & Certified Domains
          </span>
          <div className="flex flex-wrap gap-2">
            {[
              { label: 'Autonomous AI Agents', color: '#8B5CF6' },
              { label: 'Cloud Infrastructure & Security', color: '#6366F1' },
              { label: 'FinTech & Cryptographic Audit', color: '#059669' },
              { label: 'HealthTech & Multimodal AI', color: '#EC4899' },
            ].map((d) => (
              <span
                key={d.label}
                className="inline-flex items-center px-3 py-1 rounded-xl text-xs font-semibold border"
                style={{
                  backgroundColor: `${d.color}15`,
                  color: d.color,
                  borderColor: `${d.color}30`,
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

      {/* 3. Live Evaluation KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E2E8F0] rounded-[16px] p-5 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">
              Assigned Submissions
            </span>
            <FolderKanban className="w-4 h-4 text-[#2563EB]" />
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-[#111827]">{stats.totalAssigned}</span>
            <span className="text-xs text-[#64748B]">projects</span>
          </div>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-[16px] p-5 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">
              Pending Reviews
            </span>
            <Clock className="w-4 h-4 text-[#D97706]" />
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-[#D97706]">{stats.pendingCount}</span>
            <span className="text-xs text-[#64748B]">remaining</span>
          </div>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-[16px] p-5 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">
              Evaluations Submitted
            </span>
            <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-[#16A34A]">{stats.completedCount}</span>
            <span className="text-xs text-[#64748B]">/ {stats.totalAssigned}</span>
          </div>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-[16px] p-5 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">
              Avg Score Awarded
            </span>
            <Star className="w-4 h-4 text-[#9333EA]" />
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-[#111827]">{stats.avgScore}</span>
            {stats.avgScore !== '—' && <span className="text-xs text-[#64748B]">/ 100</span>}
          </div>
        </div>
      </div>

      {/* 4. Affiliated Hackathons */}
      <div className="bg-white border border-[#E2E8F0] rounded-[20px] p-6 sm:p-8 shadow-card space-y-4">
        <h3 className="text-base font-bold text-[#111827]">
          Assigned Hackathon Events ({hackathons.length})
        </h3>
        <div className="divide-y divide-[#F1F5F9]">
          {hackathons.map((h) => (
            <div key={h.id} className="py-3.5 flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center space-x-2">
                  <h4 className="text-sm font-bold text-[#111827]">{h.title}</h4>
                  <Badge variant="blue">{h.status}</Badge>
                </div>
                <p className="text-xs text-[#64748B]">
                  Tracks: {h.tracks?.map((t: any) => t.title).join(', ') || 'General Track'}
                </p>
              </div>

              <Link href={`/judge/assignments?hackathonId=${h.id}`}>
                <Button variant="outline" size="sm">
                  View Event Queue
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
