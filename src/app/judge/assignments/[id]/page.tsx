'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldCheck,
  Scale,
  CheckCircle2,
  Clock,
  ExternalLink,
  Github,
  Video,
  FileText,
  AlertCircle,
  ArrowLeft,
  Lock,
  Save,
  Send,
  HelpCircle,
} from 'lucide-react';

interface RubricCriterion {
  id: string;
  title: string;
  description: string;
  weightPercentage: number;
  maxScore: number;
  requiredFeedback: boolean;
}

interface Rubric {
  id: string;
  name: string;
  version: number;
  criteria: RubricCriterion[];
}

interface AssignmentData {
  id: string;
  status: string;
  assignedAt: string;
  completedAt?: string | null;
  project: {
    id: string;
    title: string;
    slug: string;
    tagline?: string | null;
    description: string;
    repoUrl: string;
    demoUrl?: string | null;
    videoUrl?: string | null;
    documentationUrl?: string | null;
    techStack: string[];
    track: { id: string; title: string; colorHex?: string };
    problemStatement: { id: string; title: string; code: string };
    team: { id: string; name: string };
    lockedSubmission?: {
      versionNumber: number;
      submittedAt: string;
      payloadSnapshot: any;
    } | null;
  };
  evaluation?: {
    id: string;
    status: string;
    rawScoreSum: number;
    weightedScore: number;
    prosComment?: string | null;
    consComment?: string | null;
    suggestions?: string | null;
    privateNotes?: string | null;
    scores: {
      criterionId: string;
      rawScore: number;
      feedback?: string | null;
    }[];
  } | null;
}

export default function JudgeAssignmentPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const assignmentId = params.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [assignment, setAssignment] = useState<AssignmentData | null>(null);
  const [rubric, setRubric] = useState<Rubric | null>(null);

  // Form State
  const [scores, setScores] = useState<Record<string, number>>({});
  const [criterionFeedback, setCriterionFeedback] = useState<Record<string, string>>({});
  const [prosComment, setProsComment] = useState('');
  const [consComment, setConsComment] = useState('');
  const [suggestions, setSuggestions] = useState('');
  const [privateNotes, setPrivateNotes] = useState('');

  const isLocked = assignment?.evaluation?.status === 'SUBMITTED';

  useEffect(() => {
    async function loadAssignment() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/v1/judge/assignments/${assignmentId}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || 'Failed to load assignment.');
        }

        setAssignment(data.data.assignment);
        setRubric(data.data.rubric);

        // Prepopulate scores if evaluation already exists
        if (data.data.assignment.evaluation) {
          const evalData = data.data.assignment.evaluation;
          const initialScores: Record<string, number> = {};
          const initialFeedback: Record<string, string> = {};

          evalData.scores.forEach((s: any) => {
            initialScores[s.criterionId] = s.rawScore;
            if (s.feedback) initialFeedback[s.criterionId] = s.feedback;
          });

          setScores(initialScores);
          setCriterionFeedback(initialFeedback);
          setProsComment(evalData.prosComment || '');
          setConsComment(evalData.consComment || '');
          setSuggestions(evalData.suggestions || '');
          setPrivateNotes(evalData.privateNotes || '');
        }
      } catch (err: any) {
        setError(err.message || 'Error loading assignment');
      } finally {
        setLoading(false);
      }
    }

    loadAssignment();
  }, [assignmentId]);

  // Real-time calculated weighted score preview
  const calculatePreviewScore = () => {
    if (!rubric) return { rawSum: 0, weightedTotal: 0 };
    let rawSum = 0;
    let weightedTotal = 0;

    rubric.criteria.forEach((c) => {
      const score = scores[c.id] ?? 0;
      rawSum += score;
      const normalized = c.maxScore > 0 ? (score / c.maxScore) * 100 : 0;
      weightedTotal += normalized * (c.weightPercentage / 100);
    });

    return {
      rawSum: Number(rawSum.toFixed(2)),
      weightedTotal: Number(weightedTotal.toFixed(2)),
    };
  };

  const { rawSum, weightedTotal } = calculatePreviewScore();

  const handleScoreChange = (criterionId: string, val: number, maxScore: number) => {
    if (isLocked) return;
    const clamped = Math.max(0, Math.min(maxScore, val));
    setScores((prev) => ({ ...prev, [criterionId]: clamped }));
  };

  const handleSaveDraft = async () => {
    if (!rubric) return;
    try {
      setSaving(true);
      setError(null);
      setSuccessMsg(null);

      const scorePayload = rubric.criteria.map((c) => ({
        criterionId: c.id,
        rawScore: scores[c.id] ?? 0,
        feedback: criterionFeedback[c.id] || '',
      }));

      const res = await fetch(`/api/v1/judge/assignments/${assignmentId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'DRAFT',
          scores: scorePayload,
          prosComment,
          consComment,
          suggestions,
          privateNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to save draft evaluation.');
      }

      setSuccessMsg('Evaluation draft saved successfully.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitEvaluation = async () => {
    if (!rubric) return;
    if (isLocked) return;

    // Check all criteria scored
    const unscored = rubric.criteria.filter((c) => scores[c.id] === undefined);
    if (unscored.length > 0) {
      setError(`Please provide a score for all ${rubric.criteria.length} criteria before submitting.`);
      return;
    }

    if (!confirm('Are you sure you want to submit this evaluation? Once submitted, your evaluation will be locked and cannot be modified.')) {
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setSuccessMsg(null);

      const scorePayload = rubric.criteria.map((c) => ({
        criterionId: c.id,
        rawScore: scores[c.id] ?? 0,
        feedback: criterionFeedback[c.id] || '',
      }));

      const res = await fetch(`/api/v1/judge/assignments/${assignmentId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'SUBMITTED',
          scores: scorePayload,
          prosComment,
          consComment,
          suggestions,
          privateNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to submit evaluation.');
      }

      setSuccessMsg('Evaluation submitted and locked successfully!');
      setTimeout(() => {
        router.push('/judge/dashboard');
      }, 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 mx-auto"></div>
        <p className="mt-4 text-slate-500 font-medium">Loading assigned project & rubric...</p>
      </div>
    );
  }

  if (error && !assignment) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-8 text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-xl font-bold text-rose-900">Access Restricted</h2>
          <p className="text-rose-700 text-sm">{error}</p>
          <Link
            href="/judge/dashboard"
            className="inline-flex items-center px-4 py-2 bg-rose-600 text-white rounded-xl text-sm font-semibold hover:bg-rose-700"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!assignment || !rubric) return null;

  const project = assignment.project;
  const snapshot = project.lockedSubmission?.payloadSnapshot || {};

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Navigation Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-6">
        <div className="flex items-center space-x-3">
          <Link
            href="/judge/dashboard"
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                Rubric: {rubric.name} (v{rubric.version})
              </span>
              {isLocked ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Lock className="w-3 h-3 mr-1" /> Locked & Submitted
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  <Clock className="w-3 h-3 mr-1" /> Evaluation In Progress
                </span>
              )}
            </div>
            <h1 className="text-2xl font-black text-slate-900 mt-1">{project.title}</h1>
            <p className="text-xs text-slate-500">
              Team: <strong>{project.team.name}</strong> • Track: <strong>{project.track.title}</strong>
            </p>
          </div>
        </div>

        {/* Live Score Counter */}
        <div className="bg-slate-900 text-white px-6 py-3 rounded-2xl flex items-center space-x-6 shadow-sm">
          <div>
            <div className="text-xs text-slate-400 font-medium">Weighted Score</div>
            <div className="text-2xl font-black text-purple-400">{weightedTotal} <span className="text-xs text-slate-400 font-normal">/ 100</span></div>
          </div>
          <div className="h-8 w-px bg-slate-700" />
          <div>
            <div className="text-xs text-slate-400 font-medium">Raw Sum</div>
            <div className="text-lg font-bold text-slate-200">{rawSum}</div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-sm flex items-center">
          <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-600 flex-shrink-0" />
          {successMsg}
        </div>
      )}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-xl text-sm flex items-center">
          <AlertCircle className="w-4 h-4 mr-2 text-rose-600 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Main Grid: Left = Locked Submission Snapshot, Right = Rubric Scoring Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Locked Project Submission (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6 sticky top-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-purple-600" />
                <h2 className="text-base font-bold text-slate-900">Locked Submission Snapshot</h2>
              </div>
              {project.lockedSubmission && (
                <span className="text-xs text-slate-400">
                  Version #{project.lockedSubmission.versionNumber}
                </span>
              )}
            </div>

            {/* Problem Statement */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Problem Statement
              </label>
              <p className="text-sm font-semibold text-slate-800 mt-1">
                [{project.problemStatement.code}] {project.problemStatement.title}
              </p>
            </div>

            {/* Description */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Project Description
              </label>
              <p className="text-sm text-slate-600 mt-1 whitespace-pre-line leading-relaxed">
                {snapshot.description || project.description}
              </p>
            </div>

            {/* Tech Stack */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Technologies Used
              </label>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {(snapshot.techStack || project.techStack || []).map((t: string) => (
                  <span
                    key={t}
                    className="px-2 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Submission Deliverables & Artifacts */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Submitted Deliverables
              </label>
              <div className="space-y-2">
                {(snapshot.repoUrl || project.repoUrl) && (
                  <a
                    href={snapshot.repoUrl || project.repoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium transition-colors"
                  >
                    <span className="flex items-center">
                      <Github className="w-4 h-4 mr-2 text-slate-900" /> Source Code Repository
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                  </a>
                )}

                {(snapshot.demoUrl || project.demoUrl) && (
                  <a
                    href={snapshot.demoUrl || project.demoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-3 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-xs font-semibold transition-colors"
                  >
                    <span className="flex items-center">
                      <ExternalLink className="w-4 h-4 mr-2" /> Live Working Demo
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 text-blue-500" />
                  </a>
                )}

                {(snapshot.videoUrl || project.videoUrl) && (
                  <a
                    href={snapshot.videoUrl || project.videoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-3 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 text-xs font-semibold transition-colors"
                  >
                    <span className="flex items-center">
                      <Video className="w-4 h-4 mr-2" /> Video Presentation / Pitch
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 text-purple-500" />
                  </a>
                )}

                {(snapshot.documentationUrl || project.documentationUrl) && (
                  <a
                    href={snapshot.documentationUrl || project.documentationUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium transition-colors"
                  >
                    <span className="flex items-center">
                      <FileText className="w-4 h-4 mr-2 text-slate-600" /> Architecture & Docs
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Rubric Criteria Scoring Panel (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Criterion-Level Evaluation</h2>
                <p className="text-xs text-slate-500">
                  Score each criterion accurately. Weighted scores are calculated authoritative on the server.
                </p>
              </div>
              <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200">
                {rubric.criteria.length} Criteria
              </span>
            </div>

            {/* Criteria List */}
            <div className="space-y-6">
              {rubric.criteria.map((c, idx) => {
                const currentScore = scores[c.id] ?? '';
                const normalized =
                  c.maxScore > 0 && typeof currentScore === 'number'
                    ? (currentScore / c.maxScore) * 100
                    : 0;
                const contribution = normalized * (c.weightPercentage / 100);

                return (
                  <div
                    key={c.id}
                    className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-4 hover:border-slate-300 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-black text-slate-400">#{idx + 1}</span>
                          <h3 className="text-sm font-bold text-slate-900">{c.title}</h3>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">{c.description}</p>
                      </div>

                      <div className="flex items-center space-x-3 self-end sm:self-center">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                          Weight: {c.weightPercentage}%
                        </span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                          Max: {c.maxScore}
                        </span>
                      </div>
                    </div>

                    {/* Score Input & Preview */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-2 border-t border-slate-200/60">
                      <div className="flex items-center space-x-3">
                        <label className="text-xs font-semibold text-slate-700">Awarded Score:</label>
                        <input
                          type="number"
                          disabled={isLocked}
                          min={0}
                          max={c.maxScore}
                          step={0.5}
                          value={currentScore}
                          onChange={(e) =>
                            handleScoreChange(c.id, parseFloat(e.target.value) || 0, c.maxScore)
                          }
                          className="w-24 px-3 py-1.5 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white disabled:bg-slate-100"
                        />
                        <span className="text-xs text-slate-400 font-medium">/ {c.maxScore}</span>
                      </div>

                      <div className="text-xs text-slate-500 sm:text-right font-medium">
                        Contribution: <strong className="text-purple-600 font-bold">{contribution.toFixed(2)} pts</strong>
                      </div>
                    </div>

                    {/* Criterion Feedback */}
                    <div>
                      <input
                        type="text"
                        disabled={isLocked}
                        placeholder={`Specific feedback for ${c.title} (optional)...`}
                        value={criterionFeedback[c.id] || ''}
                        onChange={(e) =>
                          setCriterionFeedback((prev) => ({ ...prev, [c.id]: e.target.value }))
                        }
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white disabled:bg-slate-100"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Qualitative Feedback Sections */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Qualitative Review & Feedback</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700">Key Strengths (Pros)</label>
                  <textarea
                    rows={3}
                    disabled={isLocked}
                    value={prosComment}
                    onChange={(e) => setProsComment(e.target.value)}
                    placeholder="Highlighted innovative features, strong architecture..."
                    className="mt-1 w-full p-3 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-slate-100"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Areas of Improvement (Cons)</label>
                  <textarea
                    rows={3}
                    disabled={isLocked}
                    value={consComment}
                    onChange={(e) => setConsComment(e.target.value)}
                    placeholder="Potential vulnerabilities, missing edge cases, UI polish..."
                    className="mt-1 w-full p-3 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Suggestions for the Team</label>
                <textarea
                  rows={2}
                  disabled={isLocked}
                  value={suggestions}
                  onChange={(e) => setSuggestions(e.target.value)}
                  placeholder="Actionable advice for scaling and future production roadmap..."
                  className="mt-1 w-full p-3 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-slate-100"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Private Notes (Organizer-Only)</label>
                <textarea
                  rows={2}
                  disabled={isLocked}
                  value={privateNotes}
                  onChange={(e) => setPrivateNotes(e.target.value)}
                  placeholder="Confidential remarks for hackathon organizers only..."
                  className="mt-1 w-full p-3 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-slate-100"
                />
              </div>
            </div>

            {/* Submission Actions */}
            {!isLocked ? (
              <div className="flex flex-col sm:flex-row justify-end items-center gap-3 pt-6 border-t border-slate-100">
                <button
                  type="button"
                  disabled={saving || submitting}
                  onClick={handleSaveDraft}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center justify-center disabled:opacity-50"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Draft'}
                </button>

                <button
                  type="button"
                  disabled={saving || submitting}
                  onClick={handleSubmitEvaluation}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 shadow-md shadow-purple-200 transition-colors flex items-center justify-center disabled:opacity-50"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {submitting ? 'Submitting...' : 'Submit & Lock Evaluation'}
                </button>
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center text-xs text-slate-500 flex items-center justify-center space-x-2">
                <Lock className="w-4 h-4 text-slate-400" />
                <span>This evaluation was officially submitted and is locked for historical immutability.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
