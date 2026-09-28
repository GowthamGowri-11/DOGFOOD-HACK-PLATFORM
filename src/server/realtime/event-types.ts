export type RealtimeEventType =
  // Team Events
  | 'TEAM_CREATED'
  | 'TEAM_UPDATED'
  | 'TEAM_MEMBER_ADDED'
  | 'TEAM_MEMBER_REMOVED'
  | 'TEAM_FORM_PUBLISHED'
  // Registration Events
  | 'REGISTRATION_CREATED'
  | 'REGISTRATION_CANCELLED'
  // Project Events
  | 'PROJECT_CREATED'
  | 'PROJECT_UPDATED'
  // Submission Events
  | 'SUBMISSION_CREATED'
  | 'SUBMISSION_UPDATED'
  | 'SUBMISSION_LOCKED'
  | 'SUBMISSION_WINDOW_OPENED'
  | 'SUBMISSION_DEADLINE_REACHED'
  | 'SUBMISSION_WINDOW_UPDATED'
  | 'SUBMISSION_STATUS_CHANGED'
  // Judging Events
  | 'JUDGE_ASSIGNED'
  | 'JUDGE_UNASSIGNED'
  | 'EVALUATION_STARTED'
  | 'EVALUATION_UPDATED'
  | 'EVALUATION_COMPLETED'
  // Results Events
  | 'RESULTS_GENERATED'
  | 'RESULTS_PUBLISHED'
  // Community Events
  | 'COMMENT_CREATED'
  | 'COMMENT_UPDATED'
  | 'COMMENT_HIDDEN'
  | 'VOTE_CREATED'
  | 'VOTE_REMOVED'
  // Attendance Events
  | 'ATTENDANCE_SESSION_CREATED'
  | 'ATTENDANCE_UPDATED'
  // Certificate Events
  | 'CERTIFICATE_ISSUED'
  // AI Jury Events
  | 'AI_JURY_STARTED'
  | 'AI_JURY_PROGRESS'
  | 'AI_JURY_COMPLETED'
  // Mark Edit Events
  | 'MARK_EDIT_REQUESTED'
  | 'MARK_EDIT_APPROVED'
  | 'MARK_EDIT_REJECTED'
  | 'MARK_EDIT_EXECUTED'
  // Notifications
  | 'NOTIFICATION_CREATED'
  | 'ANNOUNCEMENT'
  | 'PULSE';

export interface RealtimeEvent<T = any> {
  eventId: string;
  type: RealtimeEventType;
  timestamp: string;
  hackathonId?: string;
  teamId?: string;
  projectId?: string;
  userId?: string;
  actorId?: string;
  rooms: string[];
  payload: T;
  channel?: string;
}

export interface ClientMessage {
  action: 'join' | 'leave' | 'ping' | 'auth';
  room?: string;
  token?: string;
}

export interface ServerMessage<T = any> {
  type: 'EVENT' | 'ROOM_JOINED' | 'ROOM_JOIN_DENIED' | 'ROOM_LEFT' | 'PONG' | 'AUTH_SUCCESS' | 'AUTH_ERROR' | 'ERROR' | 'SYSTEM_CONNECT';
  event?: RealtimeEvent<T>;
  room?: string;
  channel?: string;
  status?: string;
  reason?: string;
  timestamp?: string;
}

export class RealtimeRoomBuilder {
  public static admin(): string {
    return 'admin';
  }

  public static hackathon(hackathonId: string): string {
    return `hackathon:${hackathonId}`;
  }

  public static organizer(hackathonId: string): string {
    return `organizer:${hackathonId}`;
  }

  public static team(teamId: string): string {
    return `team:${teamId}`;
  }

  public static project(projectId: string): string {
    return `project:${projectId}`;
  }

  public static user(userId: string): string {
    return `user:${userId}`;
  }

  public static judge(judgeId: string): string {
    return `judge:${judgeId}`;
  }

  public static evaluation(evaluationId: string): string {
    return `evaluation:${evaluationId}`;
  }
}
