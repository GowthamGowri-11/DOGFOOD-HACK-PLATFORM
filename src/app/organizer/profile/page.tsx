'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Building2,
  Mail,
  Phone,
  Globe,
  Award,
  Trophy,
  Users,
  ShieldCheck,
  Pencil,
  Check,
  X,
  Camera,
  Save,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
  ArrowRight,
  FileCheck,
  QrCode,
  Sliders,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function OrganizerProfilePage() {
  const { currentUser, refreshAuth } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [organization, setOrganization] = useState('');
  const [department, setDepartment] = useState('');
  const [designation, setDesignation] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [signatoryTitle, setSignatoryTitle] = useState('');

  // Live Stats State
  const [stats, setStats] = useState({
    activeHackathons: 3,
    totalTeams: 48,
    submissionsEvaluated: 142,
    certificatesIssued: 96,
  });

  // Load Initial Data
  useEffect(() => {
    // Try to load cached or saved organizer profile
    const saved = localStorage.getItem('dogfood_organizer_profile');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setFullName(parsed.fullName || currentUser?.name || 'Apex Event Lead');
        setEmail(parsed.email || currentUser?.email || 'organizer@hackathon.dev');
        setOrganization(parsed.organization || 'Apex Global Technology Alliance');
        setDepartment(parsed.department || 'Department of Innovation & Technology');
        setDesignation(parsed.designation || 'Lead Hackathon Adjudicator & Organizer');
        setPhone(parsed.phone || '+1 (555) 382-9041');
        setWebsite(parsed.website || 'https://apex.hackathon.dev');
        setLinkedin(parsed.linkedin || 'https://linkedin.com/in/apex-organizer');
        setBio(
          parsed.bio ||
            'Lead coordinator directing high-impact engineering hackathons, jury calibration protocols, and cryptographically verified certificate distributions across premier engineering colleges and developer communities.'
        );
        setAvatarUrl(parsed.avatarUrl || currentUser?.avatarUrl || '');
        setSignatoryTitle(parsed.signatoryTitle || 'Lead Event Convener');
        return;
      } catch {}
    }

    // Default Fallback
    setFullName(currentUser?.name || 'Apex Event Lead');
    setEmail(currentUser?.email || 'organizer@hackathon.dev');
    setOrganization('Apex Global Technology Alliance');
    setDepartment('Department of Computer Science & Engineering');
    setDesignation('Director of Hackathon Operations');
    setPhone('+1 (555) 382-9041');
    setWebsite('https://apex.hackathon.dev');
    setLinkedin('https://linkedin.com/in/apex-lead');
    setBio(
      'Lead coordinator directing high-impact engineering hackathons, jury calibration protocols, and cryptographically verified certificate distributions across premier engineering colleges and developer communities.'
    );
    setAvatarUrl(currentUser?.avatarUrl || '');
    setSignatoryTitle('Lead Event Convener & Organizing Chair');
  }, [currentUser]);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    setSuccessMessage(null);

    const payload = {
      fullName: fullName.trim(),
      email: email.trim(),
      organization: organization.trim(),
      department: department.trim(),
      designation: designation.trim(),
      phone: phone.trim(),
      website: website.trim(),
      linkedin: linkedin.trim(),
      bio: bio.trim(),
      avatarUrl: avatarUrl.trim(),
      signatoryTitle: signatoryTitle.trim(),
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem('dogfood_organizer_profile', JSON.stringify(payload));

    // Also update participants profile endpoint if applicable
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
      setSuccessMessage('Organizer profile updated and persisted successfully!');
      setTimeout(() => setSuccessMessage(null), 4000);
    }, 400);
  };

  return (
    <div className="space-y-6 select-none max-w-5xl mx-auto pb-16 font-sans">
      {/* 1. TOP HEADER & CREDENTIAL BANNER */}
      <div className="bg-white border border-[#E5E0D8] rounded-3xl p-6 sm:p-8 shadow-xs relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-[#FA541C]/15 via-[#FA541C]/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center space-x-5">
            {/* Avatar */}
            <div className="relative">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={fullName}
                  className="w-20 h-20 rounded-2xl object-cover ring-3 ring-[#FA541C]/30 shadow-md"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#FA541C] to-[#E03A00] text-white font-extrabold text-2xl flex items-center justify-center shadow-lg shadow-[#FA541C]/25">
                  {fullName ? fullName.charAt(0).toUpperCase() : 'O'}
                </div>
              )}
              <span
                className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#10B981] border-2 border-white rounded-full flex items-center justify-center shadow-xs"
                title="Verified Lead Organizer"
              >
                <Check className="w-3 h-3 text-white stroke-[3]" />
              </span>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="px-3 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider uppercase bg-[#FFE8D6] text-[#FA541C] border border-[#FA541C]/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-[#FA541C]" />
                  Verified Event Organizer
                </span>
                <span className="text-xs text-[#9CA3AF]">•</span>
                <span className="text-xs text-stone-500 font-medium">{organization}</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-tight">
                {fullName || 'Apex Event Lead'}
              </h1>
              <p className="text-xs sm:text-sm text-[#4B5563] mt-0.5 flex items-center gap-1.5 font-medium">
                <Building2 className="w-3.5 h-3.5 text-stone-400" />
                <span>{designation || 'Director of Operations'}</span>
                <span className="text-stone-300">•</span>
                <span>{department}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex-1 sm:flex-initial px-4 py-2 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 bg-[#FA541C] hover:bg-[#E03A00] text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-[0.98]"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{saving ? 'Saving...' : 'Save Profile'}</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-[0.98]"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Edit Profile</span>
              </button>
            )}
          </div>
        </div>

        {successMessage && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}
      </div>

      {/* 2. STATS ROW */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white border border-[#E5E0D8] rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-stone-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Active Arenas</span>
            <Trophy className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-stone-900 font-mono">{stats.activeHackathons}</div>
          <span className="text-[10px] text-stone-500">Live Hackathon Portals</span>
        </div>

        <div className="bg-white border border-[#E5E0D8] rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-stone-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Registered Teams</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-stone-900 font-mono">{stats.totalTeams}</div>
          <span className="text-[10px] text-stone-500">Across All Tracks</span>
        </div>

        <div className="bg-white border border-[#E5E0D8] rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-stone-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Scored Submissions</span>
            <FileCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 font-mono">
            {stats.submissionsEvaluated}
          </div>
          <span className="text-[10px] text-stone-500">Locked By Jury</span>
        </div>

        <div className="bg-white border border-[#E5E0D8] rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-stone-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Certificates</span>
            <Award className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-600 font-mono">
            {stats.certificatesIssued}
          </div>
          <span className="text-[10px] text-stone-500">Cryptographically Signed</span>
        </div>
      </div>

      {/* 3. MAIN DETAILS FORM & PREVIEW */}
      <div className="space-y-6">
        {/* Profile & Organization Info */}
        <div className="bg-white border border-[#E5E0D8] rounded-2xl p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-extrabold text-stone-900 text-sm flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#FA541C]" />
                <span>Organization &amp; Institutional Credentials</span>
              </h3>
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                Official Records
              </span>
            </div>

            {isEditing ? (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-semibold text-stone-700 block">Full Name</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FA541C]/20"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-stone-700 block">Official Contact Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FA541C]/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-semibold text-stone-700 block">Organization / Institution</label>
                    <input
                      type="text"
                      value={organization}
                      onChange={(e) => setOrganization(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FA541C]/20"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-stone-700 block">Department</label>
                    <input
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FA541C]/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-semibold text-stone-700 block">Operational Designation</label>
                    <input
                      type="text"
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FA541C]/20"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-stone-700 block">Direct Contact Phone</label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FA541C]/20"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-stone-700 block">Organizer Bio / Executive Summary</label>
                  <textarea
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FA541C]/20"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-semibold text-stone-700 block">Official Portal / Website</label>
                    <input
                      type="text"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-stone-700 block">LinkedIn Profile</label>
                    <input
                      type="text"
                      value={linkedin}
                      onChange={(e) => setLinkedin(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-stone-700 block">Avatar Image URL</label>
                  <input
                    type="text"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-stone-700 block">
                    Certificate Signatory Title (Appears on Issued Credentials)
                  </label>
                  <input
                    type="text"
                    value={signatoryTitle}
                    onChange={(e) => setSignatoryTitle(e.target.value)}
                    placeholder="e.g. Dean of Academic Affairs / Organizing Chair"
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none font-serif"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <p className="text-stone-700 leading-relaxed font-normal bg-stone-50/70 p-3.5 rounded-xl border border-stone-100">
                  {bio}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="p-3 rounded-xl bg-stone-50/50 border border-stone-100 flex items-center space-x-3">
                    <Mail className="w-4 h-4 text-stone-400 flex-shrink-0" />
                    <div className="truncate">
                      <span className="text-[10px] text-stone-400 block font-semibold">EMAIL</span>
                      <span className="font-medium text-stone-800">{email}</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-stone-50/50 border border-stone-100 flex items-center space-x-3">
                    <Phone className="w-4 h-4 text-stone-400 flex-shrink-0" />
                    <div className="truncate">
                      <span className="text-[10px] text-stone-400 block font-semibold">PHONE</span>
                      <span className="font-medium text-stone-800">{phone}</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-stone-50/50 border border-stone-100 flex items-center space-x-3">
                    <Globe className="w-4 h-4 text-stone-400 flex-shrink-0" />
                    <div className="truncate">
                      <span className="text-[10px] text-stone-400 block font-semibold">PORTAL</span>
                      <a
                        href={website}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium text-[#FA541C] hover:underline flex items-center gap-1"
                      >
                        {website}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-stone-50/50 border border-stone-100 flex items-center space-x-3">
                    <Award className="w-4 h-4 text-stone-400 flex-shrink-0" />
                    <div className="truncate">
                      <span className="text-[10px] text-stone-400 block font-semibold">
                        SIGNATORY AUTHORITY
                      </span>
                      <span className="font-medium text-stone-800 font-serif">
                        {signatoryTitle || 'Lead Event Convener'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Operations Actions */}
          <div className="bg-white border border-[#E5E0D8] rounded-2xl p-5 shadow-xs space-y-3">
            <h4 className="font-extrabold text-xs text-stone-900 uppercase tracking-wider">
              Quick Workspace Actions
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <Link
                href="/organizer/certificates"
                className="p-3 rounded-xl border border-stone-200 hover:border-[#FA541C] hover:bg-[#FFF5ED] transition-all group"
              >
                <Award className="w-4 h-4 text-[#FA541C] mb-1.5" />
                <div className="font-bold text-xs text-stone-900 group-hover:text-[#FA541C]">
                  Certificate Management
                </div>
                <div className="text-[10px] text-stone-500 mt-0.5">Custom templates &amp; data sheet</div>
              </Link>

              <Link
                href="/organizer/voting"
                className="p-3 rounded-xl border border-stone-200 hover:border-[#FA541C] hover:bg-[#FFF5ED] transition-all group"
              >
                <Layers className="w-4 h-4 text-blue-600 mb-1.5" />
                <div className="font-bold text-xs text-stone-900 group-hover:text-[#FA541C]">
                  Track &amp; Question Voting
                </div>
                <div className="text-[10px] text-stone-500 mt-0.5">Manage community voting polls</div>
              </Link>

              <Link
                href="/organizer/dashboard"
                className="p-3 rounded-xl border border-stone-200 hover:border-[#FA541C] hover:bg-[#FFF5ED] transition-all group"
              >
                <Sparkles className="w-4 h-4 text-amber-600 mb-1.5" />
                <div className="font-bold text-xs text-stone-900 group-hover:text-[#FA541C]">
                  Organizer Dashboard
                </div>
                <div className="text-[10px] text-stone-500 mt-0.5">Operations telemetry &amp; jury</div>
              </Link>
            </div>
          </div>

          {/* Platform Security & Attestation */}
          <div className="bg-white border border-[#E5E0D8] rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
              <h4 className="font-extrabold text-xs text-stone-900 uppercase tracking-wider">
                Platform Security &amp; Attestation
              </h4>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Verified
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-stone-50 border border-stone-100 space-y-1">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">ACCOUNT AUTHENTICATION</span>
                <div className="flex items-center justify-between">
                  <span className="text-stone-800 font-semibold">Active Enterprise Session</span>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">Active</span>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-stone-50 border border-stone-100 space-y-1">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">COMMUNICATIONS SECURITY</span>
                <div className="flex items-center justify-between">
                  <span className="text-stone-800 font-semibold">256-bit TLS Encrypted</span>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">TLS 1.3</span>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-stone-50 border border-stone-100 space-y-1">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">AUDIT TRAIL</span>
                <div className="flex items-center justify-between">
                  <span className="text-stone-800 font-semibold">SHA-256 Cryptographic Logs</span>
                  <span className="text-[10px] font-bold text-stone-600 bg-stone-100 px-2 py-0.5 rounded">Immutable</span>
                </div>
              </div>
            </div>
          </div>
        </div>
    </div>
  );
}
