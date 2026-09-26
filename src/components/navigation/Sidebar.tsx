'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode, useState } from 'react';
import {
  LayoutDashboard,
  Trophy,
  Users,
  FolderKanban,
  FileCheck,
  Award,
  Bell,
  Settings,
  Layers,
  FileText,
  UserCheck,
  Scale,
  Sparkles,
  Vote,
  QrCode,
  BarChart3,
  History,
  Download,
  UserCheck2,
  ShieldCheck,
  Sliders,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  LogOut,
} from 'lucide-react';
import { RoleType } from '@/types';

export interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
}

interface SidebarProps {
  role: RoleType;
  title: string;
  subtitle?: string;
  items?: NavItem[];
}

const PARTICIPANT_NAV: NavItem[] = [
  { label: 'Dashboard', href: '/participant/dashboard', icon: LayoutDashboard },
  { label: 'My Hackathons', href: '/participant/hackathons', icon: Trophy },
  { label: 'My Teams', href: '/participant/teams', icon: Users },
  { label: 'My Projects', href: '/participant/projects', icon: FolderKanban },
  { label: 'My Submissions', href: '/participant/submissions', icon: FileCheck },
  { label: 'My Results', href: '/participant/results', icon: Award },
  { label: 'Project Gallery', href: '/gallery', icon: Layers },
  { label: 'Leaderboard', href: '/leaderboard', icon: BarChart3 },
  { label: 'Notifications', href: '/participant/notifications', icon: Bell },
  { label: 'Settings', href: '/participant/settings', icon: Settings },
];

const ORGANIZER_NAV: NavItem[] = [
  { label: 'Overview', href: '/organizer/dashboard', icon: LayoutDashboard },
  { label: 'Hackathons', href: '/organizer/hackathons', icon: Trophy },
  { label: 'Tracks', href: '/organizer/tracks', icon: Layers },
  { label: 'Problem Statements', href: '/organizer/problem-statements', icon: FileText },
  { label: 'Registrations', href: '/organizer/registrations', icon: UserCheck },
  { label: 'Teams', href: '/organizer/teams', icon: Users },
  { label: 'Submissions', href: '/organizer/submissions', icon: FileCheck },
  { label: 'Judges', href: '/organizer/judges', icon: UserCheck2 },
  { label: 'Judging & Scoring', href: '/organizer/judging', icon: Scale },
  { label: 'Assignments', href: '/organizer/assignments', icon: Scale },
  { label: 'Rubrics', href: '/organizer/rubrics', icon: Sliders },
  { label: 'Evaluations', href: '/organizer/evaluations', icon: BarChart3 },
  { label: 'AI Jury', href: '/organizer/ai-jury', icon: Sparkles },
  { label: 'Voting', href: '/organizer/voting', icon: Vote },
  { label: 'Attendance', href: '/organizer/attendance', icon: QrCode },
  { label: 'Certificates', href: '/organizer/certificates', icon: Award },
  { label: 'Results & Standings', href: '/organizer/results', icon: Trophy },
  { label: 'Audit Logs', href: '/organizer/audit', icon: History },
  { label: 'Exports', href: '/organizer/exports', icon: Download },
];

const JUDGE_NAV: NavItem[] = [
  { label: 'Dashboard', href: '/judge/dashboard', icon: LayoutDashboard },
  { label: 'Assigned Projects', href: '/judge/assigned-projects', icon: FolderKanban },
  { label: 'Pending Evaluations', href: '/judge/evaluations', icon: Scale },
  { label: 'Completed Reviews', href: '/judge/completed', icon: CheckCircle2Icon },
  { label: 'Profile & Expertise', href: '/judge/profile', icon: UserCheck2 },
];

function CheckCircle2Icon({ className }: { className?: string }) {
  return <ShieldCheck className={className} />;
}

const ADMIN_NAV: NavItem[] = [
  { label: 'Platform Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Users & Access', href: '/admin/users', icon: Users },
  { label: 'Roles & RBAC', href: '/admin/roles', icon: ShieldCheck },
  { label: 'All Hackathons', href: '/admin/hackathons', icon: Trophy },
  { label: 'Registrations', href: '/admin/registrations', icon: UserCheck },
  { label: 'Teams', href: '/admin/teams', icon: Users },
  { label: 'Attendance Sessions', href: '/admin/attendance', icon: QrCode },
  { label: 'Issued Certificates', href: '/admin/certificates', icon: Award },
  { label: 'System Audit Logs', href: '/admin/audit', icon: History },
  { label: 'Platform Settings', href: '/admin/settings', icon: Settings },
];

export function Sidebar({ role, title, subtitle, items }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems =
    items ||
    (role === 'ORGANIZER'
      ? ORGANIZER_NAV
      : role === 'JUDGE'
      ? JUDGE_NAV
      : role === 'ADMIN'
      ? ADMIN_NAV
      : PARTICIPANT_NAV);

  const roleBadgeColors: Record<RoleType, string> = {
    ADMIN: 'bg-rose-50 text-rose-700 border-rose-200',
    ORGANIZER: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    JUDGE: 'bg-purple-50 text-purple-700 border-purple-200',
    PARTICIPANT: 'bg-blue-50 text-blue-700 border-blue-200',
  };

  return (
    <>
      {/* Mobile Sidebar Toggle Button */}
      <div className="lg:hidden fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-3.5 bg-blue-600 text-white rounded-full shadow-lg shadow-blue-600/30 hover:bg-blue-700 focus:outline-none"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Overlay for Mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 bg-white border-r border-slate-200 transition-all duration-300 flex flex-col justify-between ${
          collapsed ? 'w-20' : 'w-64'
        } ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Header / Brand info */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className={`overflow-hidden transition-all ${collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
            <span
              className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border ${
                roleBadgeColors[role]
              }`}
            >
              {role}
            </span>
            <h2 className="text-sm font-bold text-slate-900 mt-1 truncate">{title}</h2>
            {subtitle && <p className="text-[11px] text-slate-400 truncate">{subtitle}</p>}
          </div>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Items List */}
        <div className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== `/${role.toLowerCase()}/dashboard`);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center group px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
                title={collapsed ? item.label : undefined}
              >
                <Icon
                  className={`w-4 h-4 flex-shrink-0 transition-colors ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-600'
                  } ${collapsed ? 'mx-auto' : 'mr-3'}`}
                />

                {!collapsed && (
                  <span className="flex-1 truncate">{item.label}</span>
                )}

                {!collapsed && item.badge !== undefined && (
                  <span
                    className={`ml-auto px-1.5 py-0.5 text-[10px] font-bold rounded-md ${
                      isActive
                        ? 'bg-blue-700 text-white'
                        : 'bg-slate-100 text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Footer info & Logout */}
        <div className="p-3 border-t border-slate-100">
          <Link
            href="/login"
            className={`flex items-center px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors ${
              collapsed ? 'justify-center' : ''
            }`}
            title={collapsed ? 'Sign Out' : undefined}
          >
            <LogOut className={`w-4 h-4 ${collapsed ? '' : 'mr-2'}`} />
            {!collapsed && <span>Sign Out</span>}
          </Link>
        </div>
      </aside>
    </>
  );
}
