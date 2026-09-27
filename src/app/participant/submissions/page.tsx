import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  FileCheck,
  Lock,
  Clock,
  ShieldCheck,
  ExternalLink,
  Award,
  Github,
  Globe,
  Video,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { getSession } from '@/server/auth/session';
import { SubmissionRepository } from '@/server/repositories/submission.repository';
import { SnapshotService } from '@/server/services/snapshot.service';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export const dynamic = 'force-dynamic';

export default async function ParticipantSubmissionsPage() {
  const session = await getSession();
  if (!session) {
    redirect('/login?from=/participant/submissions');
  }

  const submissions = await SubmissionRepository.listByUser(session.id);

  return (
    <div className="space-y-6 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-[#E2E8F0]">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-bold text-[#2563EB] bg-[#EFF6FF] px-2.5 py-0.5 rounded-full border border-[#BFDBFE]">
              Deliverable Records
            </span>
            <span className="text-[11px] font-semibold text-[#059669] bg-[#ECFDF5] px-2.5 py-0.5 rounded-full border border-[#A7F3D0] flex items-center">
              <ShieldCheck className="w-3 h-3 mr-1" /> Tamper-Proof Snapshots
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#111827] mt-1 tracking-tight">
            My Submissions & Snapshots
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-0.5 font-normal">
            Authoritative immutable submission snapshots, content digests, and evaluation status for your projects.
          </p>
        </div>
      </div>

      {submissions.length === 0 ? (
        <div className="bg-white border border-[#E2E8F0] rounded-[18px] p-12 text-center space-y-3 shadow-card max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center mx-auto">
            <FileCheck className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[#111827]">No Formal Submissions Yet</h3>
          <p className="text-xs text-[#64748B] leading-relaxed">
            Your project workspaces are currently in draft. Complete all required artifacts and submit your project to lock in an evaluation snapshot.
          </p>
          <div className="pt-2">
            <Link href="/participant/projects">
              <Button variant="primary" size="sm">
                View Project Workspaces →
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {submissions.map((sub) => {
            const project = sub.project;
            const hackathon = project.hackathon;
            const snapshot = sub.payloadSnapshot as any;
            const contentHash = snapshot ? SnapshotService.calculateContentHash(snapshot) : null;
            const isLocked = sub.status === 'LOCKED';

            return (
              <div
                key={sub.id}
                className="bg-white border border-[#E2E8F0] rounded-[18px] p-6 sm:p-7 shadow-card space-y-5"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
                        {hackathon.title}
                      </span>
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] flex items-center">
                        <Lock className="w-3 h-3 mr-1" /> Snapshot v{sub.versionNumber} Locked
                      </span>
                      {hackathon.status === 'RESULTS_PUBLISHED' ? (
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
                          Results Published
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium text-[#64748B]">
                          Jury Evaluation in Progress
                        </span>
                      )}
                    </div>
                    <h2 className="text-xl font-bold text-[#111827]">{project.title}</h2>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Link href={`/participant/projects/${project.id}`}>
                      <Button variant="outline" size="sm">
                        View Workspace
                      </Button>
                    </Link>
                    {hackathon.status === 'RESULTS_PUBLISHED' && (
                      <Link href="/participant/results">
                        <Button variant="primary" size="sm" icon={<Award className="w-3.5 h-3.5" />}>
                          View Standing
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>

                {/* Snapshot Verification Box */}
                <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-[#334155]">
                    <span className="font-bold flex items-center">
                      <ShieldCheck className="w-4 h-4 mr-1 text-[#059669]" />
                      Cryptographic Submission Digest
                    </span>
                    <span className="text-[#64748B]">
                      Submitted on {sub.submittedAt ? new Date(sub.submittedAt).toLocaleString() : 'N/A'}
                    </span>
                  </div>
                  {contentHash && (
                    <div className="p-2.5 bg-white rounded-lg border border-[#E2E8F0] font-mono text-[11px] text-[#2563EB] break-all">
                      SHA-256: <code>{contentHash}</code>
                    </div>
                  )}
                </div>

                {/* Deliverables summary */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
                    <span className="text-[10px] font-bold text-[#64748B] uppercase block">Team</span>
                    <span className="font-bold text-[#111827]">{project.team?.name}</span>
                  </div>

                  <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
                    <span className="text-[10px] font-bold text-[#64748B] uppercase block">Track</span>
                    <span className="font-bold text-[#111827]">{project.track?.title}</span>
                  </div>

                  <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl sm:col-span-2">
                    <span className="text-[10px] font-bold text-[#64748B] uppercase block">Problem Statement</span>
                    <span className="font-bold text-[#111827] truncate block">
                      [{project.problemStatement?.code}] {project.problemStatement?.title}
                    </span>
                  </div>
                </div>

                {/* Artifact URLs */}
                <div className="pt-2 flex flex-wrap items-center gap-3 text-xs">
                  {project.repoUrl && (
                    <a
                      href={project.repoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center text-[#2563EB] hover:underline"
                    >
                      <Github className="w-3.5 h-3.5 mr-1 text-slate-800" />
                      Repository Snapshot
                    </a>
                  )}

                  {project.demoUrl && (
                    <a
                      href={project.demoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center text-[#2563EB] hover:underline"
                    >
                      <Globe className="w-3.5 h-3.5 mr-1" />
                      Live Demo
                    </a>
                  )}

                  {project.videoUrl && (
                    <a
                      href={project.videoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center text-[#7E22CE] hover:underline"
                    >
                      <Video className="w-3.5 h-3.5 mr-1" />
                      Demo Video
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
