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
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

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
        setIssueMessage(data.message || 'Certificates successfully generated');
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
        setRevokeModalOpen(false);
        setSelectedCert(null);
        fetchCertificates();
      }
    } catch (err) {
      console.error('Failed to revoke certificate:', err);
    } finally {
      setRevoking(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#E2E8F0] gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-bold text-[#DC2626] bg-[#FEF2F2] px-2.5 py-0.5 rounded-full border border-[#FECACA]">
              Global Platform Control
            </span>
            <span className="text-[11px] font-semibold text-[#64748B]">
              Total Issued: {totalCount}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#111827] mt-1 tracking-tight">
            Digital Certificate Governance
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
            Cryptographically signed credentials, public verification endpoints, and administrative revocation.
          </p>
        </div>

        <Button onClick={openIssueModal} size="sm" className="self-start sm:self-center">
          <Plus className="w-3.5 h-3.5 mr-1.5" />
          Bulk Issue Certificates
        </Button>
      </div>

      {/* Search & Filter */}
      <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-[18px] p-4 shadow-card">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <input
              type="text"
              placeholder="Search by recipient, verification code (ATLYX-...), email, or hackathon..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-[11px] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all placeholder:text-[#94A3B8]"
            />
          </div>

          <div className="flex items-center gap-2">
            {['', 'ISSUED', 'REVOKED'].map((st) => (
              <button
                key={st || 'ALL'}
                onClick={() => {
                  setStatusFilter(st);
                  setPage(1);
                }}
                className={`px-3 py-1.5 text-xs rounded-full border transition-all ${
                  statusFilter === st
                    ? 'bg-[#002B49] text-white border-[#002B49] font-semibold'
                    : 'bg-[#F8FAFC] text-[#64748B] border-[#E2E8F0] hover:bg-[#F1F5F9]'
                }`}
              >
                {st || 'All'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-[18px] overflow-hidden shadow-card">
        {loading ? (
          <div className="p-12 text-center text-xs text-[#64748B]">
            Loading certificates from PostgreSQL...
          </div>
        ) : certificates.length === 0 ? (
          <div className="p-12 text-center">
            <Award className="w-8 h-8 text-[#CBD5E1] mx-auto mb-2" />
            <p className="text-sm font-semibold text-[#111827]">No certificates found</p>
            <p className="text-xs text-[#64748B] mt-0.5">Use the bulk issue button to generate credentials.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#F8FAFC] text-[#64748B] font-bold uppercase tracking-wider border-b border-[#E2E8F0]">
                  <th className="py-3 px-5">Recipient & User</th>
                  <th className="py-3 px-5">Hackathon Arena</th>
                  <th className="py-3 px-5">Verification Code</th>
                  <th className="py-3 px-5">Issued Date</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {certificates.map((cert) => (
                  <tr key={cert.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="py-3.5 px-5">
                      <div className="font-semibold text-[#111827] text-sm">{cert.recipientName}</div>
                      <div className="text-[11px] text-[#64748B] font-mono mt-0.5">{cert.user.email}</div>
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="font-medium text-[#111827]">{cert.hackathon.title}</div>
                      <span className="text-[10px] text-[#64748B] font-mono">/{cert.hackathon.slug}</span>
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="font-mono font-bold text-[#002B49] bg-[#F1F5F9] px-2 py-0.5 rounded border border-[#E2E8F0]">
                        {cert.verificationCode}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-[#64748B] font-mono">
                      {new Date(cert.issuedAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-5">
                      {cert.status === 'ISSUED' ? (
                        <span className="inline-flex items-center text-[10px] font-bold text-[#059669] bg-[#ECFDF5] px-2 py-0.5 rounded-full border border-[#A7F3D0]">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> VALID
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-[10px] font-bold text-[#DC2626] bg-[#FEF2F2] px-2 py-0.5 rounded-full border border-[#FECACA]">
                          <ShieldAlert className="w-3 h-3 mr-1" /> REVOKED
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Link
                          href={`/verify/${cert.verificationCode}`}
                          target="_blank"
                          className="px-2.5 py-1 text-[11px] font-semibold text-[#002B49] bg-[#F1F5F9] hover:bg-[#E2E8F0] rounded-[7px] transition-colors inline-flex items-center"
                        >
                          <ExternalLink className="w-3 h-3 mr-1" /> Verify
                        </Link>
                        {cert.status === 'ISSUED' && (
                          <button
                            onClick={() => {
                              setSelectedCert(cert);
                              setRevokeModalOpen(true);
                            }}
                            className="px-2.5 py-1 text-[11px] font-semibold text-[#DC2626] bg-[#FEF2F2] hover:bg-[#FEE2E2] rounded-[7px] border border-[#FECACA] transition-colors"
                          >
                            Revoke
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-[#E2E8F0] flex items-center justify-between">
            <span className="text-xs text-[#64748B]">
              Page {page} of {totalPages} ({totalCount} total)
            </span>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Bulk Issue Modal */}
      {issueModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-[#FFFFFF] rounded-[20px] max-w-md w-full p-6 shadow-2xl border border-[#E2E8F0] space-y-4">
            <div className="flex items-center space-x-2">
              <Award className="w-5 h-5 text-[#2563EB]" />
              <h3 className="text-base font-bold text-[#111827]">
                Bulk Issue Digital Certificates
              </h3>
            </div>
            <p className="text-xs text-[#64748B]">
              Generates cryptographic certificates with unique verification codes for all approved participants in the selected arena.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#334155]">Select Target Hackathon:</label>
              <select
                value={selectedHackathonId}
                onChange={(e) => setSelectedHackathonId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-[11px] focus:outline-none focus:border-[#2563EB]"
              >
                {hackathons.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.title}
                  </option>
                ))}
              </select>
            </div>

            {issueMessage && (
              <div className="p-3 bg-[#ECFDF5] border border-[#A7F3D0] rounded-[11px] text-xs text-[#065F46] flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{issueMessage}</span>
              </div>
            )}

            {issueError && (
              <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-[11px] text-xs text-[#DC2626] flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{issueError}</span>
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIssueModalOpen(false)}
                disabled={issuing}
              >
                Close
              </Button>
              <Button
                size="sm"
                onClick={handleIssueCertificates}
                disabled={issuing}
              >
                {issuing ? 'Generating...' : 'Issue All Certificates'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Revocation Modal */}
      {revokeModalOpen && selectedCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-[#FFFFFF] rounded-[20px] max-w-md w-full p-6 shadow-2xl border border-[#FECACA] space-y-4">
            <h3 className="text-base font-bold text-[#DC2626]">
              Revoke Digital Certificate
            </h3>
            <p className="text-xs text-[#64748B]">
              Revoking invalidates verification code <span className="font-mono font-bold text-[#111827]">{selectedCert.verificationCode}</span> permanently. The public verification page will display it as revoked.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#334155]">Revocation Reason:</label>
              <input
                type="text"
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-[11px] focus:outline-none focus:border-[#DC2626]"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRevokeModalOpen(false)}
                disabled={revoking}
              >
                Cancel
              </Button>
              <button
                onClick={handleRevokeCertificate}
                disabled={revoking}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#DC2626] hover:bg-[#B91C1C] rounded-[11px] transition-colors"
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
