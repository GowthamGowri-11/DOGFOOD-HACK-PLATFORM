'use client';

import React, { useState } from 'react';
import { SlidersHorizontal, ChevronDown, Check, X } from 'lucide-react';

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterGroup {
  id: string;
  label: string;
  options: FilterOption[];
}

export interface FilterPillsProps {
  selectedFilters: Record<string, string>;
  onFilterChange: (filterId: string, value: string) => void;
  onClearAll?: () => void;
  trackOptions?: FilterOption[];
}

export const FilterPills: React.FC<FilterPillsProps> = ({
  selectedFilters,
  onFilterChange,
  onClearAll,
  trackOptions = [],
}) => {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const filterGroups: FilterGroup[] = [
    {
      id: 'status',
      label: 'Status',
      options: [
        { label: 'All Statuses', value: '' },
        { label: 'Open for Registration', value: 'REGISTRATION_OPEN' },
        { label: 'Submissions Active', value: 'SUBMISSION_OPEN' },
        { label: 'In Judging', value: 'JUDGING' },
        { label: 'Completed', value: 'COMPLETED' },
      ],
    },
    {
      id: 'mode',
      label: 'Mode',
      options: [
        { label: 'All Modes', value: '' },
        { label: 'Online', value: 'ONLINE' },
        { label: 'In-Person', value: 'IN_PERSON' },
        { label: 'Hybrid', value: 'HYBRID' },
      ],
    },
    {
      id: 'track',
      label: 'Track',
      options: [
        { label: 'All Tracks', value: '' },
        ...trackOptions,
      ],
    },
    {
      id: 'technology',
      label: 'Technology',
      options: [
        { label: 'All Tech', value: '' },
        { label: 'AI & Agents', value: 'AI' },
        { label: 'Full Stack', value: 'FullStack' },
        { label: 'FinTech & Web3', value: 'FinTech' },
        { label: 'Cloud & DevOps', value: 'Cloud' },
        { label: 'Cybersecurity', value: 'Cybersecurity' },
      ],
    },
    {
      id: 'deadline',
      label: 'Deadline',
      options: [
        { label: 'Anytime', value: '' },
        { label: 'Ending in 3 days', value: '3d' },
        { label: 'Ending in 7 days', value: '7d' },
        { label: 'Ending this month', value: 'month' },
      ],
    },
    {
      id: 'sortBy',
      label: 'Sort By',
      options: [
        { label: 'Relevance', value: 'relevance' },
        { label: 'Closing Soon', value: 'deadline_asc' },
        { label: 'Highest Prize', value: 'prize_desc' },
        { label: 'Recently Added', value: 'created_desc' },
      ],
    },
  ];

  const activeCount = Object.values(selectedFilters).filter(Boolean).length;

  return (
    <div className="flex items-center space-x-2 py-1 overflow-x-auto no-scrollbar relative">
      {/* Primary Filters Button */}
      <button
        onClick={() => {
          if (openDropdown === 'all') setOpenDropdown(null);
          else setOpenDropdown('all');
        }}
        className={`flex items-center space-x-2 h-[36px] px-3.5 rounded-xl text-xs font-semibold border transition-all duration-200 select-none whitespace-nowrap cursor-pointer hover:-translate-y-0.5 active:scale-95 ${
          activeCount > 0
            ? 'bg-[#FFEDE1] text-[#FA541C] border-[#FED7AA] shadow-xs'
            : 'bg-white text-[#18181B] border-[#E5E0D8] hover:border-[#CBD5E1] hover:shadow-2xs'
        }`}
      >
        <SlidersHorizontal className="w-3.5 h-3.5" />
        <span>Filters</span>
        {activeCount > 0 && (
          <span className="w-4 h-4 rounded-full bg-[#FA541C] text-white text-[10px] flex items-center justify-center font-bold">
            {activeCount}
          </span>
        )}
      </button>

      {/* Individual Filter Dropdowns */}
      {filterGroups.map((group) => {
        const currentValue = selectedFilters[group.id];
        const currentOption = group.options.find((o) => o.value === currentValue);
        const hasSelection = Boolean(currentValue);

        return (
          <div key={group.id} className="relative">
            <button
              onClick={() => setOpenDropdown(openDropdown === group.id ? null : group.id)}
              className={`flex items-center space-x-1.5 h-[36px] px-3.5 rounded-xl text-xs font-medium border transition-all duration-200 select-none whitespace-nowrap cursor-pointer hover:-translate-y-0.5 active:scale-95 ${
                hasSelection
                  ? 'bg-[#FFEDE1] text-[#FA541C] border-[#FED7AA] font-semibold shadow-xs'
                  : 'bg-white text-[#18181B] border-[#E5E0D8] hover:border-[#CBD5E1] hover:shadow-2xs'
              }`}
            >
              <span>{hasSelection ? currentOption?.label : group.label}</span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-[#6B7280] transition-transform duration-200 ${
                  openDropdown === group.id ? 'rotate-180 text-[#FA541C]' : ''
                }`}
              />
            </button>

            {/* Dropdown Menu */}
            {openDropdown === group.id && (
              <div className="absolute top-full mt-1.5 left-0 z-50 w-52 bg-white rounded-xl border border-[#E5E0D8] shadow-lg py-1 text-xs animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="px-3 py-1.5 font-bold text-[#6B7280] text-[10px] uppercase tracking-wider border-b border-[#F4EFEA]">
                  {group.label}
                </div>
                <div className="max-h-60 overflow-y-auto py-1">
                  {group.options.map((option) => {
                    const isSelected = currentValue === option.value || (!currentValue && option.value === '');
                    return (
                      <button
                        key={option.value}
                        onClick={() => {
                          onFilterChange(group.id, option.value);
                          setOpenDropdown(null);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 text-left transition-colors duration-150 hover:bg-[#FAF8F5] cursor-pointer ${
                          isSelected ? 'font-bold text-[#FA541C] bg-[#FFF5ED]' : 'text-[#374151]'
                        }`}
                      >
                        <span className="truncate">{option.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#FA541C] flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Clear All Button */}
      {activeCount > 0 && onClearAll && (
        <button
          onClick={onClearAll}
          className="flex items-center space-x-1 h-[36px] px-3 rounded-xl text-xs font-semibold text-[#DC2626] hover:bg-[#FEF2F2] transition-colors select-none whitespace-nowrap cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
          <span>Clear</span>
        </button>
      )}
    </div>
  );
};
