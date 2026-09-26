import { HackathonLifecycleService } from './hackathon-lifecycle.service';

export interface PublishValidationCandidate {
  id: string;
  title: string;
  slug: string;
  description: string;
  organizationName: string;
  regStartTime: Date | string;
  regEndTime: Date | string;
  eventStartTime: Date | string;
  eventEndTime: Date | string;
  subStartTime: Date | string;
  subEndTime: Date | string;
  judgingStartTime: Date | string;
  judgingEndTime: Date | string;
  tracks?: Array<{ id: string; title: string }>;
}

export interface PublishValidationResult {
  canPublish: boolean;
  missingFields: string[];
}

export class HackathonPublishService {
  /**
   * Validates if a draft hackathon has all necessary information before publication.
   */
  public static validatePublishReadiness(event: PublishValidationCandidate): PublishValidationResult {
    const missing: string[] = [];

    if (!event.title || event.title.trim().length < 3) {
      missing.push('Title must be at least 3 characters long.');
    }

    if (!event.slug || event.slug.trim().length < 3) {
      missing.push('Valid event slug is required.');
    }

    if (!event.description || event.description.trim().length < 10) {
      missing.push('Description must be at least 10 characters long.');
    }

    if (!event.organizationName || event.organizationName.trim().length < 2) {
      missing.push('Organization name is required.');
    }

    if (!event.tracks || event.tracks.length === 0) {
      missing.push('At least one track must be configured before publishing.');
    }

    // Date consistency validation
    const dateValidation = HackathonLifecycleService.validateDates({
      regStartTime: event.regStartTime,
      regEndTime: event.regEndTime,
      eventStartTime: event.eventStartTime,
      eventEndTime: event.eventEndTime,
      subStartTime: event.subStartTime,
      subEndTime: event.subEndTime,
      judgingStartTime: event.judgingStartTime,
      judgingEndTime: event.judgingEndTime,
    });

    if (!dateValidation.isValid) {
      missing.push(...dateValidation.errors);
    }

    return {
      canPublish: missing.length === 0,
      missingFields: missing,
    };
  }
}
