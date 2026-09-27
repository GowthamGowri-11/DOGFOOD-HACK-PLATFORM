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
    { id: 'all', label: 'All' },
    { id: 'hackathons', label: 'Hackathons' },
    { id: 'open', label: 'Open' },
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'my-hackathons', label: 'My Hackathons' },
  ];

  return (
    <div className="flex items-center space-x-2.5 overflow-x-auto no-scrollbar py-1">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const count = counts[tab.id];

        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex items-center space-x-2 h-[42px] px-[18px] rounded-[22px] text-[13.5px] font-medium transition-colors whitespace-nowrap select-none ${
              isActive
                ? 'bg-white text-[#2563EB] border-[1.5px] border-[#3B82F6] font-semibold'
                : 'bg-white text-[#334155] hover:text-[#111827] hover:border-[#CBD5E1] border border-[#E2E8F0]'
            }`}
          >
            <span>{tab.label}</span>
            {count !== undefined && count > 0 && (
              <span
                className={`text-[11px] px-1.5 py-0.5 rounded-full font-bold ${
                  isActive ? 'bg-[#EFF6FF] text-[#2563EB]' : 'bg-[#F1F5F9] text-[#64748B]'
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
