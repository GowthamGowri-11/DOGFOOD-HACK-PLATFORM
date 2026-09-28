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

  const applySessionUser = (u: { id?: string; name?: string; fullName?: string; email?: string; role?: string; avatarUrl?: string | null }) => {
    setCurrentUser({
      id: u.id || 'usr_open_access',
      name: u.name || u.fullName || u.email || 'User',
      email: u.email || '',
      role: (u.role as UserRole) || 'PARTICIPANT',
      avatarUrl: u.avatarUrl || null,
    });
    if (u.role) setCurrentRole(u.role as UserRole);
  };

  // Align open-access identity to the current workspace (admin/organizer/judge/participant)
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const authDisabled = process.env.NEXT_PUBLIC_AUTH_DISABLED === 'true';
        if (authDisabled && userRole) {
          const switchRes = await fetch('/api/v1/auth/open-role', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ role: userRole }),
          });
          const switchJson = await switchRes.json();
          if (!cancelled && switchJson.success && switchJson.data?.user) {
            applySessionUser(switchJson.data.user);
            return;
          }
        }

        const res = await fetch('/api/v1/auth/me');
        const json = await res.json();
        if (cancelled) return;
        if (json.success && json.data?.user) {
          applySessionUser(json.data.user);
        } else {
          setCurrentUser(null);
        }
      } catch {
        if (!cancelled) {
          setCurrentUser(null);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userRole]);

  const handleRoleChange = async (role: UserRole) => {
    setCurrentRole(role);
    if (process.env.NEXT_PUBLIC_AUTH_DISABLED === 'true') {
      try {
        const res = await fetch('/api/v1/auth/open-role', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role }),
        });
        const json = await res.json();
        if (json.success && json.data?.user) {
          applySessionUser(json.data.user);
        }
      } catch {
        // Navigation still proceeds
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF] flex flex-col font-sans antialiased text-[#111827]">
      {/* Permanent Desktop Sidebar (w-260 or w-72 when collapsed) */}
      <Sidebar
        currentRole={currentRole}
        onRoleChange={handleRoleChange}
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
        {/* Top Global Navbar (height: 72px, centered search, breadcrumb) */}
        <TopNavbar
          onToggleSidebar={() => setMobileMenuOpen(!mobileMenuOpen)}
          userRole={currentRole}
          userName={currentUser?.name}
          currentUser={currentUser}
          authLoading={authLoading}
          onLogout={handleLogout}
        />

        {/* APPLICATION AREA: Center the primary content inside this application area */}
        <main className="flex-1 w-full bg-[#FFFFFF] pt-[32px] pb-10 px-4 sm:px-6 lg:px-8">
          <div className="max-w-[1070px] mx-auto">
            {/* Optional Unified Header Bar */}
            {(pageTitle || headerAction) && (
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between pb-5 mb-5 border-b border-[#E2E8F0] gap-4">
                <div>
                  <h1 className="text-[32px] sm:text-[38px] font-semibold text-[#111827] tracking-tight leading-[1.15]">
                    {pageTitle}
                  </h1>
                  {pageSubtitle && (
                    <p className="text-[14px] sm:text-[15px] text-[#64748B] mt-1.5 font-normal leading-[1.5]">
                      {pageSubtitle}
                    </p>
                  )}
                </div>
                {headerAction && <div className="flex-shrink-0">{headerAction}</div>}
              </div>
            )}

            {/* Split layout: Main Content (~705px) + Right Featured Rail (~320px) with ~44px gap */}
            {showFeaturedRail ? (
              <div className="flex flex-col xl:flex-row items-start gap-8 xl:gap-[44px]">
                {/* Main Content Area (~705px) */}
                <div className="w-full xl:w-[705px] flex-1 min-w-0 space-y-5">
                  {children}
                </div>

                {/* Right Featured Rail (~320px) */}
                <div className="w-full xl:w-[320px] flex-shrink-0">
                  <FeaturedRail items={featuredItems} />
                </div>
              </div>
            ) : (
              /* Full Width Workspaces (Organizer, Judge, Project Detail, Admin) */
              <div className="w-full space-y-6">{children}</div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};
