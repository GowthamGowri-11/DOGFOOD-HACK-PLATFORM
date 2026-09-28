'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Lock,
  Sparkles,
  Trophy,
  Users,
  Upload,
  ArrowRight,
  X,
  UserCheck,
  ShieldCheck,
  CheckCircle2,
  LogIn,
  AlertCircle,
  Loader2,
} from 'lucide-react';

export type AuthActionType = 'register' | 'team' | 'submit' | 'access' | 'general';

export interface AuthPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  actionType?: AuthActionType;
  title?: string;
  reason?: string;
  redirectUrl?: string;
  onSuccessLogin?: () => void;
}

export const AuthPromptModal: React.FC<AuthPromptModalProps> = ({
  isOpen,
  onClose,
  actionType = 'general',
  title,
  reason,
  redirectUrl,
  onSuccessLogin,
}) => {
  const [loggingInRole, setLoggingInRole] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Dynamic header based on action intent
  const getModalHeader = () => {
    if (title) return { title, icon: Lock, badge: 'LOGIN REQUIRED' };

    switch (actionType) {
      case 'register':
        return {
          title: 'Sign In to Register for Hackathons',
          subtitle:
            reason ||
            'Create your profile or sign in to register for competitions, form squads, and compete for verified prizes.',
          icon: Trophy,
          badge: 'HACKATHON REGISTRATION',
        };
      case 'team':
        return {
          title: 'Sign In to Team Up & Collaborate',
          subtitle:
            reason ||
            'Form squads, invite builders, or accept team invites. An active account is required to team up.',
          icon: Users,
          badge: 'TEAM FORMATION',
        };
      case 'submit':
        return {
          title: 'Sign In to Submit Project',
          subtitle:
            reason ||
            'Publish your GitHub repository, live demo URL, and solution artifacts to the judging evaluation panel.',
          icon: Upload,
          badge: 'SUBMISSION PORTAL',
        };
      case 'access':
        return {
          title: 'Authentication Required',
          subtitle:
            reason ||
            'This workspace contains role-specific dashboards and tools. Please sign in to access your portal.',
          icon: ShieldCheck,
          badge: 'RESTRICTED WORKSPACE',
        };
      default:
        return {
          title: 'Sign In to ATLYX Arena',
          subtitle:
            reason ||
            'Sign in to access hackathon participation tools, team spaces, and verified certificates.',
          icon: Sparkles,
          badge: 'AUTHENTICATION',
        };
    }
  };

  const header = getModalHeader();
  const HeaderIcon = header.icon;

  // 1-Click Fast Persona Login
  const handleQuickLogin = async (email: string, roleName: string) => {
    try {
      setLoggingInRole(roleName);
      setErrorMessage(null);

      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password: 'Password123!',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.message || data.error?.message || 'Login failed');
        return;
      }

      if (data.data?.user && typeof window !== 'undefined') {
        try {
          localStorage.setItem('dogfood_auth_user', JSON.stringify(data.data.user));
          localStorage.setItem(
            'dogfood_auth_role',
            (data.data.user.role?.toUpperCase() || roleName.toUpperCase()) as string
          );
        } catch {}
      }

      if (onSuccessLogin) {
        onSuccessLogin();
      }

      onClose();

      // Navigate to the role's appropriate workspace dashboard
      let targetUrl = redirectUrl;
      if (roleName === 'Admin') {
        targetUrl = '/admin/dashboard';
      } else if (roleName === 'Organizer') {
        targetUrl = '/organizer/dashboard';
      } else if (roleName === 'Judge') {
        targetUrl = '/judge/dashboard';
      } else if (roleName === 'Participant') {
        targetUrl =
          redirectUrl &&
          !redirectUrl.startsWith('/admin') &&
          !redirectUrl.startsWith('/organizer') &&
          !redirectUrl.startsWith('/judge')
            ? redirectUrl
            : '/participant/dashboard';
      }

      window.location.href = targetUrl || '/';
    } catch (err: any) {
      setErrorMessage(err?.message || 'Network error during login');
    } finally {
      setLoggingInRole(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 select-none animate-in fade-in duration-200">
      {/* Blurred Backdrop */}
      <div
        className="fixed inset-0 bg-[#0F172A]/70 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog Card */}
      <div className="relative bg-[#FFFFFF] border border-[#E5E0D8] rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden z-10 animate-in zoom-in-95 duration-200">
        {/* Ambient Top Glow Banner */}
        <div className="h-28 bg-gradient-to-r from-[#18181B] via-[#23201D] to-[#18181B] p-6 relative overflow-hidden flex items-center justify-between border-b border-[#2A2B30]">
          {/* Subtle Orange Flare */}
          <div className="absolute top-0 right-0 w-60 h-60 bg-[#FA541C]/25 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FA541C] to-[#E03A00] flex items-center justify-center text-white shadow-lg shadow-[#FA541C]/35 flex-shrink-0">
              <HeaderIcon className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[9.5px] font-extrabold tracking-wider uppercase bg-[#FA541C]/20 text-[#FF7A45] border border-[#FA541C]/30 mb-1">
                {header.badge}
              </span>
              <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight leading-tight">
                {header.title}
              </h2>
            </div>
          </div>

          {/* Close X Button */}
          <button
            onClick={onClose}
            className="relative z-10 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-[#9CA3AF] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-7 space-y-6">
          <p className="text-xs sm:text-[13.5px] text-[#4B5563] leading-relaxed">
            {header.subtitle}
          </p>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center">
              <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 1-Click Demo Login Box */}
          <div className="bg-[#FAF8F5] border border-[#ECE6DD] rounded-2xl p-4.5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#FA541C]" />
                Instant 1-Click Demo Login
              </span>
              <span className="text-[10.5px] text-[#9CA3AF]">Zero typing needed</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {/* Participant Alice */}
              <button
                type="button"
                disabled={loggingInRole !== null}
                onClick={() =>
                  handleQuickLogin('alice.hacker@hackathon.dev', 'Participant')
                }
                className="flex items-center space-x-2.5 p-3 rounded-xl bg-white border border-[#E5E0D8] hover:border-[#FA541C] hover:bg-[#FFF8F4] transition-all text-left group cursor-pointer shadow-xs disabled:opacity-50"
              >
                <div className="w-8 h-8 rounded-lg bg-[#FFF2EA] text-[#FA541C] flex items-center justify-center font-bold text-xs group-hover:scale-105 transition-transform flex-shrink-0">
                  {loggingInRole === 'Participant' ? (
                    <Loader2 className="w-4 h-4 animate-spin text-[#FA541C]" />
                  ) : (
                    <Users className="w-4 h-4" />
                  )}
                </div>
                <div className="truncate">
                  <div className="font-bold text-xs text-[#111827] group-hover:text-[#FA541C] transition-colors truncate">
                    Participant
                  </div>
                  <div className="text-[10px] text-[#6B7280] truncate">Alice Hacker</div>
                </div>
              </button>

              {/* Organizer */}
              <button
                type="button"
                disabled={loggingInRole !== null}
                onClick={() =>
                  handleQuickLogin('organizer@hackathon.dev', 'Organizer')
                }
                className="flex items-center space-x-2.5 p-3 rounded-xl bg-white border border-[#E5E0D8] hover:border-[#FA541C] hover:bg-[#FFF8F4] transition-all text-left group cursor-pointer shadow-xs disabled:opacity-50"
              >
                <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center font-bold text-xs group-hover:scale-105 transition-transform flex-shrink-0">
                  {loggingInRole === 'Organizer' ? (
                    <Loader2 className="w-4 h-4 animate-spin text-[#2563EB]" />
                  ) : (
                    <Trophy className="w-4 h-4" />
                  )}
                </div>
                <div className="truncate">
                  <div className="font-bold text-xs text-[#111827] group-hover:text-[#2563EB] transition-colors truncate">
                    Organizer
                  </div>
                  <div className="text-[10px] text-[#6B7280] truncate">Apex Event Lead</div>
                </div>
              </button>

              {/* Judge */}
              <button
                type="button"
                disabled={loggingInRole !== null}
                onClick={() =>
                  handleQuickLogin('judge.alpha@hackathon.dev', 'Judge')
                }
                className="flex items-center space-x-2.5 p-3 rounded-xl bg-white border border-[#E5E0D8] hover:border-[#FA541C] hover:bg-[#FFF8F4] transition-all text-left group cursor-pointer shadow-xs disabled:opacity-50"
              >
                <div className="w-8 h-8 rounded-lg bg-[#F5F3FF] text-[#7C3AED] flex items-center justify-center font-bold text-xs group-hover:scale-105 transition-transform flex-shrink-0">
                  {loggingInRole === 'Judge' ? (
                    <Loader2 className="w-4 h-4 animate-spin text-[#7C3AED]" />
                  ) : (
                    <UserCheck className="w-4 h-4" />
                  )}
                </div>
                <div className="truncate">
                  <div className="font-bold text-xs text-[#111827] group-hover:text-[#7C3AED] transition-colors truncate">
                    Judge
                  </div>
                  <div className="text-[10px] text-[#6B7280] truncate">Dr. Sarah Chen</div>
                </div>
              </button>

              {/* Admin */}
              <button
                type="button"
                disabled={loggingInRole !== null}
                onClick={() =>
                  handleQuickLogin('admin@hackathon.dev', 'Admin')
                }
                className="flex items-center space-x-2.5 p-3 rounded-xl bg-white border border-[#E5E0D8] hover:border-[#FA541C] hover:bg-[#FFF8F4] transition-all text-left group cursor-pointer shadow-xs disabled:opacity-50"
              >
                <div className="w-8 h-8 rounded-lg bg-[#ECFDF5] text-[#059669] flex items-center justify-center font-bold text-xs group-hover:scale-105 transition-transform flex-shrink-0">
                  {loggingInRole === 'Admin' ? (
                    <Loader2 className="w-4 h-4 animate-spin text-[#059669]" />
                  ) : (
                    <ShieldCheck className="w-4 h-4" />
                  )}
                </div>
                <div className="truncate">
                  <div className="font-bold text-xs text-[#111827] group-hover:text-[#059669] transition-colors truncate">
                    Admin
                  </div>
                  <div className="text-[10px] text-[#6B7280] truncate">Platform Admin</div>
                </div>
              </button>
            </div>
          </div>

          {/* Standard Navigation Actions */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <Link
              href={redirectUrl ? `/login?redirect=${encodeURIComponent(redirectUrl)}` : '/login'}
              onClick={onClose}
              className="w-full sm:flex-1 py-3 px-5 rounded-xl bg-gradient-to-r from-[#FA541C] to-[#E03A00] hover:from-[#FF6636] hover:to-[#D4380D] text-white text-xs sm:text-sm font-bold text-center shadow-md shadow-[#FA541C]/25 hover:shadow-xl hover:shadow-[#FA541C]/35 transition-all flex items-center justify-center gap-2 group cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In with Password</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="/register"
              onClick={onClose}
              className="w-full sm:w-auto py-3 px-5 rounded-xl bg-white border border-[#D1D5DB] hover:border-[#9CA3AF] text-[#374151] hover:text-[#111827] text-xs sm:text-sm font-bold text-center transition-colors cursor-pointer"
            >
              Create Account
            </Link>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-[#FAF8F5] border-t border-[#ECE6DD] text-center">
          <button
            onClick={onClose}
            className="text-xs text-[#6B7280] hover:text-[#18181B] font-medium transition-colors cursor-pointer"
          >
            Cancel and continue browsing
          </button>
        </div>
      </div>
    </div>
  );
};
