'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Search,
  ChevronRight,
  ChevronDown,
  User,
  Settings,
  LogOut,
  Trophy,
  Menu,
  LayoutDashboard,
  ArrowRight,
} from 'lucide-react';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string | null;
}

export interface TopNavbarProps {
  onToggleSidebar?: () => void;
  userRole?: string;
  userName?: string;
  currentUser?: AuthUser | null;
  authLoading?: boolean;
  onLogout?: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  onToggleSidebar,
  userRole = 'PARTICIPANT',
  userName,
  currentUser: propUser,
  authLoading: propLoading,
  onLogout,
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [internalUser, setInternalUser] = useState<AuthUser | null>(null);
  const [internalLoading, setInternalLoading] = useState(true);
  const [hasLoggedOut, setHasLoggedOut] = useState(false);

  const formatRole = (role?: string) => (role ? role.toUpperCase() : 'PARTICIPANT');

  const currentUser = hasLoggedOut
    ? null
    : (propUser !== undefined ? propUser : internalUser);
  const authLoading = hasLoggedOut
    ? false
    : (propLoading !== undefined ? propLoading : internalLoading);

  useEffect(() => {
    if (propUser) {
      setHasLoggedOut(false);
    }
  }, [propUser]);

  useEffect(() => {
    if (propUser !== undefined) {
      return;
    }
    let isMounted = true;
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/v1/auth/me');
        if (res.ok) {
          const json = await res.json();
          if (isMounted && json.success && json.data?.user) {
            setInternalUser(json.data.user);
            setHasLoggedOut(false);
            return;
          }
        }
        if (isMounted) setInternalUser(null);
      } catch {
        if (isMounted) setInternalUser(null);
      } finally {
        if (isMounted) setInternalLoading(false);
      }
    };
    checkAuth();
    return () => {
      isMounted = false;
    };
  }, [pathname, propUser]);

  const handleLogout = async () => {
    // Optimistically clear UI state immediately
    setHasLoggedOut(true);
    setInternalUser(null);
    setProfileDropdownOpen(false);

    // Call the centralized logout (clears localStorage + calls /api/v1/auth/logout)
    if (onLogout) {
      await onLogout();
    } else {
      try {
        await fetch('/api/v1/auth/logout', { method: 'POST' });
      } catch {}
    }

    // Navigate to home page using the client-side router (no hard reload)
    router.replace('/');
  };

  const pathSegments = pathname.split('/').filter(Boolean);
  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    ...pathSegments.map((segment, index) => {
      const href = '/' + pathSegments.slice(0, index + 1).join('/');
      let label =
        segment.charAt(0).toUpperCase() +
        segment.slice(1).replace(/-/g, ' ');
      if (segment.toLowerCase() === 'assignments') {
        label = 'My Assignments';
      }
      return { label, href };
    }),
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/hackathons?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="h-[70px] bg-[#FAF8F5] border-b border-[#ECE6DD] px-4 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-30 select-none">
      {/* LEFT: Mobile toggle & Breadcrumb */}
      <div className="flex items-center space-x-3">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Toggle Navigation"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <nav aria-label="Breadcrumb" className="hidden sm:flex items-center space-x-1.5 text-[14px]">
          <span className="font-semibold text-[#18181B] text-[15px]">
            {pathname === '/' ? 'Home' : (breadcrumbItems[breadcrumbItems.length - 1]?.label || 'Home')}
          </span>
        </nav>
      </div>

      {/* CENTER: Prominent Centered Global Search (rounded-full pill matching screenshot) */}
      <div className="flex-1 max-w-[480px] mx-4 relative hidden md:block">
        <form onSubmit={handleSearchSubmit} className="relative w-full">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-[#9CA3AF] absolute left-4 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Hackathons, Tracks, Projects..."
              className="w-full h-[40px] pl-11 pr-16 bg-white border border-[#E5E0D8] hover:border-[#D1D5DB] focus:border-[#FA541C] rounded-full text-[13.5px] text-[#111827] placeholder-[#9CA3AF] transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#FA541C]/15 shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
            />
            <div className="absolute right-3 pointer-events-none flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px] font-mono text-slate-500">
              <span>Ctrl</span>
              <span>K</span>
            </div>
          </div>
        </form>
      </div>

      {/* RIGHT: User Profile Pill / Auth CTA */}
      <div className="flex items-center space-x-3.5">
        {/* Backdrop for profile dropdown */}
        {profileDropdownOpen && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setProfileDropdownOpen(false)}
          />
        )}

        {!authLoading && !currentUser && (
          /* Guest: Show Get Started Button with Rich Glow & Interactive Animations */
          <Link
            href="/login"
            prefetch={true}
            className="group relative inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#FA541C] via-[#FF6636] to-[#E03A00] hover:from-[#FF5722] hover:via-[#FA541C] hover:to-[#D4380D] text-white text-xs sm:text-sm font-bold rounded-xl shadow-[0_4px_14px_rgba(250,84,28,0.30)] hover:shadow-[0_6px_22px_rgba(250,84,28,0.48)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-200 whitespace-nowrap cursor-pointer overflow-hidden flex-shrink-0"
          >
            {/* Ambient Shimmer / Sheen Sweep */}
            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out pointer-events-none" />
            <span className="relative z-10 font-bold tracking-wide">Get Started</span>
            <ArrowRight className="relative z-10 w-4 h-4 stroke-[2.5] group-hover:translate-x-1.5 transition-transform duration-200 flex-shrink-0" />
          </Link>
        )}

        {!authLoading && currentUser && (
          /* Logged In: Show Dynamic Profile Role Pill & Dropdown matching reference */
          <div className="relative z-50">
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center space-x-2.5 px-3 py-1.5 rounded-xl border border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors bg-white select-none text-left shadow-xs"
            >
              {currentUser.avatarUrl ? (
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.name}
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-rose-200 flex-shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] font-bold text-xs flex items-center justify-center flex-shrink-0">
                  {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
              <div className="flex flex-col text-left">
                <span className="font-bold text-[13px] text-[#0F172A] leading-tight max-w-[130px] truncate">
                  {currentUser.name}
                </span>
                <span className="font-extrabold text-[10px] text-[#FA541C] uppercase tracking-wider leading-tight mt-0.5">
                  {formatRole(currentUser.role)}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block ml-1" />
            </button>

            {/* Profile Dropdown Menu */}
            {profileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl border border-[#E2E8F0] shadow-xl p-4 z-50 modal-content-enter will-change-transform select-none text-xs">
                {/* Header: Name and Email */}
                <div className="pb-3 border-b border-[#F1F5F9]">
                  <h4 className="font-bold text-sm text-[#0F172A] truncate">
                    {currentUser.name}
                  </h4>
                  <p className="text-xs text-[#64748B] truncate mt-0.5">
                    {currentUser.email}
                  </p>
                </div>

                {/* Nav links: Role Workspace, Profile & Settings */}
                <div className="py-2 space-y-1">
                  {/* Role-Specific Workspace Link */}
                  <Link
                    href={
                      currentUser.role?.toUpperCase() === 'ADMIN'
                        ? '/admin/dashboard'
                        : currentUser.role?.toUpperCase() === 'ORGANIZER'
                        ? '/organizer/dashboard'
                        : currentUser.role?.toUpperCase() === 'JUDGE'
                        ? '/judge/dashboard'
                        : '/participant/dashboard'
                    }
                    prefetch={true}
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center space-x-3 px-2 py-2 rounded-lg text-[#FA541C] hover:bg-[#FFF5ED] font-bold text-xs transition-colors"
                  >
                    <LayoutDashboard className="w-4 h-4 text-[#FA541C]" />
                    <span>
                      {currentUser.role?.toUpperCase() === 'ADMIN'
                        ? 'Admin Workspace'
                        : currentUser.role?.toUpperCase() === 'ORGANIZER'
                        ? 'Organizer Workspace'
                        : currentUser.role?.toUpperCase() === 'JUDGE'
                        ? 'Judge Workspace'
                        : 'Participant Workspace'}
                    </span>
                  </Link>

                  <Link
                    href={
                      currentUser.role?.toUpperCase() === 'ADMIN'
                        ? '/admin/profile'
                        : currentUser.role?.toUpperCase() === 'ORGANIZER'
                        ? '/organizer/profile'
                        : currentUser.role?.toUpperCase() === 'JUDGE'
                        ? '/judge/profile'
                        : '/participant/profile'
                    }
                    prefetch={true}
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center space-x-3 px-2 py-2 rounded-lg text-[#0F172A] hover:bg-[#FFF5ED] hover:text-[#FA541C] font-semibold text-xs transition-colors"
                  >
                    <User className="w-4 h-4 text-[#64748B]" />
                    <span>My Profile</span>
                  </Link>

                  <Link
                    href={
                      currentUser.role?.toUpperCase() === 'ADMIN'
                        ? '/admin/profile'
                        : currentUser.role?.toUpperCase() === 'ORGANIZER'
                        ? '/organizer/profile'
                        : currentUser.role?.toUpperCase() === 'JUDGE'
                        ? '/judge/profile'
                        : '/participant/settings'
                    }
                    prefetch={true}
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center space-x-3 px-2 py-2 rounded-lg text-[#0F172A] hover:bg-[#FFF5ED] hover:text-[#FA541C] font-semibold text-xs transition-colors"
                  >
                    <Settings className="w-4 h-4 text-[#64748B]" />
                    <span>Profile Settings</span>
                  </Link>
                </div>

                {/* Logout Button */}
                <div className="pt-2 border-t border-[#F1F5F9]">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-3 px-2 py-2 rounded-lg text-[#E11D48] hover:bg-[#FFF1F2] font-bold text-xs transition-colors text-left"
                  >
                    <LogOut className="w-4 h-4 text-[#E11D48]" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
