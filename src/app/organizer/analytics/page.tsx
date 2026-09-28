'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  Users,
  FolderKanban,
  FileCheck,
  Scale,
  Sparkles,
} from 'lucide-react';
import { KPICard } from '@/components/ui/KPICard';

function pct(part: number, whole: number): number {
  if (!whole || whole <= 0) return 0;
  return Math.round((part / whole) * 1000) / 10;
}

export default function OrganizerAnalyticsPage() {
  const [hackathons, setHackathons] = useState<any[]>([]);
  const [selectedHackathonId, setSelectedHackathonId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHackathons() {
      try {
        const res = await fetch('/api/v1/hackathons?mine=true&pageSize=50');
        const json = await res.json();
        const list = json.data?.hackathons || [];
        // Fallback to public list if mine returns empty (e.g. no session ownership yet)
        if (list.length === 0) {
          const pub = await fetch('/api/v1/hackathons?pageSize=50');
          const pubJson = await pub.json();
          const pubList = pubJson.data?.hackathons || [];
          setHackathons(pubList);
          if (pubList[0]) setSelectedHackathonId(pubList[0].id);
        } else {
          setHackathons(list);
          setSelectedHackathonId(list[0].id);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadHackathons();
  }, []);

  const activeHackathon = useMemo(
    () => hackathons.find((h) => h.id === selectedHackathonId) || hackathons[0],
    [hackathons, selectedHackathonId]
  );

  const registrations = activeHackathon?._count?.registrations ?? 0;
  const projects = activeHackathon?._count?.projects ?? 0;
  const teams = activeHackathon?._count?.teams ?? registrations; // may be absent on public list
  const base = Math.max(registrations, 1);

  const registrationConversion = pct(Math.min(teams || projects, registrations), base);
  const submissionRate = pct(projects, base);
  const trackCount = activeHackathon?.tracks?.length ?? 0;

  const funnel = [
    { label: 'Registrations', pct: 100, count: registrations, color: 'bg-[#2563EB]' },
    {
      label: 'Projects Created',
      pct: pct(projects, base),
      count: projects,
      color: 'bg-[#3B82F6]',
    },
    {
      label: 'Tracks Configured',
      pct: trackCount > 0 ? Math.min(100, trackCount * 20) : 0,
      count: trackCount,
      color: 'bg-[#60A5FA]',
    },
  ];

  if (loading) {
    return (
      <div className="p-12 text-center text-sm text-[#64748B]">Loading analytics from database...</div>
    );
  }

  return (
    <div className="space-y-6 select-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#E2E8F0] gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-bold text-[#2563EB] bg-[#EFF6FF] px-2.5 py-0.5 rounded-full border border-[#BFDBFE]">
              Live DB metrics
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#111827] mt-1 tracking-tight">
            Event Analytics & Telemetry
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-0.5 font-normal">
            Conversion and track volume computed from the selected hackathon.
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

      {!activeHackathon ? (
        <div className="p-12 text-center bg-white border border-[#E2E8F0] rounded-2xl text-sm text-[#64748B]">
          No hackathons available to analyze yet.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              label="Registration Conversion"
              value={`${registrationConversion}%`}
              subtext="Projects vs registrations"
              icon={<Users className="w-4 h-4" />}
            />
            <KPICard
              label="Submission / Project Rate"
              value={`${submissionRate}%`}
              subtext={`${projects} projects / ${registrations} regs`}
              icon={<FileCheck className="w-4 h-4" />}
            />
            <KPICard
              label="Tracks"
              value={String(trackCount)}
              subtext="Configured challenge tracks"
              icon={<Scale className="w-4 h-4" />}
            />
            <KPICard
              label="Status"
              value={activeHackathon.status || '—'}
              subtext={activeHackathon.title}
              icon={<Sparkles className="w-4 h-4" />}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-[#E2E8F0] rounded-[18px] p-6 space-y-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-[#2563EB]" />
                <h3 className="text-sm font-bold text-[#111827]">Builder Conversion Funnel</h3>
              </div>

              <div className="space-y-3 pt-2 text-xs">
                {funnel.map((st) => (
                  <div key={st.label} className="space-y-1">
                    <div className="flex justify-between font-medium">
                      <span className="text-[#334155]">{st.label}</span>
                      <span className="font-bold text-[#111827]">
                        {st.count} ({st.pct}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[#F1F5F9] overflow-hidden">
                      <div
                        className={`h-full rounded-full ${st.color}`}
                        style={{ width: `${Math.min(100, st.pct)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-[#E2E8F0] rounded-[18px] p-6 space-y-4">
              <div className="flex items-center space-x-2">
                <FolderKanban className="w-4 h-4 text-[#7E22CE]" />
                <h3 className="text-sm font-bold text-[#111827]">Track Participation Volume</h3>
              </div>

              <div className="space-y-3 pt-2 text-xs">
                {(activeHackathon?.tracks || []).length === 0 ? (
                  <p className="text-[#64748B]">No tracks on this hackathon yet.</p>
                ) : (
                  activeHackathon.tracks.map((t: any) => (
                    <div key={t.id} className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
                      <div className="flex justify-between font-semibold">
                        <span className="text-[#111827]">{t.title}</span>
                        <span className="text-[#2563EB]">
                          {t.problemStatements?.length || 0} Problem Statements
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
