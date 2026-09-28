'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Trophy,
  Compass,
  LayoutDashboard,
  Users,
  FolderKanban,
  FileCheck,
  Award,
  Layers,
  BarChart3,
  Activity,
  Sliders,
  Sparkles,
  QrCode,
  ShieldCheck,
  History,
  FileText,
  UserCheck2,
  ChevronLeft,
  ChevronRight,
  Scale,
  Settings,
  Server,
  PieChart,
} from 'lucide-react';

export type UserRole = 'PARTICIPANT' | 'ORGANIZER' | 'JUDGE' | 'ADMIN';

export interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
}

export interface SidebarProps {
  currentRole: UserRole;
  onRoleChange?: (role: UserRole) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  userName?: string;
  userEmail?: string;
  userAvatarUrl?: string | null;
}

const PARTICIPANT_ITEMS: NavItem[] = [
  { label: 'Home', href: '/', icon: Compass },
  { label: 'Explore Hackathons', href: '/hackathons', icon: Trophy },
  { label: 'My Hackathons', href: '/participant/dashboard', icon: FolderKanban },
  { label: 'My Teams', href: '/participant/teams', icon: Users },
  { label: 'My Projects', href: '/participant/projects', icon: FileText },
  { label: 'My Submissions', href: '/participant/submissions', icon: FileCheck },
  { label: 'Leaderboard', href: '/leaderboard', icon: BarChart3 },
  { label: 'Project Gallery', href: '/projects', icon: Layers },
  { label: 'Certificates', href: '/participant/certificates', icon: Award },
  { label: 'My Activity', href: '/participant/activity', icon: Activity },
];

const ORGANIZER_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/organizer/dashboard', icon: LayoutDashboard },
  { label: 'Hackathons', href: '/organizer/hackathons', icon: Trophy },
  { label: 'Registrations', href: '/organizer/registrations', icon: Users },
  { label: 'Teams', href: '/organizer/teams', icon: Users },
  { label: 'Submissions', href: '/organizer/submissions', icon: FileCheck },
  { label: 'Judges', href: '/organizer/judges', icon: UserCheck2 },
  { label: 'Assignments', href: '/organizer/assignments', icon: Scale },
  { label: 'Rubrics', href: '/organizer/rubrics', icon: Sliders },
  { label: 'Judging', href: '/organizer/judging', icon: Scale },
  { label: 'AI Jury', href: '/organizer/ai-jury', icon: Sparkles, badge: 'AI' },
  { label: 'Results', href: '/organizer/results', icon: Award },
  { label: 'Attendance', href: '/organizer/attendance', icon: QrCode },
  { label: 'Certificates', href: '/organizer/certificates', icon: ShieldCheck },
  { label: 'Analytics', href: '/organizer/analytics', icon: PieChart },
  { label: 'Community', href: '/organizer/community', icon: Layers },
  { label: 'Audit Logs', href: '/organizer/audit', icon: History },
];

const JUDGE_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/judge/dashboard', icon: LayoutDashboard },
  { label: 'My Assignments', href: '/judge/assignments', icon: Scale },
  { label: 'Pending Evaluations', href: '/judge/evaluations', icon: FileCheck },
  { label: 'Completed Evaluations', href: '/judge/completed', icon: ShieldCheck },
  { label: 'Leaderboard', href: '/leaderboard', icon: Award },
  { label: 'Profile', href: '/judge/profile', icon: UserCheck2 },
];

const ADMIN_ITEMS: NavItem[] = [
  { label: 'Overview', href: '/admin/dashboard', icon: Activity },
  { label: 'Users', href: '/admin/users', icon: Users },
  { label: 'Hackathons', href: '/admin/hackathons', icon: Trophy },
  { label: 'Teams', href: '/admin/teams', icon: Users },
  { label: 'Submissions', href: '/admin/submissions', icon: FileCheck },
  { label: 'Judges', href: '/admin/judges', icon: UserCheck2 },
  { label: 'Results & Leaderboard', href: '/admin/results', icon: Award },
  { label: 'Certificates', href: '/admin/certificates', icon: ShieldCheck },
  { label: 'Audit Logs', href: '/admin/audit-logs', icon: History },
  { label: 'System Health', href: '/admin/system', icon: Server },
];

export const Sidebar: React.FC<SidebarProps> = ({
  currentRole,
  onRoleChange,
  collapsed = false,
  onToggleCollapse,
  isMobileOpen = false,
  onCloseMobile,
  userName,
  userEmail,
  userAvatarUrl,
}) => {
  const pathname = usePathname();

  const getNavItems = () => {
    switch (currentRole) {
      case 'ORGANIZER':
        return ORGANIZER_ITEMS;
      case 'JUDGE':
        return JUDGE_ITEMS;
      case 'ADMIN':
        return ADMIN_ITEMS;
      default:
        return PARTICIPANT_ITEMS;
    }
  };

  const navItems = getNavItems();

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-[#0F172A]/70 backdrop-blur-xs z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Deep Dark Luxury Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 bg-[#0E141D] border-r border-[#1E293B] transition-all duration-200 flex flex-col justify-between select-none ${
          collapsed ? 'w-[72px]' : 'w-[260px]'
        } ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* TOP: Brand Wordmark & Logo */}
        <div className="h-[72px] px-4 border-b border-[#1E293B] flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2.5 overflow-hidden">
            <div className="w-[34px] h-[34px] flex items-center justify-center flex-shrink-0">
              <img src="/atlyx-logo.png" alt="ATLYX Logo" className="w-full h-full object-contain drop-shadow-md" />
            </div>
            {!collapsed && (
              <div className="truncate">
                <span className="font-extrabold text-[17px] tracking-tight text-white block leading-tight">
                  ATLYX
                </span>
                <span className="block text-[8.5px] font-bold text-slate-400 uppercase tracking-widest -mt-0.5">
                  COMPETITION ARENA
                </span>
              </div>
            )}
          </Link>

          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
              title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>

        {/* MIDDLE: Navigation Links */}
        <div className="flex-1 overflow-y-auto px-3.5 py-3.5 custom-scrollbar">
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href !== '/' && item.href !== '/hackathons' && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={onCloseMobile}
                  className={`flex items-center group h-[40px] px-3.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-[#FF5500] to-[#EA580C] hover:from-[#EA580C] hover:to-[#C2410C] text-white shadow-md shadow-orange-600/25 font-bold'
                      : 'text-[#94A3B8] hover:text-white hover:bg-slate-800/40'
                  }`}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon
                    className={`w-[18px] h-[18px] flex-shrink-0 transition-colors ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'
                    } ${collapsed ? 'mx-auto' : 'mr-3'}`}
                  />

                  {!collapsed && (
                    <span className="truncate flex-1">{item.label}</span>
                  )}

                  {!collapsed && item.badge && (
                    <span className="ml-auto px-1.5 py-0.5 text-[9px] font-bold rounded-md bg-[#FF5500]/20 text-[#FF5500] border border-[#FF5500]/30">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* BOTTOM: Profile Summary Card */}
        <div className="p-3 border-t border-[#1E293B] bg-[#0E141D]">
          {!collapsed ? (
            <div className="flex items-center justify-between p-2 rounded-xl bg-[#151D28] border border-[#1E293B]">
              <div className="flex items-center space-x-2.5 truncate">
                {userAvatarUrl ? (
                  <img
                    src={userAvatarUrl}
                    alt={userName || 'User'}
                    className="w-[30px] h-[30px] rounded-full object-cover ring-1 ring-slate-700 flex-shrink-0"
                  />
                ) : (
                  <div className="w-[30px] h-[30px] rounded-full bg-slate-800 text-white font-bold text-xs flex items-center justify-center border border-slate-700 flex-shrink-0">
                    {userName ? userName.charAt(0).toUpperCase() : 'A'}
                  </div>
                )}
                <div className="truncate">
                  <div className="font-bold text-xs text-white truncate">
                    {userName || 'Apex Event Lead'}
                  </div>
                  <div className="text-[10px] text-[#94A3B8] truncate">
                    {userEmail || 'organizer@hackathon.dev'}
                  </div>
                </div>
              </div>
              <Link
                href={
                  userName
                    ? currentRole === 'JUDGE'
                      ? '/judge/profile'
                      : currentRole === 'ADMIN'
                      ? '/admin/dashboard'
                      : currentRole === 'ORGANIZER'
                      ? '/organizer/dashboard'
                      : '/participant/settings'
                    : '/login'
                }
                className="p-1 text-slate-400 hover:text-white transition-colors"
                title="Settings / Workspace"
              >
                <Settings className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="w-8 h-8 mx-auto rounded-full bg-slate-800 text-white font-bold text-xs flex items-center justify-center border border-slate-700">
              {userName ? userName.charAt(0).toUpperCase() : 'A'}
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
