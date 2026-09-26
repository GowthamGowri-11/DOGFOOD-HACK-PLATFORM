import { notFound } from 'next/navigation';
import { HackathonRepository } from '@/server/repositories/hackathon.repository';
import { HackathonDetailView } from '@/components/public/HackathonDetailView';

interface HackathonDetailPageProps {
  params: {
    slug: string;
  };
}

export const dynamic = 'force-dynamic';

export default async function HackathonDetailPage({ params }: HackathonDetailPageProps) {
  const { slug } = params;
  const hackathon = await HackathonRepository.findBySlug(slug, false);

  if (!hackathon) {
    notFound();
  }

  return <HackathonDetailView hackathon={hackathon} />;
}
