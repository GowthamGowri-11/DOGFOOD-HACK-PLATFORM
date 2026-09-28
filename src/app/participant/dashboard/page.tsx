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
  Activity,
  Layers,
  AlertCircle,
} from 'lucide-react';
import { getSession } from '@/server/auth/session';
import prisma from '@/lib/prisma';
import { RegistrationRepository } from '@/server/repositories/registration.repository';
import { TeamRepository } from '@/server/repositories/team.repository';
import { ProjectRepository } from '@/server/repositories/project.repository';
import { SubmissionRepository } from '@/server/repositories/submission.repository';
import { AuditService } from '@/server/services/audit.service';
import { SubmissionValidator } from '@/server/services/submission-validator.service';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export const dynamic = 'force-dynamic';

export default async function ParticipantDashboard() {
  const session = await getSession();
  if (!session) {
    return <div className="p-8 text-sm text-slate-500">Unable to load session.</div>;
  }

  // 1. Fetch all real data in parallel with error resilience
  let registrations: any[] = [];
  let teams: any[] = [];
  let projects: any[] = [];
  let submissions: any[] = [];
  let certificates: any[] = [];
  let attendanceRecords: any[] = [];
  let activeSessionsCount = 0;
  let recentActivity: any[] = [];

  try {
    const results = await Promise.all([
      RegistrationRepository.listByUser(session.id),
      TeamRepository.listByUser(session.id),
      ProjectRepository.listByUser(session.id),
      SubmissionRepository.listByUser(session.id),
      prisma.certificate.findMany({
        where: { userId: session.id },
        include: {
          hackathon: {
            select: { title: true, slug: true },
          },
        },
        orderBy: { issuedAt: 'desc' },
      }),
      prisma.attendanceRecord.findMany({
        where: { userId: session.id },
        include: {
          session: {
            include: {
              hackathon: { select: { title: true } },
            },
          },
        },
      }),
      prisma.attendanceSession.count({
        where: { isActive: true },
      }),
      AuditService.listByUser(session.id, 6),
    ]);

    registrations = results[0] || [];
    teams = results[1] || [];
    projects = results[2] || [];
    submissions = results[3] || [];
    certificates = results[4] || [];
    attendanceRecords = results[5] || [];
    activeSessionsCount = results[6] || 0;
    recentActivity = results[7] || [];
  } catch (err) {
    console.error('[ParticipantDashboard] DB query failed:', err);
  }

  // Primary active competition context (latest registration)
  const primaryRegistration = registrations[0] || null;
  const primaryHackathon = primaryRegistration?.hackathon || null;
  const primaryTeam = teams.find((t) => t.hackathonId === primaryHackathon?.id) || teams[0] || null;
  const primaryProject = projects.find((p) => p.hackathonId === primaryHackathon?.id) || projects[0] || null;
  const primarySubmission = submissions.find((s) => s.projectId === primaryProject?.id) || null;

  return (
    <div className="space-y-6 select-none max-w-[1400px] mx-auto pb-8">
      {/* 1. PARTICIPANT HERO BANNER */}
      <div className="relative overflow-hidden rounded-[18px] bg-gradient-to-r from-[#F8FAFC] via-[#F1F5F9] to-[#E2E8F0] border border-[#E2E8F0] shadow-sm">
        <div className="flex flex-col lg:flex-row items-stretch justify-between min-h-[160px]">
          {/* Left Content Area */}
          <div className="p-6 sm:p-8 flex-1 flex flex-col justify-center z-10 space-y-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#0F172A] tracking-tight flex items-center gap-2">
                <span>Welcome Back,</span>
                <span className="text-[#2563EB]">{session.fullName}</span>
                <span className="text-2xl">👋</span>
              </h1>
              <p className="text-sm text-[#64748B] mt-1 max-w-xl font-normal">
                Track your journey, complete milestones and make an impact.
              </p>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link href="/hackathons">
                <Button variant="primary" size="md" className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-sm font-medium px-5 rounded-xl">
                  Explore Hackathons &rarr;
                </Button>
              </Link>
              <Link href="/projects">
                <Button variant="secondary" size="md" className="bg-white border-[#CBD5E1] text-[#334155] hover:bg-[#F8FAFC] font-medium px-4 rounded-xl">
                  View Project Showcase
                </Button>
              </Link>
            </div>
          </div>

          {/* Right Hero Graphic / Architectural Perspective */}
          <div className="relative hidden md:block w-[380px] lg:w-[460px] overflow-hidden flex-shrink-0">
            <img
              src="/atlyx-hero-banner.jpg"
              alt="ATLYX Arena"
              className="absolute inset-0 w-full h-full object-cover object-center"
            />
            {/* Gradient Overlay for seamless blending */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#F8FAFC] via-transparent to-black/30" />
            <div className="absolute right-5 bottom-4 text-right z-10">
              <span className="text-xs font-semibold uppercase tracking-widest text-white/90 drop-shadow-md">
                Ideas today, Impact tomorrow.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Round Progression Status Banner */}
      {primaryTeam && primaryHackathon && (primaryTeam.progressionStatus === 'ADVANCED' || primaryTeam.progressionStatus === 'ELIMINATED') && (
        <div
          className={`rounded-[18px] p-5 border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs ${
            primaryTeam.progressionStatus === 'ADVANCED'
              ? 'bg-[#ECFDF5] border-[#A7F3D0]'
              : 'bg-[#FFFBEB] border-[#FDE68A]'
          }`}
        >
          <div className="flex items-start space-x-3.5">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                primaryTeam.progressionStatus === 'ADVANCED'
                  ? 'bg-[#D1FAE5] text-[#059669] border border-[#A7F3D0]'
                  : 'bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A]'
              }`}
            >
              {primaryTeam.progressionStatus === 'ADVANCED' ? (
                <Trophy className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#334155]">
                  {primaryHackathon.title} • Round Progression Update
                </span>
                {primaryTeam.progressionStatus === 'ADVANCED' ? (
                  <Badge variant="emerald">ADVANCED TO ROUND {primaryTeam.highestRound}</Badge>
                ) : (
                  <Badge variant="amber">NOT SELECTED</Badge>
                )}
              </div>
              <p
                className={`text-sm font-bold ${
                  primaryTeam.progressionStatus === 'ADVANCED' ? 'text-[#065F46]' : 'text-[#92400E]'
                }`}
              >
                {primaryTeam.progressionStatus === 'ADVANCED'
                  ? `Your team has been selected for the next round of ${primaryHackathon.title}.`
                  : `Your team was not selected for the next round of ${primaryHackathon.title}.`}
              </p>
              <p
                className={`text-xs ${
                  primaryTeam.progressionStatus === 'ADVANCED' ? 'text-[#047857]' : 'text-[#B45309]'
                }`}
              >
                {primaryTeam.progressionStatus === 'ADVANCED'
                  ? `You have unlocked Round ${primaryTeam.highestRound} features, submissions, and workspace access.`
                  : 'You can still view the published leaderboard and official rankings. All historical submissions and evaluations remain intact.'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 flex-shrink-0 w-full sm:w-auto">
            {primaryTeam.progressionStatus === 'ADVANCED' ? (
              <Link href={`/hackathons/${primaryHackathon.slug}`} className="w-full sm:w-auto">
                <Button variant="primary" size="sm" className="w-full sm:w-auto font-bold">
                  Access Round {primaryTeam.highestRound} →
                </Button>
              </Link>
            ) : (
              <Link href="/leaderboard" className="w-full sm:w-auto">
                <Button variant="secondary" size="sm" className="w-full sm:w-auto font-bold">
                  View Leaderboard →
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* 2. TWO-COLUMN SECTION: Your Registered Hackathon & Hackathon Journey */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* LEFT: Your Registered Hackathon Card (5 Cols) */}
        <div className="lg:col-span-5 bg-white border border-[#E2E8F0] rounded-[18px] p-5 sm:p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-[#2563EB]" />
                <h2 className="text-sm font-bold text-[#0F172A] tracking-tight uppercase">
                  Your Registered Hackathon
                </h2>
              </div>
              {primaryRegistration && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">
                  ✓ Confirmed
                </span>
              )}
            </div>

            {primaryHackathon ? (
              <div className="mt-4 space-y-3">
                {/* Hackathon Image & Info */}
                <div className="flex items-center space-x-3.5">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-[#F1F5F9] border border-[#E2E8F0] flex-shrink-0 relative">
                    {primaryHackathon.bannerUrl ? (
                      <img
                        src={primaryHackathon.bannerUrl}
                        alt={primaryHackathon.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-[#2563EB] text-white font-bold text-lg">
                        {primaryHackathon.title.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-bold text-[#0F172A] truncate">
                      {primaryHackathon.title}
                    </h3>
                    <p className="text-xs text-[#64748B] truncate mt-0.5">
                      {primaryHackathon.organizer?.organizationName || primaryHackathon.organizer?.user?.fullName || 'Apex Frontier Systems'}
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      <span className="text-[11px] font-medium text-[#475569] bg-[#F8FAFC] border border-[#E2E8F0] px-2 py-0.5 rounded-md flex items-center gap-1">
                        <span>📅</span>
                        <span>{new Date(primaryHackathon.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {new Date(primaryHackathon.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </span>
                      <span className="text-[11px] font-medium text-[#2563EB] bg-[#EFF6FF] border border-[#BFDBFE] px-2 py-0.5 rounded-md">
                        {primaryHackathon.mode || 'Online'}
                      </span>
                      {primaryHackathon.tracks?.[0] && (
                        <span className="text-[11px] font-medium text-[#475569] bg-[#F1F5F9] px-2 py-0.5 rounded-md truncate max-w-[120px]">
                          {primaryHackathon.tracks[0].title}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center space-y-2">
                <Trophy className="w-8 h-8 text-[#94A3B8] mx-auto" />
                <p className="text-sm font-medium text-[#64748B]">No active registration</p>
                <Link href="/hackathons">
                  <Button variant="primary" size="sm" className="mt-2 bg-[#2563EB] text-white">
                    Explore Hackathons
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {primaryHackathon && (
            <div className="pt-3 border-t border-[#F1F5F9]">
              <Link href={`/hackathons/${primaryHackathon.slug || primaryHackathon.id}`}>
                <Button variant="secondary" size="sm" className="w-full justify-between text-xs font-semibold text-[#2563EB] bg-[#EFF6FF] hover:bg-[#DBEAFE] border-[#BFDBFE] rounded-xl">
                  <span>View Hackathon Details</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* RIGHT: Hackathon Journey Timeline (7 Cols) */}
        <div className="lg:col-span-7 bg-white border border-[#E2E8F0] rounded-[18px] p-5 sm:p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-[#2563EB]" />
              <h2 className="text-sm font-bold text-[#0F172A] tracking-tight uppercase">
                Hackathon Journey
              </h2>
            </div>
            {primaryHackathon && (
              <Link
                href={`/hackathons/${primaryHackathon.slug || primaryHackathon.id}#timeline`}
                className="text-xs font-semibold text-[#2563EB] hover:underline flex items-center gap-1"
              >
                <span>View Timeline</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            )}
          </div>

          {/* Timeline Nodes */}
          <div className="relative py-2">
            {/* Connecting line */}
            <div className="absolute top-5 left-4 right-4 h-0.5 bg-[#E2E8F0] -z-0 hidden sm:block" />

            <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 sm:gap-1 text-center relative z-10">
              {/* Step 1: Registration Confirmed */}
              <div className="flex flex-col items-center space-y-1.5">
                <div className="w-9 h-9 rounded-full bg-[#2563EB] text-white flex items-center justify-center text-xs font-bold shadow-sm">
                  ✓
                </div>
                <div className="text-[11px] font-bold text-[#0F172A] leading-tight">
                  Registration Confirmed
                </div>
                <div className="text-[10px] text-[#64748B]">Feb 28</div>
              </div>

              {/* Step 2: Idea Submission */}
              <div className="flex flex-col items-center space-y-1.5">
                <div className="w-9 h-9 rounded-full bg-[#2563EB] text-white flex items-center justify-center text-xs font-bold shadow-sm">
                  ✓
                </div>
                <div className="text-[11px] font-bold text-[#0F172A] leading-tight">
                  Idea Submission
                </div>
                <div className="text-[10px] text-[#64748B]">Mar 05</div>
              </div>

              {/* Step 3: Round 1 Evaluation */}
              <div className="flex flex-col items-center space-y-1.5">
                <div className="w-9 h-9 rounded-full bg-[#2563EB] text-white flex items-center justify-center text-xs font-bold shadow-sm">
                  ✓
                </div>
                <div className="text-[11px] font-bold text-[#0F172A] leading-tight">
                  Round 1 Evaluation
                </div>
                <div className="text-[10px] text-[#64748B]">Mar 10</div>
              </div>

              {/* Step 4: Grand Finale */}
              <div className="flex flex-col items-center space-y-1.5">
                <div className="w-9 h-9 rounded-full bg-[#EFF6FF] border-2 border-[#2563EB] text-[#2563EB] flex items-center justify-center text-xs font-bold shadow-sm">
                  4
                </div>
                <div className="text-[11px] font-bold text-[#0F172A] leading-tight">
                  Grand Finale
                </div>
                <div className="text-[10px] text-[#2563EB] font-semibold">Mar 15</div>
              </div>

              {/* Step 5: Jury Scoring */}
              <div className="flex flex-col items-center space-y-1.5">
                <div className="w-9 h-9 rounded-full bg-[#F1F5F9] border border-[#CBD5E1] text-[#94A3B8] flex items-center justify-center text-xs font-bold">
                  5
                </div>
                <div className="text-[11px] font-medium text-[#64748B] leading-tight">
                  Jury Scoring
                </div>
                <div className="text-[10px] text-[#94A3B8]">Mar 18</div>
              </div>

              {/* Step 6: Winners Announced */}
              <div className="flex flex-col items-center space-y-1.5">
                <div className="w-9 h-9 rounded-full bg-[#F1F5F9] border border-[#CBD5E1] text-[#94A3B8] flex items-center justify-center text-xs font-bold">
                  6
                </div>
                <div className="text-[11px] font-medium text-[#64748B] leading-tight">
                  Winners Announced
                </div>
                <div className="text-[10px] text-[#94A3B8]">Mar 20</div>
              </div>
            </div>
          </div>

          <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2 text-[#334155]">
              <span className="font-semibold text-[#0F172A]">Current Phase:</span>
              <span className="text-[#2563EB] font-bold">Idea Submission & Verification</span>
            </div>
            <span className="text-[11px] font-medium text-[#64748B]">Stage 2 of 6</span>
          </div>
        </div>
      </div>

      {/* 3. METRIC CARDS & NEXT MILESTONE ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Metric 1: My Teams */}
        <Link href="/participant/teams" className="group">
          <div className="h-full bg-white border border-[#E2E8F0] group-hover:border-[#2563EB] rounded-[16px] p-5 shadow-sm transition-all flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs font-bold text-[#64748B] uppercase tracking-wider">
                <Users className="w-4 h-4 text-[#2563EB]" />
                <span>My Teams</span>
              </div>
              <ArrowRight className="w-4 h-4 text-[#94A3B8] group-hover:text-[#2563EB] group-hover:translate-x-0.5 transition-transform" />
            </div>
            <div>
              <div className="text-2xl font-extrabold text-[#0F172A]">{teams.length}</div>
              <p className="text-xs text-[#64748B] truncate mt-0.5">
                {primaryTeam ? `${primaryTeam.name} (${primaryTeam.members?.length || 1} Members)` : 'No active team'}
              </p>
            </div>
          </div>
        </Link>

        {/* Metric 2: My Projects */}
        <Link href="/participant/projects" className="group">
          <div className="h-full bg-white border border-[#E2E8F0] group-hover:border-[#2563EB] rounded-[16px] p-5 shadow-sm transition-all flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs font-bold text-[#64748B] uppercase tracking-wider">
                <FolderKanban className="w-4 h-4 text-[#2563EB]" />
                <span>My Projects</span>
              </div>
              <ArrowRight className="w-4 h-4 text-[#94A3B8] group-hover:text-[#2563EB] group-hover:translate-x-0.5 transition-transform" />
            </div>
            <div>
              <div className="text-2xl font-extrabold text-[#0F172A]">{projects.length}</div>
              <p className="text-xs text-[#64748B] truncate mt-0.5">
                {primaryProject ? primaryProject.title : 'Not Started'}
              </p>
            </div>
          </div>
        </Link>

        {/* Metric 3: My Submissions */}
        <Link href="/participant/submissions" className="group">
          <div className="h-full bg-white border border-[#E2E8F0] group-hover:border-[#2563EB] rounded-[16px] p-5 shadow-sm transition-all flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs font-bold text-[#64748B] uppercase tracking-wider">
                <FileCheck className="w-4 h-4 text-[#2563EB]" />
                <span>My Submissions</span>
              </div>
              <ArrowRight className="w-4 h-4 text-[#94A3B8] group-hover:text-[#2563EB] group-hover:translate-x-0.5 transition-transform" />
            </div>
            <div>
              <div className="text-2xl font-extrabold text-[#0F172A]">{submissions.length}</div>
              <p className="text-xs text-[#64748B] truncate mt-0.5">
                {primarySubmission ? primarySubmission.status : 'No Submissions Yet'}
              </p>
            </div>
          </div>
        </Link>

        {/* Metric 4: My Certificates */}
        <Link href="/participant/certificates" className="group">
          <div className="h-full bg-white border border-[#E2E8F0] group-hover:border-[#2563EB] rounded-[16px] p-5 shadow-sm transition-all flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs font-bold text-[#64748B] uppercase tracking-wider">
                <Award className="w-4 h-4 text-[#2563EB]" />
                <span>My Certificates</span>
              </div>
              <ArrowRight className="w-4 h-4 text-[#94A3B8] group-hover:text-[#2563EB] group-hover:translate-x-0.5 transition-transform" />
            </div>
            <div>
              <div className="text-2xl font-extrabold text-[#0F172A]">{certificates.length}</div>
              <p className="text-xs text-[#64748B] truncate mt-0.5">
                {certificates.length > 0 ? `${certificates.length} Issued` : 'No Certificates Yet'}
              </p>
            </div>
          </div>
        </Link>

        {/* Card 5: Next Milestone Card */}
        <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-[16px] p-5 shadow-sm flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#1E40AF] uppercase tracking-wider">
              Next Milestone
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#DBEAFE] text-[#1D4ED8]">
              2 days left
            </span>
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-[#2563EB]" />
              <span className="text-sm font-bold text-[#0F172A]">Idea Submission</span>
            </div>
            <p className="text-xs text-[#64748B] mt-0.5">Mar 10, 11:59 PM</p>
          </div>

          <Link href="/participant/submissions" className="pt-1">
            <Button variant="primary" size="sm" className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold py-1.5 rounded-xl">
              Submit Idea &rarr;
            </Button>
          </Link>
        </div>
      </div>

      {/* 4. MY REGISTRATIONS & ACTIVITY SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: My Registrations List (8 Cols) */}
        <div className="lg:col-span-8 bg-white border border-[#E2E8F0] rounded-[18px] p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
            <h2 className="text-sm font-bold text-[#0F172A] tracking-tight uppercase flex items-center gap-2">
              <Trophy className="w-4 h-4 text-[#2563EB]" />
              <span>My Registrations</span>
            </h2>
            <Link href="/hackathons" className="text-xs font-semibold text-[#2563EB] hover:underline">
              Explore More &rarr;
            </Link>
          </div>

          {registrations.length === 0 ? (
            <div className="py-8 text-center text-sm text-[#64748B]">
              No hackathons registered yet.
            </div>
          ) : (
            <div className="divide-y divide-[#F1F5F9]">
              {registrations.map((reg) => (
                <div key={reg.id} className="py-3.5 flex items-center justify-between hover:bg-[#F8FAFC] px-2 rounded-xl transition-colors">
                  <div className="flex items-center space-x-3 truncate">
                    <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] flex items-center justify-center font-bold text-sm flex-shrink-0">
                      {reg.hackathon.title.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="truncate">
                      <Link href={`/hackathons/${reg.hackathon.slug || reg.hackathon.id}`} className="font-semibold text-sm text-[#0F172A] hover:text-[#2563EB] truncate block">
                        {reg.hackathon.title}
                      </Link>
                      <div className="flex items-center space-x-2 text-xs text-[#64748B] mt-0.5">
                        <span>{reg.hackathon.mode || 'Online'}</span>
                        <span>•</span>
                        <span>{new Date(reg.hackathon.startDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">
                      {reg.status || 'Confirmed'}
                    </span>
                    <Link href={`/hackathons/${reg.hackathon.slug || reg.hackathon.id}`}>
                      <ArrowRight className="w-4 h-4 text-[#94A3B8] hover:text-[#2563EB]" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Recent Activity Timeline (4 Cols) */}
        <div className="lg:col-span-4 bg-white border border-[#E2E8F0] rounded-[18px] p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
            <h2 className="text-sm font-bold text-[#0F172A] tracking-tight uppercase flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#2563EB]" />
              <span>Recent Activity</span>
            </h2>
            <Link href="/participant/activity" className="text-xs font-semibold text-[#2563EB] hover:underline">
              View All
            </Link>
          </div>

          {recentActivity.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#94A3B8]">
              No recent audit activity.
            </div>
          ) : (
            <div className="space-y-3">
              {recentActivity.slice(0, 5).map((log: any) => (
                <div key={log.id} className="text-xs flex items-start space-x-2.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#2563EB] mt-1.5 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-[#1E293B] truncate">{log.action}</p>
                    <p className="text-[11px] text-[#64748B]">
                      {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {log.resourceType || 'System'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
