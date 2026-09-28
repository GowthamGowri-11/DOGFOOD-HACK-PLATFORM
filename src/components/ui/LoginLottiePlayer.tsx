'use client';

import React from 'react';
import { Lottie } from 'lottie-react';

interface LoginLottiePlayerProps {
  className?: string;
}

export function LoginLottiePlayer({ className = 'w-full h-full' }: LoginLottiePlayerProps) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <Lottie
        src="/Login.json"
        className="w-full h-full"
        autoplay
        loop
      />
    </div>
  );
}
