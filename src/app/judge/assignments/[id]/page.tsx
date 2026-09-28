'use client';

import React, { useEffect, useState, useCallback } from 'react';
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
  KeyRound,
  Edit3,
  Check,
  X,
  Sparkles,
  RefreshCw,
  History,
} from 'lucide-react';
import { useWebSocket } from '@/hooks/useWebSocket';

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

interface EditRequestItem {
  id: string;
  criterionId: string;
  criterionTitle: string;
  oldScore: number;
  requestedScore: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'CODE_ISSUED' | 'REJECTED' | 'EXPIRED' | 'EXECUTED';
  authCodePlain?: string | null;
  authCodeExpiresAt?: string | null;
  rejectedReason?: string | null;
  approvedByType?: string | null;
  createdAt: string;
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
    version?: number;
    prosComment?: string | null;
    consComment?: string | null;
    suggestions?: string | null;
    privateNotes?: string | null;
    scores: {
      criterionId: string;
      rawScore: number;
      originalScore?: number | null;
      feedback?: string | null;
    }[];
    editRequests?: EditRequestItem[];
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

  // Edit Request State
  const [editRequests, setEditRequests] = useState<EditRequestItem[]>([]);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [selectedCriterionForEdit, setSelectedCriterionForEdit] = useState<RubricCriterion | null>(null);
  const [requestedScore, setRequestedScore] = useState<number>(0);
  const [editReason, setEditReason] = useState('');
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);

  // Authorization PIN Execution State
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [activeApprovedRequest, setActiveApprovedRequest] = useState<EditRequestItem | null>(null);
  const [pinDigits, setPinDigits] = useState(['', '', '', '']);
  const [executingPin, setExecutingPin] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);

  const isLocked = assignment?.evaluation?.status === 'SUBMITTED';

  // WebSocket Live Real-Time Integration
  const { subscribe } = useWebSocket();

  const loadAssignment = useCallback(async () => {
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

        if (evalData.editRequests) {
          setEditRequests(evalData.editRequests);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Error loading assignment');
    } finally {
      setLoading(false);
    }
  }, [assignmentId]);

  useEffect(() => {
    loadAssignment();
  }, [loadAssignment]);

  // Real-time Event Subscriptions
  useEffect(() => {
    const unsubApprove = subscribe('MARK_EDIT_APPROVED', (evt) => {
      setSuccessMsg(
        `🎉 Mark Edit Request Approved! Authorization Code: ${evt.data?.payload?.authorizationCode || 'Available in request drawer'}`
      );
      loadAssignment();
    });

    const unsubReject = subscribe('MARK_EDIT_REJECTED', (evt) => {
      setError(`Mark Edit Request was rejected: ${evt.data?.payload?.rejectedReason || 'Declined'}`);
      loadAssignment();
    });

    const unsubExec = subscribe('MARK_EDIT_EXECUTED', () => {
      setSuccessMsg('Mark successfully updated and score recalculated.');
      loadAssignment();
    });

    return () => {
      unsubApprove();
      unsubReject();
      unsubExec();
    };
  }, [subscribe, loadAssignment]);

  // Calculate Weighted Preview
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

    const unscored = rubric.criteria.filter((c) => scores[c.id] === undefined);
    if (unscored.length > 0) {
      setError(`Please provide a score for all ${rubric.criteria.length} criteria before submitting.`);
      return;
    }

    if (
      !confirm(
        'Are you sure you want to submit this evaluation? Once submitted, your evaluation will be locked and cannot be modified without Admin/Organizer authorization.'
      )
    ) {
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
      loadAssignment();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Open Request Mark Edit Modal
  const openRequestEditModal = (criterion: RubricCriterion) => {
    setSelectedCriterionForEdit(criterion);
    setRequestedScore(scores[criterion.id] ?? 0);
    setEditReason('');
    setRequestError(null);
    setIsRequestModalOpen(true);
  };

  // Submit Mark Edit Request
  const handleSendEditRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCriterionForEdit || !assignment?.evaluation) return;

    if (!editReason || editReason.trim().length < 3) {
      setRequestError('A detailed reason is mandatory.');
      return;
    }

    try {
      setSubmittingRequest(true);
      setRequestError(null);

      const res = await fetch('/api/v1/judge/evaluations/edit-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          evaluationId: assignment.evaluation.id,
          criterionId: selectedCriterionForEdit.id,
          requestedScore,
          reason: editReason.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to submit edit request.');
      }

      setIsRequestModalOpen(false);
      setSuccessMsg('Mark edit request submitted! Admin/Organizer has been notified.');
      loadAssignment();
    } catch (err: any) {
      setRequestError(err.message);
    } finally {
      setSubmittingRequest(false);
    }
  };

  // Open 4-Digit PIN Modal
  const openPinModal = (req: EditRequestItem) => {
    setActiveApprovedRequest(req);
    setPinDigits(['', '', '', '']);
    setPinError(null);
    setIsPinModalOpen(true);
  };

  // Handle PIN Digit Typing
  const handleDigitChange = (index: number, val: string) => {
    const cleanVal = val.replace(/\D/g, '').slice(-1);
    const newDigits = [...pinDigits];
    newDigits[index] = cleanVal;
    setPinDigits(newDigits);

    // Auto focus next input
    if (cleanVal && index < 3) {
      const nextInput = document.getElementById(`pin-digit-${index + 1}`);
      nextInput?.focus();
    }
  };

  // Execute Mark Edit with PIN
  const handleExecutePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeApprovedRequest) return;

    const fullPin = pinDigits.join('');
    if (fullPin.length !== 4) {
      setPinError('Please enter the complete 4-digit authorization code.');
      return;
    }

    try {
      setExecutingPin(true);
      setPinError(null);

      const res = await fetch('/api/v1/judge/evaluations/execute-edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: activeApprovedRequest.id,
          authorizationCode: fullPin,
          newScore: activeApprovedRequest.requestedScore,
          expectedVersion: assignment?.evaluation?.version,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to authorize mark edit.');
      }

      setIsPinModalOpen(false);
      setSuccessMsg(`Mark updated to ${activeApprovedRequest.requestedScore} and score recalculated!`);
      loadAssignment();
    } catch (err: any) {
      setPinError(err.message);
    } finally {
      setExecutingPin(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-[#64748B]">Loading evaluation studio...</p>
        </div>
      </div>
    );
  }

  if (error && !assignment) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl p-6 border border-[#CBD5E1] shadow-sm text-center">
          <AlertCircle className="w-12 h-12 text-[#DC2626] mx-auto mb-3" />
          <h2 className="text-lg font-bold text-[#0F172A] mb-1">Access Restricted</h2>
          <p className="text-sm text-[#64748B] mb-5">{error}</p>
          <Link
            href="/judge/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#2563EB] text-white text-sm font-semibold rounded-xl shadow-xs hover:bg-[#1D4ED8] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const project = assignment?.project;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-16">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-[#E2E8F0] px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-4">
          <Link
            href="/judge/dashboard"
            className="p-2 text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] rounded-xl transition-colors"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-base sm:text-lg font-bold text-[#0F172A] truncate max-w-[280px] sm:max-w-md">
                {project?.title || 'Evaluation Studio'}
              </h1>
              {isLocked ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-bold bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] rounded-full">
                  <Lock className="w-3.5 h-3.5" /> Locked (Submitted)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-bold bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A] rounded-full">
                  <Edit3 className="w-3.5 h-3.5" /> Draft In Progress
                </span>
              )}
            </div>
            <p className="text-xs text-[#64748B]">
              Team: <strong className="text-[#334155]">{project?.team.name}</strong> • Track:{' '}
              <strong className="text-[#334155]">{project?.track.title}</strong>
            </p>
          </div>
        </div>

        {/* Live Weighted Score Pill */}
        <div className="flex items-center gap-3">
          <div className="bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3.5 py-1.5 flex items-center gap-2">
            <Scale className="w-4 h-4 text-[#2563EB]" />
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">Weighted Score</p>
              <p className="text-sm font-extrabold text-[#0F172A]">{weightedTotal} / 100</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Studio Split Layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {/* Banner Messages */}
        {error && (
          <div className="mb-4 p-4 bg-[#FEF2F2] border border-[#FECACA] rounded-xl text-sm font-semibold text-[#DC2626] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)} className="text-[#DC2626] hover:opacity-75">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-4 bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl text-sm font-semibold text-[#16A34A] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg(null)} className="text-[#16A34A] hover:opacity-75">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Active Edit Requests Drawer/Bar */}
        {editRequests.length > 0 && (
          <div className="mb-6 bg-white border border-[#CBD5E1] rounded-2xl p-4 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-[#2563EB]" />
                <h3 className="text-sm font-bold text-[#0F172A]">Mark Edit Requests for this Submission</h3>
              </div>
              <span className="text-xs text-[#64748B]">{editRequests.length} recorded</span>
            </div>

            <div className="space-y-2">
              {editRequests.map((req) => (
                <div
                  key={req.id}
                  className="flex items-center justify-between p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs"
                >
                  <div className="space-y-1">
                    <p className="font-bold text-[#0F172A]">
                      {req.criterionTitle}: {req.oldScore} → {req.requestedScore}
                    </p>
                    <p className="text-[#64748B] italic">Reason: &ldquo;{req.reason}&rdquo;</p>
                  </div>

                  <div className="flex items-center gap-3">
                    {req.status === 'PENDING' && (
                      <span className="px-2.5 py-1 bg-[#FEF3C7] text-[#D97706] font-bold rounded-lg border border-[#FDE68A]">
                        Pending Organizer / Admin Review
                      </span>
                    )}

                    {req.status === 'APPROVED' && (
                      <button
                        onClick={() => openPinModal(req)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#16A34A] hover:bg-[#15803D] text-white font-bold rounded-lg shadow-xs transition-colors"
                      >
                        <KeyRound className="w-3.5 h-3.5" /> Enter 4-Digit Code
                      </button>
                    )}

                    {req.status === 'REJECTED' && (
                      <span className="px-2.5 py-1 bg-[#FEE2E2] text-[#DC2626] font-bold rounded-lg border border-[#FECACA]">
                        Rejected: {req.rejectedReason || 'Declined'}
                      </span>
                    )}

                    {req.status === 'EXECUTED' && (
                      <span className="px-2.5 py-1 bg-[#EFF6FF] text-[#2563EB] font-bold rounded-lg border border-[#BFDBFE]">
                        ✓ Executed (Updated)
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT: Project Artifacts & Deliverables (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white border border-[#CBD5E1] rounded-2xl p-5 sm:p-6 shadow-2xs space-y-5">
              <div>
                <span className="px-2.5 py-0.5 text-[11px] font-bold bg-[#EFF6FF] text-[#2563EB] rounded-full border border-[#BFDBFE]">
                  {project?.problemStatement.code}
                </span>
                <h2 className="text-lg font-bold text-[#0F172A] mt-2">{project?.title}</h2>
                {project?.tagline && <p className="text-sm font-semibold text-[#475569] mt-0.5">{project.tagline}</p>}
              </div>

              {/* Resource Launch Links */}
              <div className="grid grid-cols-2 gap-2.5 pt-2">
                {project?.repoUrl && (
                  <a
                    href={project.repoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 p-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs font-bold text-[#0F172A] hover:bg-[#F1F5F9] transition-colors"
                  >
                    <Github className="w-4 h-4 text-[#0F172A]" /> View GitHub Repo
                  </a>
                )}
                {project?.demoUrl && (
                  <a
                    href={project.demoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 p-2.5 bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl text-xs font-bold text-[#2563EB] hover:bg-[#DBEAFE] transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" /> Live Demo
                  </a>
                )}
                {project?.videoUrl && (
                  <a
                    href={project.videoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 p-2.5 bg-[#FAF5FF] border border-[#E9D5FF] rounded-xl text-xs font-bold text-[#7E22CE] hover:bg-[#F3E8FF] transition-colors"
                  >
                    <Video className="w-4 h-4" /> Pitch Video
                  </a>
                )}
                {project?.documentationUrl && (
                  <a
                    href={project.documentationUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 p-2.5 bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl text-xs font-bold text-[#16A34A] hover:bg-[#DCFCE7] transition-colors"
                  >
                    <FileText className="w-4 h-4" /> Architecture Docs
                  </a>
                )}
              </div>

              {/* Description Body */}
              <div className="border-t border-[#E2E8F0] pt-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748B] mb-2">Project Overview</h3>
                <p className="text-xs sm:text-sm text-[#334155] leading-relaxed whitespace-pre-wrap">
                  {project?.description}
                </p>
              </div>

              {/* Tech Stack */}
              {project?.techStack && project.techStack.length > 0 && (
                <div className="border-t border-[#E2E8F0] pt-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748B] mb-2">Technologies Used</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {project.techStack.map((t, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 text-xs font-medium bg-[#F1F5F9] text-[#334155] rounded-lg border border-[#E2E8F0]"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Rubric Scoring Studio (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white border border-[#CBD5E1] rounded-2xl p-5 sm:p-6 shadow-2xs space-y-6">
              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-[#0F172A]">Rubric Evaluation Panel</h2>
                  <p className="text-xs text-[#64748B]">
                    Rubric: <strong className="text-[#334155]">{rubric?.name}</strong> (v{rubric?.version})
                  </p>
                </div>
                {isLocked && (
                  <span className="text-xs text-[#64748B] flex items-center gap-1 bg-[#F8FAFC] px-3 py-1.5 rounded-xl border border-[#CBD5E1]">
                    <ShieldCheck className="w-4 h-4 text-[#2563EB]" /> Zero-Tamper Guard Active
                  </span>
                )}
              </div>

              {/* Criteria List */}
              <div className="space-y-5">
                {rubric?.criteria.map((c) => {
                  const currentScore = scores[c.id] ?? 0;
                  const activeRequest = editRequests.find(
                    (r) => r.criterionId === c.id && ['PENDING', 'APPROVED'].includes(r.status)
                  );

                  return (
                    <div
                      key={c.id}
                      className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl hover:border-[#CBD5E1] transition-colors space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-[#0F172A]">{c.title}</h4>
                            <span className="px-2 py-0.5 text-[10px] font-extrabold bg-[#EFF6FF] text-[#2563EB] rounded-md border border-[#BFDBFE]">
                              Weight: {c.weightPercentage}%
                            </span>
                          </div>
                          <p className="text-xs text-[#64748B] mt-0.5">{c.description}</p>
                        </div>

                        {/* Mark Badge or Edit Request Button */}
                        <div className="flex items-center gap-2">
                          <span className="text-base font-extrabold text-[#0F172A] bg-white border border-[#CBD5E1] px-3 py-1 rounded-xl shadow-2xs">
                            {currentScore} / {c.maxScore}
                          </span>

                          {isLocked && !activeRequest && (
                            <button
                              type="button"
                              onClick={() => openRequestEditModal(c)}
                              className="p-1.5 text-[#2563EB] hover:bg-[#EFF6FF] border border-[#BFDBFE] rounded-lg transition-colors"
                              title="Request Mark Edit"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Slider & Numeric Input (Enabled only when NOT locked) */}
                      {!isLocked ? (
                        <div className="flex items-center gap-4 pt-1">
                          <input
                            type="range"
                            min="0"
                            max={c.maxScore}
                            step="1"
                            value={currentScore}
                            onChange={(e) => handleScoreChange(c.id, parseFloat(e.target.value), c.maxScore)}
                            className="flex-1 accent-[#2563EB] cursor-pointer"
                          />
                          <input
                            type="number"
                            min="0"
                            max={c.maxScore}
                            value={currentScore}
                            onChange={(e) =>
                              handleScoreChange(c.id, parseFloat(e.target.value) || 0, c.maxScore)
                            }
                            className="w-16 px-2.5 py-1 text-sm font-bold text-center border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                          />
                        </div>
                      ) : (
                        activeRequest && (
                          <div className="mt-2 p-2.5 bg-white border border-[#BFDBFE] rounded-lg flex items-center justify-between text-xs">
                            <span className="text-[#2563EB] font-semibold">
                              Edit Request {activeRequest.status}: {activeRequest.oldScore} →{' '}
                              {activeRequest.requestedScore}
                            </span>
                            {activeRequest.status === 'APPROVED' && (
                              <button
                                onClick={() => openPinModal(activeRequest)}
                                className="px-2 py-1 bg-[#16A34A] text-white font-bold rounded-md shadow-2xs hover:bg-[#15803D]"
                              >
                                Enter PIN
                              </button>
                            )}
                          </div>
                        )
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Qualitative Feedback Fields */}
              <div className="space-y-4 border-t border-[#E2E8F0] pt-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#475569] mb-1">
                    Key Strengths (Visible to Team)
                  </label>
                  <textarea
                    rows={2}
                    disabled={isLocked}
                    value={prosComment}
                    onChange={(e) => setProsComment(e.target.value)}
                    placeholder="Highlight the exceptional achievements or technical innovations..."
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-[#CBD5E1] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563EB] disabled:bg-[#F8FAFC] disabled:text-[#64748B]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#475569] mb-1">
                    Areas for Improvement (Visible to Team)
                  </label>
                  <textarea
                    rows={2}
                    disabled={isLocked}
                    value={consComment}
                    onChange={(e) => setConsComment(e.target.value)}
                    placeholder="Provide constructive feedback for future iterations..."
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-[#CBD5E1] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563EB] disabled:bg-[#F8FAFC] disabled:text-[#64748B]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#475569] mb-1">
                    Private Notes (Confidential to Organizers Only)
                  </label>
                  <textarea
                    rows={2}
                    disabled={isLocked}
                    value={privateNotes}
                    onChange={(e) => setPrivateNotes(e.target.value)}
                    placeholder="Confidential notes regarding originality, depth, or specific jury observations..."
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-[#CBD5E1] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563EB] disabled:bg-[#F8FAFC] disabled:text-[#64748B]"
                  />
                </div>
              </div>

              {/* Actions Footer */}
              {!isLocked ? (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 border-t border-[#E2E8F0] pt-4">
                  <button
                    type="button"
                    disabled={saving || submitting}
                    onClick={handleSaveDraft}
                    className="inline-flex items-center justify-center gap-2 px-4 py-3 sm:py-2.5 bg-white border border-[#CBD5E1] text-[#0F172A] hover:bg-[#F8FAFC] text-xs sm:text-sm font-bold rounded-xl transition-colors shadow-2xs min-h-[44px]"
                  >
                    <Save className="w-4 h-4 text-[#64748B]" /> {saving ? 'Saving Draft...' : 'Save Draft'}
                  </button>

                  <button
                    type="button"
                    disabled={saving || submitting}
                    onClick={handleSubmitEvaluation}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 sm:py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs sm:text-sm font-bold rounded-xl transition-colors shadow-xs min-h-[44px]"
                  >
                    <Send className="w-4 h-4" /> {submitting ? 'Submitting...' : 'Submit & Lock Evaluation 🔒'}
                  </button>
                </div>
              ) : (
                <div className="p-4 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-[#64748B]">
                    <Lock className="w-4 h-4 text-[#2563EB]" />
                    <span>Evaluation is locked. Use the edit button next to a criterion to request changes.</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* MODAL 1: Request Mark Edit */}
      {isRequestModalOpen && selectedCriterionForEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-[#CBD5E1] shadow-xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-[#2563EB]" />
                <h3 className="text-base font-bold text-[#0F172A]">Request Mark Edit</h3>
              </div>
              <button
                onClick={() => setIsRequestModalOpen(false)}
                className="text-[#64748B] hover:text-[#0F172A] p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {requestError && (
              <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-xl text-xs font-semibold text-[#DC2626]">
                {requestError}
              </div>
            )}

            <form onSubmit={handleSendEditRequest} className="space-y-4">
              <div>
                <p className="text-xs text-[#64748B]">Criterion</p>
                <p className="text-sm font-bold text-[#0F172A]">{selectedCriterionForEdit.title}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
                  <p className="text-[11px] text-[#64748B]">Current Mark</p>
                  <p className="text-base font-extrabold text-[#0F172A]">
                    {scores[selectedCriterionForEdit.id] ?? 0} / {selectedCriterionForEdit.maxScore}
                  </p>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#475569] mb-1">Requested New Mark</label>
                  <input
                    type="number"
                    min="0"
                    max={selectedCriterionForEdit.maxScore}
                    required
                    value={requestedScore}
                    onChange={(e) => setRequestedScore(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-sm font-bold border border-[#CBD5E1] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#475569] mb-1">
                  Reason / Explanation <span className="text-[#DC2626]">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  placeholder="Explain why this mark adjustment is needed (e.g. recalculation error, revised review)..."
                  className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRequestModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-[#64748B] hover:bg-[#F1F5F9] rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingRequest}
                  className="px-5 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                >
                  {submittingRequest ? 'Submitting...' : 'Send Request to Organizer/Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Enter 4-Digit Authorization PIN */}
      {isPinModalOpen && activeApprovedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 border border-[#CBD5E1] shadow-xl space-y-4 animate-in fade-in zoom-in-95 text-center">
            <div className="w-12 h-12 bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] rounded-2xl flex items-center justify-center mx-auto shadow-2xs">
              <KeyRound className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-[#0F172A]">Enter Authorization Code</h3>
              <p className="text-xs text-[#64748B] mt-1">
                Enter the 4-digit code provided in your approval notification to authorize editing{' '}
                <strong>{activeApprovedRequest.criterionTitle}</strong> to{' '}
                <strong>{activeApprovedRequest.requestedScore}</strong>.
              </p>
            </div>

            {pinError && (
              <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-xl text-xs font-semibold text-[#DC2626]">
                {pinError}
              </div>
            )}

            <form onSubmit={handleExecutePin} className="space-y-4">
              <div className="flex justify-center gap-2.5 my-2">
                {pinDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    id={`pin-digit-${idx}`}
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleDigitChange(idx, e.target.value)}
                    className="w-12 h-12 text-center text-xl font-extrabold border-2 border-[#CBD5E1] focus:border-[#2563EB] rounded-xl focus:outline-none transition-colors"
                  />
                ))}
              </div>

              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPinModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-[#64748B] hover:bg-[#F1F5F9] rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={executingPin}
                  className="px-5 py-2 bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                >
                  {executingPin ? 'Verifying...' : 'Authorize & Update Mark'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
