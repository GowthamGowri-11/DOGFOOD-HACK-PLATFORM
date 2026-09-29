import React from 'react';

export default function OrganizerLoading() {
  return (
    <div className="w-full space-y-6 animate-pulse">
      {/* Top Header Placeholder */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between pb-5 border-b border-[#E2E8F0] gap-4">
        <div className="space-y-2">
          <div className="h-8 w-64 bg-slate-200 rounded-lg" />
          <div className="h-4 w-96 bg-slate-100 rounded-md" />
        </div>
        <div className="h-10 w-36 bg-slate-200 rounded-xl" />
      </div>

      {/* 3 Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-3.5 w-28 bg-slate-100 rounded" />
              <div className="w-9 h-9 rounded-xl bg-slate-100" />
            </div>
            <div className="h-7 w-20 bg-slate-200 rounded-md" />
            <div className="h-3 w-32 bg-slate-100 rounded" />
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {[1, 2, 3, 4, 5, 6].map((card) => (
          <div
            key={card}
            className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-xs space-y-4"
          >
            <div className="h-36 bg-slate-100 rounded-xl w-full" />
            <div className="space-y-2">
              <div className="h-5 w-3/4 bg-slate-200 rounded" />
              <div className="h-3.5 w-full bg-slate-100 rounded" />
            </div>
            <div className="pt-2 flex items-center justify-between border-t border-[#F1F5F9]">
              <div className="h-4 w-20 bg-slate-100 rounded" />
              <div className="h-8 w-24 bg-slate-200 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
