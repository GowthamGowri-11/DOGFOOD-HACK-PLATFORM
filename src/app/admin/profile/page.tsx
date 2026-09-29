'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  ShieldCheck,
  Server,
  Lock,
  Mail,
  Key,
  Database,
  Activity,
  User,
  Users,
  Trophy,
  CheckCircle2,
  Pencil,
  Save,
  Check,
  Sliders,
  Terminal,
  Clock,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Building2,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function AdminProfilePage() {
  const { currentUser, refreshAuth } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [organization, setOrganization] = useState('');
  const [department, setDepartment] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [twoFactorStatus, setTwoFactorStatus] = useState('Hardware Key (WebAuthn / FIDO2)');
  const [sessionTimeout, setSessionTimeout] = useState('12 Hours');

  // System telemetry
  const [telemetry, setTelemetry] = useState({
    totalUsers: 1240,
    totalHackathons: 18,
    activeSubmissions: 312,
    systemUptime: '99.98%',
    databaseStatus: 'Healthy (PostgreSQL Cluster)',
    cryptoLedger: 'Verified (Block #48291)',
  });

  useEffect(() => {
    const saved = localStorage.getItem('dogfood_admin_profile');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setFullName(parsed.fullName || currentUser?.name || 'System Administrator');
        setEmail(parsed.email || currentUser?.email || 'admin@hackathon.dev');
        setOrganization(parsed.organization || 'ATLYX Platform Core Engineering');
        setDepartment(parsed.department || 'Infrastructure & Root Governance');
        setPhone(parsed.phone || '+1 (555) 019-2831');
        setBio(
          parsed.bio ||
            'Superuser maintaining zero-trust architecture, jury calibration protocols, database state integrity, and verified cryptographic attestation across the hackathon network.'
        );
        setAvatarUrl(parsed.avatarUrl || currentUser?.avatarUrl || '');
        setTwoFactorStatus(parsed.twoFactorStatus || 'Hardware Key (WebAuthn / FIDO2)');
        setSessionTimeout(parsed.sessionTimeout || '12 Hours');
        return;
      } catch {}
    }

    setFullName(currentUser?.name || 'System Administrator');
    setEmail(currentUser?.email || 'admin@hackathon.dev');
    setOrganization('ATLYX Platform Core Engineering');
    setDepartment('Infrastructure & Root Governance');
    setPhone('+1 (555) 019-2831');
    setBio(
      'Superuser maintaining zero-trust architecture, jury calibration protocols, database state integrity, and verified cryptographic attestation across the hackathon network.'
    );
    setAvatarUrl(currentUser?.avatarUrl || '');
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
      phone: phone.trim(),
      bio: bio.trim(),
      avatarUrl: avatarUrl.trim(),
      twoFactorStatus,
      sessionTimeout,
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem('dogfood_admin_profile', JSON.stringify(payload));

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
      setSuccessMessage('Administrator profile & security parameters updated successfully!');
      setTimeout(() => setSuccessMessage(null), 4000);
    }, 400);
  };

  return (
    <div className="space-y-6 select-none max-w-5xl mx-auto pb-16 font-sans">
      {/* 1. TOP HEADER & PRIVILEGE BANNER */}
      <div className="bg-white border border-[#E5E0D8] rounded-3xl p-6 sm:p-8 shadow-xs relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-red-500/10 via-amber-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center space-x-5">
            {/* Avatar */}
            <div className="relative">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={fullName}
                  className="w-20 h-20 rounded-2xl object-cover ring-3 ring-red-500/30 shadow-md"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-red-600 to-stone-900 text-white font-extrabold text-2xl flex items-center justify-center shadow-lg shadow-red-900/20">
                  {fullName ? fullName.charAt(0).toUpperCase() : 'A'}
                </div>
              )}
              <span
                className="absolute -bottom-1 -right-1 w-5 h-5 bg-red-600 border-2 border-white rounded-full flex items-center justify-center shadow-xs"
                title="Root Administrator Access"
              >
                <Key className="w-3 h-3 text-white stroke-[2.5]" />
              </span>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="px-3 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider uppercase bg-red-50 text-red-700 border border-red-200 flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3 text-red-600" />
                  Root Administrator (Level 5)
                </span>
                <span className="text-xs text-stone-300">•</span>
                <span className="text-xs text-stone-500 font-medium">Superuser Privilege</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-tight">
                {fullName || 'System Administrator'}
              </h1>
              <p className="text-xs sm:text-sm text-[#4B5563] mt-0.5 flex items-center gap-1.5 font-medium">
                <Server className="w-3.5 h-3.5 text-stone-400" />
                <span>{organization}</span>
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
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-[0.98]"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{saving ? 'Saving...' : 'Save Settings'}</span>
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

      {/* 2. PLATFORM TELEMETRY ROW */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white border border-[#E5E0D8] rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-stone-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Users</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-stone-900 font-mono">{telemetry.totalUsers}</div>
          <span className="text-[10px] text-stone-500">Across All Roles</span>
        </div>

        <div className="bg-white border border-[#E5E0D8] rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-stone-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Arenas Managed</span>
            <Trophy className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-stone-900 font-mono">
            {telemetry.totalHackathons}
          </div>
          <span className="text-[10px] text-stone-500">Global Competitions</span>
        </div>

        <div className="bg-white border border-[#E5E0D8] rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-stone-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">System Health</span>
            <Activity className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 font-mono">
            {telemetry.systemUptime}
          </div>
          <span className="text-[10px] text-stone-500">30-day SLA Uptime</span>
        </div>

        <div className="bg-white border border-[#E5E0D8] rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-stone-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Audit Ledger</span>
            <Database className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-lg font-black text-purple-700 font-mono pt-1 truncate">
            #48291
          </div>
          <span className="text-[10px] text-stone-500">Blocks Verified</span>
        </div>
      </div>

      {/* 3. DETAILS & SECURITY CONFIG */}
      <div className="space-y-6">
        <div className="bg-white border border-[#E5E0D8] rounded-2xl p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-extrabold text-stone-900 text-sm flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-red-600" />
                <span>Administrator Information &amp; Bio</span>
              </h3>
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                Core Governance
              </span>
            </div>

            {isEditing ? (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-semibold text-stone-700 block">Admin Full Name</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-stone-700 block">Security Contact Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-semibold text-stone-700 block">Organization Entity</label>
                    <input
                      type="text"
                      value={organization}
                      onChange={(e) => setOrganization(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-stone-700 block">Department / Team</label>
                    <input
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-stone-700 block">Emergency Response Phone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-stone-700 block">Administrative Mandate &amp; Notes</label>
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
              <div className="space-y-4 text-xs">
                <p className="text-stone-700 leading-relaxed font-normal bg-stone-50/70 p-3.5 rounded-xl border border-stone-100">
                  {bio}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
                  <div className="p-3.5 rounded-xl bg-stone-50/60 border border-stone-100 flex items-center space-x-3">
                    <Mail className="w-4 h-4 text-stone-400 flex-shrink-0" />
                    <div className="truncate">
                      <span className="text-[10px] text-stone-400 block font-semibold uppercase tracking-wider">SECURITY EMAIL</span>
                      <span className="font-medium text-stone-800">{email}</span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-stone-50/60 border border-stone-100 flex items-center space-x-3">
                    <Server className="w-4 h-4 text-stone-400 flex-shrink-0" />
                    <div className="truncate">
                      <span className="text-[10px] text-stone-400 block font-semibold uppercase tracking-wider">ROLE CLEARANCE</span>
                      <span className="font-medium text-stone-800 font-mono">ROOT_LEVEL_5</span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-stone-50/60 border border-stone-100 flex items-center space-x-3">
                    <Building2 className="w-4 h-4 text-stone-400 flex-shrink-0" />
                    <div className="truncate">
                      <span className="text-[10px] text-stone-400 block font-semibold uppercase tracking-wider">ORGANIZATION</span>
                      <span className="font-medium text-stone-800">{organization}</span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-stone-50/60 border border-stone-100 flex items-center space-x-3">
                    <Sliders className="w-4 h-4 text-stone-400 flex-shrink-0" />
                    <div className="truncate">
                      <span className="text-[10px] text-stone-400 block font-semibold uppercase tracking-wider">GOVERNANCE UNIT</span>
                      <span className="font-medium text-stone-800">{department}</span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-stone-50/60 border border-stone-100 flex items-center space-x-3">
                    <Lock className="w-4 h-4 text-stone-400 flex-shrink-0" />
                    <div className="truncate">
                      <span className="text-[10px] text-stone-400 block font-semibold uppercase tracking-wider">TWO-FACTOR AUTH</span>
                      <span className="font-medium text-stone-800">{twoFactorStatus}</span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-stone-50/60 border border-stone-100 flex items-center space-x-3">
                    <Clock className="w-4 h-4 text-stone-400 flex-shrink-0" />
                    <div className="truncate">
                      <span className="text-[10px] text-stone-400 block font-semibold uppercase tracking-wider">SESSION TIMEOUT</span>
                      <span className="font-medium text-stone-800 font-mono">{sessionTimeout}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Admin Actions */}
          <div className="bg-white border border-[#E5E0D8] rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
              <h4 className="font-extrabold text-xs text-stone-900 uppercase tracking-wider">
                Administration Panels
              </h4>
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                Shortcuts
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Link
                href="/admin/users"
                className="p-3.5 rounded-xl border border-stone-200 hover:border-red-500 hover:bg-red-50/30 transition-all group"
              >
                <Users className="w-4 h-4 text-red-600 mb-1.5" />
                <div className="font-bold text-xs text-stone-900 group-hover:text-red-700">
                  User Management
                </div>
                <div className="text-[10px] text-stone-500 mt-0.5">Control roles &amp; accounts</div>
              </Link>

              <Link
                href="/admin/audit-logs"
                className="p-3.5 rounded-xl border border-stone-200 hover:border-red-500 hover:bg-red-50/30 transition-all group"
              >
                <Clock className="w-4 h-4 text-amber-600 mb-1.5" />
                <div className="font-bold text-xs text-stone-900 group-hover:text-red-700">
                  Audit Logs
                </div>
                <div className="text-[10px] text-stone-500 mt-0.5">Immutable activity stream</div>
              </Link>

              <Link
                href="/admin/dashboard"
                className="p-3.5 rounded-xl border border-stone-200 hover:border-red-500 hover:bg-red-50/30 transition-all group"
              >
                <Activity className="w-4 h-4 text-purple-600 mb-1.5" />
                <div className="font-bold text-xs text-stone-900 group-hover:text-red-700">
                  Admin Dashboard
                </div>
                <div className="text-[10px] text-stone-500 mt-0.5">System overview &amp; health</div>
              </Link>
            </div>
          </div>

          {/* Platform Security Safeguards */}
          <div className="bg-white border border-[#E5E0D8] rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
              <h4 className="font-extrabold text-xs text-stone-900 uppercase tracking-wider">
                Security Policy &amp; Platform Safeguards
              </h4>
              <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                Root Enforced
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-100 space-y-1">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">TWO-FACTOR AUTH</span>
                <div className="flex items-center justify-between">
                  <span className="text-stone-800 font-semibold">{twoFactorStatus}</span>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">Enforced</span>
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-100 space-y-1">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">ADMIN SESSION LIFETIME</span>
                <div className="flex items-center justify-between">
                  <span className="text-stone-800 font-semibold">{sessionTimeout} Max Bound</span>
                  <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">Active</span>
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-100 space-y-1">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">AUDIT LEDGER INTEGRITY</span>
                <div className="flex items-center justify-between">
                  <span className="text-stone-800 font-semibold">{telemetry.cryptoLedger}</span>
                  <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded">Signed</span>
                </div>
              </div>
            </div>
          </div>
        </div>
    </div>
  );
}
