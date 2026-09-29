import React from 'react';

export default function AdminLoading() {
  return (
    <div className="w-full space-y-6 animate-pulse">
      {/* Top Header Placeholder */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between pb-5 border-b border-[#E2E8F0] gap-4">
        <div className="space-y-2">
          <div className="h-8 w-56 bg-slate-200 rounded-lg" />
          <div className="h-4 w-80 bg-slate-100 rounded-md" />
        </div>
        <div className="h-10 w-32 bg-slate-200 rounded-xl" />
      </div>

      {/* 4 Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-3.5 w-24 bg-slate-100 rounded" />
              <div className="w-9 h-9 rounded-xl bg-slate-100" />
            </div>
            <div className="h-7 w-20 bg-slate-200 rounded-md" />
            <div className="h-3 w-28 bg-slate-100 rounded" />
          </div>
        ))}
      </div>

      {/* Main Content / Table Area */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-xs space-y-4">
        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between pb-4 border-b border-[#F1F5F9]">
          <div className="h-10 w-full sm:w-72 bg-slate-100 rounded-xl" />
          <div className="flex gap-2 w-full sm:w-auto">
            <div className="h-10 w-24 bg-slate-100 rounded-xl" />
            <div className="h-10 w-24 bg-slate-100 rounded-xl" />
          </div>
        </div>

        {/* Rows */}
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((row) => (
            <div
              key={row}
              className="flex items-center justify-between p-4 rounded-xl bg-[#F8FAFC] border border-[#F1F5F9]"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-full bg-slate-200 flex-shrink-0" />
                <div className="space-y-1.5">
                  <div className="h-4 w-40 bg-slate-200 rounded" />
                  <div className="h-3 w-28 bg-slate-100 rounded" />
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-6">
                <div className="h-5 w-20 bg-slate-200 rounded-full" />
                <div className="h-4 w-24 bg-slate-100 rounded" />
              </div>
              <div className="h-8 w-20 bg-slate-100 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
