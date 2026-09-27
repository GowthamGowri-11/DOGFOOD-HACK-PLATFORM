'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  Search,
  CheckCircle2,
  FolderKanban,
  FileCheck,
  ShieldCheck,
  Sparkles,
  ExternalLink,
  Eye,
  Crown,
  FileText,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface TeamItem {
  id: string;
  name: string;
  inviteCode: string;
  leaderId: string;
  createdAt: string;
  members: {
    id: string;
    userId: string;
    isLeader: boolean;
    user: {
      id: string;
      fullName: string;
      email: string;
    };
    formResponse?: Record<string, any> | null;
  }[];
  project?: {
    id: string;
    title: string;
    track?: { title: string };
    problemStatement?: { code: string; title: string };
  } | null;
}

export default function OrganizerTeamsPage() {
  const [hackathons, setHackathons] = useState<any[]>([]);
  const [selectedHackathonId, setSelectedHackathonId] = useState<string>('');
  const [teams, setTeams] = useState<TeamItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Member Details Modal
  const [selectedMember, setSelectedMember] = useState<{
    teamName: string;
    member: any;
  } | null>(null);

  useEffect(() => {
    async function loadHackathons() {
      try {
        const res = await fetch('/api/v1/hackathons?mine=true');
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

  const fetchTeams = async (hId: string) => {
    if (!hId) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/v1/hackathons/${hId}/teams`);
      const json = await res.json();
      if (res.ok && json.data?.teams) {
        // Fetch detailed members with form responses for each team
        const teamsWithResponses = await Promise.all(
          json.data.teams.map(async (t: any) => {
            try {
              const memRes = await fetch(`/api/v1/teams/${t.id}/members`);
              const memJson = await memRes.json();
              if (memRes.ok && memJson.data?.members) {
                return { ...t, members: memJson.data.members };
              }
            } catch {
              // fallback
            }
            return t;
          })
        );
        setTeams(teamsWithResponses);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedHackathonId) {
      fetchTeams(selectedHackathonId);
    }
  }, [selectedHackathonId]);

  const filtered = teams.filter((t) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        t.name.toLowerCase().includes(q) ||
        t.inviteCode.toLowerCase().includes(q) ||
        t.members.some(
          (m) =>
            m.user?.fullName?.toLowerCase().includes(q) ||
            m.user?.email?.toLowerCase().includes(q)
        )
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 select-none max-w-7xl mx-auto pb-16">
      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#E2E8F0] gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-bold text-[#2563EB] bg-[#EFF6FF] px-2.5 py-0.5 rounded-full border border-[#BFDBFE]">
              Builder Arena
            </span>
            <span className="text-[11px] font-semibold text-[#64748B]">
              {teams.length} Formed Teams
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#111827] mt-1 tracking-tight">
            Team Rosters & Formation
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-0.5 font-normal">
            Track formed squads, team leaders, and submitted Team Member Form details across your assigned hackathons.
          </p>
        </div>

        <div className="flex items-center space-x-2.5 flex-wrap gap-y-2">
          {selectedHackathonId && (
            <Link
              href={`/organizer/hackathons/${selectedHackathonId}/team-form`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-[#2563EB] bg-[#EFF6FF] border border-[#BFDBFE] hover:bg-[#DBEAFE]/50 rounded-xl shadow-xs transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Team Form Builder</span>
            </Link>
          )}

          {hackathons.length > 0 && (
            <div className="flex items-center space-x-2">
              <label className="text-xs font-semibold text-[#334155]">Hackathon:</label>
              <select
                value={selectedHackathonId}
                onChange={(e) => setSelectedHackathonId(e.target.value)}
                className="px-3 py-2 bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] rounded-xl text-xs font-semibold text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              >
                {hackathons.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.title}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative w-full sm:w-80">
        <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          placeholder="Search team name, invite code, or member..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-[38px] pl-10 pr-4 bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] rounded-xl text-xs text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/15"
        />
      </div>

      {/* Teams Grid */}
      {loading ? (
        <div className="py-16 text-center text-xs text-[#64748B] bg-white border border-[#E2E8F0] rounded-2xl shadow-xs">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2563EB] mx-auto mb-2" />
          Loading team rosters...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-12 text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center mx-auto">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[#111827]">No Teams Found</h3>
          <p className="text-xs text-[#64748B] max-w-sm mx-auto">
            No squads have formed yet for this hackathon. Participants will appear here as they form teams and add members.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filtered.map((t) => (
            <div
              key={t.id}
              className="bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] rounded-2xl p-5 shadow-xs space-y-4 transition-all text-xs"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-bold text-[#111827]">{t.name}</h3>
                  <span className="font-mono text-[11px] text-[#2563EB] bg-[#EFF6FF] px-2 py-0.5 rounded-md font-semibold mt-1 inline-block border border-[#DBEAFE]">
                    Code: {t.inviteCode}
                  </span>
                </div>
                <Badge variant={t.members.length >= 1 ? 'emerald' : 'amber'} size="sm">
                  {t.members.length} Member{t.members.length === 1 ? '' : 's'}
                </Badge>
              </div>

              {/* Members List */}
              <div className="space-y-2 pt-1">
                <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">
                  Roster & Form Responses
                </span>
                <div className="space-y-2">
                  {t.members.map((m) => (
                    <div
                      key={m.id}
                      className="p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center space-x-2.5 truncate">
                        <div className="w-7 h-7 rounded-full bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center text-xs font-bold border border-[#DBEAFE] flex-shrink-0">
                          {m.user?.fullName ? m.user.fullName[0].toUpperCase() : 'U'}
                        </div>
                        <div className="truncate">
                          <span className="font-bold text-[#111827] text-xs block truncate">
                            {m.user?.fullName}
                          </span>
                          <span className="text-[10px] text-[#64748B] truncate block">
                            {m.user?.email}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 flex-shrink-0">
                        {m.isLeader && (
                          <span className="text-[9px] font-bold text-[#D97706] bg-[#FFFBEB] px-2 py-0.5 rounded-full border border-[#FDE68A]">
                            LEADER
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => setSelectedMember({ teamName: t.name, member: m })}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[11px] font-semibold text-[#2563EB] rounded-lg shadow-xs transition-colors"
                          title="View submitted form answers"
                        >
                          <Eye className="w-3 h-3" />
                          <span>View Details</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Project & Track Attachment */}
              <div className="pt-2 border-t border-[#F1F5F9] flex items-center justify-between text-[#64748B]">
                <div className="truncate">
                  {t.project ? (
                    <span className="text-[#334155]">
                      Project: <strong className="text-[#111827]">{t.project.title}</strong>
                    </span>
                  ) : (
                    <span className="text-[#94A3B8]">No project submitted yet</span>
                  )}
                </div>
                {t.project?.track && (
                  <Badge variant="purple" size="sm">
                    {t.project.track.title}
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Member Form Details Modal */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#E2E8F0] space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#F1F5F9]">
              <div>
                <span className="text-[10px] font-bold text-[#2563EB] uppercase tracking-wider block">
                  {selectedMember.teamName} • TEAM MEMBER DETAILS
                </span>
                <h3 className="text-base font-extrabold text-[#0F172A]">
                  {selectedMember.member.user?.fullName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMember(null)}
                className="p-1 text-[#64748B] hover:text-[#0F172A] rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] font-bold text-[#64748B] uppercase block">Email</span>
                  <span className="font-semibold text-[#0F172A] break-all">{selectedMember.member.user?.email}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#64748B] uppercase block">Role</span>
                  <span className="font-semibold text-[#2563EB]">
                    {selectedMember.member.isLeader ? 'Team Leader' : 'Team Member'}
                  </span>
                </div>
              </div>

              {selectedMember.member.formResponse && Object.keys(selectedMember.member.formResponse).length > 0 ? (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">
                    Form Submissions
                  </span>
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {Object.entries(selectedMember.member.formResponse).map(([key, val]) => (
                      <div key={key} className="p-2.5 bg-white border border-[#E2E8F0] rounded-xl">
                        <span className="text-[10px] font-bold text-[#64748B] uppercase block">
                          {key.replace(/^field_/, '').replace(/_/g, ' ')}
                        </span>
                        <span className="text-xs font-semibold text-[#0F172A] break-all">
                          {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-4 text-center bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[#64748B] text-xs">
                  Standard account onboarding (No custom questionnaire answers attached)
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-[#F1F5F9]">
              <button
                type="button"
                onClick={() => setSelectedMember(null)}
                className="px-4 py-2 text-xs font-semibold text-[#334155] bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
