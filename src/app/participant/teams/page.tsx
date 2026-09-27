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
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { TeamMemberFormField, TeamMemberFormConfig, DEFAULT_FORM_FIELDS } from '@/server/services/team-form.service';

export default function ParticipantTeamsPage() {
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
      const res = await fetch(`/api/v1/hackathons/${team.hackathon.id}/team-form`);
      const json = await res.json();
      if (res.ok && json.data?.form) {
        setActiveFormConfig(json.data.form);
        // Pre-fill default values
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
        // Fallback default form
        setActiveFormConfig({
          hackathonId: team.hackathon.id,
          title: 'Team Member Registration Form',
          description: 'Provide teammate information to add them immediately to your squad.',
          status: 'PUBLISHED',
          version: 1,
          fields: [...DEFAULT_FORM_FIELDS],
          updatedAt: new Date().toISOString(),
        });
      }
    } catch {
      setActiveFormConfig({
        hackathonId: team.hackathon.id,
        title: 'Team Member Registration Form',
        description: 'Provide teammate information to add them immediately to your squad.',
        status: 'PUBLISHED',
        version: 1,
        fields: [...DEFAULT_FORM_FIELDS],
        updatedAt: new Date().toISOString(),
      });
    }
  };

  // Submit Member Form
  const handleSubmitMemberForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTeamForMember) return;

    try {
      setSubmittingMember(true);
      setMemberFormError(null);

      const res = await fetch(`/api/v1/teams/${activeTeamForMember.id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formResponse: formResponseValues }),
      });

      const json = await res.json();
      if (!res.ok) {
        setMemberFormError(json.message || json.error?.message || 'Failed to add teammate');
        return;
      }

      showToast('success', 'Teammate added immediately to your squad roster!');
      setAddMemberModalOpen(false);
      setActiveTeamForMember(null);
      fetchData();
    } catch (err: any) {
      setMemberFormError(err.message || 'Network error submitting form');
    } finally {
      setSubmittingMember(false);
    }
  };

  const handleSendInvite = async (teamId: string) => {
    const email = inviteEmails[teamId]?.trim();
    if (!email) return;

    try {
      setInvitingTeamId(teamId);
      setMessage(null);

      const res = await fetch(`/api/v1/teams/${teamId}/invites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invitedEmail: email }),
      });

      const json = await res.json();
      if (!res.ok) {
        showToast('error', json.message || json.error?.message || 'Failed to send invite.');
        return;
      }

      showToast('success', `Invitation sent to ${email}!`);
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
    <div className="space-y-6 select-none max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="pb-6 border-b border-[#E2E8F0]">
        <div className="flex items-center space-x-2">
          <span className="text-[11px] font-bold text-[#2563EB] bg-[#EFF6FF] px-2.5 py-0.5 rounded-full border border-[#BFDBFE]">
            Team Management
          </span>
          <span className="text-[11px] font-semibold text-[#059669] bg-[#ECFDF5] px-2.5 py-0.5 rounded-full border border-[#A7F3D0] flex items-center">
            <ShieldCheck className="w-3 h-3 mr-1" /> Verified Rosters
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#111827] mt-1 tracking-tight">
          My Teams & Teammates
        </h1>
        <p className="text-xs sm:text-sm text-[#64748B] mt-0.5 font-normal">
          Create a team, fill the published Team Member Form to add teammates, or share invite links for instant onboarding.
        </p>
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

      {/* Quick Actions Grid: Create Team & Join Team */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Create Team Box */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] flex items-center justify-center flex-shrink-0">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#111827]">Create a New Team</h2>
              <p className="text-xs text-[#64748B]">
                Start a team for a registered event and immediately become the Team Leader.
              </p>
            </div>
          </div>

          <form onSubmit={handleCreateTeam} className="space-y-3 pt-1">
            <div>
              <label className="text-xs font-bold text-[#334155] block mb-1">
                Select Registered Hackathon
              </label>
              <select
                value={createTeamHackathonId}
                onChange={(e) => setCreateTeamHackathonId(e.target.value)}
                className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs font-medium text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              >
                {registeredHackathons.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-[#334155] block mb-1">
                Team Name
              </label>
              <input
                type="text"
                placeholder="e.g. ATLYX Pioneers"
                value={createTeamName}
                onChange={(e) => setCreateTeamName(e.target.value)}
                className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs font-medium text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              />
            </div>

            <Button
              variant="primary"
              size="md"
              type="submit"
              disabled={creatingTeam || !createTeamName.trim()}
              className="w-full font-bold"
            >
              {creatingTeam ? 'Creating Team...' : 'Create Team'}
            </Button>
          </form>
        </div>

        {/* Join Team by Code Box */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] text-[#16A34A] flex items-center justify-center flex-shrink-0">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#111827]">Join an Existing Team</h2>
              <p className="text-xs text-[#64748B]">
                Enter the invite code or join link provided by your Team Leader.
              </p>
            </div>
          </div>

          <form onSubmit={handleJoinTeam} className="space-y-3 pt-1">
            <div>
              <label className="text-xs font-bold text-[#334155] block mb-1">
                Team Invite Code
              </label>
              <input
                type="text"
                placeholder="e.g. TEAM-7X9K"
                value={joinInviteCode}
                onChange={(e) => setJoinInviteCode(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs font-mono uppercase tracking-wider text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              />
            </div>

            <div className="pt-7">
              <Button
                variant="secondary"
                size="md"
                type="submit"
                disabled={joiningTeam || !joinInviteCode.trim()}
                className="w-full font-bold"
              >
                {joiningTeam ? 'Joining Team...' : 'Join Team with Code'}
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Active Teams List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#111827]">My Active Teams</h2>
          <span className="text-xs text-[#64748B] font-semibold">{teams.length} Team{teams.length === 1 ? '' : 's'}</span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-xs text-[#64748B] bg-white border border-[#E2E8F0] rounded-2xl shadow-xs">
            <RefreshCw className="w-6 h-6 text-[#2563EB] animate-spin mx-auto mb-2" />
            Loading team rosters...
          </div>
        ) : teams.length === 0 ? (
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-12 text-center space-y-3 shadow-xs max-w-lg mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center mx-auto">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#111827]">No Teams Formed Yet</h3>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Create a team above or enter an invite code to start collaborating with your squad.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {teams.map((t) => {
              const maxCap = t.hackathon?.maxTeamSize || 4;
              const isFull = t.members.length >= maxCap;

              return (
                <div
                  key={t.id}
                  className="bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-7 shadow-xs space-y-6"
                >
                  {/* Team Header */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                      <div className="flex items-center space-x-2 text-xs text-[#64748B] mb-1">
                        <span>
                          Event: <strong className="text-[#334155]">{t.hackathon?.title}</strong>
                        </span>
                        <span>•</span>
                        <Badge variant={t.readiness?.isReady ? 'emerald' : 'amber'}>
                          {t.readiness?.statusLabel || 'ACTIVE'}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-xl font-bold text-[#111827]">{t.name}</h3>
                        {t.isLeader && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] flex items-center">
                            <Crown className="w-3 h-3 mr-1" /> Team Leader
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Invite Code & Share Controls */}
                    <div className="flex items-center space-x-2 flex-wrap gap-y-2">
                      <div className="flex items-center space-x-2 bg-[#F8FAFC] border border-[#E2E8F0] px-3.5 py-1.5 rounded-xl text-xs">
                        <span className="text-[#64748B] font-medium">Code:</span>
                        <code className="font-mono font-bold text-[#2563EB] text-xs">{t.inviteCode}</code>
                        <button
                          onClick={() => handleCopyCode(t.inviteCode)}
                          className="p-1 hover:bg-[#E2E8F0] rounded text-[#64748B] transition-colors"
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
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] rounded-xl text-xs font-semibold text-[#334155] transition-colors shadow-xs"
                        title="Copy direct invite link"
                      >
                        <Share2 className="w-3.5 h-3.5 text-[#64748B]" />
                        <span>{copiedLink === t.inviteCode ? 'Link Copied!' : 'Copy Link'}</span>
                      </button>

                      {/* WhatsApp Share */}
                      <a
                        href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                          `Join my hackathon team "${t.name}" on ATLYX with invite code: ${t.inviteCode}`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-[#F0FDF4] border border-[#BBF7D0] hover:bg-[#DCFCE7] text-[#16A34A] rounded-xl transition-colors shadow-xs"
                        title="Share on WhatsApp"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </a>
                    </div>
                  </div>

                  {/* Team Roster Grid */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-[#64748B] uppercase tracking-wider">
                        Squad Members ({t.members.length} / {maxCap} Capacity)
                      </h4>

                      {!isFull && t.isLeader && (
                        <button
                          type="button"
                          onClick={() => handleOpenAddMemberModal(t)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-xl shadow-xs transition-colors cursor-pointer"
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
                          className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between gap-2"
                        >
                          <div className="flex items-center space-x-2.5 truncate">
                            <div className="w-8 h-8 rounded-full bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center text-xs font-bold border border-[#DBEAFE] flex-shrink-0">
                              {m.user.fullName ? m.user.fullName[0].toUpperCase() : 'U'}
                            </div>
                            <div className="truncate">
                              <span className="block text-xs font-bold text-[#111827] truncate">
                                {m.user.fullName}
                              </span>
                              <span className="text-[10px] text-[#64748B] truncate block">
                                {m.user.email}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center space-x-1 flex-shrink-0">
                            {m.isLeader ? (
                              <span className="text-[9px] font-bold text-[#D97706] bg-[#FFFBEB] px-2 py-0.5 rounded-full border border-[#FDE68A]">
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
                                  className="p-1 text-[#DC2626] hover:bg-[#FEF2F2] rounded-lg transition-colors"
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
                    <div className="pt-4 border-t border-[#F1F5F9] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="text-xs text-[#64748B]">
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
                          className="px-3 py-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs font-medium text-[#111827] w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                        />
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleSendInvite(t.id)}
                          disabled={invitingTeamId === t.id || !inviteEmails[t.id]?.trim()}
                        >
                          {invitingTeamId === t.id ? 'Sending...' : 'Send Invite'}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Organizer-Defined Team Member Form Modal */}
      {addMemberModalOpen && activeTeamForMember && activeFormConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-[#E2E8F0] space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-[#F1F5F9]">
              <div>
                <span className="text-[10px] font-bold text-[#2563EB] uppercase tracking-wider block">
                  {activeTeamForMember.name} • SQUAD ONBOARDING
                </span>
                <h3 className="text-base font-extrabold text-[#0F172A]">
                  {activeFormConfig.title || 'Add Team Member'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setAddMemberModalOpen(false)}
                className="p-1 text-[#64748B] hover:text-[#0F172A] rounded-lg"
              >
                ✕
              </button>
            </div>

            {activeFormConfig.description && (
              <p className="text-xs text-[#64748B] bg-[#F8FAFC] p-3 rounded-xl border border-[#E2E8F0]">
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
                  <label className="text-xs font-bold text-[#334155] flex items-center justify-between">
                    <span>
                      {field.label} {field.required && <span className="text-[#DC2626]">*</span>}
                    </span>
                  </label>
                  {field.description && (
                    <p className="text-[10px] text-[#64748B]">{field.description}</p>
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
                      className="w-full px-3 py-2 text-xs bg-white border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#2563EB]"
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
                      className="w-full px-3 py-2 text-xs bg-white border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#2563EB] text-[#0F172A] font-semibold"
                    >
                      <option value="">{field.placeholder || `Select ${field.label}...`}</option>
                      {field.options?.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : field.type === 'RADIO' ? (
                    <div className="space-y-1.5 pt-1">
                      {field.options?.map((opt) => (
                        <label key={opt} className="flex items-center space-x-2 text-xs text-[#334155] cursor-pointer">
                          <input
                            type="radio"
                            name={field.id}
                            value={opt}
                            checked={formResponseValues[field.id] === opt}
                            onChange={(e) =>
                              setFormResponseValues({
                                ...formResponseValues,
                                [field.id]: e.target.value,
                              })
                            }
                            className="text-[#2563EB]"
                          />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <input
                      type={field.type === 'EMAIL' ? 'email' : field.type === 'NUMBER' ? 'number' : field.type === 'DATE' ? 'date' : 'text'}
                      required={field.required}
                      value={formResponseValues[field.id] || ''}
                      onChange={(e) =>
                        setFormResponseValues({
                          ...formResponseValues,
                          [field.id]: e.target.value,
                        })
                      }
                      placeholder={field.placeholder || `Enter ${field.label}...`}
                      className="w-full px-3 py-2 text-xs bg-white border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#2563EB] text-[#0F172A]"
                    />
                  )}
                </div>
              ))}

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-[#F1F5F9]">
                <button
                  type="button"
                  onClick={() => setAddMemberModalOpen(false)}
                  disabled={submittingMember}
                  className="px-4 py-2 text-xs font-semibold text-[#334155] bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingMember}
                  className="px-5 py-2 text-xs font-bold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-xl shadow-xs transition-colors flex items-center space-x-1.5 disabled:opacity-60 cursor-pointer"
                >
                  {submittingMember ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Adding Teammate...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Add Teammate</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Remove Member Confirmation Modal */}
      {removeModalOpen && memberToRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-[#E2E8F0] space-y-4">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#0F172A]">Remove Teammate</h3>
                <p className="text-xs text-[#64748B]">Remove this member from your team roster?</p>
              </div>
            </div>

            <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] text-xs">
              <span className="font-bold text-[#0F172A] block">{memberToRemove.member.user.fullName}</span>
              <span className="text-[#64748B] block">{memberToRemove.member.user.email}</span>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setRemoveModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-[#334155] bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRemoveMember}
                disabled={removingMember}
                className="px-4 py-2 text-xs font-bold text-white bg-[#DC2626] hover:bg-[#B91C1C] rounded-xl shadow-xs disabled:opacity-60"
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
