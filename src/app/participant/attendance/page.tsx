'use client';

import React, { useState, useEffect } from 'react';
import {
  QrCode,
  CheckCircle2,
  Clock,
  Calendar,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface AttendanceSession {
  id: string;
  hackathonTitle: string;
  title: string;
  sessionCode: string;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
  totalAttendees: number;
  hasCheckedIn: boolean;
  checkedInAt: string | null;
}

export default function ParticipantAttendancePage() {
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkInCode, setCheckInCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/v1/attendance');
      const json = await res.json();
      if (res.ok && json.data?.sessions) {
        setSessions(json.data.sessions);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkInCode.trim()) return;

    try {
      setSubmitting(true);
      setMessage(null);
      const res = await fetch('/api/v1/attendance/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionCode: checkInCode }),
      });
      const json = await res.json();

      if (!res.ok) {
        setMessage({ type: 'error', text: json.message || 'Check-in failed. Please verify the code.' });
        return;
      }

      setMessage({ type: 'success', text: json.message || 'Attendance verified successfully!' });
      setCheckInCode('');
      fetchSessions();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error checking in' });
    } finally {
      setSubmitting(false);
    }
  };

  const totalSessions = sessions.length;
  const attendedCount = sessions.filter((s) => s.hasCheckedIn).length;
  const attendanceRate = totalSessions > 0 ? Math.round((attendedCount / totalSessions) * 100) : 0;

  return (
    <div className="space-y-6 select-none">
      {/* Header */}
      <div className="pb-6 border-b border-[#E2E8F0]">
        <div className="flex items-center space-x-2">
          <span className="text-[11px] font-bold text-[#2563EB] bg-[#EFF6FF] px-2.5 py-0.5 rounded-full border border-[#BFDBFE]">
            Participant Check-in Portal
          </span>
          <span className="text-[11px] font-semibold text-[#059669] bg-[#ECFDF5] px-2.5 py-0.5 rounded-full border border-[#A7F3D0] flex items-center">
            <ShieldCheck className="w-3 h-3 mr-1" /> Verified Attendance
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#111827] mt-1 tracking-tight">
          Event Attendance & Check-in
        </h1>
        <p className="text-xs sm:text-sm text-[#64748B] mt-0.5 font-normal">
          Check into keynotes, checkpoints, and presentation rounds to qualify for official certificates and awards.
        </p>
      </div>

      {/* Notifications */}
      {message && (
        <div
          className={`p-4 rounded-[12px] text-xs font-medium flex items-center shadow-xs ${
            message.type === 'success'
              ? 'bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46]'
              : 'bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B]'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 mr-2 text-[#059669] flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 mr-2 text-[#DC2626] flex-shrink-0" />
          )}
          {message.text}
        </div>
      )}

      {/* Top Split: Check-in Form + Attendance Summary Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Quick Check-in Box (2 cols) */}
        <div className="md:col-span-2 bg-[#FFFFFF] border border-[#E2E8F0] rounded-[18px] p-6 shadow-card space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] flex items-center justify-center flex-shrink-0">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#111827]">Quick Session Check-in</h2>
              <p className="text-xs text-[#64748B]">
                Enter the session code displayed by event organizers or announced on stage.
              </p>
            </div>
          </div>

          <form onSubmit={handleCheckIn} className="flex flex-col sm:flex-row gap-3 pt-2">
            <input
              type="text"
              placeholder="e.g. ATLYX-MIDWAY"
              value={checkInCode}
              onChange={(e) => setCheckInCode(e.target.value.toUpperCase())}
              className="flex-1 px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[11px] text-xs sm:text-sm font-mono uppercase tracking-wider text-[#111827] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:bg-white"
            />
            <Button
              variant="primary"
              size="md"
              type="submit"
              disabled={submitting || !checkInCode.trim()}
              className="flex-shrink-0"
            >
              <span>{submitting ? 'Checking in...' : 'Confirm Check-in'}</span>
            </Button>
          </form>
        </div>

        {/* Attendance Score Card (1 col) */}
        <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-[18px] p-6 shadow-card flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
              Your Record
            </span>
            <Badge variant="blue" size="sm">
              {attendedCount} / {totalSessions} Checked In
            </Badge>
          </div>

          <div>
            <div className="text-3xl font-extrabold text-[#111827] tracking-tight">
              {attendanceRate}%
            </div>
            <p className="text-xs text-[#64748B] mt-0.5">
              Attendance completion rate
            </p>
          </div>

          <div className="w-full bg-[#F1F5F9] rounded-full h-2 overflow-hidden">
            <div
              className="bg-[#2563EB] h-2 rounded-full transition-all duration-300"
              style={{ width: `${attendanceRate}%` }}
            />
          </div>
        </div>
      </div>

      {/* Sessions List */}
      <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-[18px] overflow-hidden shadow-card">
        <div className="p-5 border-b border-[#E2E8F0] flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#111827]">Required Attendance Sessions</h3>
            <p className="text-xs text-[#64748B]">Official check-in sessions for active hackathons</p>
          </div>
          <span className="text-xs text-[#64748B] font-medium">{sessions.length} sessions scheduled</span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-xs text-[#64748B]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2563EB] mx-auto mb-2" />
            Loading check-in sessions...
          </div>
        ) : sessions.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#94A3B8]">
            No attendance sessions are currently scheduled for your events.
          </div>
        ) : (
          <div className="divide-y divide-[#F1F5F9]">
            {sessions.map((s) => {
              return (
                <div
                  key={s.id}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#F8FAFC] transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-bold text-[#111827]">{s.title}</h4>
                      {s.hasCheckedIn ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0] flex items-center">
                          <CheckCircle2 className="w-3 h-3 mr-1 text-[#059669]" />
                          Checked In
                        </span>
                      ) : s.isActive ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#EFF6FF] text-[#1E40AF] border border-[#BFDBFE]">
                          Active Now
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#F1F5F9] text-[#64748B]">
                          Scheduled
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-[#64748B] flex flex-wrap items-center gap-3">
                      <span>Event: <strong className="text-[#334155]">{s.hackathonTitle}</strong></span>
                      <span>•</span>
                      <span className="font-mono text-[#2563EB] font-bold">Code: {s.sessionCode}</span>
                      <span>•</span>
                      <span>{s.totalAttendees} attendees checked in</span>
                    </div>
                  </div>

                  <div className="self-end sm:self-center">
                    {s.hasCheckedIn ? (
                      <div className="text-right text-xs">
                        <span className="text-[#059669] font-semibold block">Verified</span>
                        <span className="text-[11px] text-[#94A3B8]">
                          {s.checkedInAt ? new Date(s.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                    ) : (
                      <button
                        onClick={() => setCheckInCode(s.sessionCode)}
                        className="px-3.5 py-1.5 bg-[#EFF6FF] hover:bg-[#DBEAFE] text-[#2563EB] border border-[#BFDBFE] rounded-[10px] text-xs font-semibold transition-colors"
                      >
                        Check In
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
