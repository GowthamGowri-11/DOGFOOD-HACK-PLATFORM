'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Heart, MessageSquare, ArrowRight, Trophy, Shield, Cpu, Activity, Dna, Layers } from 'lucide-react';

export interface ProjectCardProps {
  id: string;
  title: string;
  slug?: string;
  tagline?: string | null;
  description: string;
  thumbnailUrl?: string | null;
  thumbnailType?: 'brain' | 'lungs' | 'shield' | 'dna' | 'general';
  repoUrl?: string | null;
  demoUrl?: string | null;
  techStack?: string[];
  track?: { title: string; colorHex?: string | null };
  team?: { name: string };
  votesCount?: number;
  commentsCount?: number;
  officialRank?: number;
  awardCategory?: string | null;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  id,
  title,
  tagline,
  description,
  thumbnailUrl,
  thumbnailType = 'general',
  repoUrl,
  demoUrl,
  techStack = [],
  track,
  team,
  votesCount = 0,
  commentsCount = 0,
  officialRank,
  awardCategory,
}) => {
  const [votes, setVotes] = useState(votesCount);
  const [hasVoted, setHasVoted] = useState(false);

  const handleVote = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!hasVoted) {
      setVotes((prev) => prev + 1);
      setHasVoted(true);
    } else {
      setVotes((prev) => prev - 1);
      setHasVoted(false);
    }
  };

  // Determine thumbnail type if not explicitly passed
  let resolvedType = thumbnailType;
  const lowerTitle = (title + ' ' + (track?.title || '')).toLowerCase();
  if (lowerTitle.includes('quantum') || lowerTitle.includes('sentinel') || lowerTitle.includes('threat') || lowerTitle.includes('agent')) {
    resolvedType = 'brain';
  } else if (lowerTitle.includes('deepmatrix') || lowerTitle.includes('lung') || lowerTitle.includes('health') || lowerTitle.includes('multimodal')) {
    resolvedType = 'lungs';
  } else if (lowerTitle.includes('audit') || lowerTitle.includes('block') || lowerTitle.includes('crypto') || lowerTitle.includes('fintech')) {
    resolvedType = 'shield';
  } else if (lowerTitle.includes('scan') || lowerTitle.includes('med') || lowerTitle.includes('dna') || lowerTitle.includes('clinical')) {
    resolvedType = 'dna';
  }

  return (
    <div className="group bg-white border border-[#E5E0D8] hover:border-[#CBD5E1] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start gap-4 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative select-none">
      {/* ================= LEFT: THUMBNAIL BOX WITH RANK BADGE ================= */}
      <div className="w-full sm:w-[130px] h-[130px] rounded-xl relative overflow-hidden flex-shrink-0 bg-[#0E1015] border border-[#232630] flex items-center justify-center group-hover:scale-[1.02] transition-transform duration-300">
        {/* Glowing Orange Backdrop */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#FA541C]/35 via-[#E03A00]/15 to-transparent pointer-events-none" />

        {/* Thumbnail Graphic */}
        {thumbnailUrl ? (
          <img src={thumbnailUrl} alt={title} className="w-full h-full object-cover" />
        ) : resolvedType === 'brain' ? (
          /* Glowing Neural/Brain Avatar */
          <div className="relative w-full h-full flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#FA541C]/40 to-[#E03A00]/10 flex items-center justify-center border border-[#FA541C]/50 shadow-[0_0_20px_rgba(250,84,28,0.5)]">
              <Cpu className="w-8 h-8 text-[#FA8C16] stroke-[1.7] drop-shadow-[0_0_8px_#FA541C]" />
            </div>
            {/* Ambient Pulse Ring */}
            <div className="absolute inset-4 rounded-full border border-[#FA541C]/20 animate-ping opacity-25 pointer-events-none" />
          </div>
        ) : resolvedType === 'lungs' ? (
          /* Glowing Medical/Biometric Lungs */
          <div className="relative w-full h-full flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#FA541C]/40 to-[#E03A00]/10 flex items-center justify-center border border-[#FA541C]/50 shadow-[0_0_20px_rgba(250,84,28,0.5)]">
              <Activity className="w-8 h-8 text-[#FA8C16] stroke-[1.7] drop-shadow-[0_0_8px_#FA541C]" />
            </div>
          </div>
        ) : resolvedType === 'shield' ? (
          /* Glowing Security Shield */
          <div className="relative w-full h-full flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#FA541C]/40 to-[#E03A00]/10 flex items-center justify-center border border-[#FA541C]/50 shadow-[0_0_20px_rgba(250,84,28,0.5)]">
              <Shield className="w-8 h-8 text-[#FA8C16] stroke-[1.7] drop-shadow-[0_0_8px_#FA541C]" />
            </div>
          </div>
        ) : resolvedType === 'dna' ? (
          /* Glowing DNA / Diagnostics */
          <div className="relative w-full h-full flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#FA541C]/40 to-[#E03A00]/10 flex items-center justify-center border border-[#FA541C]/50 shadow-[0_0_20px_rgba(250,84,28,0.5)]">
              <Dna className="w-8 h-8 text-[#FA8C16] stroke-[1.7] drop-shadow-[0_0_8px_#FA541C]" />
            </div>
          </div>
        ) : (
          /* Default Technology / Solution */
          <div className="relative w-full h-full flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#FA541C]/40 to-[#E03A00]/10 flex items-center justify-center border border-[#FA541C]/50 shadow-[0_0_20px_rgba(250,84,28,0.5)]">
              <Layers className="w-8 h-8 text-[#FA8C16] stroke-[1.7] drop-shadow-[0_0_8px_#FA541C]" />
            </div>
          </div>
        )}

        {/* Top-Left Rank Badge */}
        {officialRank && (
          <div className="absolute top-2 left-2 bg-[#18181B]/95 text-amber-400 font-black text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md flex items-center shadow-md border border-amber-400/30 z-10 backdrop-blur-xs">
            <Trophy className="w-3 h-3 text-amber-400 mr-1" />
            <span>RANK #{officialRank}</span>
          </div>
        )}
      </div>

      {/* ================= RIGHT: CONTENT & METADATA ================= */}
      <div className="flex-1 min-w-0 flex flex-col justify-between h-full space-y-2">
        <div>
          {/* Track Tag Pill */}
          {track && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-[#FFE8D6] text-[#FA541C] border border-[#FED7AA] shadow-2xs mb-1">
              {track.title}
            </span>
          )}

          {/* Project Title */}
          <Link href={`/projects/${id}`}>
            <h3 className="text-[15px] sm:text-base font-extrabold text-[#18181B] group-hover:text-[#FA541C] transition-colors line-clamp-1 leading-snug">
              {title}
            </h3>
          </Link>

          {/* Subtitle / Description */}
          <p className="text-xs text-[#6B7280] line-clamp-1 mt-0.5 font-normal leading-relaxed">
            {tagline || description}
          </p>

          {/* Tech Stack Pills */}
          {techStack.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1.5">
              {techStack.slice(0, 3).map((t) => (
                <span
                  key={t}
                  className="bg-[#F3F4F6] text-[#4B5563] text-[10.5px] font-semibold px-2 py-0.5 rounded-md border border-[#E5E7EB]"
                >
                  {t}
                </span>
              ))}
              {techStack.length > 3 && (
                <span className="text-[10px] font-bold text-[#9CA3AF]">
                  +{techStack.length - 3}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Bottom Row: Likes & Comments on Left, View Project on Right */}
        <div className="flex items-center justify-between pt-2 border-t border-[#F4EFEA] text-xs">
          <div className="flex items-center space-x-3 text-[#6B7280]">
            <button
              onClick={handleVote}
              className={`flex items-center space-x-1 transition-colors cursor-pointer group/vote ${
                hasVoted ? 'text-[#FA541C] font-bold' : 'hover:text-[#FA541C]'
              }`}
              title="Vote for project"
            >
              <Heart
                className={`w-3.5 h-3.5 group-hover/vote:scale-125 transition-transform ${
                  hasVoted ? 'fill-[#FA541C] text-[#FA541C]' : ''
                }`}
              />
              <span className="text-[11px] font-semibold">{votes}</span>
            </button>

            <span className="flex items-center space-x-1">
              <MessageSquare className="w-3.5 h-3.5" />
              <span className="text-[11px] font-semibold">{commentsCount}</span>
            </span>
          </div>

          <Link
            href={`/projects/${id}`}
            className="inline-flex items-center space-x-1 text-xs font-bold text-[#FA541C] hover:text-[#EA4812] transition-colors group-hover:translate-x-1 transition-transform"
          >
            <span>View Project</span>
            <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
          </Link>
        </div>
      </div>
    </div>
  );
};
