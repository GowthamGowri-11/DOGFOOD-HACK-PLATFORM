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
