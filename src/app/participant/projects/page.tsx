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
  Code2,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

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

  const teamsWithoutProject = teams.filter(
    (t) => !projects.some((p) => p.teamId === t.id)
  );

  const selectedTrack = tracks.find((t) => t.id === selectedTrackId);

  return (
    <div className="space-y-6 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-[#E2E8F0]">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-bold text-[#2563EB] bg-[#EFF6FF] px-2.5 py-0.5 rounded-full border border-[#BFDBFE]">
              Project Workspaces
            </span>
            <span className="text-[11px] font-semibold text-[#64748B]">
              {projects.length} Registered Project{projects.length === 1 ? '' : 's'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#111827] mt-1 tracking-tight">
            My Projects & Artifacts
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-0.5 font-normal">
            Manage your solution artifacts, challenge track alignments, deliverable links, and submission readiness.
          </p>
        </div>

        {teamsWithoutProject.length > 0 && (
          <Button
            variant="primary"
            size="md"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setShowCreateModal(!showCreateModal)}
          >
            {showCreateModal ? 'Close Form' : 'Start New Project'}
          </Button>
        )}
      </div>

      {/* Alerts */}
      {message && (
        <div
          className={`p-4 rounded-[12px] text-xs font-medium flex items-center shadow-xs ${
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
          {message.text}
        </div>
      )}

      {/* Create Project Collapsible Form */}
      {showCreateModal && teamsWithoutProject.length > 0 && (
        <div className="bg-white border-2 border-[#BFDBFE] rounded-[18px] p-6 sm:p-8 shadow-card space-y-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#111827]">Create Team Project Workspace</h2>
              <p className="text-xs text-[#64748B]">
                Configure target track, problem statement, and deliverable artifacts for evaluation.
              </p>
            </div>
          </div>

          <form onSubmit={handleCreateProject} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-[#334155] block mb-1">
                  Target Team *
                </label>
                <select
                  value={selectedTeamId}
                  onChange={(e) => handleTeamChange(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[11px] text-xs font-medium text-[#111827]"
                  required
                >
                  {teamsWithoutProject.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.hackathon.title})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-[#334155] block mb-1">
                  Challenge Track *
                </label>
                <select
                  value={selectedTrackId}
                  onChange={(e) => handleTrackChange(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[11px] text-xs font-medium text-[#111827]"
                  required
                >
                  {tracks.map((tr) => (
                    <option key={tr.id} value={tr.id}>
                      {tr.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-[#334155] block mb-1">
                  Problem Statement *
                </label>
                <select
                  value={selectedProblemId}
                  onChange={(e) => setSelectedProblemId(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[11px] text-xs font-medium text-[#111827]"
                  required
                >
                  {selectedTrack?.problemStatements?.map((ps: any) => (
                    <option key={ps.id} value={ps.id}>
                      [{ps.code}] {ps.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-[#334155] block mb-1">
                  Project Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. SentinelShield AI"
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[11px] text-xs font-medium text-[#111827]"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#334155] block mb-1">
                  Tagline (One-sentence summary)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Autonomous multi-agent threat neutralization platform"
                  value={projectTagline}
                  onChange={(e) => setProjectTagline(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[11px] text-xs font-medium text-[#111827]"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-[#334155] block mb-1">
                Project Description * (min 20 characters)
              </label>
              <textarea
                rows={3}
                placeholder="Explain the solution architecture, core innovations, and real-world impact..."
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[11px] text-xs font-medium text-[#111827]"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-[#334155] block mb-1">
                  GitHub Repository URL *
                </label>
                <input
                  type="url"
                  placeholder="https://github.com/org/repo"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[11px] text-xs font-mono text-[#111827]"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#334155] block mb-1">
                  Live Demo / Deployment URL
                </label>
                <input
                  type="url"
                  placeholder="https://my-app.vercel.app"
                  value={demoUrl}
                  onChange={(e) => setDemoUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[11px] text-xs font-mono text-[#111827]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-[#334155] block mb-1">
                  Demo Video URL
                </label>
                <input
                  type="url"
                  placeholder="https://youtube.com/watch?v=..."
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[11px] text-xs font-mono text-[#111827]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#334155] block mb-1">
                  Documentation URL
                </label>
                <input
                  type="url"
                  placeholder="https://docs.my-project.com"
                  value={documentationUrl}
                  onChange={(e) => setDocumentationUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[11px] text-xs font-mono text-[#111827]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#334155] block mb-1">
                  Tech Stack (comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="Next.js, TypeScript, Prisma, Claude"
                  value={techStackInput}
                  onChange={(e) => setTechStackInput(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[11px] text-xs text-[#111827]"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end space-x-2">
              <Button
                variant="secondary"
                size="md"
                type="button"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                type="submit"
                disabled={submitting}
              >
                {submitting ? 'Creating Workspace...' : 'Initialize Project Workspace'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Projects List */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-16 text-center text-xs text-[#64748B]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2563EB] mx-auto mb-2" />
            Loading project workspaces...
          </div>
        ) : projects.length === 0 ? (
          <div className="bg-white border border-[#E2E8F0] rounded-[18px] p-12 text-center space-y-3 shadow-card max-w-lg mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center mx-auto">
              <FolderKanban className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#111827]">No Projects Created Yet</h3>
            <p className="text-xs text-[#64748B] leading-relaxed">
              {teams.length === 0
                ? 'Join or create a team first to begin building your project.'
                : 'Click "Start New Project" above to create your solution workspace.'}
            </p>
            {teams.length === 0 && (
              <div className="pt-2">
                <Link href="/participant/teams">
                  <Button variant="primary" size="sm">
                    Manage Teams →
                  </Button>
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {projects.map((proj) => {
              const latestSub = proj.submissions?.[0];
              const isLocked = latestSub?.status === 'LOCKED';

              return (
                <div
                  key={proj.id}
                  className="bg-white border border-[#E2E8F0] rounded-[18px] p-6 sm:p-7 shadow-card space-y-5 hover:border-[#CBD5E1] transition-all"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
                          {proj.hackathon.title}
                        </span>
                        <span
                          className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                            isLocked
                              ? 'bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]'
                              : 'bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]'
                          }`}
                        >
                          {isLocked ? '🔒 Submitted & Locked' : 'Draft Workspace'}
                        </span>
                      </div>
                      <h2 className="text-xl font-bold text-[#111827]">{proj.title}</h2>
                      {proj.tagline && (
                        <p className="text-xs text-[#64748B]">{proj.tagline}</p>
                      )}
                    </div>

                    <Link href={`/participant/projects/${proj.id}`}>
                      <Button variant="primary" size="sm" icon={<ExternalLink className="w-3.5 h-3.5" />}>
                        Open Workspace →
                      </Button>
                    </Link>
                  </div>

                  {/* Metadata Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
                      <span className="text-[10px] font-bold text-[#64748B] uppercase block">Team</span>
                      <span className="font-bold text-[#111827]">{proj.team.name}</span>
                    </div>

                    <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
                      <span className="text-[10px] font-bold text-[#64748B] uppercase block">Track</span>
                      <span className="font-bold text-[#111827]">{proj.track?.title}</span>
                    </div>

                    <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
                      <span className="text-[10px] font-bold text-[#64748B] uppercase block">Problem</span>
                      <span className="font-bold text-[#111827] truncate block">
                        [{proj.problemStatement?.code}] {proj.problemStatement?.title}
                      </span>
                    </div>
                  </div>

                  {/* Artifact Links Strip */}
                  <div className="pt-2 flex flex-wrap items-center gap-3 text-xs">
                    {proj.repoUrl && (
                      <a
                        href={proj.repoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center px-3 py-1.5 rounded-lg bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#E2E8F0] text-[#111827] font-medium transition-colors"
                      >
                        <Github className="w-3.5 h-3.5 mr-1.5 text-slate-800" />
                        Repository
                      </a>
                    )}

                    {proj.demoUrl && (
                      <a
                        href={proj.demoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center px-3 py-1.5 rounded-lg bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#E2E8F0] text-[#2563EB] font-medium transition-colors"
                      >
                        <Globe className="w-3.5 h-3.5 mr-1.5" />
                        Live Demo
                      </a>
                    )}

                    {proj.videoUrl && (
                      <a
                        href={proj.videoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center px-3 py-1.5 rounded-lg bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#E2E8F0] text-[#7E22CE] font-medium transition-colors"
                      >
                        <Video className="w-3.5 h-3.5 mr-1.5" />
                        Demo Video
                      </a>
                    )}

                    {proj.documentationUrl && (
                      <a
                        href={proj.documentationUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center px-3 py-1.5 rounded-lg bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#E2E8F0] text-[#059669] font-medium transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5 mr-1.5" />
                        Docs
                      </a>
                    )}
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
