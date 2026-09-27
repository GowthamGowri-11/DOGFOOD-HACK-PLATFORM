'use client';

import React, { useState, useEffect } from 'react';
import { notFound, useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  FolderKanban,
  Github,
  Globe,
  Video,
  FileText,
  Lock,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  ArrowLeft,
  ShieldCheck,
  Code2,
  Clock,
  Sparkles,
  ExternalLink,
  Save,
  Send,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export default function ProjectWorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.id as string;

  const [project, setProject] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Editable fields
  const [title, setTitle] = useState('');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [repoUrl, setRepoUrl] = useState('');
  const [demoUrl, setDemoUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [documentationUrl, setDocumentationUrl] = useState('');
  const [techStackInput, setTechStackInput] = useState('');

  const fetchProject = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/v1/projects/${projectId}`);
      const json = await res.json();

      if (!res.ok || !json.data?.project) {
        setMessage({ type: 'error', text: json.message || 'Project not found or unauthorized.' });
        return;
      }

      const p = json.data.project;
      setProject(p);
      setTitle(p.title || '');
      setTagline(p.tagline || '');
      setDescription(p.description || '');
      setRepoUrl(p.repoUrl || '');
      setDemoUrl(p.demoUrl || '');
      setVideoUrl(p.videoUrl || '');
      setDocumentationUrl(p.documentationUrl || '');
      setTechStackInput(p.techStack ? p.techStack.join(', ') : '');
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Failed to load project.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchProject();
    }
  }, [projectId]);

  const handleSaveDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setMessage(null);

      const techStack = techStackInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const res = await fetch(`/api/v1/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          tagline: tagline.trim() || undefined,
          description: description.trim(),
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
          text: json.message || json.error?.message || 'Failed to update project.',
        });
        return;
      }

      setMessage({ type: 'success', text: 'Project draft saved successfully!' });
      fetchProject();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error saving project' });
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitAndLock = async () => {
    if (!confirm('Are you sure you want to finalize and lock this submission? An immutable snapshot will be generated for judging and you will not be able to make further edits.')) {
      return;
    }

    try {
      setSubmitting(true);
      setMessage(null);

      const res = await fetch(`/api/v1/projects/${projectId}/submit`, {
        method: 'POST',
      });

      const json = await res.json();
      if (!res.ok) {
        setMessage({
          type: 'error',
          text: json.message || json.error?.message || 'Submission failed.',
        });
        return;
      }

      setMessage({
        type: 'success',
        text: 'Project submitted and locked successfully! An immutable snapshot has been generated.',
      });
      fetchProject();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error submitting project' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-xs text-[#64748B]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2563EB] mx-auto mb-2" />
        Loading project workspace...
      </div>
    );
  }

  if (!project) {
    return (
      <div className="bg-white border border-[#E2E8F0] rounded-[18px] p-12 text-center space-y-3 shadow-card max-w-lg mx-auto mt-12">
        <AlertCircle className="w-12 h-12 text-[#DC2626] mx-auto" />
        <h2 className="text-base font-bold text-[#111827]">Project Workspace Unavailable</h2>
        <p className="text-xs text-[#64748B]">{message?.text || 'Project not found or access denied.'}</p>
        <div className="pt-2">
          <Link href="/participant/dashboard">
            <Button variant="primary" size="sm">
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const latestSubmission = project.latestSubmission;
  const isLocked = latestSubmission?.status === 'LOCKED' || latestSubmission?.status === 'SUBMITTED';

  // Artifact & Readiness checks
  const hasRepo = !!project.repoUrl && project.repoUrl.includes('github.com');
  const hasDescription = project.description?.length >= 20;
  const isReadyForSubmit = hasRepo && hasDescription;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 select-none">
      {/* Back navigation */}
      <div>
        <Link
          href="/participant/dashboard"
          className="inline-flex items-center text-xs font-semibold text-[#64748B] hover:text-[#2563EB] transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Participant Arena
        </Link>
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

      {/* Header Banner */}
      <div className="bg-white border border-[#E2E8F0] rounded-[20px] p-6 sm:p-8 shadow-card space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
                {project.hackathon.title}
              </span>
              <span
                className={`text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                  isLocked
                    ? 'bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]'
                    : isReadyForSubmit
                    ? 'bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]'
                    : 'bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]'
                }`}
              >
                {isLocked
                  ? '🔒 OFFICIAL SUBMISSION LOCKED'
                  : isReadyForSubmit
                  ? 'READY TO SUBMIT'
                  : 'DRAFT IN PROGRESS'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111827]">{project.title}</h1>
            <p className="text-xs sm:text-sm text-[#64748B]">
              {project.tagline || `Solution workspace for ${project.team.name}`}
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs text-[#64748B] font-semibold">
              Team: <strong className="text-[#111827]">{project.team.name}</strong>
            </span>
          </div>
        </div>

        {/* Lock Notice */}
        {isLocked && latestSubmission && (
          <div className="p-4 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46] text-xs space-y-1">
            <div className="flex items-center space-x-2 font-bold text-sm text-[#065F46]">
              <Lock className="w-4 h-4 text-[#059669]" />
              <span>Immutable Submission Snapshot Active</span>
            </div>
            <p>
              Submitted on {latestSubmission.submittedAt ? new Date(latestSubmission.submittedAt).toLocaleString() : 'Recently'}.
            </p>
          </div>
        )}
      </div>

      {/* Main Grid: Challenge & Artifacts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Details & Artifacts Form */}
        <div className="lg:col-span-2 space-y-8">
          {/* Target Challenge Info */}
          <section className="bg-white border border-[#E2E8F0] rounded-[20px] p-6 shadow-card space-y-4">
            <h2 className="text-base font-bold text-[#111827] flex items-center">
              <Sparkles className="w-4 h-4 mr-2 text-[#2563EB]" /> Target Challenge Alignment
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
                <span className="text-[10px] font-bold text-[#64748B] uppercase">Track</span>
                <h3 className="text-sm font-bold text-[#111827]">{project.track.title}</h3>
                {project.track.description && (
                  <p className="text-xs text-[#64748B]">{project.track.description}</p>
                )}
              </div>

              <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
                <span className="text-[10px] font-bold text-[#64748B] uppercase">Problem Statement</span>
                <div className="flex items-center space-x-1.5">
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-[#E2E8F0] rounded">
                    {project.problemStatement.code}
                  </span>
                  <h3 className="text-sm font-bold text-[#111827]">{project.problemStatement.title}</h3>
                </div>
                <p className="text-xs text-[#64748B] line-clamp-2">{project.problemStatement.description}</p>
              </div>
            </div>
          </section>

          {/* Editable Form or Read-only Display */}
          {isLocked ? (
            <section className="bg-white border border-[#E2E8F0] rounded-[20px] p-6 shadow-card space-y-6">
              <h2 className="text-base font-bold text-[#111827] flex items-center">
                <FileText className="w-4 h-4 mr-2 text-[#2563EB]" /> Submitted Deliverables
              </h2>

              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
                  <span className="text-[10px] font-bold text-[#64748B] uppercase">Description</span>
                  <p className="text-xs text-[#334155] whitespace-pre-line leading-relaxed">
                    {project.description}
                  </p>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                  <div className="flex items-center space-x-3">
                    <Github className="w-5 h-5 text-slate-800" />
                    <div>
                      <span className="text-xs font-bold text-[#111827] block">GitHub Repository</span>
                      <span className="text-xs text-[#64748B] font-mono">{project.repoUrl}</span>
                    </div>
                  </div>
                  <a
                    href={project.repoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#2563EB] hover:underline text-xs font-bold"
                  >
                    Inspect ↗
                  </a>
                </div>

                {project.demoUrl && (
                  <div className="flex items-center justify-between p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                    <div className="flex items-center space-x-3">
                      <Globe className="w-5 h-5 text-[#2563EB]" />
                      <div>
                        <span className="text-xs font-bold text-[#111827] block">Live Deployment</span>
                        <span className="text-xs text-[#64748B]">{project.demoUrl}</span>
                      </div>
                    </div>
                    <a
                      href={project.demoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#2563EB] hover:underline text-xs font-bold"
                    >
                      Open ↗
                    </a>
                  </div>
                )}

                {project.videoUrl && (
                  <div className="flex items-center justify-between p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                    <div className="flex items-center space-x-3">
                      <Video className="w-5 h-5 text-[#7E22CE]" />
                      <div>
                        <span className="text-xs font-bold text-[#111827] block">Demo Video</span>
                        <span className="text-xs text-[#64748B]">{project.videoUrl}</span>
                      </div>
                    </div>
                    <a
                      href={project.videoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#7E22CE] hover:underline text-xs font-bold"
                    >
                      Watch ↗
                    </a>
                  </div>
                )}
              </div>
            </section>
          ) : (
            <form onSubmit={handleSaveDraft} className="space-y-6">
              <section className="bg-white border border-[#E2E8F0] rounded-[20px] p-6 shadow-card space-y-4">
                <h2 className="text-base font-bold text-[#111827] flex items-center">
                  <FileText className="w-4 h-4 mr-2 text-[#2563EB]" /> Solution Specifications
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-[#334155] block mb-1">
                      Project Title *
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[11px] text-xs font-medium text-[#111827]"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#334155] block mb-1">
                      Tagline
                    </label>
                    <input
                      type="text"
                      value={tagline}
                      onChange={(e) => setTagline(e.target.value)}
                      className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[11px] text-xs font-medium text-[#111827]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#334155] block mb-1">
                    Description * (min 20 characters)
                  </label>
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
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
                      value={repoUrl}
                      onChange={(e) => setRepoUrl(e.target.value)}
                      className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[11px] text-xs font-mono text-[#111827]"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#334155] block mb-1">
                      Live Deployment URL
                    </label>
                    <input
                      type="url"
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
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[11px] text-xs font-mono text-[#111827]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#334155] block mb-1">
                      Docs URL
                    </label>
                    <input
                      type="url"
                      value={documentationUrl}
                      onChange={(e) => setDocumentationUrl(e.target.value)}
                      className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[11px] text-xs font-mono text-[#111827]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#334155] block mb-1">
                      Tech Stack
                    </label>
                    <input
                      type="text"
                      value={techStackInput}
                      onChange={(e) => setTechStackInput(e.target.value)}
                      className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[11px] text-xs text-[#111827]"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <Button
                    variant="secondary"
                    size="md"
                    type="submit"
                    disabled={saving}
                    icon={<Save className="w-4 h-4" />}
                  >
                    {saving ? 'Saving...' : 'Save Draft Updates'}
                  </Button>
                </div>
              </section>
            </form>
          )}
        </div>

        {/* Right 1 Col: Validation & Submission Controls */}
        <div className="space-y-8">
          <section className="bg-white border border-[#E2E8F0] rounded-[20px] p-6 shadow-card space-y-5">
            <h2 className="text-base font-bold text-[#111827] flex items-center">
              <ShieldCheck className="w-5 h-5 mr-2 text-[#2563EB]" /> Submission Readiness
            </h2>

            {/* Validation Checklist */}
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#F8FAFC]">
                <span>GitHub Repository</span>
                {hasRepo ? (
                  <CheckCircle2 className="w-4 h-4 text-[#059669]" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-[#D97706]" />
                )}
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#F8FAFC]">
                <span>Detailed Description (≥ 20 chars)</span>
                {hasDescription ? (
                  <CheckCircle2 className="w-4 h-4 text-[#059669]" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-[#D97706]" />
                )}
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#F8FAFC]">
                <span>Track & Problem Selected</span>
                <CheckCircle2 className="w-4 h-4 text-[#059669]" />
              </div>
            </div>

            {/* Action State */}
            {isLocked ? (
              <div className="text-center p-4 bg-[#F8FAFC] rounded-xl text-xs text-[#64748B] font-semibold space-y-1">
                <Lock className="w-5 h-5 text-[#059669] mx-auto mb-1" />
                <span className="text-[#065F46] font-bold block">Submission Locked for Evaluation</span>
                <span>Your project snapshot is frozen for jury review.</span>
              </div>
            ) : (
              <div className="space-y-3 pt-2">
                <p className="text-xs text-[#64748B] leading-relaxed">
                  Once submitted, your solution will be locked into an immutable snapshot for jury evaluation.
                </p>

                <Button
                  variant="primary"
                  size="md"
                  onClick={handleSubmitAndLock}
                  disabled={submitting || !isReadyForSubmit}
                  className="w-full"
                  icon={<Send className="w-4 h-4" />}
                >
                  {submitting ? 'Submitting & Locking...' : 'Submit & Lock Project'}
                </Button>
              </div>
            )}
          </section>

          {/* Submission Timeline */}
          <section className="bg-white border border-[#E2E8F0] rounded-[20px] p-6 shadow-card space-y-3 text-xs">
            <h2 className="text-base font-bold text-[#111827] flex items-center">
              <Clock className="w-4 h-4 mr-2 text-[#2563EB]" /> Event Timeline
            </h2>

            <div className="space-y-2 text-[#475569]">
              <div>
                <span className="text-[#64748B] block font-medium">Submission Deadline:</span>
                <span className="font-bold text-[#111827]">
                  {project.hackathon.subEndTime ? new Date(project.hackathon.subEndTime).toLocaleString() : 'Open'}
                </span>
              </div>
              <div>
                <span className="text-[#64748B] block font-medium">Evaluation Status:</span>
                <span className="font-bold text-[#2563EB]">
                  {project.hackathon.status === 'RESULTS_PUBLISHED'
                    ? 'Results Published'
                    : isLocked
                    ? 'In Judging Pipeline'
                    : 'Awaiting Participant Submission'}
                </span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
