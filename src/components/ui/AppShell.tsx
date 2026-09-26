'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar, UserRole } from './Sidebar';
import { TopNavbar } from './TopNavbar';
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
  userRole = 'PARTICIPANT',
  showFeaturedRail = false,
  featuredItems,
  pageTitle,
  pageSubtitle,
  headerAction,
}) => {
  const [currentRole, setCurrentRole] = useState<UserRole>(userRole);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Sync role if prop changes
  useEffect(() => {
    if (userRole) {
      setCurrentRole(userRole);
    }
  }, [userRole]);

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
      />

      {/* Main Application Area (offset by sidebar width on desktop) */}
      <div
        className={`flex-1 flex flex-col transition-all duration-200 ${
          sidebarCollapsed ? 'lg:pl-[72px]' : 'lg:pl-[260px]'
        }`}
      >
        {/* Top Global Navbar (height: 72px, centered search, breadcrumb) */}
        <TopNavbar
          onToggleSidebar={() => setMobileMenuOpen(!mobileMenuOpen)}
          userRole={currentRole}
        />

        {/* APPLICATION AREA: Center the primary content inside this application area */}
        <main className="flex-1 w-full bg-[#FFFFFF] py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-[1080px] mx-auto">
            {/* Optional Unified Header Bar */}
            {(pageTitle || headerAction) && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-[#E2E8F0] gap-4">
                <div>
                  <h1 className="text-[28px] sm:text-[36px] font-bold text-[#111827] tracking-tight leading-tight">
                    {pageTitle}
                  </h1>
                  {pageSubtitle && (
                    <p className="text-[14px] sm:text-[15px] text-[#64748B] mt-1 font-normal leading-relaxed">
                      {pageSubtitle}
                    </p>
                  )}
                </div>
                {headerAction && <div className="flex-shrink-0">{headerAction}</div>}
              </div>
            )}

            {/* Split layout: Main Content (~705px) + Right Featured Rail (~316px) with ~44px gap */}
            {showFeaturedRail ? (
              <div className="flex flex-col xl:flex-row items-start gap-8 xl:gap-[44px]">
                {/* Main Content Area (~705px) */}
                <div className="w-full xl:w-[705px] flex-1 min-w-0 space-y-6">
                  {children}
                </div>

                {/* Right Featured Rail (~316px) */}
                <div className="w-full xl:w-[316px] flex-shrink-0">
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
