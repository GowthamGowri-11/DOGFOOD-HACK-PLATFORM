'use client';

import React from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Lock,
  Scale,
  Clock,
  Key,
  Users,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  Eye,
} from 'lucide-react';
import { AppShell } from '@/components/ui/AppShell';
import { Badge } from '@/components/ui/Badge';

interface ThreatItem {
  id: string;
  category: string;
  title: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  status: 'STOPPED' | 'PARTIALLY MITIGATED' | 'ACCEPTED RISK';
  whatWeStopped: string[];
  whatWeDidNotStop: string;
  defensiveMechanism: string;
}

const THREAT_ITEMS: ThreatItem[] = [
  {
    id: 'sybil-voting',
    category: 'Voting & Governance',
    title: 'Sybil Attacks & Multi-Account Ballot Stuffing',
    severity: 'CRITICAL',
    status: 'STOPPED',
    defensiveMechanism: 'Quadratic Voting (n² Cost), Unique DB Constraints, IP Hash Tracking',
    whatWeStopped: [
      'Single-issue voting blitzes: Casting n votes on a project costs n² credits (1 vote = 1 credit, 2 votes = 4 credits, 3 votes = 9 credits), depleting attacker influence rapidly.',
      'Replay and parallel request stacking prevented via PostgreSQL unique composite index on [projectId, userId].',
      'Unauthenticated automated voting scripts blocked via JWT session authentication.',
    ],
    whatWeDidNotStop:
      'Coordinated off-platform voting rings where an attacker recruits 50 real individuals with distinct Google/GitHub accounts across residential IPs. The system cannot distinguish authentic community word-of-mouth from paid friend groups without intrusive biometric KYC.',
  },
  {
    id: 'submission-scraping',
    category: 'Intellectual Property',
    title: 'Submission Scraping & Pre-Deadline Idea Theft',
    severity: 'HIGH',
    status: 'PARTIALLY MITIGATED',
    defensiveMechanism: 'Edge Rate-Limiting, Submission Lock State, Private Drafts',
    whatWeStopped: [
      'Pre-deadline espionage: In-progress submissions and repository links are completely locked and invisible to rival teams before the official submission window concludes.',
      'Mass automated scraping throttled via edge rate-limiting and sanitized payload representations.',
    ],
    whatWeDidNotStop:
      'Public Gallery Scraping: Once hackathon solutions are officially published to the public gallery, they are intentionally open to the world. Any script can read public descriptions, demo URLs, and GitHub repos.',
  },
  {
    id: 'judge-collusion',
    category: 'Judging & Evaluation',
    title: 'Judge Collusion, Biased Grading & Leniency Disparity',
    severity: 'CRITICAL',
    status: 'STOPPED',
    defensiveMechanism: 'Gaussian Z-Score Normalization, Bradley-Terry Pairwise Gavel Mode',
    whatWeStopped: [
      'Strict vs. Lenient Grader Penalties: Standardized Z-Score normalization (z = (x - μ) / σ) rescales every score to the global distribution, rescuing projects graded by harsh evaluators.',
      'Subjective Score Anchoring: Pairwise Mode (The Gavel Approach) replaces arbitrary numeric scoring with binary comparisons, eliminating cross-grader calibration discrepancies.',
      'Direct conflicts of interest automatically blocked via judge conflictTeamIds matching.',
    ],
    whatWeDidNotStop:
      'Covert off-platform collusion where two judges privately agree via encrypted chat to give a specific team poor scores while grading others normally. If their scores fall within standard variance, the intent cannot be detected algorithmically.',
  },
  {
    id: 'deadline-gaming',
    category: 'Competition Integrity',
    title: 'Deadline Gaming, Race Conditions & Late Commits',
    severity: 'HIGH',
    status: 'STOPPED',
    defensiveMechanism: 'Server Atomic UTC Clocks, Database Transaction Lock Snapshots',
    whatWeStopped: [
      'Client clock manipulation: Client device time is completely ignored; deadlines strictly enforce server-side UTC timestamps.',
      'Post-deadline repository edits: Locking creates an immutable payload snapshot inside a serializable PostgreSQL transaction.',
    ],
    whatWeDidNotStop:
      'Sub-second network packet drops: If a participant initiates a submit button click 200ms before 11:59:59 PM and mobile latency delays packet arrival past 12:00:00 AM, the server strictly rejects it. Organizers can issue manual grace period overrides via the Audit Log.',
  },
  {
    id: 'privilege-escalation',
    category: 'System Security',
    title: 'Privilege Escalation & Unauthorized Access',
    severity: 'CRITICAL',
    status: 'STOPPED',
    defensiveMechanism: 'HMAC Webhook Signatures, RBAC Guards, Immutable Audit Logs',
    whatWeStopped: [
      'Unauthorized judging or administrative mutations blocked by strict server-side RBAC guards (requireRole).',
      'Tampering with vote tallies or results generates immutable AuditLog entries with before/after JSON states and actor IPs, readable by organizers without a database client.',
      'Webhook payload forgery prevented via HMAC-SHA256 signatures in the X-Dogfood-Signature header.',
    ],
    whatWeDidNotStop:
      'Compromise of the organizer’s physical laptop or credentials: An attacker with full possession of an authenticated admin session can legitimately trigger authorized operations.',
  },
];

export default function ThreatModelPage() {
  return (
    <AppShell
      showFeaturedRail={false}
      pageTitle="Defensive Threat Model & Security Architecture"
      pageSubtitle="An honest, verifiable account of hackathon voting, submission, and judging attack vectors."
    >
      <div className="max-w-5xl mx-auto space-y-8 select-none pb-16">
        {/* Header Section */}
        <div className="border-b border-[#E5E0D8] pb-6">
          <div className="flex items-center space-x-2 text-xs font-bold text-[#FA541C] uppercase tracking-wider mb-2">
            <ShieldAlert className="w-4 h-4" />
            <span>Platform Security Architecture</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#18181B] tracking-tight">
            Defensive Threat Model
          </h1>
          <p className="text-xs sm:text-sm text-[#6B7280] font-normal mt-1.5 max-w-3xl leading-relaxed">
            Every hackathon platform claims security. We publish an honest threat model naming the attacks we stopped, the mathematical defenses we deployed, and the attacks we did not stop.
          </p>
          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-semibold text-[#18181B]">
            <span>Philosophy:</span>
            <span className="text-[#FA541C] italic">
              “The honest list is worth more than the heroic one.”
            </span>
          </div>
        </div>

        {/* Threat Cards */}
        <div className="space-y-6">
          {THREAT_ITEMS.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-[#E5E0D8] p-6 shadow-xs hover:border-[#CBD5E1] transition-all space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F4EFEA] pb-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">
                    {item.category}
                  </span>
                  <h3 className="text-base sm:text-lg font-bold text-[#18181B] mt-0.5">
                    {item.title}
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold ${
                      item.severity === 'CRITICAL'
                        ? 'bg-red-50 text-red-700 border border-red-200'
                        : item.severity === 'HIGH'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-neutral-100 text-neutral-700 border border-neutral-200'
                    }`}
                  >
                    {item.severity}
                  </span>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold ${
                      item.status === 'STOPPED'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : item.status === 'PARTIALLY MITIGATED'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'bg-purple-50 text-purple-700 border border-purple-200'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
              </div>

              {/* Primary Defense */}
              <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#E5E0D8] text-xs font-semibold flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#059669] flex-shrink-0" />
                <span>
                  <strong className="text-[#18181B]">Primary Defensive Mechanism:</strong>{' '}
                  <span className="text-[#6B7280]">{item.defensiveMechanism}</span>
                </span>
              </div>

              {/* What We Stopped */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-[#059669] flex items-center gap-1.5 uppercase tracking-wider">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Attacks We Stopped</span>
                </span>
                <ul className="space-y-1.5 text-xs text-[#334155] pl-1">
                  {item.whatWeStopped.map((w, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#059669] mt-1.5 flex-shrink-0" />
                      <span>{w}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* What We Did Not Stop */}
              <div className="p-4 rounded-xl bg-[#FEF2F2] border border-[#FECACA] space-y-1">
                <span className="text-xs font-bold text-[#DC2626] flex items-center gap-1.5 uppercase tracking-wider">
                  <AlertTriangle className="w-4 h-4" />
                  <span>What We Did NOT Stop (Accepted Limitation)</span>
                </span>
                <p className="text-xs text-[#7F1D1D] leading-relaxed">
                  {item.whatWeDidNotStop}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Audit Guarantee Footer */}
        <div className="bg-[#FAF8F5] border border-[#E5E0D8] rounded-2xl p-6 text-xs text-[#6B7280] space-y-2">
          <div className="font-bold text-[#18181B] text-sm">
            Zero Client Auditability Guarantee
          </div>
          <p className="leading-relaxed">
            Every critical action is logged to immutable PostgreSQL records containing actor IDs, high-precision UTC timestamps, IP hashes, and before/after JSON states. Organizers can inspect these logs directly in the browser via{' '}
            <Link href="/organizer/audit" className="text-[#FA541C] font-bold underline">
              /organizer/audit
            </Link>{' '}
            without requiring database access.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
