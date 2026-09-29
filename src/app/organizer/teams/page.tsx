'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Users,
  Search,
  CheckCircle2,
  AlertCircle,
  Trophy,
  ChevronDown,
  Eye,
  FileText,
  Copy,
  Check,
  Package,
  X,
  Layers,
  Sparkles,
  RotateCcw,
} from 'lucide-react';

interface MemberItem {
  id: string;
  userId: string;
  isLeader: boolean;
  user?: {
    id: string;
    fullName?: string | null;
    email: string;
  } | null;
  formResponse?: Record<string, any> | null;
}

interface TeamItem {
  id: string;
  name: string;
  inviteCode: string;
  leaderId: string;
  createdAt: string;
  members: MemberItem[];
  project?: {
    id: string;
    title: string;
    track?: { title: string };
    problemStatement?: { code: string; title: string };
  } | null;
}

const DEFAULT_DEMO_TEAMS: TeamItem[] = [
  {
    id: 'team_001',
    name: 'DeepMatrix',
    inviteCode: 'INV-DMAT-2294',
    leaderId: 'usr_001',
    createdAt: '2026-09-27T10:00:00.000Z',
    members: [
      {
        id: 'mem_001',
        userId: 'usr_001',
        isLeader: true,
        user: {
          id: 'usr_001',
          fullName: 'Rachel Green',
          email: 'rachel.green@deepmatrix.ai',
        },
        formResponse: {
          roleInTeam: 'Frontend & Smart Contracts',
          githubProfile: 'https://github.com/rachelgreen-ai',
          shirtSize: 'M',
        },
      },
    ],
    project: null,
  },
  {
    id: 'team_002',
    name: 'Nova Protocol',
    inviteCode: 'INV-NOVA-1102',
    leaderId: 'usr_002',
    createdAt: '2026-09-27T10:00:00.000Z',
    members: [
      {
        id: 'mem_002',
        userId: 'usr_002',
        isLeader: true,
        user: {
          id: 'usr_002',
          fullName: 'Daniel Kim',
          email: 'daniel.kim@novaprotocol.net',
        },
        formResponse: {
          roleInTeam: 'Systems Architect',
          githubProfile: 'https://github.com/danielkim-sec',
          shirtSize: 'L',
        },
      },
    ],
    project: null,
  },
  {
    id: 'team_003',
    name: 'Polaris Intelligence',
    inviteCode: 'INV-POLA-5591',
    leaderId: 'usr_003',
    createdAt: '2026-09-27T10:00:00.000Z',
    members: [
      {
        id: 'mem_003',
        userId: 'usr_003',
        isLeader: true,
        user: {
          id: 'usr_003',
          fullName: 'Zoe Katsaros',
          email: 'zoe.k@polaris-ml.dev',
        },
        formResponse: {
          roleInTeam: 'ML Research Lead',
          githubProfile: 'https://github.com/zkatsaros',
          shirtSize: 'S',
        },
      },
      {
        id: 'mem_004',
        userId: 'usr_004',
        isLeader: false,
        user: {
          id: 'usr_004',
          fullName: 'Noah Williams',
          email: 'noah.w@polaris-ml.dev',
        },
        formResponse: {
          roleInTeam: 'Backend Infrastructure',
          githubProfile: 'https://github.com/noahw-dev',
          shirtSize: 'XL',
        },
      },
      {
        id: 'mem_005',
        userId: 'usr_005',
        isLeader: false,
        user: {
          id: 'usr_005',
          fullName: 'Lucas Silva',
          email: 'lucas.silva@polaris-ml.dev',
        },
        formResponse: {
          roleInTeam: 'Full Stack & Eval Pipeline',
          githubProfile: 'https://github.com/lucassilva-ai',
          shirtSize: 'M',
        },
      },
    ],
    project: {
      id: 'proj_001',
      title: 'Polaris Real-Time Agent Guardrails',
    },
  },
  {
    id: 'team_004',
    name: 'Vanguard Core',
    inviteCode: 'INV-VANG-7740',
    leaderId: 'usr_006',
    createdAt: '2026-09-27T10:00:00.000Z',
    members: [
      {
        id: 'mem_006',
        userId: 'usr_006',
        isLeader: true,
        user: {
          id: 'usr_006',
          fullName: 'Benjamin Hayes',
          email: 'ben.hayes@vanguard-sec.io',
        },
        formResponse: {
          roleInTeam: 'Cryptographic Engineer',
          githubProfile: 'https://github.com/benhayes-sec',
          shirtSize: 'L',
        },
      },
      {
        id: 'mem_007',
        userId: 'usr_007',
        isLeader: false,
        user: {
          id: 'usr_007',
          fullName: 'Amara Okafor',
          email: 'amara.okafor@vanguard-sec.io',
        },
        formResponse: {
          roleInTeam: 'Distributed Consensus',
          githubProfile: 'https://github.com/amara-okafor',
          shirtSize: 'M',
        },
      },
    ],
    project: null,
  },
  {
    id: 'team_005',
    name: 'Synapse Labs',
    inviteCode: 'INV-SYNP-4421',
    leaderId: 'usr_008',
    createdAt: '2026-09-27T10:00:00.000Z',
    members: [
      {
        id: 'mem_008',
        userId: 'usr_008',
        isLeader: true,
        user: {
          id: 'usr_008',
          fullName: 'Alex Rivera',
          email: 'alex.rivera@synapselabs.tech',
        },
        formResponse: {
          roleInTeam: 'Autonomous Swarm Architect',
          githubProfile: 'https://github.com/alexrivera-ai',
          shirtSize: 'L',
        },
      },
      {
        id: 'mem_009',
        userId: 'usr_009',
        isLeader: false,
        user: {
          id: 'usr_009',
          fullName: 'Elena Rostova',
          email: 'elena.rostova@synapselabs.tech',
        },
        formResponse: {
          roleInTeam: 'Zero-Trust Security',
          githubProfile: 'https://github.com/erostova',
          shirtSize: 'S',
        },
      },
      {
        id: 'mem_010',
        userId: 'usr_010',
        isLeader: false,
        user: {
          id: 'usr_010',
          fullName: 'Kenji Sato',
          email: 'kenji.sato@synapselabs.tech',
        },
        formResponse: {
          roleInTeam: 'Full Stack & WebSockets',
          githubProfile: 'https://github.com/kenjisato',
          shirtSize: 'M',
        },
      },
    ],
    project: null,
  },
  {
    id: 'team_006',
    name: 'Aura Systems',
    inviteCode: 'INV-AURA-9021',
    leaderId: 'usr_011',
    createdAt: '2026-09-27T10:00:00.000Z',
    members: [
      {
        id: 'mem_011',
        userId: 'usr_011',
        isLeader: true,
        user: {
          id: 'usr_011',
          fullName: 'Sarah Jenkins',
          email: 'sarah.jenkins@enterprise-ai.io',
        },
        formResponse: {
          roleInTeam: 'High-Throughput RAG Lead',
          githubProfile: 'https://github.com/sjenkins-rag',
          shirtSize: 'M',
        },
      },
      {
        id: 'mem_012',
        userId: 'usr_012',
        isLeader: false,
        user: {
          id: 'usr_012',
          fullName: 'David Park',
          email: 'david.park@enterprise-ai.io',
        },
        formResponse: {
          roleInTeam: 'Vector Search Specialist',
          githubProfile: 'https://github.com/davidpark-vec',
          shirtSize: 'L',
        },
      },
      {
        id: 'mem_013',
        userId: 'usr_013',
        isLeader: false,
        user: {
          id: 'usr_013',
          fullName: 'Priya Patel',
          email: 'priya.patel@enterprise-ai.io',
        },
        formResponse: {
          roleInTeam: 'Frontend & UI Polish',
          githubProfile: 'https://github.com/priyapatel-ui',
          shirtSize: 'S',
        },
      },
      {
        id: 'mem_014',
        userId: 'usr_014',
        isLeader: false,
        user: {
          id: 'usr_014',
          fullName: 'Marcus Chen',
          email: 'marcus.chen@enterprise-ai.io',
        },
        formResponse: {
          roleInTeam: 'Backend & Data Ingestion',
          githubProfile: 'https://github.com/marcuschen-dev',
          shirtSize: 'XL',
        },
      },
    ],
    project: null,
  },
];

export default function OrganizerTeamsPage() {
  const [hackathons, setHackathons] = useState<any[]>([]);
  const [selectedHackathonId, setSelectedHackathonId] = useState<string>('hack_buildathon_2026');
  const [teams, setTeams] = useState<TeamItem[]>(DEFAULT_DEMO_TEAMS);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sizeFilter, setSizeFilter] = useState<'ALL' | 'FULL' | 'FORMING' | 'PROJECT'>('ALL');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Selected Member Details Modal
  const [selectedMember, setSelectedMember] = useState<{
    teamName: string;
    member: MemberItem;
  } | null>(null);

  useEffect(() => {
    async function loadHackathons() {
      try {
        const res = await fetch('/api/v1/hackathons');
        const json = await res.json();
        if (json.data?.hackathons && json.data.hackathons.length > 0) {
          setHackathons(json.data.hackathons);
          setSelectedHackathonId(json.data.hackathons[0].id);
        } else {
          setHackathons([
            { id: 'hack_buildathon_2026', title: 'Apex Enterprise Hackathon 2026' },
            { id: 'a1aa837b-592e-4dcf-a25f-dfa82195482c', title: 'Hacked by Judge' },
          ]);
        }
      } catch {
        setHackathons([
          { id: 'hack_buildathon_2026', title: 'Apex Enterprise Hackathon 2026' },
          { id: 'a1aa837b-592e-4dcf-a25f-dfa82195482c', title: 'Hacked by Judge' },
        ]);
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
      if (res.ok && json.data?.teams && json.data.teams.length > 0) {
        // Safe mapping to guarantee members is always an array
        const formattedTeams = json.data.teams.map((t: any) => ({
          ...t,
          members: Array.isArray(t.members) ? t.members : [],
        }));
        setTeams(formattedTeams);
      } else {
        setTeams(DEFAULT_DEMO_TEAMS);
      }
    } catch {
      setTeams(DEFAULT_DEMO_TEAMS);
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

  // Metrics
  const stats = useMemo(() => {
    const totalTeams = teams.length;
    const totalBuilders = teams.reduce((acc, t) => acc + (t.members?.length || 0), 0);
    const withProject = teams.filter((t) => Boolean(t.project)).length;
    return { totalTeams, totalBuilders, withProject };
  }, [teams]);

  const filtered = teams.filter((t) => {
    const memberList = t.members || [];
    if (sizeFilter === 'FULL' && memberList.length < 3) return false;
    if (sizeFilter === 'FORMING' && memberList.length >= 3) return false;
    if (sizeFilter === 'PROJECT' && !t.project) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = t.name?.toLowerCase().includes(q);
      const matchCode = t.inviteCode?.toLowerCase().includes(q);
      const matchMember = memberList.some(
        (m) =>
          m.user?.fullName?.toLowerCase().includes(q) ||
          m.user?.email?.toLowerCase().includes(q)
      );
      return matchName || matchCode || matchMember;
    }
    return true;
  });

  return (
    <div className="space-y-6 select-none max-w-7xl mx-auto pb-16 font-sans">
      {/* ================= 1. HEADER & TOP ACTIONS ================= */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-1">
        <div className="space-y-1.5">
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#FFF5ED] text-[#FA541C] border border-[#FED7AA]">
              Builder Arena
            </span>
            <span className="text-xs font-semibold text-slate-500">
              {stats.totalTeams} Formed Teams
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
            Team Rosters &amp; Formation
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-normal max-w-xl">
            Track formed squads, team leaders, and submitted Team Member Form details across your assigned hackathons.
          </p>
        </div>

        {/* Right Side: Form Builder & Hackathon Selector */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 self-start lg:self-center">
          {selectedHackathonId && (
            <Link
              href={`/organizer/hackathons/${selectedHackathonId}/team-form`}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-[#FA541C] bg-[#FFF5ED] border border-[#FED7AA] hover:bg-[#FED7AA]/40 rounded-xl shadow-xs transition-colors self-end sm:self-auto"
            >
              <FileText className="w-3.5 h-3.5 text-[#FA541C]" />
              <span>Team Form Builder</span>
            </Link>
          )}

          {hackathons.length > 0 && (
            <div className="flex items-center gap-2 bg-white border border-[#E5E0D8] hover:border-slate-300 rounded-2xl px-4 py-2 shadow-xs transition-colors">
              <span className="text-xs font-bold text-slate-500">Hackathon:</span>
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                <Trophy className="w-4 h-4 text-amber-500 flex-shrink-0" />
                <select
                  value={selectedHackathonId}
                  onChange={(e) => setSelectedHackathonId(e.target.value)}
                  aria-label="Select Hackathon"
                  className="bg-transparent border-none text-xs font-bold text-slate-900 focus:outline-none cursor-pointer pr-2 max-w-[220px] truncate"
                >
                  {hackathons.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ================= 2. STATS ROW ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-white border border-[#E5E0D8] rounded-2xl p-4 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Formed Squads
          </span>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{stats.totalTeams}</div>
          <span className="text-[11px] text-slate-400 font-medium">Active competing teams</span>
        </div>

        <div className="bg-white border border-[#E5E0D8] rounded-2xl p-4 shadow-2xs">
          <span className="text-[11px] font-bold text-[#FA541C] uppercase tracking-wider block">
            Builders in Teams
          </span>
          <div className="text-2xl font-extrabold text-[#FA541C] mt-1">{stats.totalBuilders}</div>
          <span className="text-[11px] text-slate-400 font-medium">Assigned to squads</span>
        </div>

        <div className="bg-white border border-[#E5E0D8] rounded-2xl p-4 shadow-2xs">
          <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block">
            Projects Linked
          </span>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{stats.withProject}</div>
          <span className="text-[11px] text-slate-400 font-medium">Submitted projects</span>
        </div>
      </div>

      {/* ================= 3. SEARCH & SIZE FILTER CONTROLS ================= */}
      <div className="bg-white border border-[#E5E0D8] rounded-2xl p-4 shadow-2xs flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search team name, invite code, or member..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-4 bg-[#FBF9F7] border border-[#E5E0D8] hover:border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FA541C]/20 focus:border-[#FA541C] shadow-2xs placeholder:text-slate-400 transition-all"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
          <button
            onClick={() => setSizeFilter('ALL')}
            className={`h-8 px-3 rounded-full text-xs font-bold transition-all shadow-2xs border ${
              sizeFilter === 'ALL'
                ? 'bg-[#FA541C] text-white border-[#FA541C]'
                : 'bg-white text-slate-700 border-[#E5E0D8] hover:bg-[#FBF9F7]'
            }`}
          >
            All Squads ({stats.totalTeams})
          </button>
          <button
            onClick={() => setSizeFilter('FULL')}
            className={`h-8 px-3 rounded-full text-xs font-bold transition-all shadow-2xs border ${
              sizeFilter === 'FULL'
                ? 'bg-[#FA541C] text-white border-[#FA541C]'
                : 'bg-white text-slate-700 border-[#E5E0D8] hover:bg-[#FBF9F7]'
            }`}
          >
            Full Teams (3+)
          </button>
          <button
            onClick={() => setSizeFilter('FORMING')}
            className={`h-8 px-3 rounded-full text-xs font-bold transition-all shadow-2xs border ${
              sizeFilter === 'FORMING'
                ? 'bg-[#FA541C] text-white border-[#FA541C]'
                : 'bg-white text-slate-700 border-[#E5E0D8] hover:bg-[#FBF9F7]'
            }`}
          >
            Forming (1-2)
          </button>
          <button
            onClick={() => setSizeFilter('PROJECT')}
            className={`h-8 px-3 rounded-full text-xs font-bold transition-all shadow-2xs border ${
              sizeFilter === 'PROJECT'
                ? 'bg-[#FA541C] text-white border-[#FA541C]'
                : 'bg-white text-slate-700 border-[#E5E0D8] hover:bg-[#FBF9F7]'
            }`}
          >
            With Project ({stats.withProject})
          </button>

          {(searchQuery || sizeFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSizeFilter('ALL');
              }}
              className="text-xs font-bold text-[#FA541C] hover:text-[#D94111] flex items-center gap-1 ml-2"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* ================= 4. TEAMS 2-COLUMN GRID ================= */}
      {loading ? (
        <div className="py-24 text-center space-y-3 bg-white border border-[#E5E0D8] rounded-2xl shadow-xs">
          <div className="w-8 h-8 border-2 border-orange-200 border-t-[#FA541C] rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-semibold">Loading team rosters...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-[#E5E0D8] rounded-2xl p-12 text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-[#FFF5ED] border border-[#FED7AA] text-[#FA541C] flex items-center justify-center mx-auto">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No Teams Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No squads match your search criteria. Teams will appear here as participants form squads and join invites.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filtered.map((t) => {
            const memberCount = (t.members || []).length;
            return (
              <div
                key={t.id}
                className="bg-white border border-[#E5E0D8] hover:border-slate-300 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4 transition-all border-l-4 border-l-[#FA541C]"
              >
                {/* Card Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1.5 min-w-0">
                    <h3 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight truncate">
                      {t.name}
                    </h3>
                    <div className="flex items-center space-x-1.5">
                      <span className="font-mono text-xs text-[#FA541C] bg-[#FFF5ED] border border-[#FED7AA] px-2.5 py-0.5 rounded-md font-bold inline-flex items-center gap-1.5 shadow-2xs">
                        <span>Code : {t.inviteCode}</span>
                        <button
                          onClick={() => handleCopyCode(t.inviteCode)}
                          className="text-slate-400 hover:text-[#FA541C] transition-colors ml-1 cursor-pointer"
                          title="Copy Invite Code"
                        >
                          {copiedCode === t.inviteCode ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </span>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] shadow-2xs flex-shrink-0">
                    <Users className="w-3.5 h-3.5" />
                    <span>
                      {memberCount} {memberCount === 1 ? 'Member' : 'Members'}
                    </span>
                  </span>
                </div>

                {/* Roster & Form Responses Section */}
                <div className="space-y-2.5 pt-1">
                  <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                    ROSTER &amp; FORM RESPONSES
                  </span>

                  <div className="space-y-2">
                    {(t.members || []).map((m) => {
                      const initial = m.user?.fullName
                        ? m.user.fullName.charAt(0).toUpperCase()
                        : m.user?.email
                        ? m.user.email.charAt(0).toUpperCase()
                        : 'U';

                      return (
                        <div
                          key={m.id}
                          className="p-3 bg-[#FBF9F7] border border-[#E5E0D8]/80 hover:border-[#E5E0D8] rounded-xl flex items-center justify-between gap-3 transition-colors shadow-2xs"
                        >
                          <div className="flex items-center space-x-3 truncate">
                            <div className="w-8 h-8 rounded-full bg-[#FFF5ED] text-[#FA541C] font-bold text-xs flex items-center justify-center flex-shrink-0 border border-[#FED7AA]">
                              {initial}
                            </div>
                            <div className="truncate">
                              <span className="font-bold text-slate-900 text-xs sm:text-sm block truncate leading-tight">
                                {m.user?.fullName || m.user?.email || 'Squad Member'}
                              </span>
                              <span className="text-[11px] text-slate-500 truncate block mt-0.5 font-normal">
                                {m.user?.email}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2 flex-shrink-0">
                            {m.isLeader && (
                              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A] uppercase tracking-wider">
                                LEADER
                              </span>
                            )}

                            <button
                              onClick={() => setSelectedMember({ teamName: t.name, member: m })}
                              className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold text-[#FA541C] bg-[#FFF5ED] hover:bg-[#FED7AA]/40 border border-[#FED7AA] rounded-full transition-colors shadow-2xs cursor-pointer"
                            >
                              <Eye className="w-3 h-3 text-[#FA541C]" />
                              <span>View Details</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Bottom Project Status */}
                <div className="pt-3 border-t border-[#E5E0D8]/60 flex items-center text-xs text-slate-500 gap-2">
                  <Package className="w-4 h-4 text-slate-400" />
                  {t.project ? (
                    <span className="font-medium text-slate-900">
                      Project: <strong className="text-[#2563EB]">{t.project.title}</strong>
                    </span>
                  ) : (
                    <span className="text-slate-400">No project submitted yet</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ================= 5. MEMBER DETAILS MODAL ================= */}
      {selectedMember && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-[#E5E0D8] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between pb-3 border-b border-[#E5E0D8]">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-[#FA541C] bg-[#FFF5ED] px-2.5 py-0.5 rounded-md border border-[#FED7AA]">
                    {selectedMember.teamName}
                  </span>
                  {selectedMember.member.isLeader && (
                    <span className="text-xs font-bold text-[#D97706] bg-[#FFFBEB] px-2.5 py-0.5 rounded-md border border-[#FDE68A]">
                      Team Leader
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-extrabold text-slate-900 mt-2">
                  {selectedMember.member.user?.fullName || 'Squad Member'}
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedMember.member.user?.email}
                </p>
              </div>

              <button
                onClick={() => setSelectedMember(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Response Fields */}
            <div className="space-y-3">
              <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                Submitted Team Member Form Responses
              </h4>

              {selectedMember.member.formResponse &&
              Object.keys(selectedMember.member.formResponse).length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {Object.entries(selectedMember.member.formResponse).map(([key, val]) => (
                    <div
                      key={key}
                      className="p-3 bg-[#FBF9F7] border border-[#E5E0D8] rounded-xl text-xs space-y-1"
                    >
                      <span className="text-slate-500 font-bold block capitalize text-[11px]">
                        {key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')}
                      </span>
                      <span className="text-slate-900 font-semibold block text-xs">
                        {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 bg-[#FBF9F7] border border-[#E5E0D8] rounded-xl text-center text-xs text-slate-400">
                  No custom team form responses recorded for this member.
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedMember(null)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
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
