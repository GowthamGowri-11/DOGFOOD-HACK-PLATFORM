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
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-medium bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]/60">
            Open
          </span>
        );
      case 'SUBMISSION_OPEN':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-medium bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]/60">
            Submitting
          </span>
        );
      case 'JUDGING':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-medium bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE]/60">
            In Judging
          </span>
        );
      case 'RESULTS_PUBLISHED':
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-medium bg-[#F1F5F9] text-[#64748B] border border-[#E2E8F0]">
            Concluded
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-medium bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]/60">
            Upcoming
          </span>
        );
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
    <div className="group relative bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] rounded-[16px] p-6 transition-colors select-none shadow-none mb-4">
      {featured && (
        <div className="absolute -top-2.5 left-6 bg-[#2563EB] text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full flex items-center">
          <Sparkles className="w-3 h-3 mr-1" /> Featured
        </div>
      )}

      {/* Main card body - horizontal on desktop, vertical on mobile */}
      <div className="flex flex-col sm:flex-row items-start justify-between gap-5">
        {/* Left Column: Details */}
        <div className="flex-1 min-w-0 space-y-3">
          {/* Header: Title & Organization */}
          <div>
            <div className="flex items-center space-x-2 text-[12px] text-[#64748B] font-medium mb-1">
              {getStatusBadge()}
              <span>•</span>
              <span className="text-[#334155] text-[15px] font-normal">{organizationName}</span>
            </div>

            <Link href={`/hackathons/${slug}`} className="block">
              <h3 className="text-[19.5px] font-semibold text-[#1F2937] group-hover:text-[#2563EB] transition-colors leading-[1.3] truncate">
                {title}
              </h3>
            </Link>

            {tagline && (
              <p className="text-[14px] text-[#64748B] line-clamp-1 mt-0.5 font-normal leading-[1.4]">
                {tagline}
              </p>
            )}
          </div>

          {/* Metadata Row: Members, Mode, Prize */}
          <div className="flex flex-wrap items-center gap-3 text-[13.5px] text-[#475569]">
            <span className="inline-flex items-center text-[#475569] font-normal">
              <Users className="w-4 h-4 mr-1.5 text-[#64748B]" />
              {minTeamSize === maxTeamSize
                ? `${minTeamSize} Member`
                : `${minTeamSize}–${maxTeamSize} Members`}
            </span>

            <span className="text-[#CBD5E1]">•</span>

            <span className="inline-flex items-center text-[#475569] font-normal">
              <Globe className="w-4 h-4 mr-1.5 text-[#64748B]" />
              {eventMode}
            </span>

            {totalPrize > 0 && (
              <>
                <span className="text-[#CBD5E1]">•</span>
                <span className="inline-flex items-center font-medium text-[#16A34A]">
                  <Trophy className="w-4 h-4 mr-1 text-[#16A34A]" />
                  {currency} {totalPrize.toLocaleString()}
                </span>
              </>
            )}
          </div>

          {/* Tags Row */}
          {tracks.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {tracks.slice(0, 3).map((t) => (
                <span
                  key={t.id}
                  className="h-[32px] px-3 rounded-[16px] text-[13px] font-normal bg-[#F8FAFC] text-[#64748B] flex items-center border border-transparent"
                >
                  {t.title}
                </span>
              ))}
              {tracks.length > 3 && (
                <span className="text-[13px] text-[#94A3B8] font-normal self-center pl-1">
                  +{tracks.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Logo on desktop (84x84px) */}
        <div className="w-20 h-20 sm:w-[84px] sm:h-[84px] rounded-[10px] bg-white border border-[#E2E8F0] flex items-center justify-center flex-shrink-0 p-2 overflow-hidden self-center sm:self-start">
          {logoUrl ? (
            <img src={logoUrl} alt={title} className="w-full h-full object-contain" />
          ) : (
            <div className="w-full h-full rounded-[8px] bg-[#EFF6FF] flex items-center justify-center text-[#2563EB] font-bold text-xl">
              {title.charAt(0)}
            </div>
          )}
        </div>
      </div>

      {/* Card Footer Row */}
      <div className="mt-4 pt-3.5 border-t border-[#F1F5F9] flex items-center justify-between text-[13px] text-[#64748B]">
        {/* Left: Posted Date & Deadline */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          {postedDate && (
            <span className="text-[#334155] font-normal">
              Posted {new Date(postedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          )}

          <span className="text-[#CBD5E1] hidden sm:inline">•</span>

          <span className="text-[#334155] font-medium flex items-center">
            <Clock className="w-3.5 h-3.5 mr-1 text-[#64748B]" />
            {getDeadlineText()}
          </span>

          {registeredCount > 0 && (
            <>
              <span className="text-[#CBD5E1] hidden md:inline">•</span>
              <span className="hidden md:inline text-[#64748B]">
                <strong className="text-[#334155] font-semibold">{registeredCount}</strong> registered
              </span>
            </>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center space-x-2">
          {/* Share Button */}
          <button
            onClick={handleShare}
            aria-label="Share competition"
            className="p-1.5 rounded-lg text-[#64748B] hover:text-[#111827] hover:bg-[#F8FAFC] transition-colors relative"
            title="Share"
          >
            <Share2 className="w-[18px] h-[18px]" />
            {sharedToast && (
              <span className="absolute -top-7 right-0 bg-[#111827] text-white text-[10px] px-2 py-0.5 rounded shadow whitespace-nowrap">
                Link copied!
              </span>
            )}
          </button>

          {/* Bookmark Button */}
          <button
            onClick={handleBookmark}
            aria-label="Bookmark competition"
            className={`p-1.5 rounded-lg transition-colors ${
              isBookmarked
                ? 'text-[#DC2626] bg-[#FEF2F2]'
                : 'text-[#64748B] hover:text-[#DC2626] hover:bg-[#F8FAFC]'
            }`}
            title="Favorite"
          >
            <Heart className={`w-[18px] h-[18px] ${isBookmarked ? 'fill-current' : ''}`} />
          </button>

          {/* Compact View Details Link */}
          <Link
            href={`/hackathons/${slug}`}
            className="inline-flex items-center px-3 py-1.5 bg-[#EFF6FF] hover:bg-[#2563EB] text-[#2563EB] hover:text-white rounded-[8px] font-medium text-[13px] transition-colors ml-1"
          >
            <span>View</span>
            <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
          </Link>
        </div>
      </div>
    </div>
  );
};
