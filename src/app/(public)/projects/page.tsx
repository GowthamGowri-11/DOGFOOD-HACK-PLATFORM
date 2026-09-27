import React from 'react';
import prisma from '@/lib/prisma';
import { ProjectGallery } from '@/components/public/ProjectGallery';
import { ProjectCardProps } from '@/components/ui/ProjectCard';

export const dynamic = 'force-dynamic';

export default async function ProjectsPage() {
  let projects: any[] = [];
  let tracksList: { label: string; value: string }[] = [];
  let techList: string[] = [];

  try {
    // Query all projects that are published or have submitted submissions
    projects = await prisma.project.findMany({
      where: {
        OR: [{ submissions: { some: { status: 'SUBMITTED' } } }, { isPublished: true }],
      },
      include: {
        hackathon: {
          select: {
            id: true,
            title: true,
            slug: true,
            status: true,
          },
        },
        track: { select: { id: true, title: true, colorHex: true } },
        team: {
          select: {
            id: true,
            name: true,
          },
        },
        result: {
          select: {
            rank: true,
            finalScore: true,
            awardCategory: true,
            isWinner: true,
            isPublished: true,
          },
        },
        _count: {
          select: {
            votes: true,
            comments: { where: { isFlagged: false } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Query distinct tracks
    const tracks = await prisma.track.findMany({
      select: { title: true, slug: true },
      distinct: ['slug'],
    });

    tracksList = tracks.map((t) => ({
      label: t.title,
      value: t.slug,
    }));

    // Collect all unique tech stack tags
    const techSet = new Set<string>();
    projects.forEach((p) => {
      (p.techStack || []).forEach((tech: string) => techSet.add(tech));
    });
    techList = Array.from(techSet).sort();
  } catch (error) {
    console.error('[ProjectsPage] Database connection error:', error);
  }

  // Format projects for ProjectCardProps
  const formattedProjects: ProjectCardProps[] = projects.map((p) => {
    const isHackathonResultsPublished = p.hackathon?.status === 'RESULTS_PUBLISHED';
    return {
      id: p.id,
      title: p.title,
      slug: p.slug,
      tagline: p.tagline,
      description: p.description,
      repoUrl: p.repoUrl,
      demoUrl: p.demoUrl,
      techStack: p.techStack,
      track: p.track ? { title: p.track.title, colorHex: p.track.colorHex } : undefined,
      team: p.team ? { name: p.team.name } : undefined,
      votesCount: p._count?.votes || 0,
      commentsCount: p._count?.comments || 0,
      officialRank: isHackathonResultsPublished && p.result ? p.result.rank : undefined,
      awardCategory: isHackathonResultsPublished && p.result ? p.result.awardCategory : undefined,
    };
  });

  return (
    <ProjectGallery
      initialProjects={formattedProjects}
      tracksList={tracksList}
      techList={techList}
    />
  );
}

