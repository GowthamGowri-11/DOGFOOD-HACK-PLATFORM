import crypto from 'crypto';

export interface SnapshotPayload {
  project: {
    id: string;
    title: string;
    slug: string;
    tagline?: string | null;
    description: string;
    techStack: string[];
    thumbnailUrl?: string | null;
  };
  team: {
    id: string;
    name: string;
    members: Array<{
      id: string;
      userId: string;
      fullName: string;
      email: string;
      isLeader: boolean;
    }>;
  };
  hackathon: {
    id: string;
    title: string;
    slug: string;
  };
  track: {
    id: string;
    title: string;
    slug: string;
  };
  problemStatement: {
    id: string;
    code: string;
    title: string;
  };
  artifacts: {
    repoUrl: string;
    demoUrl?: string | null;
    videoUrl?: string | null;
    documentationUrl?: string | null;
  };
  submittedAt: string;
  submitterId: string;
  version: number;
}

export class SnapshotService {
  /**
   * Constructs the canonical immutable snapshot structure from project details.
   */
  public static createPayload(project: any, submitterId: string, version = 1): SnapshotPayload {
    return {
      project: {
        id: project.id,
        title: project.title,
        slug: project.slug,
        tagline: project.tagline || null,
        description: project.description,
        techStack: project.techStack || [],
        thumbnailUrl: project.thumbnailUrl || null,
      },
      team: {
        id: project.team.id,
        name: project.team.name,
        members: (project.team.members || []).map((m: any) => ({
          id: m.id,
          userId: m.userId,
          fullName: m.user?.fullName || 'Teammate',
          email: m.user?.email || '',
          isLeader: m.isLeader || false,
        })),
      },
      hackathon: {
        id: project.hackathon.id,
        title: project.hackathon.title,
        slug: project.hackathon.slug,
      },
      track: {
        id: project.track.id,
        title: project.track.title,
        slug: project.track.slug,
      },
      problemStatement: {
        id: project.problemStatement.id,
        code: project.problemStatement.code,
        title: project.problemStatement.title,
      },
      artifacts: {
        repoUrl: project.repoUrl,
        demoUrl: project.demoUrl || null,
        videoUrl: project.videoUrl || null,
        documentationUrl: project.documentationUrl || null,
      },
      submittedAt: new Date().toISOString(),
      submitterId,
      version,
    };
  }

  /**
   * Recursively stringifies an object with sorted keys for deterministic canonical hashing.
   */
  public static canonicalStringify(obj: any): string {
    if (obj === null || typeof obj !== 'object') {
      return JSON.stringify(obj);
    }
    if (Array.isArray(obj)) {
      return '[' + obj.map((item) => this.canonicalStringify(item)).join(',') + ']';
    }
    const keys = Object.keys(obj).sort();
    const pairs = keys.map((key) => JSON.stringify(key) + ':' + this.canonicalStringify(obj[key]));
    return '{' + pairs.join(',') + '}';
  }

  /**
   * Computes a deterministic SHA-256 hash of the canonical JSON payload.
   */
  public static calculateContentHash(payload: SnapshotPayload): string {
    const serialized = this.canonicalStringify(payload);
    return crypto.createHash('sha256').update(serialized).digest('hex');
  }
}
