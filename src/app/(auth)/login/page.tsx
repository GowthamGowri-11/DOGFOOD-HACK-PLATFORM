'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Zap,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

interface DemoRole {
  role: 'ADMIN' | 'ORGANIZER' | 'JUDGE' | 'PARTICIPANT';
  label: string;
  icon: string;
  email: string;
  password: string;
  pillClasses: string;
  route: string;
}

const DEMO_ROLES: DemoRole[] = [
  {
    role: 'ADMIN',
    label: 'Admin',
    icon: '👑',
    email: 'admin@hackathon.dev',
    password: 'Password123!',
    pillClasses: 'bg-[#FEE2E2] text-[#991B1B] border-[#FECACA] hover:bg-[#FED7D7]',
    route: '/admin/dashboard',
  },
  {
    role: 'ORGANIZER',
    label: 'Organizer',
    icon: '👥',
    email: 'organizer@hackathon.dev',
    password: 'Password123!',
    pillClasses: 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A] hover:bg-[#FEEBB0]',
    route: '/organizer/dashboard',
  },
  {
    role: 'JUDGE',
    label: 'Judge',
    icon: '⚖️',
    email: 'judge.alpha@hackathon.dev',
    password: 'Password123!',
    pillClasses: 'bg-[#D1FAE5] text-[#065F46] border-[#A7F3D0] hover:bg-[#BCF5DC]',
    route: '/judge/dashboard',
  },
  {
    role: 'PARTICIPANT',
    label: 'Participant',
    icon: '👤',
    email: 'alice.hacker@hackathon.dev',
    password: 'Password123!',
    pillClasses: 'bg-[#DBEAFE] text-[#1E40AF] border-[#BFDBFE] hover:bg-[#CEE3FE]',
    route: '/participant/dashboard',
  },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('bg6951872@gmail.com');
  const [password, setPassword] = useState('Password123!');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activePill, setActivePill] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<string | null>(null);

  const performLogin = async (targetEmail: string, targetPass: string, fallbackRole?: string) => {
    setError(null);
    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail, password: targetPass }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error?.message || 'Login failed. Please check your credentials.');
      }

      const userRole = data.data?.user?.role || fallbackRole;
      setSuccessInfo(`Authenticated as ${userRole}. Redirecting...`);

      if (userRole === 'ORGANIZER') {
        router.push('/organizer/dashboard');
      } else if (userRole === 'JUDGE') {
        router.push('/judge/dashboard');
      } else if (userRole === 'ADMIN') {
        router.push('/admin/dashboard');
      } else {
        router.push('/participant/dashboard');
      }
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Authentication error');
      throw err;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter your username and password.');
      return;
    }
    setLoading(true);
    try {
      await performLogin(email, password);
    } catch {
      // Handled in performLogin
    } finally {
      setLoading(false);
    }
  };

  const handlePillClick = async (demo: DemoRole) => {
    setActivePill(demo.role);
    setEmail(demo.email);
    setPassword(demo.password);

    try {
      await performLogin(demo.email, demo.password, demo.role);
    } catch {
      setActivePill(null);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#FAF8F5] flex flex-col lg:flex-row font-sans text-[#111827] select-none">
      {/* ================= LEFT COLUMN: LOGIN FORM ================= */}
      <div className="w-full lg:w-[48%] xl:w-[46%] flex flex-col justify-between px-8 sm:px-14 lg:px-12 xl:px-16 py-8 sm:py-10 bg-[#FAF8F5]">
        {/* Top Header: Logo + Minimal Nav */}
        <div className="flex items-center justify-between pb-6 sm:pb-8">
          <Link href="/" className="flex items-center space-x-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-[#FA541C] flex items-center justify-center text-white shadow-sm shadow-[#FA541C]/30 group-hover:scale-105 transition-transform">
              <svg className="w-4.5 h-4.5 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 22h4.5l2.5-5h6l2.5 5H22L12 2zm0 6.5L14.25 13h-4.5L12 8.5z" />
              </svg>
            </div>
            <div>
              <span className="font-extrabold text-[17px] tracking-tight text-[#111827] block leading-none">
                ATLYX
              </span>
              <span className="block text-[9px] font-semibold text-[#6B7280] uppercase tracking-wider mt-0.5">
                COMPETITION ARENA
              </span>
            </div>
          </Link>

          <div className="hidden sm:flex items-center space-x-2 text-[10.5px] font-medium text-[#71717A] tracking-wider uppercase">
            <span>IDEAS</span>
            <span className="text-[#D4D4D8]">|</span>
            <span>BUILD</span>
            <span className="text-[#D4D4D8]">|</span>
            <span>COMPETE</span>
            <span className="text-[#D4D4D8]">|</span>
            <span>GROW</span>
          </div>
        </div>

        {/* Center: Main Form Content */}
        <div className="max-w-[460px] w-full mx-auto my-auto py-4">
          {/* Accent Line + Welcome Header */}
          <div className="w-8 h-[3.5px] bg-[#FA541C] rounded-full mb-3" />
          <span className="block text-[10.5px] font-bold tracking-[0.2em] text-[#6B7280] uppercase">
            WELCOME BACK TO ATLYX
          </span>
          <h1 className="text-3xl sm:text-[40px] font-black text-[#111827] tracking-tight leading-tight mt-1">
            Welcome
          </h1>
          <p className="text-xs sm:text-[13.5px] text-[#6B7280] mt-1.5 font-normal">
            Sign in to your account and continue building the future.
          </p>

          {/* Feedback Messages */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {successInfo && (
            <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
              <span>{successInfo}</span>
            </div>
          )}

          {/* Form Fields */}
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {/* Username / Email */}
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1.5">
                Username
              </label>
              <div className="relative flex items-center">
                <Mail className="w-4 h-4 text-[#9CA3AF] absolute left-3.5 pointer-events-none transition-colors" />
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="bg6951872@gmail.com"
                  className="w-full h-11 pl-10 pr-4 bg-transparent border border-[#D1D5DB] hover:border-[#9CA3AF] rounded-xl text-xs text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#FA541C] focus:ring-2 focus:ring-[#FA541C]/20 transition-all duration-200"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1.5">
                Password
              </label>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 text-[#9CA3AF] absolute left-3.5 pointer-events-none transition-colors" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full h-11 pl-10 pr-10 bg-transparent border border-[#D1D5DB] hover:border-[#9CA3AF] rounded-xl text-xs text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#FA541C] focus:ring-2 focus:ring-[#FA541C]/20 transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 text-[#9CA3AF] hover:text-[#FA541C] hover:scale-110 active:scale-95 transition-all duration-150 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center space-x-2 cursor-pointer select-none group/rem">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-[#FA541C] focus:ring-[#FA541C] accent-[#FA541C] cursor-pointer group-hover/rem:scale-105 transition-transform"
                />
                <span className="font-medium text-[#374151] group-hover/rem:text-[#111827] transition-colors">Remember me</span>
              </label>

              <button
                type="button"
                onClick={() => {
                  setEmail('alice.hacker@hackathon.dev');
                  setPassword('Password123!');
                }}
                className="font-semibold text-[#FA541C] hover:text-[#EA4812] hover:underline transition-colors cursor-pointer"
              >
                Forgot Password ?
              </button>
            </div>

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              disabled={loading || activePill !== null}
              className="w-full h-12 bg-[#FA541C] hover:bg-[#EA4812] hover:shadow-lg hover:shadow-[#FA541C]/35 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] text-white font-bold text-xs uppercase tracking-widest rounded-xl flex items-center justify-center space-x-2 shadow-sm transition-all duration-200 disabled:opacity-50 mt-2 cursor-pointer group/btn"
            >
              <span>{loading ? 'AUTHENTICATING...' : 'SUBMIT'}</span>
              <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1.5 transition-transform duration-200" />
            </button>
          </form>

          {/* 1-Click Demo Login Pills */}
          <div className="mt-8 pt-5 border-t border-[#E5E0D8]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280] flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-[#FA541C] fill-[#FA541C] animate-pulse-subtle" />
                <span>1-CLICK DEMO LOGIN PILLS</span>
              </span>
              <span className="text-[9.5px] font-medium uppercase tracking-wider text-[#9CA3AF] font-mono">
                INSTANT ACCESS
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {DEMO_ROLES.map((demo) => {
                const isCurrent = activePill === demo.role;

                return (
                  <button
                    key={demo.role}
                    type="button"
                    disabled={loading || activePill !== null}
                    onClick={() => handlePillClick(demo)}
                    className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all duration-200 shadow-2xs hover:-translate-y-0.5 hover:shadow-md active:scale-95 disabled:opacity-50 cursor-pointer ${demo.pillClasses}`}
                  >
                    {isCurrent ? (
                      <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <span>{demo.icon}</span>
                    )}
                    <span>{demo.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sign Up Link */}
          <div className="mt-6 text-xs text-[#6B7280]">
            Don&apos;t have an account?{' '}
            <Link
              href="/register"
              className="font-bold text-[#FA541C] hover:text-[#EA4812] hover:underline inline-flex items-center space-x-1 group/signup transition-colors"
            >
              <span>Sign up</span>
              <ArrowRight className="w-3.5 h-3.5 inline ml-0.5 group-hover/signup:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Footer copyright */}
        <div className="text-[11px] text-[#9CA3AF] pt-4">
          &copy; {new Date().getFullYear()} ATLYX Competition Arena. All rights reserved.
        </div>
      </div>

      {/* ================= RIGHT COLUMN: DARK ARCHITECTURAL SHOWCASE ================= */}
      <div className="hidden lg:flex lg:w-[52%] xl:w-[54%] relative bg-[#090A0D] flex-col justify-between p-12 xl:p-16 overflow-hidden select-none group/showcase">
        {/* Background Architectural Image */}
        <img
          src="/login-bg.jpg"
          alt="ATLYX Arena Architecture"
          className="absolute inset-0 w-full h-full object-cover object-right opacity-65 group-hover/showcase:scale-105 transition-transform duration-1000 ease-out"
        />

        {/* Dark Vignette Overlay for Crisp Contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#090A0D] via-transparent to-[#090A0D]/70 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#090A0D]/90 via-[#090A0D]/40 to-transparent pointer-events-none" />

        {/* TOP: Accent Line & Main Typography */}
        <div className="relative z-10 pt-4">
          <div className="w-9 h-[3.5px] bg-[#FA541C] rounded-full mb-8 group-hover/showcase:w-14 transition-all duration-500" />

          {/* Huge Brand Typography */}
          <div className="text-5xl xl:text-6xl font-black uppercase tracking-tight leading-[0.92] text-white">
            <div>IDEAS</div>
            <div>TODAY.</div>
            <div className="text-[#FA541C] mt-2">IMPACT</div>
            <div className="text-[#FA541C]">TOMORROW.</div>
          </div>

          {/* Sublines */}
          <div className="mt-8 text-[10.5px] font-semibold tracking-[0.25em] text-[#9CA3AF] uppercase space-y-1.5">
            <div>HACKATHONS &bull; INNOVATION</div>
            <div>COLLABORATION &bull; REAL-WORLD IMPACT</div>
          </div>
        </div>

        {/* MIDDLE/BOTTOM: 4-Column Metric Statistics with Clean Vertical Dividers */}
        <div className="relative z-10 my-auto py-6">
          <div className="grid grid-cols-4 gap-4 items-center">
            <div className="pr-3 hover:bg-white/10 rounded-xl p-2.5 -m-2.5 transition-all duration-200 cursor-default">
              <div className="text-2xl xl:text-3xl font-black text-white">100+</div>
              <div className="text-[9px] font-bold text-[#9CA3AF] uppercase tracking-wider mt-1">
                HACKATHONS
              </div>
            </div>
            <div className="px-3 border-l border-white/20 hover:bg-white/10 rounded-xl p-2.5 -m-2.5 transition-all duration-200 cursor-default">
              <div className="text-2xl xl:text-3xl font-black text-white">10K+</div>
              <div className="text-[9px] font-bold text-[#9CA3AF] uppercase tracking-wider mt-1">
                INNOVATORS
              </div>
            </div>
            <div className="px-3 border-l border-white/20 hover:bg-white/10 rounded-xl p-2.5 -m-2.5 transition-all duration-200 cursor-default">
              <div className="text-2xl xl:text-3xl font-black text-white">50+</div>
              <div className="text-[9px] font-bold text-[#9CA3AF] uppercase tracking-wider mt-1">
                COLLEGES
              </div>
            </div>
            <div className="pl-3 border-l border-white/20 hover:bg-white/10 rounded-xl p-2.5 -m-2.5 transition-all duration-200 cursor-default">
              <div className="text-2xl xl:text-3xl font-black text-white">REAL</div>
              <div className="text-[9px] font-bold text-[#9CA3AF] uppercase tracking-wider mt-1">
                OPPORTUNITIES
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM: Minimal Wordmark */}
        <div className="relative z-10 pt-4">
          <div className="w-6 h-[2px] bg-[#FA541C] rounded-full mb-1.5" />
          <div className="text-xs font-black text-white tracking-[0.3em] uppercase">
            ATLYX
          </div>
          <div className="text-[9px] font-bold text-[#9CA3AF] tracking-[0.2em] uppercase mt-0.5">
            COMPETITION ARENA
          </div>
        </div>
      </div>
    </div>
  );
}
