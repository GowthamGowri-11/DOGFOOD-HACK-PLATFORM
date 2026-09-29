import React from 'react';

export default function ParticipantLoading() {
  return (
    <div className="w-full space-y-6 animate-pulse">
      {/* Top Header Placeholder */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between pb-5 border-b border-[#E2E8F0] gap-4">
        <div className="space-y-2">
          <div className="h-8 w-52 bg-slate-200 rounded-lg" />
          <div className="h-4 w-80 bg-slate-100 rounded-md" />
        </div>
        <div className="h-10 w-32 bg-slate-200 rounded-xl" />
      </div>

      {/* Grid of items / projects / teams */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="p-6 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="h-4 w-28 bg-slate-200 rounded" />
              <div className="h-5 w-16 bg-slate-100 rounded-full" />
            </div>
            <div className="space-y-2">
              <div className="h-5 w-48 bg-slate-200 rounded" />
              <div className="h-3.5 w-full bg-slate-100 rounded" />
              <div className="h-3.5 w-3/4 bg-slate-100 rounded" />
            </div>
            <div className="pt-3 border-t border-[#F1F5F9] flex items-center justify-between">
              <div className="h-4 w-20 bg-slate-100 rounded" />
              <div className="h-8 w-24 bg-slate-200 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
