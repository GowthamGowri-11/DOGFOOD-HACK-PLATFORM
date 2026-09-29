import { ArtifactValidator } from '@/server/services/artifact-validator.service';
import { SubmissionWindowService } from '@/server/services/submission-window.service';

export interface ValidationErrorItem {
  field: string;
  code: string;
  message: string;
}

export interface SubmissionValidationResult {
  isValid: boolean;
  errors: ValidationErrorItem[];
  warnings: string[];
}

export class SubmissionValidator {
  /**
   * Evaluates complete submission criteria for a project before official locking.
   */
  public static validateProjectForSubmission(
    project: any,
    hackathon: any,
    currentTime: Date = new Date()
  ): SubmissionValidationResult {
    const errors: ValidationErrorItem[] = [];
    const warnings: string[] = [];

    // 1. Basic Metadata Validation
    if (!project.title || project.title.trim().length < 3) {
      errors.push({
        field: 'title',
        code: 'INVALID_TITLE',
        message: 'Project title must be at least 3 characters long.',
      });
    }

    if (!project.description || project.description.trim().length < 20) {
      errors.push({
        field: 'description',
        code: 'INVALID_DESCRIPTION',
        message: 'Project description must be at least 20 characters long.',
      });
    }

    // 2. Hackathon & Relational Consistency
    if (project.hackathonId !== hackathon.id) {
      errors.push({
        field: 'hackathonId',
        code: 'HACKATHON_MISMATCH',
        message: 'Project hackathon does not match target event.',
      });
    }

    if (!project.track || project.track.hackathonId !== hackathon.id) {
      errors.push({
        field: 'trackId',
        code: 'INVALID_TRACK',
        message: 'Selected track does not belong to this hackathon.',
      });
    }

    if (
      !project.problemStatement ||
      project.problemStatement.hackathonId !== hackathon.id ||
      project.problemStatement.trackId !== project.trackId
    ) {
      errors.push({
        field: 'problemId',
        code: 'TRACK_PROBLEM_MISMATCH',
        message: 'Selected problem statement does not belong to the selected competition track.',
      });
    }

    // 3. Team Consistency & Bounds
    if (!project.team || project.team.hackathonId !== hackathon.id) {
      errors.push({
        field: 'teamId',
        code: 'INVALID_TEAM',
        message: 'Team does not belong to this hackathon.',
      });
    } else {
      const memberCount = project.team.members?.length || 0;
      if (memberCount < hackathon.minTeamSize) {
        errors.push({
          field: 'teamMembers',
          code: 'TEAM_SIZE_UNDERFLOW',
          message: `Team has ${memberCount} member(s). Minimum required for this event is ${hackathon.minTeamSize}.`,
        });
      }
      if (memberCount > hackathon.maxTeamSize) {
        errors.push({
          field: 'teamMembers',
          code: 'TEAM_SIZE_OVERFLOW',
          message: `Team has ${memberCount} members, exceeding maximum allowed limit of ${hackathon.maxTeamSize}.`,
        });
      }
    }

    // 4. Artifact Validation
    const repoCheck = ArtifactValidator.validateGitHubUrl(project.repoUrl);
    if (!repoCheck.isValid) {
      errors.push({
        field: 'repoUrl',
        code: 'REQUIRED_ARTIFACT_MISSING',
        message: repoCheck.message || 'Valid GitHub repository URL is required.',
      });
    }

    if (project.demoUrl) {
      const demoCheck = ArtifactValidator.validateSafeUrl(project.demoUrl, 'Demo URL');
      if (!demoCheck.isValid) {
        errors.push({
          field: 'demoUrl',
          code: 'INVALID_ARTIFACT',
          message: demoCheck.message || 'Invalid Demo URL.',
        });
      }
    } else {
      warnings.push('Live demo URL was not provided.');
    }

    if (project.videoUrl) {
      const videoCheck = ArtifactValidator.validateVideoUrl(project.videoUrl);
      if (!videoCheck.isValid) {
        errors.push({
          field: 'videoUrl',
          code: 'INVALID_ARTIFACT',
          message: videoCheck.message || 'Invalid Video URL.',
        });
      }
    } else {
      warnings.push('Demo presentation video was not provided.');
    }

    if (project.documentationUrl) {
      const docCheck = ArtifactValidator.validateSafeUrl(project.documentationUrl, 'Documentation URL');
      if (!docCheck.isValid) {
        errors.push({
          field: 'documentationUrl',
          code: 'INVALID_ARTIFACT',
          message: docCheck.message || 'Invalid Documentation URL.',
        });
      }
    }

    // 5. Submission Window Timing Check
    const effectiveWindow = SubmissionWindowService.getEffectiveWindow(hackathon, currentTime);
    const now = currentTime.getTime();
    const subStart = effectiveWindow.subStartTime.getTime();
    const subEnd = effectiveWindow.subEndTime.getTime();

    if (now < subStart) {
      errors.push({
        field: 'timing',
        code: 'SUBMISSION_NOT_OPEN',
        message: 'Submissions for this hackathon have not opened yet.',
      });
    }

    if (now >= subEnd) {
      errors.push({
        field: 'timing',
        code: 'SUBMISSION_DEADLINE_PASSED',
        message: 'The submission deadline for this hackathon has passed.',
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }
}
