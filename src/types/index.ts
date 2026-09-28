export type RoleType = 'ADMIN' | 'ORGANIZER' | 'JUDGE' | 'PARTICIPANT';

export type UserStatus = 'ACTIVE' | 'INACTIVE';

export type EventStatus =
  | 'DRAFT'
  | 'PUBLISHED'
  | 'REGISTRATION_OPEN'
  | 'REGISTRATION_CLOSED'
  | 'EVENT_ACTIVE'
  | 'SUBMISSION_OPEN'
  | 'SUBMISSION_CLOSED'
  | 'JUDGING'
  | 'RESULTS_PENDING'
  | 'RESULTS_PUBLISHED'
  | 'COMPLETED';

export type RegistrationStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'WAITLISTED'
  | 'CANCELLED';

export type SubmissionStatus =
  | 'DRAFT'
  | 'VALIDATED'
  | 'SUBMITTED'
  | 'LOCKED';

export type AssignmentStatus =
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'DECLINED'
  | 'CONFLICT_FLAGGED';

export type EvaluationStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'FLAGGED'
  | 'ARCHIVED';

export type NormalizationMethod =
  | 'Z_SCORE'
  | 'MIN_MAX'
  | 'PERCENTILE_RANK'
  | 'TRIMMED_MEAN'
  | 'BAYESIAN_MEAN';

export interface UserSession {
  id: string;
  email: string;
  fullName: string;
  role: RoleType;
  status: UserStatus;
  avatarUrl?: string | null;
  sessionId?: string;
}

export interface SafeUser {
  id: string;
  email: string;
  fullName: string;
  role: RoleType;
  status: UserStatus;
  avatarUrl?: string | null;
  createdAt: Date | string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}
