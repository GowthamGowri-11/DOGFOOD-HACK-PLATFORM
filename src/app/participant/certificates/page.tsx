'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Award,
  ShieldCheck,
  ExternalLink,
  Download,
  Share2,
  Copy,
  CheckCircle2,
  Trophy,
  Calendar,
  Lock,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface CertificateItem {
  id: string;
  verificationCode: string;
  title: string;
  recipientName: string;
  type: string;
  status: string;
  awardDetail?: string | null;
  issuedAt: string;
  hackathon: {
    id: string;
    title: string;
    slug: string;
    organizationName: string;
  };
}

export default function ParticipantCertificatesPage() {
  const [certificates, setCertificates] = useState<CertificateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    async function loadCertificates() {
      try {
        setLoading(true);
        const res = await fetch('/api/v1/certificates');
        const json = await res.json();
        if (res.ok && json.data?.certificates) {
          setCertificates(json.data.certificates);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadCertificates();
  }, []);

  const handleCopyLink = (code: string) => {
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}/verify/${code}`;
      navigator.clipboard.writeText(url);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    }
  };

  return (
    <div className="space-y-6 select-none">
      {/* Header */}
      <div className="pb-6 border-b border-[#E2E8F0]">
        <div className="flex items-center space-x-2">
          <span className="text-[11px] font-bold text-[#2563EB] bg-[#EFF6FF] px-2.5 py-0.5 rounded-full border border-[#BFDBFE]">
            Digital Credentials
          </span>
          <span className="text-[11px] font-semibold text-[#059669] bg-[#ECFDF5] px-2.5 py-0.5 rounded-full border border-[#A7F3D0] flex items-center">
            <ShieldCheck className="w-3 h-3 mr-1" /> Cryptographically Verifiable
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#111827] mt-1 tracking-tight">
          Certificates & Honors
        </h1>
        <p className="text-xs sm:text-sm text-[#64748B] mt-0.5 font-normal">
          Tamper-proof digital credentials issued for hackathon participation, track finalists, and grand prize winners.
        </p>
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs text-[#64748B]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2563EB] mx-auto mb-2" />
          Loading your verified credentials...
        </div>
      ) : certificates.length === 0 ? (
        <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-[18px] p-12 text-center space-y-3 shadow-card max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center mx-auto">
            <Award className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[#111827]">No Certificates Issued Yet</h3>
          <p className="text-xs text-[#64748B] leading-relaxed">
            Certificates are issued automatically upon verified hackathon completion and results publication.
          </p>
          <div className="pt-2">
            <Link href="/hackathons">
              <Button variant="primary" size="sm">
                Explore Hackathons
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {certificates.map((cert) => (
            <div
              key={cert.id}
              className="bg-[#FFFFFF] border border-[#E2E8F0] hover:border-[#CBD5E1] rounded-[20px] p-6 sm:p-8 shadow-card space-y-6 transition-all"
            >
              {/* Certificate Inner Frame (Prestigious Design) */}
              <div className="bg-gradient-to-br from-[#F8FAFC] via-[#FFFFFF] to-[#EFF6FF] border-2 border-[#BFDBFE] rounded-[16px] p-6 sm:p-10 relative overflow-hidden text-center space-y-4 shadow-xs">
                {/* Verified Watermark Stamp */}
                <div className="absolute top-4 right-4 flex items-center space-x-1.5 px-3 py-1 bg-[#ECFDF5] border border-[#A7F3D0] rounded-full text-xs font-bold text-[#065F46]">
                  <ShieldCheck className="w-4 h-4 text-[#059669]" />
                  <span>Verified Credential</span>
                </div>

                {/* Seal Icon */}
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#FEF3C7] to-[#FDE68A] border-2 border-[#F59E0B] flex items-center justify-center text-[#B45309] mx-auto shadow-sm">
                  <Award className="w-9 h-9" />
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-black uppercase tracking-widest text-[#2563EB]">
                    Official Hackathon Credential
                  </span>
                  <h2 className="text-xl sm:text-2xl font-serif font-black text-[#111827] tracking-tight">
                    {cert.title}
                  </h2>
                </div>

                <p className="text-xs text-[#64748B] max-w-md mx-auto">
                  This certifies that the recipient has successfully participated and adhered to fair play standards in:
                </p>

                <div className="text-sm sm:text-base font-bold text-[#111827]">
                  {cert.hackathon.title}
                </div>

                {cert.recipientName && (
                  <div className="pt-2">
                    <div className="text-xs text-[#64748B] uppercase tracking-wider">
                      Awarded To
                    </div>
                    <div className="text-2xl sm:text-3xl font-serif font-bold text-[#111827] mt-1 border-b border-[#CBD5E1] pb-2 inline-block px-6">
                      {cert.recipientName}
                    </div>
                  </div>
                )}

                {cert.awardDetail && (
                  <p className="text-xs text-[#475569] font-medium pt-1 max-w-lg mx-auto">
                    {cert.awardDetail}
                  </p>
                )}

                {/* Footer Metadata */}
                <div className="pt-4 flex flex-col sm:flex-row items-center justify-between text-xs text-[#64748B] border-t border-[#E2E8F0] gap-2">
                  <span>
                    Issuer: <strong>{cert.hackathon.organizationName || 'ATLYX Frontier Systems'}</strong>
                  </span>
                  <span className="font-mono text-[#2563EB] font-bold">
                    ID: {cert.verificationCode}
                  </span>
                  <span>
                    Date: {new Date(cert.issuedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex items-center space-x-2 text-xs text-[#64748B]">
                  <Lock className="w-3.5 h-3.5 text-[#059669]" />
                  <span>Publicly shareable with potential employers</span>
                </div>

                <div className="flex items-center space-x-2.5">
                  <button
                    onClick={() => handleCopyLink(cert.verificationCode)}
                    className="inline-flex items-center px-3.5 py-2 bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] rounded-[11px] text-xs font-semibold text-[#111827] shadow-xs transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5 mr-1.5 text-[#64748B]" />
                    {copiedCode === cert.verificationCode ? 'Link Copied!' : 'Copy Verification Link'}
                  </button>

                  <Link href={`/verify/${cert.verificationCode}`}>
                    <Button variant="primary" size="sm" className="flex items-center space-x-1.5">
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Verify Credential Online</span>
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
