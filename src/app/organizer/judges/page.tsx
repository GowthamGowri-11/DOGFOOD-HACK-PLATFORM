'use client';

import React, { useState, useEffect } from 'react';
import {
  UserCheck2,
  Users,
  Search,
  Plus,
  Scale,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Trash2,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface JudgeItem {
  id: string;
  userId: string;
  expertiseTracks: string[];
  maxWorkload: number;
  isActive: boolean;
  user: {
    id: string;
    fullName: string;
    email: string;
    avatarUrl?: string | null;
  };
  _count: {
    assignments: number;
    evaluations: number;
  };
}

export default function OrganizerJudgesPage() {
  const [hackathons, setHackathons] = useState<any[]>([]);
  const [selectedHackathonId, setSelectedHackathonId] = useState<string>('');
  const [judges, setJudges] = useState<JudgeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newJudgeEmail, setNewJudgeEmail] = useState('');
  const [newWorkload, setNewWorkload] = useState(10);
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [modalError, setModalError] = useState<string | null>(null);
  const [newJudgeName, setNewJudgeName] = useState('');

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

  const fetchJudges = async (hId: string) => {
    if (!hId) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/v1/hackathons/${hId}/judges`);
      const json = await res.json();
      if (res.ok && json.data?.judges) {
        setJudges(json.data.judges);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedHackathonId) {
      fetchJudges(selectedHackathonId);
    }
  }, [selectedHackathonId]);

  const handleAddJudge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJudgeEmail.trim()) {
      setModalError('Please enter a valid email address.');
      return;
    }
    if (!selectedHackathonId) {
      setModalError('Please select a hackathon first.');
      return;
    }

    try {
      setAdding(true);
      setModalError(null);
      setMessage(null);

      const res = await fetch(`/api/v1/hackathons/${selectedHackathonId}/judges`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newJudgeEmail.trim().toLowerCase(),
          fullName: newJudgeName.trim() || undefined,
          maxWorkload: newWorkload,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || 'Failed to add judge to panel');
      }

      setMessage({ type: 'success', text: `Judge ${newJudgeEmail.trim()} successfully added to competition jury.` });
      setNewJudgeEmail('');
      setNewJudgeName('');
      setNewWorkload(10);
      setShowAddModal(false);
      await fetchJudges(selectedHackathonId);
    } catch (err: any) {
      setModalError(err.message || 'Failed to add judge');
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveJudge = async (judgeId: string) => {
    if (!confirm('Are you sure you want to remove this judge from the event panel?')) return;
    try {
      setMessage(null);
      const res = await fetch(`/api/v1/hackathons/${selectedHackathonId}/judges/${judgeId}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to remove judge');
      setMessage({ type: 'success', text: 'Judge removed successfully.' });
      fetchJudges(selectedHackathonId);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  return (
    <div className="space-y-6 select-none">
      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#E2E8F0] gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-bold text-[#2563EB] bg-[#EFF6FF] px-2.5 py-0.5 rounded-full border border-[#BFDBFE]">
              Jury Operations
            </span>
            <span className="text-[11px] font-semibold text-[#059669] bg-[#ECFDF5] px-2.5 py-0.5 rounded-full border border-[#A7F3D0] flex items-center">
              <ShieldCheck className="w-3 h-3 mr-1" /> Conflict of Interest (COI) Protected
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#111827] mt-1 tracking-tight">
            Judge Management & Roster
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-0.5 font-normal">
            Enlist expert judges, define workload caps, assign domain specialties, and monitor evaluation progress.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {hackathons.length > 0 && (
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
          )}

          <Button
            variant="primary"
            size="md"
            onClick={() => {
              setModalError(null);
              setShowAddModal(true);
            }}
            icon={<Plus className="w-4 h-4" />}
          >
            Add Judge
          </Button>
        </div>
      </div>

      {/* Notifications */}
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

      {/* Judges Grid */}
      {loading ? (
        <div className="py-16 text-center text-xs text-[#64748B]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2563EB] mx-auto mb-2" />
          Loading judges...
        </div>
      ) : judges.length === 0 ? (
        <div className="bg-white border border-[#E2E8F0] rounded-[18px] p-12 text-center space-y-3 shadow-card">
          <div className="w-12 h-12 rounded-2xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center mx-auto">
            <UserCheck2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[#111827]">No Judges Enlisted</h3>
          <p className="text-xs text-[#64748B] max-w-sm mx-auto">
            Add verified judges to this hackathon to begin assigning submissions for rubric evaluation.
          </p>
          <div className="pt-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setModalError(null);
                setShowAddModal(true);
              }}
              icon={<Plus className="w-4 h-4" />}
            >
              Add Judge
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {judges.map((j) => (
            <div
              key={j.id}
              className="bg-white border border-[#E2E8F0] rounded-[18px] p-5 shadow-card space-y-4 text-xs"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] font-bold text-xs flex items-center justify-center flex-shrink-0">
                    {j.user.fullName ? j.user.fullName.charAt(0).toUpperCase() : 'J'}
                  </div>
                  <div>
                    <h4 className="font-bold text-[#111827] text-sm">{j.user.fullName || 'Judge'}</h4>
                    <span className="text-[11px] text-[#64748B]">{j.user.email}</span>
                  </div>
                </div>

                <Badge variant={j.isActive ? 'emerald' : 'neutral'} size="sm">
                  {j.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>

              {/* Workload & Progress */}
              <div className="grid grid-cols-2 gap-2 pt-1 font-semibold">
                <div className="p-2.5 bg-[#F8FAFC] rounded-lg">
                  <span className="text-[10px] text-[#64748B] block font-normal">Assigned / Cap</span>
                  <span className="text-[#111827]">
                    {j._count?.assignments || 0} / {j.maxWorkload}
                  </span>
                </div>
                <div className="p-2.5 bg-[#F8FAFC] rounded-lg">
                  <span className="text-[10px] text-[#64748B] block font-normal">Completed</span>
                  <span className="text-[#059669]">{j._count?.evaluations || 0} Evals</span>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="pt-2 border-t border-[#F1F5F9] flex justify-end">
                <button
                  onClick={() => handleRemoveJudge(j.id)}
                  className="text-xs text-[#DC2626] hover:underline inline-flex items-center"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" /> Remove Judge
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Judge Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-[#E2E8F0] rounded-[20px] max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
              <h3 className="text-base font-bold text-[#111827]">Add Judge to Hackathon</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-7 h-7 rounded-full hover:bg-[#F1F5F9] flex items-center justify-center text-[#64748B] hover:text-[#111827] transition"
              >
                ✕
              </button>
            </div>

            {modalError && (
              <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-[10px] text-xs text-[#991B1B] flex items-center">
                <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0 text-[#DC2626]" />
                {modalError}
              </div>
            )}

            <form onSubmit={handleAddJudge} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-[#334155] block mb-1">Judge User Email *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. kit28.24bad026@gmail.com"
                  value={newJudgeEmail}
                  onChange={(e) => setNewJudgeEmail(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[10px] text-xs text-[#111827] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>

              <div>
                <label className="font-semibold text-[#334155] block mb-1">Judge Full Name (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Alex Morgan"
                  value={newJudgeName}
                  onChange={(e) => setNewJudgeName(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[10px] text-xs text-[#111827] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>

              <div>
                <label className="font-semibold text-[#334155] block mb-1">Max Workload Limit</label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={newWorkload}
                  onChange={(e) => setNewWorkload(parseInt(e.target.value) || 10)}
                  className="w-full px-3 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[10px] text-xs text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                />
                <p className="text-[11px] text-[#64748B] mt-1">Maximum number of project submissions assigned to this judge.</p>
              </div>

              <div className="pt-3 flex justify-end space-x-2 border-t border-[#F1F5F9]">
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  disabled={adding}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  type="submit"
                  disabled={adding || !newJudgeEmail.trim()}
                >
                  {adding ? 'Adding...' : 'Add Judge'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
