'use client';

import React, { useState, useEffect } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { Wifi, Radio, Bell, X, CheckCircle2, Zap } from 'lucide-react';

export const LiveStatusBadge: React.FC = () => {
  const { status, notifications, send, dismissNotification } = useWebSocket();
  const [open, setOpen] = useState(false);
  const [testSent, setTestSent] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Show a brief toast when a notification arrives
  useEffect(() => {
    if (notifications.length > 0) {
      const latest = notifications[0];
      const msg = latest.data?.message || latest.data?.title || latest.message || 'New live update received';
      setToastMessage(msg);
      const timer = setTimeout(() => setToastMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notifications]);

  const handleTestBroadcast = () => {
    send({
      type: 'BROADCAST',
      channel: 'general',
      event: 'ANNOUNCEMENT',
      data: {
        title: '⚡ Real-Time WebSocket Pulse',
        message: 'Live connection verified! Real-time telemetry is streaming over ws://localhost:3001',
      },
    });
    setTestSent(true);
    setTimeout(() => setTestSent(false), 2000);
  };

  const getStatusColor = () => {
    switch (status) {
      case 'connected':
        return 'bg-emerald-500';
      case 'connecting':
        return 'bg-amber-400';
      default:
        return 'bg-slate-400';
    }
  };

  const getStatusLabel = () => {
    switch (status) {
      case 'connected':
        return 'Live Sync';
      case 'connecting':
        return 'Connecting...';
      default:
        return 'Offline';
    }
  };

  return (
    <>
      {/* Floating Live Notification Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm bg-white rounded-2xl border border-blue-100 shadow-2xl p-4 flex items-start space-x-3 animate-in slide-in-from-bottom duration-200">
          <div className="p-2 bg-blue-50 text-[#2563EB] rounded-xl flex-shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h5 className="font-bold text-xs text-[#0F172A]">Real-Time Update</h5>
            <p className="text-xs text-[#64748B] mt-0.5 leading-relaxed truncate">{toastMessage}</p>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-slate-600 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Status Pill in Navbar */}
      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50/70 hover:bg-slate-100/70 transition-all text-left text-xs select-none"
          title="WebSocket Real-Time Gateway"
        >
          <span className="relative flex h-2 w-2">
            {status === 'connected' && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            )}
            <span className={`relative inline-flex rounded-full h-2 w-2 ${getStatusColor()}`} />
          </span>
          <span className="text-[11px] font-semibold text-slate-700 hidden sm:inline">
            {getStatusLabel()}
          </span>
        </button>

        {/* Popover Details Modal */}
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl border border-slate-200 shadow-xl p-4 z-50 animate-in fade-in duration-150 text-xs">
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <Radio className="w-4 h-4 text-[#2563EB]" />
                  <span className="font-bold text-[#0F172A]">WebSocket Gateway</span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    status === 'connected'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {status.toUpperCase()}
                </span>
              </div>

              <div className="py-3 space-y-2 text-[#475569]">
                <div className="flex justify-between items-center text-[11px]">
                  <span>Server URL:</span>
                  <span className="font-mono text-[10px] text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded">
                    ws://localhost:3001
                  </span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span>Subscribed Channels:</span>
                  <span className="font-semibold text-slate-800">
                    announcements, leaderboard
                  </span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span>Live Features:</span>
                  <span className="text-slate-800">Rankings, Submissions, Alerts</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={handleTestBroadcast}
                  className="w-full py-1.5 px-3 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-xs rounded-xl shadow-xs transition flex items-center justify-center space-x-1.5"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>{testSent ? 'Pulse Sent!' : 'Send Test WS Pulse'}</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
};
