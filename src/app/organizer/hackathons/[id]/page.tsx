'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Trophy,
  Users,
  FolderKanban,
  FileCheck,
  Award,
  CheckCircle2,
  AlertCircle,
  Clock,
  Plus,
  ArrowLeft,
  ExternalLink,
  Layers,
  Sparkles,
  Sliders,
  Scale,
  Trash2,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export default function OrganizerHackathonDetailPage() {
  const params = useParams();
  const router = useRouter();
  const hackathonId = params?.id as string;

  const [hackathon, setHackathon] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'tracks' | 'prizes' | 'settings'>('overview');

  // New Track form state
  const [newTrackTitle, setNewTrackTitle] = useState('');
  const [newTrackDesc, setNewTrackDesc] = useState('');
  const [newTrackColor, setNewTrackColor] = useState('#3B82F6');
  const [addingTrack, setAddingTrack] = useState(false);

  // New Problem Statement form state
  const [selectedTrackId, setSelectedTrackId] = useState('');
  const [newPSCode, setNewPSCode] = useState('');
  const [newPSTitle, setNewPSTitle] = useState('');
  const [newPSDesc, setNewPSDesc] = useState('');
  const [addingPS, setAddingPS] = useState(false);

  // New Prize form state
  const [newPrizeTitle, setNewPrizeTitle] = useState('');
  const [newPrizeAmount, setNewPrizeAmount] = useState('');
  const [newPrizeRank, setNewPrizeRank] = useState(1);
  const [addingPrize, setAddingPrize] = useState(false);

  const fetchHackathon = async () => {
    if (!hackathonId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/v1/hackathons/${hackathonId}`);
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || 'Failed to fetch hackathon');
      }
      setHackathon(json.data.hackathon);
      if (json.data.hackathon.tracks?.length > 0) {
        setSelectedTrackId(json.data.hackathon.tracks[0].id);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHackathon();
  }, [hackathonId]);

  const handleAddTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTrackTitle.trim()) return;
    try {
      setAddingTrack(true);
      const slug = newTrackTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const res = await fetch(`/api/v1/hackathons/${hackathonId}/tracks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTrackTitle,
          slug,
          description: newTrackDesc,
          colorHex: newTrackColor,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to create track');
      setSuccessMsg('Track created successfully!');
      setNewTrackTitle('');
      setNewTrackDesc('');
      fetchHackathon();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAddingTrack(false);
    }
  };

  const handleAddProblemStatement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTrackId || !newPSTitle.trim() || !newPSCode.trim()) return;
    try {
      setAddingPS(true);
      const res = await fetch(`/api/v1/tracks/${selectedTrackId}/problem-statements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: newPSCode.toUpperCase(),
          title: newPSTitle,
          description: newPSDesc,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to create problem statement');
      setSuccessMsg('Problem Statement added successfully!');
      setNewPSCode('');
      setNewPSTitle('');
      setNewPSDesc('');
      fetchHackathon();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAddingPS(false);
    }
  };

  const handleAddPrize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPrizeTitle.trim() || !newPrizeAmount) return;
    try {
      setAddingPrize(true);
      const res = await fetch(`/api/v1/hackathons/${hackathonId}/prizes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newPrizeTitle,
          amount: parseFloat(newPrizeAmount),
          currency: 'USD',
          rankOrder: newPrizeRank,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to create prize');
      setSuccessMsg('Prize award configured successfully!');
      setNewPrizeTitle('');
      setNewPrizeAmount('');
      fetchHackathon();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAddingPrize(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-xs text-[#64748B]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2563EB] mx-auto mb-2" />
        Loading hackathon control center...
      </div>
    );
  }

  if (!hackathon) {
    return (
      <div className="bg-white border border-[#E2E8F0] rounded-[18px] p-12 text-center space-y-3">
        <h3 className="text-base font-bold text-[#111827]">Hackathon Not Found</h3>
        <p className="text-xs text-[#64748B]">
          You may not be authorized to manage this event, or it has been deleted.
        </p>
        <Link href="/organizer/hackathons">
          <Button variant="primary" size="sm">
            Back to Hackathons
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 select-none">
      {/* Back button & Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#E2E8F0] gap-4">
        <div>
          <Link
            href="/organizer/hackathons"
            className="text-xs text-[#64748B] hover:text-[#2563EB] inline-flex items-center mb-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            Back to All Hackathons
          </Link>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#111827] tracking-tight">
              {hackathon.title}
            </h1>
            <Badge
              variant={
                hackathon.status === 'RESULTS_PUBLISHED'
                  ? 'emerald'
                  : hackathon.status === 'JUDGING'
                  ? 'purple'
                  : hackathon.status === 'SUBMISSION_OPEN'
                  ? 'blue'
                  : 'slate'
              }
            >
              {hackathon.status.replace(/_/g, ' ')}
            </Badge>
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">
            Organization: <strong>{hackathon.organizationName}</strong> • Slug: <code>{hackathon.slug}</code>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/hackathons/${hackathon.slug}`} target="_blank">
            <Button variant="outline" size="sm" icon={<ExternalLink className="w-3.5 h-3.5" />}>
              Public Preview
            </Button>
          </Link>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46] px-4 py-3 rounded-[12px] text-xs font-medium flex items-center shadow-xs">
          <CheckCircle2 className="w-4 h-4 mr-2 text-[#059669] flex-shrink-0" />
          {successMsg}
        </div>
      )}
      {error && (
        <div className="bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] px-4 py-3 rounded-[12px] text-xs font-medium flex items-center shadow-xs">
          <AlertCircle className="w-4 h-4 mr-2 text-[#DC2626] flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Sub-tabs */}
      <div className="flex border-b border-[#E2E8F0] space-x-6 text-xs font-semibold">
        {(['overview', 'tracks', 'prizes', 'settings'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 capitalize transition-colors border-b-2 ${
              activeTab === tab
                ? 'border-[#2563EB] text-[#2563EB]'
                : 'border-transparent text-[#64748B] hover:text-[#111827]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* TAB 1: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] shadow-card">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block">
                Registrations
              </span>
              <span className="text-2xl font-bold text-[#111827]">
                {hackathon._count?.registrations || 0}
              </span>
            </div>
            <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] shadow-card">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block">
                Projects
              </span>
              <span className="text-2xl font-bold text-[#2563EB]">
                {hackathon._count?.projects || 0}
              </span>
            </div>
            <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] shadow-card">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block">
                Judges
              </span>
              <span className="text-2xl font-bold text-[#7E22CE]">
                {hackathon._count?.judges || 0}
              </span>
            </div>
            <div className="p-4 rounded-xl bg-white border border-[#E2E8F0] shadow-card">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block">
                Tracks Configured
              </span>
              <span className="text-2xl font-bold text-[#059669]">
                {hackathon.tracks?.length || 0}
              </span>
            </div>
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-[18px] p-6 shadow-card space-y-4 text-xs">
            <h3 className="text-sm font-bold text-[#111827]">Event Description</h3>
            <p className="text-[#475569] leading-relaxed whitespace-pre-line">
              {hackathon.description}
            </p>
          </div>
        </div>
      )}

      {/* TAB 2: Tracks & Problem Statements */}
      {activeTab === 'tracks' && (
        <div className="space-y-6">
          {/* Add Track Form */}
          <div className="bg-white border border-[#E2E8F0] rounded-[18px] p-6 shadow-card space-y-4">
            <div className="flex items-center space-x-2">
              <FolderKanban className="w-4 h-4 text-[#2563EB]" />
              <h3 className="text-sm font-bold text-[#111827]">Add Challenge Track</h3>
            </div>

            <form onSubmit={handleAddTrack} className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="font-semibold text-[#334155] block mb-1">Track Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Autonomous AI Agents"
                  value={newTrackTitle}
                  onChange={(e) => setNewTrackTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[10px] text-xs text-[#111827]"
                />
              </div>

              <div>
                <label className="font-semibold text-[#334155] block mb-1">Description</label>
                <input
                  type="text"
                  placeholder="Short challenge focus..."
                  value={newTrackDesc}
                  onChange={(e) => setNewTrackDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[10px] text-xs text-[#111827]"
                />
              </div>

              <div className="flex items-end">
                <Button variant="primary" size="md" type="submit" disabled={addingTrack} className="w-full">
                  {addingTrack ? 'Adding...' : '+ Add Track'}
                </Button>
              </div>
            </form>
          </div>

          {/* Existing Tracks & Problem Statements */}
          <div className="space-y-4">
            {hackathon.tracks?.map((t: any) => (
              <div key={t.id} className="bg-white border border-[#E2E8F0] rounded-[18px] p-5 shadow-card space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: t.colorHex || '#3B82F6' }} />
                    <h4 className="text-sm font-bold text-[#111827]">{t.title}</h4>
                  </div>
                  <span className="text-[11px] text-[#64748B]">
                    {t.problemStatements?.length || 0} Problem Statements
                  </span>
                </div>

                {t.description && <p className="text-xs text-[#64748B]">{t.description}</p>}

                {/* Problem Statements List */}
                <div className="pt-2 divide-y divide-[#F1F5F9]">
                  {t.problemStatements?.map((ps: any) => (
                    <div key={ps.id} className="py-2.5 flex items-start justify-between gap-3 text-xs">
                      <div>
                        <span className="font-mono font-bold text-[#2563EB] mr-2">[{ps.code}]</span>
                        <span className="font-semibold text-[#111827]">{ps.title}</span>
                        <p className="text-[11px] text-[#64748B] mt-0.5">{ps.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Add Problem Statement Form */}
          {hackathon.tracks?.length > 0 && (
            <div className="bg-white border border-[#E2E8F0] rounded-[18px] p-6 shadow-card space-y-4">
              <h3 className="text-sm font-bold text-[#111827]">Add Problem Statement to Track</h3>
              <form onSubmit={handleAddProblemStatement} className="space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-[#334155] block mb-1">Select Track</label>
                    <select
                      value={selectedTrackId}
                      onChange={(e) => setSelectedTrackId(e.target.value)}
                      className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[10px] text-xs text-[#111827]"
                    >
                      {hackathon.tracks.map((t: any) => (
                        <option key={t.id} value={t.id}>
                          {t.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-[#334155] block mb-1">Code</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. AI-01"
                      value={newPSCode}
                      onChange={(e) => setNewPSCode(e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[10px] text-xs font-mono uppercase text-[#111827]"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-[#334155] block mb-1">Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Autonomous Incident Triage"
                    value={newPSTitle}
                    onChange={(e) => setNewPSTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[10px] text-xs text-[#111827]"
                  />
                </div>

                <div>
                  <label className="font-semibold text-[#334155] block mb-1">Description</label>
                  <textarea
                    rows={2}
                    placeholder="Problem details and expected deliverable..."
                    value={newPSDesc}
                    onChange={(e) => setNewPSDesc(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[10px] text-xs text-[#111827]"
                  />
                </div>

                <Button variant="primary" size="sm" type="submit" disabled={addingPS}>
                  {addingPS ? 'Adding...' : '+ Add Problem Statement'}
                </Button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Prizes */}
      {activeTab === 'prizes' && (
        <div className="space-y-6">
          <div className="bg-white border border-[#E2E8F0] rounded-[18px] p-6 shadow-card space-y-4">
            <div className="flex items-center space-x-2">
              <Award className="w-4 h-4 text-[#D97706]" />
              <h3 className="text-sm font-bold text-[#111827]">Configure Prize Pool</h3>
            </div>

            <form onSubmit={handleAddPrize} className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="font-semibold text-[#334155] block mb-1">Prize Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 1st Place Grand Winner"
                  value={newPrizeTitle}
                  onChange={(e) => setNewPrizeTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[10px] text-xs text-[#111827]"
                />
              </div>

              <div>
                <label className="font-semibold text-[#334155] block mb-1">Amount ($ USD)</label>
                <input
                  type="number"
                  required
                  min={0}
                  placeholder="e.g. 20000"
                  value={newPrizeAmount}
                  onChange={(e) => setNewPrizeAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[10px] text-xs text-[#111827]"
                />
              </div>

              <div>
                <label className="font-semibold text-[#334155] block mb-1">Rank Order</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={newPrizeRank}
                  onChange={(e) => setNewPrizeRank(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[10px] text-xs text-[#111827]"
                />
              </div>

              <div className="flex items-end">
                <Button variant="primary" size="md" type="submit" disabled={addingPrize} className="w-full">
                  {addingPrize ? 'Saving...' : '+ Add Prize'}
                </Button>
              </div>
            </form>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {hackathon.prizes?.map((p: any) => (
              <div key={p.id} className="p-4 rounded-xl bg-white border border-[#E2E8F0] shadow-card space-y-1 text-xs">
                <span className="text-[10px] font-bold text-[#D97706] uppercase tracking-wider block">
                  Rank #{p.rankOrder}
                </span>
                <div className="text-base font-bold text-[#111827]">{p.title}</div>
                <div className="text-lg font-extrabold text-[#059669]">
                  {p.currency} {Number(p.amount).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: Settings & Lifecycle */}
      {activeTab === 'settings' && (
        <div className="bg-white border border-[#E2E8F0] rounded-[18px] p-6 shadow-card space-y-4 text-xs">
          <h3 className="text-sm font-bold text-[#111827]">Event Configuration & Deadlines</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3 bg-[#F8FAFC] rounded-xl space-y-1">
              <span className="text-[10px] text-[#64748B] block">Registration Window</span>
              <span className="font-semibold text-[#111827]">
                {new Date(hackathon.regStartTime).toLocaleString()} – {new Date(hackathon.regEndTime).toLocaleString()}
              </span>
            </div>
            <div className="p-3 bg-[#F8FAFC] rounded-xl space-y-1">
              <span className="text-[10px] text-[#64748B] block">Submission Deadline</span>
              <span className="font-semibold text-[#111827]">
                {new Date(hackathon.subEndTime).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
