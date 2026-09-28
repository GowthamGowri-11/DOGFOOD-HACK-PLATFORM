'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  User,
  Phone,
  GraduationCap,
  UserCheck,
  Github,
  Linkedin,
  Globe,
  FileText,
  Sparkles,
  Pencil,
  Check,
  X,
  Plus,
  ExternalLink,
  Save,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Camera,
  Loader2,
  Mail,
  Shield,
  Trash2,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

const YEAR_OPTIONS = [
  'Select year',
  '1st Year (Freshman)',
  '2nd Year (Sophomore)',
  '3rd Year (Junior)',
  '4th Year (Senior)',
  'Post-Graduate / Masters',
  'Alumni / Working Professional',
];

const SUGGESTED_SKILLS = [
  'React',
  'Next.js',
  'TypeScript',
  'Python',
  'Node.js',
  'Tailwind CSS',
  'PyTorch',
  'Docker',
  'PostgreSQL',
  'Rust',
  'Solidity',
  'GraphQL',
  'Figma',
];

export default function ParticipantSettingsPage() {
  const [user, setUser] = useState<any | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form Fields matching screenshot
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [year, setYear] = useState('');
  const [mentorName, setMentorName] = useState('');
  const [bio, setBio] = useState('');

  // Professional Links
  const [githubUrl, setGithubUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [resumeUrl, setResumeUrl] = useState('');

  // Technical Skills
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkillInput, setNewSkillInput] = useState('');

  // Avatar URL
  const [avatarUrl, setAvatarUrl] = useState('');

  // Snapshot for cancelling edits
  const [initialState, setInitialState] = useState<any>(null);

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
          setPhoneNumber(u.phoneNumber || '');
          setYear(u.year || 'Select year');
          setMentorName(u.mentorName || '');
          setBio(u.bio || '');
          setGithubUrl(u.githubUrl || '');
          setLinkedinUrl(u.linkedinUrl || '');
          setPortfolioUrl(u.portfolioUrl || '');
          setResumeUrl(u.resumeUrl || '');
          setSkills(Array.isArray(u.skills) ? u.skills : []);
          setAvatarUrl(u.avatarUrl || '');

          setInitialState({
            fullName: u.fullName || '',
            phoneNumber: u.phoneNumber || '',
            year: u.year || 'Select year',
            mentorName: u.mentorName || '',
            bio: u.bio || '',
            githubUrl: u.githubUrl || '',
            linkedinUrl: u.linkedinUrl || '',
            portfolioUrl: u.portfolioUrl || '',
            resumeUrl: u.resumeUrl || '',
            skills: Array.isArray(u.skills) ? u.skills : [],
            avatarUrl: u.avatarUrl || '',
          });
        }
      } catch (err) {
        console.error('Error loading profile:', err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  const handleCancel = () => {
    if (initialState) {
      setFullName(initialState.fullName);
      setPhoneNumber(initialState.phoneNumber);
      setYear(initialState.year);
      setMentorName(initialState.mentorName);
      setBio(initialState.bio);
      setGithubUrl(initialState.githubUrl);
      setLinkedinUrl(initialState.linkedinUrl);
      setPortfolioUrl(initialState.portfolioUrl);
      setResumeUrl(initialState.resumeUrl);
      setSkills(initialState.skills);
      setAvatarUrl(initialState.avatarUrl);
    }
    setIsEditing(false);
    setMessage(null);
  };

  const handleAddSkill = (skillToAdd?: string) => {
    const val = (skillToAdd || newSkillInput).trim();
    if (!val) return;
    if (!skills.includes(val)) {
      setSkills([...skills, val]);
    }
    setNewSkillInput('');
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      setSaving(true);
      setMessage(null);

      const payload = {
        fullName: fullName.trim(),
        phoneNumber: phoneNumber.trim(),
        year: year === 'Select year' ? '' : year,
        mentorName: mentorName.trim(),
        bio: bio.trim(),
        githubUrl: githubUrl.trim(),
        linkedinUrl: linkedinUrl.trim(),
        portfolioUrl: portfolioUrl.trim(),
        resumeUrl: resumeUrl.trim(),
        skills,
        avatarUrl: avatarUrl.trim(),
      };

      const res = await fetch('/api/v1/participants/me/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        setMessage({
          type: 'error',
          text: json.message || json.error?.message || 'Failed to update profile.',
        });
        return;
      }

      setMessage({ type: 'success', text: 'Profile details saved successfully!' });
      setIsEditing(false);
      setInitialState(payload);

      if (json.data?.user) {
        setUser(json.data.user);
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error updating profile' });
    } finally {
      setSaving(false);
    }
  };

  const hasAnyLinks = Boolean(
    githubUrl.trim() || linkedinUrl.trim() || portfolioUrl.trim() || resumeUrl.trim()
  );

  return (
    <div className="space-y-6 select-none max-w-4xl mx-auto pb-16">
      {/* 1. TOP HEADER & PROFILE BANNER */}
      <div className="bg-white border border-[#E5E0D8] rounded-3xl p-6 sm:p-8 shadow-xs relative overflow-hidden group">
        {/* Subtle orange ambient background glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-[#FA541C]/10 via-[#FA541C]/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center space-x-4">
            {/* Avatar with status dot */}
            <div className="relative">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={fullName || 'User'}
                  className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl object-cover ring-3 ring-[#FA541C]/20 shadow-md"
                />
              ) : (
                <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-[#FA541C] to-[#E03A00] text-white font-extrabold text-2xl flex items-center justify-center shadow-lg shadow-[#FA541C]/25">
                  {fullName ? fullName.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
              <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#10B981] border-2 border-white rounded-full flex items-center justify-center shadow-xs" title="Active Builder">
                <Check className="w-3 h-3 text-white stroke-[3]" />
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider uppercase bg-[#FFE8D6] text-[#FA541C] border border-[#FA541C]/30">
                  {user?.role || 'PARTICIPANT'}
                </span>
                <span className="text-xs text-[#9CA3AF]">•</span>
                <span className="text-xs text-[#6B7280] font-medium flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5" />
                  {user?.email || 'builder@hackathon.dev'}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#18181B] tracking-tight">
                {fullName || 'Guru Vishnu'}
              </h1>
              <p className="text-xs sm:text-[13px] text-[#6B7280] mt-0.5">
                {year && year !== 'Select year' ? year : 'Builder'} {mentorName ? `• Mentor: ${mentorName}` : ''}
              </p>
            </div>
          </div>

          {/* EDIT & SAVE CONTROLS (IN SITE THEME) */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            {!isEditing ? (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#FA541C] via-[#FF6636] to-[#E03A00] hover:from-[#FF5722] hover:to-[#D4380D] text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-[#FA541C]/25 hover:shadow-xl hover:shadow-[#FA541C]/40 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all cursor-pointer group"
              >
                <Pencil className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                <span>Edit Profile</span>
              </button>
            ) : (
              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={saving}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white border border-[#D1D5DB] hover:border-[#9CA3AF] text-[#4B5563] text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer hover:bg-[#F9FAFB]"
                >
                  <X className="w-4 h-4" />
                  <span>Cancel</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSave()}
                  disabled={saving}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#FA541C] via-[#FF6636] to-[#E03A00] hover:from-[#FF5722] hover:to-[#D4380D] text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-[#FA541C]/25 hover:shadow-xl hover:shadow-[#FA541C]/40 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Alerts */}
      {message && (
        <div
          className={`p-4 rounded-2xl text-xs sm:text-sm font-medium flex items-center shadow-xs animate-in fade-in duration-200 ${
            message.type === 'success'
              ? 'bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46]'
              : 'bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B]'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 mr-2.5 text-[#059669] flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 mr-2.5 text-[#DC2626] flex-shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {loading ? (
        <div className="py-20 text-center text-xs text-[#64748B] space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#FA541C] mx-auto" />
          <p>Loading profile details...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* ======================================================== */}
          {/* CARD 1: Personal & Contact Information (Exact Spec)        */}
          {/* ======================================================== */}
          <div className="bg-white border border-[#E5E0D8] rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-[#18181B] tracking-tight">
                Personal &amp; Contact Information
              </h2>
              <p className="text-xs sm:text-[13.5px] text-[#6B7280] font-normal mt-0.5">
                Update your personal details and professional biography.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* FULL NAME */}
              <div>
                <label className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider block mb-2">
                  FULL NAME
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 text-[#9CA3AF] pointer-events-none">
                    <User className="w-4 h-4" />
                  </div>
                  {isEditing ? (
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Guru Vishnu"
                      className="w-full pl-10 pr-4 py-3 bg-white border border-[#E5E0D8] hover:border-[#CBD5E1] rounded-2xl text-xs sm:text-[13.5px] font-medium text-[#18181B] focus:outline-none focus:ring-2 focus:ring-[#FA541C]/20 focus:border-[#FA541C] shadow-2xs transition-all"
                    />
                  ) : (
                    <div className="w-full pl-10 pr-4 py-3 bg-[#FAF8F5] border border-[#ECE6DD] rounded-2xl text-xs sm:text-[13.5px] font-semibold text-[#18181B]">
                      {fullName || <span className="text-[#9CA3AF] font-normal">Not provided</span>}
                    </div>
                  )}
                </div>
              </div>

              {/* PHONE NUMBER */}
              <div>
                <label className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider block mb-2">
                  PHONE NUMBER
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 text-[#9CA3AF] pointer-events-none">
                    <Phone className="w-4 h-4" />
                  </div>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="9876543210"
                      className="w-full pl-10 pr-4 py-3 bg-white border border-[#E5E0D8] hover:border-[#CBD5E1] rounded-2xl text-xs sm:text-[13.5px] font-medium text-[#18181B] focus:outline-none focus:ring-2 focus:ring-[#FA541C]/20 focus:border-[#FA541C] shadow-2xs transition-all"
                    />
                  ) : (
                    <div className="w-full pl-10 pr-4 py-3 bg-[#FAF8F5] border border-[#ECE6DD] rounded-2xl text-xs sm:text-[13.5px] font-semibold text-[#18181B]">
                      {phoneNumber || <span className="text-[#9CA3AF] font-normal">Not provided</span>}
                    </div>
                  )}
                </div>
              </div>

              {/* YEAR */}
              <div>
                <label className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider block mb-2">
                  YEAR
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 text-[#9CA3AF] pointer-events-none z-10">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  {isEditing ? (
                    <select
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-white border border-[#E5E0D8] hover:border-[#CBD5E1] rounded-2xl text-xs sm:text-[13.5px] font-medium text-[#18181B] focus:outline-none focus:ring-2 focus:ring-[#FA541C]/20 focus:border-[#FA541C] shadow-2xs transition-all appearance-none cursor-pointer"
                    >
                      {YEAR_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="w-full pl-10 pr-4 py-3 bg-[#FAF8F5] border border-[#ECE6DD] rounded-2xl text-xs sm:text-[13.5px] font-semibold text-[#18181B]">
                      {year && year !== 'Select year' ? year : <span className="text-[#9CA3AF] font-normal">Select year</span>}
                    </div>
                  )}
                </div>
              </div>

              {/* MENTOR / GUIDE NAME */}
              <div>
                <label className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider block mb-2">
                  MENTOR / GUIDE NAME
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 text-[#9CA3AF] pointer-events-none">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  {isEditing ? (
                    <input
                      type="text"
                      value={mentorName}
                      onChange={(e) => setMentorName(e.target.value)}
                      placeholder="Enter the Mentor / Guide Name"
                      className="w-full pl-10 pr-4 py-3 bg-white border border-[#E5E0D8] hover:border-[#CBD5E1] rounded-2xl text-xs sm:text-[13.5px] font-medium text-[#18181B] focus:outline-none focus:ring-2 focus:ring-[#FA541C]/20 focus:border-[#FA541C] shadow-2xs transition-all"
                    />
                  ) : (
                    <div className="w-full pl-10 pr-4 py-3 bg-[#FAF8F5] border border-[#ECE6DD] rounded-2xl text-xs sm:text-[13.5px] font-semibold text-[#18181B]">
                      {mentorName || <span className="text-[#9CA3AF] font-normal">Enter the Mentor / Guide Name</span>}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* PROFESSIONAL BIO */}
            <div>
              <label className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider block mb-2">
                PROFESSIONAL BIO
              </label>
              {isEditing ? (
                <textarea
                  rows={4}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us about your hackathon experience, tech stack, and goals..."
                  className="w-full p-4 bg-white border border-[#E5E0D8] hover:border-[#CBD5E1] rounded-2xl text-xs sm:text-[13.5px] font-medium text-[#18181B] focus:outline-none focus:ring-2 focus:ring-[#FA541C]/20 focus:border-[#FA541C] shadow-2xs transition-all resize-none leading-relaxed"
                />
              ) : (
                <div className="w-full p-4 bg-[#FAF8F5] border border-[#ECE6DD] rounded-2xl text-xs sm:text-[13.5px] font-medium text-[#374151] min-h-[90px] leading-relaxed">
                  {bio ? (
                    bio
                  ) : (
                    <span className="text-[#9CA3AF] font-normal italic">
                      Tell us about your hackathon experience, tech stack, and goals...
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ======================================================== */}
          {/* CARD 2: Professional Links & Resume (Exact Spec)         */}
          {/* ======================================================== */}
          <div className="bg-white border border-[#E5E0D8] rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-[#18181B] tracking-tight">
                Professional Links &amp; Resume
              </h2>
              <p className="text-xs sm:text-[13.5px] text-[#6B7280] font-normal mt-0.5">
                Connect your GitHub and LinkedIn to showcase your work.
              </p>
            </div>

            {!isEditing ? (
              /* View Mode */
              !hasAnyLinks ? (
                <p className="text-xs sm:text-[13.5px] text-[#9CA3AF] py-1 font-normal">
                  No professional links added yet.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {githubUrl && (
                    <a
                      href={githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#ECE6DD] hover:border-[#FA541C] hover:bg-[#FFF8F4] transition-all group cursor-pointer"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-xl bg-black text-white flex items-center justify-center flex-shrink-0">
                          <Github className="w-4 h-4" />
                        </div>
                        <div className="truncate">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280] block">
                            GITHUB
                          </span>
                          <span className="text-xs font-bold text-[#18181B] group-hover:text-[#FA541C] transition-colors truncate block">
                            {githubUrl.replace(/^https?:\/\/(www\.)?github\.com\//, '')}
                          </span>
                        </div>
                      </div>
                      <ExternalLink className="w-4 h-4 text-[#9CA3AF] group-hover:text-[#FA541C] transition-colors flex-shrink-0" />
                    </a>
                  )}

                  {linkedinUrl && (
                    <a
                      href={linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#ECE6DD] hover:border-[#FA541C] hover:bg-[#FFF8F4] transition-all group cursor-pointer"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-xl bg-[#0A66C2] text-white flex items-center justify-center flex-shrink-0">
                          <Linkedin className="w-4 h-4" />
                        </div>
                        <div className="truncate">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280] block">
                            LINKEDIN
                          </span>
                          <span className="text-xs font-bold text-[#18181B] group-hover:text-[#FA541C] transition-colors truncate block">
                            {linkedinUrl.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, '')}
                          </span>
                        </div>
                      </div>
                      <ExternalLink className="w-4 h-4 text-[#9CA3AF] group-hover:text-[#FA541C] transition-colors flex-shrink-0" />
                    </a>
                  )}

                  {portfolioUrl && (
                    <a
                      href={portfolioUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#ECE6DD] hover:border-[#FA541C] hover:bg-[#FFF8F4] transition-all group cursor-pointer"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-xl bg-[#2563EB] text-white flex items-center justify-center flex-shrink-0">
                          <Globe className="w-4 h-4" />
                        </div>
                        <div className="truncate">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280] block">
                            PORTFOLIO
                          </span>
                          <span className="text-xs font-bold text-[#18181B] group-hover:text-[#FA541C] transition-colors truncate block">
                            {portfolioUrl.replace(/^https?:\/\//, '')}
                          </span>
                        </div>
                      </div>
                      <ExternalLink className="w-4 h-4 text-[#9CA3AF] group-hover:text-[#FA541C] transition-colors flex-shrink-0" />
                    </a>
                  )}

                  {resumeUrl && (
                    <a
                      href={resumeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#ECE6DD] hover:border-[#FA541C] hover:bg-[#FFF8F4] transition-all group cursor-pointer"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-xl bg-[#DC2626] text-white flex items-center justify-center flex-shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="truncate">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280] block">
                            RESUME / CV
                          </span>
                          <span className="text-xs font-bold text-[#18181B] group-hover:text-[#FA541C] transition-colors truncate block">
                            View Document
                          </span>
                        </div>
                      </div>
                      <ExternalLink className="w-4 h-4 text-[#9CA3AF] group-hover:text-[#FA541C] transition-colors flex-shrink-0" />
                    </a>
                  )}
                </div>
              )
            ) : (
              /* Edit Mode Inputs */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider block mb-2">
                    GITHUB PROFILE
                  </label>
                  <div className="relative flex items-center">
                    <div className="absolute left-3.5 text-[#9CA3AF] pointer-events-none">
                      <Github className="w-4 h-4" />
                    </div>
                    <input
                      type="url"
                      value={githubUrl}
                      onChange={(e) => setGithubUrl(e.target.value)}
                      placeholder="https://github.com/your-username"
                      className="w-full pl-10 pr-4 py-3 bg-white border border-[#E5E0D8] hover:border-[#CBD5E1] rounded-2xl text-xs sm:text-[13.5px] font-medium text-[#18181B] focus:outline-none focus:ring-2 focus:ring-[#FA541C]/20 focus:border-[#FA541C] shadow-2xs transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider block mb-2">
                    LINKEDIN PROFILE
                  </label>
                  <div className="relative flex items-center">
                    <div className="absolute left-3.5 text-[#9CA3AF] pointer-events-none">
                      <Linkedin className="w-4 h-4" />
                    </div>
                    <input
                      type="url"
                      value={linkedinUrl}
                      onChange={(e) => setLinkedinUrl(e.target.value)}
                      placeholder="https://linkedin.com/in/your-profile"
                      className="w-full pl-10 pr-4 py-3 bg-white border border-[#E5E0D8] hover:border-[#CBD5E1] rounded-2xl text-xs sm:text-[13.5px] font-medium text-[#18181B] focus:outline-none focus:ring-2 focus:ring-[#FA541C]/20 focus:border-[#FA541C] shadow-2xs transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider block mb-2">
                    PORTFOLIO / WEBSITE
                  </label>
                  <div className="relative flex items-center">
                    <div className="absolute left-3.5 text-[#9CA3AF] pointer-events-none">
                      <Globe className="w-4 h-4" />
                    </div>
                    <input
                      type="url"
                      value={portfolioUrl}
                      onChange={(e) => setPortfolioUrl(e.target.value)}
                      placeholder="https://yourportfolio.dev"
                      className="w-full pl-10 pr-4 py-3 bg-white border border-[#E5E0D8] hover:border-[#CBD5E1] rounded-2xl text-xs sm:text-[13.5px] font-medium text-[#18181B] focus:outline-none focus:ring-2 focus:ring-[#FA541C]/20 focus:border-[#FA541C] shadow-2xs transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider block mb-2">
                    RESUME / CV (PDF OR DRIVE LINK)
                  </label>
                  <div className="relative flex items-center">
                    <div className="absolute left-3.5 text-[#9CA3AF] pointer-events-none">
                      <FileText className="w-4 h-4" />
                    </div>
                    <input
                      type="url"
                      value={resumeUrl}
                      onChange={(e) => setResumeUrl(e.target.value)}
                      placeholder="https://drive.google.com/your-resume.pdf"
                      className="w-full pl-10 pr-4 py-3 bg-white border border-[#E5E0D8] hover:border-[#CBD5E1] rounded-2xl text-xs sm:text-[13.5px] font-medium text-[#18181B] focus:outline-none focus:ring-2 focus:ring-[#FA541C]/20 focus:border-[#FA541C] shadow-2xs transition-all"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ======================================================== */}
          {/* CARD 3: Technical Skills & Expertise (Exact Spec)        */}
          {/* ======================================================== */}
          <div className="bg-white border border-[#E5E0D8] rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-[#18181B] tracking-tight">
                Technical Skills &amp; Expertise
              </h2>
              <p className="text-xs sm:text-[13.5px] text-[#6B7280] font-normal mt-0.5">
                Add tags for languages, frameworks, and tools you build with.
              </p>
            </div>

            {!isEditing ? (
              /* View Mode */
              skills.length === 0 ? (
                <p className="text-xs sm:text-[13.5px] text-[#9CA3AF] py-1 font-normal">
                  No skills added yet.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2 pt-1">
                  {skills.map((skill) => (
                    <span
                      key={skill}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-[#FFF5ED] to-[#FFEFE6] border border-[#FED7AA] text-[#FA541C] shadow-2xs inline-flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3 h-3 text-[#FA541C]" />
                      {skill}
                    </span>
                  ))}
                </div>
              )
            ) : (
              /* Edit Mode with tag input and suggestions */
              <div className="space-y-4">
                {/* Active Skill Chips */}
                {skills.length > 0 ? (
                  <div className="flex flex-wrap gap-2 p-3 bg-[#FAF8F5] border border-[#ECE6DD] rounded-2xl min-h-[52px] items-center">
                    {skills.map((skill) => (
                      <span
                        key={skill}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white border border-[#FED7AA] text-[#FA541C] shadow-2xs inline-flex items-center gap-2 group"
                      >
                        <span>{skill}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(skill)}
                          className="w-4 h-4 rounded-full bg-[#FFF2EA] hover:bg-[#FA541C] text-[#FA541C] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                          title={`Remove ${skill}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 bg-[#FAF8F5] border border-[#ECE6DD] rounded-2xl text-xs text-[#9CA3AF]">
                    No skills added yet. Type below or click popular suggestions to add skills.
                  </div>
                )}

                {/* Add Custom Skill Input */}
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={newSkillInput}
                      onChange={(e) => setNewSkillInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddSkill();
                        }
                      }}
                      placeholder="Add a skill (e.g. Next.js, PyTorch, Docker) and press Enter"
                      className="w-full px-4 py-2.5 bg-white border border-[#E5E0D8] hover:border-[#CBD5E1] rounded-2xl text-xs sm:text-[13.5px] font-medium text-[#18181B] focus:outline-none focus:ring-2 focus:ring-[#FA541C]/20 focus:border-[#FA541C] shadow-2xs transition-all"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAddSkill()}
                    className="px-4 py-2.5 bg-gradient-to-r from-[#FA541C] to-[#E03A00] hover:from-[#FF6636] hover:to-[#D4380D] text-white text-xs font-bold rounded-2xl shadow-sm transition-all flex items-center gap-1 cursor-pointer flex-shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add</span>
                  </button>
                </div>

                {/* Suggested Popular Skills */}
                <div>
                  <span className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider block mb-2">
                    POPULAR STACKS:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {SUGGESTED_SKILLS.map((s) => {
                      const isAdded = skills.includes(s);
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => (!isAdded ? handleAddSkill(s) : handleRemoveSkill(s))}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer flex items-center gap-1 ${
                            isAdded
                              ? 'bg-[#FFE8D6] text-[#FA541C] border border-[#FA541C]/30'
                              : 'bg-white border border-[#E5E0D8] text-[#4B5563] hover:border-[#CBD5E1] hover:text-[#111827]'
                          }`}
                        >
                          {isAdded ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                          <span>{s}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ======================================================== */}
          {/* BOTTOM STICKY/SAVE CONTROLS (WHEN IN EDIT MODE)          */}
          {/* ======================================================== */}
          {isEditing && (
            <div className="sticky bottom-6 z-30 p-4 bg-white/95 backdrop-blur-md border border-[#E5E0D8] rounded-2xl shadow-xl flex items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-center space-x-2 text-xs text-[#6B7280]">
                <Sparkles className="w-4 h-4 text-[#FA541C]" />
                <span className="font-medium">You have unsaved changes in your profile</span>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={saving}
                  className="px-4 py-2 bg-white border border-[#D1D5DB] hover:bg-[#F9FAFB] text-[#4B5563] text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={() => handleSave()}
                  disabled={saving}
                  className="px-6 py-2.5 bg-gradient-to-r from-[#FA541C] via-[#FF6636] to-[#E03A00] hover:from-[#FF5722] hover:to-[#D4380D] text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-[#FA541C]/25 hover:shadow-xl hover:shadow-[#FA541C]/40 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save Profile Changes</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
