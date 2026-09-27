import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get('q')?.trim() || '';

    if (!query) {
      return successResponse({
        hackathons: [],
        tracks: [],
        projects: [],
      });
    }

    // Parallel search with strict public visibility filters
    const [hackathons, tracks, projects] = await Promise.all([
      // 1. Published Hackathons
      prisma.hackathon.findMany({
        where: {
          status: { not: 'DRAFT' },
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { tagline: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { organizationName: { contains: query, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          title: true,
          slug: true,
          tagline: true,
          status: true,
          organizationName: true,
        },
        take: 5,
        orderBy: { eventStartTime: 'asc' },
      }).catch(() => []),

      // 2. Public Tracks on Published Hackathons
      prisma.track.findMany({
        where: {
          hackathon: { status: { not: 'DRAFT' } },
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          title: true,
          slug: true,
          colorHex: true,
          hackathon: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
        },
        take: 5,
      }).catch(() => []),

      // 3. Public / Submitted Projects
      prisma.project.findMany({
        where: {
          hackathon: { status: { not: 'DRAFT' } },
          OR: [
            { isPublished: true },
            { submissions: { some: { status: { in: ['SUBMITTED', 'LOCKED'] } } } },
          ],
          AND: [
            {
              OR: [
                { title: { contains: query, mode: 'insensitive' } },
                { tagline: { contains: query, mode: 'insensitive' } },
                { description: { contains: query, mode: 'insensitive' } },
              ],
            },
          ],
        },
        select: {
          id: true,
          title: true,
          slug: true,
          tagline: true,
          hackathon: {
            select: {
              title: true,
              slug: true,
            },
          },
        },
        take: 5,
        orderBy: { createdAt: 'desc' },
      }).catch(() => []),
    ]);

    return successResponse({
      hackathons: hackathons.map((h) => ({
        id: h.id,
        title: h.title,
        subtitle: h.organizationName || h.tagline,
        href: `/hackathons/${h.slug}`,
        status: h.status,
      })),
      tracks: tracks.map((t) => ({
        id: t.id,
        title: t.title,
        subtitle: t.hackathon?.title,
        href: `/hackathons/${t.hackathon?.slug}`,
        colorHex: t.colorHex,
      })),
      projects: projects.map((p) => ({
        id: p.id,
        title: p.title,
        subtitle: p.hackathon?.title || p.tagline,
        href: `/projects/${p.id}`,
      })),
    });
  } catch (error: any) {
    console.error('[API][Search] Error:', error);
    return errorResponse(error.message || 'Search execution failed.', 'SEARCH_ERROR', 500);
  }
}
