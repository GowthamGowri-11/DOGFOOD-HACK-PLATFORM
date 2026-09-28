'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

const Lottie: any = dynamic(() => import('lottie-react').then((mod) => mod.Lottie), { ssr: false });

interface LoginLottiePlayerProps {
  className?: string;
}

export function LoginLottiePlayer({ className = 'w-full h-full' }: LoginLottiePlayerProps) {
  const [animationData, setAnimationData] = useState<any>(null);

  useEffect(() => {
    let isCancelled = false;

    fetch('/Login.json')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch Login.json');
        return res.json();
      })
      .then((data) => {
        if (!isCancelled) {
          setAnimationData(data);
        }
      })
      .catch((err) => {
        console.warn('Could not load animation JSON:', err.message);
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {!animationData ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-10 h-10 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      ) : (
        <Lottie
          src={animationData}
          loop
          autoplay
          className="w-full h-full"
        />
      )}
    </div>
  );
}
