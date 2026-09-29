'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ExternalLink,
  Layers,
  Heart,
  MessageSquare,
  Award,
  Sparkles,
  Trophy,
} from 'lucide-react';

interface ProjectEmbedItem {
  id: string;
  title: string;
  tagline?: string | null;
  description: string;
  techStack: string[];
  track?: { title: string; colorHex?: string | null };
  team?: { name: string };
  votesCount?: number;
  commentsCount?: number;
  officialRank?: number;
}

const FALLBACK_PROJECTS: ProjectEmbedItem[] = [
  {
    id: 'proj-vericlinical',
    title: 'VeriClinical: Deterministic Diagnostic Evidence Engine',
    tagline: 'Clinically safe citation-backed diagnostic assistant.',
    description: 'Clinically safe citation-backed diagnostic assistant with sub-second retrieval.',
    techStack: ['Next.js', 'Python', 'PostgreSQL', 'TailwindCSS'],
    track: { title: 'Autonomous AI Agents', colorHex: '#FA541C' },
    team: { name: 'Team VeriClinical' },
    votesCount: 8,
    commentsCount: 4,
    officialRank: 1,
  },
  {
    id: 'proj-sentinelshield',
    title: 'SentinelShield: Autonomous Multi-Agent Threat Neutralization',
    tagline: 'Real-time distributed threat containment powered by formal verification agents.',
    description: 'Real-time distributed threat containment powered by formal verification agents.',
    techStack: ['Rust', 'TypeScript', 'Docker', 'Kubernetes'],
    track: { title: 'Autonomous AI Agents', colorHex: '#FA541C' },
    team: { name: 'Team SentinelShield' },
    votesCount: 12,
    commentsCount: 3,
    officialRank: 2,
  },
  {
    id: 'proj-blockaudit-pro',
    title: 'BlockAudit Pro: ZK Automated Smart Contract Verification',
    tagline: 'Automated smart contract auditing using LLM + static analysis.',
    description: 'Automated smart contract auditing using LLM + static analysis.',
    techStack: ['Solidity', 'Python', 'React', 'Hardhat'],
    track: { title: 'Resilient FinTech', colorHex: '#10B981' },
    team: { name: 'AuditCore' },
    votesCount: 6,
    commentsCount: 2,
    officialRank: 3,
  },
  {
    id: 'proj-neurosynth',
    title: 'NeuroSynth: Non-Invasive Neural Motor Interface',
    tagline: 'Low-latency motor imagery decoding with transformer architectures.',
    description: 'Low-latency motor imagery decoding with transformer architectures.',
    techStack: ['PyTorch', 'FastAPI', 'Next.js', 'WASM'],
    track: { title: 'Autonomous AI Agents', colorHex: '#6366F1' },
    team: { name: 'NeuroLabs' },
    votesCount: 9,
    commentsCount: 1,
    officialRank: 4,
  },
];

export default function EmbedGalleryWidgetPage() {
  const searchParams = useSearchParams();
  const hackathonId = searchParams.get('hackathonId') || 'hack_apex_2026';
  const trackId = searchParams.get('trackId') || undefined;
  const theme = searchParams.get('theme') || 'dark'; // 'dark' | 'light'
  const isDark = theme === 'dark';

  const [projects, setProjects] = useState<ProjectEmbedItem[]>(FALLBACK_PROJECTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProjects() {
      try {
        setLoading(true);
        const res = await fetch(`/api/v1/gallery?hackathonId=${hackathonId}`);
        const json = await res.json();
        if (json.success && json.data?.projects && json.data.projects.length > 0) {
          setProjects(
            json.data.projects.map((p: any) => ({
              id: p.id,
              title: p.title,
              tagline: p.tagline,
              description: p.description,
              techStack: p.techStack || [],
              track: p.track,
              team: p.team,
              votesCount: p.communityVotesCount || 0,
              commentsCount: p.commentsCount || 0,
              officialRank: p.officialResult?.rank,
            }))
          );
        }
      } catch (err) {
        console.warn('Embed widget fallback applied:', err);
      } finally {
        setLoading(false);
      }
    }
    loadProjects();
  }, [hackathonId]);

  return (
    <div
      className={`min-h-screen p-3 sm:p-5 select-none ${
        isDark ? 'bg-[#131417] text-neutral-100' : 'bg-[#FAF8F5] text-neutral-900'
      }`}
    >
      <div className="max-w-6xl mx-auto space-y-4">
        {/* Widget Top Bar */}
        <div className="flex items-center justify-between gap-3 border-b pb-3 border-neutral-200/40 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FA541C] animate-pulse" />
            <h1 className="text-sm sm:text-base font-extrabold tracking-tight flex items-center gap-1.5">
              <span>Hackathon Solution Showcase</span>
            </h1>
          </div>

          <a
            href="/projects"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold text-[#FA541C] hover:underline flex items-center gap-1"
          >
            <span>Open Full Gallery</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {projects.map((project) => (
            <a
              key={project.id}
              href={`/projects/${project.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`p-4 rounded-xl border transition-all duration-200 flex flex-col justify-between group ${
                isDark
                  ? 'bg-[#1A1C20] border-neutral-800 hover:border-neutral-700 hover:bg-[#202227]'
                  : 'bg-white border-neutral-200 hover:border-neutral-300 hover:shadow-sm'
              }`}
            >
              <div>
                {/* Track Badge & Rank */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold"
                    style={{
                      backgroundColor: `${project.track?.colorHex || '#FA541C'}20`,
                      color: project.track?.colorHex || '#FA541C',
                    }}
                  >
                    {project.track?.title || 'General'}
                  </span>

                  {project.officialRank && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                      <Trophy className="w-2.5 h-2.5" />
                      <span>#{project.officialRank}</span>
                    </span>
                  )}
                </div>

                {/* Title */}
                <h2 className="text-xs sm:text-sm font-bold tracking-tight line-clamp-2 group-hover:text-[#FA541C] transition-colors leading-snug">
                  {project.title}
                </h2>

                {/* Tagline / Snippet */}
                <p className="text-[11px] text-neutral-400 line-clamp-2 mt-1 leading-relaxed">
                  {project.tagline || project.description}
                </p>

                {/* Tech tags */}
                <div className="flex flex-wrap gap-1 mt-2.5">
                  {project.techStack.slice(0, 3).map((tech) => (
                    <span
                      key={tech}
                      className="px-1.5 py-0.5 rounded text-[9.5px] font-mono bg-neutral-100 dark:bg-neutral-800 text-neutral-500"
                    >
                      {tech}
                    </span>
                  ))}
                  {project.techStack.length > 3 && (
                    <span className="text-[9.5px] text-neutral-400 self-center">
                      +{project.techStack.length - 3}
                    </span>
                  )}
                </div>
              </div>

              {/* Card Footer */}
              <div className="flex items-center justify-between pt-3 mt-3 border-t border-neutral-100 dark:border-neutral-800/60 text-[10.5px] text-neutral-400">
                <span className="truncate max-w-[120px] font-medium text-neutral-500">
                  {project.team?.name || 'Hackathon Team'}
                </span>

                <div className="flex items-center gap-2 font-mono">
                  <span className="flex items-center gap-1">
                    <Heart className="w-2.5 h-2.5 text-[#FA541C]" />
                    {project.votesCount}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-2.5 h-2.5 text-neutral-400" />
                    {project.commentsCount}
                  </span>
                </div>
              </div>
            </a>
          ))}
        </div>

        {/* Powered By Footer */}
        <div className="pt-2 text-center text-[10px] text-neutral-400 flex items-center justify-center gap-1">
          <span>Embeddable Showcase powered by</span>
          <a
            href="/"
            target="_blank"
            className="font-bold text-[#FA541C] hover:underline"
          >
            Dogfood Hackathon Platform
          </a>
        </div>
      </div>
    </div>
  );
}
