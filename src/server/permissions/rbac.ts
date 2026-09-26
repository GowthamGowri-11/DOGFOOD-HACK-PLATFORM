import { RoleType } from '@/types';

export const PERMISSIONS = {
  // Platform / Admin
  PLATFORM_MANAGE: 'platform.manage',
  USERS_MANAGE: 'platform.users.manage',
  AUDIT_VIEW: 'platform.audit.view',

  // Hackathon / Organizer
  HACKATHON_CREATE: 'hackathon.create',
  HACKATHON_MANAGE: 'hackathon.manage',
  TRACK_MANAGE: 'track.manage',
  PROBLEM_MANAGE: 'problem.manage',
  REGISTRATION_MANAGE: 'registration.manage',
  TEAM_VIEW_ALL: 'team.view_all',
  JUDGE_MANAGE: 'judge.manage',
  ASSIGNMENT_MANAGE: 'assignment.manage',
  RUBRIC_MANAGE: 'rubric.manage',
  SCORING_COMPUTE: 'scoring.compute',
  RESULTS_PUBLISH: 'results.publish',
  ATTENDANCE_MANAGE: 'attendance.manage',
  CERTIFICATE_ISSUE: 'certificate.issue',
  AI_JURY_RUN: 'ai_jury.run',
  AI_CALIBRATE: 'ai.calibrate',

  // Judge
  JUDGE_ASSIGNMENTS_VIEW: 'judge.assignments.view',
  JUDGE_EVALUATION_CREATE: 'judge.evaluation.create',
  JUDGE_EVALUATION_UPDATE: 'judge.evaluation.update',
  JUDGE_EVALUATION_SUBMIT: 'judge.evaluation.submit',

  // Participant
  PARTICIPANT_REGISTER: 'participant.register',
  PARTICIPANT_TEAM_MANAGE: 'participant.team.manage',
  PARTICIPANT_PROJECT_MANAGE: 'participant.project.manage',
  PARTICIPANT_SUBMISSION_MANAGE: 'participant.submission.manage',
  PARTICIPANT_VOTE: 'participant.vote',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

const ROLE_PERMISSIONS_MAP: Record<RoleType, Permission[]> = {
  ADMIN: Object.values(PERMISSIONS),
  ORGANIZER: [
    PERMISSIONS.HACKATHON_CREATE,
    PERMISSIONS.HACKATHON_MANAGE,
    PERMISSIONS.TRACK_MANAGE,
    PERMISSIONS.PROBLEM_MANAGE,
    PERMISSIONS.REGISTRATION_MANAGE,
    PERMISSIONS.TEAM_VIEW_ALL,
    PERMISSIONS.JUDGE_MANAGE,
    PERMISSIONS.ASSIGNMENT_MANAGE,
    PERMISSIONS.RUBRIC_MANAGE,
    PERMISSIONS.SCORING_COMPUTE,
    PERMISSIONS.RESULTS_PUBLISH,
    PERMISSIONS.ATTENDANCE_MANAGE,
    PERMISSIONS.CERTIFICATE_ISSUE,
    PERMISSIONS.AI_JURY_RUN,
    PERMISSIONS.AUDIT_VIEW,
  ],
  JUDGE: [
    PERMISSIONS.JUDGE_ASSIGNMENTS_VIEW,
    PERMISSIONS.JUDGE_EVALUATION_CREATE,
    PERMISSIONS.JUDGE_EVALUATION_UPDATE,
    PERMISSIONS.JUDGE_EVALUATION_SUBMIT,
  ],
  PARTICIPANT: [
    PERMISSIONS.PARTICIPANT_REGISTER,
    PERMISSIONS.PARTICIPANT_TEAM_MANAGE,
    PERMISSIONS.PARTICIPANT_PROJECT_MANAGE,
    PERMISSIONS.PARTICIPANT_SUBMISSION_MANAGE,
    PERMISSIONS.PARTICIPANT_VOTE,
  ],
};

export function hasPermission(role: RoleType, permission: Permission): boolean {
  const allowed = ROLE_PERMISSIONS_MAP[role] || [];
  return allowed.includes(permission);
}
