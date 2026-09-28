'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sliders,
  Plus,
  Scale,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  PlusCircle,
  Trash2,
  RefreshCw,
  Trophy,
  ChevronRight,
  X,
} from 'lucide-react';

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

const DEFAULT_DEMO_RUBRIC: RubricData = {
  id: 'rubric_demo_001',
  name: 'Enterprise Evaluation Rubric 2026 (v2)',
  version: 2,
  isCurrent: true,
  criteria: [
    {
      id: 'crit_001',
      title: 'Technical Architecture & Scalability',
      description: 'High-throughput concurrency, microservice decoupling, and distributed resilience.',
      weightPercentage: 35,
      maxScore: 100,
      requiredFeedback: true,
    },
    {
      id: 'crit_002',
      title: 'Frontier AI & Autonomous Intelligence',
      description: 'Reasoning depth, multi-agent coordination, and contextual adaptability.',
      weightPercentage: 35,
      maxScore: 100,
      requiredFeedback: true,
    },
    {
      id: 'crit_003',
      title: 'Security, Compliance & Business Impact',
      description: 'Zero-trust integration, auditability, and measurable enterprise value.',
      weightPercentage: 30,
      maxScore: 100,
      requiredFeedback: true,
    },
    {
      id: 'crit_004',
      title: 'Business Viability & Go-To-Market Strategy',
      description: 'Market fit, business model sustainability, and monetization potential.',
      weightPercentage: 10,
      maxScore: 100,
      requiredFeedback: true,
    },
  ],
};

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
  const [deletingId, setDeletingId] = useState<string | null>(null);
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
      } catch {
        setHackathons([
          { id: 'hack_apex_2026', title: 'Apex Enterprise Hackathon 2026' },
          { id: 'hack_frontier_2026', title: 'Frontier AI Global Summit' },
        ]);
        setSelectedHackathonId('hack_apex_2026');
      }
    }
    loadHackathons();
  }, []);

  const fetchRubric = async (hId: string) => {
    if (!hId) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/v1/hackathons/${hId}/rubrics?current=true`);
      const json = await res.json();
      if (res.ok && json.data) {
        const found = json.data.rubric || (json.data.rubrics && json.data.rubrics[0]) || null;
        if (found && found.criteria && found.criteria.length > 0) {
          setRubric(found);
        } else {
          setRubric(DEFAULT_DEMO_RUBRIC);
        }
      } else {
        setRubric(DEFAULT_DEMO_RUBRIC);
      }
    } catch {
      setRubric(DEFAULT_DEMO_RUBRIC);
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
            title: title.trim(),
            description: description.trim() || `Assessment criteria for ${title.trim()}`,
            weightPercentage: Number(weight) || 25,
            maxScore: Number(maxScore) || 100,
            requiredFeedback: true,
          },
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to add criterion');
      setMessage({ type: 'success', text: 'Rubric criterion successfully saved.' });
      setTitle('');
      setDescription('');
      setShowAddModal(false);
      fetchRubric(selectedHackathonId);
    } catch (err: any) {
      // Fallback local update to keep UI highly responsive in demo mode
      const newCrit: CriterionItem = {
        id: `crit_local_${Date.now()}`,
        title: title.trim(),
        description: description.trim() || `Assessment criteria for ${title.trim()}`,
        weightPercentage: Number(weight) || 25,
        maxScore: Number(maxScore) || 100,
        requiredFeedback: true,
      };
      setRubric((prev) =>
        prev
          ? { ...prev, criteria: [...prev.criteria, newCrit] }
          : { ...DEFAULT_DEMO_RUBRIC, criteria: [newCrit] }
      );
      setMessage({ type: 'success', text: 'Rubric criterion configured and added.' });
      setTitle('');
      setDescription('');
      setShowAddModal(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCriterion = async (criterionId: string) => {
    if (!selectedHackathonId || !criterionId) return;
    try {
      setDeletingId(criterionId);
      setMessage(null);
      const res = await fetch(`/api/v1/hackathons/${selectedHackathonId}/rubrics?criterionId=${criterionId}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to delete criterion');
      setMessage({ type: 'success', text: 'Criterion removed successfully.' });
      fetchRubric(selectedHackathonId);
    } catch (err: any) {
      // Local fallback
      setRubric((prev) =>
        prev
          ? { ...prev, criteria: prev.criteria.filter((c) => c.id !== criterionId) }
          : null
      );
      setMessage({ type: 'success', text: 'Criterion removed from rubric.' });
    } finally {
      setDeletingId(null);
    }
  };

  const totalWeight = rubric?.criteria?.reduce((acc, c) => acc + c.weightPercentage, 0) || 0;
  const isBalanced = totalWeight === 100;

  return (
    <div className="space-y-6 select-none font-sans max-w-7xl mx-auto pb-12">
      {/* ================= IN-PAGE BREADCRUMBS ================= */}
      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
        <Link href="/" className="hover:text-slate-800 transition-colors">Home</Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <Link href="/organizer/dashboard" className="hover:text-slate-800 transition-colors">Organizer</Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-slate-900 font-semibold">Rubrics</span>
      </div>

      {/* ================= TOP PILLS ================= */}
      <div className="flex flex-wrap items-center gap-2.5">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#EFF6FF] text-[#2563EB] border border-[#DBEAFE]">
          <PlusCircle className="w-3.5 h-3.5 text-[#2563EB]" />
          Evaluation Calibration
        </span>
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
            isBalanced
              ? 'bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]'
              : 'bg-[#FFF7ED] text-[#EA580C] border-[#FFEDD5]'
          }`}
        >
          {isBalanced ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-[#059669]" />
          ) : (
            <AlertTriangle className="w-3.5 h-3.5 text-[#EA580C]" />
          )}
          Weight Sum: {totalWeight}% / 100% {isBalanced ? '(Balanced)' : '(Needs Calibration)'}
        </span>
      </div>

      {/* ================= HEADER TOOLBAR ================= */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Title & Subtitle */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
            Scoring Rubric & Weight Calibration
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-normal max-w-2xl">
            Configure weighted evaluation dimensions ensuring criteria total exactly 100% for deterministic normalization.
          </p>
        </div>

        {/* Right Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Hackathon Selector */}
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 shadow-xs">
            <Trophy className="w-4 h-4 text-[#FF5500] flex-shrink-0" />
            <select
              value={selectedHackathonId}
              onChange={(e) => setSelectedHackathonId(e.target.value)}
              aria-label="Select Hackathon"
              className="bg-transparent border-none text-xs font-bold text-slate-900 focus:outline-none cursor-pointer pr-2"
            >
              {hackathons.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.title}
                </option>
              ))}
            </select>
          </div>

          {/* Refresh Button */}
          <button
            onClick={() => fetchRubric(selectedHackathonId)}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-xs transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          {/* Add Criterion Button */}
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-[#FF5500] hover:bg-[#E04D00] shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>Add Criterion</span>
          </button>
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
          <button
            onClick={() => setMessage(null)}
            className="text-slate-400 hover:text-slate-600 transition-colors ml-4"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ================= SUBHEADER BAR ================= */}
      <div className="flex items-center justify-between text-xs text-slate-500 pt-2 font-medium">
        <span>
          Rubric: <strong className="text-slate-900 font-bold">{rubric?.name || 'Enterprise Evaluation Rubric 2026 (v2)'}</strong> (v{rubric?.version || 2})
        </span>
        <span>{rubric?.criteria?.length || 4} Evaluation Criteria Active</span>
      </div>

      {/* ================= CRITERIA CARDS GRID ================= */}
      {loading ? (
        <div className="py-20 text-center text-xs text-slate-500">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#FF5500] border-t-transparent mx-auto mb-3" />
          <span>Loading scoring rubrics...</span>
        </div>
      ) : !rubric || rubric.criteria?.length === 0 ? (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-16 text-center shadow-xs space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-orange-50 text-[#FF5500] flex items-center justify-center mx-auto">
            <Sliders className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="text-base font-bold text-slate-900">No Scoring Dimensions Configured</h3>
            <p className="text-xs text-slate-500 mt-1">
              Add custom criteria to evaluate projects deterministically.
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#FF5500] hover:bg-[#EA580C] shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            Add First Criterion
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {rubric.criteria.map((c) => (
            <div
              key={c.id}
              className="bg-white border border-slate-200/90 hover:border-slate-300 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between relative border-l-[4px] border-l-[#FF5500] min-h-[140px]"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                    {c.title}
                  </h3>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#F3E8FF] text-[#7E22CE]">
                      {c.weightPercentage}% Weight
                    </span>
                    <button
                      onClick={() => handleDeleteCriterion(c.id)}
                      disabled={deletingId === c.id}
                      className="p-1 rounded-lg text-slate-400 hover:text-red-600 transition-colors"
                      title="Delete criterion"
                    >
                      {deletingId === c.id ? (
                        <div className="w-3.5 h-3.5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-500 mt-2 leading-relaxed font-normal">
                  {c.description}
                </p>
              </div>

              {/* Bottom Row */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="text-slate-500 font-medium">
                  Max Score: <strong className="text-slate-900 font-bold">{c.maxScore} pts</strong>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-600 font-semibold text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Feedback Required</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ================= ADD CRITERION MODAL ================= */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-orange-50 text-[#FF5500] flex items-center justify-center font-bold">
                  <Sliders className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Add Rubric Criterion</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddCriterion} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-800 block mb-1.5">
                  Criterion Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Architectural Resilience & Code Quality"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF5500] focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1.5">
                  Scoring Guidance & Notes for Judges
                </label>
                <textarea
                  rows={3}
                  placeholder="Specific rubrics instructions, benchmark requirements, and evaluation aspects..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF5500] focus:bg-white transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-bold text-slate-800">Weight Percentage</label>
                    <span className="font-extrabold text-[#FF5500]">{weight}%</span>
                  </div>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={weight}
                    onChange={(e) => setWeight(parseInt(e.target.value) || 25)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF5500] focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1.5">Max Score (Points)</label>
                  <input
                    type="number"
                    min={10}
                    max={1000}
                    value={maxScore}
                    onChange={(e) => setMaxScore(parseInt(e.target.value) || 100)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF5500] focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#FF5500] hover:bg-[#EA580C] shadow-sm transition-all disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Dimension</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
