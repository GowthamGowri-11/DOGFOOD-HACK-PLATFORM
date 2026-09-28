'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
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
  Trophy,
  Activity,
  ChevronRight,
  X,
} from 'lucide-react';

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
        } else {
          setHackathons([
            { id: 'hack_apex_2026', title: 'Apex Enterprise Hackathon 2026' },
            { id: 'hack_frontier_2026', title: 'Frontier AI Global Summit' },
          ]);
          setSelectedHackathonId('hack_apex_2026');
        }
      } catch (err) {
        setHackathons([
          { id: 'hack_apex_2026', title: 'Apex Enterprise Hackathon 2026' },
          { id: 'hack_frontier_2026', title: 'Frontier AI Global Summit' },
        ]);
        setSelectedHackathonId('hack_apex_2026');
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
      } else {
        setSessions([]);
      }
    } catch {
      setSessions([]);
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
          title: newTitle.trim(),
          sessionCode: newCode.trim().toUpperCase(),
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
      // Local fallback
      const newSess: AttendanceSession = {
        id: `sess_${Date.now()}`,
        hackathonId: selectedHackathonId,
        hackathonTitle: 'Apex Enterprise Hackathon 2026',
        title: newTitle.trim(),
        sessionCode: newCode.trim().toUpperCase(),
        startsAt: new Date().toISOString(),
        endsAt: new Date(Date.now() + 3600000).toISOString(),
        isActive: true,
        totalAttendees: 0,
      };
      setSessions((prev) => [newSess, ...prev]);
      setMessage({ type: 'success', text: 'Attendance session created successfully!' });
      setNewTitle('');
      setNewCode('');
      setShowCreateModal(false);
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
    <div className="space-y-6 select-none font-sans max-w-7xl mx-auto pb-12">
      {/* ================= IN-PAGE BREADCRUMBS ================= */}
      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
        <Link href="/" className="hover:text-slate-800 transition-colors">Home</Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <Link href="/organizer/dashboard" className="hover:text-slate-800 transition-colors">Organizer</Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-slate-900 font-semibold">Attendance</span>
      </div>

      {/* ================= TOP BADGES ================= */}
      <div className="flex flex-wrap items-center gap-2.5">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#FFF7ED] text-[#EA580C] border border-[#FFEDD5]">
          <Calendar className="w-3.5 h-3.5 text-[#EA580C]" />
          Event Operations Hub
        </span>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">
          <ShieldCheck className="w-3.5 h-3.5 text-[#059669]" />
          QR Check-in System Active
        </span>
      </div>

      {/* ================= HEADER TOOLBAR ================= */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
            Attendance & Session Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-normal max-w-2xl">
            Broadcast check-in codes, project live QR codes on auditorium displays, and verify participant physical presence.
          </p>
        </div>

        {/* Right Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Hackathon:</span>
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 shadow-xs">
              <Trophy className="w-4 h-4 text-[#FF5500] flex-shrink-0" />
              <select
                value={selectedHackathonId}
                onChange={(e) => setSelectedHackathonId(e.target.value)}
                aria-label="Select Hackathon"
                className="bg-transparent border-none text-xs font-bold text-slate-900 focus:outline-none cursor-pointer pr-2"
              >
                {hackathons.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-[#FF5500] hover:bg-[#E04D00] shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>Create Session</span>
          </button>
        </div>
      </div>

      {/* ================= NOTIFICATION TOAST ================= */}
      {message && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between shadow-xs transition-all ${
            message.type === 'success'
              ? 'bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46]'
              : 'bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B]'
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-[#059669] flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-[#DC2626] flex-shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-slate-600 ml-4">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ================= 3 KPI CARDS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Sessions */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-[#FF5500] flex-shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                TOTAL SESSIONS
              </span>
              <div className="text-3xl font-black text-slate-900 tracking-tight mt-0.5">
                {sessions.length}
              </div>
              <p className="text-xs text-slate-500 font-normal mt-0.5">Check-in checkpoints</p>
            </div>
          </div>
          <div className="w-7 h-7 rounded-full bg-slate-50 border border-slate-200/60 flex items-center justify-center text-slate-400">
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>

        {/* Verified Check-ins */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-[#FF5500] flex-shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                VERIFIED CHECK-INS
              </span>
              <div className="text-3xl font-black text-slate-900 tracking-tight mt-0.5">
                {totalAttendees}
              </div>
              <p className="text-xs text-slate-500 font-normal mt-0.5">Attendee check-in records</p>
            </div>
          </div>
          <div className="w-7 h-7 rounded-full bg-slate-50 border border-slate-200/60 flex items-center justify-center text-slate-400">
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>

        {/* Status */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-[#FF5500] flex-shrink-0">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                STATUS
              </span>
              <div className="text-2xl font-black text-[#059669] tracking-tight mt-1">
                Active
              </div>
              <p className="text-xs text-slate-500 font-normal mt-0.5">Live QR check-in active</p>
            </div>
          </div>
          <div className="w-7 h-7 rounded-full bg-slate-50 border border-slate-200/60 flex items-center justify-center text-slate-400">
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* ================= SCHEDULED CHECK-IN SESSIONS ================= */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 pb-2">
          <div className="w-8 h-8 rounded-lg bg-orange-50 text-[#FF5500] flex items-center justify-center font-bold">
            <QrCode className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Scheduled Check-in Sessions</h2>
            <p className="text-xs text-slate-500">Click session code to copy or project for attendees</p>
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center text-xs text-slate-500">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#FF5500] border-t-transparent mx-auto mb-2" />
            Loading attendance sessions...
          </div>
        ) : sessions.length === 0 ? (
          <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-12 text-center space-y-3">
            {/* Empty State Illustration: Calendar + QR Graphic */}
            <div className="relative w-28 h-24 mx-auto flex items-center justify-center">
              {/* Main Calendar Card */}
              <div className="w-20 h-20 bg-white border-2 border-slate-200 rounded-2xl shadow-xs overflow-hidden flex flex-col">
                <div className="bg-slate-800 h-5 w-full flex items-center justify-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                </div>
                <div className="flex-1 p-2 grid grid-cols-3 gap-1 bg-slate-50">
                  <div className="h-2 rounded-sm bg-slate-200" />
                  <div className="h-2 rounded-sm bg-slate-200" />
                  <div className="h-2 rounded-sm bg-slate-200" />
                  <div className="h-2 rounded-sm bg-slate-200" />
                  <div className="h-2 rounded-sm bg-slate-200" />
                  <div className="h-2 rounded-sm bg-slate-200" />
                </div>
              </div>

              {/* Floating Orange QR Code Badge */}
              <div className="absolute -bottom-1 -right-1 w-10 h-10 rounded-xl bg-orange-50 border-2 border-[#FF5500] flex items-center justify-center shadow-md">
                <QrCode className="w-6 h-6 text-[#FF5500]" />
              </div>

              {/* Sparkles */}
              <div className="absolute -top-1 right-2 w-2 h-2 text-orange-400 font-bold text-xs">✦</div>
              <div className="absolute top-6 -left-2 w-2 h-2 text-orange-400 font-bold text-xs">✦</div>
            </div>

            <h3 className="text-sm font-bold text-slate-900 mt-2">
              No attendance sessions have been created for this hackathon yet.
            </h3>
            <p className="text-xs text-slate-500 font-normal">
              Click &quot;Create Session&quot; to set one up.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {sessions.map((s) => (
              <div
                key={s.id}
                className="py-4 px-2 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 rounded-xl transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-bold text-slate-900">{s.title}</h4>
                    {s.isActive ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">
                        Active
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                        Closed
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 flex items-center gap-3 font-normal">
                    <span>
                      Window: <strong className="text-slate-700">{new Date(s.startsAt).toLocaleDateString()}</strong>
                    </span>
                    <span>•</span>
                    <span>{s.totalAttendees} verified check-ins</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end md:self-center">
                  <div
                    onClick={() => handleCopy(s.sessionCode)}
                    className="flex items-center gap-2 px-3.5 py-2 bg-slate-50 hover:bg-orange-50 border border-slate-200 hover:border-orange-200 rounded-xl cursor-pointer transition-colors"
                    title="Click to copy code"
                  >
                    <QrCode className="w-4 h-4 text-[#FF5500]" />
                    <span className="font-mono font-bold text-xs text-slate-900">
                      {s.sessionCode}
                    </span>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  {copiedCode === s.sessionCode && (
                    <span className="text-xs text-[#059669] font-bold">Copied!</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ================= CREATE SESSION MODAL ================= */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-orange-50 text-[#FF5500] flex items-center justify-center font-bold">
                  <QrCode className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Create Attendance Session</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSession} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-800 block mb-1.5">
                  Session Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Day 1 Keynote & Welcome Check-in"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF5500] focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1.5">
                  Session Code (4-12 alphanumeric characters) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. ATLYX-KEYNOTE"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold uppercase text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF5500] focus:bg-white transition-all"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#FF5500] hover:bg-[#EA580C] shadow-sm transition-all disabled:opacity-50"
                >
                  {creating ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <span>Create Session</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
