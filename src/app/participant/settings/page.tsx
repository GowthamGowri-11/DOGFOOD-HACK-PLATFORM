'use client';

import React, { useState, useEffect } from 'react';
import {
  User,
  Github,
  Linkedin,
  Mail,
  Shield,
  CheckCircle2,
  AlertCircle,
  Save,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export default function ParticipantSettingsPage() {
  const [user, setUser] = useState<any | null>(null);
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);
        const res = await fetch('/api/v1/participants/me/profile');
        const json = await res.json();
        if (res.ok && json.data?.user) {
          const u = json.data.user;
          setUser(u);
          setFullName(u.fullName || '');
          setBio(u.bio || '');
          setGithubUrl(u.githubUrl || '');
          setLinkedinUrl(u.linkedinUrl || '');
          setAvatarUrl(u.avatarUrl || '');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setMessage(null);

      const res = await fetch('/api/v1/participants/me/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullName.trim(),
          bio: bio.trim(),
          githubUrl: githubUrl.trim() || undefined,
          linkedinUrl: linkedinUrl.trim() || undefined,
          avatarUrl: avatarUrl.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setMessage({
          type: 'error',
          text: json.message || json.error?.message || 'Failed to update profile.',
        });
        return;
      }

      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      if (json.data?.user) {
        setUser(json.data.user);
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error updating profile' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 select-none max-w-3xl mx-auto">
      {/* Header */}
      <div className="pb-6 border-b border-[#E2E8F0]">
        <div className="flex items-center space-x-2">
          <span className="text-[11px] font-bold text-[#2563EB] bg-[#EFF6FF] px-2.5 py-0.5 rounded-full border border-[#BFDBFE]">
            Account Management
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#111827] mt-1 tracking-tight">
          Profile & Settings
        </h1>
        <p className="text-xs sm:text-sm text-[#64748B] mt-0.5 font-normal">
          Manage your builder identity, portfolio links, and public developer profiles.
        </p>
      </div>

      {/* Feedback Alerts */}
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

      {loading ? (
        <div className="py-16 text-center text-xs text-[#64748B]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2563EB] mx-auto mb-2" />
          Loading profile settings...
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          {/* Identity Section */}
          <div className="bg-white border border-[#E2E8F0] rounded-[18px] p-6 sm:p-7 shadow-card space-y-4">
            <h2 className="text-base font-bold text-[#111827] flex items-center">
              <User className="w-4 h-4 mr-2 text-[#2563EB]" /> Personal Details
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-[#334155] block mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[11px] text-xs font-medium text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#334155] block mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full px-3 py-2 bg-[#F1F5F9] border border-[#E2E8F0] rounded-[11px] text-xs font-medium text-[#64748B] cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-[#334155] block mb-1">
                Bio / Summary
              </label>
              <textarea
                rows={3}
                placeholder="Tell the community and judges about your background and engineering interests..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[11px] text-xs font-medium text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              />
            </div>
          </div>

          {/* Social Links Section */}
          <div className="bg-white border border-[#E2E8F0] rounded-[18px] p-6 sm:p-7 shadow-card space-y-4">
            <h2 className="text-base font-bold text-[#111827] flex items-center">
              <Github className="w-4 h-4 mr-2 text-[#2563EB]" /> Developer Presence
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-[#334155] block mb-1">
                  GitHub Profile URL
                </label>
                <input
                  type="url"
                  placeholder="https://github.com/your-username"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[11px] text-xs font-mono text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#334155] block mb-1">
                  LinkedIn Profile URL
                </label>
                <input
                  type="url"
                  placeholder="https://linkedin.com/in/your-profile"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[11px] text-xs font-mono text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button
              variant="primary"
              size="md"
              type="submit"
              disabled={saving || !fullName.trim()}
              icon={<Save className="w-4 h-4" />}
            >
              {saving ? 'Saving Changes...' : 'Save Profile Changes'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
