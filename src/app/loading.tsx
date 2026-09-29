import React from 'react';

export default function RootLoading() {
  return (
    <div className="w-full min-h-[60vh] flex flex-col items-center justify-center p-8 space-y-4">
      {/* Sleek branded pulse spinner */}
      <div className="relative w-12 h-12 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full border-2 border-[#FA541C]/20 animate-ping" />
        <div className="w-10 h-10 rounded-full border-2 border-transparent border-t-[#FA541C] border-r-[#FA541C] animate-spin" />
        <div className="w-4 h-4 rounded-full bg-[#FA541C] shadow-md shadow-[#FA541C]/40" />
      </div>
      <p className="text-xs font-semibold text-[#94A3B8] tracking-wider uppercase animate-pulse">
        Loading ATLYX...
      </p>
    </div>
  );
}
