'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Users, Globe, Clock, Trophy, Heart, Share2, ArrowUpRight, Sparkles } from 'lucide-react';
import { Badge } from './Badge';

export interface HackathonCardProps {
  id: string;
  slug: string;
  title: string;
  tagline?: string | null;
  organizationName: string;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  status: string;
  minTeamSize: number;
  maxTeamSize: number;
  eventMode?: 'Online' | 'In-Person' | 'Hybrid';
  tracks?: { id: string; title: string; colorHex?: string | null }[];
  prizes?: { amount: number | string; currency?: string; title: string }[];
  postedDate?: string | Date;
  deadlineDate?: string | Date;
  registeredCount?: number;
  featured?: boolean;
}

export const HackathonCard: React.FC<HackathonCardProps> = ({
  slug,
  title,
  tagline,
  organizationName,
  logoUrl,
  status,
  minTeamSize,
  maxTeamSize,
  eventMode = 'Online',
  tracks = [],
  prizes = [],
  postedDate,
  deadlineDate,
  registeredCount = 0,
  featured = false,
}) => {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [sharedToast, setSharedToast] = useState(false);

  // Compute total prize
  const totalPrize = prizes.reduce((acc, p) => acc + Number(p.amount || 0), 0);
  const currency = prizes[0]?.currency || 'USD';

  // Compute deadline text
  const getDeadlineText = () => {
    if (!deadlineDate) return 'Deadline TBA';
    const now = new Date();
    const end = new Date(deadlineDate);
    const diffDays = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return 'Ended';
    if (diffDays === 0) return 'Ends Today';
    if (diffDays === 1) return 'Ends Tomorrow';
    return `Deadline in ${diffDays} days`;
  };

  // Status badge config
  const getStatusBadge = () => {
    switch (status) {
      case 'REGISTRATION_OPEN':
        return <Badge variant="emerald">Open</Badge>;
      case 'SUBMISSION_OPEN':
        return <Badge variant="blue">Submitting</Badge>;
      case 'JUDGING':
        return <Badge variant="purple">In Judging</Badge>;
      case 'RESULTS_PUBLISHED':
      case 'COMPLETED':
        return <Badge variant="slate">Concluded</Badge>;
      default:
        return <Badge variant="amber">Upcoming</Badge>;
    }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`${window.location.origin}/hackathons/${slug}`);
      setSharedToast(true);
      setTimeout(() => setSharedToast(false), 2000);
    }
  };

  const handleBookmark = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsBookmarked(!isBookmarked);
  };

  return (
    <div className="group relative bg-white border border-[#E2E8F0] hover:border-[#93C5FD] rounded-[16px] p-5 sm:p-6 transition-all duration-200 hover:shadow-elevated select-none">
      {featured && (
        <div className="absolute -top-2.5 left-6 bg-[#2563EB] text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full flex items-center shadow-sm">
          <Sparkles className="w-3 h-3 mr-1" /> Featured
        </div>
      )}

      {/* Main card body - horizontal on desktop, vertical on mobile */}
      <div className="flex flex-col sm:flex-row items-start justify-between gap-5">
        {/* Left Column: Details */}
        <div className="flex-1 min-w-0 space-y-3.5">
          {/* Header Row: Title & Organization */}
          <div>
            <div className="flex items-center space-x-2 text-xs text-[#64748B] font-medium mb-1">
              <span className="text-[#334155] font-semibold">{organizationName}</span>
              <span>•</span>
              {getStatusBadge()}
            </div>

            <Link href={`/hackathons/${slug}`} className="block">
              <h3 className="text-[19px] font-semibold text-[#111827] group-hover:text-[#2563EB] transition-colors leading-snug truncate">
                {title}
              </h3>
            </Link>

            {tagline && (
              <p className="text-[14px] text-[#475569] line-clamp-1 mt-1 font-normal">
                {tagline}
              </p>
            )}
          </div>

          {/* Metadata Row: Team Size, Mode, Prize */}
          <div className="flex flex-wrap items-center gap-3 text-[13px] text-[#475569]">
            <span className="inline-flex items-center text-[#334155] font-medium">
              <Users className="w-3.5 h-3.5 mr-1.5 text-[#64748B]" />
              {minTeamSize === maxTeamSize
                ? `${minTeamSize} member`
                : `${minTeamSize}–${maxTeamSize} Members`}
            </span>

            <span className="inline-flex items-center text-[#334155] font-medium">
              <Globe className="w-3.5 h-3.5 mr-1.5 text-[#2563EB]" />
              {eventMode}
            </span>

            {totalPrize > 0 && (
              <span className="inline-flex items-center font-semibold text-[#047857] bg-[#ECFDF5] px-2 py-0.5 rounded-md border border-[#A7F3D0]/60 text-xs">
                <Trophy className="w-3.5 h-3.5 mr-1 text-[#059669]" />
                {currency} {totalPrize.toLocaleString()}
              </span>
            )}
          </div>

          {/* Tags Row */}
          {tracks.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              {tracks.slice(0, 3).map((t) => (
                <span
                  key={t.id}
                  className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0]"
                >
                  {t.title}
                </span>
              ))}
              {tracks.length > 3 && (
                <span className="text-xs text-[#94A3B8] font-medium self-center pl-1">
                  +{tracks.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Logo on desktop (80-90px) */}
        <div className="w-20 h-20 sm:w-[84px] sm:h-[84px] rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center flex-shrink-0 p-2 overflow-hidden shadow-card self-center sm:self-start">
          {logoUrl ? (
            <img src={logoUrl} alt={title} className="w-full h-full object-contain rounded-xl" />
          ) : (
            <div className="w-full h-full rounded-xl bg-gradient-to-br from-[#EFF6FF] to-[#DBEAFE] flex items-center justify-center text-[#2563EB] font-bold text-xl">
              {title.charAt(0)}
            </div>
          )}
        </div>
      </div>

      {/* Card Footer Row */}
      <div className="mt-4 pt-3.5 border-t border-[#F1F5F9] flex items-center justify-between text-xs text-[#64748B]">
        {/* Left: Posted Date & Deadline */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          {postedDate && (
            <span className="hidden sm:inline text-[#94A3B8]">
              Posted {new Date(postedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          )}

          <span className="inline-flex items-center font-medium text-[#D97706] bg-[#FFFBEB] px-2 py-0.5 rounded-md border border-[#FDE68A]">
            <Clock className="w-3 h-3 mr-1" />
            {getDeadlineText()}
          </span>

          {registeredCount > 0 && (
            <span className="hidden md:inline text-[#64748B]">
              <strong className="text-[#111827]">{registeredCount}</strong> registered
            </span>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center space-x-2">
          {/* Bookmark Button */}
          <button
            onClick={handleBookmark}
            aria-label="Bookmark competition"
            className={`p-1.5 rounded-lg border transition-colors ${
              isBookmarked
                ? 'bg-[#FEF2F2] border-[#FECACA] text-[#DC2626]'
                : 'bg-white border-[#E2E8F0] text-[#94A3B8] hover:text-[#DC2626] hover:bg-[#F8FAFC]'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-current' : ''}`} />
          </button>

          {/* Share Button */}
          <button
            onClick={handleShare}
            aria-label="Share competition"
            className="p-1.5 rounded-lg border border-[#E2E8F0] text-[#94A3B8] hover:text-[#111827] hover:bg-[#F8FAFC] transition-colors relative"
          >
            <Share2 className="w-3.5 h-3.5" />
            {sharedToast && (
              <span className="absolute -top-7 right-0 bg-[#111827] text-white text-[10px] px-2 py-0.5 rounded shadow whitespace-nowrap">
                Link copied!
              </span>
            )}
          </button>

          {/* CTA Link */}
          <Link
            href={`/hackathons/${slug}`}
            className="inline-flex items-center px-3 py-1.5 bg-[#EFF6FF] hover:bg-[#2563EB] text-[#2563EB] hover:text-white rounded-[10px] font-semibold text-xs transition-all duration-150"
          >
            <span>View Details</span>
            <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
          </Link>
        </div>
      </div>
    </div>
  );
};
