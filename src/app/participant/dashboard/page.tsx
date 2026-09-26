import React from 'react';
import Link from 'next/link';
import {
  Trophy,
  Users,
  FolderKanban,
  FileCheck,
  Award,
  CheckCircle2,
  Clock,
  ArrowRight,
  Plus,
  Github,
  ExternalLink,
  ShieldCheck,
  QrCode,
  Sparkles,
} from 'lucide-react';
import { getSession } from '@/server/auth/session';
import { RegistrationRepository } from '@/server/repositories/registration.repository';
import { HackathonRepository } from '@/server/repositories/hackathon.repository';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { KPICard } from '@/components/ui/KPICard';

export const dynamic = 'force-dynamic';

export default async function ParticipantDashboard() {
  const session = await getSession();
  const userName = session?.fullName || 'Alice Hacker';

  // Fetch user registrations
  const registrations = session
    ? await RegistrationRepository.listByUser(session.id)
    : [];

  return (
    <div className="space-y-8 select-none">
      {/* 1. Header: Good morning, [Name] */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-[#E2E8F0]">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-[#64748B] mb-1">
            <span>Participant Workspace</span>
            <span>•</span>
            <Badge variant="blue">Builder Arena</Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-tight">
            Good morning, {userName}
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-0.5 font-normal">
            Track your active competitions, team formation, solution builds, and verified certificates.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <Link href="/hackathons">
            <Button variant="secondary" size="md">
              Explore Hackathons
            </Button>
          </Link>
          <Link href="/participant/teams">
            <Button variant="primary" size="md" icon={<Plus className="w-4 h-4" />}>
              Create / Join Team
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Interactive Workflow Pipeline Progress Tracker */}
      <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[18px] p-6 shadow-card space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-[#2563EB]" />
            <h2 className="text-sm font-bold text-[#111827]">Competition Submission Pipeline</h2>
          </div>
          <span className="text-xs font-semibold text-[#059669] bg-[#ECFDF5] px-2.5 py-0.5 rounded-full border border-[#A7F3D0]">
            80% Ready to Submit
          </span>
        </div>

        {/* 5-Step Pipeline Steps */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
          {[
            { step: '1', title: 'Registration', status: 'completed' },
            { step: '2', title: 'Team Formed', status: 'completed' },
            { step: '3', title: 'Track / PS', status: 'completed' },
            { step: '4', title: 'Artifacts', status: 'completed' },
            { step: '5', title: 'Final Submit', status: 'in_progress' },
          ].map((item) => (
            <div
              key={item.step}
              className={`p-3 rounded-xl border flex items-center space-x-2.5 ${
                item.status === 'completed'
                  ? 'bg-white border-[#A7F3D0] text-[#047857]'
                  : 'bg-white border-[#BFDBFE] text-[#1D4ED8]'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  item.status === 'completed'
                    ? 'bg-[#ECFDF5] text-[#059669]'
                    : 'bg-[#EFF6FF] text-[#2563EB]'
                }`}
              >
                {item.status === 'completed' ? '✓' : '5'}
              </div>
              <div className="truncate">
                <span className="block text-xs font-bold text-[#111827] truncate">
                  {item.title}
                </span>
                <span className="text-[10px] text-[#64748B]">
                  {item.status === 'completed' ? 'Verified' : 'Pending'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Metrics Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Registered Events"
          value={registrations.length || 1}
          icon={<Trophy className="w-4 h-4" />}
          badge="Active"
        />
        <KPICard
          label="My Teams"
          value={1}
          icon={<Users className="w-4 h-4" />}
          subtext="Sentinel AI (3 Members)"
        />
        <KPICard
          label="Draft Submissions"
          value={1}
          icon={<FileCheck className="w-4 h-4" />}
          trend={{ value: 'Ready', isPositive: true }}
        />
        <KPICard
          label="Verified Badges"
          value={1}
          icon={<ShieldCheck className="w-4 h-4" />}
          subtext="1 Issued Certificate"
        />
      </div>

      {/* 4. My Hackathons & Active Project */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#111827]">My Active Hackathons</h2>
          <Link href="/hackathons" className="text-xs font-semibold text-[#2563EB] hover:underline">
            Browse All Competitions →
          </Link>
        </div>

        {/* Hackathon Item Card */}
        <div className="bg-white border border-[#E2E8F0] rounded-[16px] p-6 shadow-card space-y-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <div className="flex items-center space-x-2 text-xs text-[#64748B] mb-1">
                <span className="font-semibold text-[#334155]">Apex Frontier Systems</span>
                <span>•</span>
                <Badge variant="purple">In Judging</Badge>
              </div>
              <h3 className="text-xl font-bold text-[#111827]">
                Apex AI Global Hackathon 2026
              </h3>
            </div>

            <div className="flex items-center space-x-2">
              <Link href="/projects/proj_sentinel_ai">
                <Button variant="outline" size="sm" icon={<ExternalLink className="w-3.5 h-3.5" />}>
                  View Showcase
                </Button>
              </Link>
              <Link href="/hackathons/apex-ai-global-hackathon-2026">
                <Button variant="secondary" size="sm">
                  Event Details
                </Button>
              </Link>
            </div>
          </div>

          {/* Project Details Subsection */}
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#334155]">
                Project: <strong>SentinelShield: Autonomous Multi-Agent Threat Neutralization</strong>
              </span>
              <span className="text-[11px] font-bold text-[#059669] bg-[#ECFDF5] px-2 py-0.5 rounded border border-[#A7F3D0]">
                Submitted & Locked
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-[#64748B]">
              <span className="inline-flex items-center">
                <Users className="w-3.5 h-3.5 mr-1.5 text-[#2563EB]" />
                Team: <strong>Team Sentinel AI</strong> (3 Members)
              </span>
              <span className="inline-flex items-center">
                <FolderKanban className="w-3.5 h-3.5 mr-1.5 text-[#7E22CE]" />
                Track: <strong>Autonomous AI Agents</strong>
              </span>
              <span className="inline-flex items-center text-[#2563EB]">
                <Github className="w-3.5 h-3.5 mr-1" />
                github.com/dogfood/sentinel-shield
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Quick Links Grid: Teams, Certificates, Attendance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Teams card */}
        <div className="bg-white border border-[#E2E8F0] rounded-[16px] p-5 shadow-card space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
              My Team
            </span>
            <Users className="w-4 h-4 text-[#2563EB]" />
          </div>
          <h4 className="text-base font-bold text-[#111827]">Team Sentinel AI</h4>
          <p className="text-xs text-[#64748B]">
            Invite Code: <code className="font-mono font-bold text-[#2563EB]">INV-SENTINEL-AI</code>
          </p>
          <div className="pt-2">
            <Link
              href="/participant/teams"
              className="text-xs font-semibold text-[#2563EB] hover:underline inline-flex items-center"
            >
              <span>Manage Team Roster</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>
        </div>

        {/* Certificates card */}
        <div className="bg-white border border-[#E2E8F0] rounded-[16px] p-5 shadow-card space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
              Certificates
            </span>
            <Award className="w-4 h-4 text-[#059669]" />
          </div>
          <h4 className="text-base font-bold text-[#111827]">1 Issued Credential</h4>
          <p className="text-xs text-[#64748B]">
            Cryptographically signed and employer-verifiable digital certificates.
          </p>
          <div className="pt-2">
            <Link
              href="/participant/certificates"
              className="text-xs font-semibold text-[#059669] hover:underline inline-flex items-center"
            >
              <span>View & Verify Certificate</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>
        </div>

        {/* Attendance Check-in card */}
        <div className="bg-white border border-[#E2E8F0] rounded-[16px] p-5 shadow-card space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
              Attendance
            </span>
            <QrCode className="w-4 h-4 text-[#D97706]" />
          </div>
          <h4 className="text-base font-bold text-[#111827]">Check-In Sessions</h4>
          <p className="text-xs text-[#64748B]">
            Enter a session code or scan QR badge during live workshops and orientation.
          </p>
          <div className="pt-2">
            <Link
              href="/participant/attendance"
              className="text-xs font-semibold text-[#D97706] hover:underline inline-flex items-center"
            >
              <span>Check-in Status</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
