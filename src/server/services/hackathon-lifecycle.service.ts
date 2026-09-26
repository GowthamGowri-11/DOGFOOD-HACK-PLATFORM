import { EventStatus } from '@prisma/client';

export interface EventDatesInput {
  regStartTime: Date | string;
  regEndTime: Date | string;
  eventStartTime: Date | string;
  eventEndTime: Date | string;
  subStartTime: Date | string;
  subEndTime: Date | string;
  judgingStartTime: Date | string;
  judgingEndTime: Date | string;
}

export interface DateValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface OperationalStatusResult {
  registrationOpen: boolean;
  submissionOpen: boolean;
  judgingActive: boolean;
  eventActive: boolean;
  derivedPhase: string;
}

export class HackathonLifecycleService {
  /**
   * Validates date consistency across registration, submission, event, and judging windows.
   */
  public static validateDates(dates: EventDatesInput): DateValidationResult {
    const errors: string[] = [];

    const regStart = new Date(dates.regStartTime).getTime();
    const regEnd = new Date(dates.regEndTime).getTime();
    const eventStart = new Date(dates.eventStartTime).getTime();
    const eventEnd = new Date(dates.eventEndTime).getTime();
    const subStart = new Date(dates.subStartTime).getTime();
    const subEnd = new Date(dates.subEndTime).getTime();
    const judgingStart = new Date(dates.judgingStartTime).getTime();
    const judgingEnd = new Date(dates.judgingEndTime).getTime();

    // Basic start < end checks
    if (isNaN(regStart) || isNaN(regEnd) || regStart >= regEnd) {
      errors.push('Registration start time must be strictly before registration end time.');
    }

    if (isNaN(eventStart) || isNaN(eventEnd) || eventStart >= eventEnd) {
      errors.push('Event start time must be strictly before event end time.');
    }

    if (isNaN(subStart) || isNaN(subEnd) || subStart >= subEnd) {
      errors.push('Submission start time must be strictly before submission end time.');
    }

    if (isNaN(judgingStart) || isNaN(judgingEnd) || judgingStart >= judgingEnd) {
      errors.push('Judging start time must be strictly before judging end time.');
    }

    // Logical cross-window validation
    if (!isNaN(subStart) && !isNaN(regStart) && subStart < regStart) {
      errors.push('Submission window cannot start before registration opens.');
    }

    if (!isNaN(judgingStart) && !isNaN(subStart) && judgingStart < subStart) {
      errors.push('Judging window cannot start before submissions open.');
    }

    if (!isNaN(eventEnd) && !isNaN(eventStart) && eventEnd < regStart) {
      errors.push('Event conclusion cannot occur before registration begins.');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Allowed state transitions map for the event status state machine.
   */
  private static readonly ALLOWED_TRANSITIONS: Record<EventStatus, EventStatus[]> = {
    DRAFT: ['PUBLISHED'],
    PUBLISHED: ['DRAFT', 'REGISTRATION_OPEN', 'EVENT_ACTIVE'],
    REGISTRATION_OPEN: ['REGISTRATION_CLOSED', 'EVENT_ACTIVE'],
    REGISTRATION_CLOSED: ['REGISTRATION_OPEN', 'EVENT_ACTIVE', 'SUBMISSION_OPEN'],
    EVENT_ACTIVE: ['SUBMISSION_OPEN', 'SUBMISSION_CLOSED', 'JUDGING'],
    SUBMISSION_OPEN: ['SUBMISSION_CLOSED', 'JUDGING'],
    SUBMISSION_CLOSED: ['JUDGING', 'RESULTS_PENDING'],
    JUDGING: ['RESULTS_PENDING', 'RESULTS_PUBLISHED'],
    RESULTS_PENDING: ['RESULTS_PUBLISHED', 'JUDGING'],
    RESULTS_PUBLISHED: ['COMPLETED'],
    COMPLETED: [],
  };

  /**
   * Verifies if a lifecycle transition from currentStatus to targetStatus is valid.
   */
  public static canTransition(current: EventStatus, target: EventStatus): boolean {
    if (current === target) return true;
    const allowed = this.ALLOWED_TRANSITIONS[current] || [];
    return allowed.includes(target);
  }

  /**
   * Computes the real-time derived operational state of an event based on current time vs configured dates.
   */
  public static getOperationalStatus(hackathon: {
    status: EventStatus;
    regStartTime: Date | string;
    regEndTime: Date | string;
    subStartTime: Date | string;
    subEndTime: Date | string;
    judgingStartTime: Date | string;
    judgingEndTime: Date | string;
    eventStartTime: Date | string;
    eventEndTime: Date | string;
  }): OperationalStatusResult {
    const now = Date.now();
    const regStart = new Date(hackathon.regStartTime).getTime();
    const regEnd = new Date(hackathon.regEndTime).getTime();
    const subStart = new Date(hackathon.subStartTime).getTime();
    const subEnd = new Date(hackathon.subEndTime).getTime();
    const judgingStart = new Date(hackathon.judgingStartTime).getTime();
    const judgingEnd = new Date(hackathon.judgingEndTime).getTime();
    const eventStart = new Date(hackathon.eventStartTime).getTime();
    const eventEnd = new Date(hackathon.eventEndTime).getTime();

    const registrationOpen = hackathon.status !== 'DRAFT' && now >= regStart && now <= regEnd;
    const submissionOpen = hackathon.status !== 'DRAFT' && now >= subStart && now <= subEnd;
    const judgingActive = hackathon.status !== 'DRAFT' && now >= judgingStart && now <= judgingEnd;
    const eventActive = hackathon.status !== 'DRAFT' && now >= eventStart && now <= eventEnd;

    let derivedPhase = hackathon.status.toString();
    if (hackathon.status === 'PUBLISHED' || hackathon.status === 'REGISTRATION_OPEN') {
      if (registrationOpen) derivedPhase = 'REGISTRATION_OPEN';
      else if (now < regStart) derivedPhase = 'UPCOMING';
      else if (submissionOpen) derivedPhase = 'SUBMISSION_OPEN';
      else if (judgingActive) derivedPhase = 'JUDGING';
      else if (now > eventEnd) derivedPhase = 'COMPLETED';
    }

    return {
      registrationOpen,
      submissionOpen,
      judgingActive,
      eventActive,
      derivedPhase,
    };
  }
}
