'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Users,
  Plus,
  UserPlus,
  Copy,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Mail,
  Share2,
  Trash2,
  Crown,
  KeyRound,
  ExternalLink,
  MessageCircle,
  FileText,
  Eye,
  RefreshCw,
  ArrowRight,
  ChevronDown,
  Sparkles,
  Link2,
  Check,
  UserCheck,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';

export type FormFieldType =
  | 'TEXT'
  | 'EMAIL'
  | 'PHONE'
  | 'NUMBER'
  | 'TEXTAREA'
  | 'SELECT'
  | 'MULTI_SELECT'
  | 'RADIO'
  | 'CHECKBOX'
  | 'DATE'
  | 'URL';

export interface TeamMemberFormField {
  id: string;
  type: FormFieldType;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  description?: string;
}

export interface TeamMemberFormConfig {
  title?: string;
  description?: string;
  fields: TeamMemberFormField[];
}

export default function ParticipantTeamsPage() {
  const { currentUser, isAuthenticated, openAuthModal } = useAuth();
  const [teams, setTeams] = useState<any[]>([]);
  const [pendingInvites, setPendingInvites] = useState<any[]>([]);
  const [registeredHackathons, setRegisteredHackathons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  // Form states
  const [createTeamHackathonId, setCreateTeamHackathonId] = useState('');
  const [createTeamName, setCreateTeamName] = useState('');
  const [creatingTeam, setCreatingTeam] = useState(false);

  const [joinInviteCode, setJoinInviteCode] = useState('');
  const [joiningTeam, setJoiningTeam] = useState(false);

  const [inviteEmails, setInviteEmails] = useState<{ [teamId: string]: string }>({});
  const [invitingTeamId, setInvitingTeamId] = useState<string | null>(null);

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Add Member Modal State (Organizer-defined form)
  const [addMemberModalOpen, setAddMemberModalOpen] = useState(false);
  const [activeTeamForMember, setActiveTeamForMember] = useState<any | null>(null);
  const [activeFormConfig, setActiveFormConfig] = useState<TeamMemberFormConfig | null>(null);
  const [formResponseValues, setFormResponseValues] = useState<Record<string, any>>({});
  const [submittingMember, setSubmittingMember] = useState(false);
  const [memberFormError, setMemberFormError] = useState<string | null>(null);

  // View Member Details Modal
  const [viewMemberModalOpen, setViewMemberModalOpen] = useState(false);
  const [selectedMemberDetails, setSelectedMemberDetails] = useState<any | null>(null);

  // Remove Member Modal State
  const [removeModalOpen, setRemoveModalOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<{ teamId: string; member: any } | null>(null);
  const [removingMember, setRemovingMember] = useState(false);

  const showToast = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4500);
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [teamsRes, hackathonsRes] = await Promise.all([
        fetch('/api/v1/participants/me/teams'),
        fetch('/api/v1/hackathons'),
      ]);

      const teamsJson = await teamsRes.json();
      const hackathonsJson = await hackathonsRes.json();

      if (teamsRes.ok && teamsJson.data) {
        setTeams(teamsJson.data.teams || []);
        setPendingInvites(teamsJson.data.pendingInvites || []);
      }

      if (hackathonsRes.ok && hackathonsJson.data) {
        const hList = hackathonsJson.data.hackathons || [];
        setRegisteredHackathons(hList);
        if (hList.length > 0 && !createTeamHackathonId) {
          setCreateTeamHackathonId(hList[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [createTeamHackathonId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleCopyLink = (code: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const shareableUrl = `${origin}/participant/teams?code=${code}`;
    navigator.clipboard.writeText(shareableUrl);
    setCopiedLink(code);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated || !currentUser) {
      openAuthModal({
        actionType: 'team',
        title: 'Sign In to Create a Team',
        reason: 'You need an active account to form teams and recruit builders.',
        redirectUrl: '/participant/teams',
      });
      return;
    }

    if (!createTeamHackathonId || !createTeamName.trim()) return;

    try {
      setCreatingTeam(true);
      setMessage(null);

      const res = await fetch(`/api/v1/hackathons/${createTeamHackathonId}/teams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: createTeamName.trim() }),
      });

      const json = await res.json();
      if (!res.ok) {
        showToast('error', json.message || json.error?.message || 'Failed to create team.');
        return;
      }

      showToast('success', `Team "${createTeamName.trim()}" formed immediately! You are the Team Leader.`);
      setCreateTeamName('');
      fetchData();
    } catch (err: any) {
      showToast('error', err.message || 'Error creating team');
    } finally {
      setCreatingTeam(false);
    }
  };

  const handleJoinTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated || !currentUser) {
      openAuthModal({
        actionType: 'team',
        title: 'Sign In to Join a Team',
        reason: 'You need an active account to join an existing hackathon squad.',
        redirectUrl: '/participant/teams',
      });
      return;
    }

    if (!joinInviteCode.trim()) return;

    try {
      setJoiningTeam(true);
      setMessage(null);

      const res = await fetch('/api/v1/teams/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteCode: joinInviteCode.trim() }),
      });

      const json = await res.json();
      if (!res.ok) {
        showToast('error', json.message || json.error?.message || 'Failed to join team.');
        return;
      }

      showToast('success', 'Successfully joined team! You are now part of the active roster.');
      setJoinInviteCode('');
      fetchData();
    } catch (err: any) {
      showToast('error', err.message || 'Error joining team');
    } finally {
      setJoiningTeam(false);
    }
  };

  // Open Organizer-defined Team Member Form Modal
  const handleOpenAddMemberModal = async (team: any) => {
    setActiveTeamForMember(team);
    setMemberFormError(null);
    setFormResponseValues({});
    setAddMemberModalOpen(true);

    try {
      const hackathonId = team.hackathonId || team.hackathon?.id;
      if (!hackathonId) return;
      const res = await fetch(`/api/v1/hackathons/${hackathonId}/team-form`);
      const json = await res.json();
      if (res.ok && json.data?.form) {
        setActiveFormConfig(json.data.form);
        const initialVals: Record<string, any> = {};
        json.data.form.fields.forEach((f: TeamMemberFormField) => {
          if (f.type === 'SELECT' && f.options && f.options.length > 0) {
            initialVals[f.id] = f.options[0];
          } else {
            initialVals[f.id] = '';
          }
        });
        setFormResponseValues(initialVals);
      } else {
        // Fallback default fields if no custom form configured
        setActiveFormConfig({
          title: 'Add Team Member',
          description: 'Provide teammate details to add them to your squad roster.',
          fields: [
            { id: 'fullName', type: 'TEXT', label: 'Full Name', required: true, placeholder: 'Jane Doe' },
            { id: 'email', type: 'EMAIL', label: 'Email Address', required: true, placeholder: 'jane@example.com' },
            { id: 'phone', type: 'PHONE', label: 'Phone Number', required: false, placeholder: '+1 555-0199' },
            { id: 'githubUrl', type: 'URL', label: 'GitHub Profile', required: false, placeholder: 'https://github.com/janedoe' },
            { id: 'roleDescription', type: 'TEXT', label: 'Role in Team', required: false, placeholder: 'Frontend Developer' },
          ],
        });
      }
    } catch (err) {
      console.error('Error fetching form config:', err);
    }
  };

  const handleSubmitMemberForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTeamForMember) return;

    try {
      setSubmittingMember(true);
      setMemberFormError(null);

      const res = await fetch(`/api/v1/teams/${activeTeamForMember.id}/members/form-submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formResponses: formResponseValues }),
      });

      const json = await res.json();
      if (!res.ok) {
        setMemberFormError(json.message || 'Failed to add member via form.');
        return;
      }

      showToast('success', `Teammate added successfully to "${activeTeamForMember.name}"!`);
      setAddMemberModalOpen(false);
      fetchData();
    } catch (err: any) {
      setMemberFormError(err.message || 'Network error submitting member form.');
    } finally {
      setSubmittingMember(false);
    }
  };

  const handleSendInvite = async (teamId: string) => {
    const email = inviteEmails[teamId]?.trim();
    if (!email) return;

    try {
      setInvitingTeamId(teamId);
      const res = await fetch(`/api/v1/teams/${teamId}/invites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const json = await res.json();
      if (!res.ok) {
        showToast('error', json.message || 'Failed to send invite.');
        return;
      }

      showToast('success', `Invite sent successfully to ${email}`);
      setInviteEmails({ ...inviteEmails, [teamId]: '' });
      fetchData();
    } catch (err: any) {
      showToast('error', err.message || 'Error sending invite');
    } finally {
      setInvitingTeamId(null);
    }
  };

  const handleConfirmRemoveMember = async () => {
    if (!memberToRemove) return;
    try {
      setRemovingMember(true);
      const res = await fetch(`/api/v1/teams/${memberToRemove.teamId}/members`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: memberToRemove.member.userId }),
      });
      const json = await res.json();
      if (!res.ok) {
        showToast('error', json.message || 'Failed to remove member');
      } else {
        showToast('success', json.message || 'Member removed successfully');
        setRemoveModalOpen(false);
        setMemberToRemove(null);
        fetchData();
      }
    } catch (err: any) {
      showToast('error', err.message || 'Error removing member');
    } finally {
      setRemovingMember(false);
    }
  };

  return (
    <div className="space-y-6 select-none max-w-[1440px] mx-auto pb-16">
      {/* ================= 1. HEADER ROW ================= */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-2 border-b border-[#E5E0D8]">
        <div>
          {/* Tag Badges */}
          <div className="flex items-center space-x-2 mb-2">
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#FFE8D6] text-[#FA541C] text-[11px] font-bold border border-[#FED7AA]/60">
              <Users className="w-3.5 h-3.5 text-[#FA541C]" />
              <span>Team Management</span>
            </span>
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#F3F4F6] text-[#4B5563] text-[11px] font-medium border border-[#E5E7EB]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#6B7280]" />
              <span>Verified Rosters</span>
            </span>
          </div>

          {/* Heading & Subtitle */}
          <h1 className="text-2xl sm:text-[34px] font-extrabold text-[#18181B] tracking-tight leading-tight">
            My Teams &amp; Teammates
          </h1>
          <p className="text-xs sm:text-[14px] text-[#6B7280] font-normal mt-1 leading-relaxed">
            Create a team, fill the published Team Member Form to add teammates, or share invite links for instant onboarding.
          </p>
        </div>

        {/* Top Right "Get Started ->" Button */}
        <div className="self-start sm:self-center">
          <Link
            href="/hackathons"
            className="group relative inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-[#FA541C] via-[#FF6636] to-[#E03A00] hover:from-[#FF5722] hover:via-[#FA541C] hover:to-[#D4380D] text-white text-xs sm:text-sm font-bold rounded-xl shadow-[0_4px_14px_rgba(250,84,28,0.30)] hover:shadow-[0_6px_22px_rgba(250,84,28,0.48)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-200 whitespace-nowrap cursor-pointer overflow-hidden flex-shrink-0"
          >
            {/* Ambient Shimmer / Sheen Sweep */}
            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out pointer-events-none" />
            <span className="relative z-10 font-bold tracking-wide">Get Started</span>
            <ArrowRight className="relative z-10 w-4 h-4 stroke-[2.5] group-hover:translate-x-1.5 transition-transform duration-200 flex-shrink-0" />
          </Link>
        </div>
      </div>

      {/* Alerts */}
      {message && (
        <div
          className={`p-4 rounded-xl text-xs font-medium flex items-center shadow-xs animate-in fade-in duration-200 ${
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
          <span>{message.text}</span>
        </div>
      )}

      {/* ================= 2. TWO ACTION CARDS ================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Create a New Team */}
        <div className="bg-gradient-to-br from-[#FFF9F5] via-[#FFF3EC] to-[#FFEFE4] border border-[#FED7AA]/70 rounded-2xl p-6 sm:p-7 shadow-xs hover:shadow-xl hover:border-[#FA541C]/40 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
          {/* Subtle Ambient Radial Glow */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-[#FA541C]/15 via-[#FA541C]/5 to-transparent rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform duration-500" />

          {/* Card Header */}
          <div className="flex items-center space-x-3.5 mb-5 relative z-10">
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#FA541C] to-[#E03A00] text-white flex items-center justify-center font-bold shadow-md shadow-[#FA541C]/25 flex-shrink-0 group-hover:scale-110 group-hover:rotate-90 transition-all duration-300">
              <Plus className="w-6 h-6 stroke-[3]" />
            </div>
            <div>
              <h2 className="text-base sm:text-[17px] font-extrabold text-[#18181B]">
                Create a New Team
              </h2>
              <p className="text-xs text-[#6B7280] mt-0.5">
                Start a team for a registered event and immediately become the Team Leader.
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleCreateTeam} className="space-y-4 relative z-10">
            <div>
              <label className="text-xs font-bold text-[#374151] block mb-1.5">
                Select Registered Hackathon
              </label>
              <div className="relative">
                <select
                  value={createTeamHackathonId}
                  onChange={(e) => setCreateTeamHackathonId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#E5E0D8] hover:border-[#CBD5E1] rounded-xl text-xs font-medium text-[#18181B] focus:outline-none focus:ring-2 focus:ring-[#FA541C]/20 focus:border-[#FA541C] shadow-2xs transition-all appearance-none cursor-pointer pr-10"
                >
                  {registeredHackathons.length === 0 ? (
                    <option value="">Choose a hackathon...</option>
                  ) : (
                    registeredHackathons.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.title}
                      </option>
                    ))
                  )}
                </select>
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-[#9CA3AF]">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-[#374151] block mb-1.5">
                Team Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#9CA3AF]">
                  <Users className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  placeholder="e.g. ATLYX Pioneers"
                  value={createTeamName}
                  onChange={(e) => setCreateTeamName(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-[#E5E0D8] hover:border-[#CBD5E1] rounded-xl text-xs font-medium text-[#18181B] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#FA541C]/20 focus:border-[#FA541C] shadow-2xs transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={creatingTeam || !createTeamName.trim()}
              className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#FA541C] to-[#E03A00] hover:from-[#EA4812] hover:to-[#C93300] shadow-md shadow-[#FA541C]/25 hover:shadow-lg hover:shadow-[#FA541C]/35 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none transition-all duration-200 flex items-center justify-center space-x-2 cursor-pointer group/btn mt-1"
            >
              <Users className="w-4 h-4 stroke-[2.2] group-hover/btn:scale-110 transition-transform" />
              <span>{creatingTeam ? 'Creating Team...' : 'Create Team'}</span>
            </button>
          </form>
        </div>

        {/* Card 2: Join an Existing Team */}
        <div className="bg-gradient-to-br from-[#FAFAFA] to-[#F5F5F7] border border-[#E5E0D8] rounded-2xl p-6 sm:p-7 shadow-xs hover:shadow-xl hover:border-[#CBD5E1] hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group flex flex-col justify-between">
          {/* Subtle Ambient Radial Glow */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-slate-200/50 via-slate-100/20 to-transparent rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform duration-500" />

          {/* Card Header */}
          <div>
            <div className="flex items-center space-x-3.5 mb-5 relative z-10">
              <div className="w-11 h-11 rounded-full bg-[#F3F4F6] text-[#374151] border border-[#E5E7EB] flex items-center justify-center font-bold flex-shrink-0 group-hover:scale-110 group-hover:-rotate-12 transition-all duration-300">
                <Link2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-[17px] font-extrabold text-[#18181B]">
                  Join an Existing Team
                </h2>
                <p className="text-xs text-[#6B7280] mt-0.5">
                  Enter the invite code or join link provided by your Team Leader.
                </p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleJoinTeam} className="space-y-4 relative z-10">
              <div>
                <label className="text-xs font-bold text-[#374151] block mb-1.5">
                  Team Invite Code
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#9CA3AF]">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. TEAM-7X9K"
                    value={joinInviteCode}
                    onChange={(e) => setJoinInviteCode(e.target.value.toUpperCase())}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-[#E5E0D8] hover:border-[#CBD5E1] rounded-xl text-xs font-mono uppercase tracking-wider text-[#18181B] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#18181B]/20 focus:border-[#18181B] shadow-2xs transition-all"
                  />
                </div>
              </div>

              <div className="pt-7">
                <button
                  type="submit"
                  disabled={joiningTeam || !joinInviteCode.trim()}
                  className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-[#18181B] hover:bg-[#27272A] shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none transition-all duration-200 flex items-center justify-center space-x-2 cursor-pointer group/join"
                >
                  <KeyRound className="w-4 h-4 stroke-[2.2] group-hover/join:scale-110 transition-transform" />
                  <span>{joiningTeam ? 'Joining Team...' : 'Join Team with Code'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* ================= 3. MY ACTIVE TEAMS SECTION ================= */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <span className="w-1.5 h-5 bg-[#FA541C] rounded-full inline-block" />
            <h2 className="text-base sm:text-[18px] font-extrabold text-[#18181B] tracking-tight">
              My Active Teams
            </h2>
          </div>
          <span className="text-xs font-bold text-[#9CA3AF]">
            {teams.length} Team{teams.length === 1 ? '' : 's'}
          </span>
        </div>

        {loading ? (
          <div className="py-20 text-center text-xs text-[#6B7280] bg-white border border-[#E5E0D8] rounded-2xl shadow-xs">
            <RefreshCw className="w-7 h-7 text-[#FA541C] animate-spin mx-auto mb-3" />
            <span className="font-semibold">Loading squad rosters...</span>
          </div>
        ) : teams.length === 0 ? (
          /* Empty State matching reference screenshot */
          <div className="bg-white/80 border border-[#E5E0D8] rounded-2xl p-12 sm:p-16 text-center shadow-xs flex flex-col items-center justify-center hover:border-[#FED7AA] hover:shadow-sm transition-all duration-300">
            {/* Trio Avatar Illustration */}
            <div className="mb-4">
              <div className="flex items-center justify-center -space-x-3">
                {/* Left peach avatar */}
                <div className="w-10 h-10 rounded-full bg-[#FFE8D6] border-2 border-white flex items-center justify-center opacity-85 shadow-xs">
                  <div className="w-4 h-4 rounded-full bg-[#FDBA74]" />
                </div>
                {/* Center orange avatar (elevated) */}
                <div className="w-13 h-13 rounded-full bg-gradient-to-br from-[#FA541C] to-[#E03A00] border-2 border-white flex items-center justify-center z-10 shadow-md shadow-[#FA541C]/25 p-2.5">
                  <Users className="w-6 h-6 text-white stroke-[2.4]" />
                </div>
                {/* Right peach avatar */}
                <div className="w-10 h-10 rounded-full bg-[#FFE8D6] border-2 border-white flex items-center justify-center opacity-85 shadow-xs">
                  <div className="w-4 h-4 rounded-full bg-[#FDBA74]" />
                </div>
              </div>
            </div>

            <h3 className="text-base sm:text-[17px] font-extrabold text-[#18181B] tracking-tight">
              No Teams Formed Yet
            </h3>
            <p className="text-xs text-[#6B7280] max-w-sm mx-auto leading-relaxed mt-1 font-normal">
              Create a team above or enter an invite code to start collaborating with your squad.
            </p>
          </div>
        ) : (
          /* Populated Teams Cards */
          <div className="space-y-6">
            {teams.map((t) => {
              const maxCap = t.hackathon?.maxTeamSize || 4;
              const isFull = t.members.length >= maxCap;

              return (
                <div
                  key={t.id}
                  className="bg-white border border-[#E5E0D8] hover:border-[#CBD5E1] rounded-2xl p-6 sm:p-7 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 space-y-6 group"
                >
                  {/* Team Header */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                      <div className="flex items-center space-x-2 text-xs text-[#6B7280] mb-1">
                        <span>
                          Event: <strong className="text-[#18181B]">{t.hackathon?.title}</strong>
                        </span>
                        <span>•</span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]/60">
                          {t.readiness?.statusLabel || 'ACTIVE'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2.5">
                        <h3 className="text-xl font-black text-[#18181B] group-hover:text-[#FA541C] transition-colors">
                          {t.name}
                        </h3>
                        {t.isLeader && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-[#FFE8D6] text-[#FA541C] border border-[#FED7AA] flex items-center">
                            <Crown className="w-3 h-3 mr-1 text-[#FA541C]" /> Team Leader
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Invite Code & Share Controls */}
                    <div className="flex items-center space-x-2 flex-wrap gap-y-2">
                      <div className="flex items-center space-x-2 bg-[#FAF8F5] border border-[#E5E0D8] px-3.5 py-1.5 rounded-xl text-xs">
                        <span className="text-[#6B7280] font-medium">Code:</span>
                        <code className="font-mono font-bold text-[#FA541C] text-xs">{t.inviteCode}</code>
                        <button
                          onClick={() => handleCopyCode(t.inviteCode)}
                          className="p-1 hover:bg-[#FFE8D6] rounded text-[#6B7280] hover:text-[#FA541C] transition-colors cursor-pointer"
                          title="Copy Invite Code"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        {copiedCode === t.inviteCode && (
                          <span className="text-[10px] text-[#059669] font-bold">Copied!</span>
                        )}
                      </div>

                      <button
                        onClick={() => handleCopyLink(t.inviteCode)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-[#E5E0D8] hover:border-[#FA541C]/50 hover:bg-[#FAF8F5] rounded-xl text-xs font-bold text-[#374151] hover:text-[#FA541C] transition-all shadow-2xs cursor-pointer"
                        title="Copy direct invite link"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>{copiedLink === t.inviteCode ? 'Link Copied!' : 'Copy Link'}</span>
                      </button>

                      {/* WhatsApp Share */}
                      <a
                        href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                          `Join my hackathon team "${t.name}" on ATLYX with invite code: ${t.inviteCode}`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-[#F0FDF4] border border-[#BBF7D0] hover:bg-[#DCFCE7] text-[#16A34A] rounded-xl transition-colors shadow-2xs"
                        title="Share on WhatsApp"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </a>
                    </div>
                  </div>

                  {/* Round Progression Notification Banner */}
                  {(t.progressionStatus === 'ADVANCED' || t.progressionStatus === 'ELIMINATED') && (
                    <div
                      className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                        t.progressionStatus === 'ADVANCED'
                          ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#065F46]'
                          : 'bg-[#FFFBEB] border-[#FDE68A] text-[#92400E]'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        {t.progressionStatus === 'ADVANCED' ? (
                          <div className="w-9 h-9 rounded-xl bg-[#D1FAE5] text-[#059669] border border-[#A7F3D0] flex items-center justify-center flex-shrink-0">
                            <CheckCircle2 className="w-5 h-5" />
                          </div>
                        ) : (
                          <div className="w-9 h-9 rounded-xl bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A] flex items-center justify-center flex-shrink-0">
                            <AlertCircle className="w-5 h-5" />
                          </div>
                        )}
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold">
                              {t.progressionStatus === 'ADVANCED'
                                ? `Your team has been selected for the next round of ${t.hackathon?.title || 'the hackathon'}.`
                                : `Your team was not selected for the next round of ${t.hackathon?.title || 'the hackathon'}.`}
                            </span>
                            <Badge variant={t.progressionStatus === 'ADVANCED' ? 'emerald' : 'amber'}>
                              {t.progressionStatus === 'ADVANCED' ? `ROUND ${t.highestRound} UNLOCKED` : 'NOT SELECTED'}
                            </Badge>
                          </div>
                          <span className="text-[11px] opacity-90 block mt-0.5">
                            {t.progressionStatus === 'ADVANCED'
                              ? 'Your team is eligible and can access all next round features and submission channels.'
                              : 'You can still view the published leaderboard. Historical submissions and scores remain saved.'}
                          </span>
                        </div>
                      </div>

                      {t.progressionStatus === 'ELIMINATED' && (
                        <Link href="/leaderboard">
                          <Button variant="secondary" size="sm" className="font-semibold text-xs whitespace-nowrap">
                            View Leaderboard →
                          </Button>
                        </Link>
                      )}
                    </div>
                  )}

                  {/* Team Roster Grid */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">
                        Squad Members ({t.members.length} / {maxCap} Capacity)
                      </h4>

                      {!isFull && t.isLeader && (
                        <button
                          type="button"
                          onClick={() => handleOpenAddMemberModal(t)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-[#FA541C] hover:bg-[#EA4812] hover:shadow-md hover:shadow-[#FA541C]/25 rounded-xl transition-all cursor-pointer hover:-translate-y-0.5 active:translate-y-0"
                        >
                          <UserPlus className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>+ Add Team Member</span>
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {t.members.map((m: any) => (
                        <div
                          key={m.id}
                          className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] hover:border-[#CBD5E1] flex items-center justify-between gap-2 transition-all shadow-2xs"
                        >
                          <div className="flex items-center space-x-2.5 truncate">
                            <div className="w-8 h-8 rounded-full bg-[#FFE8D6] text-[#FA541C] flex items-center justify-center text-xs font-bold border border-[#FED7AA] flex-shrink-0">
                              {m.user.fullName ? m.user.fullName[0].toUpperCase() : 'U'}
                            </div>
                            <div className="truncate">
                              <span className="block text-xs font-bold text-[#18181B] truncate">
                                {m.user.fullName}
                              </span>
                              <span className="text-[10px] text-[#6B7280] truncate block">
                                {m.user.email}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center space-x-1 flex-shrink-0">
                            {m.isLeader ? (
                              <span className="text-[9px] font-bold text-[#FA541C] bg-[#FFE8D6] px-2 py-0.5 rounded-full border border-[#FED7AA]">
                                Leader
                              </span>
                            ) : (
                              t.isLeader && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setMemberToRemove({ teamId: t.id, member: m });
                                    setRemoveModalOpen(true);
                                  }}
                                  className="p-1 text-[#DC2626] hover:bg-[#FEF2F2] rounded-lg transition-colors cursor-pointer"
                                  title="Remove Member"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Invite Teammate by Email Strip */}
                  {!isFull && t.isLeader && (
                    <div className="pt-4 border-t border-[#F4EFEA] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="text-xs text-[#6B7280]">
                        <span>Or send an email invitation token:</span>
                      </div>

                      <div className="flex items-center space-x-2 w-full sm:w-auto">
                        <input
                          type="email"
                          placeholder="teammate@example.com"
                          value={inviteEmails[t.id] || ''}
                          onChange={(e) =>
                            setInviteEmails({ ...inviteEmails, [t.id]: e.target.value })
                          }
                          className="px-3 py-1.5 bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl text-xs font-medium text-[#18181B] w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-[#FA541C]/20 focus:border-[#FA541C]"
                        />
                        <button
                          type="button"
                          onClick={() => handleSendInvite(t.id)}
                          disabled={invitingTeamId === t.id || !inviteEmails[t.id]?.trim()}
                          className="px-3 py-1.5 bg-white hover:bg-[#FAF8F5] border border-[#E5E0D8] hover:border-[#FA541C]/40 text-xs font-bold text-[#18181B] hover:text-[#FA541C] rounded-xl shadow-2xs transition-all disabled:opacity-50 cursor-pointer"
                        >
                          {invitingTeamId === t.id ? 'Sending...' : 'Send Invite'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ================= 4. MODALS ================= */}
      {/* Organizer-Defined Team Member Form Modal */}
      {addMemberModalOpen && activeTeamForMember && activeFormConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-[#E5E0D8] space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-[#F4EFEA]">
              <div>
                <span className="text-[10px] font-bold text-[#FA541C] uppercase tracking-wider block">
                  {activeTeamForMember.name} • SQUAD ONBOARDING
                </span>
                <h3 className="text-base font-extrabold text-[#18181B]">
                  {activeFormConfig.title || 'Add Team Member'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setAddMemberModalOpen(false)}
                className="p-1 text-[#6B7280] hover:text-[#18181B] rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {activeFormConfig.description && (
              <p className="text-xs text-[#6B7280] bg-[#FAF8F5] p-3 rounded-xl border border-[#E5E0D8]">
                {activeFormConfig.description}
              </p>
            )}

            {memberFormError && (
              <div className="p-3.5 bg-[#FEF2F2] border border-[#FECACA] rounded-xl text-xs text-[#DC2626] flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{memberFormError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitMemberForm} className="space-y-4 pt-1">
              {activeFormConfig.fields.map((field) => (
                <div key={field.id} className="space-y-1">
                  <label className="text-xs font-bold text-[#374151] flex items-center justify-between">
                    <span>
                      {field.label} {field.required && <span className="text-[#DC2626]">*</span>}
                    </span>
                  </label>
                  {field.description && (
                    <p className="text-[10px] text-[#6B7280]">{field.description}</p>
                  )}

                  {field.type === 'TEXTAREA' ? (
                    <textarea
                      rows={2}
                      required={field.required}
                      value={formResponseValues[field.id] || ''}
                      onChange={(e) =>
                        setFormResponseValues({
                          ...formResponseValues,
                          [field.id]: e.target.value,
                        })
                      }
                      placeholder={field.placeholder || `Enter ${field.label}...`}
                      className="w-full px-3 py-2 text-xs bg-white border border-[#E5E0D8] rounded-xl focus:outline-none focus:border-[#FA541C] focus:ring-2 focus:ring-[#FA541C]/20"
                    />
                  ) : field.type === 'SELECT' ? (
                    <select
                      required={field.required}
                      value={formResponseValues[field.id] || ''}
                      onChange={(e) =>
                        setFormResponseValues({
                          ...formResponseValues,
                          [field.id]: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 text-xs bg-white border border-[#E5E0D8] rounded-xl focus:outline-none focus:border-[#FA541C] focus:ring-2 focus:ring-[#FA541C]/20 text-[#18181B] font-semibold"
                    >
                      {field.options?.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={field.type === 'EMAIL' ? 'email' : field.type === 'PHONE' ? 'tel' : 'text'}
                      required={field.required}
                      value={formResponseValues[field.id] || ''}
                      onChange={(e) =>
                        setFormResponseValues({
                          ...formResponseValues,
                          [field.id]: e.target.value,
                        })
                      }
                      placeholder={field.placeholder || `Enter ${field.label}...`}
                      className="w-full px-3 py-2 text-xs bg-white border border-[#E5E0D8] rounded-xl focus:outline-none focus:border-[#FA541C] focus:ring-2 focus:ring-[#FA541C]/20"
                    />
                  )}
                </div>
              ))}

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setAddMemberModalOpen(false)}
                  className="px-4 py-2 border border-[#E5E0D8] rounded-xl text-xs font-bold text-[#6B7280] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingMember}
                  className="px-4 py-2 bg-gradient-to-r from-[#FA541C] to-[#E03A00] hover:from-[#EA4812] hover:to-[#C93300] text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  {submittingMember ? 'Adding Teammate...' : 'Submit & Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Remove Member Confirmation Modal */}
      {removeModalOpen && memberToRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-[#E5E0D8] space-y-4">
            <h3 className="text-base font-extrabold text-[#18181B]">Remove Member</h3>
            <p className="text-xs text-[#6B7280] leading-relaxed">
              Are you sure you want to remove{' '}
              <strong className="text-[#18181B]">
                {memberToRemove.member.user?.fullName || 'this member'}
              </strong>{' '}
              from the squad roster? They will forfeit access to team project submissions.
            </p>
            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setRemoveModalOpen(false)}
                className="px-4 py-2 border border-[#E5E0D8] rounded-xl text-xs font-bold text-[#6B7280] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRemoveMember}
                disabled={removingMember}
                className="px-4 py-2 bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-bold rounded-xl shadow-sm transition-colors cursor-pointer"
              >
                {removingMember ? 'Removing...' : 'Remove Member'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
