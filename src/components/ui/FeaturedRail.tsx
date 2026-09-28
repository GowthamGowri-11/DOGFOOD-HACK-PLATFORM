'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Trophy } from 'lucide-react';

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
  items = [],
  className = '',
}) => {
  return (
    <aside
      className={`w-full xl:w-[320px] bg-[#F4F4F4] rounded-[18px] p-4 flex-shrink-0 flex flex-col space-y-3.5 border border-[#E2E8F0] shadow-none ${className}`}
    >
      <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
        <h3 className="text-[16px] font-semibold text-[#334155]">Featured</h3>
        <Link
          href="/hackathons"
          className="text-[11px] font-medium text-[#2563EB] bg-white px-2.5 py-0.5 rounded-full border border-[#E2E8F0]"
        >
          Explore
        </Link>
      </div>

      <div className="space-y-3">
        {items.length === 0 ? (
          <div className="bg-white border border-[#E2E8F0] rounded-[13px] p-4 text-center space-y-2">
            <Trophy className="w-6 h-6 text-[#CBD5E1] mx-auto" />
            <p className="text-[12px] text-[#64748B]">No featured hackathons yet.</p>
            <Link href="/hackathons" className="text-[12px] font-semibold text-[#2563EB] hover:underline">
              Browse all events
            </Link>
          </div>
        ) : (
          items.map((item) => (
            <Link
              key={item.id}
              href={`/hackathons/${item.slug}`}
              className="group block bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] rounded-[13px] p-3 transition-colors shadow-none"
            >
              <div className="flex items-center space-x-3.5">
                <div className="w-[48px] h-[48px] rounded-[10px] bg-white border border-[#E2E8F0] flex items-center justify-center p-1.5 flex-shrink-0 overflow-hidden shadow-xs">
                  {item.logoUrl ? (
                    <img src={item.logoUrl} alt={item.title} className="w-full h-full object-contain" />
                  ) : (
                    <div className="w-full h-full rounded-[8px] bg-[#EFF6FF] flex items-center justify-center text-[#2563EB] font-bold text-sm">
                      {item.title.charAt(0)}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="text-[13.5px] font-semibold text-[#111827] group-hover:text-[#2563EB] transition-colors leading-[1.3] truncate">
                    {item.title}
                  </h4>
                  <p className="text-[11.5px] text-[#64748B] truncate mt-0.5">{item.category}</p>
                  <div className="flex items-center justify-between text-[11.5px] text-[#16A34A] font-semibold mt-1">
                    <span>{item.prize}</span>
                    <span className="text-[#94A3B8] font-normal text-[11px]">{item.deadline}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>

      <div className="pt-1 border-t border-[#E2E8F0]/60 flex items-center justify-between text-[12px] text-[#64748B] px-1">
        <span className="truncate">Verified skill credentials</span>
        <Link
          href="/leaderboard"
          className="text-[#2563EB] hover:underline font-medium text-[12px] flex items-center flex-shrink-0 ml-2"
        >
          <span>Hall of Fame</span>
          <ArrowRight className="w-3 h-3 ml-0.5" />
        </Link>
      </div>
    </aside>
  );
};
