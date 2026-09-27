'use client';

import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Plus,
  Scale,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface CriterionItem {
  id: string;
  title: string;
  description: string;
  weightPercentage: number;
  maxScore: number;
  requiredFeedback: boolean;
}

interface RubricData {
  id: string;
  name: string;
  version: number;
  isCurrent: boolean;
  criteria: CriterionItem[];
}

export default function OrganizerRubricsPage() {
  const [hackathons, setHackathons] = useState<any[]>([]);
  const [selectedHackathonId, setSelectedHackathonId] = useState<string>('');
  const [rubric, setRubric] = useState<RubricData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [weight, setWeight] = useState(25);
  const [maxScore, setMaxScore] = useState(100);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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

  const fetchRubric = async (hId: string) => {
    if (!hId) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/v1/hackathons/${hId}/rubrics`);
      const json = await res.json();
      if (res.ok && json.data?.rubric) {
        setRubric(json.data.rubric);
      } else {
        setRubric(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedHackathonId) {
      fetchRubric(selectedHackathonId);
    }
  }, [selectedHackathonId]);

  const handleAddCriterion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHackathonId || !title.trim()) return;
    try {
      setSaving(true);
      setMessage(null);
      const res = await fetch(`/api/v1/hackathons/${selectedHackathonId}/rubrics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          criterion: {
            title,
            description,
            weightPercentage: weight,
            maxScore,
            requiredFeedback: true,
          },
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to add criterion');
      setMessage({ type: 'success', text: 'Rubric criterion saved successfully.' });
      setTitle('');
      setDescription('');
      setShowAddModal(false);
      fetchRubric(selectedHackathonId);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const totalWeight = rubric?.criteria?.reduce((acc, c) => acc + c.weightPercentage, 0) || 0;
  const isBalanced = totalWeight === 100;

  return (
    <div className="space-y-6 select-none">
      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#E2E8F0] gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-bold text-[#2563EB] bg-[#EFF6FF] px-2.5 py-0.5 rounded-full border border-[#BFDBFE]">
              Evaluation Calibration
            </span>
            <span
              className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                isBalanced
                  ? 'bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]'
                  : 'bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]'
              }`}
            >
              Weight Sum: {totalWeight}% / 100%
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#111827] mt-1 tracking-tight">
            Scoring Rubric & Weight Calibration
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-0.5 font-normal">
            Configure weighted evaluation dimensions ensuring criteria total exactly 100% for deterministic normalization.
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
            onClick={() => setShowAddModal(true)}
            icon={<Plus className="w-4 h-4" />}
          >
            Add Criterion
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

      {/* Criteria List */}
      {loading ? (
        <div className="py-16 text-center text-xs text-[#64748B]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2563EB] mx-auto mb-2" />
          Loading rubric criteria...
        </div>
      ) : !rubric || rubric.criteria?.length === 0 ? (
        <div className="bg-white border border-[#E2E8F0] rounded-[18px] p-12 text-center space-y-3 shadow-card">
          <div className="w-12 h-12 rounded-2xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center mx-auto">
            <Sliders className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[#111827]">Default Rubric Active</h3>
          <p className="text-xs text-[#64748B] max-w-sm mx-auto">
            Click &quot;Add Criterion&quot; to configure custom dimensions like Technical Depth, Innovation, and Execution.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rubric.criteria.map((c) => (
            <div
              key={c.id}
              className="bg-white border border-[#E2E8F0] rounded-[18px] p-5 shadow-card space-y-3 text-xs"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-bold text-[#111827]">{c.title}</h3>
                  <p className="text-xs text-[#64748B] mt-0.5">{c.description}</p>
                </div>
                <Badge variant="purple" size="sm">
                  {c.weightPercentage}% Weight
                </Badge>
              </div>

              <div className="pt-2 border-t border-[#F1F5F9] flex items-center justify-between text-[#64748B]">
                <span>Max Score: <strong>{c.maxScore} pts</strong></span>
                <span className="text-[#059669] font-medium">Feedback Required: Yes</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-[#E2E8F0] rounded-[20px] max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
              <h3 className="text-base font-bold text-[#111827]">Add Rubric Criterion</h3>
              <button onClick={() => setShowAddModal(false)} className="text-xs text-[#64748B]">✕</button>
            </div>

            <form onSubmit={handleAddCriterion} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-[#334155] block mb-1">Criterion Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Architectural Resilience & Code Quality"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[10px] text-xs text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>

              <div>
                <label className="font-semibold text-[#334155] block mb-1">Description & Guidance</label>
                <textarea
                  rows={2}
                  placeholder="Specific guidelines for judges when scoring this dimension..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[10px] text-xs text-[#111827]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-[#334155] block mb-1">Weight Percentage (%)</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={weight}
                    onChange={(e) => setWeight(parseInt(e.target.value) || 25)}
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[10px] text-xs text-[#111827]"
                  />
                </div>

                <div>
                  <label className="font-semibold text-[#334155] block mb-1">Max Score</label>
                  <input
                    type="number"
                    min={10}
                    max={100}
                    value={maxScore}
                    onChange={(e) => setMaxScore(parseInt(e.target.value) || 100)}
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[10px] text-xs text-[#111827]"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <Button variant="outline" size="sm" type="button" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Criterion'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
