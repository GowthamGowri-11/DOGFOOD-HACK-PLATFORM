'use client';

import React, { useState, useMemo } from 'react';
import { Search, SlidersHorizontal, Layers, Sparkles, Filter, X } from 'lucide-react';
import { AppShell } from '@/components/ui/AppShell';
import { ProjectCard, ProjectCardProps } from '@/components/ui/ProjectCard';
import { Badge } from '@/components/ui/Badge';

export interface ProjectGalleryProps {
  initialProjects: ProjectCardProps[];
  tracksList: { label: string; value: string }[];
  techList: string[];
}

export const ProjectGallery: React.FC<ProjectGalleryProps> = ({
  initialProjects,
  tracksList,
  techList,
}) => {
  const [projects, setProjects] = useState<ProjectCardProps[]>(initialProjects);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrack, setSelectedTrack] = useState<string>('all');
  const [selectedTech, setSelectedTech] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'votes' | 'rank'>('newest');

  // Filter & sort logic
  const filteredProjects = useMemo(() => {
    return projects
      .filter((p) => {
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = p.title.toLowerCase().includes(q);
          const matchTagline = (p.tagline || '').toLowerCase().includes(q);
          const matchDesc = p.description.toLowerCase().includes(q);
          const matchTeam = (p.team?.name || '').toLowerCase().includes(q);
          const matchTech = (p.techStack || []).some((t) => t.toLowerCase().includes(q));
          if (!matchTitle && !matchTagline && !matchDesc && !matchTeam && !matchTech) {
            return false;
          }
        }

        // Track filter
        if (selectedTrack !== 'all') {
          if (p.track?.title !== selectedTrack) {
            return false;
          }
        }

        // Tech filter
        if (selectedTech !== 'all') {
          if (!(p.techStack || []).includes(selectedTech)) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'votes') {
          return (b.votesCount || 0) - (a.votesCount || 0);
        }
        if (sortBy === 'rank') {
          const rankA = a.officialRank ?? 99999;
          const rankB = b.officialRank ?? 99999;
          return rankA - rankB;
        }
        return 0; // Default order
      });
  }, [projects, searchQuery, selectedTrack, selectedTech, sortBy]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedTrack('all');
    setSelectedTech('all');
    setSortBy('newest');
  };

  const hasActiveFilters = searchQuery !== '' || selectedTrack !== 'all' || selectedTech !== 'all' || sortBy !== 'newest';

  return (
    <AppShell
      showFeaturedRail={true}
      pageTitle="Project Showcase & Solutions"
      pageSubtitle="Explore cutting-edge prototypes, open-source repositories, and community-voted solutions."
    >
      <div className="space-y-6">
        {/* Search & Filter Toolbar (Unstop Style) */}
        <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-[16px] p-4 shadow-card space-y-3">
          {/* Top Row: Search Input & Sort Selector */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search projects, technologies, team names, or keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[11px] text-xs sm:text-[13px] text-[#111827] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:bg-white transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#111827]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Sort Toggle Group */}
            <div className="flex items-center space-x-1.5 self-end sm:self-center flex-shrink-0 bg-[#F1F5F9] p-1 rounded-[11px] text-xs">
              <span className="text-[#64748B] font-semibold px-2 hidden sm:inline">Sort:</span>
              <button
                onClick={() => setSortBy('newest')}
                className={`px-3 py-1 rounded-[8px] font-semibold transition-all ${
                  sortBy === 'newest'
                    ? 'bg-white text-[#111827] shadow-xs'
                    : 'text-[#64748B] hover:text-[#111827]'
                }`}
              >
                Newest
              </button>
              <button
                onClick={() => setSortBy('votes')}
                className={`px-3 py-1 rounded-[8px] font-semibold transition-all ${
                  sortBy === 'votes'
                    ? 'bg-white text-[#DC2626] shadow-xs'
                    : 'text-[#64748B] hover:text-[#111827]'
                }`}
              >
                ❤️ Votes
              </button>
              <button
                onClick={() => setSortBy('rank')}
                className={`px-3 py-1 rounded-[8px] font-semibold transition-all ${
                  sortBy === 'rank'
                    ? 'bg-white text-[#2563EB] shadow-xs'
                    : 'text-[#64748B] hover:text-[#111827]'
                }`}
              >
                🏆 Rank
              </button>
            </div>
          </div>

          {/* Filter Pills Row */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#F1F5F9] text-xs">
            <span className="text-[#64748B] font-semibold flex items-center mr-1">
              <Filter className="w-3.5 h-3.5 mr-1 text-[#2563EB]" />
              Filter by:
            </span>

            {/* Track Selector */}
            <select
              value={selectedTrack}
              onChange={(e) => setSelectedTrack(e.target.value)}
              className="px-3 py-1.5 bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#CBD5E1] rounded-full text-xs font-medium text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2563EB] cursor-pointer"
            >
              <option value="all">All Tracks</option>
              {tracksList.map((t) => (
                <option key={t.value} value={t.label}>
                  {t.label}
                </option>
              ))}
            </select>

            {/* Technology Selector */}
            <select
              value={selectedTech}
              onChange={(e) => setSelectedTech(e.target.value)}
              className="px-3 py-1.5 bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#CBD5E1] rounded-full text-xs font-medium text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2563EB] cursor-pointer"
            >
              <option value="all">All Tech Stacks</option>
              {techList.map((tech) => (
                <option key={tech} value={tech}>
                  {tech}
                </option>
              ))}
            </select>

            {/* Clear Filters Button if active */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="ml-auto text-xs font-semibold text-[#2563EB] hover:text-[#1D4ED8] flex items-center space-x-1"
              >
                <span>Clear filters</span>
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Counter & Status Header */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center space-x-2">
            <span className="text-[15px] font-bold text-[#111827]">
              Verified Submissions
            </span>
            <Badge variant="blue" size="sm">
              {filteredProjects.length}
            </Badge>
          </div>
          <span className="text-xs text-[#64748B]">
            Showing all public submissions & published solutions
          </span>
        </div>

        {/* Projects Grid */}
        {filteredProjects.length === 0 ? (
          <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-[18px] p-12 text-center space-y-3 shadow-card">
            <div className="w-12 h-12 rounded-2xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center mx-auto">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#111827]">No projects match your filters</h3>
            <p className="text-xs text-[#64748B] max-w-sm mx-auto">
              Try changing the search keywords, selected track, or technology filters to see more results.
            </p>
            <div className="pt-2">
              <button
                onClick={clearFilters}
                className="px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-[11px] text-xs font-semibold transition-colors shadow-xs"
              >
                Reset All Filters
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredProjects.map((project) => (
              <ProjectCard key={project.id} {...project} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
};
