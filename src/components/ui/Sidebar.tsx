'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Plus,
  Scale,
  Settings,
  Server,
  KeyRound,
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
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  // Select items list based on current role
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

  const handleRoleSelect = (role: UserRole) => {
    setRoleDropdownOpen(false);
    if (onRoleChange) {
      onRoleChange(role);
    }
    // Navigate to role workspace
    switch (role) {
      case 'ORGANIZER':
        router.push('/organizer/dashboard');
        break;
      case 'JUDGE':
        router.push('/judge/dashboard');
        break;
      case 'ADMIN':
        router.push('/admin/dashboard');
        break;
      default:
        router.push('/participant/dashboard');
        break;
    }
  };

  const roleMeta: Record<UserRole, { label: string; icon: string; ctaLabel: string; ctaHref: string }> = {
    PARTICIPANT: {
      label: 'Participant',
      icon: '👤',
      ctaLabel: '+ Create / Join Team',
      ctaHref: '/participant/teams',
    },
    ORGANIZER: {
      label: 'Organizer',
      icon: '🏛️',
      ctaLabel: '+ Create Hackathon',
      ctaHref: '/organizer/hackathons',
    },
    JUDGE: {
      label: 'Judge',
      icon: '⚖️',
      ctaLabel: '⚖ Open Evaluation',
      ctaHref: '/judge/dashboard',
    },
    ADMIN: {
      label: 'Administrator',
      icon: '🛡️',
      ctaLabel: '⚙ System Actions',
      ctaHref: '/admin/dashboard',
    },
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Permanent Desktop Sidebar (width: 250–270px, background: #F4F8FC, border: #E2E8F0) */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 bg-[#F4F8FC] border-r border-[#E2E8F0] transition-all duration-200 flex flex-col justify-between select-none ${
          collapsed ? 'w-[72px]' : 'w-[260px]'
        } ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* TOP: Brand Wordmark & Collapse Icon */}
        <div className="h-[72px] px-4 border-b border-[#E2E8F0] flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2.5 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-[#2563EB] flex items-center justify-center text-white font-black shadow-sm flex-shrink-0">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            {!collapsed && (
              <div className="truncate">
                <span className="font-extrabold text-base tracking-tight text-[#111827]">
                  Apex<span className="text-[#2563EB]">Hack</span>
                </span>
                <span className="block text-[10px] font-semibold text-[#64748B] uppercase tracking-wider -mt-1">
                  Enterprise Arena
                </span>
              </div>
            )}
          </Link>

          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="hidden lg:flex p-1.5 rounded-lg text-[#64748B] hover:text-[#111827] hover:bg-white/80 border border-transparent hover:border-[#E2E8F0] transition-colors"
              title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          )}
        </div>

        {/* MIDDLE SECTION: Role Selector, Primary CTA, Navigation Links */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
          {/* Role Switcher Pill */}
          {!collapsed ? (
            <div className="relative">
              <span className="block text-[10px] font-semibold text-[#64748B] uppercase tracking-wider px-2 mb-1">
                You&apos;re viewing as
              </span>
              <button
                onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                className="w-full flex items-center justify-between px-3 py-2 bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] rounded-xl text-xs font-semibold text-[#111827] shadow-card transition-colors"
              >
                <div className="flex items-center space-x-2 truncate">
                  <span>{roleMeta[currentRole].icon}</span>
                  <span className="truncate">{roleMeta[currentRole].label}</span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-[#94A3B8]" />
              </button>

              {/* Role Dropdown */}
              {roleDropdownOpen && (
                <div className="absolute top-full mt-1.5 left-0 right-0 z-50 bg-white rounded-xl border border-[#E2E8F0] shadow-lg py-1 text-xs animate-in fade-in duration-100">
                  {(['PARTICIPANT', 'ORGANIZER', 'JUDGE', 'ADMIN'] as UserRole[]).map((r) => (
                    <button
                      key={r}
                      onClick={() => handleRoleSelect(r)}
                      className={`w-full flex items-center space-x-2 px-3 py-2 text-left hover:bg-[#F8FAFC] transition-colors ${
                        currentRole === r ? 'font-bold text-[#2563EB] bg-[#EFF6FF]' : 'text-[#334155]'
                      }`}
                    >
                      <span>{roleMeta[r].icon}</span>
                      <span>{roleMeta[r].label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-1 text-lg" title={`Viewing as ${currentRole}`}>
              {roleMeta[currentRole].icon}
            </div>
          )}

          {/* Primary CTA Button */}
          {!collapsed && (
            <Link
              href={roleMeta[currentRole].ctaHref}
              className="flex items-center justify-center space-x-2 w-full py-2.5 px-3 bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-[#1E40AF] text-white rounded-xl text-xs font-semibold shadow-sm transition-all duration-150"
            >
              <span>{roleMeta[currentRole].ctaLabel}</span>
            </Link>
          )}

          {/* Navigation Links List */}
          <nav className="space-y-0.5 pt-1">
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
                  className={`flex items-center group h-[44px] px-3 rounded-[11px] text-[14px] font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-[#EFF6FF] text-[#111827] font-semibold'
                      : 'text-[#475569] hover:text-[#111827] hover:bg-white/60'
                  }`}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon
                    className={`w-[19px] h-[19px] flex-shrink-0 transition-colors ${
                      isActive ? 'text-[#2563EB]' : 'text-[#64748B] group-hover:text-[#2563EB]'
                    } ${collapsed ? 'mx-auto' : 'mr-3'}`}
                  />

                  {!collapsed && (
                    <span className="truncate flex-1">{item.label}</span>
                  )}

                  {!collapsed && item.badge && (
                    <span className="ml-auto px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-[#DBEAFE] text-[#1E40AF]">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* BOTTOM: Profile Summary / Quick Settings */}
        <div className="p-3 border-t border-[#E2E8F0] bg-white/50">
          {!collapsed ? (
            <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-[#E2E8F0] shadow-card">
              <div className="flex items-center space-x-2.5 truncate">
                <div className="w-8 h-8 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] font-bold text-xs flex items-center justify-center flex-shrink-0">
                  A
                </div>
                <div className="truncate">
                  <div className="font-semibold text-xs text-[#111827] truncate">Alice Hacker</div>
                  <div className="text-[10px] text-[#64748B] truncate">alice.hacker@dev.io</div>
                </div>
              </div>
              <Link
                href="/participant/settings"
                className="p-1 text-[#94A3B8] hover:text-[#2563EB] transition-colors"
                title="Settings"
              >
                <Settings className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="w-8 h-8 mx-auto rounded-full bg-[#EFF6FF] text-[#2563EB] font-bold text-xs flex items-center justify-center">
              A
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
