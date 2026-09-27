'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Award,
  Plus,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Copy,
  Users,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface CertificateItem {
  id: string;
  recipientName: string;
  type: string;
  status: string;
  title: string;
  verificationCode: string;
  issuedAt: string;
  user: {
    fullName: string;
    email: string;
  };
}

export default function OrganizerCertificatesPage() {
  const [hackathons, setHackathons] = useState<any[]>([]);
  const [selectedHackathonId, setSelectedHackathonId] = useState<string>('');
  const [certificates, setCertificates] = useState<CertificateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
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

  const fetchCertificates = async (hId: string) => {
    if (!hId) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/v1/certificates?hackathonId=${hId}`);
      const json = await res.json();
      if (res.ok && json.data?.certificates) {
        setCertificates(json.data.certificates);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedHackathonId) {
      fetchCertificates(selectedHackathonId);
    }
  }, [selectedHackathonId]);

  const handleGenerateCertificates = async () => {
    if (!selectedHackathonId) return;
    try {
      setGenerating(true);
      setMessage(null);
      const res = await fetch('/api/v1/certificates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hackathonId: selectedHackathonId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to issue certificates');
      setMessage({ type: 'success', text: json.message || 'Certificates successfully generated and issued.' });
      fetchCertificates(selectedHackathonId);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="space-y-6 select-none">
      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#E2E8F0] gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-bold text-[#2563EB] bg-[#EFF6FF] px-2.5 py-0.5 rounded-full border border-[#BFDBFE]">
              Verifiable Credentials
            </span>
            <span className="text-[11px] font-semibold text-[#059669] bg-[#ECFDF5] px-2.5 py-0.5 rounded-full border border-[#A7F3D0] flex items-center">
              <ShieldCheck className="w-3 h-3 mr-1" /> SHA-256 Signed & Publicly Verifiable
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#111827] mt-1 tracking-tight">
            Certificate Generation & Issuance
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-0.5 font-normal">
            Issue cryptographically tamper-proof certificates to participants, winners, and judges.
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
            onClick={handleGenerateCertificates}
            disabled={generating}
            icon={<Award className="w-4 h-4" />}
          >
            {generating ? 'Issuing...' : 'Generate & Issue All'}
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

      {/* Certificates List */}
      <div className="bg-white border border-[#E2E8F0] rounded-[18px] overflow-hidden shadow-card">
        {loading ? (
          <div className="py-16 text-center text-xs text-[#64748B]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2563EB] mx-auto mb-2" />
            Loading issued credentials...
          </div>
        ) : certificates.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#94A3B8]">
            No certificates have been issued for this event yet. Click &quot;Generate &amp; Issue All&quot; to award verified credentials.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#F8FAFC] text-[#64748B] font-bold uppercase tracking-wider border-b border-[#E2E8F0]">
                  <th className="py-3 px-5">Recipient</th>
                  <th className="py-3 px-5">Certificate Type</th>
                  <th className="py-3 px-5">Verification Code</th>
                  <th className="py-3 px-5">Issued Date</th>
                  <th className="py-3 px-5 text-right">Verification Link</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {certificates.map((c) => (
                  <tr key={c.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="py-3.5 px-5 font-bold text-[#111827]">
                      {c.recipientName}
                      <div className="text-[10px] text-[#64748B] font-normal">{c.user.email}</div>
                    </td>
                    <td className="py-3.5 px-5">
                      <Badge
                        variant={
                          c.type === 'WINNER'
                            ? 'emerald'
                            : c.type === 'RUNNER_UP'
                            ? 'purple'
                            : 'blue'
                        }
                        size="sm"
                      >
                        {c.type.replace(/_/g, ' ')}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-5 font-mono text-[11px]">
                      <span
                        onClick={() => handleCopy(c.verificationCode)}
                        className="cursor-pointer hover:text-[#2563EB] inline-flex items-center space-x-1"
                        title="Click to copy code"
                      >
                        <span>{c.verificationCode}</span>
                        <Copy className="w-3 h-3 text-[#94A3B8]" />
                      </span>
                      {copiedCode === c.verificationCode && (
                        <span className="text-[#059669] text-[9px] font-bold ml-1.5">Copied!</span>
                      )}
                    </td>
                    <td className="py-3.5 px-5 text-[#64748B]">
                      {new Date(c.issuedAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <Link
                        href={`/verify/${c.verificationCode}`}
                        target="_blank"
                        className="text-[#2563EB] hover:underline inline-flex items-center font-semibold"
                      >
                        <span>Verify Record</span>
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
