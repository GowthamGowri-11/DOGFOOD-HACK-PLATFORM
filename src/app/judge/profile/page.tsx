'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  UserCheck2,
  Scale,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Trophy,
  Mail,
  Award,
  Layers,
  ArrowRight,
  FolderKanban,
  Star,
  Activity,
  Sliders,
  Settings,
  Sparkles,
  Zap,
  Pencil,
  Save,
  Check,
  Phone,
  Building2,
  Plus,
  X,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function JudgeProfilePage() {
  const { currentUser, refreshAuth } = useAuth();

  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Judge Personal Profile
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [affiliation, setAffiliation] = useState('');
  const [title, setTitle] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  // Specialization Tracks
  const [tracks, setTracks] = useState<string[]>([
    'Autonomous AI Agents',
    'Cloud Infrastructure & Zero-Trust',
    'FinTech & Cryptographic Audit',
    'HealthTech & Multimodal AI',
  ]);
  const [newTrackInput, setNewTrackInput] = useState('');

  const [stats, setStats] = useState({
    totalAssigned: 4,
    completedCount: 2,
    pendingCount: 2,
    avgScore: '90.9',
  });

  const [hackathons, setHackathons] = useState<any[]>([
    { id: 'hack_apex_2026', title: 'Apex Enterprise Hackathon 2026' },
    { id: 'hack_frontier_2026', title: 'Frontier AI Global Summit' },
  ]);

  useEffect(() => {
    // Load local storage or auth
    const saved = localStorage.getItem('dogfood_judge_profile');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setFullName(parsed.fullName || currentUser?.name || 'Dr. Sarah Chen');
        setEmail(parsed.email || currentUser?.email || 'judge.alpha@hackathon.dev');
        setAffiliation(parsed.affiliation || 'Frontier AI Research Institute');
        setTitle(parsed.title || 'Principal Jury Adjudicator');
        setPhone(parsed.phone || '+1 (555) 492-1084');
        setBio(
          parsed.bio ||
            'Senior Evaluator specializing in autonomous multi-agent systems, formal verification, and distributed consensus integrity. Dedicated to fair, unbiased, and calibrated hackathon evaluations.'
        );
        setAvatarUrl(parsed.avatarUrl || currentUser?.avatarUrl || '');
        if (Array.isArray(parsed.tracks)) setTracks(parsed.tracks);
      } catch {}
    } else {
      setFullName(currentUser?.name || 'Dr. Sarah Chen');
      setEmail(currentUser?.email || 'judge.alpha@hackathon.dev');
      setAffiliation('Frontier AI Research Institute');
      setTitle('Principal Jury Adjudicator');
      setPhone('+1 (555) 492-1084');
      setBio(
        'Senior Evaluator specializing in autonomous multi-agent systems, formal verification, and distributed consensus integrity. Dedicated to fair, unbiased, and calibrated hackathon evaluations.'
      );
      setAvatarUrl(currentUser?.avatarUrl || '');
    }

    async function loadStats() {
      try {
        setLoading(true);
        const res = await fetch('/api/v1/judge/assignments');
        const data = await res.json();
        if (res.ok && data.data) {
          const assignments = data.data.assignments || [];
          if (assignments.length > 0) {
            const completed = assignments.filter((a: any) => a.evaluation?.status === 'SUBMITTED');
            const sumScores = completed.reduce(
              (acc: number, curr: any) => acc + (curr.evaluation?.weightedScore || 0),
              0
            );
            const avg = completed.length > 0 ? (sumScores / completed.length).toFixed(1) : '—';

            setStats({
              totalAssigned: assignments.length,
              completedCount: completed.length,
              pendingCount: assignments.length - completed.length,
              avgScore: avg,
            });
          }

          if (data.data.hackathons && data.data.hackathons.length > 0) {
            setHackathons(data.data.hackathons);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, [currentUser]);

  const handleAddTrack = () => {
    const val = newTrackInput.trim();
    if (val && !tracks.includes(val)) {
      setTracks([...tracks, val]);
      setNewTrackInput('');
    }
  };

  const handleRemoveTrack = (trackToRemove: string) => {
    setTracks(tracks.filter((t) => t !== trackToRemove));
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    setSuccessMessage(null);

    const payload = {
      fullName: fullName.trim(),
      email: email.trim(),
      affiliation: affiliation.trim(),
      title: title.trim(),
      phone: phone.trim(),
      bio: bio.trim(),
      avatarUrl: avatarUrl.trim(),
      tracks,
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem('dogfood_judge_profile', JSON.stringify(payload));

    try {
      await fetch('/api/v1/participants/me/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: payload.fullName,
          bio: payload.bio,
          avatarUrl: payload.avatarUrl,
        }),
      });
      await refreshAuth();
    } catch {}

    setTimeout(() => {
      setSaving(false);
      setIsEditing(false);
      setSuccessMessage('Juror profile and evaluation track credentials updated successfully!');
      setTimeout(() => setSuccessMessage(null), 4000);
    }, 400);
  };

  return (
    <div className="space-y-6 select-none pb-16 max-w-5xl mx-auto font-sans">
      {/* ================= 1. HEADER ================= */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-1">
        <div className="space-y-1.5">
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#FFF7ED] text-[#EA580C] border border-[#FFEDD5]">
              Juror Credential
            </span>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Official Jury Member</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
            Judge Profile &amp; Evaluation Record
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-normal max-w-2xl">
            Review your verified jury credentials, assigned tracks, and workload calibration metrics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#FA541C] hover:bg-[#E03A00] text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-[0.98]"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saving ? 'Saving...' : 'Save Profile'}</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-[0.98]"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Edit Profile</span>
            </button>
          )}

          <Link href="/judge/dashboard">
            <button className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#FF5500] to-[#EA580C] hover:from-[#EA580C] hover:to-[#C2410C] text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-md transition-all active:scale-[0.98]">
              <Scale className="w-4 h-4" />
              <span>Judge Dashboard</span>
            </button>
          </Link>
        </div>
      </div>

      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* ================= 2. PROFILE CARD ================= */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6 border-l-4 border-l-[#FF5500]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={fullName}
              className="w-18 h-18 rounded-2xl object-cover ring-3 ring-orange-500/20 shadow-md flex-shrink-0"
            />
          ) : (
            <div className="w-18 h-18 rounded-2xl bg-gradient-to-tr from-[#FF5500] to-[#EA580C] text-white flex items-center justify-center font-black text-2xl shadow-md shadow-orange-500/20 flex-shrink-0">
              {fullName ? fullName.charAt(0).toUpperCase() : 'J'}
            </div>
          )}

          <div className="space-y-1 flex-1">
            <div className="flex items-center space-x-3">
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                {fullName || 'Senior Jury Member'}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#FFF7ED] text-[#EA580C] border border-[#FFEDD5] uppercase tracking-wider">
                Active Juror
              </span>
            </div>
            <p className="text-xs text-slate-600 flex items-center gap-2 font-medium">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <span>{title || 'Principal Jury Adjudicator'}</span>
              <span className="text-slate-300">•</span>
              <span>{affiliation}</span>
            </p>
            <p className="text-xs text-slate-500 flex items-center gap-1.5 font-medium pt-0.5">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span>{email}</span>
              {phone && (
                <>
                  <span className="text-slate-300">•</span>
                  <Phone className="w-3.5 h-3.5 text-slate-400 ml-1" />
                  <span>{phone}</span>
                </>
              )}
            </p>
          </div>
        </div>

        {isEditing ? (
          <div className="pt-4 border-t border-slate-100 space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-semibold text-stone-700 block">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-stone-700 block">Official Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-semibold text-stone-700 block">Institution / Affiliation</label>
                <input
                  type="text"
                  value={affiliation}
                  onChange={(e) => setAffiliation(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-stone-700 block">Designation / Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-stone-700 block">Direct Contact Phone</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-stone-700 block">Juror Bio &amp; Evaluation Philosophy</label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-stone-700 block">Avatar Image URL</label>
              <input
                type="text"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none"
              />
            </div>
          </div>
        ) : (
          bio && (
            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50/80 p-3.5 rounded-xl border border-slate-100">
              {bio}
            </p>
          )
        )}

        {/* Certified Domains */}
        <div className="pt-4 border-t border-slate-100 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              CERTIFIED EVALUATION TRACKS
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {tracks.map((d) => (
              <span
                key={d}
                className="inline-flex items-center px-3 py-1 rounded-xl text-xs font-bold border bg-[#FAF5FF] text-[#7E22CE] border-[#E9D5FF]"
              >
                <span className="w-1.5 h-1.5 rounded-full mr-2 bg-[#7E22CE]" />
                {d}
                {isEditing && (
                  <button
                    onClick={() => handleRemoveTrack(d)}
                    className="ml-2 hover:text-red-600 p-0.5"
                    title="Remove Track"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </span>
            ))}
          </div>

          {isEditing && (
            <div className="flex items-center gap-2 pt-2">
              <input
                type="text"
                placeholder="Add specialized track..."
                value={newTrackInput}
                onChange={(e) => setNewTrackInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTrack();
                  }
                }}
                className="px-3 py-1.5 text-xs rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddTrack}
                className="px-3 py-1.5 bg-stone-900 text-white rounded-xl text-xs font-bold hover:bg-stone-800"
              >
                Add Track
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ================= 3. STATS GRID ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Total Assigned
          </span>
          <div className="text-2xl font-black text-slate-900 font-mono">{stats.totalAssigned}</div>
          <span className="text-[11px] text-slate-500 block">Deliverables in queue</span>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Completed
          </span>
          <div className="text-2xl font-black text-[#059669] font-mono">{stats.completedCount}</div>
          <span className="text-[11px] text-slate-500 block">Locked evaluations</span>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Pending
          </span>
          <div className="text-2xl font-black text-[#EA580C] font-mono">{stats.pendingCount}</div>
          <span className="text-[11px] text-slate-500 block">Awaiting scoring</span>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Average Given
          </span>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {stats.avgScore} <span className="text-xs text-slate-400 font-normal">/ 100</span>
          </div>
          <span className="text-[11px] text-slate-500 block">Normalized score delta</span>
        </div>
      </div>

      {/* ================= 4. ASSIGNED EVENTS ================= */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
            Active Hackathon Appointments
          </h3>
          <span className="text-xs font-semibold text-[#EA580C]">
            {hackathons.length} Arenas
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {hackathons.map((h) => (
            <div key={h.id} className="py-3.5 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-xl bg-[#FFF7ED] text-[#EA580C] flex items-center justify-center font-bold text-xs">
                  <Trophy className="w-4 h-4 text-amber-500" />
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-bold text-slate-900">{h.title}</div>
                  <div className="text-[11px] text-slate-400 font-mono">{h.id}</div>
                </div>
              </div>

              <Link href="/judge/dashboard">
                <button className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-[#EA580C] bg-[#FFF7ED] hover:bg-[#FFEDD5] border border-[#FFEDD5] transition-colors">
                  Open Queue
                </button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
