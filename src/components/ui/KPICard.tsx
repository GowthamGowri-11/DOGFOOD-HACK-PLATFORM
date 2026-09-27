'use client';

import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export interface KPICardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon?: React.ReactNode;
  trend?: {
    value: string | number;
    isPositive?: boolean;
    label?: string;
  };
  badge?: string;
  className?: string;
}

export const KPICard: React.FC<KPICardProps> = ({
  label,
  value,
  subtext,
  icon,
  trend,
  badge,
  className = '',
}) => {
  return (
    <div
      className={`bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] rounded-2xl p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)] transition-all duration-150 flex flex-col justify-between select-none ${className}`}
    >
      <div className="flex items-start justify-between">
        <span className="text-[12px] sm:text-[13px] font-medium text-[#64748B] uppercase tracking-[0.03em]">
          {label}
        </span>
        {icon && (
          <div className="w-8 h-8 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-[#2563EB] flex items-center justify-center flex-shrink-0">
            {icon}
          </div>
        )}
      </div>

      <div className="mt-3.5">
        <div className="text-[30px] sm:text-[34px] font-bold text-[#111827] tracking-tight leading-[1.1]">
          {value}
        </div>

        {(subtext || trend || badge) && (
          <div className="flex items-center space-x-2 mt-1.5 text-[12px] sm:text-[13px]">
            {trend && (
              <span
                className={`inline-flex items-center font-medium ${
                  trend.isPositive !== false ? 'text-[#059669]' : 'text-[#DC2626]'
                }`}
              >
                {trend.isPositive !== false ? (
                  <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
                ) : (
                  <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
                )}
                {trend.value}
                {trend.label && <span className="text-[#94A3B8] font-normal ml-1">{trend.label}</span>}
              </span>
            )}

            {badge && (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE]">
                {badge}
              </span>
            )}

            {subtext && !trend && (
              <span className="text-[#64748B] text-[12px] sm:text-[13px] font-normal">{subtext}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
