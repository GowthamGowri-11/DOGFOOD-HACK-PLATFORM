import { HackathonRepository } from '../repositories/hackathon.repository';

export class HackathonService {
  /**
   * Generates a safe, collision-resistant unique slug from a title.
   */
  public static async generateUniqueSlug(title: string, currentHackathonId?: string): Promise<string> {
    const baseSlug = title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'hackathon';

    let candidate = baseSlug;
    let counter = 1;

    while (await HackathonRepository.checkSlugExists(candidate, currentHackathonId)) {
      counter++;
      candidate = `${baseSlug}-${counter}`;
    }

    return candidate;
  }
}
