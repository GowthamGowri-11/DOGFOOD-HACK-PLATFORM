'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  FileEdit,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  RefreshCw,
  AlertCircle,
  KeyRound,
  ShieldAlert,
  ArrowRight,
  Eye,
  Check,
  X,
} from 'lucide-react';
import { useWebSocket } from '@/hooks/useWebSocket';

interface EditRequest {
  id: string;
  evaluationId: string;
  judgeUserId: string;
  hackathonId: string;
  roundId?: string | null;
  subRoundId?: string | null;
  teamId: string;
  projectId: string;
  criterionId: string;
  criterionTitle: string;
  oldScore: number;
  requestedScore: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'CODE_ISSUED' | 'REJECTED' | 'EXPIRED' | 'EXECUTED';
  authCodeMasked?: string | null;
  authCodePlain?: string | null;
  authCodeExpiresAt?: string | null;
  approvedByType?: string | null;
  approvedAt?: string | null;
  rejectedReason?: string | null;
  rejectedAt?: string | null;
  executedAt?: string | null;
  createdAt: string;
  project: {
    title: string;
    team: { name: string };
    track: { title: string };
  };
  judge: {
    user: { fullName: string; email: string; avatarUrl?: string | null };
  };
  hackathon: {
    id: string;
    title: string;
  };
}

export default function OrganizerMarkEditRequestsPage() {
  const [requests, setRequests] = useState<EditRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Review Modal State
  const [selectedRequest, setSelectedRequest] = useState<EditRequest | null>(null);
  const [actionType, setActionType] = useState<'APPROVE' | 'REJECT' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState<string | null>(null);
  const [generatedPin, setGeneratedPin] = useState<string | null>(null);

  const { subscribe } = useWebSocket();

  const loadRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (searchQuery) params.append('search', searchQuery);

      const res = await fetch(`/api/v1/organizer/evaluations/edit-requests?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to load edit requests.');
      }

      setRequests(data.data.items || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchQuery]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  // Real-time Event Subscription
  useEffect(() => {
    const unsubReq = subscribe('MARK_EDIT_REQUESTED', () => loadRequests());
    const unsubApp = subscribe('MARK_EDIT_APPROVED', () => loadRequests());
    const unsubRej = subscribe('MARK_EDIT_REJECTED', () => loadRequests());
    const unsubExec = subscribe('MARK_EDIT_EXECUTED', () => loadRequests());

    return () => {
      unReq();
      unsubApp();
      unsubRej();
      unsubExec();
    };
    function unReq() {
      unsubReq();
    }
  }, [subscribe, loadRequests]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest || !actionType) return;

    try {
      setSubmittingReview(true);
      setError(null);
      setGeneratedPin(null);

      const res = await fetch(`/api/v1/organizer/evaluations/edit-requests/${selectedRequest.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: actionType,
          rejectionReason: actionType === 'REJECT' ? rejectionReason : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to submit review.');
      }

      if (actionType === 'APPROVE') {
        setGeneratedPin(data.data?.authorizationCode || null);
        setReviewSuccessMsg('Edit request approved! 4-digit code generated and delivered to the judge.');
      } else {
        setReviewSuccessMsg('Edit request rejected.');
        setSelectedRequest(null);
        setActionType(null);
      }

      loadRequests();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmittingReview(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="px-2.5 py-1 text-xs font-extrabold bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A] rounded-lg">
            Pending Review
          </span>
        );
      case 'APPROVED':
      case 'CODE_ISSUED':
        return (
          <span className="px-2.5 py-1 text-xs font-extrabold bg-[#DCFCE7] text-[#16A34A] border border-[#BBF7D0] rounded-lg">
            Approved (Code Issued)
          </span>
        );
      case 'REJECTED':
        return (
          <span className="px-2.5 py-1 text-xs font-extrabold bg-[#FEE2E2] text-[#DC2626] border border-[#FECACA] rounded-lg">
            Rejected
          </span>
        );
      case 'EXECUTED':
        return (
          <span className="px-2.5 py-1 text-xs font-extrabold bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] rounded-lg">
            ✓ Executed
          </span>
        );
      default:
        return <span className="px-2.5 py-1 text-xs font-bold bg-gray-100 text-gray-700 rounded-lg">{status}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <FileEdit className="w-6 h-6 text-[#2563EB]" />
              <h1 className="text-xl sm:text-2xl font-bold text-[#0F172A]">Evaluation Mark Edit Requests</h1>
            </div>
            <p className="text-xs sm:text-sm text-[#64748B] mt-1">
              Review and authorize score adjustments requested by jury members across your hackathons.
            </p>
          </div>

          <button
            onClick={loadRequests}
            className="self-start sm:self-auto inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-[#CBD5E1] hover:bg-[#F1F5F9] text-xs font-bold text-[#0F172A] rounded-xl shadow-2xs transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh Requests
          </button>
        </div>

        {/* Global Messages */}
        {reviewSuccessMsg && (
          <div className="p-4 bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl text-sm font-semibold text-[#16A34A] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>{reviewSuccessMsg}</span>
            </div>
            <button onClick={() => setReviewSuccessMsg(null)} className="text-[#16A34A] hover:opacity-75">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {error && (
          <div className="p-4 bg-[#FEF2F2] border border-[#FECACA] rounded-xl text-sm font-semibold text-[#DC2626] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)} className="text-[#DC2626] hover:opacity-75">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Filter & Search Bar */}
        <div className="bg-white border border-[#CBD5E1] rounded-2xl p-4 shadow-2xs flex flex-col md:flex-row gap-4 justify-between items-center">
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
            {['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'EXECUTED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors ${
                  statusFilter === st
                    ? 'bg-[#2563EB] text-white shadow-xs'
                    : 'bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0]'
                }`}
              >
                {st === 'ALL' ? 'All Requests' : st.charAt(0) + st.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search team, judge, criterion..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-[#CBD5E1] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            />
          </div>
        </div>

        {/* Requests Table */}
        <div className="bg-white border border-[#CBD5E1] rounded-2xl shadow-2xs overflow-hidden">
          {loading ? (
            <div className="py-16 text-center text-sm font-semibold text-[#64748B]">Loading requests...</div>
          ) : requests.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <FileEdit className="w-10 h-10 text-[#94A3B8] mx-auto" />
              <p className="text-sm font-bold text-[#0F172A]">No edit requests found</p>
              <p className="text-xs text-[#64748B]">No score edit requests match the selected filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#475569] uppercase font-extrabold tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">Hackathon / Team</th>
                    <th className="px-5 py-3.5">Judge</th>
                    <th className="px-5 py-3.5">Criterion & Mark Change</th>
                    <th className="px-5 py-3.5">Reason</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {requests.map((req) => (
                    <tr key={req.id} className="hover:bg-[#F8FAFC]/80 transition-colors">
                      <td className="px-5 py-4">
                        <p className="font-bold text-[#0F172A]">{req.project.team.name}</p>
                        <p className="text-[#64748B]">{req.project.title}</p>
                        <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-bold bg-[#EFF6FF] text-[#2563EB] rounded-md">
                          {req.hackathon.title}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-bold text-[#0F172A]">{req.judge.user.fullName}</p>
                        <p className="text-[#64748B]">{req.judge.user.email}</p>
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-bold text-[#0F172A]">{req.criterionTitle}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="font-bold text-[#DC2626]">{req.oldScore}</span>
                          <ArrowRight className="w-3 h-3 text-[#94A3B8]" />
                          <span className="font-extrabold text-[#16A34A]">{req.requestedScore}</span>
                        </div>
                      </td>

                      <td className="px-5 py-4 max-w-xs">
                        <p className="text-[#334155] italic line-clamp-2">&ldquo;{req.reason}&rdquo;</p>
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap">
                        {getStatusBadge(req.status)}
                        {req.approvedByType && (
                          <p className="text-[10px] text-[#64748B] mt-1 font-semibold">
                            By {req.approvedByType === 'ADMIN' ? 'Platform Admin' : 'Organizer'}
                          </p>
                        )}
                      </td>

                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        {req.status === 'PENDING' ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setSelectedRequest(req);
                                setActionType('APPROVE');
                                setGeneratedPin(null);
                              }}
                              className="px-3 py-1.5 bg-[#16A34A] hover:bg-[#15803D] text-white font-bold rounded-lg shadow-2xs transition-colors"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => {
                                setSelectedRequest(req);
                                setActionType('REJECT');
                                setRejectionReason('');
                                setGeneratedPin(null);
                              }}
                              className="px-3 py-1.5 bg-white border border-[#CBD5E1] text-[#DC2626] hover:bg-[#FEF2F2] font-bold rounded-lg transition-colors"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-[#94A3B8] font-semibold">Review Complete</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Review Modal */}
      {selectedRequest && actionType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-[#CBD5E1] shadow-xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <h3 className="text-base font-bold text-[#0F172A]">
                {actionType === 'APPROVE' ? 'Approve Mark Edit Request' : 'Reject Mark Edit Request'}
              </h3>
              <button
                onClick={() => {
                  setSelectedRequest(null);
                  setActionType(null);
                  setGeneratedPin(null);
                }}
                className="text-[#64748B] hover:text-[#0F172A]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs bg-[#F8FAFC] p-3.5 rounded-xl border border-[#E2E8F0]">
              <div className="flex justify-between">
                <span className="text-[#64748B]">Team:</span>
                <span className="font-bold text-[#0F172A]">{selectedRequest.project.team.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Judge:</span>
                <span className="font-bold text-[#0F172A]">{selectedRequest.judge.user.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Criterion:</span>
                <span className="font-bold text-[#0F172A]">{selectedRequest.criterionTitle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Score Adjustment:</span>
                <span className="font-extrabold text-[#0F172A]">
                  {selectedRequest.oldScore} → {selectedRequest.requestedScore}
                </span>
              </div>
              <div>
                <span className="text-[#64748B]">Judge Reason:</span>
                <p className="font-medium text-[#334155] italic mt-0.5">&ldquo;{selectedRequest.reason}&rdquo;</p>
              </div>
            </div>

            {generatedPin ? (
              <div className="p-4 bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl text-center space-y-2">
                <p className="text-xs font-bold text-[#16A34A]">Authorization PIN Generated</p>
                <p className="text-2xl font-extrabold tracking-widest text-[#0F172A] font-mono">{generatedPin}</p>
                <p className="text-[11px] text-[#64748B]">
                  This PIN has also been automatically delivered to the judge via real-time notification.
                </p>
                <button
                  onClick={() => {
                    setSelectedRequest(null);
                    setActionType(null);
                    setGeneratedPin(null);
                  }}
                  className="mt-3 px-4 py-2 bg-[#2563EB] text-white font-bold rounded-xl text-xs"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleReviewSubmit} className="space-y-4">
                {actionType === 'REJECT' && (
                  <div>
                    <label className="block text-xs font-bold text-[#475569] mb-1">
                      Reason for Rejection <span className="text-[#DC2626]">*</span>
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Explain why this edit cannot be granted..."
                      className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                    />
                  </div>
                )}

                {actionType === 'APPROVE' && (
                  <p className="text-xs text-[#64748B]">
                    Approving will generate a single-use 4-digit authorization code allowing the judge to update ONLY{' '}
                    <strong>{selectedRequest.criterionTitle}</strong> to{' '}
                    <strong>{selectedRequest.requestedScore}</strong>.
                  </p>
                )}

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRequest(null);
                      setActionType(null);
                    }}
                    className="px-4 py-2 text-xs font-bold text-[#64748B] hover:bg-[#F1F5F9] rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className={`px-5 py-2 text-white text-xs font-bold rounded-xl shadow-xs transition-colors ${
                      actionType === 'APPROVE' ? 'bg-[#16A34A] hover:bg-[#15803D]' : 'bg-[#DC2626] hover:bg-[#B91C1C]'
                    }`}
                  >
                    {submittingReview ? 'Processing...' : actionType === 'APPROVE' ? 'Confirm Approval' : 'Confirm Rejection'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
