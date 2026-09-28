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
  Copy,
  Check,
  Trophy,
  ChevronDown,
  Package,
  X,
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
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Selected Member Details Modal
  const [selectedMember, setSelectedMember] = useState<{
    teamName: string;
    member: any;
  } | null>(null);

  useEffect(() => {
    async function loadHackathons() {
      try {
        const res = await fetch('/api/v1/hackathons');
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
      } else {
        setTeams([]);
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

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

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
    <div className="space-y-6 select-none max-w-[1400px] mx-auto pb-16 font-sans">
      {/* 1. HEADER & TOP ACTIONS */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FFF7ED] text-[#EA580C] border border-[#FED7AA]">
              Builder Arena
            </span>
            <span className="text-xs font-semibold text-[#64748B]">
              {teams.length} Formed Teams
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#0F172A] tracking-tight">
            Team Rosters &amp; Formation
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] font-normal max-w-xl">
            Track formed squads, team leaders, and submitted Team Member Form details across your assigned hackathons.
          </p>
        </div>

        {/* Right Side: Form Builder & Hackathon Selector */}
        <div className="flex flex-wrap items-center gap-3 self-start lg:self-center">
          {selectedHackathonId && (
            <Link
              href={`/organizer/hackathons/${selectedHackathonId}/team-form`}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-[#EA580C] bg-[#FFF7ED] border border-[#FED7AA] hover:bg-[#FFEDD5] rounded-xl shadow-xs transition-colors"
            >
              <FileText className="w-4 h-4 text-[#EA580C]" />
              <span>Team Form Builder</span>
            </Link>
          )}

          {hackathons.length > 0 && (
            <div className="relative">
              <div className="flex items-center space-x-2.5 px-4 py-2 bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] rounded-2xl shadow-xs transition-colors">
                <div className="w-7 h-7 rounded-lg bg-[#FFF7ED] text-[#EA580C] flex items-center justify-center flex-shrink-0">
                  <Trophy className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-[#64748B]">Hackathon:</span>
                <select
                  value={selectedHackathonId}
                  onChange={(e) => setSelectedHackathonId(e.target.value)}
                  className="appearance-none bg-transparent pr-6 text-xs sm:text-sm font-bold text-[#0F172A] focus:outline-none cursor-pointer max-w-[220px] truncate"
                >
                  {hackathons.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.title}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-[#64748B] absolute right-3 pointer-events-none" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. SEARCH INPUT */}
      <div className="relative w-full">
        <Search className="w-4 h-4 text-[#94A3B8] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          placeholder="Search team name, invite code, or member..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-[44px] pl-11 pr-4 bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] rounded-full text-xs sm:text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#EA580C]/20 shadow-xs placeholder:text-[#94A3B8]"
        />
      </div>

      {/* 3. TEAMS 2-COLUMN GRID */}
      {loading ? (
        <div className="py-24 text-center space-y-3 bg-white border border-[#E2E8F0] rounded-[24px]">
          <div className="w-8 h-8 border-3 border-orange-200 border-t-[#EA580C] rounded-full animate-spin mx-auto" />
          <p className="text-xs text-[#64748B] font-semibold">Loading team rosters...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-[#E2E8F0] rounded-[24px] p-12 text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-[#FFF7ED] text-[#EA580C] flex items-center justify-center mx-auto">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[#0F172A]">No Teams Found</h3>
          <p className="text-xs text-[#64748B] max-w-sm mx-auto">
            No squads match your search criteria. Teams will appear here as participants form squads and join invites.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filtered.map((t) => (
            <div
              key={t.id}
              className="bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] rounded-[20px] p-6 shadow-xs space-y-4 transition-all"
            >
              {/* Card Header */}
              <div className="flex items-start justify-between">
                <div className="space-y-1.5 border-l-4 border-[#EA580C] pl-3.5">
                  <h3 className="text-lg font-black text-[#0F172A] tracking-tight">{t.name}</h3>
                  <div className="flex items-center space-x-1.5">
                    <span className="font-mono text-xs text-[#EA580C] bg-[#FFF7ED] border border-[#FED7AA] px-2.5 py-0.5 rounded-md font-bold inline-flex items-center gap-1">
                      <span>Code : {t.inviteCode}</span>
                    </span>
                    <button
                      onClick={() => handleCopyCode(t.inviteCode)}
                      className="p-1 text-[#64748B] hover:text-[#EA580C] hover:bg-[#FFF7ED] rounded transition-colors"
                      title="Copy Invite Code"
                    >
                      {copiedCode === t.inviteCode ? (
                        <Check className="w-3.5 h-3.5 text-[#16A34A]" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">
                  <Users className="w-3.5 h-3.5" />
                  <span>
                    {t.members.length} {t.members.length === 1 ? 'Member' : 'Members'}
                  </span>
                </span>
              </div>

              {/* Roster & Form Responses Section */}
              <div className="space-y-2.5 pt-1">
                <span className="text-[10px] font-extrabold text-[#64748B] uppercase tracking-wider block">
                  ROSTER &amp; FORM RESPONSES
                </span>

                <div className="space-y-2">
                  {t.members.map((m) => {
                    const initial = m.user?.fullName ? m.user.fullName.charAt(0).toUpperCase() : 'U';
                    return (
                      <div
                        key={m.id}
                        className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#CBD5E1] rounded-xl flex items-center justify-between gap-3 transition-colors"
                      >
                        <div className="flex items-center space-x-3 truncate">
                          <div className="w-8 h-8 rounded-full bg-[#EFF6FF] text-[#2563EB] font-bold text-xs flex items-center justify-center flex-shrink-0 border border-[#BFDBFE]">
                            {initial}
                          </div>
                          <div className="truncate">
                            <span className="font-bold text-[#0F172A] text-xs sm:text-sm block truncate">
                              {m.user?.fullName}
                            </span>
                            <span className="text-[11px] text-[#64748B] truncate block">
                              {m.user?.email}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 flex-shrink-0">
                          {m.isLeader && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A] uppercase tracking-wider">
                              LEADER
                            </span>
                          )}

                          <button
                            onClick={() => setSelectedMember({ teamName: t.name, member: m })}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-[#EA580C] bg-[#FFF7ED] hover:bg-[#FFEDD5] border border-[#FED7AA] rounded-lg transition-colors shadow-xs"
                          >
                            <Eye className="w-3 h-3" />
                            <span>View Details</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Project Status */}
              <div className="pt-3 border-t border-[#F1F5F9] flex items-center text-xs text-[#64748B] gap-2">
                <Package className="w-4 h-4 text-[#94A3B8]" />
                {t.project ? (
                  <span className="font-medium text-[#0F172A]">
                    Project: <strong className="text-[#2563EB]">{t.project.title}</strong>
                  </span>
                ) : (
                  <span className="italic">No project submitted yet</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 4. MEMBER DETAILS MODAL */}
      {selectedMember && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2E8F0] rounded-[24px] max-w-lg w-full p-6 shadow-xl space-y-4 animate-in fade-in zoom-in duration-100">
            <div className="flex items-start justify-between pb-3 border-b border-[#F1F5F9]">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-[#EA580C] bg-[#FFF7ED] px-2 py-0.5 rounded-md border border-[#FED7AA]">
                    {selectedMember.teamName}
                  </span>
                  {selectedMember.member.isLeader && (
                    <span className="text-xs font-bold text-[#D97706] bg-[#FEF3C7] px-2 py-0.5 rounded-md border border-[#FDE68A]">
                      Team Leader
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-black text-[#0F172A] mt-1">
                  {selectedMember.member.user?.fullName}
                </h3>
                <p className="text-xs text-[#64748B]">
                  {selectedMember.member.user?.email}
                </p>
              </div>

              <button
                onClick={() => setSelectedMember(null)}
                className="p-1.5 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Response Fields */}
            <div className="space-y-3">
              <h4 className="text-xs font-extrabold text-[#0F172A] uppercase tracking-wider">
                Submitted Team Member Form Responses
              </h4>

              {selectedMember.member.formResponse &&
              Object.keys(selectedMember.member.formResponse).length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {Object.entries(selectedMember.member.formResponse).map(([key, val]) => (
                    <div key={key} className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs space-y-1">
                      <span className="text-[#64748B] font-bold block capitalize">
                        {key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')}
                      </span>
                      <span className="text-[#0F172A] font-medium block">
                        {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-center text-xs text-[#94A3B8]">
                  No custom team form responses recorded for this member.
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedMember(null)}
                className="px-4 py-2 bg-[#0F172A] hover:bg-[#1E293B] text-white rounded-xl text-xs font-bold transition-colors"
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
