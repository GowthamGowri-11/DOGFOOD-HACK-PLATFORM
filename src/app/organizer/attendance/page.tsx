'use client';

import React, { useState, useEffect } from 'react';
import {
  QrCode,
  Users,
  Plus,
  CheckCircle2,
  AlertCircle,
  Copy,
  Calendar,
  Clock,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface AttendanceSession {
  id: string;
  hackathonId: string;
  hackathonTitle: string;
  title: string;
  sessionCode: string;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
  totalAttendees: number;
}

export default function OrganizerAttendancePage() {
  const [hackathons, setHackathons] = useState<any[]>([]);
  const [selectedHackathonId, setSelectedHackathonId] = useState<string>('');
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // New session form
  const [newTitle, setNewTitle] = useState('');
  const [newCode, setNewCode] = useState('');
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    async function loadHackathons() {
      try {
        const res = await fetch('/api/v1/hackathons');
        const json = await res.json();
        if (json.data?.hackathons && json.data.hackathons.length > 0) {
          setHackathons(json.data.hackathons);
          setSelectedHackathonId(json.data.hackathons[0].id);
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadHackathons();
  }, []);

  const fetchSessions = async (hId: string) => {
    if (!hId) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/v1/attendance?hackathonId=${hId}`);
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
    if (selectedHackathonId) {
      fetchSessions(selectedHackathonId);
    }
  }, [selectedHackathonId]);

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newCode.trim()) return;

    try {
      setCreating(true);
      setMessage(null);
      const res = await fetch('/api/v1/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hackathonId: selectedHackathonId,
          title: newTitle,
          sessionCode: newCode.toUpperCase(),
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setMessage({ type: 'error', text: json.message || 'Failed to create session' });
        return;
      }

      setMessage({ type: 'success', text: 'Attendance session created successfully!' });
      setNewTitle('');
      setNewCode('');
      setShowCreateModal(false);
      fetchSessions(selectedHackathonId);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setCreating(false);
    }
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const totalAttendees = sessions.reduce((acc, s) => acc + s.totalAttendees, 0);

  return (
    <div className="space-y-6 select-none">
      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#E2E8F0] gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-bold text-[#2563EB] bg-[#EFF6FF] px-2.5 py-0.5 rounded-full border border-[#BFDBFE]">
              Event Operations Hub
            </span>
            <span className="text-[11px] font-semibold text-[#059669] bg-[#ECFDF5] px-2.5 py-0.5 rounded-full border border-[#A7F3D0] flex items-center">
              <ShieldCheck className="w-3 h-3 mr-1" /> QR Check-in System Active
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#111827] mt-1 tracking-tight">
            Attendance & Session Management
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-0.5 font-normal">
            Broadcast check-in codes, project live QR codes on auditorium displays, and verify participant physical presence.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {hackathons.length > 0 && (
            <select
              value={selectedHackathonId}
              onChange={(e) => setSelectedHackathonId(e.target.value)}
              className="px-3 py-2 bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] rounded-[11px] text-xs font-semibold text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            >
              {hackathons.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.title}
                </option>
              ))}
            </select>
          )}

          <Button
            variant="primary"
            size="md"
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Create Session</span>
          </Button>
        </div>
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

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-[18px] p-5 shadow-card">
          <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
            Total Sessions
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#111827] mt-1">
            {sessions.length}
          </div>
          <p className="text-xs text-[#64748B] mt-1">Check-in checkpoints</p>
        </div>

        <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-[18px] p-5 shadow-card">
          <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
            Verified Check-ins
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#2563EB] mt-1">
            {totalAttendees}
          </div>
          <p className="text-xs text-[#64748B] mt-1">Attendee check-in records</p>
        </div>

        <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-[18px] p-5 shadow-card">
          <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
            Status
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#059669] mt-1">
            Active
          </div>
          <p className="text-xs text-[#64748B] mt-1">Live QR check-in active</p>
        </div>
      </div>

      {/* Sessions Grid */}
      <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-[18px] overflow-hidden shadow-card">
        <div className="p-5 border-b border-[#E2E8F0] flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#111827]">Scheduled Check-in Sessions</h3>
            <p className="text-xs text-[#64748B]">Click session code to copy or project for attendees</p>
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-xs text-[#64748B]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2563EB] mx-auto mb-2" />
            Loading attendance sessions...
          </div>
        ) : sessions.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#94A3B8]">
            No attendance sessions have been created for this hackathon yet. Click &quot;Create Session&quot; to set one up.
          </div>
        ) : (
          <div className="divide-y divide-[#F1F5F9]">
            {sessions.map((s) => (
              <div
                key={s.id}
                className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-[#F8FAFC] transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="text-base font-bold text-[#111827]">{s.title}</h4>
                    {s.isActive ? (
                      <Badge variant="emerald" size="sm">
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="neutral" size="sm">
                        Closed
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-[#64748B] flex items-center space-x-3">
                    <span>
                      Window: <strong>{new Date(s.startsAt).toLocaleDateString()}</strong>
                    </span>
                    <span>•</span>
                    <span>{s.totalAttendees} verified check-ins</span>
                  </div>
                </div>

                <div className="flex items-center space-x-3 self-end md:self-center">
                  {/* Big Code Pill with Copy Action */}
                  <div
                    onClick={() => handleCopy(s.sessionCode)}
                    className="flex items-center space-x-2 px-3.5 py-1.5 bg-[#F8FAFC] hover:bg-[#EFF6FF] border border-[#E2E8F0] hover:border-[#BFDBFE] rounded-[11px] cursor-pointer transition-colors"
                    title="Click to copy code"
                  >
                    <QrCode className="w-4 h-4 text-[#2563EB]" />
                    <span className="font-mono font-bold text-xs text-[#111827]">
                      {s.sessionCode}
                    </span>
                    <Copy className="w-3.5 h-3.5 text-[#94A3B8]" />
                  </div>
                  {copiedCode === s.sessionCode && (
                    <span className="text-[10px] text-[#059669] font-bold">Copied!</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Session Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-[#E2E8F0] rounded-[20px] max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
              <h3 className="text-base font-bold text-[#111827]">Create Attendance Session</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-xs text-[#64748B] hover:text-[#111827]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSession} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-[#334155] block mb-1">
                  Session Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Day 1 Keynote & Welcome Check-in"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[10px] text-xs text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>

              <div>
                <label className="font-semibold text-[#334155] block mb-1">
                  Session Code (4-12 alphanumeric characters)
                </label>
                <input
                  type="text"
                  placeholder="e.g. APEX-KEYNOTE"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                  required
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[10px] text-xs font-mono uppercase text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit" disabled={creating}>
                  {creating ? 'Creating...' : 'Create Session'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
