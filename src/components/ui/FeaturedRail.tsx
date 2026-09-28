'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Trophy, Calendar } from 'lucide-react';

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

const DEFAULT_FEATURED_ITEMS: FeaturedItem[] = [
  {
    id: 'feat_1',
    title: 'Apex AI Global Hackathon 2026',
    slug: 'apex-ai-global-hackathon-2026',
    category: 'Autonomous Agents & Cyber AI',
    prize: '$35,000 USD',
    organization: 'Apex Frontier',
    deadline: 'In 3 days',
  },
  {
    id: 'feat_2',
    title: 'Global FinTech Zero-Knowled...',
    slug: 'global-fintech-zero-knowledge',
    category: 'Web3 & Financial Protocols',
    prize: '$20,000 USD',
    organization: 'FinTech Labs',
    deadline: 'In 12 days',
  },
  {
    id: 'feat_3',
    title: 'Autonomous Clinical Diagnost...',
    slug: 'autonomous-clinical-diagnostics',
    category: 'Biomedical AI & RAG',
    prize: '$15,000 USD',
    organization: 'HealthAI Corp',
    deadline: 'In 18 days',
  },
];

export const FeaturedRail: React.FC<FeaturedRailProps> = ({
  items,
  className = '',
}) => {
  const displayItems = (items && items.length > 0) ? items : DEFAULT_FEATURED_ITEMS;

  return (
    <aside
      className={`w-full xl:w-[310px] flex-shrink-0 flex flex-col space-y-3 select-none ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-1 px-1">
        <h3 className="text-[17px] font-bold text-[#18181B]">Featured</h3>
        <Link
          href="/hackathons"
          className="text-xs font-semibold text-[#FA541C] hover:text-[#EA4812] flex items-center space-x-1 group/link transition-colors"
        >
          <span>Explore</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover/link:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Featured Items List */}
      <div className="space-y-3">
        {displayItems.slice(0, 3).map((item, idx) => {
          const initialLetter = item.title.startsWith('Global') ? 'G' : 'A';

          return (
            <Link
              key={item.id || idx}
              href={`/hackathons/${item.slug}`}
              className="group/rail block bg-white border border-[#E5E0D8] hover:border-[#FA541C]/40 hover:-translate-y-1 rounded-2xl p-3.5 transition-all duration-300 shadow-xs hover:shadow-md"
            >
              <div className="flex items-center space-x-3.5">
                {/* Brand letter avatar */}
                <div className="w-[44px] h-[44px] rounded-xl bg-[#FFE8D6] text-[#FA541C] group-hover/rail:scale-108 group-hover/rail:bg-[#FA541C] group-hover/rail:text-white flex items-center justify-center font-extrabold text-base flex-shrink-0 transition-all duration-300 shadow-2xs">
                  {initialLetter}
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="text-[13px] font-bold text-[#111827] group-hover/rail:text-[#FA541C] transition-colors leading-[1.3] truncate">
                    {item.title}
                  </h4>
                  <p className="text-[11px] text-[#6B7280] truncate mt-0.5">{item.category}</p>

                  <div className="flex items-center justify-between text-[11.5px] font-bold mt-1.5">
                    <span className="text-[#10B981]">{item.prize || '$25,000 USD'}</span>
                    <span className="text-[#6B7280] font-normal text-[10.5px] flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-[#9CA3AF]" />
                      <span>{item.deadline || 'Soon'}</span>
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Footer */}
      <div className="pt-2 flex items-center justify-between text-[11.5px] text-[#6B7280] px-1">
        <span>Verified skill credentials</span>
        <Link
          href="/leaderboard"
          className="text-[#FA541C] hover:text-[#EA4812] font-semibold flex items-center space-x-0.5 group/fame transition-colors"
        >
          <span>Hall of Fame</span>
          <ArrowRight className="w-3 h-3 ml-0.5 group-hover/fame:translate-x-1 transition-transform" />
        </Link>
      </div>
    </aside>
  );
};
