'use client';

import React from 'react';
import Link from 'next/link';
import { Heart, MessageSquare, ArrowUpRight, Github, ExternalLink, Trophy } from 'lucide-react';
import { Badge } from './Badge';

export interface ProjectCardProps {
  id: string;
  title: string;
  slug?: string;
  tagline?: string | null;
  description: string;
  thumbnailUrl?: string | null;
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
  return (
    <div className="group bg-white border border-[#E2E8F0] hover:border-[#93C5FD] rounded-[16px] overflow-hidden flex flex-col justify-between shadow-card hover:shadow-elevated transition-all duration-200 select-none">
      <div>
        {/* Project Thumbnail / Header Banner */}
        <div className="h-40 bg-gradient-to-br from-[#F8FAFC] to-[#EFF6FF] border-b border-[#E2E8F0] relative overflow-hidden flex items-center justify-center p-4">
          {thumbnailUrl ? (
            <img src={thumbnailUrl} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
          ) : (
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-white border border-[#E2E8F0] text-[#2563EB] font-black text-xl flex items-center justify-center mx-auto shadow-sm">
                {title.charAt(0)}
              </div>
              <span className="text-[11px] font-bold text-[#64748B] tracking-wider uppercase">
                {track?.title || 'Open Track'}
              </span>
            </div>
          )}

          {/* Rank Badge if awarded */}
          {officialRank && (
            <div className="absolute top-3 left-3 bg-[#111827] text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full flex items-center shadow-md">
              <Trophy className="w-3 h-3 text-[#F59E0B] mr-1" />
              Rank #{officialRank}
            </div>
          )}

          {/* Award Category Pill */}
          {awardCategory && (
            <div className="absolute bottom-3 left-3 bg-[#059669] text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm">
              {awardCategory}
            </div>
          )}
        </div>

        {/* Card Body */}
        <div className="p-5 space-y-3">
          <div className="flex items-center justify-between text-xs text-[#64748B]">
            {track && (
              <Badge variant="blue" size="sm">
                {track.title}
              </Badge>
            )}
            {team && <span className="font-medium text-[#334155] truncate max-w-[120px]">{team.name}</span>}
          </div>

          <Link href={`/projects/${id}`}>
            <h3 className="text-[17px] font-semibold text-[#111827] group-hover:text-[#2563EB] transition-colors line-clamp-1 leading-snug">
              {title}
            </h3>
          </Link>

          <p className="text-xs text-[#475569] line-clamp-2 leading-relaxed font-normal">
            {tagline || description}
          </p>

          {/* Tech Stack Pills */}
          {techStack.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {techStack.slice(0, 3).map((t) => (
                <span
                  key={t}
                  className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0]"
                >
                  {t}
                </span>
              ))}
              {techStack.length > 3 && (
                <span className="text-[11px] text-[#94A3B8] font-medium self-center pl-0.5">
                  +{techStack.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Card Footer */}
      <div className="p-4 px-5 border-t border-[#F1F5F9] flex items-center justify-between text-xs text-[#64748B]">
        <div className="flex items-center space-x-3 text-xs">
          <span className="inline-flex items-center text-[#DC2626] font-semibold">
            <Heart className="w-3.5 h-3.5 mr-1 fill-rose-50" />
            {votesCount}
          </span>
          <span className="inline-flex items-center text-[#475569] font-medium">
            <MessageSquare className="w-3.5 h-3.5 mr-1 text-[#94A3B8]" />
            {commentsCount}
          </span>
        </div>

        <Link
          href={`/projects/${id}`}
          className="inline-flex items-center text-xs font-semibold text-[#2563EB] hover:text-[#1D4ED8] group-hover:translate-x-0.5 transition-all"
        >
          <span>View Project</span>
          <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
        </Link>
      </div>
    </div>
  );
};
