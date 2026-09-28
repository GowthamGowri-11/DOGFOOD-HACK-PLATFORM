'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Award,
  Search,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  Plus,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Copy,
  Check,
  X,
  RefreshCw,
  Shield,
  FileCheck,
} from 'lucide-react';

interface CertificateItem {
  id: string;
  verificationCode: string;
  type: string;
  status: string;
  title: string;
  recipientName: string;
  issuedAt: string;
  revokedAt: string | null;
  revocationReason: string | null;
  user: {
    id: string;
    fullName: string;
    email: string;
  };
  hackathon: {
    id: string;
    title: string;
    slug: string;
  };
}

export default function AdminCertificatesPage() {
  const [certificates, setCertificates] = useState<CertificateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Issue modal
  const [issueModalOpen, setIssueModalOpen] = useState(false);
  const [hackathons, setHackathons] = useState<Array<{ id: string; title: string }>>([]);
  const [selectedHackathonId, setSelectedHackathonId] = useState('');
  const [issuing, setIssuing] = useState(false);
  const [issueMessage, setIssueMessage] = useState<string | null>(null);
  const [issueError, setIssueError] = useState<string | null>(null);

  // Revoke modal
  const [revokeModalOpen, setRevokeModalOpen] = useState(false);
  const [selectedCert, setSelectedCert] = useState<CertificateItem | null>(null);
  const [revokeReason, setRevokeReason] = useState('Code plagiarism or rules violation');
  const [revoking, setRevoking] = useState(false);

  // Copy feedback
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Toast feedback
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    showToast(`Verification code copied!`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Initials badge color styling
  const getInitialsBadgeStyle = (name: string) => {
    const styles = [
      'bg-orange-100/80 text-orange-700 border-orange-200',
      'bg-blue-50 text-blue-600 border-blue-200',
      'bg-purple-50 text-purple-600 border-purple-200',
      'bg-emerald-50 text-emerald-700 border-emerald-200',
      'bg-amber-50 text-amber-700 border-amber-200',
      'bg-rose-50 text-rose-600 border-rose-200',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
    return styles[hash % styles.length];
  };

  // Format date as M/D/YYYY
  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '—';
      return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
    } catch {
      return '—';
    }
  };

  const fetchCertificates = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: '10',
      });
      if (search.trim()) params.append('search', search.trim());
      if (statusFilter) params.append('status', statusFilter);

      const res = await fetch(`/api/v1/admin/certificates?${params.toString()}`);
      const json = await res.json();
      if (json.success && json.data) {
        setCertificates(json.data.certificates || []);
        setTotalPages(json.data.pagination?.totalPages || 1);
        setTotalCount(json.data.pagination?.total || 0);
      }
    } catch (err) {
      console.error('Failed to load certificates:', err);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchCertificates();
  }, [fetchCertificates]);

  const openIssueModal = async () => {
    setIssueMessage(null);
    setIssueError(null);
    try {
      const res = await fetch('/api/v1/admin/hackathons?pageSize=50');
      const json = await res.json();
      if (json.success && json.data?.hackathons) {
        setHackathons(json.data.hackathons);
        if (json.data.hackathons.length > 0) {
          setSelectedHackathonId(json.data.hackathons[0].id);
        }
        setIssueModalOpen(true);
      }
    } catch (err) {
      console.error('Failed to load hackathons:', err);
    }
  };

  const handleIssueCertificates = async () => {
    if (!selectedHackathonId) return;
    setIssuing(true);
    setIssueMessage(null);
    setIssueError(null);
    try {
      const res = await fetch('/api/v1/admin/certificates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hackathonId: selectedHackathonId }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'Certificates successfully generated!');
        setIssueModalOpen(false);
        fetchCertificates();
      } else {
        setIssueError(data.error?.message || 'Failed to issue certificates');
      }
    } catch {
      setIssueError('Network error while issuing certificates');
    } finally {
      setIssuing(false);
    }
  };

  const handleRevokeCertificate = async () => {
    if (!selectedCert) return;
    setRevoking(true);
    try {
      const res = await fetch(`/api/v1/admin/certificates/${selectedCert.id}/revoke`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: revokeReason }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Certificate ${selectedCert.verificationCode} revoked.`);
        setRevokeModalOpen(false);
        setSelectedCert(null);
        fetchCertificates();
      } else {
        showToast(data.error?.message || 'Failed to revoke certificate', 'error');
      }
    } catch (err) {
      console.error('Failed to revoke certificate:', err);
      showToast('Network error while revoking certificate', 'error');
    } finally {
      setRevoking(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20 select-none font-sans">
      {/* Toast Feedback */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 animate-in fade-in slide-in-from-top-3 duration-200">
          <div
            className={`px-4 py-3 rounded-2xl shadow-xl flex items-center space-x-2 text-xs font-semibold ${
              toast.type === 'success'
                ? 'bg-zinc-900 text-white border border-zinc-700'
                : 'bg-rose-600 text-white'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-white" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Breadcrumb Navigation */}
      <nav className="flex items-center space-x-2 text-xs text-zinc-400 font-medium">
        <Link href="/" className="hover:text-orange-600 transition-colors">
          Home
        </Link>
        <span>&rsaquo;</span>
        <Link href="/admin/dashboard" className="hover:text-orange-600 transition-colors">
          Admin
        </Link>
        <span>&rsaquo;</span>
        <span className="text-zinc-800 font-semibold">Certificates</span>
      </nav>

      {/* Header - Matching Image Reference */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 gap-4 border-b border-zinc-100">
        <div>
          {/* Top Badges */}
          <div className="flex items-center space-x-2.5 mb-1.5">
            <span className="text-[11px] font-bold text-orange-700 bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-200">
              Global Platform Control
            </span>
            <span className="text-xs font-semibold text-zinc-500">
              Total Issued: {totalCount}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-orange-50 border border-orange-200 text-[#FA541C] flex items-center justify-center flex-shrink-0 shadow-2xs">
              <ShieldCheck className="w-5 h-5 stroke-[2.3]" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">
                Digital Certificate Governance
              </h1>
              <p className="text-xs text-zinc-500 mt-0.5 font-normal">
                Cryptographically signed credentials, public verification endpoints, and administrative revocation.
              </p>
            </div>
          </div>
        </div>

        {/* Action Button: Bulk Issue Certificates */}
        <div className="flex items-center self-start sm:self-center">
          <button
            onClick={openIssueModal}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-[#FA541C] to-[#E03A00] hover:from-[#E03A00] hover:to-[#C83200] rounded-xl shadow-md shadow-orange-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Bulk Issue Certificates</span>
          </button>
        </div>
      </div>

      {/* Search Bar & Filter Tabs (Exact match to screenshot) */}
      <div className="bg-white border border-zinc-200/90 rounded-2xl p-2.5 sm:p-3 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by recipient, verification code (ATLYX-...), email, or hackathon..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-9 py-2 text-xs bg-transparent border-0 focus:outline-none text-zinc-900 placeholder:text-zinc-400 font-medium"
          />
          {search && (
            <button
              onClick={() => {
                setSearch('');
                setPage(1);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 p-0.5 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 self-end sm:self-auto border-t sm:border-t-0 pt-2 sm:pt-0 border-zinc-100">
          {[
            { key: '', label: 'All' },
            { key: 'ISSUED', label: 'ISSUED' },
            { key: 'REVOKED', label: 'REVOKED' },
          ].map((tab) => {
            const active = statusFilter === tab.key;
            return (
              <button
                key={tab.key || 'ALL'}
                onClick={() => {
                  setStatusFilter(tab.key);
                  setPage(1);
                }}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer flex items-center justify-center hover:scale-105 active:scale-95 ${
                  active
                    ? 'bg-gradient-to-r from-[#FA541C] to-[#E03A00] text-white shadow-md shadow-orange-500/20'
                    : 'bg-white text-zinc-600 border border-zinc-200/90 hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Certificates Table */}
      <div className="bg-white border border-zinc-200/90 rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-xs text-zinc-500 flex flex-col items-center justify-center space-y-3">
            <RefreshCw className="w-7 h-7 animate-spin text-[#FA541C]" />
            <p className="font-bold text-zinc-900 text-sm">Loading certificate registry...</p>
            <p className="text-xs text-zinc-400">Verifying cryptographic signatures and credentials</p>
          </div>
        ) : certificates.length === 0 ? (
          <div className="py-16 text-center space-y-3 px-4">
            <div className="w-12 h-12 rounded-2xl bg-zinc-50 border border-zinc-200 flex items-center justify-center mx-auto text-zinc-400">
              <Award className="w-6 h-6 stroke-[1.8]" />
            </div>
            <p className="text-sm font-bold text-zinc-900">No certificates found</p>
            <p className="text-xs text-zinc-500 max-w-md mx-auto">
              {search || statusFilter
                ? `No certificates match your search query or filter. Try clearing filters.`
                : 'No certificates have been issued yet. Click "Bulk Issue Certificates" to generate credentials.'}
            </p>
            <div className="pt-2">
              <button
                onClick={openIssueModal}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-[#FA541C] to-[#E03A00] hover:from-[#E03A00] hover:to-[#C83200] rounded-xl shadow-xs transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Issue First Certificate</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-zinc-100 text-[11px] font-bold text-zinc-400 uppercase tracking-wider bg-zinc-50/70">
                  <th className="py-4 px-6">RECIPIENT &amp; USER</th>
                  <th className="py-4 px-6">HACKATHON ARENA</th>
                  <th className="py-4 px-6">VERIFICATION CODE</th>
                  <th className="py-4 px-6">ISSUED DATE</th>
                  <th className="py-4 px-6">STATUS</th>
                  <th className="py-4 px-6 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {certificates.map((cert) => {
                  const initialsStyle = getInitialsBadgeStyle(cert.recipientName || cert.user.fullName);

                  return (
                    <tr
                      key={cert.id}
                      className="hover:bg-orange-50/20 transition-all duration-200 group"
                    >
                      {/* RECIPIENT & USER */}
                      <td className="py-4 px-6 align-middle">
                        <div className="flex items-center gap-3.5">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs border flex-shrink-0 shadow-2xs group-hover:scale-105 transition-transform duration-200 ${initialsStyle}`}
                          >
                            {(cert.recipientName || cert.user.fullName)
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .slice(0, 2)
                              .toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-zinc-900 text-sm tracking-tight group-hover:text-[#FA541C] transition-colors">
                              {cert.recipientName || cert.user.fullName}
                            </div>
                            <div className="text-[11px] text-zinc-500 font-mono mt-0.5">
                              {cert.user.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* HACKATHON ARENA */}
                      <td className="py-4 px-6 align-middle">
                        <div className="font-bold text-zinc-900 text-xs tracking-tight">
                          {cert.hackathon.title}
                        </div>
                        <span className="text-[10px] text-zinc-400 font-mono block mt-0.5">
                          /{cert.hackathon.slug}
                        </span>
                      </td>

                      {/* VERIFICATION CODE */}
                      <td className="py-4 px-6 align-middle whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => copyToClipboard(cert.verificationCode)}
                          title="Click to copy verification code"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-bold text-zinc-700 bg-zinc-100 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 border border-zinc-200/90 shadow-2xs transition-all cursor-pointer"
                        >
                          <span>{cert.verificationCode}</span>
                          {copiedCode === cert.verificationCode ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3 text-zinc-400" />
                          )}
                        </button>
                      </td>

                      {/* ISSUED DATE */}
                      <td className="py-4 px-6 align-middle whitespace-nowrap text-zinc-600 font-mono text-xs">
                        {formatDate(cert.issuedAt)}
                      </td>

                      {/* STATUS */}
                      <td className="py-4 px-6 align-middle whitespace-nowrap">
                        {cert.status === 'ISSUED' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 shadow-2xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span>VALID</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 shadow-2xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            <span>REVOKED</span>
                          </span>
                        )}
                      </td>

                      {/* ACTIONS */}
                      <td className="py-4 px-6 align-middle text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/verify/${cert.verificationCode}`}
                            target="_blank"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-700 bg-white border border-zinc-200 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 rounded-xl shadow-2xs transition-all hover:scale-105 active:scale-95 cursor-pointer"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Verify</span>
                          </Link>

                          {cert.status === 'ISSUED' && (
                            <button
                              onClick={() => {
                                setSelectedCert(cert);
                                setRevokeModalOpen(true);
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 bg-white border border-rose-200 hover:bg-rose-50 rounded-xl shadow-2xs transition-all hover:scale-105 active:scale-95 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Revoke</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-zinc-100 flex items-center justify-between text-xs bg-zinc-50/50">
            <span className="text-zinc-500">
              Page <span className="font-bold text-zinc-900">{page}</span> of{' '}
              <span className="font-bold text-zinc-900">{totalPages}</span> ({totalCount} total)
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="inline-flex items-center gap-1 px-3 py-1.5 font-bold text-zinc-700 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all shadow-xs"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="inline-flex items-center gap-1 px-3 py-1.5 font-bold text-zinc-700 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all shadow-xs"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* BULK ISSUE MODAL */}
      {/* ======================================================== */}
      {issueModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-zinc-200 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-50 text-[#FA541C] flex items-center justify-center border border-orange-200">
                  <Award className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900">Bulk Issue Digital Certificates</h3>
                  <p className="text-[11px] text-zinc-500">Cryptographic credentials for participants</p>
                </div>
              </div>
              <button
                onClick={() => setIssueModalOpen(false)}
                className="p-1.5 text-zinc-400 hover:bg-zinc-100 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-500 leading-relaxed">
              Generates cryptographic certificates with unique verification codes for all approved participants in the selected arena.
            </p>

            <div className="space-y-1.5 text-xs">
              <label className="font-bold text-zinc-700">Select Target Hackathon Arena:</label>
              <select
                value={selectedHackathonId}
                onChange={(e) => setSelectedHackathonId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-orange-500/15 cursor-pointer shadow-xs"
              >
                {hackathons.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.title}
                  </option>
                ))}
              </select>
            </div>

            {issueMessage && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
                <span>{issueMessage}</span>
              </div>
            )}

            {issueError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                <span>{issueError}</span>
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-2 border-t border-zinc-100">
              <button
                type="button"
                onClick={() => setIssueModalOpen(false)}
                disabled={issuing}
                className="px-4 py-2 text-xs font-bold text-zinc-700 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleIssueCertificates}
                disabled={issuing}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-[#FA541C] to-[#E03A00] hover:from-[#E03A00] hover:to-[#C83200] rounded-xl shadow-xs transition-all hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-60"
              >
                {issuing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <span>Issue All Certificates</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* REVOCATION MODAL */}
      {/* ======================================================== */}
      {revokeModalOpen && selectedCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-rose-200 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
              <Trash2 className="w-6 h-6 stroke-[2.2]" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-zinc-900">Revoke Digital Certificate</h3>
              <p className="text-xs text-zinc-500">
                Revoking invalidates verification code{' '}
                <span className="font-mono font-bold text-zinc-900">{selectedCert.verificationCode}</span> permanently.
              </p>
            </div>

            <div className="space-y-1.5 text-xs">
              <label className="font-bold text-zinc-700">Revocation Reason:</label>
              <input
                type="text"
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                placeholder="e.g. Code plagiarism or rules violation"
                className="w-full px-3.5 py-2 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/15"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-zinc-100">
              <button
                type="button"
                onClick={() => setRevokeModalOpen(false)}
                disabled={revoking}
                className="px-4 py-2 text-xs font-bold text-zinc-700 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRevokeCertificate}
                disabled={revoking}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-all hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-60"
              >
                {revoking ? 'Revoking...' : 'Confirm Revocation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
