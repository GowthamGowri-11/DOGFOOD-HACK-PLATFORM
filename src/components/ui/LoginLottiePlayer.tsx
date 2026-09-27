'use client';

import React, { useEffect, useRef, useState } from 'react';

interface LoginLottiePlayerProps {
  className?: string;
}

export function LoginLottiePlayer({ className = 'w-full h-full' }: LoginLottiePlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let anim: any = null;
    let isCancelled = false;

    // Load lottie-web on client side
    import('lottie-web')
      .then((lottieModule) => {
        if (isCancelled || !containerRef.current) return;
        const lottie = lottieModule.default || lottieModule;

        anim = lottie.loadAnimation({
          container: containerRef.current,
          renderer: 'svg',
          loop: true,
          autoplay: true,
          path: '/Login.json',
        });

        anim.addEventListener('DOMLoaded', () => {
          if (!isCancelled) setIsLoaded(true);
        });
      })
      .catch((err) => {
        console.error('Failed to load lottie-web:', err);
      });

    return () => {
      isCancelled = true;
      if (anim) {
        anim.destroy();
      }
    };
  }, []);

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-10 h-10 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      )}
      <div ref={containerRef} className="w-full h-full flex items-center justify-center" />
    </div>
  );
}
