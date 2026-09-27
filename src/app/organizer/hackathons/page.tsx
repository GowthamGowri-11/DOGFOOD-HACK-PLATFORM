'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Trophy,
  Plus,
  Calendar,
  Users,
  FolderKanban,
  FileCheck,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Edit,
  ArrowRight,
  Sparkles,
  Search,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface HackathonItem {
  id: string;
  slug: string;
  title: string;
  tagline?: string | null;
  description: string;
  organizationName: string;
  status: string;
  minTeamSize: number;
  maxTeamSize: number;
  eventStartTime: string;
  eventEndTime: string;
  regStartTime: string;
  regEndTime: string;
  subEndTime: string;
  _count: {
    registrations: number;
    projects: number;
    judges: number;
  };
}

export default function OrganizerHackathonsPage() {
  const [hackathons, setHackathons] = useState<HackathonItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // New Hackathon Form State
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    tagline: '',
    description: '',
    organizationName: '',
    minTeamSize: 1,
    maxTeamSize: 4,
    regStartTime: new Date().toISOString().slice(0, 16),
    regEndTime: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 16),
    eventStartTime: new Date(Date.now() + 8 * 86400000).toISOString().slice(0, 16),
    eventEndTime: new Date(Date.now() + 10 * 86400000).toISOString().slice(0, 16),
    subStartTime: new Date(Date.now() + 8 * 86400000).toISOString().slice(0, 16),
    subEndTime: new Date(Date.now() + 10 * 86400000).toISOString().slice(0, 16),
    judgingStartTime: new Date(Date.now() + 10 * 86400000).toISOString().slice(0, 16),
    judgingEndTime: new Date(Date.now() + 12 * 86400000).toISOString().slice(0, 16),
  });

  const fetchHackathons = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/v1/hackathons');
      const json = await res.json();
      if (res.ok && json.data?.hackathons) {
        setHackathons(json.data.hackathons);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load hackathons');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHackathons();
  }, []);

  const handleCreateHackathon = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreating(true);
      setError(null);
      setSuccessMsg(null);

      const payload = {
        ...formData,
        slug: formData.slug.trim() || formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        regStartTime: new Date(formData.regStartTime).toISOString(),
        regEndTime: new Date(formData.regEndTime).toISOString(),
        eventStartTime: new Date(formData.eventStartTime).toISOString(),
        eventEndTime: new Date(formData.eventEndTime).toISOString(),
        subStartTime: new Date(formData.subStartTime).toISOString(),
        subEndTime: new Date(formData.subEndTime).toISOString(),
        judgingStartTime: new Date(formData.judgingStartTime).toISOString(),
        judgingEndTime: new Date(formData.judgingEndTime).toISOString(),
      };

      const res = await fetch('/api/v1/hackathons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || 'Failed to create hackathon');
      }

      setSuccessMsg(`Hackathon "${formData.title}" created successfully!`);
      setShowCreateModal(false);
      fetchHackathons();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleStatusTransition = async (hackathonId: string, newStatus: string) => {
    try {
      setError(null);
      setSuccessMsg(null);

      const res = await fetch(`/api/v1/hackathons/${hackathonId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || 'Failed to transition lifecycle state');
      }

      setSuccessMsg(`Lifecycle updated to ${newStatus.replace(/_/g, ' ')}`);
      fetchHackathons();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const filtered = hackathons.filter((h) => {
    if (statusFilter !== 'ALL' && h.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        h.title.toLowerCase().includes(q) ||
        h.organizationName.toLowerCase().includes(q) ||
        h.slug.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 select-none">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#E2E8F0] gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-bold text-[#2563EB] bg-[#EFF6FF] px-2.5 py-0.5 rounded-full border border-[#BFDBFE]">
              Organizer Workspace
            </span>
            <span className="text-[11px] font-semibold text-[#64748B]">
              {hackathons.length} Total Hackathon{hackathons.length === 1 ? '' : 's'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#111827] mt-1 tracking-tight">
            My Hackathons & Control Center
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-0.5 font-normal">
            Configure event tracks, problem statements, prizes, and govern the full competition lifecycle.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => setShowCreateModal(true)}
          icon={<Plus className="w-4 h-4" />}
        >
          Create New Hackathon
        </Button>
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

      {/* Search & Status Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by title or organization..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-[38px] pl-10 pr-4 bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] rounded-[19px] text-xs text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/15"
          />
        </div>

        <div className="flex items-center space-x-2 overflow-x-auto w-full sm:w-auto">
          {['ALL', 'DRAFT', 'PUBLISHED', 'REGISTRATION_OPEN', 'SUBMISSION_OPEN', 'JUDGING', 'RESULTS_PUBLISHED', 'COMPLETED'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`h-[34px] px-3 rounded-[17px] text-[12px] font-medium border transition-colors whitespace-nowrap ${
                statusFilter === s
                  ? 'bg-[#EFF6FF] text-[#2563EB] border-[#3B82F6] font-semibold'
                  : 'bg-white text-[#475569] border-[#E2E8F0] hover:bg-[#F8FAFC]'
              }`}
            >
              {s.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Hackathons List */}
      {loading ? (
        <div className="py-16 text-center text-xs text-[#64748B]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2563EB] mx-auto mb-2" />
          Loading hackathons...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-[#E2E8F0] rounded-[18px] p-12 text-center space-y-3 shadow-card">
          <div className="w-12 h-12 rounded-2xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center mx-auto">
            <Trophy className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[#111827]">No Hackathons Found</h3>
          <p className="text-xs text-[#64748B] max-w-sm mx-auto">
            No events match your selected filters. Click &quot;Create New Hackathon&quot; to configure a new competition.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((h) => (
            <div
              key={h.id}
              className="bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] rounded-[18px] p-6 shadow-card space-y-5 transition-all"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <div className="flex items-center space-x-2 text-xs text-[#64748B] mb-1">
                    <span className="font-semibold text-[#334155]">{h.organizationName}</span>
                    <span>•</span>
                    <Badge
                      variant={
                        h.status === 'RESULTS_PUBLISHED'
                          ? 'emerald'
                          : h.status === 'JUDGING'
                          ? 'purple'
                          : h.status === 'SUBMISSION_OPEN'
                          ? 'blue'
                          : h.status === 'DRAFT'
                          ? 'neutral'
                          : 'slate'
                      }
                    >
                      {h.status.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                  <h3 className="text-xl font-bold text-[#111827]">{h.title}</h3>
                  {h.tagline && <p className="text-xs text-[#64748B] mt-0.5">{h.tagline}</p>}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/organizer/hackathons/${h.id}`}>
                    <Button variant="primary" size="sm" icon={<ArrowRight className="w-3.5 h-3.5" />}>
                      Event Control Center
                    </Button>
                  </Link>
                  <Link href={`/hackathons/${h.slug}`} target="_blank">
                    <Button variant="outline" size="sm" icon={<ExternalLink className="w-3.5 h-3.5" />}>
                      Public Page
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Metrics Ribbon */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block">
                    Registrations
                  </span>
                  <span className="text-lg font-bold text-[#111827]">{h._count?.registrations || 0}</span>
                </div>

                <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block">
                    Projects Submitted
                  </span>
                  <span className="text-lg font-bold text-[#2563EB]">{h._count?.projects || 0}</span>
                </div>

                <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block">
                    Assigned Judges
                  </span>
                  <span className="text-lg font-bold text-[#7E22CE]">{h._count?.judges || 0}</span>
                </div>

                <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block">
                    Team Bounds
                  </span>
                  <span className="text-lg font-bold text-[#334155]">{h.minTeamSize}–{h.maxTeamSize} Members</span>
                </div>
              </div>

              {/* Quick Lifecycle State Actions */}
              <div className="pt-3 border-t border-[#F1F5F9] flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center space-x-2 text-[#64748B]">
                  <Calendar className="w-3.5 h-3.5 text-[#2563EB]" />
                  <span>
                    Event Window: {new Date(h.eventStartTime).toLocaleDateString()} – {new Date(h.eventEndTime).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {h.status === 'DRAFT' && (
                    <button
                      onClick={() => handleStatusTransition(h.id, 'PUBLISHED')}
                      className="px-2.5 py-1 bg-[#EFF6FF] text-[#2563EB] hover:bg-[#2563EB] hover:text-white rounded-lg text-xs font-semibold transition-colors"
                    >
                      Publish Event
                    </button>
                  )}
                  {h.status === 'PUBLISHED' && (
                    <button
                      onClick={() => handleStatusTransition(h.id, 'REGISTRATION_OPEN')}
                      className="px-2.5 py-1 bg-[#ECFDF5] text-[#059669] hover:bg-[#059669] hover:text-white rounded-lg text-xs font-semibold transition-colors"
                    >
                      Open Registration
                    </button>
                  )}
                  {h.status === 'REGISTRATION_OPEN' && (
                    <button
                      onClick={() => handleStatusTransition(h.id, 'SUBMISSION_OPEN')}
                      className="px-2.5 py-1 bg-[#EFF6FF] text-[#2563EB] hover:bg-[#2563EB] hover:text-white rounded-lg text-xs font-semibold transition-colors"
                    >
                      Open Submissions
                    </button>
                  )}
                  {h.status === 'SUBMISSION_OPEN' && (
                    <button
                      onClick={() => handleStatusTransition(h.id, 'JUDGING')}
                      className="px-2.5 py-1 bg-[#FAF5FF] text-[#7E22CE] hover:bg-[#7E22CE] hover:text-white rounded-lg text-xs font-semibold transition-colors"
                    >
                      Start Judging
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Hackathon Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-[#E2E8F0] rounded-[22px] max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
              <div className="flex items-center space-x-2">
                <Trophy className="w-5 h-5 text-[#2563EB]" />
                <h3 className="text-lg font-bold text-[#111827]">Create New Hackathon</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-xs text-[#64748B] hover:text-[#111827]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateHackathon} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-[#334155] block mb-1">Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Apex Global AI Arena 2026"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[10px] text-xs text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  />
                </div>

                <div>
                  <label className="font-semibold text-[#334155] block mb-1">Organization Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Apex Frontier Systems"
                    value={formData.organizationName}
                    onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[10px] text-xs text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-[#334155] block mb-1">Tagline</label>
                <input
                  type="text"
                  placeholder="e.g. Build Autonomous AI Agents and Zero-Knowledge FinTech Protocols"
                  value={formData.tagline}
                  onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[10px] text-xs text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>

              <div>
                <label className="font-semibold text-[#334155] block mb-1">Description *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Comprehensive event details, challenges, guidelines and builder incentives..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[10px] text-xs text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-[#334155] block mb-1">Min Team Size</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={formData.minTeamSize}
                    onChange={(e) => setFormData({ ...formData, minTeamSize: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[10px] text-xs text-[#111827]"
                  />
                </div>

                <div>
                  <label className="font-semibold text-[#334155] block mb-1">Max Team Size</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={formData.maxTeamSize}
                    onChange={(e) => setFormData({ ...formData, maxTeamSize: parseInt(e.target.value) || 4 })}
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[10px] text-xs text-[#111827]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-[#334155] block mb-1">Registration Start</label>
                  <input
                    type="datetime-local"
                    value={formData.regStartTime}
                    onChange={(e) => setFormData({ ...formData, regStartTime: e.target.value })}
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[10px] text-xs text-[#111827]"
                  />
                </div>

                <div>
                  <label className="font-semibold text-[#334155] block mb-1">Registration End</label>
                  <input
                    type="datetime-local"
                    value={formData.regEndTime}
                    onChange={(e) => setFormData({ ...formData, regEndTime: e.target.value })}
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[10px] text-xs text-[#111827]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-[#334155] block mb-1">Submission Deadline</label>
                  <input
                    type="datetime-local"
                    value={formData.subEndTime}
                    onChange={(e) => setFormData({ ...formData, subEndTime: e.target.value })}
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[10px] text-xs text-[#111827]"
                  />
                </div>

                <div>
                  <label className="font-semibold text-[#334155] block mb-1">Judging Deadline</label>
                  <input
                    type="datetime-local"
                    value={formData.judgingEndTime}
                    onChange={(e) => setFormData({ ...formData, judgingEndTime: e.target.value })}
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[10px] text-xs text-[#111827]"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end space-x-2 border-t border-[#F1F5F9]">
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit" disabled={creating}>
                  {creating ? 'Creating...' : 'Create Hackathon'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
