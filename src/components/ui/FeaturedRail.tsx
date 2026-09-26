'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, Trophy, ArrowRight, TrendingUp, ShieldCheck } from 'lucide-react';

export interface FeaturedItem {
  id: string;
  title: string;
  slug: string;
  category: string;
  prize?: string;
  organization: string;
  logoUrl?: string;
  deadline?: string;
}

export interface FeaturedRailProps {
  items?: FeaturedItem[];
  className?: string;
}

export const FeaturedRail: React.FC<FeaturedRailProps> = ({
  items = [
    {
      id: 'feat_1',
      title: 'Apex AI Global Hackathon 2026',
      slug: 'apex-ai-global-hackathon-2026',
      category: 'Autonomous Agents & Cyber AI',
      prize: '$35,000 USD',
      organization: 'Apex Frontier Systems',
      deadline: 'In 3 days',
    },
    {
      id: 'feat_2',
      title: 'Global FinTech Zero-Knowledge Cup',
      slug: 'apex-ai-global-hackathon-2026',
      category: 'Web3 & Financial Protocols',
      prize: '$20,000 USD',
      organization: 'Decentralized Rails Foundation',
      deadline: 'In 12 days',
    },
    {
      id: 'feat_3',
      title: 'Autonomous Clinical Diagnostic Challenge',
      slug: 'apex-ai-global-hackathon-2026',
      category: 'Biomedical AI & RAG',
      prize: '$15,000 USD',
      organization: 'BioVeritas Health',
      deadline: 'In 18 days',
    },
  ],
  className = '',
}) => {
  return (
    <aside
      className={`w-[300px] lg:w-[316px] bg-[#F4F4F4] rounded-[18px] p-4 flex-shrink-0 flex flex-col space-y-4 border border-[#E2E8F0] shadow-card ${className}`}
    >
      {/* Featured Header */}
      <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
        <div className="flex items-center space-x-1.5 text-xs font-bold text-[#111827] uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-[#2563EB]" />
          <span>Featured Opportunities</span>
        </div>
        <span className="text-[11px] font-semibold text-[#2563EB] bg-[#EFF6FF] px-2 py-0.5 rounded-full border border-[#BFDBFE]">
          Curated
        </span>
      </div>

      {/* Featured Items List */}
      <div className="space-y-3">
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/hackathons/${item.slug}`}
            className="group block bg-white border border-[#E2E8F0] hover:border-[#93C5FD] rounded-[14px] p-3 transition-all duration-150 hover:shadow-subtle"
          >
            <div className="flex items-center space-x-3">
              {/* 48x48 Image/Logo */}
              <div className="w-12 h-12 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center p-1.5 flex-shrink-0 group-hover:scale-105 transition-transform overflow-hidden">
                {item.logoUrl ? (
                  <img src={item.logoUrl} alt={item.title} className="w-full h-full object-contain" />
                ) : (
                  <div className="w-full h-full rounded-lg bg-gradient-to-br from-[#EFF6FF] to-[#DBEAFE] flex items-center justify-center text-[#2563EB] font-bold text-sm">
                    {item.title.charAt(0)}
                  </div>
                )}
              </div>

              {/* Title & Category */}
              <div className="flex-1 min-w-0">
                <h4 className="text-[13px] font-semibold text-[#111827] group-hover:text-[#2563EB] transition-colors leading-snug truncate">
                  {item.title}
                </h4>
                <p className="text-[11px] text-[#64748B] truncate mt-0.5">{item.category}</p>
                <div className="flex items-center justify-between text-[11px] text-[#047857] font-semibold mt-1">
                  <span>{item.prize}</span>
                  <span className="text-[#94A3B8] font-normal text-[10px]">{item.deadline}</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Recommended Track Card */}
      <div className="bg-gradient-to-br from-[#111827] to-[#1E293B] text-white rounded-[14px] p-3.5 space-y-2 mt-2 shadow-sm">
        <div className="flex items-center space-x-1.5 text-[11px] text-[#93C5FD] font-semibold uppercase tracking-wider">
          <TrendingUp className="w-3 h-3 text-[#38BDF8]" />
          <span>Fast-Track Recognition</span>
        </div>
        <h4 className="text-xs font-bold leading-snug">
          Verifiable Skill Badges & Certificates
        </h4>
        <p className="text-[11px] text-[#94A3B8] leading-relaxed">
          Competitions feature tamper-proof digital certificates verifiable by top technology employers.
        </p>
        <div className="pt-1">
          <Link
            href="/leaderboard"
            className="inline-flex items-center text-[11px] font-bold text-white hover:text-[#93C5FD] transition-colors"
          >
            <span>Explore Hall of Fame</span>
            <ArrowRight className="w-3 h-3 ml-1" />
          </Link>
        </div>
      </div>

      {/* Safety & Compliance Badge */}
      <div className="flex items-center justify-center space-x-1.5 text-[11px] text-[#64748B] pt-1">
        <ShieldCheck className="w-3.5 h-3.5 text-[#059669]" />
        <span>Strict Jury Isolation & Fair Play Guaranteed</span>
      </div>
    </aside>
  );
};
