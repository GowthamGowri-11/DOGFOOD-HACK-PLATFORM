'use client';

import React, { useEffect } from 'react';
import {
  X,
  ExternalLink,
  Github,
  Globe,
  Award,
  Users,
  Trophy,
  CheckCircle2,
  Sparkles,
  Bot,
  UserCheck,
  Code2,
  Layers,
  ArrowUpRight,
} from 'lucide-react';

export interface ScorecardData {
  totalScore: number;
  aiScore: number;
  humanScore: number;
  criteriaScores: Array<{
    title: string;
    score: number;
    maxScore: number;
    color?: string;
  }>;
  humanScores: Array<{
    title: string;
    score: number;
    maxScore: number;
  }>;
  pros: string[];
  cons: string[];
  improve: string[];
}

export interface TeamScorecardModalProps {
  isOpen: boolean;
  onClose: () => void;
  team: {
    teamName: string;
    projectTitle: string;
    projectTagline?: string | null;
    projectDescription?: string;
    trackTitle: string;
    trackColor?: string;
    rank?: number;
    awardCategory?: string | null;
    repoUrl?: string;
    demoUrl?: string | null;
    techStack?: string[];
    teamMembers?: Array<{
      fullName: string;
      isLeader?: boolean;
    }>;
    scorecard: ScorecardData;
  } | null;
}

export const TeamScorecardModal: React.FC<TeamScorecardModalProps> = ({
  isOpen,
  onClose,
  team,
}) => {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !team) return null;

  const initial = team.teamName.charAt(0).toUpperCase();
  const sc = team.scorecard;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto bg-black/60 backdrop-blur-xs modal-backdrop-enter">
      {/* Background click to close */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-3xl max-h-[92vh] flex flex-col bg-white rounded-[22px] border border-[#E2E8F0] shadow-2xl overflow-hidden z-10 modal-content-enter will-change-transform">
        {/* Sticky Header */}
        <div className="p-4 sm:p-5 border-b border-[#E2E8F0] flex items-center justify-between bg-white/90 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center space-x-3.5">
            {/* Team Initial Badge */}
            <div className="w-11 h-11 rounded-[14px] bg-[#FFF1F2] border border-[#FECDD3] text-[#E11D48] flex items-center justify-center font-black text-xl shadow-xs flex-shrink-0">
              {initial}
            </div>

            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-lg font-black text-[#9F1239] uppercase tracking-wide truncate">
                  {team.teamName}
                </h2>
                {team.rank && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
                    Rank #{team.rank}
                  </span>
                )}
                {team.awardCategory && (
                  <span className="hidden sm:inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]">
                    <Award className="w-3 h-3 mr-1 text-[#059669]" />
                    {team.awardCategory}
                  </span>
                )}
              </div>
              <p className="text-xs text-[#64748B] font-medium truncate mt-0.5">
                {team.trackTitle}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#94A3B8] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition-colors"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 text-xs text-[#334155]">
          {/* Section 1: Total Scores KPI Cards (3 boxes) */}
          <div className="grid grid-cols-3 gap-3">
            {/* Box 1: Total Score */}
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[16px] p-3 sm:p-4 text-center">
              <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">
                Total Score
              </span>
              <div className="mt-1 font-mono font-black text-xl sm:text-2xl text-[#0F172A]">
                {sc.totalScore}{' '}
                <span className="text-xs font-semibold text-[#64748B]">/ 100 pts</span>
              </div>
            </div>

            {/* Box 2: AI Score */}
            <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-[16px] p-3 sm:p-4 text-center">
              <span className="text-[10px] font-bold text-[#2563EB] uppercase tracking-wider block">
                AI Score
              </span>
              <div className="mt-1 font-mono font-black text-xl sm:text-2xl text-[#2563EB]">
                {sc.aiScore}{' '}
                <span className="text-xs font-semibold text-[#3B82F6]">/ 100 pts</span>
              </div>
            </div>

            {/* Box 3: Human Score */}
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[16px] p-3 sm:p-4 text-center">
              <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">
                Human Score
              </span>
              <div className="mt-1 font-mono font-black text-xl sm:text-2xl text-[#0F172A]">
                {sc.humanScore > 0 ? (
                  <>
                    {sc.humanScore}{' '}
                    <span className="text-xs font-semibold text-[#64748B]">/ 100 pts</span>
                  </>
                ) : (
                  <span className="text-[#94A3B8]">—</span>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Human Jury Criteria Breakdown */}
          <div className="border border-[#FED7AA] bg-[#FFFBEB]/30 rounded-[18px] p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between pb-1">
              <span className="text-[11px] font-black text-[#C2410C] uppercase tracking-wider">
                Human Jury Criteria Breakdown
              </span>
              <span className="text-[10px] font-bold text-[#D97706] bg-[#FEF3C7] px-2 py-0.5 rounded-full border border-[#FDE68A]">
                Human Evaluation
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {sc.humanScores.map((h, i) => (
                <div
                  key={i}
                  className="bg-white border border-[#FDE68A] rounded-[12px] p-3 flex items-center justify-between shadow-xs"
                >
                  <span className="font-bold text-[#1E293B] truncate pr-2">{h.title}</span>
                  <span className="font-mono font-bold text-xs bg-[#FFFBEB] text-[#B45309] px-2.5 py-1 rounded-[8px] border border-[#FDE68A] flex-shrink-0">
                    {h.score} / {h.maxScore} pts
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: AI Jury Score Breakdown */}
          <div className="border border-[#CBD5E1] bg-[#F8FAFC] rounded-[18px] p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between pb-1">
              <span className="text-[11px] font-black text-[#334155] uppercase tracking-wider flex items-center">
                <Bot className="w-3.5 h-3.5 mr-1 text-[#2563EB]" />
                AI Jury Score Breakdown
              </span>
              <span className="text-[10px] font-bold text-[#475569] bg-[#E2E8F0] px-2 py-0.5 rounded-full">
                Total: 1 rubric • 100 Points
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {sc.criteriaScores.map((c, i) => {
                const colors = [
                  'text-[#7C3AED] bg-[#FAF5FF] border-[#E9D5FF]',
                  'text-[#2563EB] bg-[#EFF6FF] border-[#BFDBFE]',
                  'text-[#059669] bg-[#ECFDF5] border-[#A7F3D0]',
                  'text-[#D97706] bg-[#FFFBEB] border-[#FDE68A]',
                  'text-[#DC2626] bg-[#FEF2F2] border-[#FECACA]',
                  'text-[#0891B2] bg-[#ECFEFF] border-[#A5F3FC]',
                ];
                const colorStyle = colors[i % colors.length];

                return (
                  <div
                    key={i}
                    className="bg-white border border-[#E2E8F0] rounded-[12px] p-2.5 flex flex-col justify-between shadow-xs"
                  >
                    <span className="text-[11px] text-[#64748B] font-semibold truncate mb-1">
                      {c.title}
                    </span>
                    <div className="flex items-baseline justify-between">
                      <span className="font-mono font-black text-sm text-[#0F172A]">
                        {c.score}
                      </span>
                      <span className="text-[10px] text-[#94A3B8] font-mono">
                        / {c.maxScore} pts
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 4: Team Members */}
          {team.teamMembers && team.teamMembers.length > 0 && (
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block">
                Team Members
              </span>
              <div className="flex flex-wrap gap-2">
                {team.teamMembers.map((m, i) => (
                  <div
                    key={i}
                    className="inline-flex items-center px-3 py-1.5 rounded-full bg-[#F8FAFC] border border-[#E2E8F0] text-xs font-semibold text-[#1E293B]"
                  >
                    <div className="w-5 h-5 rounded-full bg-[#EFF6FF] text-[#2563EB] font-bold text-[10px] flex items-center justify-center mr-1.5">
                      {m.fullName.charAt(0)}
                    </div>
                    <span>{m.fullName}</span>
                    {m.isLeader && (
                      <span className="ml-1.5 text-[9px] font-bold text-[#2563EB] bg-[#DBEAFE] px-1.5 py-0.2 rounded-full">
                        Leader
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 5: Project Details & Description */}
          <div className="border border-[#E2E8F0] bg-[#FFFFFF] rounded-[18px] p-4 sm:p-5 space-y-3">
            <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block">
              Project Details
            </span>

            <h3 className="text-sm font-bold text-[#0F172A]">
              {team.projectTitle}
            </h3>

            <p className="text-xs text-[#475569] leading-relaxed whitespace-pre-line">
              {team.projectDescription ||
                'High-performance enterprise architecture deployed with strict zero-trust observability and distributed resilience.'}
            </p>

            {/* Tech Stack Pills */}
            {team.techStack && team.techStack.length > 0 && (
              <div className="pt-2 flex flex-wrap gap-1.5">
                {team.techStack.map((tech, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-[8px] bg-[#FEF2F2] text-[#B91C1C] border border-[#FECACA] text-[10px] font-bold"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Section 6: Project Links */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block">
              Project Links
            </span>
            <div className="flex flex-wrap gap-2.5">
              {team.repoUrl && (
                <a
                  href={team.repoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center px-3.5 py-2 bg-white border border-[#CBD5E1] rounded-[10px] font-bold text-xs text-[#0F172A] hover:bg-[#F8FAFC] transition-colors shadow-xs"
                >
                  <Github className="w-3.5 h-3.5 mr-1.5" />
                  GitHub Repository
                  <ArrowUpRight className="w-3 h-3 ml-1 text-[#94A3B8]" />
                </a>
              )}

              {team.demoUrl && (
                <a
                  href={team.demoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center px-3.5 py-2 bg-[#2563EB] text-white rounded-[10px] font-bold text-xs hover:bg-[#1D4ED8] transition-colors shadow-xs"
                >
                  <Globe className="w-3.5 h-3.5 mr-1.5" />
                  Live Solution Demo
                  <ArrowUpRight className="w-3 h-3 ml-1 text-white/80" />
                </a>
              )}
            </div>
          </div>

          {/* Section 7: AI & Jury Analysis (Pros, Cons, Improve) */}
          <div className="border border-[#FECDD3] bg-[#FFF1F2]/40 rounded-[18px] p-4 sm:p-5 space-y-4">
            <span className="text-[11px] font-black text-[#9F1239] uppercase tracking-wider block">
              AI & Jury Analysis
            </span>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              {/* Pros */}
              <div className="space-y-2">
                <span className="font-black text-[#881337] uppercase text-[11px] flex items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E11D48] mr-1.5" />
                  PROS
                </span>
                <ul className="space-y-2 text-[#4C0519] leading-relaxed">
                  {sc.pros.map((p, i) => (
                    <li key={i} className="flex items-start">
                      <span className="mr-1.5 text-[#E11D48] font-bold">•</span>
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Cons */}
              <div className="space-y-2">
                <span className="font-black text-[#881337] uppercase text-[11px] flex items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E11D48] mr-1.5" />
                  CONS
                </span>
                <ul className="space-y-2 text-[#4C0519] leading-relaxed">
                  {sc.cons.map((c, i) => (
                    <li key={i} className="flex items-start">
                      <span className="mr-1.5 text-[#E11D48] font-bold">•</span>
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Improve */}
              <div className="space-y-2">
                <span className="font-black text-[#881337] uppercase text-[11px] flex items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E11D48] mr-1.5" />
                  IMPROVE
                </span>
                <ul className="space-y-2 text-[#4C0519] leading-relaxed">
                  {sc.improve.map((imp, i) => (
                    <li key={i} className="flex items-start">
                      <span className="mr-1.5 text-[#E11D48] font-bold">•</span>
                      <span>{imp}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 sm:p-4 border-t border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between text-xs text-[#64748B]">
          <span className="font-medium flex items-center">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#059669] mr-1.5" />
            Calibrated Human & AI Evaluation Verified
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white border border-[#CBD5E1] text-[#0F172A] font-bold rounded-[9px] hover:bg-[#F1F5F9] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeamScorecardModal;
