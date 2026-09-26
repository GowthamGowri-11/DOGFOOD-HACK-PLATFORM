'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Search,
  Bell,
  MessageSquare,
  ChevronRight,
  User,
  Sliders,
  LogOut,
  Trophy,
  Menu,
} from 'lucide-react';

export interface TopNavbarProps {
  onToggleSidebar?: () => void;
  userRole?: string;
  userName?: string;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  onToggleSidebar,
  userRole = 'PARTICIPANT',
  userName = 'Alice Hacker',
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

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
      router.push(`/hackathons?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

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

        <nav aria-label="Breadcrumb" className="hidden sm:flex items-center space-x-1.5 text-xs text-[#64748B]">
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
                  className="hover:text-[#2563EB] transition-colors max-w-[120px] truncate"
                >
                  {item.label}
                </Link>
              )}
            </React.Fragment>
          ))}
        </nav>
      </div>

      {/* CENTER: Prominent Centered Global Search (400–420px wide, 44px high, rounded 22px) */}
      <div className="flex-1 max-w-[420px] mx-4">
        <form onSubmit={handleSearchSubmit} className="relative w-full">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-[#94A3B8] absolute left-4 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Hackathons, Tracks, Projects..."
              className="w-full h-[44px] pl-11 pr-4 bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] focus:border-[#2563EB] rounded-[22px] text-xs text-[#111827] placeholder-[#94A3B8] transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/15 shadow-card"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 text-[#94A3B8] hover:text-[#475569] text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </form>
      </div>

      {/* RIGHT: Notifications, Community & Profile Avatar */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Notifications Icon Button */}
        <div className="relative">
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="p-2 rounded-full text-[#64748B] hover:text-[#111827] hover:bg-[#F8FAFC] transition-colors relative"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            <span className="w-2 h-2 rounded-full bg-[#2563EB] absolute top-2 right-2 ring-2 ring-white"></span>
          </button>

          {/* Notifications Dropdown */}
          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl border border-[#E2E8F0] shadow-elevated p-3 z-50 text-xs animate-in fade-in duration-100">
              <div className="flex items-center justify-between pb-2 border-b border-[#F1F5F9]">
                <span className="font-bold text-[#111827]">Notifications</span>
                <span className="text-[11px] text-[#2563EB] font-semibold cursor-pointer">Mark all as read</span>
              </div>
              <div className="divide-y divide-[#F1F5F9] max-h-64 overflow-y-auto">
                <div className="py-2.5 space-y-1">
                  <p className="font-medium text-[#111827]">Judging Phase Commenced</p>
                  <p className="text-[11px] text-[#64748B]">
                    Apex AI Global Hackathon 2026 has initiated jury evaluations.
                  </p>
                  <span className="text-[10px] text-[#94A3B8]">10 mins ago</span>
                </div>
                <div className="py-2.5 space-y-1">
                  <p className="font-medium text-[#111827]">Team Invite Accepted</p>
                  <p className="text-[11px] text-[#64748B]">Bob Builder joined your project SentinelShield.</p>
                  <span className="text-[10px] text-[#94A3B8]">1 hour ago</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="flex items-center space-x-2 p-1.5 rounded-full hover:bg-[#F8FAFC] border border-transparent hover:border-[#E2E8F0] transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] font-bold text-xs flex items-center justify-center">
              {userName.charAt(0)}
            </div>
            <span className="hidden md:inline text-xs font-semibold text-[#111827] max-w-[100px] truncate">
              {userName}
            </span>
          </button>

          {/* Profile Dropdown Menu */}
          {profileDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl border border-[#E2E8F0] shadow-elevated py-2 z-50 text-xs animate-in fade-in duration-100">
              <div className="px-4 py-2 border-b border-[#F1F5F9]">
                <p className="font-bold text-[#111827] truncate">{userName}</p>
                <p className="text-[11px] text-[#64748B] uppercase tracking-wider font-semibold">
                  Role: {userRole}
                </p>
              </div>

              <div className="py-1">
                <Link
                  href="/participant/dashboard"
                  onClick={() => setProfileDropdownOpen(false)}
                  className="flex items-center px-4 py-2 text-[#334155] hover:bg-[#F8FAFC] hover:text-[#2563EB]"
                >
                  <User className="w-4 h-4 mr-2.5 text-[#64748B]" />
                  <span>My Workspace</span>
                </Link>
                <Link
                  href="/leaderboard"
                  onClick={() => setProfileDropdownOpen(false)}
                  className="flex items-center px-4 py-2 text-[#334155] hover:bg-[#F8FAFC] hover:text-[#2563EB]"
                >
                  <Trophy className="w-4 h-4 mr-2.5 text-[#64748B]" />
                  <span>Leaderboard</span>
                </Link>
                <Link
                  href="/participant/settings"
                  onClick={() => setProfileDropdownOpen(false)}
                  className="flex items-center px-4 py-2 text-[#334155] hover:bg-[#F8FAFC] hover:text-[#2563EB]"
                >
                  <Sliders className="w-4 h-4 mr-2.5 text-[#64748B]" />
                  <span>Account Settings</span>
                </Link>
              </div>

              <div className="border-t border-[#F1F5F9] pt-1">
                <Link
                  href="/login"
                  onClick={() => setProfileDropdownOpen(false)}
                  className="flex items-center px-4 py-2 text-[#DC2626] hover:bg-[#FEF2F2]"
                >
                  <LogOut className="w-4 h-4 mr-2.5" />
                  <span>Sign Out</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
