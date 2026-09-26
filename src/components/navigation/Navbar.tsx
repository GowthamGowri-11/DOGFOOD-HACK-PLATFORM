'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Trophy, Compass, Grid, Award, LogIn, UserPlus, Menu, X, Shield, Sparkles } from 'lucide-react';

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Brand Logo */}
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                <Trophy className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-xl tracking-tight text-slate-900">
                Apex<span className="text-blue-600">Hack</span>
              </span>
            </Link>
            <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
              Ultra Pro Max
            </span>
          </div>

          {/* Desktop Nav Items */}
          <div className="hidden md:flex items-center space-x-1 text-sm font-medium text-slate-600">
            <Link href="/hackathons" className="px-3.5 py-2 rounded-lg hover:text-blue-600 hover:bg-slate-50 transition-colors">
              Hackathons
            </Link>
            <Link href="/explore" className="px-3.5 py-2 rounded-lg hover:text-blue-600 hover:bg-slate-50 transition-colors">
              Explore
            </Link>
            <Link href="/projects" className="px-3.5 py-2 rounded-lg hover:text-blue-600 hover:bg-slate-50 transition-colors">
              Project Gallery
            </Link>
            <Link href="/leaderboard" className="px-3.5 py-2 rounded-lg hover:text-blue-600 hover:bg-slate-50 transition-colors">
              Leaderboard
            </Link>
          </div>

          {/* Action CTAs */}
          <div className="hidden md:flex items-center space-x-3">
            <Link
              href="/login"
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <LogIn className="w-4 h-4 mr-1.5 text-slate-500" />
              Log in
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
            >
              <UserPlus className="w-4 h-4 mr-1.5" />
              Sign up
            </Link>
          </div>

          {/* Mobile hamburger */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-2 pb-4 space-y-2">
          <Link
            href="/hackathons"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-50"
          >
            Hackathons
          </Link>
          <Link
            href="/explore"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-50"
          >
            Explore
          </Link>
          <Link
            href="/projects"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-50"
          >
            Project Gallery
          </Link>
          <Link
            href="/leaderboard"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-50"
          >
            Leaderboard
          </Link>
          <div className="pt-3 border-t border-slate-100 flex flex-col space-y-2">
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg"
            >
              Log in
            </Link>
            <Link
              href="/register"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg"
            >
              Sign up
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
