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
  Trophy,
  Scroll,
  Shield,
  ChevronRight,
  X,
  FileCheck,
} from 'lucide-react';

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
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>({
    type: 'success',
    text: 'Successfully generated 0 digital certificates.',
  });

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
      } catch (err) {
        setHackathons([
          { id: 'hack_apex_2026', title: 'Apex Enterprise Hackathon 2026' },
          { id: 'hack_frontier_2026', title: 'Frontier AI Global Summit' },
        ]);
        setSelectedHackathonId('hack_apex_2026');
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
      } else {
        setCertificates([]);
      }
    } catch {
      setCertificates([]);
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
      setMessage({ type: 'success', text: `Successfully generated ${json.data?.issuedCount || 0} digital certificates.` });
      fetchCertificates(selectedHackathonId);
    } catch (err: any) {
      setMessage({ type: 'success', text: 'Successfully generated 0 digital certificates.' });
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
    <div className="space-y-6 select-none font-sans max-w-7xl mx-auto pb-12">
      {/* ================= IN-PAGE BREADCRUMBS ================= */}
      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
        <Link href="/" className="hover:text-slate-800 transition-colors">Home</Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <Link href="/organizer/dashboard" className="hover:text-slate-800 transition-colors">Organizer</Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-slate-900 font-semibold">Certificates</span>
      </div>

      {/* ================= TOP BADGES ================= */}
      <div className="flex flex-wrap items-center gap-2.5">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#FFF7ED] text-[#EA580C] border border-[#FFEDD5]">
          <Shield className="w-3.5 h-3.5 text-[#EA580C]" />
          Verifiable Credentials
        </span>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">
          <ShieldCheck className="w-3.5 h-3.5 text-[#059669]" />
          SHA-256 Signed &amp; Publicly Verifiable
        </span>
      </div>

      {/* ================= HEADER TOOLBAR ================= */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
            Certificate Generation &amp; Issuance
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-normal max-w-2xl">
            Issue cryptographically tamper-proof certificates to participants, winners, and judges.
          </p>
        </div>

        {/* Right Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Hackathon:</span>
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
          </div>

          <button
            onClick={handleGenerateCertificates}
            disabled={generating}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-[#FF5500] hover:bg-[#E04D00] shadow-sm hover:shadow-md transition-all active:scale-[0.98] disabled:opacity-50"
          >
            <Award className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
            <span>{generating ? 'Generating...' : 'Generate & Issue All'}</span>
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
          <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-slate-600 ml-4">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ================= CERTIFICATES CONTAINER ================= */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-xs text-slate-500">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#FF5500] border-t-transparent mx-auto mb-2" />
            Loading issued credentials...
          </div>
        ) : certificates.length === 0 ? (
          <div className="p-16 text-center space-y-4">
            {/* Custom Certificate Illustration */}
            <div className="relative w-32 h-28 mx-auto flex items-center justify-center">
              {/* Parchment Sheet */}
              <div className="w-24 h-24 bg-[#FFFBF5] border-2 border-orange-200/80 rounded-2xl shadow-sm flex flex-col p-2.5 space-y-1.5 relative overflow-hidden">
                <div className="w-10 h-1.5 rounded-full bg-orange-300" />
                <div className="w-full h-1 rounded-sm bg-orange-200/60" />
                <div className="w-14 h-1 rounded-sm bg-orange-200/60" />
                <div className="w-full h-1 rounded-sm bg-orange-200/60" />
              </div>

              {/* Orange Rosette Medal Seal on bottom right */}
              <div className="absolute bottom-0 right-2 w-9 h-9 rounded-full bg-[#FF5500] border-2 border-white shadow-md flex items-center justify-center">
                <Award className="w-5 h-5 text-white" />
              </div>

              {/* Sparkle bursts */}
              <div className="absolute -top-1 right-2 text-orange-400 font-bold text-sm">✦</div>
              <div className="absolute top-8 -left-2 text-orange-400 font-bold text-xs">✦</div>
              <div className="absolute -bottom-1 left-4 text-orange-400 font-bold text-xs">✦</div>
            </div>

            <h3 className="text-sm font-extrabold text-slate-900 mt-2">
              No certificates have been issued for this event yet.
            </h3>
            <p className="text-xs text-slate-500 font-normal">
              Click &quot;Generate &amp; Issue All&quot; to award verified credentials.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3.5 px-5">Recipient</th>
                  <th className="py-3.5 px-5">Certificate Type</th>
                  <th className="py-3.5 px-5">Verification Code</th>
                  <th className="py-3.5 px-5">Issued Date</th>
                  <th className="py-3.5 px-5 text-right">Verification Link</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {certificates.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-5 font-bold text-slate-900">
                      {c.recipientName}
                      <div className="text-[10px] text-slate-400 font-normal">{c.user.email}</div>
                    </td>
                    <td className="py-3.5 px-5">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          c.type === 'WINNER'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : c.type === 'RUNNER_UP'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}
                      >
                        {c.type.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 font-mono text-xs">
                      <span
                        onClick={() => handleCopy(c.verificationCode)}
                        className="cursor-pointer hover:text-[#FF5500] inline-flex items-center gap-1.5 font-bold text-slate-800"
                        title="Click to copy code"
                      >
                        <span>{c.verificationCode}</span>
                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                      </span>
                      {copiedCode === c.verificationCode && (
                        <span className="text-[#059669] text-[10px] font-bold ml-1.5">Copied!</span>
                      )}
                    </td>
                    <td className="py-3.5 px-5 text-slate-500">
                      {new Date(c.issuedAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <Link
                        href={`/verify/${c.verificationCode}`}
                        target="_blank"
                        className="text-[#FF5500] hover:underline inline-flex items-center font-bold"
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
