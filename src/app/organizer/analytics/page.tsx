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
  ChevronDown,
  Zap,
  BarChart3,
  FileText,
  PieChart,
  Lightbulb,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Shield,
  Cloud,
  Cpu,
  Coins,
  Activity,
  Calendar,
  Lock,
  Link2,
  Flag,
  Share2,
} from 'lucide-react';

export default function OrganizerAnalyticsPage() {
  const [hackathons, setHackathons] = useState<any[]>([]);
  const [selectedHackathonId, setSelectedHackathonId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('Last 30 days');
  const [volumeMetric, setVolumeMetric] = useState('Team Count');

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

  // 4 Detailed Tracks matching Image 1
  const tracksList = [
    {
      id: 't1',
      title: 'Enterprise AI & Autonomous Systems',
      shortTitle: 'Enterprise AI & Autonomous Systems',
      teams: 86,
      problemCount: 1,
      pct: 86,
      colorGradient: 'from-[#EA580C] to-[#F97316]',
      bgLight: 'bg-[#FFF7ED]',
      textColor: 'text-[#EA580C]',
      icon: Cpu,
    },
    {
      id: 't2',
      title: 'Cloud Infrastructure & Zero-Trust Security',
      shortTitle: 'Cloud Infrastructure & Zero-Trust Security',
      teams: 64,
      problemCount: 0,
      pct: 64,
      colorGradient: 'from-[#2563EB] to-[#60A5FA]',
      bgLight: 'bg-[#EFF6FF]',
      textColor: 'text-[#2563EB]',
      icon: Cloud,
    },
    {
      id: 't3',
      title: 'FinTech Intelligence & Cryptographic Audit',
      shortTitle: 'FinTech Intelligence & Cryptographic Audit',
      teams: 48,
      problemCount: 0,
      pct: 48,
      colorGradient: 'from-[#7C3AED] to-[#A855F7]',
      bgLight: 'bg-[#FAF5FF]',
      textColor: 'text-[#9333EA]',
      icon: Coins,
    },
    {
      id: 't4',
      title: 'HealthTech & Multimodal Diagnostics',
      shortTitle: 'HealthTech & Multimodal Diagnostics',
      teams: 52,
      problemCount: 0,
      pct: 52,
      colorGradient: 'from-[#059669] to-[#34D399]',
      bgLight: 'bg-[#ECFDF5]',
      textColor: 'text-[#059669]',
      icon: Activity,
    },
  ];

  // 5 Stepped Funnel stages matching Image 1
  const funnelStages = [
    {
      id: 'f1',
      label: 'Registrations',
      desc: 'Users registered for the hackathon',
      count: '1,248',
      pct: 100,
      color: 'bg-[#2563EB]',
      icon: Users,
      iconBg: 'bg-[#EFF6FF] text-[#2563EB]',
    },
    {
      id: 'f2',
      label: 'Squad Formation',
      desc: 'Registered users who formed/joined teams',
      count: '978',
      pct: 78,
      color: 'bg-[#8B5CF6]',
      icon: Users,
      iconBg: 'bg-[#FAF5FF] text-[#9333EA]',
    },
    {
      id: 'f3',
      label: 'Track & Problem Selection',
      desc: 'Teams selected a track and problem statement',
      count: '898',
      pct: 72,
      color: 'bg-[#F97316]',
      icon: Flag,
      iconBg: 'bg-[#FFF7ED] text-[#EA580C]',
    },
    {
      id: 'f4',
      label: 'Deliverable Linked',
      desc: 'Teams added repository/demo/video/docs',
      count: '798',
      pct: 64,
      color: 'bg-[#06B6D4]',
      icon: Link2,
      iconBg: 'bg-[#ECFEFF] text-[#0891B2]',
    },
    {
      id: 'f5',
      label: 'Locked Submission',
      desc: 'Finalized and locked submissions',
      count: '698',
      pct: 56,
      color: 'bg-[#10B981]',
      icon: Lock,
      iconBg: 'bg-[#ECFDF5] text-[#059669]',
    },
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

      {/* Top Banner Header with warm gradient, illustration backdrop and Hackathon Dropdown */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#FFF7ED] via-[#FFFAF5] to-[#FFF7ED] border border-[#FFEDD5] p-6 sm:p-7 shadow-xs">
        {/* Decorative Background Artwork Elements */}
        <div className="absolute right-0 top-0 bottom-0 w-1/2 pointer-events-none opacity-25 lg:opacity-40 flex items-center justify-end pr-10">
          <div className="relative w-64 h-28">
            <div className="absolute right-12 top-0 w-24 h-24 bg-gradient-to-br from-amber-200 to-orange-300 rounded-3xl rotate-12 blur-xl opacity-60" />
            <div className="absolute right-4 top-2 text-orange-400/50">
              <Trophy className="w-24 h-24 stroke-[1.2]" />
            </div>
            <div className="absolute right-36 top-6 text-amber-500/40">
              <Calendar className="w-16 h-16 stroke-[1.2]" />
            </div>
          </div>
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left Title & Description */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#F97316] to-[#EA580C] shadow-lg shadow-orange-500/20 flex items-center justify-center text-white flex-shrink-0">
              <BarChart3 className="w-7 h-7 stroke-[2.2]" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#0F172A] tracking-tight">
                Event Analytics &amp; Telemetry
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 font-normal max-w-2xl leading-relaxed">
                Conversion funnel analysis, track adoption velocity, judging throughput, and score distributions.
              </p>
            </div>
          </div>

          {/* Right Hackathon Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 self-start lg:self-center flex-shrink-0">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block pl-1">
                Hackathon
              </span>
              <div className="relative flex items-center gap-2.5 bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl px-4 py-2.5 shadow-xs hover:border-slate-300 transition-all min-w-[280px]">
                <Trophy className="w-4 h-4 text-[#EA580C] flex-shrink-0" />
                <select
                  value={selectedHackathonId}
                  onChange={(e) => setSelectedHackathonId(e.target.value)}
                  aria-label="Select Hackathon"
                  className="w-full bg-transparent border-none text-xs font-bold text-slate-900 focus:outline-none cursor-pointer appearance-none pr-6 truncate"
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
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Top KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: REGISTRATION CONVERSION */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="w-9 h-9 rounded-xl bg-[#EFF6FF] border border-[#DBEAFE] flex items-center justify-center text-[#2563EB] flex-shrink-0">
              <Users className="w-4.5 h-4.5" />
            </div>
            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">
              <ArrowUpRight className="w-3 h-3" />
              12%
            </span>
          </div>

          <div className="mt-3">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              REGISTRATION CONVERSION
            </div>
            <div className="text-3xl font-black text-slate-900 tracking-tight mt-1">
              78.4%
            </div>
          </div>

          <div className="mt-2 flex items-end justify-between">
            <span className="text-xs text-slate-500 font-normal">
              Enrolled to formed squads
            </span>
            {/* Blue Sparkline Wave */}
            <svg className="w-20 h-7 overflow-visible flex-shrink-0" viewBox="0 0 80 28" fill="none">
              <path
                d="M2 20C15 20 20 8 35 14C50 20 58 4 78 6"
                stroke="#3B82F6"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        {/* Card 2: SUBMISSION RATE */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="w-9 h-9 rounded-xl bg-[#FAF5FF] border border-[#E9D5FF] flex items-center justify-center text-[#9333EA] flex-shrink-0">
              <FileText className="w-4.5 h-4.5" />
            </div>
            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">
              <ArrowUpRight className="w-3 h-3" />
              8%
            </span>
          </div>

          <div className="mt-3">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              SUBMISSION RATE
            </div>
            <div className="text-3xl font-black text-slate-900 tracking-tight mt-1">
              68.2%
            </div>
          </div>

          <div className="mt-2 flex items-end justify-between">
            <span className="text-xs text-slate-500 font-normal">
              Squads with locked deliverables
            </span>
            {/* Purple Sparkline Wave */}
            <svg className="w-20 h-7 overflow-visible flex-shrink-0" viewBox="0 0 80 28" fill="none">
              <path
                d="M2 22C14 22 22 10 38 18C52 24 60 8 78 10"
                stroke="#A855F7"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        {/* Card 3: JUDGING VELOCITY */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="w-9 h-9 rounded-xl bg-[#FFF7ED] border border-[#FFEDD5] flex items-center justify-center text-[#EA580C] flex-shrink-0">
              <Scale className="w-4.5 h-4.5" />
            </div>
            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">
              <ArrowUpRight className="w-3 h-3" />
              18%
            </span>
          </div>

          <div className="mt-3">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              JUDGING VELOCITY
            </div>
            <div className="text-3xl font-black text-slate-900 tracking-tight mt-1">
              92.5%
            </div>
          </div>

          <div className="mt-2 flex items-end justify-between">
            <span className="text-xs text-slate-500 font-normal">
              Rubric evaluations completed
            </span>
            {/* Orange Sparkline Wave */}
            <svg className="w-20 h-7 overflow-visible flex-shrink-0" viewBox="0 0 80 28" fill="none">
              <path
                d="M2 24C16 24 24 16 40 18C54 20 62 6 78 8"
                stroke="#F97316"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        {/* Card 4: CONSENSUS INDEX */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="w-9 h-9 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] flex items-center justify-center text-[#059669] flex-shrink-0">
              <Sparkles className="w-4.5 h-4.5" />
            </div>
            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">
              <ArrowUpRight className="w-3 h-3" />
              6%
            </span>
          </div>

          <div className="mt-3">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              CONSENSUS INDEX
            </div>
            <div className="text-3xl font-black text-slate-900 tracking-tight mt-1">
              0.88 r
            </div>
          </div>

          <div className="mt-2 flex items-end justify-between">
            <span className="text-xs text-slate-500 font-normal">
              Human-AI correlation alignment
            </span>
            {/* Green Sparkline Wave */}
            <svg className="w-20 h-7 overflow-visible flex-shrink-0" viewBox="0 0 80 28" fill="none">
              <path
                d="M2 22C14 22 24 18 38 12C50 6 62 14 78 8"
                stroke="#10B981"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Main 2-Column Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (7 of 12 cols): Builder Conversion Funnel + Key Insights */}
        <div className="lg:col-span-6 space-y-6">
          {/* Builder Conversion Funnel Card */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-[#2563EB]">
                  <TrendingUp className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-900">
                    Builder Conversion Funnel
                  </h2>
                  <p className="text-xs text-slate-500">
                    End-to-end participant journey from registration to final submission.
                  </p>
                </div>
              </div>

              {/* Timeframe Filter Dropdown */}
              <div className="relative inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50/80 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-700 shadow-xs cursor-pointer hover:bg-slate-100 transition-colors self-start sm:self-auto">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{timeframe}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
              </div>
            </div>

            {/* Funnel Steps */}
            <div className="space-y-4 pt-1">
              {funnelStages.map((stage) => {
                const IconComponent = stage.icon;
                return (
                  <div key={stage.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-7 h-7 rounded-lg ${stage.iconBg} flex items-center justify-center flex-shrink-0`}>
                          <IconComponent className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <span className="font-bold text-slate-800 text-xs sm:text-sm block">
                            {stage.label}
                          </span>
                          <span className="text-[11px] text-slate-400 font-normal">
                            {stage.desc}
                          </span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 flex items-baseline gap-3">
                        <span className="text-xs sm:text-sm font-black text-slate-900 font-sans">
                          {stage.count}
                        </span>
                        <span className="text-xs font-extrabold text-slate-900 w-10 text-right">
                          {stage.pct}%
                        </span>
                      </div>
                    </div>
                    {/* Horizontal Rounded Progress Bar */}
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${stage.color} transition-all duration-700`}
                        style={{ width: `${stage.pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Key Insights Card */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center space-x-2.5 pb-2">
              <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center text-[#EA580C]">
                <Lightbulb className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Key Insights
                </h3>
                <p className="text-[11px] text-slate-500">
                  AI-powered insights from event data and participant behavior.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Tile 1 */}
              <div className="bg-slate-50/60 border border-slate-100 rounded-xl p-3.5 flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#ECFDF5] text-[#059669] flex items-center justify-center flex-shrink-0">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">+12%</div>
                  <div className="text-[11px] text-slate-500 leading-tight mt-0.5">
                    Higher team formation rate compared to previous event
                  </div>
                </div>
              </div>

              {/* Tile 2 */}
              <div className="bg-slate-50/60 border border-slate-100 rounded-xl p-3.5 flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#FAF5FF] text-[#9333EA] flex items-center justify-center flex-shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Top Performing Track</div>
                  <div className="text-[11px] text-slate-500 leading-tight mt-0.5">
                    Enterprise AI &amp; Autonomous Systems (86 teams)
                  </div>
                </div>
              </div>

              {/* Tile 3 */}
              <div className="bg-slate-50/60 border border-slate-100 rounded-xl p-3.5 flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center flex-shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Avg. Time to Submit</div>
                  <div className="text-[11px] text-slate-500 leading-tight mt-0.5">
                    <span className="font-semibold text-slate-800">3.6 days</span>
                    <span className="text-[#059669] font-medium ml-1">↓ 18% faster</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (6 of 12 cols): Track Participation Volume & Track Details */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center text-[#9333EA]">
                  <BarChart3 className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-900">
                    Track Participation Volume
                  </h2>
                  <p className="text-xs text-slate-500">
                    Team distribution across tracks and problem statements.
                  </p>
                </div>
              </div>

              {/* View Mode Dropdown */}
              <div className="relative inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50/80 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-700 shadow-xs cursor-pointer hover:bg-slate-100 transition-colors self-start sm:self-auto">
                <span>{volumeMetric}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
              </div>
            </div>

            {/* Vertical Bar Chart */}
            <div className="pt-2 pb-4">
              <div className="flex items-end gap-3 h-52 relative">
                {/* Left Y-Axis */}
                <div className="flex flex-col justify-between h-40 text-[10px] font-bold text-slate-400 pr-2 border-r border-slate-100 flex-shrink-0 text-right w-8">
                  <span>100</span>
                  <span>75</span>
                  <span>50</span>
                  <span>25</span>
                  <span>0</span>
                </div>

                {/* Y-axis label */}
                <div className="absolute -left-6 top-1/2 -translate-y-1/2 -rotate-90 text-[10px] font-bold text-slate-400 tracking-wider">
                  Teams
                </div>

                {/* Background grid lines */}
                <div className="absolute inset-x-8 top-2 bottom-12 flex flex-col justify-between pointer-events-none opacity-40">
                  <div className="border-b border-dashed border-slate-200 w-full" />
                  <div className="border-b border-dashed border-slate-200 w-full" />
                  <div className="border-b border-dashed border-slate-200 w-full" />
                  <div className="border-b border-dashed border-slate-200 w-full" />
                  <div className="border-b border-slate-200 w-full" />
                </div>

                {/* 4 Bars */}
                <div className="grid grid-cols-4 gap-2 sm:gap-4 flex-1 h-full items-end z-10 pl-2">
                  {tracksList.map((track) => (
                    <div key={track.id} className="flex flex-col items-center h-full justify-end group">
                      {/* Count number label on top of bar */}
                      <span className="text-xs font-black text-slate-800 mb-1 group-hover:text-blue-600 transition-colors">
                        {track.teams}
                      </span>
                      {/* Bar fill */}
                      <div className="w-full max-w-[58px] bg-slate-100 rounded-t-xl overflow-hidden flex items-end h-36">
                        <div
                          className={`w-full bg-gradient-to-t ${track.colorGradient} rounded-t-xl transition-all duration-700 group-hover:opacity-90 shadow-sm`}
                          style={{ height: `${(track.teams / 100) * 100}%` }}
                        />
                      </div>
                      {/* X-axis track title label */}
                      <span className="text-[10px] sm:text-[11px] font-semibold text-slate-600 text-center line-clamp-2 leading-tight mt-2.5 max-w-[100px] h-8 flex items-center justify-center">
                        {track.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Track Details List */}
            <div className="pt-2 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                  Track Details
                </h3>
                <Link
                  href="/organizer/hackathons"
                  className="text-xs font-bold text-[#2563EB] hover:text-blue-700 flex items-center gap-1 transition-colors"
                >
                  <span>View All Tracks</span>
                  <span className="text-sm">&rarr;</span>
                </Link>
              </div>

              <div className="space-y-2">
                {tracksList.map((track) => {
                  const Icon = track.icon;
                  return (
                    <div
                      key={track.id}
                      className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-100/90 hover:border-slate-200 hover:bg-slate-50 transition-all flex items-center justify-between cursor-pointer group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-8 h-8 rounded-xl ${track.bgLight} ${track.textColor} flex items-center justify-center flex-shrink-0`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-slate-800 text-xs sm:text-sm group-hover:text-blue-600 transition-colors truncate">
                          {track.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 pl-2">
                        <span className="text-xs text-slate-500 font-medium">
                          <strong className="text-slate-800 font-bold">{track.teams} teams</strong> &bull; {track.problemCount} problem statement{track.problemCount !== 1 ? 's' : ''}
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
