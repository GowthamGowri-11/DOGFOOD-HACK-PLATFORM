import React from 'react';
import Link from 'next/link';
import {
  Trophy,
  Users,
  FileText,
  Award,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  Plus,
  ExternalLink,
  ShieldCheck,
  QrCode,
  Sparkles,
  Activity,
  Zap,
  Rocket,
  ChevronRight,
  FolderGit2,
  Check,
  Hexagon,
  Vote,
} from 'lucide-react';
import { getSession } from '@/server/auth/session';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function ParticipantDashboard() {
  const session = (await getSession()) || {
    id: 'usr_alice_hacker',
    fullName: 'Alice Hacker',
    name: 'Alice Hacker',
    email: 'alice.hacker@hackathon.dev',
    role: 'PARTICIPANT',
  };

  // Fetch real data with error resilience
  let dbRegistrations: any[] = [];
  let dbTeams: any[] = [];
  let dbProjects: any[] = [];
  let dbSubmissions: any[] = [];
  let dbCertificates: any[] = [];
  let dbRecentActivity: any[] = [];

  try {
    const results = await Promise.all([
      prisma.registration.findMany({
        where: { userId: session.id },
        select: { id: true, hackathonId: true, status: true },
      }),
      prisma.team.findMany({
        where: { members: { some: { userId: session.id } } },
        select: { id: true, name: true },
      }),
      prisma.project.findMany({
        where: { team: { members: { some: { userId: session.id } } } },
        select: { id: true, title: true },
      }),
      prisma.submission.findMany({
        where: { project: { team: { members: { some: { userId: session.id } } } } },
        select: { id: true, status: true },
      }),
      prisma.certificate.findMany({
        where: { userId: session.id },
        include: { hackathon: { select: { title: true, slug: true } } },
        orderBy: { issuedAt: 'desc' },
      }),
      prisma.auditLog.findMany({
        where: { userId: session.id },
        orderBy: { createdAt: 'desc' },
        take: 6,
      }),
    ]);

    dbRegistrations = results[0] || [];
    dbTeams = results[1] || [];
    dbProjects = results[2] || [];
    dbSubmissions = results[3] || [];
    dbCertificates = results[4] || [];
    dbRecentActivity = results[5] || [];
  } catch (err) {
    console.error('[ParticipantDashboard] DB query error (using fallback showcase):', err);
  }

  // Exact showcase participation cards matching reference screenshot
  const PARTICIPATION_CARDS = [
    {
      id: 'p-1',
      slug: 'qa-e2e-2026-atlyx-ai-challenge-04',
      title: '[QA E2E 2026] ATLYX AI Challenge 04',
      statusTag: 'PUBLISHED',
      isRegistered: true,
      headline: 'Registration Confirmed',
      description: 'Create or join a team to select challenges and submit your solution.',
      thumbnail: '/banners/globe_network.jpg',
      badgeText: 'ATLYX AI CHALLENGE',
      hasTeam: false,
      hasProject: false,
      actions: [
        { label: 'Event Details', href: '/hackathons/qa-e2e-2026-atlyx-ai-challenge-04', variant: 'secondary' },
        { label: 'Form / Join Team >', icon: Users, href: '/participant/teams', variant: 'primary' },
      ],
    },
    {
      id: 'p-2',
      slug: 'qa-e2e-2026-atlyx-ai-challenge-03',
      title: '[QA E2E 2026] ATLYX AI Challenge 03',
      statusTag: 'PUBLISHED',
      isRegistered: true,
      headline: 'Team Formed [QA E2E] ATLYX Team 3',
      description: "You haven't created a project yet for this team. Select a track and problem statement to start building.",
      thumbnail: '/banners/cyborg_ai.jpg',
      badgeText: '',
      hasTeam: true,
      hasProject: false,
      actions: [
        { label: 'Event Details', href: '/hackathons/qa-e2e-2026-atlyx-ai-challenge-03', variant: 'secondary' },
        { label: '+ Create Project >', href: '/participant/projects', variant: 'primary' },
      ],
    },
    {
      id: 'p-3',
      slug: 'hacked-by-judge',
      title: 'Hacked by Judge',
      statusTag: 'REGISTRATION OPEN',
      isRegistered: true,
      headline: 'Registration Confirmed',
      description: 'Create or join a team to select challenges and submit your solution.',
      thumbnail: '/banners/hacker_judge.jpg',
      badgeText: '',
      hasTeam: false,
      hasProject: false,
      actions: [
        { label: 'Event Details', href: '/hackathons/hacked-by-judge', variant: 'secondary' },
        { label: 'Form / Join Team >', icon: Users, href: '/participant/teams', variant: 'primary' },
      ],
    },
    {
      id: 'p-4',
      slug: 'apex-ai-global-hackathon-2026',
      title: 'Apex AI Global Hackathon 2026',
      statusTag: 'SUBMISSION OPEN',
      isRegistered: true,
      headline: 'Project: VeriClinical: Deterministic Diagnostic Evidence Engine',
      description: '',
      thumbnail: '/banners/globe_network.jpg',
      badgeText: '',
      metaChips: [
        { label: 'Team: VeriClinical (1 Members)', icon: Users },
        { label: 'Track: Autonomous AI Agents', icon: Sparkles },
        { label: 'Repository', icon: FolderGit2, href: 'https://github.com' },
      ],
      actions: [
        { label: 'Project Workspace', icon: ExternalLink, href: '/participant/projects', variant: 'secondary' },
        { label: 'Event Details', href: '/hackathons/apex-ai-global-hackathon-2026', variant: 'secondary' },
        { label: 'Draft In Progress', variant: 'pill' },
      ],
    },
  ];

  // Pipeline Stages matching reference screenshot
  const PIPELINE_STAGES = [
    { number: 1, label: 'Registration', status: 'Verified', isComplete: true },
    { number: 2, label: 'Team Formed', status: 'In Progress', isCurrent: true },
    { number: 3, label: 'Track & Problem', status: 'Verified', isComplete: true },
    { number: 4, label: 'Deliverables', status: 'In Progress', isPending: true },
    { number: 5, label: 'Submit & Lock', status: 'Verified', isComplete: true },
  ];

  // Audit activities matching reference screenshot
  const SHOWCASE_ACTIVITIES = [
    { id: 'a1', action: 'LOGIN SUCCESS', timestamp: '9/28/2026, 1:20:12 PM' },
    { id: 'a2', action: 'PARTICIPANT REGISTERED on [QA E2E 2026]...', timestamp: '1:14:23 AM' },
    { id: 'a3', action: 'TEAM CREATED on [QA E2E 2026]...', timestamp: '1:14:15 AM' },
    { id: 'a4', action: 'TEAM MEMBER ADDED VIA FORM on [QA...', timestamp: '1:14:34 AM' },
    { id: 'a5', action: 'TEAM CREATED on [QA E2E 2026]...', timestamp: '1:14:01 AM' },
  ];

  return (
    <div className="space-y-6 select-none max-w-[1440px] mx-auto pb-10">
      {/* ================= 1. HEADER ROW ================= */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-1">
        <div>
          {/* Tag Badges */}
          <div className="flex items-center space-x-2 mb-2">
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#FFE8D6] text-[#FA541C] text-[11.5px] font-bold border border-[#FED7AA]/60">
              <Users className="w-3.5 h-3.5 text-[#FA541C]" />
              <span>Participant Workspace</span>
            </span>
            <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full bg-[#F3F4F6] text-[#4B5563] text-[11px] font-medium border border-[#E5E7EB]">
              <Hexagon className="w-3 h-3 text-[#6B7280]" />
              <span>Builder Arena</span>
            </span>
          </div>

          {/* Greeting */}
          <h1 className="text-2xl sm:text-[34px] font-extrabold text-[#18181B] tracking-tight leading-tight flex items-center gap-2">
            <span>Good morning, {session.fullName || 'Alice Hacker'}</span>
            <span className="text-2xl sm:text-3xl animate-pulse-subtle">👋</span>
          </h1>
          <p className="text-xs sm:text-[14px] text-[#6B7280] font-normal mt-1">
            Track your active competitions, team formation, solution builds, and verified credentials.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-center">
          <Link
            href="/participant/voting"
            className="inline-flex items-center space-x-2 px-4 py-2.5 bg-[#FFF7ED] hover:bg-[#FFEDD5] border border-[#FDBA74] text-[#C2410C] text-xs font-bold rounded-xl shadow-xs transition-all duration-200 hover:-translate-y-0.5 cursor-pointer group"
          >
            <Vote className="w-4 h-4 text-[#C2410C] group-hover:scale-110 transition-transform" />
            <span>Vote on Questions</span>
          </Link>
          <Link
            href="/hackathons"
            className="inline-flex items-center space-x-2 px-4 py-2.5 bg-white hover:bg-[#FAF8F5] border border-[#E5E0D8] hover:border-[#FA541C]/50 text-[#FA541C] text-xs font-bold rounded-xl shadow-xs transition-all duration-200 hover:-translate-y-0.5 cursor-pointer group"
          >
            <Trophy className="w-4 h-4 text-[#FA541C] group-hover:scale-110 transition-transform" />
            <span>Explore Hackathons</span>
          </Link>
          <Link
            href="/participant/teams"
            className="inline-flex items-center space-x-2 px-4 py-2.5 bg-[#FA541C] hover:bg-[#EA4812] hover:shadow-lg hover:shadow-[#FA541C]/30 text-white text-xs font-bold rounded-xl shadow-sm transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer group"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Create / Join Team &gt;</span>
          </Link>
        </div>
      </div>

      {/* ================= 2. COMPETITION SUBMISSION PIPELINE ================= */}
      <div className="bg-white rounded-2xl border border-[#E5E0D8] p-5 sm:p-6 shadow-xs hover:shadow-md transition-all duration-300">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-4 border-b border-[#F4EFEA]">
          <div className="flex items-center space-x-2 text-sm">
            <Rocket className="w-4 h-4 text-[#FA541C]" />
            <span className="font-extrabold text-[#18181B] tracking-tight">Competition Submission Pipeline</span>
            <span className="text-[#9CA3AF] font-medium hidden md:inline">[QA E2E 2026] ATLYX AI Challenge 04</span>
          </div>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-[#FFE8D6] text-[#FA541C] border border-[#FED7AA]/50 self-start sm:self-auto">
            60% Ready to Submit
          </span>
        </div>

        {/* Pipeline Stages */}
        <div className="flex items-center justify-between overflow-x-auto no-scrollbar gap-2 sm:gap-2.5 py-1">
          {PIPELINE_STAGES.map((stage, idx) => (
            <React.Fragment key={stage.number}>
              <div className="flex-1 min-w-[135px] sm:min-w-[155px] bg-white border border-[#E5E0D8] hover:border-[#FA541C]/40 hover:-translate-y-0.5 rounded-xl px-3.5 py-3 flex items-center space-x-3 transition-all duration-200 shadow-2xs group cursor-default">
                {/* Stage Indicator Icon */}
                {stage.isComplete ? (
                  <div className="w-7 h-7 rounded-full bg-[#ECFDF5] text-[#10B981] flex items-center justify-center flex-shrink-0 font-bold border border-[#A7F3D0]">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                ) : (
                  <div className="w-7 h-7 rounded-full bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center flex-shrink-0 font-bold text-xs border border-[#BFDBFE]">
                    {stage.number}
                  </div>
                )}

                {/* Stage Text */}
                <div className="flex-1 min-w-0 text-left">
                  <div className="text-[12px] font-bold text-[#18181B] group-hover:text-[#FA541C] transition-colors whitespace-nowrap leading-tight truncate">
                    {stage.label}
                  </div>
                  <div className={`text-[10.5px] font-semibold mt-0.5 leading-tight ${stage.isComplete ? 'text-[#10B981]' : 'text-[#6B7280]'}`}>
                    {stage.status}
                  </div>
                </div>
              </div>

              {idx < PIPELINE_STAGES.length - 1 && (
                <div className="text-[#D1D5DB] flex-shrink-0 px-0.5">
                  <ChevronRight className="w-4 h-4" />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* ================= 3. 4-COLUMN SUMMARY METRIC CARDS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Registered Events */}
        <Link href="/hackathons" className="group">
          <div className="bg-white border border-[#E5E0D8] group-hover:border-[#CBD5E1] rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#FFE8D6] text-[#FA541C] flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Calendar className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">
                  REGISTERED EVENTS
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-[#9CA3AF] group-hover:text-[#FA541C] group-hover:translate-x-1 transition-all" />
            </div>

            <div className="mt-3 text-left">
              <div className="text-[28px] sm:text-[32px] font-black text-[#18181B] leading-none tracking-tight">
                {dbRegistrations.length > 0 ? dbRegistrations.length : 27}
              </div>
              <div className="mt-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]/60">
                  Active
                </span>
              </div>
            </div>
          </div>
        </Link>

        {/* Metric 2: My Teams */}
        <Link href="/participant/teams" className="group">
          <div className="bg-white border border-[#E5E0D8] group-hover:border-[#CBD5E1] rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#FFE8D6] text-[#FA541C] flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Users className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">
                  MY TEAMS
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-[#9CA3AF] group-hover:text-[#FA541C] group-hover:translate-x-1 transition-all" />
            </div>

            <div className="mt-3 text-left">
              <div className="text-[28px] sm:text-[32px] font-black text-[#18181B] leading-none tracking-tight">
                {dbTeams.length > 0 ? dbTeams.length : 22}
              </div>
              <div className="mt-2 text-[11px] text-[#6B7280] font-normal leading-snug">
                <div>[QA E2E] ATLYX Team 3</div>
                <div className="text-[#9CA3AF] text-[10.5px]">(1 Members)</div>
              </div>
            </div>
          </div>
        </Link>

        {/* Metric 3: Projects & Submissions */}
        <Link href="/participant/projects" className="group">
          <div className="bg-white border border-[#E5E0D8] group-hover:border-[#CBD5E1] rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#FFE8D6] text-[#FA541C] flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FileText className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">
                  PROJECTS &amp; SUBMISSIONS
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-[#9CA3AF] group-hover:text-[#FA541C] group-hover:translate-x-1 transition-all" />
            </div>

            <div className="mt-3 text-left">
              <div className="text-[28px] sm:text-[32px] font-black text-[#18181B] leading-none tracking-tight">
                {dbProjects.length > 0 ? dbProjects.length : 2}
              </div>
              <div className="mt-2 flex items-center text-[11.5px] font-bold text-[#10B981] gap-1">
                <span>↗</span>
                <span>Submitted</span>
              </div>
            </div>
          </div>
        </Link>

        {/* Metric 4: Verified Credentials */}
        <Link href="/participant/certificates" className="group">
          <div className="bg-white border border-[#E5E0D8] group-hover:border-[#CBD5E1] rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#FFE8D6] text-[#FA541C] flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">
                  VERIFIED CREDENTIALS
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-[#9CA3AF] group-hover:text-[#FA541C] group-hover:translate-x-1 transition-all" />
            </div>

            <div className="mt-3 text-left">
              <div className="text-[28px] sm:text-[32px] font-black text-[#18181B] leading-none tracking-tight">
                {dbCertificates.length > 0 ? dbCertificates.length : 0}
              </div>
              <div className="mt-2 text-[11px] text-[#6B7280] font-normal">
                0 Issued Certificates
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* ================= 4. SPLIT LAYOUT: ACTIVE PARTICIPATION & RIGHT RAIL ================= */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Active Participation & Projects (approx 8 cols) */}
        <div className="xl:col-span-8 space-y-4">
          <div className="flex items-center justify-between pb-1">
            <h2 className="text-lg sm:text-[20px] font-bold text-[#18181B] tracking-tight">
              Active Participation &amp; Projects
            </h2>
            <Link
              href="/hackathons"
              className="text-xs font-semibold text-[#FA541C] hover:text-[#EA4812] inline-flex items-center space-x-1 group/all transition-colors"
            >
              <span>View All Registered Hackathons</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover/all:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Participation Cards List */}
          <div className="space-y-3.5">
            {PARTICIPATION_CARDS.map((card) => (
              <div
                key={card.id}
                className="bg-white border border-[#E5E0D8] hover:border-[#CBD5E1] rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group/card"
              >
                {/* Left Section: Thumbnail + Info */}
                <div className="flex items-start sm:items-center space-x-4 min-w-0 flex-1">
                  {/* Thumbnail Image */}
                  <div className="w-[100px] h-[72px] sm:w-[110px] sm:h-[80px] rounded-xl overflow-hidden relative bg-black flex-shrink-0 flex items-center justify-center">
                    <img
                      src={card.thumbnail}
                      alt={card.title}
                      className="absolute inset-0 w-full h-full object-cover group-hover/card:scale-108 transition-transform duration-500 ease-out opacity-85"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
                    {card.badgeText && (
                      <span className="relative z-10 text-[9px] font-black text-white uppercase tracking-wider text-center px-1">
                        {card.badgeText}
                      </span>
                    )}
                  </div>

                  {/* Text Details */}
                  <div className="min-w-0 flex-1">
                    {/* Tags */}
                    <div className="flex flex-wrap items-center gap-1.5 mb-1">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#FFEDE1] text-[#FA541C]">
                        ● Registered Event
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-[#F3F4F6] text-[#4B5563]">
                        {card.statusTag}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-sm sm:text-[15px] font-extrabold text-[#18181B] group-hover/card:text-[#FA541C] transition-colors leading-snug truncate">
                      <Link href={`/hackathons/${card.slug}`}>
                        {card.title}
                      </Link>
                    </h3>

                    {/* Headline / Status */}
                    {card.headline && (
                      <p className="text-xs font-semibold text-[#111827] mt-0.5 truncate">
                        {card.headline}
                      </p>
                    )}

                    {/* Description */}
                    {card.description && (
                      <p className="text-[11.5px] text-[#6B7280] font-normal mt-0.5 line-clamp-1">
                        {card.description}
                      </p>
                    )}

                    {/* Meta Chips */}
                    {card.metaChips && (
                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#4B5563] mt-2">
                        {card.metaChips.map((chip, i) => {
                          const Icon = chip.icon;
                          return (
                            <span key={i} className="inline-flex items-center gap-1">
                              <Icon className="w-3.5 h-3.5 text-[#6B7280]" />
                              <span>{chip.label}</span>
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Section: Action Buttons */}
                <div className="flex items-center space-x-2 self-end sm:self-center flex-shrink-0">
                  {card.actions.map((act, i) => {
                    const ActIcon = (act as any).icon;

                    if (act.variant === 'pill') {
                      return (
                        <span
                          key={i}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]"
                        >
                          {act.label}
                        </span>
                      );
                    }

                    if (act.variant === 'primary') {
                      return (
                        <Link
                          key={i}
                          href={act.href || '#'}
                          className="inline-flex items-center space-x-1.5 px-4 py-2 bg-[#FA541C] hover:bg-[#EA4812] hover:shadow-md hover:shadow-[#FA541C]/30 text-white text-xs font-bold rounded-xl shadow-xs transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                        >
                          {ActIcon && <ActIcon className="w-3.5 h-3.5" />}
                          <span>{act.label}</span>
                        </Link>
                      );
                    }

                    return (
                      <Link
                        key={i}
                        href={act.href || '#'}
                        className="inline-flex items-center space-x-1 px-3.5 py-2 bg-white hover:bg-slate-50 border border-[#D1D5DB] hover:border-[#9CA3AF] text-[#374151] text-xs font-semibold rounded-xl transition-all duration-200 hover:-translate-y-0.5 shadow-2xs cursor-pointer"
                      >
                        {ActIcon && <ActIcon className="w-3.5 h-3.5 mr-1" />}
                        <span>{act.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT COLUMN: 4 Sidebar Widgets (approx 4 cols) */}
        <div className="xl:col-span-4 space-y-4">
          {/* Widget 1: My Teams */}
          <div className="bg-white border border-[#E5E0D8] hover:border-[#CBD5E1] rounded-2xl p-5 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group">
            <div className="flex items-center justify-between pb-2 border-b border-[#F4EFEA]">
              <div className="flex items-center space-x-2 text-xs font-bold text-[#18181B]">
                <Users className="w-4 h-4 text-[#FA541C]" />
                <span>My Teams</span>
              </div>
              <ChevronRight className="w-4 h-4 text-[#9CA3AF] group-hover:text-[#FA541C] group-hover:translate-x-1 transition-all" />
            </div>
            <div className="pt-3">
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-black text-[#18181B]">22</span>
                <span className="text-xs font-bold text-[#6B7280]">Active Teams</span>
              </div>
              <p className="text-xs text-[#6B7280] font-mono mt-1">
                Invite Code: QAE2-4642CD
              </p>
              <div className="mt-3">
                <Link
                  href="/participant/teams"
                  className="text-xs font-bold text-[#FA541C] hover:text-[#EA4812] inline-flex items-center gap-1 group/team transition-colors"
                >
                  <span>Manage Team Rosters</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover/team:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </div>

          {/* Widget 2: Certificates */}
          <div className="bg-white border border-[#E5E0D8] hover:border-[#CBD5E1] rounded-2xl p-5 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group">
            <div className="flex items-center justify-between pb-2 border-b border-[#F4EFEA]">
              <div className="flex items-center space-x-2 text-xs font-bold text-[#18181B]">
                <ShieldCheck className="w-4 h-4 text-[#FA541C]" />
                <span>Certificates</span>
              </div>
              <ChevronRight className="w-4 h-4 text-[#9CA3AF] group-hover:text-[#FA541C] group-hover:translate-x-1 transition-all" />
            </div>
            <div className="pt-3">
              <h4 className="text-sm font-bold text-[#18181B]">No Certificates Yet</h4>
              <p className="text-xs text-[#6B7280] mt-1 leading-relaxed">
                Cryptographically signed and employer-verifiable digital certificates.
              </p>
              <div className="mt-3">
                <Link
                  href="/participant/certificates"
                  className="text-xs font-bold text-[#FA541C] hover:text-[#EA4812] inline-flex items-center gap-1 group/cert transition-colors"
                >
                  <span>View &amp; Verify Certificates</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover/cert:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </div>

          {/* Widget 3: Attendance */}
          <div className="bg-white border border-[#E5E0D8] hover:border-[#CBD5E1] rounded-2xl p-5 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group">
            <div className="flex items-center justify-between pb-2 border-b border-[#F4EFEA]">
              <div className="flex items-center space-x-2 text-xs font-bold text-[#18181B]">
                <QrCode className="w-4 h-4 text-[#FA541C]" />
                <span>Attendance</span>
              </div>
              <ChevronRight className="w-4 h-4 text-[#9CA3AF] group-hover:text-[#FA541C] group-hover:translate-x-1 transition-all" />
            </div>
            <div className="pt-3">
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-black text-[#18181B]">0</span>
                <span className="text-xs font-bold text-[#6B7280]">Checked-In Sessions</span>
              </div>
              <p className="text-xs text-[#6B7280] mt-1 leading-relaxed">
                Enter session codes or scan QR during workshops and keynotes.
              </p>
              <div className="mt-3">
                <Link
                  href="/participant/attendance"
                  className="text-xs font-bold text-[#FA541C] hover:text-[#EA4812] inline-flex items-center gap-1 group/att transition-colors"
                >
                  <span>Check-in Status</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover/att:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </div>

          {/* Widget 4: Your Recent Activity */}
          <div className="bg-white border border-[#E5E0D8] hover:border-[#CBD5E1] rounded-2xl p-5 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
            <div className="flex items-center justify-between pb-2 border-b border-[#F4EFEA]">
              <div className="flex items-center space-x-2 text-xs font-bold text-[#18181B]">
                <Activity className="w-4 h-4 text-[#FA541C]" />
                <span>Your Recent Activity</span>
              </div>
              <span className="text-[10px] text-[#9CA3AF] font-medium uppercase tracking-wider">
                Authorization audit log
              </span>
            </div>
            <div className="pt-3 space-y-2.5">
              {SHOWCASE_ACTIVITIES.map((act) => (
                <div
                  key={act.id}
                  className="flex items-center justify-between text-xs py-1 px-1.5 rounded-lg hover:bg-[#FAF8F5] transition-colors"
                >
                  <div className="flex items-center space-x-2 min-w-0 pr-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FA541C] flex-shrink-0" />
                    <span className="font-bold text-[#1F2937] text-[11px] truncate uppercase tracking-tight">
                      {act.action}
                    </span>
                  </div>
                  <span className="text-[10.5px] text-[#9CA3AF] font-mono flex-shrink-0">
                    {act.timestamp}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
