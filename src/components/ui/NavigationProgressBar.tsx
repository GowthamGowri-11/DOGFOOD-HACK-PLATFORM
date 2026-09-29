'use client';

import React, { useEffect, useState, useTransition } from 'react';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';

export const NavigationProgressBar: React.FC = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  // Trigger completion when pathname or searchParams change
  useEffect(() => {
    if (isLoading) {
      setProgress(100);
      const timer = setTimeout(() => {
        setIsLoading(false);
        setVisible(false);
        setProgress(0);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [pathname, searchParams]);

  // Handle global click interception for instantaneous visual feedback
  useEffect(() => {
    let progressTimer: NodeJS.Timeout | null = null;

    const handleAnchorClick = (e: MouseEvent) => {
      // Find closest anchor tag
      const target = e.target as HTMLElement | null;
      const anchor = target?.closest('a') as HTMLAnchorElement | null;

      if (!anchor) return;

      const href = anchor.getAttribute('href');
      const targetAttr = anchor.getAttribute('target');

      // Ignore external, hash-only, mailto/tel, or new-tab links
      if (
        !href ||
        href.startsWith('#') ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:') ||
        targetAttr === '_blank' ||
        anchor.hasAttribute('download')
      ) {
        return;
      }

      // Check if it's an internal link
      const isInternal =
        href.startsWith('/') ||
        (href.startsWith('http') && href.includes(window.location.host));

      if (!isInternal) return;

      // Extract path to compare
      try {
        const url = new URL(anchor.href, window.location.origin);
        const currentUrl = new URL(window.location.href);

        // If navigating to the identical exact URL, don't trigger
        if (
          url.pathname === currentUrl.pathname &&
          url.search === currentUrl.search &&
          url.hash === currentUrl.hash
        ) {
          return;
        }

        // Instantly prefetch target url
        try {
          router.prefetch(url.pathname + url.search);
        } catch {}

        // Start progress bar immediately (0ms visual confirmation)
        setVisible(true);
        setIsLoading(true);
        setProgress(28);

        if (progressTimer) clearInterval(progressTimer);

        progressTimer = setInterval(() => {
          setProgress((prev) => {
            if (prev < 65) return prev + Math.random() * 15;
            if (prev < 88) return prev + Math.random() * 5;
            return prev;
          });
        }, 120);
      } catch {}
    };

    document.addEventListener('click', handleAnchorClick, { capture: true });

    return () => {
      document.removeEventListener('click', handleAnchorClick, { capture: true });
      if (progressTimer) clearInterval(progressTimer);
    };
  }, [router]);

  if (!visible && progress === 0) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 z-[99999] pointer-events-none transition-opacity duration-200"
      style={{ opacity: isLoading ? 1 : 0 }}
    >
      {/* Glowing progress line */}
      <div
        className="h-[2.5px] bg-gradient-to-r from-[#FA541C] via-[#FF7A45] to-[#FFA940] transition-all duration-150 ease-out shadow-[0_0_12px_rgba(250,84,28,0.75)]"
        style={{
          width: `${progress}%`,
        }}
      />
      {/* Ambient trailing glow point */}
      <div
        className="absolute top-0 w-24 h-[2.5px] bg-white/40 blur-xs transition-all duration-150 ease-out pointer-events-none"
        style={{
          left: `calc(${progress}% - 96px)`,
          opacity: progress > 15 && progress < 98 ? 1 : 0,
        }}
      />
    </div>
  );
};

export default function GlobalProgressBar() {
  return (
    <React.Suspense fallback={null}>
      <NavigationProgressBar />
    </React.Suspense>
  );
}

