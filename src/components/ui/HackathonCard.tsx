'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Users, Globe, Clock, Trophy, Heart, Share2, ArrowUpRight, ArrowRight, Sparkles, Layers } from 'lucide-react';
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
  rulesAndGuidelines?: string | null;
  variant?: 'grid' | 'list' | 'wide';
  isHighlighted?: boolean;
  roundsCount?: number;
}

export const HackathonCard: React.FC<HackathonCardProps> = ({
  slug,
  title,
  tagline,
  organizationName,
  logoUrl,
  bannerUrl,
  status,
  minTeamSize,
  maxTeamSize,
  roundsCount: propRoundsCount,
  eventMode = 'Online',
  tracks = [],
  prizes = [],
  postedDate,
  deadlineDate,
  registeredCount = 0,
  featured = false,
  rulesAndGuidelines,
  variant = 'grid',
  isHighlighted = false,
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

  // GRID CARD VARIANT (Matches Image 2 reference specifications)
  if (variant === 'grid') {
    // Helper to calculate rounds count
    const getRoundsCount = (): number => {
      if (rulesAndGuidelines) {
        try {
          const parsed = JSON.parse(rulesAndGuidelines);
          if (parsed.rounds && Array.isArray(parsed.rounds)) {
            return parsed.rounds.length;
          }
        } catch {
          // fallback
        }
      }
      return tracks && tracks.length > 0 ? tracks.length : 2;
    };

    const isPast = deadlineDate ? new Date(deadlineDate) < new Date() : false;
    const isExpired = status === 'COMPLETED' || isPast;
    const roundsCount = propRoundsCount ?? getRoundsCount();

    const renderGridStatusBadge = () => {
      if (isExpired) {
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[9.5px] font-bold tracking-wider uppercase bg-black/80 text-white border border-white/20">
            EXPIRED
          </span>
        );
      }
      if (status === 'SUBMISSION_OPEN') {
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[9.5px] font-bold tracking-wider uppercase bg-[#2563EB] text-white">
            SUBMITTING
          </span>
        );
      }
      if (status === 'REGISTRATION_OPEN' || status === 'EVENT_ACTIVE' || status === 'PUBLISHED') {
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[9.5px] font-bold tracking-wider uppercase bg-[#10B981] text-white">
            ACTIVE
          </span>
        );
      }
      if (status === 'JUDGING') {
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[9.5px] font-bold tracking-wider uppercase bg-[#7C3AED] text-white">
            JUDGING
          </span>
        );
      }
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[9.5px] font-bold tracking-wider uppercase bg-black/70 text-white">
          {status}
        </span>
      );
    };

    return (
      <div className="bg-white rounded-2xl border border-[#E5E0D8] p-4 shadow-xs hover:shadow-xl hover:-translate-y-1.5 hover:border-[#CBD5E1] transition-all duration-300 flex flex-col justify-between h-full select-none overflow-hidden group">
        <div>
          {/* Top Banner Box with Status Pill & ATLYX Brand */}
          <div className="w-full h-[145px] rounded-xl overflow-hidden relative group/banner flex flex-col justify-between p-3.5 bg-gradient-to-br from-[#1E293B] via-[#0F172A] to-black">
            {bannerUrl ? (
              <img
                src={bannerUrl}
                alt={title}
                className="absolute inset-0 w-full h-full object-cover group-hover/banner:scale-108 transition-transform duration-700 ease-out"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-[#1E1B2E] via-[#0F172A] to-[#111215]" />
            )}

            {/* Dark gradient overlay for high legibility */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/35" />

            {/* Top row inside banner */}
            <div className="relative z-10 flex items-center justify-between">
              <div>{renderGridStatusBadge()}</div>
              <div className="flex items-center space-x-1 text-white text-[10px] font-bold tracking-tight bg-black/40 px-2 py-0.5 rounded-full backdrop-blur-xs">
                <span className="text-[#FA541C] font-black text-xs">▲</span>
                <span>ATLYX</span>
              </div>
            </div>

            {/* Bottom text inside banner */}
            <div className="relative z-10 mt-auto text-left">
              <h2 className="text-white font-black text-[14.5px] sm:text-[15.5px] tracking-tight uppercase leading-snug line-clamp-2">
                {title}
              </h2>
              {tagline && (
                <p className="text-white/80 text-[10.5px] truncate mt-0.5">
                  {tagline}
                </p>
              )}
            </div>
          </div>

          {/* Title & Tagline in Card Body */}
          <div className="mt-3 text-left">
            <h3 className="font-bold text-[15px] text-[#111827] tracking-tight hover:text-[#FA541C] transition-colors line-clamp-1">
              <Link href={`/hackathons/${slug}`}>
                {title}
              </Link>
            </h3>
            <p className="text-xs text-[#6B7280] font-normal mt-0.5 line-clamp-1">
              {tagline || organizationName}
            </p>
          </div>

          {/* Stats Box (Team Size, Rounds) */}
          <div className="bg-[#FAF8F5] hover:bg-[#F6F2EC] border border-[#ECE6DD] rounded-xl p-2.5 my-3 grid grid-cols-2 divide-x divide-[#ECE6DD] text-center transition-colors duration-200">
            <div className="px-1">
              <div className="flex items-center justify-center space-x-1 text-[9px] font-bold text-[#6B7280] uppercase tracking-wider">
                <Users className="w-3 h-3 text-[#6B7280]" />
                <span>TEAM SIZE</span>
              </div>
              <span className="text-[13px] font-bold text-[#10B981] mt-0.5 block">
                {minTeamSize === maxTeamSize ? minTeamSize : `${minTeamSize}-${maxTeamSize}`}
              </span>
            </div>

            <div className="px-1">
              <div className="flex items-center justify-center space-x-1 text-[9px] font-bold text-[#6B7280] uppercase tracking-wider">
                <Layers className="w-3 h-3 text-[#6B7280]" />
                <span>ROUNDS</span>
              </div>
              <span className="text-[13px] font-bold text-[#10B981] mt-0.5 block">
                {roundsCount} {roundsCount === 1 ? 'Round' : 'Rounds'}
              </span>
            </div>
          </div>

          {/* Key Details: Prize & Event Mode */}
          <div className="space-y-2.5 my-2.5 text-xs text-left">
            <div className="flex items-center justify-between text-[12.5px]">
              {totalPrize > 0 ? (
                <span className="inline-flex items-center font-bold text-[#111827]">
                  <Trophy className="w-3.5 h-3.5 mr-1.5 text-[#EAB308] flex-shrink-0" />
                  {currency} {totalPrize.toLocaleString()}
                </span>
              ) : (
                <span className="inline-flex items-center font-semibold text-[#FA541C]">
                  <Sparkles className="w-3.5 h-3.5 mr-1.5 text-[#FA541C] flex-shrink-0" />
                  Prizes & Awards
                </span>
              )}

              <span className="inline-flex items-center text-[#6B7280] font-normal text-[11.5px]">
                <Globe className="w-3.5 h-3.5 mr-1 text-[#9CA3AF] flex-shrink-0" />
                {eventMode}
              </span>
            </div>

            {/* Tracks Pills */}
            {tracks.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                {tracks.slice(0, 2).map((t) => (
                  <span
                    key={t.id}
                    className="px-2 py-0.5 rounded-md text-[10.5px] font-medium bg-[#F5F2EB] hover:bg-[#FFEDE1] hover:text-[#FA541C] text-[#4B5563] truncate max-w-[125px] transition-colors cursor-pointer"
                    title={t.title}
                  >
                    {t.title}
                  </span>
                ))}
                {tracks.length > 2 && (
                  <span className="text-[10px] font-medium text-[#9CA3AF]">
                    +{tracks.length - 2} more
                  </span>
                )}
              </div>
            )}

            {/* Deadline & Registrations */}
            <div className="flex items-center justify-between text-[11px] text-[#6B7280] pt-2 border-t border-[#ECE6DD]">
              <span className="inline-flex items-center font-normal text-[#6B7280]">
                <Clock className="w-3.5 h-3.5 mr-1 text-[#9CA3AF] flex-shrink-0" />
                {getDeadlineText()}
              </span>

              {registeredCount > 0 && (
                <span className="inline-flex items-center font-normal text-[#6B7280]">
                  <Users className="w-3.5 h-3.5 mr-1 text-[#9CA3AF] flex-shrink-0" />
                  <span>{registeredCount} registered</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Card Bottom: VIEW DETAILS Button */}
        <div className="mt-3">
          <Link
            href={`/hackathons/${slug}`}
            className="w-full inline-flex items-center justify-between py-2.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 bg-white hover:bg-[#FA541C] border border-[#D1D5DB] hover:border-[#FA541C] text-[#111827] hover:text-white hover:shadow-md hover:shadow-[#FA541C]/20 shadow-xs group/btn cursor-pointer"
          >
            <span className="flex-1 text-center font-bold tracking-wider pl-4">
              VIEW DETAILS
            </span>
            <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200 bg-[#FFF5ED] group-hover/btn:bg-white/25 text-[#FA541C] group-hover/btn:text-white group-hover/btn:translate-x-0.5">
              <ArrowRight className="w-3 h-3 stroke-[2.5]" />
            </div>
          </Link>
        </div>
      </div>
    );
  }

  // WIDE PANORAMIC CARD VARIANT (Matches Explore Hackathons page reference)
  if (variant === 'wide') {
    const isPast = deadlineDate ? new Date(deadlineDate) < new Date() : false;
    const isExpired = status === 'COMPLETED' || isPast;
    const roundsCount = propRoundsCount ?? 4;

    const renderWideStatusBadge = () => {
      if (isExpired) {
        return (
          <span className="px-3 py-1 rounded-md text-[10.5px] font-bold tracking-wider uppercase bg-[#ECEAE4] text-[#6B7280]">
            EXPIRED
          </span>
        );
      }
      if (status === 'SUBMISSION_OPEN') {
        return (
          <span className="px-3 py-1 rounded-md text-[10.5px] font-bold tracking-wider uppercase bg-[#FFE8D6] text-[#FA541C]">
            SUBMITTING
          </span>
        );
      }
      if (status === 'REGISTRATION_OPEN' || status === 'EVENT_ACTIVE' || status === 'PUBLISHED') {
        return (
          <span className="px-3 py-1 rounded-md text-[10.5px] font-bold tracking-wider uppercase bg-[#ECFDF5] text-[#059669]">
            ACTIVE
          </span>
        );
      }
      return (
        <span className="px-3 py-1 rounded-md text-[10.5px] font-bold tracking-wider uppercase bg-[#F3F4F6] text-[#4B5563]">
          {status}
        </span>
      );
    };

    return (
      <div className="bg-white rounded-2xl border border-[#E5E0D8] p-5 shadow-xs hover:shadow-xl hover:-translate-y-1 hover:border-[#CBD5E1] transition-all duration-300 select-none overflow-hidden group mb-5">
        {/* Status Pill Badge at the very top */}
        <div className="mb-3">
          {renderWideStatusBadge()}
        </div>

        {/* Wide Panoramic Banner */}
        <div className="w-full h-[145px] sm:h-[165px] md:h-[180px] rounded-xl overflow-hidden relative flex flex-col justify-center items-center text-center p-4 bg-[#0B0C10] group/widebanner">
          {bannerUrl ? (
            <img
              src={bannerUrl}
              alt={title}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-r from-[#141416] via-[#1F1612] to-[#0A0A0C]" />
          )}

          {/* Dark gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/45 to-black/35" />

          {/* Banner Title and Subtitle Overlaid */}
          <div className="relative z-10 text-center px-4 max-w-2xl">
            <h2 className="text-white font-black text-xl sm:text-2xl md:text-[26px] tracking-tight uppercase leading-snug drop-shadow-md">
              {title.toLowerCase().includes('2026') ? (
                <>
                  {title.replace(/2026/i, '').trim()}{' '}
                  <span className="text-[#FA541C]">HACKATHON 2026</span>
                </>
              ) : (
                <>
                  {title} <span className="text-[#FA541C]">2026</span>
                </>
              )}
            </h2>
            {tagline && (
              <p className="text-white/85 text-xs sm:text-sm font-medium mt-1 drop-shadow-xs line-clamp-1">
                {tagline}
              </p>
            )}
          </div>
        </div>

        {/* Title & Tagline under Banner */}
        <div className="mt-4 text-left">
          <h3 className="font-extrabold text-[19px] sm:text-[21px] text-[#111827] tracking-tight hover:text-[#FA541C] transition-colors leading-snug">
            <Link href={`/hackathons/${slug}`}>
              {title}
            </Link>
          </h3>
          <p className="text-sm text-[#6B7280] font-normal mt-0.5 leading-normal line-clamp-1">
            {tagline || organizationName}
          </p>
        </div>

        {/* Specs Box: Team Size & Rounds */}
        <div className="bg-[#FAF8F5] hover:bg-[#F6F2EC] border border-[#ECE6DD] rounded-xl p-3 sm:p-3.5 my-3.5 grid grid-cols-2 divide-x divide-[#ECE6DD] text-left transition-colors duration-200">
          <div className="flex items-center justify-center space-x-3 px-2 sm:px-4">
            <Users className="w-5 h-5 text-[#6B7280] flex-shrink-0" />
            <div>
              <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider block">
                TEAM SIZE
              </span>
              <span className="text-base sm:text-lg font-bold text-[#FA541C] leading-tight block">
                {minTeamSize === maxTeamSize ? minTeamSize : `${minTeamSize} - ${maxTeamSize}`}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-center space-x-3 px-2 sm:px-4">
            <Layers className="w-5 h-5 text-[#6B7280] flex-shrink-0" />
            <div>
              <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider block">
                ROUNDS
              </span>
              <span className="text-base sm:text-lg font-bold text-[#10B981] leading-tight block">
                {roundsCount} Rounds
              </span>
            </div>
          </div>
        </div>

        {/* Key Details: Prize & Mode */}
        <div className="flex items-center justify-between text-left my-3">
          <div className="inline-flex items-center font-bold text-[#10B981] text-base sm:text-[17px]">
            <Trophy className="w-4 h-4 mr-2 text-[#10B981] flex-shrink-0" />
            <span>USD {totalPrize > 0 ? totalPrize.toLocaleString() : '40,000'}</span>
          </div>

          <div className="inline-flex items-center text-[#4B5563] font-bold text-sm">
            <Globe className="w-4 h-4 mr-1.5 text-[#6B7280] flex-shrink-0" />
            <span>{eventMode}</span>
          </div>
        </div>

        {/* Tags Pills */}
        {tracks.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 my-2.5">
            {tracks.slice(0, 2).map((t) => (
              <span
                key={t.id}
                className="px-3 py-1 rounded-md text-xs font-medium bg-[#F3F4F6] hover:bg-[#FFEDE1] hover:text-[#FA541C] text-[#4B5563] truncate max-w-[200px] transition-colors duration-150 cursor-pointer"
                title={t.title}
              >
                {t.title}
              </span>
            ))}
            {tracks.length > 2 && (
              <span className="text-xs font-medium text-[#9CA3AF] px-1">
                +{tracks.length - 2} more
              </span>
            )}
          </div>
        )}

        {/* Status & Registrations Footer Row */}
        <div className="flex items-center justify-between text-xs pt-3 pb-1 border-t border-[#ECE6DD]">
          <span className="inline-flex items-center font-semibold text-[#FA541C]">
            <Clock className="w-3.5 h-3.5 mr-1.5 text-[#FA541C] flex-shrink-0" />
            <span>{isExpired ? 'Ended' : getDeadlineText()}</span>
          </span>

          <span className="inline-flex items-center font-medium text-[#6B7280]">
            <Users className="w-3.5 h-3.5 mr-1.5 text-[#9CA3AF] flex-shrink-0" />
            <span>{registeredCount > 0 ? registeredCount : 42} registered</span>
          </span>
        </div>

        {/* Full-width VIEW DETAILS Orange Button */}
        <div className="mt-3.5">
          <Link
            href={`/hackathons/${slug}`}
            className="w-full inline-flex items-center justify-center py-3.5 px-6 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider transition-all duration-200 bg-[#FA541C] hover:bg-[#EA4812] hover:shadow-lg hover:shadow-[#FA541C]/30 hover:-translate-y-0.5 active:translate-y-0 text-white shadow-sm relative group/btn cursor-pointer"
          >
            <span>VIEW DETAILS</span>
            <div className="absolute right-4 w-7 h-7 rounded-full flex items-center justify-center bg-white text-[#FA541C] group-hover/btn:translate-x-1.5 group-hover/btn:scale-105 transition-all duration-200">
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </div>
          </Link>
        </div>
      </div>
    );
  }

  // LIST CARD VARIANT (Horizontal Layout)
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
