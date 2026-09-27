'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  Plus,
  UserPlus,
  Copy,
  CheckCircle2,
  AlertCircle,
  Shield,
  ShieldCheck,
  Mail,
  ArrowRight,
  ExternalLink,
  Crown,
  KeyRound,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export default function ParticipantTeamsPage() {
  const [teams, setTeams] = useState<any[]>([]);
  const [pendingInvites, setPendingInvites] = useState<any[]>([]);
  const [registeredHackathons, setRegisteredHackathons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Form states
  const [createTeamHackathonId, setCreateTeamHackathonId] = useState('');
  const [createTeamName, setCreateTeamName] = useState('');
  const [creatingTeam, setCreatingTeam] = useState(false);

  const [joinInviteCode, setJoinInviteCode] = useState('');
  const [joiningTeam, setJoiningTeam] = useState(false);

  const [inviteEmails, setInviteEmails] = useState<{ [teamId: string]: string }>({});
  const [invitingTeamId, setInvitingTeamId] = useState<string | null>(null);

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchData = async () => {
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
        setRegisteredHackathons(hackathonsJson.data.hackathons || []);
        if (hackathonsJson.data.hackathons.length > 0 && !createTeamHackathonId) {
          setCreateTeamHackathonId(hackathonsJson.data.hackathons[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
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
        setMessage({ type: 'error', text: json.message || json.error?.message || 'Failed to create team.' });
        return;
      }

      setMessage({ type: 'success', text: `Team "${createTeamName.trim()}" created successfully!` });
      setCreateTeamName('');
      fetchData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error creating team' });
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
        setMessage({ type: 'error', text: json.message || json.error?.message || 'Failed to join team.' });
        return;
      }

      setMessage({ type: 'success', text: 'Successfully joined team!' });
      setJoinInviteCode('');
      fetchData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error joining team' });
    } finally {
      setJoiningTeam(false);
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
        setMessage({ type: 'error', text: json.message || json.error?.message || 'Failed to send invite.' });
        return;
      }

      setMessage({ type: 'success', text: `Invitation sent to ${email}!` });
      setInviteEmails({ ...inviteEmails, [teamId]: '' });
      fetchData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error sending invite' });
    } finally {
      setInvitingTeamId(null);
    }
  };

  const handleAcceptInvite = async (token: string) => {
    try {
      setMessage(null);
      const res = await fetch(`/api/v1/invites/${token}`, {
        method: 'POST',
      });
      const json = await res.json();
      if (!res.ok) {
        setMessage({ type: 'error', text: json.message || json.error?.message || 'Failed to accept invitation.' });
        return;
      }

      setMessage({ type: 'success', text: 'Invitation accepted! You have joined the team.' });
      fetchData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error accepting invitation' });
    }
  };

  return (
    <div className="space-y-6 select-none">
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
          Create a team, manage roster bounds, invite teammates, or join an existing crew with an invite code.
        </p>
      </div>

      {/* Alerts */}
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

      {/* Pending Invitations Received */}
      {pendingInvites.length > 0 && (
        <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-[18px] p-6 shadow-card space-y-4">
          <div className="flex items-center space-x-2">
            <Mail className="w-5 h-5 text-[#2563EB]" />
            <h2 className="text-base font-bold text-[#1E40AF]">Pending Invitations Received</h2>
          </div>

          <div className="space-y-3">
            {pendingInvites.map((inv) => (
              <div
                key={inv.id}
                className="bg-white border border-[#BFDBFE] rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
              >
                <div>
                  <span className="text-sm font-bold text-[#111827] block">
                    Team {inv.team.name}
                  </span>
                  <span className="text-xs text-[#64748B]">
                    Hackathon: <strong>{inv.team.hackathon.title}</strong> • Invited by {inv.invitedBy.fullName}
                  </span>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleAcceptInvite(inv.token)}
                >
                  Accept Invitation
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions Grid: Create Team & Join Team */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Create Team Box */}
        <div className="bg-white border border-[#E2E8F0] rounded-[18px] p-6 shadow-card space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] flex items-center justify-center flex-shrink-0">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#111827]">Create a New Team</h2>
              <p className="text-xs text-[#64748B]">
                Start a team for a registered event and become the Team Leader.
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
                className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[11px] text-xs font-medium text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
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
                placeholder="e.g. Apex Pioneers"
                value={createTeamName}
                onChange={(e) => setCreateTeamName(e.target.value)}
                className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[11px] text-xs font-medium text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              />
            </div>

            <Button
              variant="primary"
              size="md"
              type="submit"
              disabled={creatingTeam || !createTeamName.trim()}
              className="w-full"
            >
              {creatingTeam ? 'Creating Team...' : 'Create Team'}
            </Button>
          </form>
        </div>

        {/* Join Team by Code Box */}
        <div className="bg-white border border-[#E2E8F0] rounded-[18px] p-6 shadow-card space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] text-[#16A34A] flex items-center justify-center flex-shrink-0">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#111827]">Join an Existing Team</h2>
              <p className="text-xs text-[#64748B]">
                Enter the secret invite code provided by your Team Leader.
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
                className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[11px] text-xs font-mono uppercase tracking-wider text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              />
            </div>

            <div className="pt-7">
              <Button
                variant="secondary"
                size="md"
                type="submit"
                disabled={joiningTeam || !joinInviteCode.trim()}
                className="w-full"
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
          <span className="text-xs text-[#64748B]">{teams.length} Teams</span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-xs text-[#64748B]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2563EB] mx-auto mb-2" />
            Loading your teams...
          </div>
        ) : teams.length === 0 ? (
          <div className="bg-white border border-[#E2E8F0] rounded-[18px] p-12 text-center space-y-3 shadow-card max-w-lg mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center mx-auto">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#111827]">You Have Not Joined Any Teams Yet</h3>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Create a team above or enter an invite code to collaborate on competition deliverables.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {teams.map((t) => (
              <div
                key={t.id}
                className="bg-white border border-[#E2E8F0] rounded-[18px] p-6 sm:p-7 shadow-card space-y-6"
              >
                {/* Team Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <div className="flex items-center space-x-2 text-xs text-[#64748B] mb-1">
                      <span>Event: <strong className="text-[#334155]">{t.hackathon.title}</strong></span>
                      <span>•</span>
                      <Badge
                        variant={t.readiness?.isReady ? 'emerald' : 'amber'}
                      >
                        {t.readiness?.statusLabel || 'ACTIVE'}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-xl font-bold text-[#111827]">{t.name}</h3>
                      {t.isLeader && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] flex items-center">
                          <Crown className="w-3 h-3 mr-1" /> Leader
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Invite Code Box */}
                  <div className="flex items-center space-x-2 bg-[#F8FAFC] border border-[#E2E8F0] px-3.5 py-2 rounded-xl text-xs">
                    <span className="text-[#64748B] font-medium">Invite Code:</span>
                    <code className="font-mono font-bold text-[#2563EB] text-sm">{t.inviteCode}</code>
                    <button
                      onClick={() => handleCopyCode(t.inviteCode)}
                      className="p-1 hover:bg-[#E2E8F0] rounded transition-colors text-[#64748B]"
                      title="Copy Invite Code"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    {copiedCode === t.inviteCode && (
                      <span className="text-[10px] text-[#059669] font-bold">Copied!</span>
                    )}
                  </div>
                </div>

                {/* Team Roster Grid */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-[#64748B] uppercase tracking-wider">
                    Team Members ({t.members.length} / {t.hackathon.maxTeamSize} Capacity)
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {t.members.map((m: any) => (
                      <div
                        key={m.id}
                        className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-2.5 truncate">
                          <div className="w-7 h-7 rounded-full bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {m.user.fullName[0]}
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

                        {m.isLeader && (
                          <span className="text-[10px] font-bold text-[#D97706] bg-[#FFFBEB] px-1.5 py-0.5 rounded border border-[#FDE68A] flex-shrink-0">
                            Leader
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Invite Teammate Strip (if leader and capacity allows) */}
                {t.readiness?.canAcceptMore && (
                  <div className="pt-4 border-t border-[#F1F5F9] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="text-xs text-[#64748B]">
                      <span>Invite a teammate by email:</span>
                    </div>

                    <div className="flex items-center space-x-2 w-full sm:w-auto">
                      <input
                        type="email"
                        placeholder="teammate@example.com"
                        value={inviteEmails[t.id] || ''}
                        onChange={(e) =>
                          setInviteEmails({ ...inviteEmails, [t.id]: e.target.value })
                        }
                        className="px-3 py-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[9px] text-xs font-medium text-[#111827] w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
