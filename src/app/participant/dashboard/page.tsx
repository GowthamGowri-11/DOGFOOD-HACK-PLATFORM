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
import { KPICard } from '@/components/ui/KPICard';

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

  // Pipeline Completion Calculation
  const hasRegistration = !!primaryRegistration;
  const hasTeam = !!primaryTeam && primaryTeam.members.length >= (primaryHackathon?.minTeamSize || 1);
  const hasTrackAndPS = !!primaryProject?.trackId && !!primaryProject?.problemId;
  const validationResult = primaryProject && primaryHackathon
    ? SubmissionValidator.validateProjectForSubmission(primaryProject as any, primaryHackathon as any)
    : { isValid: false, errors: [] };
  const hasValidArtifacts = validationResult.isValid;
  const hasSubmitted = primarySubmission?.status === 'SUBMITTED' || primarySubmission?.status === 'LOCKED';

  const completedStepsCount = [
    hasRegistration,
    hasTeam,
    hasTrackAndPS,
    hasValidArtifacts,
    hasSubmitted,
  ].filter(Boolean).length;

  const pipelinePercentage = completedStepsCount * 20;

  // Pipeline steps definition
  const pipelineSteps = [
    { step: '1', title: 'Registration', status: hasRegistration ? 'completed' : 'pending' },
    { step: '2', title: 'Team Formed', status: hasTeam ? 'completed' : hasRegistration ? 'in_progress' : 'pending' },
    { step: '3', title: 'Track & Problem', status: hasTrackAndPS ? 'completed' : hasTeam ? 'in_progress' : 'pending' },
    { step: '4', title: 'Deliverables', status: hasValidArtifacts ? 'completed' : hasTrackAndPS ? 'in_progress' : 'pending' },
    { step: '5', title: 'Submit & Lock', status: hasSubmitted ? 'completed' : hasValidArtifacts ? 'in_progress' : 'pending' },
  ];

  const publishedResultsCount = projects.filter((p: any) => p.hackathon?.status === 'RESULTS_PUBLISHED' && p.submissions?.some((s: any) => s.status === 'LOCKED')).length;

  return (
    <div className="space-y-8 select-none">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-[#E2E8F0]">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-[#64748B] mb-1">
            <span>Participant Workspace</span>
            <span>•</span>
            <Badge variant="blue">Builder Arena</Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-tight">
            Good morning, {session.fullName}
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-0.5 font-normal">
            Track your active competitions, team formation, solution builds, and verified credentials.
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
            {primaryHackathon && (
              <span className="text-xs text-[#64748B] font-medium hidden sm:inline">
                ({primaryHackathon.title})
              </span>
            )}
          </div>
          <span
            className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
              pipelinePercentage === 100
                ? 'bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]'
                : pipelinePercentage >= 60
                ? 'bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]'
                : 'bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]'
            }`}
          >
            {pipelinePercentage}% Ready to Submit
          </span>
        </div>

        {/* 5-Step Pipeline Steps */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
          {pipelineSteps.map((item) => (
            <div
              key={item.step}
              className={`p-3 rounded-xl border flex items-center space-x-2.5 ${
                item.status === 'completed'
                  ? 'bg-white border-[#A7F3D0] text-[#047857]'
                  : item.status === 'in_progress'
                  ? 'bg-white border-[#BFDBFE] text-[#1D4ED8]'
                  : 'bg-white border-[#E2E8F0] text-[#64748B]'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  item.status === 'completed'
                    ? 'bg-[#ECFDF5] text-[#059669]'
                    : item.status === 'in_progress'
                    ? 'bg-[#EFF6FF] text-[#2563EB]'
                    : 'bg-[#F1F5F9] text-[#94A3B8]'
                }`}
              >
                {item.status === 'completed' ? '✓' : item.step}
              </div>
              <div className="truncate">
                <span className="block text-xs font-bold text-[#111827] truncate">
                  {item.title}
                </span>
                <span className="text-[10px] text-[#64748B]">
                  {item.status === 'completed'
                    ? 'Verified'
                    : item.status === 'in_progress'
                    ? 'In Progress'
                    : 'Pending'}
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
          value={registrations.length}
          icon={<Trophy className="w-4 h-4" />}
          badge={registrations.length > 0 ? 'Active' : 'None'}
        />
        <KPICard
          label="My Teams"
          value={teams.length}
          icon={<Users className="w-4 h-4" />}
          subtext={primaryTeam ? `${primaryTeam.name} (${primaryTeam.members.length} Members)` : 'No active team'}
        />
        <KPICard
          label="Projects & Submissions"
          value={projects.length}
          icon={<FileCheck className="w-4 h-4" />}
          trend={{
            value: hasSubmitted ? 'Submitted' : projects.length > 0 ? 'Draft' : 'Not Started',
            isPositive: hasSubmitted,
          }}
        />
        <KPICard
          label="Verified Credentials"
          value={certificates.length}
          icon={<ShieldCheck className="w-4 h-4" />}
          subtext={`${certificates.length} Issued Certificate${certificates.length === 1 ? '' : 's'}`}
        />
      </div>

      {/* 4. Active Hackathon & Solution Workspace */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#111827]">Active Participation & Projects</h2>
          <Link href="/participant/hackathons" className="text-xs font-semibold text-[#2563EB] hover:underline">
            View All Registered Hackathons →
          </Link>
        </div>

        {registrations.length === 0 ? (
          <div className="bg-white border border-[#E2E8F0] rounded-[16px] p-8 text-center space-y-3 shadow-card">
            <div className="w-12 h-12 rounded-2xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center mx-auto">
              <Trophy className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#111827]">You Haven&apos;t Registered for Any Hackathons</h3>
            <p className="text-xs text-[#64748B] max-w-md mx-auto">
              Explore open hackathons, view challenge tracks and problem statements, and register to begin competing.
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
          <div className="space-y-4">
            {registrations.map((reg) => {
              const h = reg.hackathon;
              const team = teams.find((t) => t.hackathonId === h.id);
              const project = projects.find((p) => p.hackathonId === h.id);
              const submission = submissions.find((s) => s.projectId === project?.id);
              const isLocked = submission?.status === 'LOCKED';

              return (
                <div key={reg.id} className="bg-white border border-[#E2E8F0] rounded-[16px] p-6 shadow-card space-y-5">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                      <div className="flex items-center space-x-2 text-xs text-[#64748B] mb-1">
                        <span className="font-semibold text-[#334155]">Registered Event</span>
                        <span>•</span>
                        <Badge
                          variant={
                            h.status === 'RESULTS_PUBLISHED'
                              ? 'emerald'
                              : h.status === 'JUDGING'
                              ? 'purple'
                              : h.status === 'SUBMISSION_OPEN'
                              ? 'blue'
                              : 'slate'
                          }
                        >
                          {h.status.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                      <h3 className="text-xl font-bold text-[#111827]">{h.title}</h3>
                    </div>

                    <div className="flex items-center space-x-2">
                      {project && (
                        <Link href={`/participant/projects/${project.id}`}>
                          <Button variant="outline" size="sm" icon={<ExternalLink className="w-3.5 h-3.5" />}>
                            Project Workspace
                          </Button>
                        </Link>
                      )}
                      <Link href={`/hackathons/${h.slug}`}>
                        <Button variant="secondary" size="sm">
                          Event Details
                        </Button>
                      </Link>
                    </div>
                  </div>

                  {/* Project Details Subsection */}
                  {project ? (
                    <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-[#334155]">
                          Project: <strong>{project.title}</strong>
                        </span>
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded border ${
                            isLocked
                              ? 'text-[#059669] bg-[#ECFDF5] border-[#A7F3D0]'
                              : 'text-[#2563EB] bg-[#EFF6FF] border-[#BFDBFE]'
                          }`}
                        >
                          {isLocked ? '🔒 Submitted & Locked' : 'Draft In Progress'}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-[#64748B]">
                        {team && (
                          <span className="inline-flex items-center">
                            <Users className="w-3.5 h-3.5 mr-1.5 text-[#2563EB]" />
                            Team: <strong>{team.name}</strong> ({team.members.length} Members)
                          </span>
                        )}
                        {project.track && (
                          <span className="inline-flex items-center">
                            <FolderKanban className="w-3.5 h-3.5 mr-1.5 text-[#7E22CE]" />
                            Track: <strong>{project.track.title}</strong>
                          </span>
                        )}
                        {project.repoUrl && (
                          <a
                            href={project.repoUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center text-[#2563EB] hover:underline"
                          >
                            <Github className="w-3.5 h-3.5 mr-1" />
                            Repository
                          </a>
                        )}
                      </div>
                    </div>
                  ) : team ? (
                    <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div>
                        <span className="text-xs font-bold text-[#334155] block">Team Formed: {team.name}</span>
                        <span className="text-xs text-[#64748B]">
                          You haven&apos;t created a project yet for this team. Select a track and problem statement to start building.
                        </span>
                      </div>
                      <Link href="/participant/projects">
                        <Button variant="primary" size="sm" icon={<Plus className="w-3.5 h-3.5" />}>
                          Create Project
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div>
                        <span className="text-xs font-bold text-[#334155] block">Registration Confirmed</span>
                        <span className="text-xs text-[#64748B]">
                          Create or join a team to select challenges and submit your solution.
                        </span>
                      </div>
                      <Link href="/participant/teams">
                        <Button variant="primary" size="sm" icon={<Users className="w-3.5 h-3.5" />}>
                          Form / Join Team
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. Quick Links Grid: Teams, Certificates, Attendance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Teams card */}
        <div className="bg-white border border-[#E2E8F0] rounded-[16px] p-5 shadow-card space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
              My Teams
            </span>
            <Users className="w-4 h-4 text-[#2563EB]" />
          </div>
          <h4 className="text-base font-bold text-[#111827]">
            {teams.length > 0 ? `${teams.length} Active Team${teams.length === 1 ? '' : 's'}` : 'No Team Yet'}
          </h4>
          <p className="text-xs text-[#64748B]">
            {primaryTeam
              ? `Invite Code: ${primaryTeam.inviteCode}`
              : 'Create a team or join using an invite code.'}
          </p>
          <div className="pt-2">
            <Link
              href="/participant/teams"
              className="text-xs font-semibold text-[#2563EB] hover:underline inline-flex items-center"
            >
              <span>Manage Team Rosters</span>
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
          <h4 className="text-base font-bold text-[#111827]">
            {certificates.length > 0
              ? `${certificates.length} Issued Credential${certificates.length === 1 ? '' : 's'}`
              : 'No Certificates Yet'}
          </h4>
          <p className="text-xs text-[#64748B]">
            Cryptographically signed and employer-verifiable digital certificates.
          </p>
          <div className="pt-2">
            <Link
              href="/participant/certificates"
              className="text-xs font-semibold text-[#059669] hover:underline inline-flex items-center"
            >
              <span>View & Verify Certificates</span>
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
          <h4 className="text-base font-bold text-[#111827]">
            {attendanceRecords.length} Checked-In Sessions
          </h4>
          <p className="text-xs text-[#64748B]">
            {activeSessionsCount > 0
              ? `${activeSessionsCount} active check-in session${activeSessionsCount === 1 ? '' : 's'} available now.`
              : 'Enter session codes or scan QR during workshops and keynotes.'}
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

      {/* 6. Recent Real Activity Timeline */}
      {recentActivity.length > 0 && (
        <div className="bg-white border border-[#E2E8F0] rounded-[18px] p-6 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-[#2563EB]" />
              <h3 className="text-base font-bold text-[#111827]">Your Recent Activity</h3>
            </div>
            <span className="text-xs text-[#64748B]">Authoritative audit log</span>
          </div>

          <div className="divide-y divide-[#F1F5F9]">
            {recentActivity.map((act) => (
              <div key={act.id} className="py-3 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2.5">
                  <div className="w-2 h-2 rounded-full bg-[#2563EB]" />
                  <span className="font-semibold text-[#111827]">
                    {act.action.replace(/_/g, ' ')}
                  </span>
                  {act.hackathon && (
                    <span className="text-[#64748B]">
                      on <strong>{act.hackathon.title}</strong>
                    </span>
                  )}
                </div>
                <span className="text-[#94A3B8]">
                  {new Date(act.createdAt).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
