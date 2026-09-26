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
      className={`bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] rounded-[16px] p-5 shadow-card transition-all duration-150 flex flex-col justify-between select-none ${className}`}
    >
      <div className="flex items-start justify-between">
        <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
          {label}
        </span>
        {icon && (
          <div className="w-8 h-8 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-[#2563EB] flex items-center justify-center flex-shrink-0">
            {icon}
          </div>
        )}
      </div>

      <div className="mt-3">
        <div className="text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-tight">
          {value}
        </div>

        {(subtext || trend || badge) && (
          <div className="flex items-center space-x-2 mt-1.5 text-xs">
            {trend && (
              <span
                className={`inline-flex items-center font-bold text-[11px] ${
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
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE]">
                {badge}
              </span>
            )}

            {subtext && !trend && (
              <span className="text-[#64748B] text-xs">{subtext}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
