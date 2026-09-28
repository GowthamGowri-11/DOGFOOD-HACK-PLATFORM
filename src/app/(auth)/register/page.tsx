'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
<<<<<<< HEAD
import { UserPlus, AlertCircle } from 'lucide-react';
=======
import {
  Shield,
  Layers,
  Award,
  Rocket,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Zap,
  Lock,
  Key,
  Check,
  Settings,
  Cloud,
} from 'lucide-react';
import { LoginLottiePlayer } from '@/components/ui/LoginLottiePlayer';

interface DemoRole {
  role: 'ADMIN' | 'ORGANIZER' | 'JUDGE' | 'PARTICIPANT';
  label: string;
  email: string;
  password: string;
  pillClasses: string;
}

const DEMO_PILLS: DemoRole[] = [
  {
    role: 'ADMIN',
    label: '👑 Admin',
    email: 'admin@hackathon.dev',
    password: 'Password123!',
    pillClasses: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100',
  },
  {
    role: 'ORGANIZER',
    label: '🎯 Organizer',
    email: 'organizer@hackathon.dev',
    password: 'Password123!',
    pillClasses: 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100',
  },
  {
    role: 'JUDGE',
    label: '⚖️ Judge',
    email: 'judge.alpha@hackathon.dev',
    password: 'Password123!',
    pillClasses: 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100',
  },
  {
    role: 'PARTICIPANT',
    label: '🚀 Participant',
    email: 'alice.hacker@hackathon.dev',
    password: 'Password123!',
    pillClasses: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
  },
];
>>>>>>> 955df85a1823fdc70d72489433820b8abade5940

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'PARTICIPANT' | 'ORGANIZER' | 'JUDGE'>('PARTICIPANT');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activePill, setActivePill] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<string | null>(null);

  // Authenticate helper for Demo Pills
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
        throw new Error(data.error?.message || 'Login failed.');
      }

      const userRole = data.data?.user?.role || fallbackRole;
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

  // Registration handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          name: fullName,
          email,
          password,
          role,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error?.message || 'Registration failed');
      }

      setSuccessInfo(`Account created as ${role}! Redirecting...`);

      setTimeout(() => {
        if (role === 'ORGANIZER') {
          router.push('/organizer/dashboard');
        } else if (role === 'JUDGE') {
          router.push('/judge/dashboard');
        } else {
          router.push('/participant/dashboard');
        }
        router.refresh();
      }, 600);
    } catch (err: any) {
      setError(err.message || 'Registration failed');
      setLoading(false);
    }
  };

  // Handle Demo Pill
  const handlePillClick = async (demo: DemoRole) => {
    setActivePill(demo.role);
    try {
      await performLogin(demo.email, demo.password, demo.role);
    } catch {
      setActivePill(null);
    }
  };

  // Google Sign In shortcut
  const handleGoogleSignIn = async () => {
    setActivePill('GOOGLE');
    try {
      await performLogin('alice.hacker@hackathon.dev', 'Password123!', 'PARTICIPANT');
    } catch {
      setActivePill(null);
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-800 flex items-center justify-center font-sans p-4 sm:p-8 lg:p-12">
      {/* Main Content */}
      <main className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
        {/* Left Form */}
        <div className="lg:col-span-6 max-w-md w-full mx-auto lg:mx-0">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#6366F1] tracking-[0.25em] uppercase mb-8">
            REGISTER
          </h1>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {successInfo && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
              <span>{successInfo}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-0 py-2 border-b-2 border-slate-200 bg-transparent text-slate-900 placeholder:text-slate-300 text-sm focus:outline-none focus:border-[#6366F1] transition-colors"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full px-0 py-2 border-b-2 border-slate-200 bg-transparent text-slate-900 placeholder:text-slate-300 text-sm focus:outline-none focus:border-[#6366F1] transition-colors"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Password <span className="text-[11px] text-slate-400 font-normal">(min 8 chars)</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-0 py-2 border-b-2 border-slate-200 bg-transparent text-slate-900 placeholder:text-slate-300 text-sm focus:outline-none focus:border-[#6366F1] transition-colors pr-8"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Role Pills */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Select Role
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['PARTICIPANT', 'ORGANIZER', 'JUDGE'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`py-2 px-2 rounded-lg text-xs font-semibold border transition-all text-center ${
                      role === r
                        ? 'border-[#6366F1] bg-indigo-50 text-[#6366F1] shadow-sm'
                        : 'border-slate-200 bg-slate-50 hover:bg-white text-slate-600'
                    }`}
                  >
                    {r === 'PARTICIPANT' && '🚀 Builder'}
                    {r === 'ORGANIZER' && '🎯 Organizer'}
                    {r === 'JUDGE' && '⚖️ Judge'}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || activePill !== null}
              className="w-full py-3.5 px-6 bg-[#FBBF24] hover:bg-[#F59E0B] text-white font-bold text-sm tracking-[0.15em] uppercase rounded-none shadow-md hover:shadow-lg transition-all active:scale-[0.99] disabled:opacity-50"
            >
              {loading ? 'CREATING ACCOUNT...' : 'SUBMIT'}
            </button>
          </form>

          {/* Divider */}
          <div className="my-5 flex items-center gap-3">
            <div className="flex-1 h-[1px] bg-slate-200" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              OR CONTINUE WITH
            </span>
            <div className="flex-1 h-[1px] bg-slate-200" />
          </div>

          {/* Sign Up with Google */}
          <button
            type="button"
            disabled={loading || activePill !== null}
            onClick={handleGoogleSignIn}
            className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 shadow-sm flex items-center justify-center gap-3 transition-all hover:border-slate-300 disabled:opacity-50"
          >
            {activePill === 'GOOGLE' ? (
              <div className="w-4 h-4 border-2 border-slate-700 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.15z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.27v3.15C3.25 21.3 7.31 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.27C.46 8.2 0 10.04 0 12s.46 3.8 1.27 5.42l4.01-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.7 1.27 6.58l4.01 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
            )}
            <span>Sign up with Google</span>
          </button>

          {/* Demo Pills */}
          <div className="mt-4 pt-3.5 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
                <span>Instant Demo Access</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">1-Click Launch</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {DEMO_PILLS.map((demo) => {
                const isCurrent = activePill === demo.role;
                return (
                  <button
                    key={demo.role}
                    type="button"
                    disabled={loading || activePill !== null}
                    onClick={() => handlePillClick(demo)}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-150 shadow-sm active:scale-95 disabled:opacity-50 ${demo.pillClasses}`}
                  >
                    {isCurrent ? (
                      <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : null}
                    <span>{demo.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-5 text-xs text-slate-500">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-[#6366F1] hover:underline">
              Sign in
            </Link>
          </div>
        </div>

        {/* Right Illustration with Lottie */}
        <div className="lg:col-span-6 flex items-center justify-center relative select-none">
          <div className="relative w-80 h-80 sm:w-96 sm:h-96 md:w-[420px] md:h-[420px] flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#4F46E5] via-[#3B82F6] to-[#60A5FA] opacity-90 shadow-2xl shadow-blue-500/25" />

            <div className="absolute top-2 left-6 text-slate-300 opacity-60 animate-spin [animation-duration:18s]">
              <Settings className="w-7 h-7 text-white" />
            </div>
            <div className="absolute top-4 right-12 text-slate-300 opacity-70">
              <Key className="w-6 h-6 text-white" />
            </div>
            <div className="absolute top-28 -left-3 w-8 h-8 rounded-full bg-white/80 shadow-md flex items-center justify-center text-blue-600">
              <Check className="w-4 h-4 stroke-[3]" />
            </div>
            <div className="absolute top-36 -right-2 w-7 h-7 rounded-full bg-white/80 shadow-md flex items-center justify-center text-blue-600">
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            </div>
            <div className="absolute bottom-16 -left-2 text-slate-300 opacity-60">
              <Lock className="w-6 h-6 text-white" />
            </div>
            <div className="absolute bottom-14 -right-2 text-slate-300 opacity-60 animate-spin [animation-duration:24s]">
              <Settings className="w-8 h-8 text-white" />
            </div>
            <div className="absolute top-14 left-1/3 text-white/40">
              <Cloud className="w-8 h-8" />
            </div>

            <div className="relative z-10 w-full h-full flex items-center justify-center p-4">
              <LoginLottiePlayer className="w-full h-full max-w-[340px] max-h-[340px] drop-shadow-xl" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
