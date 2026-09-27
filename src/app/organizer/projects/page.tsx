'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FolderKanban,
  Search,
  Github,
  ExternalLink,
  Video,
  FileText,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface ProjectItem {
  id: string;
  title: string;
  slug: string;
  tagline?: string | null;
  description: string;
  repoUrl: string;
  demoUrl?: string | null;
  videoUrl?: string | null;
  techStack: string[];
  createdAt: string;
  team: {
    id: string;
    name: string;
  };
  track?: {
    id: string;
    title: string;
  } | null;
  problemStatement?: {
    id: string;
    code: string;
    title: string;
  } | null;
  submissions?: {
    id: string;
    status: string;
    submittedAt?: string | null;
  }[];
}

export default function OrganizerProjectsPage() {
  const [hackathons, setHackathons] = useState<any[]>([]);
  const [selectedHackathonId, setSelectedHackathonId] = useState<string>('');
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function loadHackathons() {
      try {
        const res = await fetch('/api/v1/hackathons');
        const json = await res.json();
        if (json.data?.hackathons && json.data.hackathons.length > 0) {
          setHackathons(json.data.hackathons);
          setSelectedHackathonId(json.data.hackathons[0].id);
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadHackathons();
  }, []);

  const fetchProjects = async (hId: string) => {
    if (!hId) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/v1/hackathons/${hId}/projects`);
      const json = await res.json();
      if (res.ok && json.data?.projects) {
        setProjects(json.data.projects);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedHackathonId) {
      fetchProjects(selectedHackathonId);
    }
  }, [selectedHackathonId]);

  const filtered = projects.filter((p) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        p.title.toLowerCase().includes(q) ||
        p.team.name.toLowerCase().includes(q) ||
        p.track?.title.toLowerCase().includes(q) ||
        p.problemStatement?.title.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 select-none">
      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#E2E8F0] gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-bold text-[#2563EB] bg-[#EFF6FF] px-2.5 py-0.5 rounded-full border border-[#BFDBFE]">
              Solution Gallery
            </span>
            <span className="text-[11px] font-semibold text-[#64748B]">
              {projects.length} Total Projects
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#111827] mt-1 tracking-tight">
            Project Deliverables & Artifacts
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-0.5 font-normal">
            Inspect codebase repositories, live deployment links, architecture documentation, and track challenges.
          </p>
        </div>

        {hackathons.length > 0 && (
          <div className="flex items-center space-x-2">
            <label className="text-xs font-semibold text-[#334155]">Hackathon:</label>
            <select
              value={selectedHackathonId}
              onChange={(e) => setSelectedHackathonId(e.target.value)}
              className="px-3 py-2 bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] rounded-[11px] text-xs font-semibold text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            >
              {hackathons.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.title}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Search Bar */}
      <div className="relative w-full sm:w-80">
        <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          placeholder="Search projects, tracks, problem codes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-[38px] pl-10 pr-4 bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] rounded-[19px] text-xs text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/15"
        />
      </div>

      {/* Projects List */}
      {loading ? (
        <div className="py-16 text-center text-xs text-[#64748B]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2563EB] mx-auto mb-2" />
          Loading projects...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-[#E2E8F0] rounded-[18px] p-12 text-center space-y-3 shadow-card">
          <div className="w-12 h-12 rounded-2xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center mx-auto">
            <FolderKanban className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[#111827]">No Projects Created Yet</h3>
          <p className="text-xs text-[#64748B] max-w-sm mx-auto">
            Teams haven&apos;t created projects for this hackathon yet. Submissions will appear as teams build solutions.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((p) => {
            const submission = p.submissions?.[0];
            const isSubmitted = submission?.status === 'SUBMITTED' || submission?.status === 'LOCKED';

            return (
              <div
                key={p.id}
                className="bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] rounded-[18px] p-5 shadow-card space-y-4 transition-all text-xs"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-semibold text-[#334155]">Team: {p.team.name}</span>
                      <span>•</span>
                      {p.track && (
                        <Badge variant="purple" size="sm">
                          {p.track.title}
                        </Badge>
                      )}
                      {p.problemStatement && (
                        <Badge variant="blue" size="sm">
                          [{p.problemStatement.code}] {p.problemStatement.title}
                        </Badge>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-[#111827]">{p.title}</h3>
                    {p.tagline && <p className="text-xs text-[#64748B] mt-0.5">{p.tagline}</p>}
                  </div>

                  <Badge variant={isSubmitted ? 'emerald' : 'amber'} size="sm">
                    {isSubmitted ? '🔒 Submission Locked' : 'Draft In Progress'}
                  </Badge>
                </div>

                {/* Tech Stack Pills */}
                {p.techStack && p.techStack.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {p.techStack.map((tech) => (
                      <span
                        key={tech}
                        className="px-2 py-0.5 rounded-full text-[11px] bg-[#F1F5F9] text-[#475569] font-medium"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                )}

                {/* Links Strip */}
                <div className="pt-3 border-t border-[#F1F5F9] flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-3">
                    {p.repoUrl && (
                      <a
                        href={p.repoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center text-[#2563EB] hover:underline font-semibold"
                      >
                        <Github className="w-3.5 h-3.5 mr-1 text-[#111827]" />
                        Repository
                      </a>
                    )}
                    {p.demoUrl && (
                      <a
                        href={p.demoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center text-[#2563EB] hover:underline font-semibold"
                      >
                        <ExternalLink className="w-3.5 h-3.5 mr-1" />
                        Live Demo
                      </a>
                    )}
                    {p.videoUrl && (
                      <a
                        href={p.videoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center text-[#7E22CE] hover:underline font-semibold"
                      >
                        <Video className="w-3.5 h-3.5 mr-1" />
                        Video Walkthrough
                      </a>
                    )}
                  </div>

                  <Link href={`/projects/${p.id}`} target="_blank">
                    <Button variant="secondary" size="sm">
                      Inspect Project Details →
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
