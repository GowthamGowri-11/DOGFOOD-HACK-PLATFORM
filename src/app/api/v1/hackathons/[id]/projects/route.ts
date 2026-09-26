import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAuth, requireRole } from '@/server/permissions/guards';
import { ResourceGuards } from '@/server/permissions/resource-guards';
import { ProjectRepository } from '@/server/repositories/project.repository';
import { ProjectService } from '@/server/services/project.service';
import { successResponse, errorResponse } from '@/lib/api/response';

const createProjectSchema = z.object({
  teamId: z.string().min(1, 'Team ID is required'),
  trackId: z.string().min(1, 'Track ID is required'),
  problemId: z.string().min(1, 'Problem Statement ID is required'),
  title: z.string().min(3, 'Project title must be at least 3 characters'),
  tagline: z.string().optional(),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  thumbnailUrl: z.string().optional(),
  repoUrl: z.string().min(1, 'Repository URL is required'),
  demoUrl: z.string().optional(),
  videoUrl: z.string().optional(),
  documentationUrl: z.string().optional(),
  techStack: z.array(z.string()).optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth();
    const hackathonId = params.id;

    if (session.role === 'ORGANIZER') {
      const canAccess = await ResourceGuards.canOrganizerAccessHackathon(session.id, hackathonId);
      if (!canAccess) {
        return errorResponse('You are not authorized to view projects for this hackathon.', 'FORBIDDEN_RESOURCE', 403);
      }
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || undefined;
    const trackId = searchParams.get('trackId') || undefined;

    const projects = await ProjectRepository.listByHackathon(hackathonId, { search, trackId });
    return successResponse({ projects });
  } catch (error: any) {
    const status = error.status || 500;
    const code = error.code || 'INTERNAL_ERROR';
    return errorResponse(error.message, code, status);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireRole(['PARTICIPANT', 'ORGANIZER', 'ADMIN']);
    const hackathonId = params.id;

    const body = await req.json();
    const parsed = createProjectSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse('Invalid project payload', 'VALIDATION_ERROR', 422, parsed.error.format());
    }

    const data = parsed.data;
    const project = await ProjectService.createProject({
      hackathonId,
      teamId: data.teamId,
      userId: session.id,
      trackId: data.trackId,
      problemId: data.problemId,
      title: data.title,
      tagline: data.tagline,
      description: data.description,
      thumbnailUrl: data.thumbnailUrl,
      repoUrl: data.repoUrl,
      demoUrl: data.demoUrl,
      videoUrl: data.videoUrl,
      documentationUrl: data.documentationUrl,
      techStack: data.techStack,
    });

    return successResponse({ project }, 'Project created successfully', 201);
  } catch (error: any) {
    const status = error.status || 500;
    const code = error.code || 'INTERNAL_ERROR';
    return errorResponse(error.message, code, status);
  }
}
