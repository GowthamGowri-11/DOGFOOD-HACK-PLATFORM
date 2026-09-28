'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  Scale,
  CheckCircle2,
  Clock,
  ExternalLink,
  Github,
  Trophy,
  ShieldCheck,
  FolderKanban,
  FileCheck,
  ArrowRight,
  Search,
  Filter,
  RefreshCw,
  ChevronDown,
  Sparkles,
  Users,
  Award,
  Layers,
  Star,
  Activity,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface TrackInfo {
  id: string;
  title: string;
  colorHex?: string;
}

interface HackathonInfo {
  id: string;
  title: string;
  slug: string;
  status: string;
  tracks?: TrackInfo[];
}

interface AssignmentItem {
  id: string;
  status: string;
  assignedAt: string;
  completedAt?: string | null;
  judge?: {
    id: string;
    hackathonId: string;
    hackathon?: {
      id: string;
      title: string;
      slug: string;
      status: string;
    };
  };
  project: {
    id: string;
    title: string;
    slug: string;
    tagline?: string | null;
    description?: string | null;
    repoUrl?: string | null;
    demoUrl?: string | null;
    techStack?: string[];
    track?: TrackInfo | null;
    problemStatement?: { id: string; title: string; code: string } | null;
    team?: { id: string; name: string } | null;
    submissions?: { versionNumber: number }[];
  };
  evaluation?: {
    id: string;
    status: string;
    rawScoreSum?: number;
    weightedScore?: number;
    submittedAt?: string | null;
  } | null;
}

export default function JudgeDashboard() {
  const [hackathons, setHackathons] = useState<HackathonInfo[]>([]);
  const [selectedHackathonId, setSelectedHackathonId] = useState<string>('all');
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'COMPLETED'>('ALL');
  const [selectedTrack, setSelectedTrack] = useState<string>('ALL');

  // Dynamic Data Fetch
  const loadDashboardData = useCallback(async (hackathonIdToFetch?: string, isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const activeHackathon = hackathonIdToFetch !== undefined ? hackathonIdToFetch : selectedHackathonId;
      const params = new URLSearchParams();
      if (activeHackathon && activeHackathon !== 'all') {
        params.append('hackathonId', activeHackathon);
      }

      const res = await fetch(`/api/v1/judge/assignments?${params.toString()}`);
      const data = await res.json();

      if (res.ok && data.data) {
        if (data.data.hackathons && data.data.hackathons.length > 0) {
          setHackathons(data.data.hackathons);
        }
        setAssignments(data.data.assignments || []);
      }
    } catch (err) {
      console.error('Failed to load judge assignments', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedHackathonId]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleHackathonChange = (newHackathonId: string) => {
    setSelectedHackathonId(newHackathonId);
    setSelectedTrack('ALL');
    loadDashboardData(newHackathonId);
  };

  // Extract available tracks dynamically based on selected hackathon
  const availableTracks = useMemo(() => {
    const trackMap = new Map<string, TrackInfo>();

    if (selectedHackathonId !== 'all') {
      const currentH = hackathons.find((h) => h.id === selectedHackathonId);
      if (currentH?.tracks) {
        currentH.tracks.forEach((t) => trackMap.set(t.id, t));
      }
    }

    // Also collect from actual assignments
    assignments.forEach((a) => {
      if (a.project.track) {
        trackMap.set(a.project.track.id, a.project.track);
      }
    });

    return Array.from(trackMap.values());
  }, [hackathons, selectedHackathonId, assignments]);

  // Dynamic Calculations & KPIs
  const totalAssigned = assignments.length;
  const completedAssignments = assignments.filter((a) => a.evaluation?.status === 'SUBMITTED');
  const completedCount = completedAssignments.length;
  const pendingCount = totalAssigned - completedCount;
  const draftCount = assignments.filter((a) => a.evaluation?.status === 'DRAFT').length;

  const completionRate = totalAssigned > 0 ? Math.round((completedCount / totalAssigned) * 100) : 0;

  const averageScoreGiven = useMemo(() => {
    if (completedAssignments.length === 0) return null;
    const sum = completedAssignments.reduce(
      (acc, curr) => acc + (curr.evaluation?.weightedScore || 0),
      0
    );
    return (sum / completedAssignments.length).toFixed(1);
  }, [completedAssignments]);

  // Filtered List
  const filteredAssignments = useMemo(() => {
    return assignments.filter((a) => {
      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = a.project.title.toLowerCase().includes(q);
        const matchTeam = a.project.team?.name.toLowerCase().includes(q);
        const matchCode = a.project.problemStatement?.code.toLowerCase().includes(q);
        const matchPsTitle = a.project.problemStatement?.title.toLowerCase().includes(q);
        const matchTrack = a.project.track?.title.toLowerCase().includes(q);
        if (!matchTitle && !matchTeam && !matchCode && !matchPsTitle && !matchTrack) {
          return false;
        }
      }

      // Status Filter
      const isCompleted = a.evaluation?.status === 'SUBMITTED';
      if (statusFilter === 'COMPLETED' && !isCompleted) return false;
      if (statusFilter === 'PENDING' && isCompleted) return false;

      // Track Filter
      if (selectedTrack !== 'ALL' && a.project.track?.id !== selectedTrack) {
        return false;
      }

      return true;
    });
  }, [assignments, searchQuery, statusFilter, selectedTrack]);

  return (
    <div className="space-y-8 select-none pb-12">
      {/* 1. Header: My Judging & Live Hackathon Selector */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5 pb-6 border-b border-[#E2E8F0]">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-[#64748B] mb-1.5">
            <span className="flex items-center">
              <Scale className="w-3.5 h-3.5 mr-1 text-[#2563EB]" /> Judge Evaluation Workspace
            </span>
            <span>•</span>
            <Badge variant="emerald" icon={<ShieldCheck className="w-3 h-3" />}>
              Strict Isolation Active
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-tight">
            My Judging Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-0.5 max-w-2xl leading-relaxed">
            Evaluate assigned project deliverables against calibrated rubric criteria. Peer evaluations and jury deltas remain strictly confidential.
          </p>
        </div>

        {/* Dynamic Hackathon Event Selector & Refresh */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-72">
            <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-1">
              Active Hackathon Event
            </label>
            <div className="relative">
              <select
                value={selectedHackathonId}
                onChange={(e) => handleHackathonChange(e.target.value)}
                className="w-full appearance-none bg-white border border-[#CBD5E1] hover:border-[#94A3B8] focus:border-[#2563EB] rounded-xl px-3.5 py-2.5 pr-9 text-xs sm:text-sm font-bold text-[#0F172A] shadow-sm focus:outline-none transition-colors cursor-pointer"
              >
                <option value="all">All Hackathon Events ({totalAssigned} assigned)</option>
                {hackathons.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.title} [{h.status}]
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-[#64748B] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div className="self-end">
            <Button
              variant="outline"
              size="md"
              icon={<RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />}
              onClick={() => loadDashboardData(selectedHackathonId, true)}
              disabled={refreshing || loading}
            >
              Sync
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Top Metric KPI Cards (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Assigned */}
        <div className="bg-white border border-[#E2E8F0] rounded-[16px] p-5 shadow-card hover:border-[#CBD5E1] transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">
              Total Assigned
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center">
              <FolderKanban className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-black text-[#111827]">{totalAssigned}</span>
            <span className="text-xs font-semibold text-[#64748B]">projects</span>
          </div>
          <div className="mt-2 text-[11px] text-[#64748B]">
            In selected judging queue
          </div>
        </div>

        {/* KPI 2: Pending Evaluations */}
        <div className="bg-white border border-[#E2E8F0] rounded-[16px] p-5 shadow-card hover:border-[#CBD5E1] transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">
              Pending Review
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-black text-[#D97706]">{pendingCount}</span>
            {draftCount > 0 && (
              <span className="text-xs font-semibold text-[#B45309]">
                ({draftCount} in draft)
              </span>
            )}
          </div>
          <div className="mt-2 text-[11px] text-[#64748B]">
            Awaiting final rubric submission
          </div>
        </div>

        {/* KPI 3: Completed Reviews */}
        <div className="bg-white border border-[#E2E8F0] rounded-[16px] p-5 shadow-card hover:border-[#CBD5E1] transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">
              Evaluations Completed
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-black text-[#16A34A]">{completedCount}</span>
            <span className="text-xs font-semibold text-[#64748B]">/ {totalAssigned}</span>
          </div>
          <div className="mt-2 text-[11px] text-[#64748B]">
            Submitted and locked evaluations
          </div>
        </div>

        {/* KPI 4: Average Score Awarded */}
        <div className="bg-white border border-[#E2E8F0] rounded-[16px] p-5 shadow-card hover:border-[#CBD5E1] transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">
              Avg Score Given
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#F3E8FF] text-[#9333EA] flex items-center justify-center">
              <Star className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-black text-[#111827]">
              {averageScoreGiven !== null ? averageScoreGiven : '—'}
            </span>
            {averageScoreGiven !== null && (
              <span className="text-xs font-semibold text-[#64748B]">/ 100</span>
            )}
          </div>
          <div className="mt-2 text-[11px] text-[#64748B]">
            {completedCount > 0 ? `Across ${completedCount} peer review(s)` : 'No evaluations submitted yet'}
          </div>
        </div>
      </div>

      {/* 3. Progress Meter Bar */}
      <div className="bg-white border border-[#E2E8F0] rounded-[16px] p-5 shadow-card space-y-2.5">
        <div className="flex justify-between items-center text-xs font-semibold text-[#334155]">
          <div className="flex items-center space-x-2">
            <span>Evaluation Queue Progress</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EFF6FF] text-[#2563EB]">
              {completionRate}% Completed
            </span>
          </div>
          <span className="text-[#64748B]">
            {completedCount} of {totalAssigned} evaluated ({pendingCount} pending)
          </span>
        </div>
        <div className="w-full bg-[#F1F5F9] rounded-full h-3 overflow-hidden">
          <div
            className="bg-[#2563EB] h-3 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${completionRate}%` }}
          />
        </div>
      </div>

      {/* 4. Search and Filter Bar */}
      <div className="bg-white border border-[#E2E8F0] rounded-[16px] p-4 shadow-card space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by project name, team, track, or problem statement code..."
              className="w-full pl-10 pr-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#CBD5E1] focus:border-[#2563EB] focus:bg-white rounded-xl text-xs sm:text-sm text-[#111827] placeholder-[#94A3B8] focus:outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#94A3B8] hover:text-[#475569] font-medium"
              >
                Clear
              </button>
            )}
          </div>

          {/* Track Filter Dropdown */}
          {availableTracks.length > 0 && (
            <div className="flex items-center space-x-2">
              <label className="text-xs font-semibold text-[#64748B] whitespace-nowrap">Track:</label>
              <select
                value={selectedTrack}
                onChange={(e) => setSelectedTrack(e.target.value)}
                className="px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs font-semibold text-[#334155] focus:outline-none focus:border-[#2563EB]"
              >
                <option value="ALL">All Tracks ({availableTracks.length})</option>
                {availableTracks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center space-x-2 pt-2 border-t border-[#F1F5F9] overflow-x-auto">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
              statusFilter === 'ALL'
                ? 'bg-[#2563EB] text-white shadow-sm'
                : 'bg-[#F8FAFC] text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#111827]'
            }`}
          >
            <span>All Queue</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              statusFilter === 'ALL' ? 'bg-white/20 text-white' : 'bg-[#E2E8F0] text-[#475569]'
            }`}>
              {totalAssigned}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter('PENDING')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
              statusFilter === 'PENDING'
                ? 'bg-[#D97706] text-white shadow-sm'
                : 'bg-[#F8FAFC] text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#111827]'
            }`}
          >
            <span>Pending Evaluation</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              statusFilter === 'PENDING' ? 'bg-white/20 text-white' : 'bg-[#FEF3C7] text-[#B45309]'
            }`}>
              {pendingCount}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter('COMPLETED')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
              statusFilter === 'COMPLETED'
                ? 'bg-[#16A34A] text-white shadow-sm'
                : 'bg-[#F8FAFC] text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#111827]'
            }`}
          >
            <span>Evaluations Completed</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              statusFilter === 'COMPLETED' ? 'bg-white/20 text-white' : 'bg-[#DCFCE7] text-[#15803D]'
            }`}>
              {completedCount}
            </span>
          </button>

          {(searchQuery || statusFilter !== 'ALL' || selectedTrack !== 'ALL') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('ALL');
                setSelectedTrack('ALL');
              }}
              className="text-xs font-semibold text-[#2563EB] hover:underline px-2 ml-auto"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* 5. Assigned Projects Queue */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#111827]">
            Assigned Projects ({filteredAssignments.length})
          </h2>
          <Link
            href="/judge/assignments"
            className="text-xs font-semibold text-[#2563EB] hover:underline flex items-center"
          >
            Open Full Assignments Matrix <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3.5 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-36 bg-slate-100 rounded-[16px]" />
            ))}
          </div>
        ) : filteredAssignments.length === 0 ? (
          <div className="bg-white border border-[#E2E8F0] rounded-[16px] p-12 text-center shadow-card space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center mx-auto">
              <Scale className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-[#111827]">No assignments found</h3>
              <p className="text-xs text-[#64748B] max-w-md mx-auto">
                {searchQuery || statusFilter !== 'ALL' || selectedTrack !== 'ALL'
                  ? 'No assigned submissions match your current filters. Try changing or clearing your search filters.'
                  : 'You do not have any active project evaluation assignments for this event yet.'}
              </p>
            </div>
            {(searchQuery || statusFilter !== 'ALL' || selectedTrack !== 'ALL') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('ALL');
                  setSelectedTrack('ALL');
                }}
              >
                Reset Filters
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3.5">
            {filteredAssignments.map((a) => {
              const isCompleted = a.evaluation?.status === 'SUBMITTED';
              const isDraft = a.evaluation?.status === 'DRAFT';
              const trackColor = a.project.track?.colorHex || '#2563EB';

              return (
                <div
                  key={a.id}
                  className="bg-white border border-[#E2E8F0] hover:border-[#93C5FD] rounded-[16px] p-5 sm:p-6 shadow-card transition-all duration-150 flex flex-col md:flex-row justify-between items-start md:items-center gap-5"
                >
                  <div className="space-y-2.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {a.project.track && (
                        <span
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border"
                          style={{
                            backgroundColor: `${trackColor}15`,
                            color: trackColor,
                            borderColor: `${trackColor}30`,
                          }}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full mr-1.5"
                            style={{ backgroundColor: trackColor }}
                          />
                          {a.project.track.title}
                        </span>
                      )}

                      {isCompleted ? (
                        <Badge variant="emerald" icon={<CheckCircle2 className="w-3 h-3" />}>
                          Evaluated ({a.evaluation?.weightedScore} / 100)
                        </Badge>
                      ) : isDraft ? (
                        <Badge variant="amber" icon={<Clock className="w-3 h-3" />}>
                          Draft in Progress ({a.evaluation?.weightedScore || 0} pts)
                        </Badge>
                      ) : (
                        <Badge variant="blue" icon={<Clock className="w-3 h-3" />}>
                          Pending Evaluation
                        </Badge>
                      )}

                      {a.project.problemStatement && (
                        <span className="text-[11px] font-semibold text-[#475569] bg-[#F1F5F9] px-2 py-0.5 rounded-md border border-[#E2E8F0]">
                          [{a.project.problemStatement.code}]
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-bold text-[#111827] truncate leading-snug">
                      {a.project.title}
                    </h3>

                    {a.project.tagline && (
                      <p className="text-xs text-[#475569] line-clamp-1">
                        {a.project.tagline}
                      </p>
                    )}

                    <div className="text-xs text-[#64748B] flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span>
                        Team: <strong className="text-[#334155]">{a.project.team?.name || 'Unnamed Team'}</strong>
                      </span>
                      {a.project.problemStatement && (
                        <span>
                          • Problem: <strong>{a.project.problemStatement.title}</strong>
                        </span>
                      )}
                      {a.judge?.hackathon && (
                        <span>
                          • Event: <strong>{a.judge.hackathon.title}</strong>
                        </span>
                      )}
                    </div>

                    {/* Tech Stack Pills */}
                    {a.project.techStack && a.project.techStack.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {a.project.techStack.slice(0, 4).map((tech) => (
                          <span
                            key={tech}
                            className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-[#F8FAFC] text-[#475569] border border-[#E2E8F0]"
                          >
                            {tech}
                          </span>
                        ))}
                        {a.project.techStack.length > 4 && (
                          <span className="px-1.5 py-0.5 rounded-md text-[10px] font-semibold text-[#94A3B8] bg-[#F1F5F9]">
                            +{a.project.techStack.length - 4}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Deliverable Links */}
                    <div className="flex items-center space-x-4 text-xs pt-0.5">
                      {a.project.repoUrl && (
                        <a
                          href={a.project.repoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center text-[#2563EB] hover:underline font-semibold"
                        >
                          <Github className="w-3.5 h-3.5 mr-1" />
                          Source Repo
                          <ExternalLink className="w-3 h-3 ml-1 opacity-70" />
                        </a>
                      )}
                      {a.project.demoUrl && (
                        <a
                          href={a.project.demoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center text-[#059669] hover:underline font-semibold"
                        >
                          <ExternalLink className="w-3.5 h-3.5 mr-1" />
                          Live Demo
                          <ExternalLink className="w-3 h-3 ml-1 opacity-70" />
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="flex-shrink-0 flex flex-col items-start md:items-end gap-2">
                    <span className="text-[11px] text-[#64748B]">
                      Assigned {new Date(a.assignedAt).toLocaleDateString()}
                    </span>
                    <Link href={`/judge/assignments/${a.id}`}>
                      <Button
                        variant={isCompleted ? 'outline' : isDraft ? 'secondary' : 'primary'}
                        size="md"
                        icon={
                          isCompleted ? (
                            <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
                          ) : (
                            <Scale className="w-4 h-4" />
                          )
                        }
                      >
                        {isCompleted ? 'Review Score' : isDraft ? 'Resume Draft' : 'Evaluate'}
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
