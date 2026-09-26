import { notFound, redirect } from 'next/navigation';
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
  ArrowLeft,
  ShieldCheck,
  Code2,
  Clock,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { getSession } from '@/server/auth/session';
import { ProjectRepository } from '@/server/repositories/project.repository';
import { SubmissionValidator } from '@/server/services/submission-validator.service';
import { SnapshotService } from '@/server/services/snapshot.service';

interface ProjectWorkspaceProps {
  params: {
    id: string;
  };
}

export const dynamic = 'force-dynamic';

export default async function ProjectWorkspacePage({ params }: ProjectWorkspaceProps) {
  const session = await getSession();
  if (!session) {
    redirect(`/login?from=/participant/projects/${params.id}`);
  }

  const project = await ProjectRepository.findById(params.id);
  if (!project) {
    notFound();
  }

  const isMember = project.team.members.some((m: any) => m.userId === session.id);
  const isAdmin = session.role === 'ADMIN';

  if (!isMember && !isAdmin) {
    redirect('/participant/dashboard');
  }

  const latestSubmission = project.submissions?.[0] || null;
  const isLocked = latestSubmission?.status === 'LOCKED';
  const validation = SubmissionValidator.validateProjectForSubmission(project, project.hackathon);

  const snapshotPayload = isLocked ? (latestSubmission.payloadSnapshot as any) : null;
  const contentHash = snapshotPayload ? SnapshotService.calculateContentHash(snapshotPayload) : null;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Back navigation */}
      <div>
        <Link
          href="/participant/dashboard"
          className="inline-flex items-center text-sm font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Participant Arena
        </Link>
      </div>

      {/* Header Banner */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                {project.hackathon.title}
              </span>
              <span
                className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                  isLocked
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : validation.isValid
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}
              >
                {isLocked ? '🔒 OFFICIAL SUBMISSION LOCKED' : validation.isValid ? 'READY TO SUBMIT' : 'DRAFT IN PROGRESS'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">{project.title}</h1>
            <p className="text-slate-500 text-sm">{project.tagline || 'Working project workspace for ' + project.team.name}</p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400 font-medium">Team: {project.team.name}</span>
          </div>
        </div>

        {/* Lock Notice */}
        {isLocked && latestSubmission && (
          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 text-emerald-900 text-xs space-y-1">
            <div className="flex items-center space-x-2 font-bold text-sm text-emerald-950">
              <Lock className="w-4 h-4 text-emerald-600" />
              <span>Immutable Submission Snapshot Active</span>
            </div>
            <p>
              Submitted on {latestSubmission.submittedAt ? new Date(latestSubmission.submittedAt).toLocaleString() : 'Recently'} by user #{latestSubmission.createdById.slice(0, 8)}.
            </p>
            {contentHash && (
              <div className="pt-1 font-mono text-[11px] text-emerald-800 break-all">
                SHA-256 Digest: <code>{contentHash}</code>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Grid: Challenge & Artifacts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Details & Artifacts */}
        <div className="lg:col-span-2 space-y-8">
          {/* Challenge Selection */}
          <section className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center">
              <Sparkles className="w-5 h-5 mr-2 text-indigo-600" /> Target Challenge
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-xs font-bold text-slate-400 uppercase">Track</span>
                <h3 className="text-sm font-bold text-slate-900">{project.track.title}</h3>
                {project.track.description && (
                  <p className="text-xs text-slate-500">{project.track.description}</p>
                )}
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-xs font-bold text-slate-400 uppercase">Problem Statement</span>
                <div className="flex items-center space-x-1.5">
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-slate-200 rounded">
                    {project.problemStatement.code}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900">{project.problemStatement.title}</h3>
                </div>
                <p className="text-xs text-slate-500 line-clamp-2">{project.problemStatement.description}</p>
              </div>
            </div>
          </section>

          {/* Project Description */}
          <section className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-indigo-600" /> Solution Overview
            </h2>
            <div className="text-slate-700 text-sm leading-relaxed whitespace-pre-line">
              {project.description}
            </div>

            {project.techStack && project.techStack.length > 0 && (
              <div className="pt-4 border-t border-slate-100 space-y-2">
                <span className="text-xs font-bold text-slate-400 uppercase">Tech Stack</span>
                <div className="flex flex-wrap gap-1.5">
                  {project.techStack.map((tech: string) => (
                    <span
                      key={tech}
                      className="px-2.5 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100 text-xs font-medium"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Submission Artifacts */}
          <section className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center">
              <Code2 className="w-5 h-5 mr-2 text-indigo-600" /> Deliverable Artifacts
            </h2>

            <div className="space-y-3">
              {/* GitHub Repo */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="flex items-center space-x-3">
                  <Github className="w-5 h-5 text-slate-800" />
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">GitHub Repository</span>
                    <span className="text-xs text-slate-500 font-mono">{project.repoUrl}</span>
                  </div>
                </div>
                <a
                  href={project.repoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-600 hover:text-indigo-700 text-xs font-bold"
                >
                  Inspect ↗
                </a>
              </div>

              {/* Demo URL */}
              {project.demoUrl && (
                <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center space-x-3">
                    <Globe className="w-5 h-5 text-blue-600" />
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">Live Deployment / Demo</span>
                      <span className="text-xs text-slate-500">{project.demoUrl}</span>
                    </div>
                  </div>
                  <a
                    href={project.demoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-600 hover:text-indigo-700 text-xs font-bold"
                  >
                    Open ↗
                  </a>
                </div>
              )}

              {/* Video URL */}
              {project.videoUrl && (
                <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center space-x-3">
                    <Video className="w-5 h-5 text-purple-600" />
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">Demo Video Presentation</span>
                      <span className="text-xs text-slate-500">{project.videoUrl}</span>
                    </div>
                  </div>
                  <a
                    href={project.videoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-600 hover:text-indigo-700 text-xs font-bold"
                  >
                    Watch ↗
                  </a>
                </div>
              )}

              {/* Documentation URL */}
              {project.documentationUrl && (
                <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-5 h-5 text-emerald-600" />
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">Documentation / Architecture Doc</span>
                      <span className="text-xs text-slate-500">{project.documentationUrl}</span>
                    </div>
                  </div>
                  <a
                    href={project.documentationUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-600 hover:text-indigo-700 text-xs font-bold"
                  >
                    Read ↗
                  </a>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Right 1 Col: Validation & Submission Controls */}
        <div className="space-y-8">
          <section className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-sm space-y-5">
            <h2 className="text-base font-bold text-slate-900 flex items-center">
              <ShieldCheck className="w-5 h-5 mr-2 text-indigo-600" /> Submission Readiness
            </h2>

            {/* Validation Checklist */}
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50">
                <span>GitHub Repository</span>
                {project.repoUrl ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                )}
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50">
                <span>Track & Challenge Selected</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50">
                <span>Team Bounds Compliance</span>
                {project.team.members.length >= project.hackathon.minTeamSize ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                )}
              </div>
            </div>

            {/* Validation Warnings/Errors */}
            {validation.errors.length > 0 && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl space-y-1">
                <span className="text-[11px] font-bold text-red-800 uppercase">Attention Required:</span>
                <ul className="list-disc list-inside text-xs text-red-700 space-y-0.5">
                  {validation.errors.map((e: any, i: number) => (
                    <li key={i}>{e.message}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action State */}
            {isLocked ? (
              <div className="text-center p-4 bg-slate-100 rounded-2xl text-xs text-slate-500 font-semibold space-y-1">
                <Lock className="w-5 h-5 text-slate-400 mx-auto" />
                <span>Project Frozen for Evaluation</span>
              </div>
            ) : (
              <div className="space-y-2 pt-2">
                <p className="text-xs text-slate-500 text-center">
                  Once submitted, your solution will be locked into an immutable snapshot for jury evaluation.
                </p>
              </div>
            )}
          </section>

          {/* Submission Timeline */}
          <section className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-sm space-y-4 text-xs">
            <h2 className="text-base font-bold text-slate-900 flex items-center">
              <Clock className="w-4 h-4 mr-2 text-indigo-600" /> Submission Window
            </h2>

            <div className="space-y-2 text-slate-600">
              <div>
                <span className="text-slate-400 block font-medium">Opens:</span>
                <span className="font-bold text-slate-800">{new Date(project.hackathon.subStartTime).toLocaleString()}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Deadline:</span>
                <span className="font-bold text-slate-800">{new Date(project.hackathon.subEndTime).toLocaleString()}</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
