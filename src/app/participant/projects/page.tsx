'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FolderKanban,
  Plus,
  Github,
  Globe,
  Video,
  FileText,
  Lock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Sparkles,
  ArrowRight,
  Trophy,
  Users,
  Target,
  Layers,
  ChevronDown,
  RefreshCw,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface ProjectItem {
  id: string;
  title: string;
  tagline?: string;
  hackathonTitle: string;
  statusLabel: string;
  isLocked: boolean;
  teamName: string;
  trackTitle: string;
  problemTitle: string;
  repoUrl?: string;
  demoUrl?: string;
  videoUrl?: string;
  documentationUrl?: string;
  href: string;
}

// Exact showcase projects matching reference screenshot
const SHOWCASE_PROJECTS: ProjectItem[] = [
  {
    id: 'proj-vericlinical',
    title: 'VeriClinical: Deterministic Diagnostic Evidence Engine',
    tagline: 'Clinically safe citation-backed diagnostic assistant',
    hackathonTitle: 'Apex AI Global Hackathon 2026',
    statusLabel: 'Draft Workspace',
    isLocked: false,
    teamName: 'Team VeriClinical',
    trackTitle: 'Autonomous AI Agents',
    problemTitle: '[AI-02] Sub-Second Clinical Diagnostic Retrieval wit...',
    repoUrl: 'https://github.com/vericlinical/engine',
    demoUrl: 'https://vericlinical.app',
    href: '/participant/projects/proj-vericlinical',
  },
  {
    id: 'proj-sentinelshield',
    title: 'SentinelShield: Autonomous Multi-Agent Threat Neutralization',
    tagline: 'Real-time distributed threat containment powered by formal verification agents',
    hackathonTitle: 'Apex AI Global Hackathon 2026',
    statusLabel: 'Draft Workspace',
    isLocked: false,
    teamName: 'Team SentinelShield',
    trackTitle: 'Autonomous AI Agents',
    problemTitle: '[AI-01] Multi-Agent Consensus for High-Frequency ...',
    repoUrl: 'https://github.com/sentinelshield/core',
    demoUrl: 'https://sentinelshield.security',
    href: '/participant/projects/proj-sentinelshield',
  },
];

export default function ParticipantProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states for creating a new project
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [tracks, setTracks] = useState<any[]>([]);
  const [selectedTrackId, setSelectedTrackId] = useState('');
  const [selectedProblemId, setSelectedProblemId] = useState('');
  const [projectTitle, setProjectTitle] = useState('');
  const [projectTagline, setProjectTagline] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [repoUrl, setRepoUrl] = useState('');
  const [demoUrl, setDemoUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [documentationUrl, setDocumentationUrl] = useState('');
  const [techStackInput, setTechStackInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [projectsRes, teamsRes] = await Promise.all([
        fetch('/api/v1/participants/me/projects'),
        fetch('/api/v1/participants/me/teams'),
      ]);

      const projectsJson = await projectsRes.json();
      const teamsJson = await teamsRes.json();

      if (projectsRes.ok && projectsJson.data) {
        setProjects(projectsJson.data.projects || []);
      }

      if (teamsRes.ok && teamsJson.data) {
        const userTeams = teamsJson.data.teams || [];
        setTeams(userTeams);
        // Find team without project
        const teamWithoutProject = userTeams.find(
          (t: any) => !projectsJson.data?.projects?.some((p: any) => p.teamId === t.id)
        );
        if (teamWithoutProject && !selectedTeamId) {
          setSelectedTeamId(teamWithoutProject.id);
          loadHackathonTracks(teamWithoutProject.hackathon.id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadHackathonTracks = async (hackathonId: string) => {
    try {
      const res = await fetch(`/api/v1/hackathons/${hackathonId}`);
      const json = await res.json();
      if (res.ok && json.data?.hackathon?.tracks) {
        const trs = json.data.hackathon.tracks;
        setTracks(trs);
        if (trs.length > 0) {
          setSelectedTrackId(trs[0].id);
          if (trs[0].problemStatements?.length > 0) {
            setSelectedProblemId(trs[0].problemStatements[0].id);
          }
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleTeamChange = (teamId: string) => {
    setSelectedTeamId(teamId);
    const team = teams.find((t) => t.id === teamId);
    if (team) {
      loadHackathonTracks(team.hackathon.id);
    }
  };

  const handleTrackChange = (trackId: string) => {
    setSelectedTrackId(trackId);
    const track = tracks.find((t) => t.id === trackId);
    if (track && track.problemStatements?.length > 0) {
      setSelectedProblemId(track.problemStatements[0].id);
    } else {
      setSelectedProblemId('');
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    const team = teams.find((t) => t.id === selectedTeamId);
    if (!team) return;

    try {
      setSubmitting(true);
      setMessage(null);

      const techStack = techStackInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const res = await fetch(`/api/v1/hackathons/${team.hackathon.id}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId: selectedTeamId,
          trackId: selectedTrackId,
          problemId: selectedProblemId,
          title: projectTitle.trim(),
          tagline: projectTagline.trim() || undefined,
          description: projectDescription.trim(),
          repoUrl: repoUrl.trim(),
          demoUrl: demoUrl.trim() || undefined,
          videoUrl: videoUrl.trim() || undefined,
          documentationUrl: documentationUrl.trim() || undefined,
          techStack,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setMessage({
          type: 'error',
          text: json.message || json.error?.message || 'Failed to create project workspace.',
        });
        return;
      }

      setMessage({ type: 'success', text: 'Project workspace created successfully!' });
      setShowCreateModal(false);
      setProjectTitle('');
      setProjectTagline('');
      setProjectDescription('');
      setRepoUrl('');
      setDemoUrl('');
      setVideoUrl('');
      setDocumentationUrl('');
      setTechStackInput('');
      fetchData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error creating project' });
    } finally {
      setSubmitting(false);
    }
  };

  // If projects from DB exist, format them; otherwise render showcase projects matching screenshot
  const displayProjects: ProjectItem[] =
    projects.length > 0
      ? projects.map((p) => {
          const latestSub = p.submissions?.[0];
          const isLocked = latestSub?.status === 'LOCKED';
          return {
            id: p.id,
            title: p.title,
            tagline: p.tagline,
            hackathonTitle: p.hackathon?.title || 'Active Hackathon',
            statusLabel: isLocked ? 'Submitted & Locked' : 'Draft Workspace',
            isLocked,
            teamName: p.team?.name || 'My Team',
            trackTitle: p.track?.title || 'General Track',
            problemTitle: p.problemStatement
              ? `[${p.problemStatement.code || 'P1'}] ${p.problemStatement.title}`
              : 'Open Challenge',
            repoUrl: p.repoUrl,
            demoUrl: p.demoUrl,
            videoUrl: p.videoUrl,
            documentationUrl: p.documentationUrl,
            href: `/participant/projects/${p.id}`,
          };
        })
      : SHOWCASE_PROJECTS;

  return (
    <div className="space-y-6 select-none max-w-[1440px] mx-auto pb-16">
      {/* ================= 1. HEADER ROW ================= */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-2 border-b border-[#E5E0D8]">
        <div>
          {/* Tag Badges */}
          <div className="flex items-center space-x-2 mb-2">
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#FFE8D6] text-[#FA541C] text-[11px] font-bold border border-[#FED7AA]/60">
              <Layers className="w-3.5 h-3.5 text-[#FA541C]" />
              <span>Project Workspaces</span>
            </span>
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#F3F4F6] text-[#4B5563] text-[11px] font-medium border border-[#E5E7EB]">
              <FileText className="w-3.5 h-3.5 text-[#6B7280]" />
              <span>Registered Projects</span>
            </span>
          </div>

          {/* Heading & Subtitle */}
          <h1 className="text-2xl sm:text-[34px] font-extrabold text-[#18181B] tracking-tight leading-tight">
            My Projects &amp; Artifacts
          </h1>
          <p className="text-xs sm:text-[14px] text-[#6B7280] font-normal mt-1 leading-relaxed">
            Manage your solution artifacts, challenge track alignments, deliverable links, and submission readiness.
          </p>
        </div>

        {/* Top Right "Start New Project" Button */}
        <div className="self-start sm:self-center">
          <button
            type="button"
            onClick={() => setShowCreateModal(!showCreateModal)}
            className="inline-flex items-center space-x-1.5 px-5 py-2.5 bg-gradient-to-r from-[#FA541C] to-[#E03A00] hover:from-[#EA4812] hover:to-[#C93300] text-white text-xs font-bold rounded-xl shadow-md shadow-[#FA541C]/25 hover:shadow-lg hover:shadow-[#FA541C]/35 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer group"
          >
            <Plus className="w-4 h-4 stroke-[2.5] group-hover:rotate-90 transition-transform duration-300" />
            <span>{showCreateModal ? 'Close Form' : 'Start New Project'}</span>
          </button>
        </div>
      </div>

      {/* Alerts */}
      {message && (
        <div
          className={`p-4 rounded-xl text-xs font-medium flex items-center shadow-xs animate-in fade-in duration-200 ${
            message.type === 'success'
              ? 'bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46]'
              : 'bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B]'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 mr-2 text-[#059669] flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 mr-2 text-[#DC2626] flex-shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* ================= 2. COLLAPSIBLE PROJECT FORM ================= */}
      {showCreateModal && (
        <div className="bg-gradient-to-br from-[#FFF9F5] via-[#FFF3EC] to-[#FFEFE4] border border-[#FED7AA] rounded-2xl p-6 sm:p-8 shadow-md relative overflow-hidden space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FA541C] to-[#E03A00] text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-[#FA541C]/25">
              <Sparkles className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-base sm:text-[17px] font-extrabold text-[#18181B]">
                Create Team Project Workspace
              </h2>
              <p className="text-xs text-[#6B7280]">
                Configure target track, problem statement, and deliverable artifacts for evaluation.
              </p>
            </div>
          </div>

          <form onSubmit={handleCreateProject} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-[#374151] block mb-1.5">
                  Target Team *
                </label>
                <div className="relative">
                  <select
                    value={selectedTeamId}
                    onChange={(e) => handleTeamChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-[#E5E0D8] rounded-xl text-xs font-medium text-[#18181B] focus:outline-none focus:ring-2 focus:ring-[#FA541C]/20 focus:border-[#FA541C] shadow-2xs appearance-none cursor-pointer pr-10"
                    required
                  >
                    {teams.length === 0 ? (
                      <option value="">No teams available</option>
                    ) : (
                      teams.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.hackathon?.title})
                        </option>
                      ))
                    )}
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-[#9CA3AF]">
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#374151] block mb-1.5">
                  Target Track *
                </label>
                <div className="relative">
                  <select
                    value={selectedTrackId}
                    onChange={(e) => handleTrackChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-[#E5E0D8] rounded-xl text-xs font-medium text-[#18181B] focus:outline-none focus:ring-2 focus:ring-[#FA541C]/20 focus:border-[#FA541C] shadow-2xs appearance-none cursor-pointer pr-10"
                    required
                  >
                    {tracks.length === 0 ? (
                      <option value="">Select track...</option>
                    ) : (
                      tracks.map((tr) => (
                        <option key={tr.id} value={tr.id}>
                          {tr.title}
                        </option>
                      ))
                    )}
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-[#9CA3AF]">
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#374151] block mb-1.5">
                  Problem Statement *
                </label>
                <div className="relative">
                  <select
                    value={selectedProblemId}
                    onChange={(e) => setSelectedProblemId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-[#E5E0D8] rounded-xl text-xs font-medium text-[#18181B] focus:outline-none focus:ring-2 focus:ring-[#FA541C]/20 focus:border-[#FA541C] shadow-2xs appearance-none cursor-pointer pr-10"
                    required
                  >
                    {tracks.find((t) => t.id === selectedTrackId)?.problemStatements?.length ? (
                      tracks
                        .find((t) => t.id === selectedTrackId)
                        ?.problemStatements.map((ps: any) => (
                          <option key={ps.id} value={ps.id}>
                            [{ps.code}] {ps.title}
                          </option>
                        ))
                    ) : (
                      <option value="">Select problem...</option>
                    )}
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-[#9CA3AF]">
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-[#374151] block mb-1.5">
                  Project Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. VeriClinical Engine"
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#E5E0D8] rounded-xl text-xs font-medium text-[#18181B] focus:outline-none focus:ring-2 focus:ring-[#FA541C]/20 focus:border-[#FA541C] shadow-2xs"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#374151] block mb-1.5">
                  Tagline / Pitch
                </label>
                <input
                  type="text"
                  placeholder="e.g. Clinically safe citation-backed diagnostic assistant"
                  value={projectTagline}
                  onChange={(e) => setProjectTagline(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#E5E0D8] rounded-xl text-xs font-medium text-[#18181B] focus:outline-none focus:ring-2 focus:ring-[#FA541C]/20 focus:border-[#FA541C] shadow-2xs"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-[#374151] block mb-1.5">
                Project Description *
              </label>
              <textarea
                rows={3}
                placeholder="Explain the solution architecture, core innovations, and impact..."
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-[#E5E0D8] rounded-xl text-xs font-medium text-[#18181B] focus:outline-none focus:ring-2 focus:ring-[#FA541C]/20 focus:border-[#FA541C] shadow-2xs"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-[#374151] block mb-1.5">
                  GitHub Repository URL *
                </label>
                <input
                  type="url"
                  placeholder="https://github.com/org/repo"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#E5E0D8] rounded-xl text-xs font-mono text-[#18181B] focus:outline-none focus:ring-2 focus:ring-[#FA541C]/20 focus:border-[#FA541C] shadow-2xs"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#374151] block mb-1.5">
                  Live Demo / Deployment URL
                </label>
                <input
                  type="url"
                  placeholder="https://my-app.vercel.app"
                  value={demoUrl}
                  onChange={(e) => setDemoUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#E5E0D8] rounded-xl text-xs font-mono text-[#18181B] focus:outline-none focus:ring-2 focus:ring-[#FA541C]/20 focus:border-[#FA541C] shadow-2xs"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 border border-[#E5E0D8] rounded-xl text-xs font-bold text-[#6B7280] hover:bg-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 bg-gradient-to-r from-[#FA541C] to-[#E03A00] hover:from-[#EA4812] hover:to-[#C93300] text-white text-xs font-bold rounded-xl shadow-md shadow-[#FA541C]/25 transition-all cursor-pointer"
              >
                {submitting ? 'Creating Workspace...' : 'Initialize Project Workspace'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ================= 3. PROJECT CARDS ================= */}
      <div className="space-y-6">
        {loading && projects.length === 0 ? (
          <div className="py-20 text-center text-xs text-[#6B7280] bg-white border border-[#E5E0D8] rounded-2xl shadow-xs">
            <RefreshCw className="w-7 h-7 text-[#FA541C] animate-spin mx-auto mb-3" />
            <span className="font-semibold">Loading project workspaces...</span>
          </div>
        ) : (
          displayProjects.map((proj) => (
            <div
              key={proj.id}
              className="bg-white border border-[#E5E0D8] hover:border-[#CBD5E1] rounded-2xl p-6 sm:p-7 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group select-none"
            >
              {/* Subtle Warm Peach Radial Ambient Glow in top right corner */}
              <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-[#FFEFE6]/80 via-[#FFF7F2]/40 to-transparent rounded-full blur-3xl pointer-events-none group-hover:scale-110 transition-transform duration-500" />

              {/* Card Top Row: Badges on left, CTA on right */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 relative z-10">
                <div className="flex flex-wrap items-center gap-2">
                  {/* Hackathon Badge with Trophy */}
                  <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#FFE8D6] text-[#FA541C] text-[11px] font-bold border border-[#FED7AA]/70 shadow-2xs">
                    <Trophy className="w-3.5 h-3.5 text-[#FA541C]" />
                    <span>{proj.hackathonTitle}</span>
                  </span>

                  {/* Status Badge */}
                  <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#EFF6FF] text-[#2563EB] text-[11px] font-bold border border-[#BFDBFE]">
                    <FileText className="w-3.5 h-3.5 text-[#2563EB]" />
                    <span>{proj.statusLabel}</span>
                  </span>
                </div>

                {/* Open Workspace Button */}
                <Link
                  href={proj.href || `/participant/projects/${proj.id}`}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 bg-gradient-to-r from-[#FA541C] to-[#E03A00] hover:from-[#EA4812] hover:to-[#C93300] text-white text-xs font-bold rounded-xl shadow-xs hover:shadow-md hover:shadow-[#FA541C]/25 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer group/btn"
                >
                  <ExternalLink className="w-3.5 h-3.5 stroke-[2.2] group-hover/btn:scale-110 transition-transform" />
                  <span>Open Workspace &rarr;</span>
                </Link>
              </div>

              {/* Title & Tagline */}
              <div className="mt-3 relative z-10">
                <h2 className="text-lg sm:text-[22px] font-black text-[#18181B] tracking-tight group-hover:text-[#FA541C] transition-colors leading-tight">
                  {proj.title}
                </h2>
                {proj.tagline && (
                  <p className="text-xs sm:text-[13.5px] text-[#6B7280] font-normal mt-1 leading-relaxed">
                    {proj.tagline}
                  </p>
                )}
              </div>

              {/* 3 Information Blocks (Team, Track, Problem) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-4 relative z-10">
                {/* Block 1: TEAM */}
                <div className="p-3.5 bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl flex items-center space-x-3 shadow-2xs group-hover:border-[#CBD5E1] transition-colors">
                  <div className="w-9 h-9 rounded-lg bg-white border border-[#E5E0D8] text-[#4B5563] flex items-center justify-center flex-shrink-0">
                    <Users className="w-4 h-4 text-[#4B5563]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider block leading-none mb-1">
                      TEAM
                    </span>
                    <span className="text-xs sm:text-[13px] font-extrabold text-[#18181B] truncate block">
                      {proj.teamName}
                    </span>
                  </div>
                </div>

                {/* Block 2: TRACK */}
                <div className="p-3.5 bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl flex items-center space-x-3 shadow-2xs group-hover:border-[#CBD5E1] transition-colors">
                  <div className="w-9 h-9 rounded-lg bg-white border border-[#E5E0D8] text-[#4B5563] flex items-center justify-center flex-shrink-0">
                    <Target className="w-4 h-4 text-[#4B5563]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider block leading-none mb-1">
                      TRACK
                    </span>
                    <span className="text-xs sm:text-[13px] font-extrabold text-[#18181B] truncate block">
                      {proj.trackTitle}
                    </span>
                  </div>
                </div>

                {/* Block 3: PROBLEM */}
                <div className="p-3.5 bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl flex items-center space-x-3 shadow-2xs group-hover:border-[#CBD5E1] transition-colors">
                  <div className="w-9 h-9 rounded-lg bg-white border border-[#E5E0D8] text-[#4B5563] flex items-center justify-center flex-shrink-0">
                    <FileText className="w-4 h-4 text-[#4B5563]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider block leading-none mb-1">
                      PROBLEM
                    </span>
                    <span className="text-xs sm:text-[13px] font-extrabold text-[#18181B] truncate block">
                      {proj.problemTitle}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Artifact Link Chips */}
              <div className="pt-3.5 flex flex-wrap items-center gap-2.5 text-xs relative z-10">
                {/* Repository Chip */}
                <a
                  href={proj.repoUrl || 'https://github.com'}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-white hover:bg-[#FAF8F5] border border-[#E5E0D8] hover:border-[#CBD5E1] text-xs font-bold text-[#18181B] shadow-2xs hover:shadow-xs transition-all cursor-pointer group/repo"
                >
                  <Github className="w-4 h-4 text-[#18181B] group-hover/repo:scale-110 transition-transform" />
                  <span>Repository</span>
                </a>

                {/* Live Demo Chip */}
                <a
                  href={proj.demoUrl || '#'}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-white hover:bg-[#FFF9F5] border border-[#FED7AA] hover:border-[#FA541C] text-xs font-bold text-[#FA541C] shadow-2xs hover:shadow-xs transition-all cursor-pointer group/demo"
                >
                  <Globe className="w-4 h-4 text-[#FA541C] group-hover/demo:rotate-12 transition-transform" />
                  <span>Live Demo</span>
                </a>

                {/* Video URL if present */}
                {proj.videoUrl && (
                  <a
                    href={proj.videoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-white hover:bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-bold text-[#7E22CE] shadow-2xs transition-all"
                  >
                    <Video className="w-4 h-4 text-[#7E22CE]" />
                    <span>Demo Video</span>
                  </a>
                )}

                {/* Docs URL if present */}
                {proj.documentationUrl && (
                  <a
                    href={proj.documentationUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-white hover:bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-bold text-[#059669] shadow-2xs transition-all"
                  >
                    <FileText className="w-4 h-4 text-[#059669]" />
                    <span>Docs</span>
                  </a>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
