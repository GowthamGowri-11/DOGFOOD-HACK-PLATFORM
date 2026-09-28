'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** Login is temporarily disabled — redirect into the app. */
export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/dashboard');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white text-sm text-slate-500">
      Auth disabled — opening the app…
    </div>
  );
}
