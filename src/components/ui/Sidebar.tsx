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

      {/* Permanent Desktop Sidebar (width: ~270px, background: #F4F8FC, border: #E2E8F0) */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 bg-[#F4F8FC] border-r border-[#E2E8F0] transition-all duration-200 flex flex-col justify-between select-none ${
          collapsed ? 'w-[72px]' : 'w-[270px]'
        } ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* TOP: Brand Wordmark & Collapse Icon */}
        <div className="h-[72px] px-5 border-b border-[#E2E8F0] flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2.5 overflow-hidden">
            <div className="w-[34px] h-[34px] rounded-xl bg-[#2563EB] flex items-center justify-center text-white font-black shadow-sm flex-shrink-0">
              <Trophy className="w-4 h-4 text-white" />
            </div>
            {!collapsed && (
              <div className="truncate">
                <span className="font-bold text-[17px] tracking-tight text-[#111827]">
                  Apex<span className="text-[#2563EB]">Hack</span>
                </span>
                <span className="block text-[10px] font-medium text-[#64748B] uppercase tracking-wider -mt-0.5">
                  Competition Arena
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
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {/* Role Switcher Pill */}
          {!collapsed ? (
            <div className="relative">
              <span className="block text-[12px] font-medium text-[#64748B] px-1 mb-1.5">
                You&apos;re viewing as
              </span>
              <button
                onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                className="w-full h-[48px] flex items-center justify-between px-3.5 bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] rounded-[13px] text-[14px] font-medium text-[#111827] transition-colors"
              >
                <div className="flex items-center space-x-2.5 truncate">
                  <span className="text-base">{roleMeta[currentRole].icon}</span>
                  <span className="truncate">{roleMeta[currentRole].label}</span>
                </div>
                <ChevronDown className="w-4 h-4 text-[#94A3B8]" />
              </button>

              {/* Role Dropdown */}
              {roleDropdownOpen && (
                <div className="absolute top-full mt-1.5 left-0 right-0 z-50 bg-white rounded-xl border border-[#E2E8F0] shadow-md py-1 text-xs animate-in fade-in duration-100">
                  {(['PARTICIPANT', 'ORGANIZER', 'JUDGE', 'ADMIN'] as UserRole[]).map((r) => (
                    <button
                      key={r}
                      onClick={() => handleRoleSelect(r)}
                      className={`w-full flex items-center space-x-2.5 px-3.5 py-2.5 text-left hover:bg-[#F8FAFC] transition-colors ${
                        currentRole === r ? 'font-semibold text-[#2563EB] bg-[#EFF6FF]' : 'text-[#334155]'
                      }`}
                    >
                      <span>{roleMeta[r].icon}</span>
                      <span className="text-[13px]">{roleMeta[r].label}</span>
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

          {/* Primary CTA Button (42-44px height, 22px radius, 13-14px font, 500-600 weight) */}
          {!collapsed && (
            <Link
              href={roleMeta[currentRole].ctaHref}
              className="flex items-center justify-center space-x-2 w-full h-[42px] px-4 bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-[#1E40AF] text-white rounded-[22px] text-[13.5px] font-medium transition-colors shadow-none"
            >
              <span>{roleMeta[currentRole].ctaLabel}</span>
            </Link>
          )}

          {/* Navigation Links List */}
          <nav className="space-y-[3px] pt-1">
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
                  className={`flex items-center group h-[42px] px-3 rounded-[9px] text-[14px] transition-colors ${
                    isActive
                      ? 'bg-[#E5EDF5] text-[#334155] font-medium'
                      : 'text-[#334155] hover:text-[#111827] hover:bg-white/70 font-normal'
                  }`}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon
                    className={`w-[18px] h-[18px] flex-shrink-0 transition-colors ${
                      isActive ? 'text-[#2563EB]' : 'text-[#64748B] group-hover:text-[#2563EB]'
                    } ${collapsed ? 'mx-auto' : 'mr-3'}`}
                  />

                  {!collapsed && (
                    <span className="truncate flex-1">{item.label}</span>
                  )}

                  {!collapsed && item.badge && (
                    <span className="ml-auto px-1.5 py-0.5 text-[10px] font-semibold rounded-md bg-[#DBEAFE] text-[#1E40AF]">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* BOTTOM: Profile Summary */}
        <div className="p-3.5 border-t border-[#E2E8F0] bg-white/40">
          {!collapsed ? (
            <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-[#E2E8F0]">
              <div className="flex items-center space-x-2.5 truncate">
                <div className="w-[32px] h-[32px] rounded-full bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] font-bold text-xs flex items-center justify-center flex-shrink-0">
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
