export interface ArtifactValidationResult {
  isValid: boolean;
  message?: string;
}

export class ArtifactValidator {
  /**
   * Validates GitHub repository URL format (https://github.com/:owner/:repo)
   */
  public static validateGitHubUrl(url: string | null | undefined): ArtifactValidationResult {
    if (!url || typeof url !== 'string' || url.trim().length === 0) {
      return { isValid: false, message: 'GitHub repository URL is required.' };
    }

    const trimmed = url.trim();
    // Match standard GitHub repo pattern (https://github.com/owner/repo or https://www.github.com/owner/repo)
    const githubRegex = /^https?:\/\/(www\.)?github\.com\/[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+(\/)?$/;

    if (!githubRegex.test(trimmed)) {
      return {
        isValid: false,
        message: 'Invalid GitHub repository URL format. Expected: https://github.com/owner/repository',
      };
    }

    return { isValid: true };
  }

  /**
   * Validates safe HTTP/HTTPS URL
   */
  public static validateSafeUrl(url: string | null | undefined, fieldName = 'URL'): ArtifactValidationResult {
    if (!url || typeof url !== 'string' || url.trim().length === 0) {
      return { isValid: true }; // Optional field
    }

    const trimmed = url.trim();
    try {
      const parsed = new URL(trimmed);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return { isValid: false, message: `${fieldName} must use http or https protocol.` };
      }

      // Disallow localhost or internal IP ranges
      const host = parsed.hostname.toLowerCase();
      if (host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0' || host.endsWith('.local')) {
        return { isValid: false, message: `${fieldName} cannot be a local or private address.` };
      }

      return { isValid: true };
    } catch {
      return { isValid: false, message: `Invalid ${fieldName} syntax.` };
    }
  }

  /**
   * Validates video presentation URL (YouTube, Vimeo, Loom, Drive, etc.)
   */
  public static validateVideoUrl(url: string | null | undefined): ArtifactValidationResult {
    if (!url || typeof url !== 'string' || url.trim().length === 0) {
      return { isValid: true }; // Optional unless enforced by hackathon
    }

    const safeCheck = this.validateSafeUrl(url, 'Video URL');
    if (!safeCheck.isValid) return safeCheck;

    const trimmed = url.trim().toLowerCase();
    const isKnownProvider =
      trimmed.includes('youtube.com') ||
      trimmed.includes('youtu.be') ||
      trimmed.includes('vimeo.com') ||
      trimmed.includes('loom.com') ||
      trimmed.includes('drive.google.com') ||
      trimmed.endsWith('.mp4');

    if (!isKnownProvider) {
      return {
        isValid: false,
        message: 'Video URL must be hosted on YouTube, Vimeo, Loom, Google Drive, or be a direct MP4 link.',
      };
    }

    return { isValid: true };
  }
}
