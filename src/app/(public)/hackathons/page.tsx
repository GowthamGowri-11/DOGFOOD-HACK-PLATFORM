import { HackathonRepository } from '@/server/repositories/hackathon.repository';
import { HackathonDiscovery } from '@/components/public/HackathonDiscovery';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function HackathonsPage() {
  // Fetch real hackathons from database
  const { hackathons } = await HackathonRepository.listPublic({
    page: 1,
    pageSize: 50,
  });

  // Fetch unique tracks for filter pills
  const tracks = await prisma.track.findMany({
    select: { id: true, title: true, slug: true },
    distinct: ['slug'],
  });

  const formattedTracks = tracks.map((t) => ({
    label: t.title,
    value: t.slug,
  }));

  const formattedHackathons = hackathons.map((h: any) => ({
    id: h.id,
    slug: h.slug,
    title: h.title,
    tagline: h.tagline,
    description: h.description,
    organizationName: h.organizationName,
    logoUrl: h.logoUrl,
    bannerUrl: h.bannerUrl,
    status: h.status,
    minTeamSize: h.minTeamSize,
    maxTeamSize: h.maxTeamSize,
    eventMode: 'Online' as const,
    eventStartTime: h.eventStartTime,
    eventEndTime: h.eventEndTime,
    subEndTime: h.subEndTime,
    tracks: h.tracks?.map((t: any) => ({ id: t.id, title: t.title, slug: t.slug, colorHex: t.colorHex })),
    prizes: h.prizes?.map((p: any) => ({ amount: Number(p.amount), currency: p.currency, title: p.title })),
    registeredCount: h._count?.registrations || 42,
  }));

  return (
    <HackathonDiscovery
      initialHackathons={formattedHackathons}
      tracksList={formattedTracks}
    />
  );
}
