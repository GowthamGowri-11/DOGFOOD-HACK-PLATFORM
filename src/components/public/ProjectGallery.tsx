'use client';

import React, { useState, useMemo } from 'react';
import { Search, Filter, X, ChevronDown, Layers } from 'lucide-react';
import { AppShell } from '@/components/ui/AppShell';
import { ProjectCard, ProjectCardProps } from '@/components/ui/ProjectCard';

export interface ProjectGalleryProps {
  initialProjects: ProjectCardProps[];
  tracksList: { label: string; value: string }[];
  techList: string[];
}

const DEFAULT_GALLERY_PROJECTS: ProjectCardProps[] = [
  {
    id: 'proj-quantum-sentinel',
    title: 'Quantum Sentinel AI: Autonomous Threat Mitigation',
    description: 'Real-time AI agent swarm for zero-day threat mitigation.',
    tagline: 'Real-time AI agent swarm for zero-day threat mitigation.',
    thumbnailType: 'brain',
    officialRank: 1,
    track: { title: 'Autonomous AI Agents', colorHex: '#FA541C' },
    team: { name: 'Sentinel Swarm' },
    techStack: ['Next.js', 'TypeScript', 'Rust', 'WebAssembly', 'Python'],
    votesCount: 0,
    commentsCount: 1,
  },
  {
    id: 'proj-deepmatrix-solution',
    title: 'DeepMatrix Solution',
    description: 'Enterprise solution built by DeepMatrix.',
    tagline: 'Enterprise solution built by DeepMatrix.',
    thumbnailType: 'lungs',
    officialRank: 4,
    track: { title: 'HealthTech & Multimodal Diagnostics', colorHex: '#FA541C' },
    team: { name: 'DeepMatrix' },
    techStack: ['Python', 'TensorFlow', 'PostgreSQL', 'FastAPI', 'Docker', 'React'],
    votesCount: 0,
    commentsCount: 0,
  },
  {
    id: 'proj-blockaudit-pro',
    title: 'BlockAudit Pro',
    description: 'Automated smart contract auditing using LLM + static analysis.',
    tagline: 'Automated smart contract auditing using LLM + static analysis.',
    thumbnailType: 'shield',
    officialRank: 5,
    track: { title: 'FinTech Intelligence & Cryptoora Audit', colorHex: '#FA541C' },
    team: { name: 'AuditCore' },
    techStack: ['Solidity', 'Python', 'React', 'Ethers.js', 'Hardhat'],
    votesCount: 0,
    commentsCount: 2,
  },
  {
    id: 'proj-mediscan-ai',
    title: 'MediScan AI',
    description: 'Multimodal medical image analysis for early disease detection.',
    tagline: 'Multimodal medical image analysis for early disease detection.',
    thumbnailType: 'dna',
    officialRank: 8,
    track: { title: 'HealthTech & Multimodal Diagnostics', colorHex: '#FA541C' },
    team: { name: 'BioScan Labs' },
    techStack: ['Python', 'PyTorch', 'OpenCV', 'Next.js', 'FastAPI'],
    votesCount: 0,
    commentsCount: 1,
  },
  {
    id: 'proj-vericlinical',
    title: 'VeriClinical: Deterministic Diagnostic Evidence Engine',
    description: 'Clinically safe citation-backed diagnostic assistant.',
    tagline: 'Clinically safe citation-backed diagnostic assistant.',
    thumbnailType: 'brain',
    officialRank: 9,
    track: { title: 'Autonomous AI Agents', colorHex: '#FA541C' },
    team: { name: 'Team VeriClinical' },
    techStack: ['Next.js', 'Python', 'PostgreSQL', 'TailwindCSS'],
    votesCount: 3,
    commentsCount: 4,
  },
  {
    id: 'proj-sentinelshield',
    title: 'SentinelShield: Autonomous Multi-Agent Threat Neutralization',
    description: 'Real-time distributed threat containment powered by formal verification agents.',
    tagline: 'Real-time distributed threat containment powered by formal verification agents.',
    thumbnailType: 'shield',
    officialRank: 11,
    track: { title: 'Autonomous AI Agents', colorHex: '#FA541C' },
    team: { name: 'Team SentinelShield' },
    techStack: ['Rust', 'TypeScript', 'Docker', 'Kubernetes'],
    votesCount: 5,
    commentsCount: 2,
  },
  {
    id: 'proj-neurosynth',
    title: 'NeuroSynth: Non-Invasive Neural Interface',
    description: 'Low-latency motor imagery decoding with transformer architectures.',
    tagline: 'Low-latency motor imagery decoding with transformer architectures.',
    thumbnailType: 'brain',
    officialRank: 12,
    track: { title: 'Autonomous AI Agents', colorHex: '#FA541C' },
    team: { name: 'NeuroCraft' },
    techStack: ['Python', 'PyTorch', 'C++', 'CUDA'],
    votesCount: 4,
    commentsCount: 3,
  },
  {
    id: 'proj-sovereign-defi',
    title: 'Sovereign DeFi Liquidity Protocol',
    description: 'Zero-knowledge cross-rollup atomic swaps with verified proofs.',
    tagline: 'Zero-knowledge cross-rollup atomic swaps with verified proofs.',
    thumbnailType: 'shield',
    officialRank: 14,
    track: { title: 'FinTech Intelligence & Cryptoora Audit', colorHex: '#FA541C' },
    team: { name: 'ZeroForge' },
    techStack: ['Solidity', 'Rust', 'Circom', 'Next.js'],
    votesCount: 6,
    commentsCount: 1,
  },
  {
    id: 'proj-biopulse',
    title: 'BioPulse: Genomic Variant Classifier',
    description: 'High-throughput somatic mutation pathogenicity predictor.',
    tagline: 'High-throughput somatic mutation pathogenicity predictor.',
    thumbnailType: 'dna',
    officialRank: 15,
    track: { title: 'HealthTech & Multimodal Diagnostics', colorHex: '#FA541C' },
    team: { name: 'GenomeX' },
    techStack: ['Python', 'R', 'Docker', 'FastAPI'],
    votesCount: 2,
    commentsCount: 1,
  },
  {
    id: 'proj-aetherflow',
    title: 'AetherFlow: Distributed Agent Orchestrator',
    description: 'Decentralized consensus framework for multi-agent workflows.',
    tagline: 'Decentralized consensus framework for multi-agent workflows.',
    thumbnailType: 'general',
    officialRank: 17,
    track: { title: 'Autonomous AI Agents', colorHex: '#FA541C' },
    team: { name: 'FlowState' },
    techStack: ['Go', 'TypeScript', 'gRPC', 'PostgreSQL'],
    votesCount: 1,
    commentsCount: 0,
  },
  {
    id: 'proj-cipherzero',
    title: 'CipherZero: Privacy-Preserving Proofs',
    description: 'Scalable recursive SNARK verification for enterprise identity.',
    tagline: 'Scalable recursive SNARK verification for enterprise identity.',
    thumbnailType: 'shield',
    officialRank: 20,
    track: { title: 'FinTech Intelligence & Cryptoora Audit', colorHex: '#FA541C' },
    team: { name: 'Cipher Labs' },
    techStack: ['Rust', 'Circom', 'React', 'Wasm'],
    votesCount: 3,
    commentsCount: 2,
  },
];

export const ProjectGallery: React.FC<ProjectGalleryProps> = ({
  initialProjects,
  tracksList,
  techList,
}) => {
  // Use real projects if DB has entries; otherwise fallback to reference showcase data
  const baseProjects =
    initialProjects && initialProjects.length > 0
      ? initialProjects
      : DEFAULT_GALLERY_PROJECTS;

  const [projects, setProjects] = useState<ProjectCardProps[]>(baseProjects);
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
        return 0; // Default newest
      });
  }, [projects, searchQuery, selectedTrack, selectedTech, sortBy]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedTrack('all');
    setSelectedTech('all');
    setSortBy('newest');
  };

  const hasActiveFilters =
    searchQuery !== '' || selectedTrack !== 'all' || selectedTech !== 'all' || sortBy !== 'newest';

  // Compute available tracks & tech list
  const availableTracks = useMemo(() => {
    const set = new Set<string>();
    baseProjects.forEach((p) => {
      if (p.track?.title) set.add(p.track.title);
    });
    return Array.from(set);
  }, [baseProjects]);

  const availableTech = useMemo(() => {
    const set = new Set<string>();
    baseProjects.forEach((p) => {
      (p.techStack || []).forEach((t) => set.add(t));
    });
    return Array.from(set).sort();
  }, [baseProjects]);

  return (
    <AppShell
      showFeaturedRail={true}
      pageTitle="Project Showcase & Solutions"
      pageSubtitle="Explore cutting-edge prototypes, open-source repositories, and community-voted solutions."
    >
      <div className="space-y-6 select-none max-w-[1440px] mx-auto pb-16">
        {/* ================= 1. HEADER SECTION ================= */}
        <div>
          {/* Small Top Orange Accent Bar */}
          <div className="w-10 h-1 bg-[#FA541C] rounded-full mb-3" />

          {/* Heading */}
          <h1 className="text-2xl sm:text-[34px] font-extrabold text-[#18181B] tracking-tight leading-tight">
            Project Showcase &amp; Solutions
          </h1>
          <p className="text-xs sm:text-[14px] text-[#6B7280] font-normal mt-1 leading-relaxed">
            Explore cutting-edge prototypes, open-source repositories, and community-voted solutions.
          </p>
        </div>

        {/* ================= 2. SEARCH & FILTER CONTROLS ================= */}
        <div className="bg-white border border-[#E5E0D8] rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
          {/* Top Row: Search Input & Sort Group */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search projects, technologies, team names, or keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-9 py-2.5 bg-[#FAF8F5] border border-[#E5E0D8] hover:border-[#CBD5E1] rounded-xl text-xs sm:text-[13px] text-[#18181B] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#FA541C]/20 focus:border-[#FA541C] focus:bg-white shadow-2xs transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#18181B] p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Sort Controls */}
            <div className="flex items-center space-x-1.5 self-end sm:self-center flex-shrink-0 bg-[#FAF8F5] border border-[#E5E0D8] p-1 rounded-xl text-xs">
              <span className="text-[#6B7280] font-bold px-2 text-xs hidden sm:inline">Sort:</span>
              <button
                onClick={() => setSortBy('newest')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  sortBy === 'newest'
                    ? 'bg-[#FA541C] text-white shadow-sm'
                    : 'text-[#6B7280] hover:text-[#18181B]'
                }`}
              >
                Newest
              </button>
              <button
                onClick={() => setSortBy('votes')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center space-x-1 ${
                  sortBy === 'votes'
                    ? 'bg-[#FA541C] text-white shadow-sm'
                    : 'text-[#6B7280] hover:text-[#18181B]'
                }`}
              >
                <span>❤️</span>
                <span>Votes</span>
              </button>
              <button
                onClick={() => setSortBy('rank')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center space-x-1 ${
                  sortBy === 'rank'
                    ? 'bg-[#FA541C] text-white shadow-sm'
                    : 'text-[#6B7280] hover:text-[#18181B]'
                }`}
              >
                <span>🏆</span>
                <span>Rank</span>
              </button>
            </div>
          </div>

          {/* Bottom Filter Row */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#F4EFEA] text-xs">
            <span className="text-[#FA541C] font-bold flex items-center mr-1">
              <Filter className="w-3.5 h-3.5 mr-1 text-[#FA541C]" />
              Filter by:
            </span>

            {/* Track Selector */}
            <div className="relative">
              <select
                value={selectedTrack}
                onChange={(e) => setSelectedTrack(e.target.value)}
                className="px-3.5 py-1.5 bg-white border border-[#E5E0D8] hover:border-[#CBD5E1] rounded-xl text-xs font-semibold text-[#18181B] focus:outline-none focus:ring-2 focus:ring-[#FA541C]/20 focus:border-[#FA541C] shadow-2xs cursor-pointer appearance-none pr-8"
              >
                <option value="all">All Tracks</option>
                {availableTracks.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[#9CA3AF] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Tech Stack Selector */}
            <div className="relative">
              <select
                value={selectedTech}
                onChange={(e) => setSelectedTech(e.target.value)}
                className="px-3.5 py-1.5 bg-white border border-[#E5E0D8] hover:border-[#CBD5E1] rounded-xl text-xs font-semibold text-[#18181B] focus:outline-none focus:ring-2 focus:ring-[#FA541C]/20 focus:border-[#FA541C] shadow-2xs cursor-pointer appearance-none pr-8"
              >
                <option value="all">All Tech Stacks</option>
                {availableTech.map((tech) => (
                  <option key={tech} value={tech}>
                    {tech}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[#9CA3AF] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Clear Filters Button if active */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="ml-auto text-xs font-bold text-[#FA541C] hover:text-[#EA4812] flex items-center space-x-1 cursor-pointer"
              >
                <span>Clear filters</span>
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* ================= 3. SECTION HEADER ================= */}
        <div className="flex items-center justify-between pt-1 px-1">
          <div className="flex items-center space-x-2.5">
            <span className="w-1.5 h-5 bg-[#FA541C] rounded-full inline-block" />
            <h2 className="text-base sm:text-[18px] font-extrabold text-[#18181B] tracking-tight">
              Verified Submissions
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FFE8D6] text-[#FA541C] border border-[#FED7AA]">
              {filteredProjects.length}
            </span>
          </div>

          <span className="text-xs text-[#9CA3AF] font-medium hidden sm:inline">
            Showing all public submissions &amp; published solutions
          </span>
        </div>

        {/* ================= 4. PROJECTS 2-COL GRID ================= */}
        {filteredProjects.length === 0 ? (
          <div className="bg-white border border-[#E5E0D8] rounded-2xl p-12 sm:p-16 text-center space-y-3 shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-[#FFE8D6] text-[#FA541C] flex items-center justify-center mx-auto">
              <Layers className="w-6 h-6 text-[#FA541C]" />
            </div>
            <h3 className="text-base font-extrabold text-[#18181B]">No projects match your filters</h3>
            <p className="text-xs text-[#6B7280] max-w-sm mx-auto leading-relaxed">
              Try changing the search keywords, selected track, or technology filters to see more results.
            </p>
            <div className="pt-2">
              <button
                onClick={clearFilters}
                className="px-4 py-2 bg-gradient-to-r from-[#FA541C] to-[#E03A00] hover:from-[#EA4812] hover:to-[#C93300] text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            {filteredProjects.map((project) => (
              <ProjectCard key={project.id} {...project} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
};
