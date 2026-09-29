'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Award,
  AlertCircle,
  ExternalLink,
  CheckCircle2,
  Calendar,
  Building,
  KeyRound,
  ArrowRight,
} from 'lucide-react';
import { AppShell } from '@/components/ui/AppShell';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface VerifiedCertificate {
  id: string;
  verificationCode: string;
  title: string;
  recipientName: string;
  type: string;
  status: string;
  awardDetail?: string | null;
  issuedAt: string;
  integrityHash: string;
  hackathon: {
    id: string;
    title: string;
    slug: string;
    organizationName: string;
    eventStartTime: string;
    eventEndTime: string;
  };
  issuer: {
    name: string;
    verifiedDomain: string;
  };
}

export default function CertificateVerificationPage({
  params,
}: {
  params: { code: string };
}) {
  const code = params.code;
  const [cert, setCert] = useState<VerifiedCertificate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function verify() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/v1/certificates/verify/${code}`);
        const json = await res.json();

        if (!res.ok) {
          throw new Error(json.message || 'Invalid or revoked certificate code');
        }

        setCert(json.data?.certificate || null);
      } catch (err: any) {
        setError(err.message || 'Verification failed');
      } finally {
        setLoading(false);
      }
    }

    verify();
  }, [code]);

  return (
    <AppShell
      pageTitle="Credential Verification"
      pageSubtitle="Instant digital verification of hackathon honors, achievements, and completion certificates."
    >
      <div className="max-w-2xl mx-auto space-y-6">
        {loading ? (
          <div className="py-20 text-center text-xs text-[#64748B]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2563EB] mx-auto mb-2" />
            Querying decentralized verification registry...
          </div>
        ) : error || !cert ? (
          <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-[18px] p-10 text-center space-y-4 shadow-card">
            <div className="w-12 h-12 rounded-2xl bg-[#FEF2F2] text-[#DC2626] flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-[#111827]">Verification Failed</h2>
            <p className="text-xs text-[#64748B] max-w-sm mx-auto leading-relaxed">
              {error || `The verification code "${code}" could not be confirmed in the registry.`}
            </p>
            <div className="pt-2">
              <Link href="/hackathons">
                <Button variant="primary" size="sm">
                  Explore Active Hackathons
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-[20px] p-6 sm:p-8 shadow-card space-y-6">
            {/* Status Header */}
            <div className="bg-[#ECFDF5] border border-[#A7F3D0] rounded-[16px] p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-[#059669] text-white flex items-center justify-center shadow-xs flex-shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#065F46] uppercase tracking-wider">
                    Official Authenticity Confirmed
                  </div>
                  <div className="text-sm font-extrabold text-[#065F46]">
                    Valid Digital Credential
                  </div>
                </div>
              </div>
              <Badge variant="emerald" size="sm">
                STATUS: {cert.status}
              </Badge>
            </div>

            {/* Credential Details */}
            <div className="space-y-4 pt-1">
              <div>
                <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block">
                  Credential Title
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <h2 className="text-xl font-bold text-[#111827]">{cert.title}</h2>
                  {cert.type === 'JUDGE' && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                      ⚖️ Official Judge Record
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[12px] space-y-1">
                  <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">
                    Awarded To
                  </span>
                  <div className="text-sm font-bold text-[#111827]">{cert.recipientName}</div>
                </div>

                <div className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[12px] space-y-1">
                  <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">
                    Verification Code
                  </span>
                  <div className="text-sm font-mono font-bold text-[#2563EB]">
                    {cert.verificationCode}
                  </div>
                </div>

                <div className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[12px] space-y-1">
                  <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">
                    Event
                  </span>
                  <div className="text-sm font-bold text-[#111827]">
                    {cert.hackathon.title}
                  </div>
                </div>

                <div className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[12px] space-y-1">
                  <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">
                    Issuance Date
                  </span>
                  <div className="text-sm font-semibold text-[#111827]">
                    {new Date(cert.issuedAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </div>
                </div>
              </div>

              {cert.awardDetail && (
                <div className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[12px] space-y-1">
                  <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">
                    Achievement Details
                  </span>
                  <p className="text-xs text-[#334155]">{cert.awardDetail}</p>
                </div>
              )}

              {/* Cryptographic Hash Verification */}
              <div className="p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[12px] space-y-1">
                <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider flex items-center">
                  <KeyRound className="w-3 h-3 mr-1 text-[#059669]" />
                  SHA-256 Audit Integrity Hash
                </span>
                <p className="font-mono text-[10px] text-[#64748B] break-all">
                  {cert.integrityHash}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between border-t border-[#F1F5F9] gap-3">
              <span className="text-xs text-[#64748B]">
                Issued by <strong>{cert.issuer.name}</strong>
              </span>

              <Link href={`/hackathons/${cert.hackathon.slug}`}>
                <Button variant="outline" size="sm" className="flex items-center space-x-1.5">
                  <span>View Hackathon Arena</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
