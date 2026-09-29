'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AIJuryPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/organizer/dashboard');
  }, [router]);

  return null;
}
