'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Search,
  ArrowRight,
  MessageSquare,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  User,
  Settings,
  Sliders,
  LogOut,
  Trophy,
  Menu,
} from 'lucide-react';
import { LiveStatusBadge } from './LiveStatusBadge';

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

  // If user has explicitly logged out, force currentUser to null immediately
  const currentUser = hasLoggedOut
    ? null
    : (propUser !== undefined ? propUser : internalUser);
  const authLoading = hasLoggedOut
    ? false
    : (propLoading !== undefined ? propLoading : internalLoading);

  // If propUser changes to an active authenticated user, reset logged out flag
  useEffect(() => {
    if (propUser) {
      setHasLoggedOut(false);
    }
  }, [propUser]);

  // Fetch current authenticated user dynamically if not passed from parent
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
    // Immediately clear state in the UI so profile pill turns into Get Started button
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
      // Re-assert cleared state
      setHasLoggedOut(true);
      setInternalUser(null);
      setProfileDropdownOpen(false);
      if (onLogout) {
        onLogout();
      }

      // If in a role-restricted workspace route, cleanly navigate to home
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

  const formatRole = (role?: string) => {
    if (!role) return 'PARTICIPANT';
    if (role.toUpperCase() === 'ADMIN') return 'SUPER ADMIN';
    return role.toUpperCase();
  };

  const [searchResults, setSearchResults] = useState<{
    hackathons: Array<{ id: string; title: string; subtitle?: string; href: string; status?: string }>;
    tracks: Array<{ id: string; title: string; subtitle?: string; href: string }>;
    projects: Array<{ id: string; title: string; subtitle?: string; href: string }>;
  } | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  // Debounced search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      setSearchLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await fetch(`/api/v1/search?q=${encodeURIComponent(searchQuery.trim())}`);
        const data = await res.json();
        if (data.success && data.data) {
          setSearchResults(data.data);
        } else {
          setSearchResults({ hackathons: [], tracks: [], projects: [] });
        }
      } catch (err) {
        console.error('Search query failed:', err);
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Generate dynamic breadcrumb
  const pathSegments = pathname.split('/').filter(Boolean);
  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    ...pathSegments.map((segment, index) => {
      const href = '/' + pathSegments.slice(0, index + 1).join('/');
      const label =
        segment.charAt(0).toUpperCase() +
        segment.slice(1).replace(/-/g, ' ');
      return { label, href };
    }),
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchFocused(false);
      router.push(`/hackathons?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const hasResults =
    searchResults &&
    (searchResults.hackathons.length > 0 ||
      searchResults.tracks.length > 0 ||
      searchResults.projects.length > 0);

  return (
    <header className="h-[72px] bg-white border-b border-[#E2E8F0] px-4 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-30 select-none">
      {/* LEFT: Mobile toggle & Breadcrumb */}
      <div className="flex items-center space-x-3">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-lg text-[#64748B] hover:text-[#111827] hover:bg-[#F1F5F9] transition-colors"
            aria-label="Toggle Navigation"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <nav aria-label="Breadcrumb" className="hidden sm:flex items-center space-x-1.5 text-[14px] text-[#64748B]">
          {breadcrumbItems.slice(0, 3).map((item, idx) => (
            <React.Fragment key={item.href}>
              {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-[#94A3B8]" />}
              {idx === breadcrumbItems.length - 1 ? (
                <span className="font-semibold text-[#111827] max-w-[160px] truncate">
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="hover:text-[#2563EB] transition-colors max-w-[120px] truncate font-normal"
                >
                  {item.label}
                </Link>
              )}
            </React.Fragment>
          ))}
        </nav>
      </div>

      {/* CENTER: Prominent Centered Global Search (400–420px wide, 44px high, rounded 22px) */}
      <div className="flex-1 max-w-[420px] mx-4 relative">
        <form onSubmit={handleSearchSubmit} className="relative w-full">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-[#94A3B8] absolute left-4 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              placeholder="Search Hackathons, Tracks, Projects..."
              className="w-full h-[44px] pl-11 pr-4 bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] focus:border-[#2563EB] rounded-[22px] text-[14px] text-[#111827] placeholder-[#94A3B8] transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/15 shadow-[0_1px_2px_rgba(15,23,42,0.03)]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSearchResults(null);
                }}
                className="absolute right-3.5 text-[#94A3B8] hover:text-[#475569] text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </form>

        {/* Live Search Results Dropdown */}
        {searchFocused && searchQuery.trim().length > 0 && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setSearchFocused(false)}
            />
            <div className="absolute top-full mt-2 left-0 right-0 bg-white rounded-2xl border border-[#E2E8F0] shadow-elevated p-3 z-50 text-xs animate-in fade-in duration-100 max-h-96 overflow-y-auto">
              {searchLoading ? (
                <div className="py-6 text-center text-[#64748B]">
                  <span className="inline-block w-4 h-4 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin mb-1.5" />
                  <p className="text-[11px] font-medium">Searching competitions & projects...</p>
                </div>
              ) : !hasResults ? (
                <div className="py-6 text-center text-[#64748B]">
                  <p className="font-semibold text-xs text-[#111827]">No results found</p>
                  <p className="text-[11px] text-[#94A3B8] mt-0.5">Try searching for another hackathon, track, or project.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Hackathons Group */}
                  {searchResults.hackathons.length > 0 && (
                    <div>
                      <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider px-2 block mb-1">
                        Hackathons
                      </span>
                      <div className="space-y-0.5">
                        {searchResults.hackathons.map((h) => (
                          <Link
                            key={h.id}
                            href={h.href}
                            onClick={() => setSearchFocused(false)}
                            className="flex items-center justify-between p-2 rounded-xl hover:bg-[#F8FAFC] group transition"
                          >
                            <div className="truncate">
                              <p className="font-bold text-xs text-[#111827] group-hover:text-[#2563EB] truncate">
                                {h.title}
                              </p>
                              {h.subtitle && (
                                <p className="text-[10px] text-[#64748B] truncate">{h.subtitle}</p>
                              )}
                            </div>
                            {h.status && (
                              <span className="ml-2 shrink-0 px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-50 text-[#2563EB] border border-blue-100">
                                {h.status}
                              </span>
                            )}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tracks Group */}
                  {searchResults.tracks.length > 0 && (
                    <div>
                      <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider px-2 block mb-1">
                        Tracks
                      </span>
                      <div className="space-y-0.5">
                        {searchResults.tracks.map((t) => (
                          <Link
                            key={t.id}
                            href={t.href}
                            onClick={() => setSearchFocused(false)}
                            className="flex items-center justify-between p-2 rounded-xl hover:bg-[#F8FAFC] group transition"
                          >
                            <div className="truncate">
                              <p className="font-bold text-xs text-[#111827] group-hover:text-[#2563EB] truncate">
                                {t.title}
                              </p>
                              {t.subtitle && (
                                <p className="text-[10px] text-[#64748B] truncate">{t.subtitle}</p>
                              )}
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Projects Group */}
                  {searchResults.projects.length > 0 && (
                    <div>
                      <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider px-2 block mb-1">
                        Projects
                      </span>
                      <div className="space-y-0.5">
                        {searchResults.projects.map((p) => (
                          <Link
                            key={p.id}
                            href={p.href}
                            onClick={() => setSearchFocused(false)}
                            className="flex items-center justify-between p-2 rounded-xl hover:bg-[#F8FAFC] group transition"
                          >
                            <div className="truncate">
                              <p className="font-bold text-xs text-[#111827] group-hover:text-[#2563EB] truncate">
                                {p.title}
                              </p>
                              {p.subtitle && (
                                <p className="text-[10px] text-[#64748B] truncate">{p.subtitle}</p>
                              )}
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* View All Results Link */}
                  <div className="pt-2 border-t border-[#F1F5F9]">
                    <Link
                      href={`/hackathons?q=${encodeURIComponent(searchQuery.trim())}`}
                      onClick={() => setSearchFocused(false)}
                      className="block text-center py-1.5 text-xs font-bold text-[#2563EB] hover:underline"
                    >
                      View all results &rarr;
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>


      {/* RIGHT: Get Started (Guest) OR Dynamic Profile Dropdown (Logged In) */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Real-Time WebSocket Status Badge — only for authenticated users */}
        {!authLoading && currentUser && <LiveStatusBadge />}

        {/* Backdrop for profile dropdown */}
        {profileDropdownOpen && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setProfileDropdownOpen(false)}
          />
        )}

        {!authLoading && !currentUser && (
          /* Guest: Show Get Started Button */
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold rounded-xl shadow-xs transition-all hover:shadow"
          >
            <span>Get Started</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}

        {!authLoading && currentUser && (
          /* Logged In: Show Dynamic Profile Role Pill & Dropdown matching reference */
          <div className="relative z-50">
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center space-x-2.5 px-3 py-1.5 rounded-xl border border-[#1E293B] hover:bg-[#F8FAFC] transition-colors bg-white select-none text-left shadow-xs"
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
                <span className="font-extrabold text-[10px] text-[#800020] uppercase tracking-wider leading-tight mt-0.5">
                  {formatRole(currentUser.role)}
                </span>
              </div>
              {profileDropdownOpen ? (
                <ChevronUp className="w-4 h-4 text-[#475569] ml-1.5 flex-shrink-0" />
              ) : (
                <ChevronDown className="w-4 h-4 text-[#475569] ml-1.5 flex-shrink-0" />
              )}
            </button>

            {/* Profile Dropdown Menu */}
            {profileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl border border-[#E2E8F0] shadow-xl p-4 z-50 animate-in fade-in duration-100 select-none text-xs">
                {/* Header: Name and Email */}
                <div className="pb-3 border-b border-[#F1F5F9]">
                  <h4 className="font-bold text-sm text-[#0F172A] truncate">
                    {currentUser.name}
                  </h4>
                  <p className="text-xs text-[#64748B] truncate mt-0.5">
                    {currentUser.email}
                  </p>
                </div>

                {/* Nav links: Profile & Settings */}
                <div className="py-2 space-y-1">
                  <Link
                    href={currentUser.role === 'JUDGE' ? '/judge/profile' : '/participant/settings'}
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center space-x-3 px-2 py-2 rounded-lg text-[#0F172A] hover:bg-[#F8FAFC] hover:text-[#2563EB] font-semibold text-xs transition-colors"
                  >
                    <User className="w-4 h-4 text-[#64748B]" />
                    <span>Profile</span>
                  </Link>

                  <Link
                    href="/participant/settings"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center space-x-3 px-2 py-2 rounded-lg text-[#0F172A] hover:bg-[#F8FAFC] hover:text-[#2563EB] font-semibold text-xs transition-colors"
                  >
                    <Settings className="w-4 h-4 text-[#64748B]" />
                    <span>Settings</span>
                  </Link>
                </div>

                {/* Logout Button */}
                <div className="pt-2 border-t border-[#F1F5F9]">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-3 px-2 py-2 rounded-lg text-[#E11D48] hover:bg-[#FFF1F2] font-bold text-xs transition-colors text-left"
                  >
                    <LogOut className="w-4 h-4 text-[#E11D48]" />
                    <span>Log out</span>
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
