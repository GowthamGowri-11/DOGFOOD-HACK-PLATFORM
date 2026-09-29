'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock, ArrowRight, Home, Sparkles, LogIn, ShieldAlert } from 'lucide-react';
import { Sidebar, UserRole } from './Sidebar';
import { TopNavbar, AuthUser } from './TopNavbar';
import { FeaturedRail, FeaturedItem } from './FeaturedRail';
import { useAuth } from '@/context/AuthContext';

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
  const router = useRouter();
  const {
    currentUser,
    isAuthenticated,
    authLoading,
    currentRole: contextRole,
    setCurrentRole,
    openAuthModal,
    logout,
  } = useAuth();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Authenticated user's real role ALWAYS takes precedence over route default prop
  const authenticatedRole = currentUser?.role
    ? (currentUser.role.toUpperCase() as UserRole)
    : null;
  const effectiveRole: UserRole = authenticatedRole || userRole || contextRole || 'PARTICIPANT';

  // Check if current route is a role-protected workspace or sensitive resource
  const isProtectedRoute =
    pathname.startsWith('/participant') ||
    pathname.startsWith('/organizer') ||
    pathname.startsWith('/judge') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/overview') ||
    pathname.startsWith('/docs') ||
    pathname.startsWith('/threat-model');

  // Role routing enforcement:
  // If an ADMIN is logged in, ensure they are routed to the Admin workspace (/admin/dashboard),
  // not stuck in participant role functions!
  useEffect(() => {
    if (!authLoading && currentUser) {
      const realRole = currentUser.role?.toUpperCase();
      if (realRole === 'ADMIN' && pathname.startsWith('/participant')) {
        router.replace('/admin/dashboard');
      } else if (realRole === 'ORGANIZER' && pathname.startsWith('/participant')) {
        router.replace('/organizer/dashboard');
      } else if (realRole === 'JUDGE' && (pathname.startsWith('/participant') || pathname.startsWith('/admin') || pathname.startsWith('/organizer'))) {
        router.replace('/judge/dashboard');
      } else if (realRole === 'PARTICIPANT' && (pathname.startsWith('/admin') || pathname.startsWith('/organizer') || pathname.startsWith('/judge'))) {
        router.replace('/participant/dashboard');
      }
    }
  }, [authLoading, currentUser, pathname, router]);

  // If user navigates to a protected route without login, trigger the login popup
  useEffect(() => {
    if (!authLoading && !currentUser && isProtectedRoute) {
      openAuthModal({
        actionType: 'access',
        title: 'Sign In Required to Access Workspace',
        reason:
          'You need an active account to access this role workspace. Sign in or choose a demo persona below.',
        redirectUrl: pathname,
      });
    }
  }, [authLoading, currentUser, isProtectedRoute, pathname, openAuthModal]);

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col font-sans antialiased text-[#111827]">
      {/* Permanent Desktop Sidebar (w-260 or w-72 when collapsed) */}
      <Sidebar
        currentRole={effectiveRole}
        onRoleChange={setCurrentRole}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        isMobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        userName={currentUser?.name}
        userEmail={currentUser?.email}
        userAvatarUrl={currentUser?.avatarUrl}
        isAuthenticated={isAuthenticated}
        onOpenLoginModal={() =>
          openAuthModal({
            actionType: 'general',
            redirectUrl: pathname,
          })
        }
      />

      {/* Main Application Area (offset by 260px sidebar width on desktop) */}
      <div
        className={`flex-1 flex flex-col transition-all duration-200 ${
          sidebarCollapsed ? 'lg:pl-[72px]' : 'lg:pl-[260px]'
        }`}
      >
        {/* Top Global Navbar */}
        <TopNavbar
          onToggleSidebar={() => setMobileMenuOpen(!mobileMenuOpen)}
          userRole={effectiveRole}
          userName={currentUser?.name}
          currentUser={currentUser}
          authLoading={authLoading}
          onLogout={logout}
        />

        {/* APPLICATION AREA */}
        <main className="flex-1 w-full bg-[#F8FAFC] pt-6 pb-12 px-4 sm:px-6 lg:px-8 text-[#111827] page-enter">
          <div className="max-w-[1440px] mx-auto">
            {/* If NOT logged in and accessing a protected workspace: show Access Wall */}
            {!authLoading && !currentUser && isProtectedRoute ? (
              <div className="min-h-[500px] flex items-center justify-center py-12 px-4">
                <div className="max-w-md w-full bg-white rounded-3xl border border-[#E2E8F0] p-8 text-center shadow-lg shadow-black/5 space-y-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FA541C] to-[#E03A00] text-white flex items-center justify-center mx-auto shadow-md shadow-[#FA541C]/30">
                    <Lock className="w-8 h-8 stroke-[2.2]" />
                  </div>

                  <div className="space-y-2">
                    <span className="inline-block px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-[#FFE8D6] text-[#FA541C]">
                      AUTHENTICATION REQUIRED
                    </span>
                    <h2 className="text-2xl font-extrabold text-[#111827] tracking-tight">
                      Workspace Locked
                    </h2>
                    <p className="text-xs sm:text-sm text-[#6B7280] leading-relaxed">
                      Please sign in to access your role workspace, view private submissions, and manage hackathon operations.
                    </p>
                  </div>

                  <div className="space-y-3 pt-2">
                    <button
                      onClick={() =>
                        openAuthModal({
                          actionType: 'access',
                          redirectUrl: pathname,
                        })
                      }
                      className="w-full py-3 px-5 rounded-xl bg-gradient-to-r from-[#FA541C] to-[#E03A00] hover:from-[#FF6636] hover:to-[#D4380D] text-white font-bold text-xs sm:text-sm shadow-md shadow-[#FA541C]/25 hover:shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <LogIn className="w-4 h-4" />
                      <span>Sign In to Unlock Workspace</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>

                    <Link
                      href="/"
                      className="w-full py-2.5 px-4 rounded-xl bg-[#F4F4F5] hover:bg-[#E4E4E7] text-[#4B5563] font-semibold text-xs transition-colors flex items-center justify-center gap-2"
                    >
                      <Home className="w-3.5 h-3.5" />
                      <span>Return to Home</span>
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <>
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

                {/* Split layout or Full Width with fast fluid page transition */}
                {showFeaturedRail ? (
                  <div className="flex flex-col xl:flex-row items-start gap-6 xl:gap-8">
                    {/* Main Content Area */}
                    <div key={pathname} className="w-full xl:flex-1 min-w-0 space-y-6 page-enter">
                      {children}
                    </div>

                    {/* Right Featured Rail */}
                    <div className="w-full xl:w-[320px] flex-shrink-0">
                      <FeaturedRail items={featuredItems} />
                    </div>
                  </div>
                ) : (
                  /* Full Width Workspaces */
                  <div key={pathname} className="w-full space-y-6 page-enter">
                    {children}
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};
