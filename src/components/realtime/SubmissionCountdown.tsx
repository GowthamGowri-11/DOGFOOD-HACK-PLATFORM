'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Clock, Lock, CheckCircle2, AlertTriangle, AlertCircle, Sparkles } from 'lucide-react';
import { getRealtimeClient } from '@/lib/realtime/client';
import { RealtimeRoomBuilder } from '@/server/realtime/event-types';

export interface SubmissionCountdownProps {
  hackathonId: string;
  subStartTime?: string | Date;
  subEndTime?: string | Date;
  serverTime?: string | Date;
  isLocked?: boolean;
  onStateChange?: (state: 'UPCOMING' | 'SUBMISSION_OPEN' | 'SUBMISSION_CLOSED') => void;
  showCard?: boolean;
  compact?: boolean;
}

function safeParseDate(val?: string | Date | null): Date | null {
  if (!val) return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

function safeIsoString(val?: string | Date | null, fallbackDate?: Date): string {
  const d = safeParseDate(val) || fallbackDate || new Date();
  return d.toISOString();
}

export function SubmissionCountdown({
  hackathonId,
  subStartTime: initialSubStartTime,
  subEndTime: initialSubEndTime,
  serverTime: initialServerTime,
  isLocked = false,
  onStateChange,
  showCard = true,
  compact = false,
}: SubmissionCountdownProps) {
  const [subStartTime, setSubStartTime] = useState<string>(() =>
    safeIsoString(initialSubStartTime, new Date())
  );
  const [subEndTime, setSubEndTime] = useState<string>(() =>
    safeIsoString(initialSubEndTime, new Date(Date.now() + 86400000))
  );

  // Sync internal state when props update (e.g. after asynchronous project data load)
  useEffect(() => {
    if (initialSubStartTime) {
      const d = safeParseDate(initialSubStartTime);
      if (d) setSubStartTime(d.toISOString());
    }
  }, [initialSubStartTime]);

  useEffect(() => {
    if (initialSubEndTime) {
      const d = safeParseDate(initialSubEndTime);
      if (d) setSubEndTime(d.toISOString());
    }
  }, [initialSubEndTime]);

  // Server time offset calculation to prevent client clock manipulation
  const serverOffsetRef = useRef<number>(0);
  useEffect(() => {
    if (initialServerTime) {
      const d = safeParseDate(initialServerTime);
      if (d) {
        serverOffsetRef.current = d.getTime() - Date.now();
      }
    }
  }, [initialServerTime]);

  const getEffectiveServerTime = useCallback(() => {
    return Date.now() + serverOffsetRef.current;
  }, []);

  const computeStatus = useCallback((): 'UPCOMING' | 'SUBMISSION_OPEN' | 'SUBMISSION_CLOSED' => {
    const now = getEffectiveServerTime();
    const opensAtDate = safeParseDate(subStartTime);
    const deadlineDate = safeParseDate(subEndTime);

    if (!opensAtDate || !deadlineDate) {
      return 'SUBMISSION_OPEN';
    }

    const opensAt = opensAtDate.getTime();
    const deadline = deadlineDate.getTime();

    if (now < opensAt) return 'UPCOMING';
    if (now >= opensAt && now < deadline) return 'SUBMISSION_OPEN';
    return 'SUBMISSION_CLOSED';
  }, [getEffectiveServerTime, subStartTime, subEndTime]);

  const [status, setStatus] = useState<'UPCOMING' | 'SUBMISSION_OPEN' | 'SUBMISSION_CLOSED'>('SUBMISSION_OPEN');
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number; totalMs: number }>({
    hours: 0,
    minutes: 0,
    seconds: 0,
    totalMs: 0,
  });

  const onStateChangeRef = useRef(onStateChange);
  useEffect(() => {
    onStateChangeRef.current = onStateChange;
  }, [onStateChange]);

  // Authoritative REST state synchronization
  const syncAuthoritativeStatus = useCallback(async () => {
    if (!hackathonId) return;
    try {
      const res = await fetch(`/api/v1/hackathons/${hackathonId}/submission-status`);
      const json = await res.json();
      if (res.ok && json.data) {
        const data = json.data;
        if (data.serverTime) {
          const sTime = safeParseDate(data.serverTime);
          if (sTime) {
            serverOffsetRef.current = sTime.getTime() - Date.now();
          }
        }
        if (data.submissionOpensAt) {
          const sDate = safeParseDate(data.submissionOpensAt);
          if (sDate) setSubStartTime(sDate.toISOString());
        }
        if (data.submissionDeadline) {
          const eDate = safeParseDate(data.submissionDeadline);
          if (eDate) setSubEndTime(eDate.toISOString());
        }
        if (data.status) {
          setStatus(data.status);
          onStateChangeRef.current?.(data.status);
        }
      }
    } catch {
      // Ignore network synchronization errors in background
    }
  }, [hackathonId]);

  // Realtime WebSocket subscription & reconnect handling
  useEffect(() => {
    if (!hackathonId) return;

    const realtime = getRealtimeClient();
    const room = RealtimeRoomBuilder.hackathon(hackathonId);
    realtime.subscribeToRoom(room);

    // 1. Listen for SUBMISSION_DEADLINE_REACHED
    const unsubDeadline = realtime.on('SUBMISSION_DEADLINE_REACHED', (event) => {
      if (event.hackathonId === hackathonId) {
        setStatus('SUBMISSION_CLOSED');
        onStateChangeRef.current?.('SUBMISSION_CLOSED');
        if (event.payload?.serverTime) {
          const sTime = safeParseDate(event.payload.serverTime);
          if (sTime) {
            serverOffsetRef.current = sTime.getTime() - Date.now();
          }
        }
      }
    });

    // 2. Listen for SUBMISSION_WINDOW_OPENED
    const unsubOpen = realtime.on('SUBMISSION_WINDOW_OPENED', (event) => {
      if (event.hackathonId === hackathonId) {
        setStatus('SUBMISSION_OPEN');
        onStateChangeRef.current?.('SUBMISSION_OPEN');
        if (event.payload?.serverTime) {
          const sTime = safeParseDate(event.payload.serverTime);
          if (sTime) {
            serverOffsetRef.current = sTime.getTime() - Date.now();
          }
        }
      }
    });

    // 3. Listen for SUBMISSION_WINDOW_UPDATED
    const unsubUpdate = realtime.on('SUBMISSION_WINDOW_UPDATED', (event) => {
      if (event.hackathonId === hackathonId && event.payload) {
        if (event.payload.subStartTime) {
          const s = safeParseDate(event.payload.subStartTime);
          if (s) setSubStartTime(s.toISOString());
        }
        if (event.payload.subEndTime) {
          const e = safeParseDate(event.payload.subEndTime);
          if (e) setSubEndTime(e.toISOString());
        }
        syncAuthoritativeStatus();
      }
    });

    // 4. On Reconnect: Authoritatively Re-synchronize REST state
    const unsubReconnect = realtime.onReconnect(() => {
      syncAuthoritativeStatus();
    });

    return () => {
      unsubDeadline();
      unsubOpen();
      unsubUpdate();
      unsubReconnect();
      realtime.unsubscribeFromRoom(room);
    };
  }, [hackathonId, syncAuthoritativeStatus]);

  // Local ticker for smooth countdown display
  useEffect(() => {
    const updateCountdown = () => {
      const now = getEffectiveServerTime();
      const opensAtDate = safeParseDate(subStartTime);
      const deadlineDate = safeParseDate(subEndTime);

      if (!opensAtDate || !deadlineDate) {
        return;
      }

      const opensAt = opensAtDate.getTime();
      const deadline = deadlineDate.getTime();

      let currentStatus: 'UPCOMING' | 'SUBMISSION_OPEN' | 'SUBMISSION_CLOSED' = status;
      let targetTime = 0;

      if (now < opensAt) {
        currentStatus = 'UPCOMING';
        targetTime = opensAt;
      } else if (now >= opensAt && now < deadline) {
        currentStatus = 'SUBMISSION_OPEN';
        targetTime = deadline;
      } else {
        currentStatus = 'SUBMISSION_CLOSED';
        targetTime = deadline;
      }

      if (currentStatus !== status) {
        setStatus(currentStatus);
        onStateChangeRef.current?.(currentStatus);
        if (currentStatus === 'SUBMISSION_CLOSED') {
          syncAuthoritativeStatus();
        }
      }

      const diff = Math.max(0, targetTime - now);
      const totalSeconds = Math.floor(diff / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      setTimeLeft({ hours, minutes, seconds, totalMs: diff });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [getEffectiveServerTime, subStartTime, subEndTime, status, syncAuthoritativeStatus]);

  const pad = (n: number) => n.toString().padStart(2, '0');
  const formattedCountdown = `${pad(timeLeft.hours)}:${pad(timeLeft.minutes)}:${pad(timeLeft.seconds)}`;

  const opensAtDate = safeParseDate(subStartTime) || new Date();
  const deadlineDate = safeParseDate(subEndTime) || new Date();

  const formatTime = (d: Date) => {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isClosingSoon =
    status === 'SUBMISSION_OPEN' &&
    timeLeft.totalMs > 0 &&
    timeLeft.totalMs <= 15 * 60 * 1000;

  if (compact) {
    if (isLocked) {
      return (
        <span className="inline-flex items-center space-x-1 text-xs font-bold text-[#059669] bg-[#ECFDF5] px-2.5 py-1 rounded-full border border-[#A7F3D0]">
          <Lock className="w-3.5 h-3.5 mr-1" />
          <span>Locked for Evaluation</span>
        </span>
      );
    }
    if (status === 'UPCOMING') {
      return (
        <span className="inline-flex items-center space-x-1 text-xs font-semibold text-[#64748B] bg-[#F1F5F9] px-2.5 py-1 rounded-full border border-[#CBD5E1]">
          <Clock className="w-3.5 h-3.5 mr-1 text-[#64748B]" />
          <span>Submission Not Open (Opens {formatTime(opensAtDate)})</span>
        </span>
      );
    }
    if (status === 'SUBMISSION_OPEN') {
      return (
        <span
          className={`inline-flex items-center space-x-1 text-xs font-bold px-2.5 py-1 rounded-full border ${
            isClosingSoon
              ? 'text-[#B45309] bg-[#FEF3C7] border-[#FCD34D] animate-pulse'
              : 'text-[#1D4ED8] bg-[#EFF6FF] border-[#BFDBFE]'
          }`}
        >
          <Clock className="w-3.5 h-3.5 mr-1" />
          <span>
            {isClosingSoon ? 'Closing Soon: ' : 'Submission Open: '}
            {formattedCountdown}
          </span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center space-x-1 text-xs font-bold text-[#DC2626] bg-[#FEF2F2] px-2.5 py-1 rounded-full border border-[#FECACA]">
        <Lock className="w-3.5 h-3.5 mr-1 text-[#DC2626]" />
        <span>Submission Closed</span>
      </span>
    );
  }

  if (!showCard) {
    return (
      <div className="space-y-1">
        <div className="flex items-center space-x-2">
          {isLocked ? (
            <span className="text-xs font-bold text-[#059669]">🔒 Official Submission Locked</span>
          ) : status === 'UPCOMING' ? (
            <span className="text-xs font-semibold text-[#64748B]">⏳ Submission Not Open</span>
          ) : status === 'SUBMISSION_OPEN' ? (
            <span
              className={`text-xs font-bold ${
                isClosingSoon ? 'text-[#D97706]' : 'text-[#2563EB]'
              }`}
            >
              🟢 {isClosingSoon ? 'Submission Closing Soon' : 'Submission Open'}
            </span>
          ) : (
            <span className="text-xs font-bold text-[#DC2626]">🔒 Submission Closed</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`p-4 rounded-2xl border transition-all ${
        isLocked
          ? 'bg-[#F0FDF4] border-[#BBF7D0]'
          : status === 'UPCOMING'
          ? 'bg-[#F8FAFC] border-[#E2E8F0]'
          : isClosingSoon
          ? 'bg-[#FFFBEB] border-[#FDE68A] shadow-sm'
          : status === 'SUBMISSION_OPEN'
          ? 'bg-[#EFF6FF] border-[#BFDBFE] shadow-sm'
          : 'bg-[#FEF2F2] border-[#FECACA]'
      }`}
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="space-y-0.5">
          <div className="flex items-center space-x-2">
            <span
              className={`text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                isLocked
                  ? 'bg-[#DCFCE7] text-[#15803D] border-[#86EFAC]'
                  : status === 'UPCOMING'
                  ? 'bg-[#E2E8F0] text-[#475569] border-[#CBD5E1]'
                  : isClosingSoon
                  ? 'bg-[#FEF3C7] text-[#B45309] border-[#FCD34D]'
                  : status === 'SUBMISSION_OPEN'
                  ? 'bg-[#DBEAFE] text-[#1D4ED8] border-[#93C5FD]'
                  : 'bg-[#FEE2E2] text-[#B91C1C] border-[#FCA5A5]'
              }`}
            >
              {isLocked
                ? 'Submission Locked'
                : status === 'UPCOMING'
                ? 'Submission Not Open'
                : isClosingSoon
                ? 'Submission Closing Soon'
                : status === 'SUBMISSION_OPEN'
                ? 'Submission Open'
                : 'Submission Closed'}
            </span>
          </div>

          <p className="text-xs font-medium text-[#475569]">
            {isLocked ? (
              'Submission submitted successfully and locked for judging.'
            ) : status === 'UPCOMING' ? (
              <>
                Submission opens at <strong className="text-[#0F172A]">{formatTime(opensAtDate)}</strong> ({opensAtDate.toLocaleDateString()})
              </>
            ) : status === 'SUBMISSION_OPEN' ? (
              <>
                {isClosingSoon ? (
                  <span className="text-[#B45309] font-bold">
                    Only {timeLeft.minutes > 0 ? `${timeLeft.minutes} minute(s)` : `${timeLeft.seconds}s`} remaining.
                  </span>
                ) : (
                  'Solutions can be submitted and updated until deadline.'
                )}{' '}
                Deadline: <strong className="text-[#0F172A]">{formatTime(deadlineDate)}</strong>
              </>
            ) : (
              'The submission deadline has passed. No further submissions are accepted.'
            )}
          </p>
        </div>

        {/* Dynamic Countdown Display */}
        {!isLocked && (
          <div className="flex items-center space-x-2 self-stretch sm:self-auto justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-black/5">
            <span className="text-[11px] font-semibold text-[#64748B]">
              {status === 'UPCOMING' ? 'Opens in:' : status === 'SUBMISSION_OPEN' ? 'Time remaining:' : 'Closed:'}
            </span>
            <span
              className={`font-mono font-bold text-sm px-3 py-1 rounded-xl shadow-xs border ${
                status === 'UPCOMING'
                  ? 'bg-white text-[#334155] border-[#E2E8F0]'
                  : isClosingSoon
                  ? 'bg-white text-[#DC2626] border-[#F87171] animate-pulse'
                  : status === 'SUBMISSION_OPEN'
                  ? 'bg-white text-[#2563EB] border-[#93C5FD]'
                  : 'bg-white text-[#991B1B] border-[#FECACA]'
              }`}
            >
              {status === 'SUBMISSION_CLOSED' ? '00:00:00' : formattedCountdown}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
