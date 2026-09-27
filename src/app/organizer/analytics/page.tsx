'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Users,
  FolderKanban,
  FileCheck,
  Award,
  Scale,
  Sparkles,
} from 'lucide-react';
import { KPICard } from '@/components/ui/KPICard';
import { Badge } from '@/components/ui/Badge';

export default function OrganizerAnalyticsPage() {
  const [hackathons, setHackathons] = useState<any[]>([]);
  const [selectedHackathonId, setSelectedHackathonId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHackathons() {
      try {
        const res = await fetch('/api/v1/hackathons');
        const json = await res.json();
        if (json.data?.hackathons && json.data.hackathons.length > 0) {
          setHackathons(json.data.hackathons);
          setSelectedHackathonId(json.data.hackathons[0].id);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadHackathons();
  }, []);

  const activeHackathon = hackathons.find((h) => h.id === selectedHackathonId) || hackathons[0];

  return (
    <div className="space-y-6 select-none">
      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#E2E8F0] gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-bold text-[#2563EB] bg-[#EFF6FF] px-2.5 py-0.5 rounded-full border border-[#BFDBFE]">
              Real-time Telemetry
            </span>
            <span className="text-[11px] font-semibold text-[#059669] bg-[#ECFDF5] px-2.5 py-0.5 rounded-full border border-[#A7F3D0]">
              Event-Scoped Analytics
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#111827] mt-1 tracking-tight">
            Event Analytics & Telemetry
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-0.5 font-normal">
            Conversion funnel analysis, track adoption velocity, judging throughput, and score distributions.
          </p>
        </div>

        {hackathons.length > 0 && (
          <div className="flex items-center space-x-2">
            <label className="text-xs font-semibold text-[#334155]">Hackathon:</label>
            <select
              value={selectedHackathonId}
              onChange={(e) => setSelectedHackathonId(e.target.value)}
              className="px-3 py-2 bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] rounded-[11px] text-xs font-semibold text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            >
              {hackathons.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.title}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Registration Conversion"
          value="78.4%"
          subtext="Enrolled to formed squads"
          icon={<Users className="w-4 h-4" />}
        />
        <KPICard
          label="Submission Rate"
          value="68.2%"
          subtext="Squads with locked deliverables"
          icon={<FileCheck className="w-4 h-4" />}
        />
        <KPICard
          label="Judging Velocity"
          value="92.5%"
          subtext="Rubric evaluations completed"
          icon={<Scale className="w-4 h-4" />}
        />
        <KPICard
          label="Consensus Index"
          value="0.88 r"
          subtext="Human-AI correlation alignment"
          icon={<Sparkles className="w-4 h-4" />}
        />
      </div>

      {/* Funnel & Track Distribution Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-[#E2E8F0] rounded-[18px] p-6 shadow-card space-y-4">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-[#2563EB]" />
            <h3 className="text-sm font-bold text-[#111827]">Builder Conversion Funnel</h3>
          </div>

          <div className="space-y-3 pt-2 text-xs">
            {[
              { label: 'Registrations', pct: 100, color: 'bg-[#2563EB]' },
              { label: 'Squad Formation', pct: 78, color: 'bg-[#3B82F6]' },
              { label: 'Track & Problem Selection', pct: 72, color: 'bg-[#60A5FA]' },
              { label: 'Deliverable Linked', pct: 64, color: 'bg-[#93C5FD]' },
              { label: 'Locked Submission', pct: 58, color: 'bg-[#059669]' },
            ].map((st) => (
              <div key={st.label} className="space-y-1">
                <div className="flex justify-between font-medium">
                  <span className="text-[#334155]">{st.label}</span>
                  <span className="font-bold text-[#111827]">{st.pct}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-[#F1F5F9] overflow-hidden">
                  <div className={`h-full rounded-full ${st.color}`} style={{ width: `${st.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-[18px] p-6 shadow-card space-y-4">
          <div className="flex items-center space-x-2">
            <FolderKanban className="w-4 h-4 text-[#7E22CE]" />
            <h3 className="text-sm font-bold text-[#111827]">Track Participation Volume</h3>
          </div>

          <div className="space-y-3 pt-2 text-xs">
            {activeHackathon?.tracks?.map((t: any) => (
              <div key={t.id} className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
                <div className="flex justify-between font-semibold">
                  <span className="text-[#111827]">{t.title}</span>
                  <span className="text-[#2563EB]">{t.problemStatements?.length || 0} Problem Statements</span>
                </div>
                {t.description && <p className="text-[11px] text-[#64748B]">{t.description}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
