'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

export default function GenericProfileRedirectPage() {
  const router = useRouter();
  const { currentUser, currentRole, authLoading, openAuthModal } = useAuth();

  useEffect(() => {
    if (authLoading) return;

    if (!currentUser) {
      openAuthModal({
        actionType: 'access',
        title: 'Sign In to View Your Profile',
        reason: 'Please sign in to view and customize your account profile and credentials.',
        redirectUrl: '/profile',
      });
      return;
    }

    const role = (currentUser.role?.toUpperCase() || currentRole || 'PARTICIPANT');

    if (role === 'ADMIN') {
      router.replace('/admin/profile');
    } else if (role === 'ORGANIZER') {
      router.replace('/organizer/profile');
    } else if (role === 'JUDGE') {
      router.replace('/judge/profile');
    } else {
      router.replace('/participant/profile');
    }
  }, [currentUser, currentRole, authLoading, router, openAuthModal]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
      <Loader2 className="w-8 h-8 text-[#FA541C] animate-spin" />
      <p className="text-xs text-stone-500 font-medium">Navigating to your workspace profile...</p>
    </div>
  );
}
