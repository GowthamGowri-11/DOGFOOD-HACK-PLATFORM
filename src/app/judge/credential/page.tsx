'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Award,
  KeyRound,
  ExternalLink,
  Copy,
  CheckCircle2,
  Calendar,
  Building,
  Scale,
  RefreshCw,
  Share2,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

export default function JudgeCredentialPage() {
  const [loading, setLoading] = useState(true);
  const [record, setRecord] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadCredential() {
      try {
        setLoading(true);
        const res = await fetch('/api/v1/judge/credential');
        const json = await res.json();
        if (json.success && json.data) {
          setRecord(json.data);
        }
      } catch (e) {
        console.error('Failed to load judge credential:', e);
      } finally {
        setLoading(false);
      }
    }
    loadCredential();
  }, []);

  const handleCopyLink = () => {
    if (!record) return;
    const url = `${window.location.origin}/verify/${record.verificationCode}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#131417] text-neutral-900 dark:text-neutral-100 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#FA541C] uppercase tracking-wider mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Verifiable Credential</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Judge Participation & Jury Credential
            </h1>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
              Cryptographically signed proof of evaluation panel participation with public SHA-256 verification.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleCopyLink}
              className="px-4 py-2 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-bold hover:opacity-90 transition-all flex items-center gap-1.5 shadow-sm"
            >
              {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
              <span>{copied ? 'Link Copied!' : 'Share Public Record'}</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-16 text-center text-neutral-400">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-[#FA541C]" />
            <p className="text-xs">Minting & loading judge participation record...</p>
          </div>
        ) : !record ? (
          <div className="p-12 text-center bg-white dark:bg-[#1A1C20] rounded-2xl border border-neutral-200 dark:border-neutral-800">
            <p className="text-sm">No credential found for this hackathon.</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-[#1A1C20] rounded-3xl border border-neutral-200 dark:border-neutral-800 p-6 sm:p-10 shadow-sm space-y-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-[#FA541C]/10 to-transparent rounded-full blur-3xl pointer-events-none" />

            {/* Verified Badge Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#059669] text-white flex items-center justify-center shadow-xs">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                    Official Authenticity Guaranteed
                  </div>
                  <div className="text-sm font-extrabold text-emerald-950 dark:text-emerald-200">
                    Signed Judge Participation Credential
                  </div>
                </div>
              </div>
              <Badge variant="emerald" size="sm">
                STATUS: {record.status}
              </Badge>
            </div>

            {/* Main Credential Info */}
            <div className="space-y-6">
              <div>
                <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                  Honoree & Senior Evaluator
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-neutral-100 mt-1">
                  {record.judgeName}
                </h2>
                <p className="text-xs font-mono text-neutral-500 mt-0.5">{record.judgeEmail}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 bg-neutral-50 dark:bg-neutral-800/60 rounded-2xl border border-neutral-200 dark:border-neutral-800">
                  <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">
                    Verification Code
                  </span>
                  <div className="text-sm font-mono font-bold text-[#FA541C] mt-1">
                    {record.verificationCode}
                  </div>
                </div>

                <div className="p-4 bg-neutral-50 dark:bg-neutral-800/60 rounded-2xl border border-neutral-200 dark:border-neutral-800">
                  <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">
                    Hackathon Arena
                  </span>
                  <div className="text-sm font-bold text-neutral-900 dark:text-neutral-100 mt-1">
                    {record.hackathonTitle}
                  </div>
                </div>

                <div className="p-4 bg-neutral-50 dark:bg-neutral-800/60 rounded-2xl border border-neutral-200 dark:border-neutral-800">
                  <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">
                    Evaluations Completed
                  </span>
                  <div className="text-sm font-bold text-neutral-900 dark:text-neutral-100 mt-1 flex items-center gap-2">
                    <Scale className="w-4 h-4 text-[#FA541C]" />
                    <span>{record.evaluationsCount} Projects (Round {record.roundsCount})</span>
                  </div>
                </div>
              </div>

              {/* Cryptographic SHA-256 Proof */}
              <div className="p-4 bg-neutral-50 dark:bg-neutral-800/60 rounded-2xl border border-neutral-200 dark:border-neutral-800 space-y-1">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                  <KeyRound className="w-3.5 h-3.5 text-emerald-500" />
                  <span>SHA-256 Audit Integrity Hash (Publicly Computable)</span>
                </div>
                <p className="font-mono text-xs text-neutral-700 dark:text-neutral-300 break-all select-all">
                  {record.integrityHash}
                </p>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-4 text-xs">
              <span className="text-neutral-500">
                Issued by <strong>{record.organizationName}</strong>
              </span>

              <div className="flex items-center gap-3">
                <Link
                  href={`/verify/${record.verificationCode}`}
                  target="_blank"
                  className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 font-semibold transition-colors flex items-center gap-1.5"
                >
                  <span>Open Public Verification Page</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
