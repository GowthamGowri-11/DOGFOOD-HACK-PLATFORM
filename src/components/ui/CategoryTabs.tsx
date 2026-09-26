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
    <div className="flex items-center space-x-2 border-b border-[#E2E8F0] pb-2 overflow-x-auto no-scrollbar">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const count = counts[tab.id];

        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex items-center space-x-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all duration-150 whitespace-nowrap select-none ${
              isActive
                ? 'bg-[#2563EB] text-white shadow-sm font-semibold'
                : 'bg-white text-[#475569] hover:text-[#111827] hover:bg-[#F8FAFC] border border-[#E2E8F0]'
            }`}
          >
            <span>{tab.label}</span>
            {count !== undefined && count > 0 && (
              <span
                className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${
                  isActive ? 'bg-white/25 text-white' : 'bg-[#F1F5F9] text-[#64748B]'
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
