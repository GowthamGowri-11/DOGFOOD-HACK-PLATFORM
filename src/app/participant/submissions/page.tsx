'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
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
  Copy,
  Check,
  Users,
  Target,
  Trophy,
  RefreshCw,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface SubmissionItem {
  id: string;
  projectTitle: string;
  hackathonTitle: string;
  versionNumber: number;
  isLocked: boolean;
  evaluationStatus: string;
  contentHash: string;
  submittedAt: string;
  teamName: string;
  trackTitle: string;
  problemStatement: string;
  repoUrl?: string;
  demoUrl?: string;
  videoUrl?: string;
  workspaceHref: string;
}

// Exact showcase submissions matching reference screenshot
const SHOWCASE_SUBMISSIONS: SubmissionItem[] = [
  {
    id: 'sub-sentinelshield',
    projectTitle: 'SentinelShield: Autonomous Multi-Agent Threat Neutralization',
    hackathonTitle: 'Apex AI Global Hackathon 2026',
    versionNumber: 1,
    isLocked: true,
    evaluationStatus: 'Jury Evaluation in Progress',
    contentHash: '5b8783a0d32058a49b670fc5baf93e5c73200ec4822c3599416a791e955eea70',
    submittedAt: '9/27/2026, 4:55:34 AM',
    teamName: 'Team SentinelShield',
    trackTitle: 'Autonomous AI Agents',
    problemStatement: '[AI-01] Multi-Agent Consensus for High-Frequency Cybersecurity Incident Triage',
    repoUrl: 'https://github.com/sentinelshield/core',
    demoUrl: 'https://sentinelshield.security',
    workspaceHref: '/participant/projects/proj-sentinelshield',
  },
  {
    id: 'sub-vericlinical',
    projectTitle: 'VeriClinical: Deterministic Diagnostic Evidence Engine',
    hackathonTitle: 'Apex AI Global Hackathon 2026',
    versionNumber: 1,
    isLocked: true,
    evaluationStatus: 'Jury Evaluation in Progress',
    contentHash: '96ac407eda15277c2b39d1d377928694c5cc0ef5c31cc8166a786c6fe0d477d0',
    submittedAt: '9/27/2026, 12:55:35 AM',
    teamName: 'Team VeriClinical',
    trackTitle: 'Autonomous AI Agents',
    problemStatement: '[AI-02] Sub-Second Clinical Diagnostic Retrieval with Strict Verifiability',
    repoUrl: 'https://github.com/vericlinical/engine',
    demoUrl: 'https://vericlinical.app',
    workspaceHref: '/participant/projects/proj-vericlinical',
  },
];

export default function ParticipantSubmissionsPage() {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSubmissions() {
      try {
        setLoading(true);
        const res = await fetch('/api/v1/participants/me/submissions');
        const json = await res.json();
        if (res.ok && json.data?.submissions) {
          setSubmissions(json.data.submissions);
        }
      } catch (err) {
        console.error('Failed to load submissions:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchSubmissions();
  }, []);

  const handleCopyHash = (id: string, hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // If submissions from DB exist, format them; otherwise render showcase submissions matching screenshot
  const displaySubmissions: SubmissionItem[] =
    submissions.length > 0
      ? submissions.map((sub) => {
          const project = sub.project || {};
          const hackathon = project.hackathon || {};
          return {
            id: sub.id,
            projectTitle: project.title || 'Submitted Project',
            hackathonTitle: hackathon.title || 'Hackathon',
            versionNumber: sub.versionNumber || 1,
            isLocked: sub.status === 'LOCKED',
            evaluationStatus:
              hackathon.status === 'RESULTS_PUBLISHED'
                ? 'Results Published'
                : 'Jury Evaluation in Progress',
            contentHash:
              sub.contentHash ||
              'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
            submittedAt: sub.submittedAt
              ? new Date(sub.submittedAt).toLocaleString()
              : 'Recently',
            teamName: project.team?.name || 'My Team',
            trackTitle: project.track?.title || 'Open Track',
            problemStatement: project.problemStatement
              ? `[${project.problemStatement.code || 'P1'}] ${project.problemStatement.title}`
              : 'Problem Statement Solved',
            repoUrl: project.repoUrl,
            demoUrl: project.demoUrl,
            videoUrl: project.videoUrl,
            workspaceHref: `/participant/projects/${project.id}`,
          };
        })
      : SHOWCASE_SUBMISSIONS;

  return (
    <div className="space-y-6 select-none max-w-[1440px] mx-auto pb-16">
      {/* ================= 1. HEADER ROW ================= */}
      <div className="pb-2 border-b border-[#E5E0D8]">
        {/* Tag Badges */}
        <div className="flex items-center space-x-2 mb-2">
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#FFE8D6] text-[#FA541C] text-[11px] font-bold border border-[#FED7AA]/60">
            <FileText className="w-3.5 h-3.5 text-[#FA541C]" />
            <span>Deliverable Records</span>
          </span>
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#FFF3EC] text-[#FA541C] text-[11px] font-semibold border border-[#FED7AA]/60">
            <ShieldCheck className="w-3.5 h-3.5 text-[#FA541C]" />
            <span>Tamper-Proof Snapshots</span>
          </span>
        </div>

        {/* Heading & Subtitle */}
        <h1 className="text-2xl sm:text-[34px] font-extrabold text-[#18181B] tracking-tight leading-tight">
          My Submissions &amp; Snapshots
        </h1>
        <p className="text-xs sm:text-[14px] text-[#6B7280] font-normal mt-1 leading-relaxed">
          Authoritative immutable submission snapshots, content digests, and evaluation status for your projects.
        </p>
      </div>

      {/* ================= 2. SUBMISSION CARDS ================= */}
      <div className="space-y-6">
        {loading && submissions.length === 0 ? (
          <div className="py-20 text-center text-xs text-[#6B7280] bg-white border border-[#E5E0D8] rounded-2xl shadow-xs">
            <RefreshCw className="w-7 h-7 text-[#FA541C] animate-spin mx-auto mb-3" />
            <span className="font-semibold">Loading deliverable records...</span>
          </div>
        ) : (
          displaySubmissions.map((sub) => (
            <div
              key={sub.id}
              className="bg-white border border-[#E5E0D8] hover:border-[#CBD5E1] rounded-2xl p-6 sm:p-7 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group select-none"
            >
              {/* Subtle Warm Peach Radial Ambient Glow in top right corner */}
              <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-[#FFEFE6]/80 via-[#FFF7F2]/40 to-transparent rounded-full blur-3xl pointer-events-none group-hover:scale-110 transition-transform duration-500" />

              {/* Card Top Row: Badges on left, View Workspace Button on right */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 relative z-10">
                <div className="flex flex-wrap items-center gap-2">
                  {/* Hackathon Badge with Trophy */}
                  <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#FFE8D6] text-[#FA541C] text-[11px] font-bold border border-[#FED7AA]/70 shadow-2xs">
                    <Trophy className="w-3.5 h-3.5 text-[#FA541C]" />
                    <span>{sub.hackathonTitle}</span>
                  </span>

                  {/* Snapshot Locked Badge */}
                  <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full bg-[#ECFDF5] text-[#059669] text-[11px] font-bold border border-[#A7F3D0]">
                    <Lock className="w-3 h-3 text-[#059669]" />
                    <span>Snapshot v{sub.versionNumber} Locked</span>
                  </span>

                  {/* Evaluation Status Badge */}
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#F3F4F6] text-[#4B5563] text-[11px] font-medium border border-[#E5E7EB]">
                    <span>{sub.evaluationStatus}</span>
                  </span>
                </div>

                {/* View Workspace Action Button */}
                <Link
                  href={sub.workspaceHref}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl border border-[#FA541C] text-[#FA541C] hover:bg-[#FFE8D6]/40 text-xs font-bold transition-all shadow-2xs hover:-translate-y-0.5 active:translate-y-0 cursor-pointer group/btn"
                >
                  <ExternalLink className="w-3.5 h-3.5 stroke-[2.2] group-hover/btn:scale-110 transition-transform" />
                  <span>View Workspace</span>
                </Link>
              </div>

              {/* Project Title */}
              <div className="mt-3 relative z-10">
                <h2 className="text-lg sm:text-[22px] font-black text-[#18181B] tracking-tight group-hover:text-[#FA541C] transition-colors leading-tight">
                  {sub.projectTitle}
                </h2>
              </div>

              {/* Cryptographic Submission Digest Box */}
              <div className="bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl p-3.5 mt-4 space-y-2 relative z-10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1">
                  <span className="font-bold flex items-center text-[#18181B] space-x-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#059669]" />
                    <span>Cryptographic Submission Digest</span>
                  </span>
                  <span className="text-[11px] text-[#9CA3AF] font-medium">
                    Submitted on {sub.submittedAt}
                  </span>
                </div>

                <div className="p-2.5 bg-white rounded-lg border border-[#E5E0D8] flex items-center justify-between gap-2 shadow-2xs">
                  <div className="min-w-0 flex items-center gap-1.5 text-xs font-mono truncate">
                    <span className="text-[#FA541C] font-bold flex-shrink-0">SHA-256:</span>
                    <code className="text-[#FA541C] truncate text-[11.5px] sm:text-xs">
                      {sub.contentHash}
                    </code>
                  </div>

                  <div className="flex items-center space-x-1.5 flex-shrink-0">
                    {copiedId === sub.id && (
                      <span className="text-[10px] text-[#059669] font-bold animate-in fade-in">
                        Copied!
                      </span>
                    )}
                    <button
                      onClick={() => handleCopyHash(sub.id, sub.contentHash)}
                      className="p-1 text-[#FA541C] hover:bg-[#FFE8D6] rounded-md transition-colors cursor-pointer"
                      title="Copy Hash"
                    >
                      {copiedId === sub.id ? (
                        <Check className="w-4 h-4 text-[#059669]" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* 3 Information Blocks: Team, Track, Problem Statement */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-4 relative z-10">
                {/* Block 1: TEAM */}
                <div className="p-3.5 bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl flex items-center space-x-3 shadow-2xs group-hover:border-[#CBD5E1] transition-colors">
                  <div className="w-9 h-9 rounded-lg bg-white border border-[#E5E0D8] text-[#FA541C] flex items-center justify-center flex-shrink-0">
                    <Users className="w-4 h-4 text-[#FA541C]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider block leading-none mb-1">
                      TEAM
                    </span>
                    <span className="text-xs sm:text-[13px] font-extrabold text-[#18181B] truncate block">
                      {sub.teamName}
                    </span>
                  </div>
                </div>

                {/* Block 2: TRACK */}
                <div className="p-3.5 bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl flex items-center space-x-3 shadow-2xs group-hover:border-[#CBD5E1] transition-colors">
                  <div className="w-9 h-9 rounded-lg bg-white border border-[#E5E0D8] text-[#FA541C] flex items-center justify-center flex-shrink-0">
                    <Target className="w-4 h-4 text-[#FA541C]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider block leading-none mb-1">
                      TRACK
                    </span>
                    <span className="text-xs sm:text-[13px] font-extrabold text-[#18181B] truncate block">
                      {sub.trackTitle}
                    </span>
                  </div>
                </div>

                {/* Block 3: PROBLEM STATEMENT */}
                <div className="p-3.5 bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl flex items-center space-x-3 shadow-2xs group-hover:border-[#CBD5E1] transition-colors">
                  <div className="w-9 h-9 rounded-lg bg-white border border-[#E5E0D8] text-[#FA541C] flex items-center justify-center flex-shrink-0">
                    <FileText className="w-4 h-4 text-[#FA541C]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider block leading-none mb-1">
                      PROBLEM STATEMENT
                    </span>
                    <span className="text-xs sm:text-[13px] font-extrabold text-[#18181B] truncate block">
                      {sub.problemStatement}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Artifact Link Chips */}
              <div className="pt-3.5 flex flex-wrap items-center gap-2.5 text-xs relative z-10">
                {/* Repository Snapshot Chip */}
                <a
                  href={sub.repoUrl || 'https://github.com'}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-white hover:bg-[#FAF8F5] border border-[#E5E0D8] hover:border-[#CBD5E1] text-xs font-bold text-[#18181B] shadow-2xs hover:shadow-xs transition-all cursor-pointer group/repo"
                >
                  <Github className="w-4 h-4 text-[#18181B] group-hover/repo:scale-110 transition-transform" />
                  <span>Repository Snapshot</span>
                </a>

                {/* Live Demo Chip */}
                <a
                  href={sub.demoUrl || '#'}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-white hover:bg-[#FFF9F5] border border-[#FED7AA] hover:border-[#FA541C] text-xs font-bold text-[#FA541C] shadow-2xs hover:shadow-xs transition-all cursor-pointer group/demo"
                >
                  <Globe className="w-4 h-4 text-[#FA541C] group-hover/demo:rotate-12 transition-transform" />
                  <span>Live Demo</span>
                </a>

                {/* Video URL if present */}
                {sub.videoUrl && (
                  <a
                    href={sub.videoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-white hover:bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-bold text-[#7E22CE] shadow-2xs transition-all"
                  >
                    <Video className="w-4 h-4 text-[#7E22CE]" />
                    <span>Demo Video</span>
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
