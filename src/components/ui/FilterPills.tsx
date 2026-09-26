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
    <div className="flex items-center space-x-2 py-3 overflow-x-auto no-scrollbar relative">
      {/* Primary Filters Button */}
      <button
        onClick={() => {
          if (openDropdown === 'all') setOpenDropdown(null);
          else setOpenDropdown('all');
        }}
        className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all duration-150 select-none ${
          activeCount > 0
            ? 'bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]'
            : 'bg-white text-[#334155] border-[#E2E8F0] hover:bg-[#F8FAFC]'
        }`}
      >
        <SlidersHorizontal className="w-3.5 h-3.5" />
        <span>Filters</span>
        {activeCount > 0 && (
          <span className="w-4 h-4 rounded-full bg-[#2563EB] text-white text-[10px] flex items-center justify-center font-bold">
            {activeCount}
          </span>
        )}
      </button>

      {/* Individual Filter Pills */}
      {filterGroups.map((group) => {
        const currentValue = selectedFilters[group.id];
        const currentOption = group.options.find((o) => o.value === currentValue);
        const hasSelection = Boolean(currentValue);

        return (
          <div key={group.id} className="relative">
            <button
              onClick={() => setOpenDropdown(openDropdown === group.id ? null : group.id)}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all duration-150 select-none whitespace-nowrap ${
                hasSelection
                  ? 'bg-[#EFF6FF] text-[#1D4ED8] border-[#93C5FD] font-semibold'
                  : 'bg-white text-[#475569] border-[#E2E8F0] hover:bg-[#F8FAFC]'
              }`}
            >
              <span>{hasSelection ? currentOption?.label : group.label}</span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-[#94A3B8] transition-transform ${
                  openDropdown === group.id ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Dropdown Menu */}
            {openDropdown === group.id && (
              <div className="absolute top-full mt-1.5 left-0 z-50 w-52 bg-white rounded-xl border border-[#E2E8F0] shadow-lg py-1 text-xs animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-1.5 font-bold text-[#64748B] text-[10px] uppercase tracking-wider border-b border-[#F1F5F9]">
                  {group.label}
                </div>
                <div className="max-h-60 overflow-y-auto py-1">
                  {group.options.map((opt) => {
                    const isSelected = selectedFilters[group.id] === opt.value || (!selectedFilters[group.id] && opt.value === '');
                    return (
                      <button
                        key={opt.value}
                        onClick={() => {
                          onFilterChange(group.id, opt.value);
                          setOpenDropdown(null);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 text-left hover:bg-[#F8FAFC] transition-colors ${
                          isSelected ? 'font-semibold text-[#2563EB] bg-[#EFF6FF]/60' : 'text-[#334155]'
                        }`}
                      >
                        <span className="truncate">{opt.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#2563EB]" />}
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
          className="flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs font-medium text-[#DC2626] hover:bg-[#FEF2F2] transition-colors select-none whitespace-nowrap"
        >
          <X className="w-3 h-3" />
          <span>Clear Filters</span>
        </button>
      )}
    </div>
  );
};
