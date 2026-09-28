'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Trophy,
  Compass,
  Home,
  Upload,
  Image as ImageIcon,
  LayoutDashboard,
  Calendar,
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
  HelpCircle,
  MessageSquare,
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
  onRoleChange: (role: UserRole) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  userName?: string;
  userEmail?: string;
  userAvatarUrl?: string | null;
  isAuthenticated?: boolean;
  onOpenLoginModal?: () => void;
}

// Constant 3 Pages displayed to all unauthenticated/guest users across all roles
const GUEST_ITEMS: NavItem[] = [
  { label: 'Home', href: '/', icon: Home },
  { label: 'Contact Us', href: '/contact', icon: MessageSquare },
  { label: 'Help Center', href: '/help', icon: HelpCircle },
];

const PARTICIPANT_ITEMS: NavItem[] = [
  { label: 'Home', href: '/', icon: Home },
  { label: 'Explore Hackathons', href: '/hackathons', icon: Trophy },
  { label: 'My Hackathons', href: '/participant/dashboard', icon: Calendar },
  { label: 'My Teams', href: '/participant/teams', icon: Users },
  { label: 'My Projects', href: '/participant/projects', icon: FileText },
  { label: 'My Submissions', href: '/participant/submissions', icon: Upload },
  { label: 'Leaderboard', href: '/leaderboard', icon: BarChart3 },
  { label: 'Project Gallery', href: '/projects', icon: Layers },
  { label: 'Certificates', href: '/participant/certificates', icon: Award },
  { label: 'My Activity', href: '/participant/activity', icon: Activity },
  { label: 'My Profile', href: '/participant/settings', icon: UserCheck2 },
  { label: 'Contact Us', href: '/contact', icon: MessageSquare },
  { label: 'Help Center', href: '/help', icon: HelpCircle },
];

const ORGANIZER_ITEMS: NavItem[] = [
  { label: 'Home', href: '/', icon: Home },
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
  { label: 'Contact Us', href: '/contact', icon: MessageSquare },
  { label: 'Help Center', href: '/help', icon: HelpCircle },
];

const JUDGE_ITEMS: NavItem[] = [
  { label: 'Home', href: '/', icon: Home },
  { label: 'Dashboard', href: '/judge/dashboard', icon: LayoutDashboard },
  { label: 'My Assignments', href: '/judge/assignments', icon: Scale },
  { label: 'Pending Evaluations', href: '/judge/evaluations', icon: FileCheck },
  { label: 'Completed Evaluations', href: '/judge/completed', icon: ShieldCheck },
  { label: 'Leaderboard', href: '/leaderboard', icon: Award },
  { label: 'Profile', href: '/judge/profile', icon: UserCheck2 },
  { label: 'Contact Us', href: '/contact', icon: MessageSquare },
  { label: 'Help Center', href: '/help', icon: HelpCircle },
];

const ADMIN_ITEMS: NavItem[] = [
  { label: 'Home', href: '/', icon: Home },
  { label: 'Overview', href: '/admin/dashboard', icon: Activity },
  { label: 'Users', href: '/admin/users', icon: Users },
  { label: 'Hackathons', href: '/admin/hackathons', icon: Trophy },
  { label: 'Teams', href: '/admin/teams', icon: Users },
  { label: 'Submissions', href: '/admin/submissions', icon: FileCheck },
  { label: 'Judges', href: '/admin/judges', icon: UserCheck2 },
  { label: 'Results & Leaderboard', href: '/admin/results', icon: Award },
  { label: 'Certificates', href: '/admin/certificates', icon: ShieldCheck },
  { label: 'Audit Logs', href: '/admin/audit-logs', icon: History },
  { label: 'Contact Us', href: '/contact', icon: MessageSquare },
  { label: 'Help Center', href: '/help', icon: HelpCircle },
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
  isAuthenticated = false,
  onOpenLoginModal,
}) => {
  const pathname = usePathname();

  // Select items list: GUEST gets ONLY the 3 constant pages!
  const getNavItems = () => {
    if (!isAuthenticated) {
      return GUEST_ITEMS;
    }

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

      {/* Permanent Desktop Sidebar (width: ~270px, background: #131417, border: #202228) */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 bg-[#131417] border-r border-[#202228] transition-all duration-200 flex flex-col justify-between select-none ${
          collapsed ? 'w-[72px]' : 'w-[270px]'
        } ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* TOP: Brand Wordmark & Collapse Icon */}
        <div className="h-[72px] px-5 border-b border-[#202228] flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3 overflow-hidden group">
            {/* Stylized Glowing Orange ATLYX Logo */}
            <div className="w-[34px] h-[34px] rounded-lg bg-[#FA541C] flex items-center justify-center flex-shrink-0 shadow-md shadow-[#FA541C]/25 group-hover:scale-105 transition-transform">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 22h4.5l2.5-5h6l2.5 5H22L12 2zm0 6.5L14.25 13h-4.5L12 8.5z"/>
              </svg>
            </div>
            {!collapsed && (
              <div className="truncate">
                <span className="font-extrabold text-[18px] tracking-tight text-white block leading-tight">
                  ATLYX
                </span>
                <span className="block text-[9.5px] font-semibold text-[#9CA3AF] uppercase tracking-wider mt-0.5">
                  COMPETITION ARENA
                </span>
              </div>
            )}
          </Link>

          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="hidden lg:flex p-1.5 rounded-lg text-[#9CA3AF] hover:text-white hover:bg-[#1C1E24] transition-colors"
              title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          )}
        </div>

        {/* NAVIGATION LINKS SECTION (Full Height) */}
        <div className="flex-1 overflow-y-auto px-3.5 py-4 custom-scrollbar">
          <nav className="space-y-[4px]">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === '/'
                  ? pathname === '/'
                  : pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/');

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={onCloseMobile}
                  className={`flex items-center group h-[42px] px-3.5 rounded-xl text-[13.5px] transition-all relative ${
                    isActive
                      ? 'bg-[#FA541C] text-white font-semibold shadow-md shadow-[#FA541C]/30'
                      : 'text-[#9CA3AF] hover:text-white hover:bg-[#1A1C22] font-normal'
                  }`}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon
                    className={`w-[18px] h-[18px] flex-shrink-0 transition-colors ${
                      isActive ? 'text-white' : 'text-[#9CA3AF] group-hover:text-white'
                    } ${collapsed ? 'mx-auto' : 'mr-3.5'}`}
                  />

                  {!collapsed && (
                    <span className="truncate flex-1">{item.label}</span>
                  )}

                  {!collapsed && item.badge && (
                    <span className="ml-auto px-1.5 py-0.5 text-[10px] font-semibold rounded-md bg-[#FA541C]/20 text-[#FA541C] border border-[#FA541C]/30">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* BOTTOM: Profile Summary Card */}
        {isAuthenticated && (
          <div className="p-3 border-t border-[#202228] bg-[#101114]">
            {!collapsed ? (
              <div className="flex items-center justify-between p-2 rounded-xl bg-[#16181D] border border-[#23262E]">
                <div className="flex items-center space-x-2.5 truncate">
                  {userAvatarUrl ? (
                    <img
                      src={userAvatarUrl}
                      alt={userName || 'User'}
                      className="w-[30px] h-[30px] rounded-full object-cover ring-1 ring-neutral-700 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-[30px] h-[30px] rounded-full bg-[#FA541C]/20 text-[#FA541C] font-bold text-xs flex items-center justify-center border border-[#FA541C]/30 flex-shrink-0">
                      {userName
                        ? userName.charAt(0).toUpperCase()
                        : currentRole === 'JUDGE'
                        ? 'D'
                        : 'A'}
                    </div>
                  )}
                  <div className="truncate">
                    <div className="font-bold text-xs text-white truncate">
                      {userName ||
                        (currentRole === 'JUDGE'
                          ? 'Dr. Sarah Chen'
                          : currentRole === 'ADMIN'
                          ? 'System Administrator'
                          : 'Apex Event Lead')}
                    </div>
                    <div className="text-[10px] text-[#9CA3AF] truncate">
                      {userEmail ||
                        (currentRole === 'JUDGE'
                          ? 'judge.alpha@hackathon.dev'
                          : currentRole === 'ADMIN'
                          ? 'admin@hackathon.dev'
                          : 'organizer@hackathon.dev')}
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
                  className="p-1 text-[#9CA3AF] hover:text-white transition-colors"
                  title="Settings / Workspace"
                >
                  <Settings className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : (
              <div className="w-8 h-8 mx-auto rounded-full bg-[#FA541C]/20 text-[#FA541C] font-bold text-xs flex items-center justify-center border border-[#FA541C]/30">
                {userName ? userName.charAt(0).toUpperCase() : 'A'}
              </div>
            )}
          </div>
        )}
      </aside>
    </>
  );
};
