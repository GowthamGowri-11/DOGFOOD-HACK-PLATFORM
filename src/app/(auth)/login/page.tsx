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
  Users,
  Scale,
  User,
  Crown,
} from 'lucide-react';

interface DemoRole {
  role: 'ADMIN' | 'ORGANIZER' | 'JUDGE' | 'PARTICIPANT';
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  email: string;
  password: string;
  pillClasses: string;
  route: string;
}

const DEMO_ROLES: DemoRole[] = [
  {
    role: 'ADMIN',
    label: 'Admin',
    icon: Crown,
    email: 'admin@hackathon.dev',
    password: 'Password123!',
    pillClasses: 'bg-[#FFEDD5] text-[#C2410C] border-[#FED7AA] hover:bg-[#FDBA74]/40',
    route: '/admin/dashboard',
  },
  {
    role: 'ORGANIZER',
    label: 'Organizer',
    icon: Users,
    email: 'organizer@hackathon.dev',
    password: 'Password123!',
    pillClasses: 'bg-[#FEF3C7] text-[#B45309] border-[#FDE68A] hover:bg-[#FDE68A]/40',
    route: '/organizer/dashboard',
  },
  {
    role: 'JUDGE',
    label: 'Judge',
    icon: Scale,
    email: 'judge.alpha@hackathon.dev',
    password: 'Password123!',
    pillClasses: 'bg-[#ECFDF5] text-[#059669] border-[#A7F3D0] hover:bg-[#A7F3D0]/40',
    route: '/judge/dashboard',
  },
  {
    role: 'PARTICIPANT',
    label: 'Participant',
    icon: User,
    email: 'alice.hacker@hackathon.dev',
    password: 'Password123!',
    pillClasses: 'bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE] hover:bg-[#BFDBFE]/40',
    route: '/participant/dashboard',
  },
];

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const [loading, setLoading] = useState(false);
  const [activePill, setActivePill] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<string | null>(null);

  const performLogin = async (loginEmail: string, loginPass: string, roleHint?: string) => {
    setError(null);
    setSuccessInfo(null);

    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPass }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || data.error || 'Authentication failed');
      }

      setSuccessInfo(`Welcome back, ${data.user?.fullName || data.user?.role || 'Hacker'}!`);

      // Determine redirect URL
      const userRole = data.user?.role || roleHint || 'PARTICIPANT';
      let dest = '/participant/dashboard';
      if (userRole === 'ADMIN') dest = '/admin/dashboard';
      else if (userRole === 'ORGANIZER') dest = '/organizer/dashboard';
      else if (userRole === 'JUDGE') dest = '/judge/dashboard';

      setTimeout(() => {
        router.push(dest);
        router.refresh();
      }, 350);
    } catch (err: any) {
      setError(err.message || 'Unable to sign in. Check your credentials.');
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
    <div className="min-h-screen w-full flex flex-col lg:flex-row font-sans select-none bg-[#F9F7F2]">
      {/* ================= LEFT HALF: WARM LUXURY FORM CONTAINER ================= */}
      <div className="w-full lg:w-1/2 min-h-screen flex flex-col justify-between p-6 sm:p-10 lg:p-14 bg-[#F9F7F2] text-[#0F172A]">
        {/* Top Header Row */}
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2.5">
            <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
              <img src="/atlyx-logo.png" alt="ATLYX Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <span className="font-black text-lg tracking-tight text-[#0F172A] block leading-tight">
                ATLYX
              </span>
              <span className="block text-[8px] font-extrabold text-[#64748B] uppercase tracking-[0.2em] -mt-0.5">
                COMPETITION ARENA
              </span>
            </div>
          </Link>

          <div className="hidden sm:flex items-center space-x-3 text-[10px] font-bold text-[#94A3B8] tracking-[0.22em] uppercase">
            <span>IDEAS</span>
            <span>|</span>
            <span>BUILD</span>
            <span>|</span>
            <span>COMPETE</span>
            <span>|</span>
            <span>GROW</span>
          </div>
        </div>

        {/* Center Main Form Area */}
        <div className="max-w-[420px] w-full mx-auto my-auto py-8 sm:py-10">
          {/* Small Orange Accent Bar */}
          <div className="w-7 h-[3px] bg-[#FF5500] rounded-full mb-3" />

          {/* Subtitle & Title */}
          <div className="space-y-1 mb-6">
            <span className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-[#64748B] block">
              WELCOME BACK TO ATLYX
            </span>
            <h1 className="text-3xl sm:text-4xl font-black text-[#0F172A] tracking-tight">
              Welcome
            </h1>
            <p className="text-xs sm:text-sm text-[#64748B] font-medium pt-0.5">
              Sign in to your account and continue building the future.
            </p>
          </div>

          {/* Feedback Messages */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {successInfo && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
              <span>{successInfo}</span>
            </div>
          )}

          {/* Interactive Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username / Email */}
            <div>
              <label className="block text-xs font-bold text-[#0F172A] mb-1.5">
                Username
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full h-11 pl-10 pr-4 bg-[#F1EFEA] border border-[#E5E1D8] focus:border-[#FF5500] focus:bg-white focus:ring-2 focus:ring-[#FF5500]/15 rounded-xl text-xs sm:text-sm text-[#0F172A] placeholder:text-[#94A3B8] transition-all font-medium"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-[#0F172A] mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full h-11 pl-10 pr-10 bg-[#F1EFEA] border border-[#E5E1D8] focus:border-[#FF5500] focus:bg-white focus:ring-2 focus:ring-[#FF5500]/15 rounded-xl text-xs sm:text-sm text-[#0F172A] placeholder:text-[#94A3B8] transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#0F172A] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between text-xs pt-0.5">
              <label className="flex items-center space-x-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-[#CBD5E1] text-[#FF5500] focus:ring-[#FF5500] accent-[#FF5500]"
                />
                <span className="font-semibold text-[#334155]">Remember me</span>
              </label>

              <button
                type="button"
                onClick={() => {
                  setEmail('alice.hacker@hackathon.dev');
                  setPassword('Password123!');
                }}
                className="font-bold text-[#FF5500] hover:underline transition-colors cursor-pointer"
              >
                Forgot Password ?
              </button>
            </div>

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              disabled={loading || activePill !== null}
              className="w-full h-11 sm:h-12 bg-gradient-to-r from-[#FF5500] to-[#EA580C] hover:from-[#EA580C] hover:to-[#C2410C] text-white font-extrabold text-xs tracking-[0.25em] uppercase rounded-xl shadow-md shadow-orange-500/20 hover:shadow-lg hover:shadow-orange-500/30 flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50 mt-2 cursor-pointer"
            >
              {loading ? (
                <span>AUTHENTICATING...</span>
              ) : (
                <>
                  <span>S U B M I T</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </>
              )}
            </button>
          </form>

          {/* Quick Login Section */}
          <div className="mt-8 pt-6 border-t border-[#E5E1D8]/80">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-extrabold text-[#64748B] uppercase tracking-[0.2em] flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-[#FF5500] fill-[#FF5500]" />
                QUICK LOGIN (DEMO)
              </span>
              <span className="text-[9px] font-bold text-[#94A3B8] uppercase tracking-wider">
                INSTANT ACCESS
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {DEMO_ROLES.map((demo) => {
                const isCurrent = activePill === demo.role;
                const Icon = demo.icon;

                return (
                  <button
                    key={demo.role}
                    type="button"
                    disabled={loading || activePill !== null}
                    onClick={() => handlePillClick(demo)}
                    className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all duration-150 shadow-2xs active:scale-95 disabled:opacity-50 cursor-pointer ${demo.pillClasses}`}
                  >
                    {isCurrent ? (
                      <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                    )}
                    <span>{demo.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Link */}
        <div className="text-xs text-[#64748B] pt-4">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="font-bold text-[#FF5500] hover:underline">
            Sign up →
          </Link>
        </div>
      </div>

      {/* ================= RIGHT HALF: DEEP DARK EDITORIAL ARCHITECTURAL HERO ================= */}
      <div className="hidden lg:block lg:w-1/2 relative min-h-screen bg-[#0A0D12] overflow-hidden">
        {/* Background Architectural Image */}
        <img
          src="/atlyx-login-architecture.jpg"
          alt="ATLYX Modern Architecture"
          className="absolute inset-0 w-full h-full object-cover object-center opacity-85"
        />

        {/* Gradient Shadow Overlays for Deep Contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0D12] via-[#0A0D12]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0A0D12]/70 via-transparent to-[#0A0D12]/40" />

        {/* Foreground Hero Editorial Content */}
        <div className="relative z-10 h-full p-12 lg:p-16 flex flex-col justify-between select-none">
          {/* Top Accent Line */}
          <div>
            <div className="w-8 h-[3px] bg-[#FF5500] rounded-full mb-8" />

            {/* Massive Bold Headline */}
            <div className="space-y-1">
              <h2 className="text-5xl xl:text-6xl font-black tracking-tight text-white leading-[1.02]">
                IDEAS
              </h2>
              <h2 className="text-5xl xl:text-6xl font-black tracking-tight text-white leading-[1.02]">
                TODAY.
              </h2>
              <h2 className="text-5xl xl:text-6xl font-black tracking-tight text-[#FF5500] leading-[1.02]">
                IMPACT
              </h2>
              <h2 className="text-5xl xl:text-6xl font-black tracking-tight text-[#FF5500] leading-[1.02]">
                TOMORROW.
              </h2>
            </div>

            {/* Sub-Tagline */}
            <div className="mt-8 space-y-1 text-xs font-extrabold tracking-[0.25em] text-slate-400 uppercase">
              <p>HACKATHONS • INNOVATION</p>
              <p>COLLABORATION • REAL-WORLD IMPACT</p>
            </div>
          </div>

          {/* Bottom Area: KPI Stats Grid & Brand Wordmark */}
          <div className="space-y-8 pt-8">
            {/* Divider Line */}
            <div className="w-12 h-[1px] bg-slate-700/80" />

            {/* 4-Column Stat Grid */}
            <div className="grid grid-cols-4 divide-x divide-slate-800/90 bg-black/40 backdrop-blur-md rounded-2xl p-4 border border-slate-800/80 shadow-2xl">
              {/* Stat 1 */}
              <div className="px-3 text-left">
                <div className="font-mono font-black text-2xl text-white tracking-tight">100+</div>
                <div className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mt-0.5">
                  HACKATHONS
                </div>
              </div>

              {/* Stat 2 */}
              <div className="px-3 text-left">
                <div className="font-mono font-black text-2xl text-white tracking-tight">10K+</div>
                <div className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mt-0.5">
                  INNOVATORS
                </div>
              </div>

              {/* Stat 3 */}
              <div className="px-3 text-left">
                <div className="font-mono font-black text-2xl text-white tracking-tight">50+</div>
                <div className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mt-0.5">
                  COLLEGES
                </div>
              </div>

              {/* Stat 4 */}
              <div className="px-3 text-left">
                <div className="font-mono font-black text-2xl text-white tracking-tight">REAL</div>
                <div className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mt-0.5">
                  OPPORTUNITIES
                </div>
              </div>
            </div>

            {/* Wordmark Footer */}
            <div className="space-y-1">
              <div className="w-6 h-[2px] bg-[#FF5500] mb-2" />
              <div className="font-extrabold text-sm text-white tracking-[0.2em]">
                ATLYX
              </div>
              <div className="text-[8.5px] font-bold text-slate-400 uppercase tracking-[0.25em]">
                COMPETITION ARENA
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
