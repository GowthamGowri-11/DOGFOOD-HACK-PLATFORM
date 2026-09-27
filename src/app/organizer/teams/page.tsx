'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  CheckCircle2,
  FolderKanban,
  FileCheck,
  ShieldCheck,
  Sparkles,
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
        setTeams(json.data.teams);
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
        t.members.some((m) => m.user.fullName.toLowerCase().includes(q) || m.user.email.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 select-none">
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
            Track squad compositions, team leaders, track alignment, and problem statement assignments.
          </p>
        </div>

        {hackathons.length > 0 && (
          <div className="flex items-center space-x-2">
            <label className="text-xs font-semibold text-[#334155]">Hackathon:</label>
            <select
              value={selectedHackathonId}
              onChange={(e) => setSelectedHackathonId(e.target.value)}
              className="px-3 py-2 bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] rounded-[11px] text-xs font-semibold text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
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

      {/* Search Bar */}
      <div className="relative w-full sm:w-80">
        <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          placeholder="Search team name, invite code, or member..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-[38px] pl-10 pr-4 bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] rounded-[19px] text-xs text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/15"
        />
      </div>

      {/* Teams Grid */}
      {loading ? (
        <div className="py-16 text-center text-xs text-[#64748B]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2563EB] mx-auto mb-2" />
          Loading team rosters...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-[#E2E8F0] rounded-[18px] p-12 text-center space-y-3 shadow-card">
          <div className="w-12 h-12 rounded-2xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center mx-auto">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[#111827]">No Teams Found</h3>
          <p className="text-xs text-[#64748B] max-w-sm mx-auto">
            No squads have formed yet for this hackathon. Participants will appear here as they form teams.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((t) => (
            <div
              key={t.id}
              className="bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] rounded-[18px] p-5 shadow-card space-y-4 transition-all text-xs"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-bold text-[#111827]">{t.name}</h3>
                  <span className="font-mono text-[11px] text-[#2563EB] bg-[#EFF6FF] px-2 py-0.5 rounded-md font-semibold mt-1 inline-block">
                    Code: {t.inviteCode}
                  </span>
                </div>
                <Badge variant={t.members.length >= 1 ? 'emerald' : 'amber'} size="sm">
                  {t.members.length} Member{t.members.length === 1 ? '' : 's'}
                </Badge>
              </div>

              {/* Members List */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">
                  Roster
                </span>
                <div className="flex flex-wrap gap-2">
                  {t.members.map((m) => (
                    <div
                      key={m.id}
                      className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg"
                    >
                      <span className="font-semibold text-[#111827]">{m.user.fullName}</span>
                      {m.isLeader && (
                        <span className="text-[9px] font-bold text-[#D97706] bg-[#FFFBEB] px-1 rounded">
                          LEADER
                        </span>
                      )}
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
                    <span className="text-[#94A3B8]">No project created yet</span>
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
    </div>
  );
}
