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
  Bell,
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
    setHasLoggedOut(true);
    setInternalUser(null);
    setProfileDropdownOpen(false);
    if (onLogout) {
      onLogout();
    }

    try {
      await fetch('/api/v1/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setHasLoggedOut(true);
      setInternalUser(null);
      setProfileDropdownOpen(false);
      if (onLogout) {
        onLogout();
      }

      if (
        pathname.startsWith('/admin') ||
        pathname.startsWith('/organizer') ||
        pathname.startsWith('/judge') ||
        pathname.startsWith('/participant')
      ) {
        window.location.href = '/';
      } else {
        router.refresh();
      }
    }
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
    <header className="h-[72px] bg-[#0E141D] border-b border-[#1E293B] px-4 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-30 select-none">
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

        <nav aria-label="Breadcrumb" className="hidden sm:flex items-center space-x-2 text-xs text-slate-400 font-medium">
          {breadcrumbItems.slice(0, 3).map((item, idx) => (
            <React.Fragment key={item.href}>
              {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-600" />}
              {idx === breadcrumbItems.length - 1 ? (
                <span className="font-bold text-white max-w-[160px] truncate">
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="hover:text-white transition-colors max-w-[120px] truncate font-normal"
                >
                  {item.label}
                </Link>
              )}
            </React.Fragment>
          ))}
        </nav>
      </div>

      {/* CENTER: Prominent Dark Search Bar */}
      <div className="flex-1 max-w-[480px] mx-4 relative hidden md:block">
        <form onSubmit={handleSearchSubmit} className="relative w-full">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Hackathons, Tracks, Projects..."
              className="w-full h-10 pl-10 pr-16 bg-[#151D28] border border-[#273549] hover:border-slate-600 focus:border-[#FF5500] rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#FF5500] transition-all"
            />
            <div className="absolute right-3 pointer-events-none flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-[#1E293B] border border-slate-700 text-[10px] font-mono text-slate-400">
              <span>Ctrl</span>
              <span>K</span>
            </div>
          </div>
        </form>
      </div>

      {/* RIGHT: Live Sync + Notifications + User Profile Pill */}
      <div className="flex items-center space-x-3.5">
        {/* Live Sync Status */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#151D28] border border-[#273549] text-xs font-semibold text-slate-200">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Live Sync</span>
        </div>

        {/* Notification Bell */}
        <button
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors relative"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#FF5500] rounded-full ring-2 ring-[#0E141D]" />
        </button>

        {/* User Profile Pill */}
        <div className="relative">
          <button
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="flex items-center gap-2.5 p-1.5 pr-3 rounded-xl bg-[#151D28] hover:bg-[#1E293B] border border-[#273549] transition-all cursor-pointer"
          >
            <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 text-white font-bold text-xs flex items-center justify-center">
              {currentUser?.name
                ? currentUser.name.charAt(0).toUpperCase()
                : userRole === 'JUDGE'
                ? 'D'
                : 'A'}
            </div>
            <div className="text-left hidden lg:block">
              <div className="text-xs font-bold text-white leading-tight">
                {currentUser?.name ||
                  userName ||
                  (userRole === 'JUDGE'
                    ? 'Dr. Sarah Chen'
                    : userRole === 'ADMIN'
                    ? 'System Administrator'
                    : 'Apex Event Lead')}
              </div>
              <div className="text-[10px] font-extrabold text-[#FF5500] uppercase tracking-wider">
                {currentUser?.role || userRole || 'ORGANIZER'}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {/* Profile Dropdown Menu */}
          {profileDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-[#151D28] border border-[#273549] rounded-2xl shadow-2xl py-2 z-50 text-xs text-slate-300">
              <div className="px-4 py-2 border-b border-[#1E293B]">
                <div className="font-bold text-white truncate">
                  {currentUser?.name ||
                    userName ||
                    (userRole === 'JUDGE'
                      ? 'Dr. Sarah Chen'
                      : userRole === 'ADMIN'
                      ? 'System Administrator'
                      : 'Apex Event Lead')}
                </div>
                <div className="text-[11px] text-slate-400 truncate">
                  {currentUser?.email ||
                    (userRole === 'JUDGE'
                      ? 'judge.alpha@hackathon.dev'
                      : userRole === 'ADMIN'
                      ? 'admin@hackathon.dev'
                      : 'organizer@hackathon.dev')}
                </div>
              </div>

              <div className="py-1">
                <Link
                  href={
                    userRole === 'ADMIN'
                      ? '/admin/dashboard'
                      : userRole === 'ORGANIZER'
                      ? '/organizer/dashboard'
                      : userRole === 'JUDGE'
                      ? '/judge/dashboard'
                      : '/participant/dashboard'
                  }
                  onClick={() => setProfileDropdownOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 hover:bg-slate-800/80 hover:text-white transition-colors"
                >
                  <LayoutDashboard className="w-4 h-4 text-[#FF5500]" />
                  <span>Workspace Dashboard</span>
                </Link>
                <Link
                  href={userRole === 'JUDGE' ? '/judge/profile' : '/participant/settings'}
                  onClick={() => setProfileDropdownOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 hover:bg-slate-800/80 hover:text-white transition-colors"
                >
                  <User className="w-4 h-4 text-slate-400" />
                  <span>Profile Settings</span>
                </Link>
              </div>

              <div className="border-t border-[#1E293B] pt-1">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2 text-red-400 hover:bg-red-500/10 transition-colors text-left cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-red-400" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
