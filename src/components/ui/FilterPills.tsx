'use client';

import React, { useState, useRef, useEffect } from 'react';
import { SlidersHorizontal, ChevronDown, Check, X, RotateCcw } from 'lucide-react';

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
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click without requiring an overlay backdrop
  useEffect(() => {
    if (!openDropdown) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openDropdown]);

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
    <div ref={containerRef} className="flex flex-wrap items-center gap-2 py-1 overflow-visible relative z-30">
        {/* Primary Filters Button */}
        <div className="relative">
          <button
            onClick={() => setOpenDropdown(openDropdown === 'all' ? null : 'all')}
            className={`flex items-center space-x-2 h-[38px] px-3.5 rounded-xl text-xs font-semibold border transition-all duration-200 select-none whitespace-nowrap cursor-pointer hover:-translate-y-0.5 active:scale-95 ${
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

          {/* Quick Filter Overview Popover */}
          {openDropdown === 'all' && (
            <div className="absolute top-full mt-1.5 left-0 z-50 w-72 bg-white rounded-2xl border border-[#E5E0D8] shadow-xl p-4 text-xs modal-content-enter">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#F4EFEA]">
                <div className="font-extrabold text-sm text-[#18181B] flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-[#FA541C]" />
                  <span>Active Filters ({activeCount})</span>
                </div>
                {activeCount > 0 && onClearAll && (
                  <button
                    onClick={() => {
                      onClearAll();
                      setOpenDropdown(null);
                    }}
                    className="text-[11px] font-bold text-red-600 hover:underline flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset
                  </button>
                )}
              </div>

              {activeCount === 0 ? (
                <p className="text-xs text-neutral-500 py-2">
                  No filters applied. Click any filter pill to narrow down hackathons.
                </p>
              ) : (
                <div className="space-y-2 py-1">
                  {filterGroups.map((g) => {
                    const val = selectedFilters[g.id];
                    if (!val) return null;
                    const opt = g.options.find((o) => o.value === val);
                    return (
                      <div key={g.id} className="flex items-center justify-between bg-neutral-50 px-2.5 py-1.5 rounded-lg border border-neutral-200/60">
                        <span className="text-neutral-500 text-[11px] font-medium">{g.label}:</span>
                        <div className="flex items-center gap-1.5 font-bold text-[#FA541C]">
                          <span>{opt?.label || val}</span>
                          <button
                            onClick={() => onFilterChange(g.id, '')}
                            className="hover:text-red-600"
                            title="Remove filter"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Individual Filter Dropdowns */}
        {filterGroups.map((group) => {
          const currentValue = selectedFilters[group.id];
          const currentOption = group.options.find((o) => o.value === currentValue);
          const hasSelection = Boolean(currentValue);

          return (
            <div key={group.id} className="relative">
              <button
                onClick={() => setOpenDropdown(openDropdown === group.id ? null : group.id)}
                className={`flex items-center space-x-1.5 h-[38px] px-3.5 rounded-xl text-xs font-medium border transition-all duration-200 select-none whitespace-nowrap cursor-pointer hover:-translate-y-0.5 active:scale-95 ${
                  hasSelection
                    ? 'bg-[#FFEDE1] text-[#FA541C] border-[#FED7AA] font-bold shadow-xs'
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
                <div className="absolute top-full mt-1.5 left-0 z-50 w-56 bg-white rounded-2xl border border-[#E5E0D8] shadow-xl py-1 text-xs modal-content-enter">
                  <div className="px-3.5 py-2 font-black text-[#6B7280] text-[10px] uppercase tracking-wider border-b border-[#F4EFEA] flex items-center justify-between">
                    <span>{group.label}</span>
                    {hasSelection && (
                      <button
                        onClick={() => {
                          onFilterChange(group.id, '');
                          setOpenDropdown(null);
                        }}
                        className="text-[10px] font-bold text-[#FA541C] hover:underline"
                      >
                        Reset
                      </button>
                    )}
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
                          className={`w-full flex items-center justify-between px-3.5 py-2 text-left transition-colors duration-150 hover:bg-[#FAF8F5] cursor-pointer ${
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
            className="flex items-center space-x-1.5 h-[38px] px-3.5 rounded-xl text-xs font-bold text-[#DC2626] bg-red-50/80 hover:bg-red-100 border border-red-200 transition-colors select-none whitespace-nowrap cursor-pointer ml-1"
          >
            <X className="w-3.5 h-3.5" />
            <span>Reset All</span>
          </button>
        )}
      </div>
  );
};
