'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  Users,
  FolderKanban,
  FileCheck,
  Scale,
  Sparkles,
  Trophy,
  ChevronRight,
  Zap,
  BarChart3,
  FileText,
  PieChart,
} from 'lucide-react';

export default function OrganizerAnalyticsPage() {
  const [hackathons, setHackathons] = useState<any[]>([]);
  const [selectedHackathonId, setSelectedHackathonId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const loadHackathons = async () => {
    try {
      const res = await fetch('/api/v1/hackathons?mine=true&pageSize=50');
      const json = await res.json();
      const list = json.data?.hackathons || [];
      if (list.length === 0) {
        const pub = await fetch('/api/v1/hackathons?pageSize=50');
        const pubJson = await pub.json();
        const pubList = pubJson.data?.hackathons || [];
        setHackathons(pubList);
        if (pubList[0] && !selectedHackathonId) setSelectedHackathonId(pubList[0].id);
      } else {
        setHackathons(list);
        if (!selectedHackathonId) setSelectedHackathonId(list[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHackathons();
  }, []);

  const activeHackathon = useMemo(
    () => hackathons.find((h) => h.id === selectedHackathonId) || hackathons[0],
    [hackathons, selectedHackathonId]
  );

  // Default tracks matching Image 1
  const tracksList = [
    {
      id: 't1',
      title: 'Enterprise AI & Autonomous Systems',
      problemCount: 1,
    },
    {
      id: 't2',
      title: 'Cloud Infrastructure & Zero-Trust Security',
      problemCount: 0,
    },
    {
      id: 't3',
      title: 'FinTech Intelligence & Cryptographic Audit',
      problemCount: 0,
    },
    {
      id: 't4',
      title: 'HealthTech & Multimodal Diagnostics',
      problemCount: 0,
    },
  ];

  // 5 Stepped Funnel stages matching Image 1
  const funnelStages = [
    { label: 'Registrations', pct: 100, color: 'bg-[#2563EB]' },
    { label: 'Squad Formation', pct: 78, color: 'bg-[#2563EB]' },
    { label: 'Track & Problem Selection', pct: 72, color: 'bg-[#38BDF8]' },
    { label: 'Deliverable Linked', pct: 64, color: 'bg-[#60A5FA]' },
    { label: 'Locked Submission', pct: 56, color: 'bg-[#10B981]' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans select-none pb-12">
      
      {/* In-page Breadcrumb Navigation */}
      <nav className="flex items-center space-x-2 text-xs text-slate-500 font-medium">
        <Link href="/" className="hover:text-blue-600 transition-colors">
          Home
        </Link>
        <span className="text-slate-400">&rsaquo;</span>
        <Link href="/organizer/dashboard" className="hover:text-blue-600 transition-colors">
          Organizer
        </Link>
        <span className="text-slate-400">&rsaquo;</span>
        <span className="text-slate-900 font-semibold">Analytics</span>
      </nav>

      {/* Top Badges */}
      <div className="flex flex-wrap items-center gap-2.5">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#EFF6FF] text-[#2563EB] border border-[#DBEAFE]">
          <Zap className="w-3.5 h-3.5 text-[#2563EB]" />
          Real-time Telemetry
        </span>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">
          <BarChart3 className="w-3.5 h-3.5 text-[#059669]" />
          Event-Scoped Analytics
        </span>
      </div>

      {/* Header Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#0F172A] tracking-tight">
            Event Analytics &amp; Telemetry
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-normal max-w-2xl">
            Conversion funnel analysis, track adoption velocity, judging throughput, and score distributions.
          </p>
        </div>

        {/* Hackathon Selector */}
        <div className="flex items-center space-x-2 self-start lg:self-center">
          <span className="text-xs font-medium text-slate-500">Hackathon:</span>
          <div className="flex items-center gap-2 bg-white border border-slate-200/90 rounded-2xl px-4 py-2.5 shadow-xs">
            <Trophy className="w-4 h-4 text-[#EA580C] flex-shrink-0" />
            <select
              value={selectedHackathonId}
              onChange={(e) => setSelectedHackathonId(e.target.value)}
              aria-label="Select Hackathon"
              className="bg-transparent border-none text-xs font-bold text-slate-900 focus:outline-none cursor-pointer pr-2 max-w-[260px] truncate"
            >
              {hackathons.length > 0 ? (
                hackathons.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.title}
                  </option>
                ))
              ) : (
                <option value="default">Apex Enterprise Hackathon 2026</option>
              )}
            </select>
          </div>
        </div>
      </div>

      {/* 4 KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: REGISTRATION CONVERSION */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex items-center justify-between group hover:border-slate-300 transition-all">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#EFF6FF] border border-[#DBEAFE] flex items-center justify-center text-[#2563EB]">
                <Users className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                REGISTRATION CONVERSION
              </span>
            </div>
            <div className="text-3xl font-black text-slate-900 tracking-tight pt-1">
              78.4%
            </div>
            <div className="text-xs text-slate-500 font-normal">
              Enrolled to formed squads
            </div>
          </div>
          <div className="w-7 h-7 rounded-full bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-400 group-hover:text-slate-600 transition-colors">
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>

        {/* Card 2: SUBMISSION RATE */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex items-center justify-between group hover:border-slate-300 transition-all">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#FAF5FF] border border-[#E9D5FF] flex items-center justify-center text-[#9333EA]">
                <FileText className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                SUBMISSION RATE
              </span>
            </div>
            <div className="text-3xl font-black text-slate-900 tracking-tight pt-1">
              68.2%
            </div>
            <div className="text-xs text-slate-500 font-normal">
              Squads with locked deliverables
            </div>
          </div>
          <div className="w-7 h-7 rounded-full bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-400 group-hover:text-slate-600 transition-colors">
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>

        {/* Card 3: JUDGING VELOCITY */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex items-center justify-between group hover:border-slate-300 transition-all">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#FFF7ED] border border-[#FFEDD5] flex items-center justify-center text-[#EA580C]">
                <Scale className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                JUDGING VELOCITY
              </span>
            </div>
            <div className="text-3xl font-black text-slate-900 tracking-tight pt-1">
              92.5%
            </div>
            <div className="text-xs text-slate-500 font-normal">
              Rubric evaluations completed
            </div>
          </div>
          <div className="w-7 h-7 rounded-full bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-400 group-hover:text-slate-600 transition-colors">
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>

        {/* Card 4: CONSENSUS INDEX */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex items-center justify-between group hover:border-slate-300 transition-all">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] flex items-center justify-center text-[#059669]">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                CONSENSUS INDEX
              </span>
            </div>
            <div className="text-3xl font-black text-slate-900 tracking-tight pt-1">
              0.88 r
            </div>
            <div className="text-xs text-slate-500 font-normal">
              Human-AI correlation alignment
            </div>
          </div>
          <div className="w-7 h-7 rounded-full bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-400 group-hover:text-slate-600 transition-colors">
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Two Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        
        {/* Left: Builder Conversion Funnel */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2.5">
              <TrendingUp className="w-5 h-5 text-[#2563EB]" />
              <h2 className="text-base font-extrabold text-slate-900">
                Builder Conversion Funnel
              </h2>
            </div>
            <BarChart3 className="w-4 h-4 text-slate-400" />
          </div>

          <div className="space-y-5 pt-1 text-xs">
            {funnelStages.map((stage) => (
              <div key={stage.label} className="space-y-2">
                <div className="flex justify-between items-center font-bold">
                  <span className="text-slate-800 font-bold">{stage.label}</span>
                  <span className="text-slate-900 font-extrabold font-sans">
                    {stage.pct}%
                  </span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${stage.color} transition-all duration-500`}
                    style={{ width: `${stage.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Track Participation Volume */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2.5">
              <FolderKanban className="w-5 h-5 text-[#9333EA]" />
              <h2 className="text-base font-extrabold text-slate-900">
                Track Participation Volume
              </h2>
            </div>
            <PieChart className="w-4 h-4 text-blue-500" />
          </div>

          <div className="space-y-3 pt-1 text-xs">
            {tracksList.map((track) => (
              <div
                key={track.id}
                className="p-4 rounded-xl bg-slate-50/60 border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-all flex items-center justify-between cursor-pointer group"
              >
                <span className="font-bold text-slate-800 text-sm group-hover:text-blue-600 transition-colors">
                  {track.title}
                </span>
                <span className="text-xs font-semibold text-[#2563EB] flex items-center gap-1">
                  <span>{track.problemCount} Problem Statements</span>
                  <ChevronRight className="w-3.5 h-3.5 text-[#2563EB]" />
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
