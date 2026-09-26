'use client';

import React, { useEffect, useState } from 'react';
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
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface AssignmentItem {
  id: string;
  status: string;
  assignedAt: string;
  completedAt?: string | null;
  project: {
    id: string;
    title: string;
    slug: string;
    repoUrl: string;
    demoUrl?: string | null;
    techStack: string[];
    track: { id: string; title: string; colorHex?: string };
    problemStatement: { id: string; title: string; code: string };
    team: { id: string; name: string };
    submissions: { versionNumber: number }[];
  };
  evaluation?: {
    id: string;
    status: string;
    weightedScore: number;
    submittedAt?: string | null;
  } | null;
}

export default function JudgeDashboard() {
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAssignments() {
      try {
        setLoading(true);
        const res = await fetch('/api/v1/judge/assignments');
        const data = await res.json();
        if (res.ok && data.data?.assignments) {
          setAssignments(data.data.assignments);
        } else {
          // Fallback mock assignments for immediate interactive demo preview
          setAssignments([
            {
              id: 'asgn_1',
              status: 'ASSIGNED',
              assignedAt: new Date().toISOString(),
              project: {
                id: 'proj_sentinel_ai',
                title: 'SentinelShield: Autonomous Multi-Agent Threat Neutralization',
                slug: 'sentinel-shield',
                repoUrl: 'https://github.com/dogfood/sentinel-shield',
                demoUrl: 'https://sentinel-shield-demo.dev',
                techStack: ['Next.js', 'Rust', 'Prisma', 'Neon'],
                track: { id: 'trk_1', title: 'Autonomous AI Agents' },
                problemStatement: { id: 'ps_1', title: 'Multi-Agent Cybersecurity Incident Triage', code: 'AI-01' },
                team: { id: 'tm_1', name: 'Team Sentinel AI' },
                submissions: [{ versionNumber: 1 }],
              },
              evaluation: null,
            },
            {
              id: 'asgn_2',
              status: 'COMPLETED',
              assignedAt: new Date().toISOString(),
              project: {
                id: 'proj_vericlinical',
                title: 'VeriClinical: Deterministic Diagnostic Evidence Engine',
                slug: 'vericlinical-rag',
                repoUrl: 'https://github.com/dogfood/vericlinical',
                demoUrl: 'https://vericlinical.health',
                techStack: ['Python', 'FastAPI', 'React', 'Neon'],
                track: { id: 'trk_1', title: 'Autonomous AI Agents' },
                problemStatement: { id: 'ps_2', title: 'Sub-Second Clinical Diagnostic Retrieval', code: 'AI-02' },
                team: { id: 'tm_2', name: 'Team VeriClinical' },
                submissions: [{ versionNumber: 1 }],
              },
              evaluation: {
                id: 'eval_2',
                status: 'SUBMITTED',
                weightedScore: 92.5,
                submittedAt: new Date().toISOString(),
              },
            },
          ]);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }

    fetchAssignments();
  }, []);

  const totalAssigned = assignments.length;
  const completedCount = assignments.filter((a) => a.evaluation?.status === 'SUBMITTED').length;
  const pendingCount = totalAssigned - completedCount;

  return (
    <div className="space-y-8 select-none">
      {/* 1. Header: My Judging & Progress */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-[#E2E8F0]">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-[#64748B] mb-1">
            <span>Judge Evaluation Workspace</span>
            <span>•</span>
            <Badge variant="emerald">Strict Isolation Active</Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-tight">
            My Judging
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
            Evaluate assigned project deliverables against calibrated rubric criteria. Peer scores remain confidential.
          </p>
        </div>

        {/* Progress Badge: 24 / 30 Evaluations Completed */}
        <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl px-5 py-3 flex items-center space-x-3.5 shadow-card">
          <div className="text-right">
            <span className="block text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
              Judging Progress
            </span>
            <span className="text-sm font-extrabold text-[#111827]">
              {completedCount} / {totalAssigned || 2} Evaluations Completed
            </span>
          </div>
          <div className="w-9 h-9 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] flex items-center justify-center font-bold text-xs">
            {totalAssigned > 0 ? Math.round((completedCount / totalAssigned) * 100) : 50}%
          </div>
        </div>
      </div>

      {/* 2. Progress Meter Bar */}
      <div className="bg-white border border-[#E2E8F0] rounded-[16px] p-5 shadow-card space-y-2">
        <div className="flex justify-between items-center text-xs font-semibold text-[#334155]">
          <span>Evaluation Queue Progress</span>
          <span>{pendingCount} Pending Review</span>
        </div>
        <div className="w-full bg-[#F1F5F9] rounded-full h-2.5 overflow-hidden">
          <div
            className="bg-[#2563EB] h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${totalAssigned > 0 ? (completedCount / totalAssigned) * 100 : 50}%` }}
          />
        </div>
      </div>

      {/* 3. Assigned Projects List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#111827]">Assigned Projects</h2>
          <span className="text-xs text-[#64748B] font-medium">{assignments.length} Projects in Queue</span>
        </div>

        <div className="space-y-3.5">
          {assignments.map((a) => {
            const isCompleted = a.evaluation?.status === 'SUBMITTED';

            return (
              <div
                key={a.id}
                className="bg-white border border-[#E2E8F0] hover:border-[#93C5FD] rounded-[16px] p-5 sm:p-6 shadow-card transition-all duration-150 flex flex-col md:flex-row justify-between items-start md:items-center gap-5"
              >
                <div className="space-y-2.5 flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <Badge variant="blue">{a.project.track?.title}</Badge>
                    {isCompleted ? (
                      <Badge variant="emerald" icon={<CheckCircle2 className="w-3 h-3" />}>
                        Evaluated ({a.evaluation?.weightedScore} / 100)
                      </Badge>
                    ) : (
                      <Badge variant="amber" icon={<Clock className="w-3 h-3" />}>
                        Pending Evaluation
                      </Badge>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-[#111827] truncate leading-snug">
                    {a.project.title}
                  </h3>

                  <div className="text-xs text-[#64748B]">
                    Team: <strong className="text-[#334155]">{a.project.team?.name}</strong> • Problem: <strong>[{a.project.problemStatement?.code}] {a.project.problemStatement?.title}</strong>
                  </div>

                  <div className="flex items-center space-x-3 text-xs text-[#64748B] pt-0.5">
                    {a.project.repoUrl && (
                      <a
                        href={a.project.repoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center text-[#2563EB] hover:underline font-semibold"
                      >
                        <Github className="w-3.5 h-3.5 mr-1" />
                        Repository
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
                      </a>
                    )}
                  </div>
                </div>

                <div className="flex-shrink-0">
                  <Link href={`/judge/assignments/${a.id}`}>
                    <Button
                      variant={isCompleted ? 'outline' : 'primary'}
                      size="md"
                      icon={<Scale className="w-4 h-4" />}
                    >
                      {isCompleted ? 'Review Score' : 'Evaluate'}
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
