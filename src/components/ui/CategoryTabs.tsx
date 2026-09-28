'use client';

import React from 'react';

export interface CategoryTabsProps {
  activeTab: string;
  onChange: (tab: string) => void;
  counts?: Record<string, number>;
}

export const CategoryTabs: React.FC<CategoryTabsProps> = ({
  activeTab,
  onChange,
  counts = {},
}) => {
  const tabs = [
    { id: 'all', label: 'All', defaultCount: 50 },
    { id: 'hackathons', label: 'Hackathons', defaultCount: 50 },
    { id: 'open', label: 'Open', defaultCount: 3 },
    { id: 'upcoming', label: 'Upcoming', defaultCount: 46 },
    { id: 'my-hackathons', label: 'My Hackathons', defaultCount: 1 },
  ];

  return (
    <div className="flex items-center space-x-2.5 overflow-x-auto no-scrollbar py-1">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const count = counts[tab.id] ?? tab.defaultCount;

        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex items-center space-x-2 h-[38px] px-4 rounded-full text-xs font-semibold transition-all duration-200 whitespace-nowrap select-none cursor-pointer hover:-translate-y-0.5 active:scale-95 ${
              isActive
                ? 'bg-[#FA541C] text-white shadow-md shadow-[#FA541C]/25'
                : 'bg-white text-[#18181B] hover:border-[#CBD5E1] hover:shadow-2xs border border-[#E5E0D8]'
            }`}
          >
            <span>{tab.label}</span>
            {count !== undefined && (
              <span
                className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                  isActive ? 'bg-white/25 text-white' : 'bg-[#FFEDE1] text-[#FA541C]'
                }`}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
