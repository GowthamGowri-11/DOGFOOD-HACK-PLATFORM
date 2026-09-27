'use client';

import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'blue' | 'emerald' | 'amber' | 'purple' | 'slate' | 'rose' | 'neutral';
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'blue',
  size = 'sm',
  icon,
  className = '',
}) => {
  const sizeStyles = {
    sm: 'text-[11px] px-2.5 py-0.5 font-medium tracking-tight gap-1',
    md: 'text-xs px-3 py-1 font-semibold gap-1.5',
  };

  const variantStyles = {
    blue: 'bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE]',
    emerald: 'bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0]',
    amber: 'bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A]',
    purple: 'bg-[#FAF5FF] text-[#7E22CE] border border-[#E9D5FF]',
    rose: 'bg-[#FEF2F2] text-[#B91C1C] border border-[#FECACA]',
    slate: 'bg-[#F1F5F9] text-[#334155] border border-[#E2E8F0]',
    neutral: 'bg-white text-[#475569] border border-[#E2E8F0] shadow-card',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full select-none ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span className="truncate">{children}</span>
    </span>
  );
};
