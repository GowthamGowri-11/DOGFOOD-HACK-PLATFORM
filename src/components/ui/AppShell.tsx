'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar, UserRole } from './Sidebar';
import { TopNavbar, AuthUser } from './TopNavbar';
import { FeaturedRail, FeaturedItem } from './FeaturedRail';

export interface AppShellProps {
  children: React.ReactNode;
  userRole?: UserRole;
  showFeaturedRail?: boolean;
  featuredItems?: FeaturedItem[];
  pageTitle?: string;
  pageSubtitle?: string;
  headerAction?: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  children,
  userRole,
  showFeaturedRail = false,
  featuredItems,
  pageTitle,
  pageSubtitle,
  headerAction,
}) => {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [currentRole, setCurrentRole] = useState<UserRole>(userRole || 'PARTICIPANT');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Dynamically sync auth and role across all views
  useEffect(() => {
    let isMounted = true;
    const fetchAuth = async () => {
      try {
        const res = await fetch('/api/v1/auth/me');
        if (res.ok) {
          const json = await res.json();
          if (isMounted && json.success && json.data?.user) {
            const user: AuthUser = json.data.user;
            setCurrentUser(user);

            // Determine role:
            // 1. If inside a role-specific workspace route, enforce that workspace
            if (pathname.startsWith('/admin')) {
              setCurrentRole('ADMIN');
            } else if (pathname.startsWith('/organizer')) {
              setCurrentRole('ORGANIZER');
            } else if (pathname.startsWith('/judge')) {
              setCurrentRole('JUDGE');
            } else if (pathname.startsWith('/participant')) {
              setCurrentRole('PARTICIPANT');
            } else {
              // 2. On public routes (/, /hackathons, /leaderboard, etc.), dynamically adapt to user's real role!
              const mapped = (user.role?.toUpperCase() || 'PARTICIPANT') as UserRole;
              setCurrentRole(mapped);
            }
            return;
          }
        }
        if (isMounted) {
          setCurrentUser(null);
          if (pathname.startsWith('/admin')) {
            setCurrentRole('ADMIN');
          } else if (pathname.startsWith('/organizer')) {
            setCurrentRole('ORGANIZER');
          } else if (pathname.startsWith('/judge')) {
            setCurrentRole('JUDGE');
          } else {
            setCurrentRole(userRole || 'PARTICIPANT');
          }
        }
      } catch {
        if (isMounted) {
          setCurrentUser(null);
          setCurrentRole(userRole || 'PARTICIPANT');
        }
      } finally {
        if (isMounted) setAuthLoading(false);
      }
    };

    fetchAuth();
    return () => {
      isMounted = false;
    };
  }, [pathname, userRole]);

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentRole('PARTICIPANT');
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF] flex flex-col font-sans antialiased text-[#111827]">
      {/* Permanent Desktop Sidebar (w-260 or w-72 when collapsed) */}
      <Sidebar
        currentRole={currentRole}
        onRoleChange={setCurrentRole}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        isMobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        userName={currentUser?.name}
        userEmail={currentUser?.email}
        userAvatarUrl={currentUser?.avatarUrl}
      />

      {/* Main Application Area (offset by 270px sidebar width on desktop) */}
      <div
        className={`flex-1 flex flex-col transition-all duration-200 ${
          sidebarCollapsed ? 'lg:pl-[72px]' : 'lg:pl-[270px]'
        }`}
      >
        {/* Top Global Navbar (height: 70px, centered search, breadcrumb) */}
        <TopNavbar
          onToggleSidebar={() => setMobileMenuOpen(!mobileMenuOpen)}
          userRole={currentRole}
          userName={currentUser?.name}
          currentUser={currentUser}
          authLoading={authLoading}
          onLogout={handleLogout}
        />

        {/* APPLICATION AREA: Center the primary content inside this application area */}
        <main className="flex-1 w-full bg-[#FFFFFF] pt-6 pb-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-[1400px] mx-auto">
            {/* Optional Unified Header Bar */}
            {(pageTitle || headerAction) && (
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between pb-5 mb-6 border-b border-[#E2E8F0] gap-4">
                <div>
                  <h1 className="text-[28px] sm:text-[34px] font-bold text-[#0F172A] tracking-tight leading-[1.2]">
                    {pageTitle}
                  </h1>
                  {pageSubtitle && (
                    <p className="text-[14px] sm:text-[15px] text-[#64748B] mt-1 font-normal leading-[1.5]">
                      {pageSubtitle}
                    </p>
                  )}
                </div>
                {headerAction && <div className="flex-shrink-0">{headerAction}</div>}
              </div>
            )}

            {/* Split layout or Full Width */}
            {showFeaturedRail ? (
              <div className="flex flex-col xl:flex-row items-start gap-6 xl:gap-8">
                {/* Main Content Area */}
                <div className="w-full xl:flex-1 min-w-0 space-y-6">
                  {children}
                </div>

                {/* Right Featured Rail */}
                <div className="w-full xl:w-[320px] flex-shrink-0">
                  <FeaturedRail items={featuredItems} />
                </div>
              </div>
            ) : (
              /* Full Width Workspaces (Participant, Organizer, Judge, Leaderboard, Admin) */
              <div className="w-full space-y-6">{children}</div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};
