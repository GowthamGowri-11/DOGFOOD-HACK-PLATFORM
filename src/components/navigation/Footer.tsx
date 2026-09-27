import Link from 'next/link';
import { Trophy, ShieldCheck, Cpu, Code2 } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Col */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0">
                <img src="/atlyx-logo.png" alt="ATLYX Logo" className="w-full h-full object-contain" />
              </div>
              <span className="font-bold text-lg text-white">
                ATLYX
              </span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Enterprise hackathon management, balanced judging engine, and autonomous AI Jury evaluation platform.
            </p>
          </div>

          {/* Portals */}
          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-4">
              Portals
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/participant/dashboard" className="hover:text-white transition-colors">
                  Participant Portal
                </Link>
              </li>
              <li>
                <Link href="/organizer/dashboard" className="hover:text-white transition-colors">
                  Organizer Command Center
                </Link>
              </li>
              <li>
                <Link href="/judge/dashboard" className="hover:text-white transition-colors">
                  Judge Workspace
                </Link>
              </li>
              <li>
                <Link href="/admin/dashboard" className="hover:text-white transition-colors">
                  Platform Admin
                </Link>
              </li>
            </ul>
          </div>

          {/* Explore */}
          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-4">
              Explore
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/hackathons" className="hover:text-white transition-colors">
                  All Hackathons
                </Link>
              </li>
              <li>
                <Link href="/projects" className="hover:text-white transition-colors">
                  Project Gallery
                </Link>
              </li>
              <li>
                <Link href="/leaderboard" className="hover:text-white transition-colors">
                  Official Leaderboards
                </Link>
              </li>
              <li>
                <Link href="/help" className="hover:text-white transition-colors">
                  Help Center
                </Link>
              </li>
            </ul>
          </div>

          {/* System Specs */}
          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-4">
              Architecture
            </h4>
            <div className="space-y-2 text-xs text-slate-400">
              <div className="flex items-center space-x-2">
                <Cpu className="w-4 h-4 text-blue-400" />
                <span>Modular Monolith App Router</span>
              </div>
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Strict Judge Isolation</span>
              </div>
              <div className="flex items-center space-x-2">
                <Code2 className="w-4 h-4 text-purple-400" />
                <span>Neon PostgreSQL + Prisma</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center text-xs text-slate-500">
          <p>© {new Date().getFullYear()} ATLYX Platform. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link href="/privacy" className="hover:text-slate-400">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-slate-400">Terms of Service</Link>
            <Link href="/contact" className="hover:text-slate-400">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
