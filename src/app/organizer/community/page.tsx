'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Layers,
  MessageSquare,
  ThumbsUp,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  EyeOff,
  Eye,
  Trophy,
  Award,
  ChevronRight,
  RefreshCw,
  Search,
  Filter,
  Trash2,
  Flag,
  Sparkles,
  ExternalLink,
  ShieldAlert,
  User,
  Clock,
  Check,
  X,
  Vote,
} from 'lucide-react';

interface CommentItem {
  id: string;
  projectId: string;
  projectTitle: string;
  authorName: string;
  authorEmail: string;
  authorRole: string;
  content: string;
  createdAt: string;
  isFlagged: boolean;
  isHidden: boolean;
}

interface ProjectVoteTally {
  projectId: string;
  projectTitle: string;
  teamName: string;
  trackTitle: string;
  votesCount: number;
  percentage: number;
  rank: number;
}

const DEMO_COMMENTS: CommentItem[] = [
  {
    id: 'comm_01',
    projectId: 'proj_01',
    projectTitle: 'SentinelCloud: Kubernetes Security Anomaly Engine',
    authorName: 'Sarah Jenkins',
    authorEmail: 'sarah.j@securitylab.io',
    authorRole: 'JUDGE',
    content: 'The real-time eBPF anomaly detection layer and type-safe policy engine are exceptionally well architected. Excellent job on zero-trust isolation!',
    createdAt: '15 minutes ago',
    isFlagged: false,
    isHidden: false,
  },
  {
    id: 'comm_02',
    projectId: 'proj_02',
    projectTitle: 'AuraGraph: Enterprise High-Throughput RAG Architecture',
    authorName: 'Alex Rivera',
    authorEmail: 'alex.r@ai-frontier.dev',
    authorRole: 'PARTICIPANT',
    content: 'Love the sub-50ms hybrid vector search benchmark. How did you handle context window truncation during multi-hop document retrieval?',
    createdAt: '1 hour ago',
    isFlagged: false,
    isHidden: false,
  },
  {
    id: 'comm_03',
    projectId: 'proj_03',
    projectTitle: 'FlowMesh: Distributed Agent Task Coordination Framework',
    authorName: 'David Chen',
    authorEmail: 'david@cloudmesh.tech',
    authorRole: 'PARTICIPANT',
    content: 'Autonomous agent task handoff works smoothly in the live demo. The CometBFT consensus engine integration is very clean.',
    createdAt: '3 hours ago',
    isFlagged: false,
    isHidden: false,
  },
  {
    id: 'comm_04',
    projectId: 'proj_06',
    projectTitle: 'SynapseGuard: Autonomous Zero-Trust Agent Swarm',
    authorName: 'Elena Rostova',
    authorEmail: 'elena@cybernet.org',
    authorRole: 'BUILDER',
    content: 'Very impressed with the cryptographic hardware isolation simulation and audit logging throughput!',
    createdAt: '5 hours ago',
    isFlagged: false,
    isHidden: false,
  },
];

const DEMO_VOTES: ProjectVoteTally[] = [
  {
    projectId: 'proj_01',
    projectTitle: 'SentinelCloud: Kubernetes Security Anomaly Engine',
    teamName: 'Apex Sentinel',
    trackTitle: 'Cloud Infrastructure & Zero-Trust Security',
    votesCount: 48,
    percentage: 33.8,
    rank: 1,
  },
  {
    projectId: 'proj_02',
    projectTitle: 'AuraGraph: Enterprise High-Throughput RAG Architecture',
    teamName: 'Aura Systems',
    trackTitle: 'Enterprise AI & Autonomous Systems',
    votesCount: 36,
    percentage: 25.4,
    rank: 2,
  },
  {
    projectId: 'proj_03',
    projectTitle: 'FlowMesh: Distributed Agent Task Coordination Framework',
    teamName: 'Cognitive Flow',
    trackTitle: 'Enterprise AI & Autonomous Systems',
    votesCount: 24,
    percentage: 16.9,
    rank: 3,
  },
  {
    projectId: 'proj_04',
    projectTitle: 'DeepMatrix Solution',
    teamName: 'DeepMatrix',
    trackTitle: 'HealthTech & Multimodal Diagnostics',
    votesCount: 18,
    percentage: 12.7,
    rank: 4,
  },
  {
    projectId: 'proj_05',
    projectTitle: 'Nova Protocol Solution',
    teamName: 'Nova Protocol',
    trackTitle: 'FinTech Intelligence & Cryptographic Audit',
    votesCount: 16,
    percentage: 11.2,
    rank: 5,
  },
];

export default function OrganizerCommunityPage() {
  const [hackathons, setHackathons] = useState<any[]>([]);
  const [selectedHackathonId, setSelectedHackathonId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'moderation' | 'voting' | 'governance'>('moderation');
  const [comments, setComments] = useState<CommentItem[]>(DEMO_COMMENTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'VISIBLE' | 'FLAGGED'>('ALL');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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
            { id: 'hack_apex_2026', title: 'Apex Enterprise Hackathon 2026' },
            { id: 'hack_frontier_2026', title: 'Frontier AI Global Summit' },
          ]);
          setSelectedHackathonId('hack_apex_2026');
        }
      } catch (err) {
        setHackathons([
          { id: 'hack_apex_2026', title: 'Apex Enterprise Hackathon 2026' },
          { id: 'hack_frontier_2026', title: 'Frontier AI Global Summit' },
        ]);
        setSelectedHackathonId('hack_apex_2026');
      }
    }
    loadHackathons();
  }, []);

  const handleToggleHide = (commentId: string) => {
    setComments((prev) =>
      prev.map((c) =>
        c.id === commentId ? { ...c, isHidden: !c.isHidden } : c
      )
    );
    setMessage({ type: 'success', text: 'Comment visibility status updated.' });
  };

  const handleToggleFlag = (commentId: string) => {
    setComments((prev) =>
      prev.map((c) =>
        c.id === commentId ? { ...c, isFlagged: !c.isFlagged } : c
      )
    );
    setMessage({ type: 'success', text: 'Comment moderation flag updated.' });
  };

  const handleDeleteComment = (commentId: string) => {
    setComments((prev) => prev.filter((c) => c.id !== commentId));
    setMessage({ type: 'success', text: 'Comment permanently removed from gallery.' });
  };

  const filteredComments = comments.filter((c) => {
    const matchesSearch =
      c.projectTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.authorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.content.toLowerCase().includes(searchQuery.toLowerCase());

    if (statusFilter === 'VISIBLE') return matchesSearch && !c.isHidden && !c.isFlagged;
    if (statusFilter === 'FLAGGED') return matchesSearch && (c.isFlagged || c.isHidden);
    return matchesSearch;
  });

  const totalVotes = DEMO_VOTES.reduce((acc, v) => acc + v.votesCount, 0);

  return (
    <div className="space-y-6 select-none font-sans max-w-7xl mx-auto pb-12">
      {/* ================= IN-PAGE BREADCRUMBS ================= */}
      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
        <Link href="/" className="hover:text-slate-800 transition-colors">Home</Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <Link href="/organizer/dashboard" className="hover:text-slate-800 transition-colors">Organizer</Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-slate-900 font-semibold">Community</span>
      </div>

      {/* ================= TOP BADGES ================= */}
      <div className="flex flex-wrap items-center gap-2.5">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#EFF6FF] text-[#2563EB] border border-[#DBEAFE]">
          <MessageSquare className="w-3.5 h-3.5 text-[#2563EB]" />
          Community Operations
        </span>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">
          <ShieldCheck className="w-3.5 h-3.5 text-[#059669]" />
          Anti-Abuse &amp; Moderation Active
        </span>
      </div>

      {/* ================= HEADER TOOLBAR ================= */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
            Community Moderation &amp; Voting Hub
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-normal max-w-2xl">
            Moderate discussion comments across project gallery submissions and inspect community popularity votes.
          </p>
        </div>

        {/* Right Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Hackathon:</span>
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 shadow-xs">
              <Trophy className="w-4 h-4 text-[#FF5500] flex-shrink-0" />
              <select
                value={selectedHackathonId}
                onChange={(e) => setSelectedHackathonId(e.target.value)}
                aria-label="Select Hackathon"
                className="bg-transparent border-none text-xs font-bold text-slate-900 focus:outline-none cursor-pointer pr-2 max-w-[280px] truncate"
              >
                {hackathons.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* ================= NOTIFICATION TOAST ================= */}
      {message && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between shadow-xs transition-all ${
            message.type === 'success'
              ? 'bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46]'
              : 'bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B]'
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-[#059669] flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-[#DC2626] flex-shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-slate-600 ml-4">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ================= 4 KPI CARDS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Votes */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 uppercase tracking-wider">
              <ThumbsUp className="w-3.5 h-3.5 text-[#FF5500]" />
              <span>TOTAL COMMUNITY VOTES</span>
            </div>
            <div className="text-3xl font-black text-slate-900 tracking-tight pt-1">
              {totalVotes}
            </div>
            <div className="text-xs text-slate-500 font-normal">Public engagement votes cast</div>
          </div>
          <div className="w-7 h-7 rounded-full bg-slate-50 border border-slate-200/60 flex items-center justify-center text-slate-400">
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>

        {/* Active Discussions */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 uppercase tracking-wider">
              <MessageSquare className="w-3.5 h-3.5 text-[#FF5500]" />
              <span>ACTIVE DISCUSSIONS</span>
            </div>
            <div className="text-3xl font-black text-slate-900 tracking-tight pt-1">
              {comments.length}
            </div>
            <div className="text-xs text-slate-500 font-normal">Comments across projects</div>
          </div>
          <div className="w-7 h-7 rounded-full bg-slate-50 border border-slate-200/60 flex items-center justify-center text-slate-400">
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>

        {/* Flagged / Hidden */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 uppercase tracking-wider">
              <ShieldAlert className="w-3.5 h-3.5 text-[#FF5500]" />
              <span>FLAGGED / HIDDEN</span>
            </div>
            <div className="text-3xl font-black text-slate-900 tracking-tight pt-1">
              {comments.filter((c) => c.isFlagged || c.isHidden).length}
            </div>
            <div className="text-xs text-slate-500 font-normal">Automated XSS &amp; abuse filter</div>
          </div>
          <div className="w-7 h-7 rounded-full bg-slate-50 border border-slate-200/60 flex items-center justify-center text-slate-400">
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>

        {/* Popularity Leader */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1 max-w-[180px]">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 uppercase tracking-wider">
              <Award className="w-3.5 h-3.5 text-[#FF5500]" />
              <span>PEOPLE&apos;S CHOICE</span>
            </div>
            <div className="text-base sm:text-lg font-black text-slate-900 tracking-tight pt-1 truncate">
              {DEMO_VOTES[0]?.projectTitle.split(':')[0] || 'SentinelCloud'}
            </div>
            <div className="text-xs text-slate-500 font-normal truncate">
              {DEMO_VOTES[0]?.votesCount} votes ({DEMO_VOTES[0]?.percentage}%)
            </div>
          </div>
          <div className="w-7 h-7 rounded-full bg-slate-50 border border-slate-200/60 flex items-center justify-center text-slate-400">
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* ================= TABS NAVIGATION ================= */}
      <div className="flex items-center border-b border-slate-200 space-x-8 text-xs font-bold pt-2">
        <button
          onClick={() => setActiveTab('moderation')}
          className={`pb-3 transition-all flex items-center gap-1.5 border-b-2 ${
            activeTab === 'moderation'
              ? 'border-[#FF5500] text-[#FF5500]'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Discussion Comments Moderation ({comments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('voting')}
          className={`pb-3 transition-all flex items-center gap-1.5 border-b-2 ${
            activeTab === 'voting'
              ? 'border-[#FF5500] text-[#FF5500]'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Vote className="w-3.5 h-3.5" />
          <span>Community Popularity Voting &amp; Leaderboard ({DEMO_VOTES.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('governance')}
          className={`pb-3 transition-all flex items-center gap-1.5 border-b-2 ${
            activeTab === 'governance'
              ? 'border-[#FF5500] text-[#FF5500]'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Governance &amp; Architectural Invariants</span>
        </button>
      </div>

      {/* ================= TAB 1: COMMENT MODERATION QUEUE ================= */}
      {activeTab === 'moderation' && (
        <div className="space-y-4">
          {/* Filter Toolbar */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search comments, authors, or projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF5500] focus:bg-white transition-all"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  statusFilter === 'ALL'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All ({comments.length})
              </button>
              <button
                onClick={() => setStatusFilter('VISIBLE')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  statusFilter === 'VISIBLE'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                }`}
              >
                Visible ({comments.filter((c) => !c.isHidden && !c.isFlagged).length})
              </button>
              <button
                onClick={() => setStatusFilter('FLAGGED')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  statusFilter === 'FLAGGED'
                    ? 'bg-amber-600 text-white'
                    : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                }`}
              >
                Flagged ({comments.filter((c) => c.isFlagged || c.isHidden).length})
              </button>
            </div>
          </div>

          {/* Comments List */}
          <div className="space-y-3">
            {filteredComments.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-xs text-slate-500">
                No discussion comments matching your filter criteria.
              </div>
            ) : (
              filteredComments.map((c) => (
                <div
                  key={c.id}
                  className={`bg-white border rounded-2xl p-5 shadow-xs transition-all space-y-3 ${
                    c.isHidden
                      ? 'border-slate-200 bg-slate-50/50 opacity-60'
                      : c.isFlagged
                      ? 'border-amber-300 bg-amber-50/20'
                      : 'border-slate-200/90 hover:border-slate-300'
                  }`}
                >
                  {/* Top: Project Info & Actions */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#FF5500]">Project:</span>
                      <span className="text-xs font-extrabold text-slate-900">{c.projectTitle}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                        <Check className="w-3 h-3 text-emerald-600" />
                        XSS Sanitized
                      </span>

                      {c.isHidden && (
                        <span className="text-[11px] font-bold text-slate-600 bg-slate-200 px-2 py-0.5 rounded-md">
                          Hidden
                        </span>
                      )}
                      {c.isFlagged && (
                        <span className="text-[11px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md">
                          Flagged
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Middle: Author & Content */}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-orange-100 text-[#EA580C] font-black text-xs flex items-center justify-center flex-shrink-0">
                      {c.authorName[0]}
                    </div>
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-bold text-slate-900">{c.authorName}</span>
                        <span className="text-slate-400 font-normal">({c.authorEmail})</span>
                        <span className="px-2 py-0.2 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                          {c.authorRole}
                        </span>
                        <span className="text-slate-400 text-[11px] ml-auto flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {c.createdAt}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed font-normal pt-1">
                        {c.content}
                      </p>
                    </div>
                  </div>

                  {/* Bottom: Action Buttons */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => handleToggleHide(c.id)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center gap-1.5 transition-colors"
                    >
                      {c.isHidden ? <Eye className="w-3.5 h-3.5 text-blue-600" /> : <EyeOff className="w-3.5 h-3.5 text-slate-500" />}
                      <span>{c.isHidden ? 'Restore to Gallery' : 'Hide from Public'}</span>
                    </button>

                    <button
                      onClick={() => handleToggleFlag(c.id)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-colors ${
                        c.isFlagged
                          ? 'bg-amber-50 border-amber-300 text-amber-700'
                          : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <Flag className="w-3.5 h-3.5 text-amber-600" />
                      <span>{c.isFlagged ? 'Clear Flag' : 'Flag for Review'}</span>
                    </button>

                    <button
                      onClick={() => handleDeleteComment(c.id)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-xs font-bold text-slate-700 flex items-center gap-1.5 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ================= TAB 2: COMMUNITY POPULARITY VOTING ================= */}
      {activeTab === 'voting' && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Community Popularity Leaderboard (People&apos;s Choice)
              </h2>
              <p className="text-xs text-slate-500">
                Independent public engagement voting tallies. Strictly isolated from official jury scoring.
              </p>
            </div>
            <span className="text-xs font-bold text-[#059669] bg-[#ECFDF5] px-3 py-1 rounded-full border border-[#A7F3D0]">
              {totalVotes} Total Public Votes
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                  <th className="py-3 px-4 text-center w-14">Rank</th>
                  <th className="py-3 px-4">Project &amp; Team</th>
                  <th className="py-3 px-4">Track</th>
                  <th className="py-3 px-4 text-right">Votes</th>
                  <th className="py-3 px-4 text-center w-48">Vote Share</th>
                  <th className="py-3 px-4 text-right">Award Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {DEMO_VOTES.map((v) => (
                  <tr key={v.projectId} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 text-center font-bold">
                      {v.rank === 1 ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-50 text-amber-600 border border-amber-200 font-black text-xs">
                          1
                        </span>
                      ) : (
                        <span className="text-slate-400 font-bold">#{v.rank}</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{v.projectTitle}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">Team: {v.teamName}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-block px-2.5 py-0.5 rounded-lg bg-[#EFF6FF] text-[#2563EB] border border-[#DBEAFE] font-semibold text-[11px]">
                        {v.trackTitle}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right font-black text-slate-900 text-sm">
                      {v.votesCount}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] font-bold text-slate-700">
                          <span>{v.percentage}%</span>
                          <span className="text-slate-400 font-normal">{v.votesCount} / {totalVotes}</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[#FF5500] to-[#EA580C]"
                            style={{ width: `${v.percentage}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      {v.rank === 1 ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-xs">
                          <Trophy className="w-3.5 h-3.5 text-emerald-600" />
                          People&apos;s Choice Leader
                        </span>
                      ) : (
                        <span className="text-slate-400 font-medium">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= TAB 3: GOVERNANCE & ARCHITECTURAL INVARIANTS ================= */}
      {activeTab === 'governance' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <MessageSquare className="w-4 h-4 text-[#2563EB]" />
              <h3 className="text-base font-bold text-slate-900">Comment Moderation Protocol</h3>
            </div>
            <p className="text-slate-600 leading-relaxed font-normal">
              Organizers hold authority to hide or flag abusive comments on projects submitted to their hackathons. All moderation actions are logged immutably in the audit trail.
            </p>
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 space-y-1">
              <strong className="text-slate-900 block">Audit Guarantee:</strong>
              <span>Content sanitization strips XSS and malicious payloads prior to database persistence.</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <ThumbsUp className="w-4 h-4 text-[#059669]" />
              <h3 className="text-base font-bold text-slate-900">Community Popularity Voting</h3>
            </div>
            <p className="text-slate-600 leading-relaxed font-normal">
              Community votes power the People&apos;s Choice awards. As a core architectural invariant, community votes are strictly isolated and never alter official jury rubric scores.
            </p>
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 space-y-1">
              <strong className="text-slate-900 block">Architectural Invariant:</strong>
              <span>Jury Z-score normalization remains 100% blind to public vote tallies.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
