'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  Trophy,
  Users,
  Tag,
  ShieldCheck,
  FileText,
  Building,
  CheckCircle2,
  ArrowLeft,
  Award,
  Globe,
  Share2,
  HelpCircle,
  FolderKanban,
  BarChart3,
  ExternalLink,
} from 'lucide-react';
import { AppShell } from '@/components/ui/AppShell';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export interface HackathonDetailProps {
  hackathon: {
    id: string;
    slug: string;
    title: string;
    tagline?: string | null;
    description: string;
    organizationName: string;
    status: string;
    minTeamSize: number;
    maxTeamSize: number;
    eventStartTime: string | Date;
    eventEndTime: string | Date;
    regStartTime: string | Date;
    regEndTime: string | Date;
    subStartTime: string | Date;
    subEndTime: string | Date;
    judgingStartTime: string | Date;
    judgingEndTime: string | Date;
    eligibilityRules?: string | null;
    rulesAndGuidelines?: string | null;
    tracks: any[];
    prizes: any[];
    projects?: any[];
    _count?: {
      registrations: number;
      projects: number;
      judges: number;
    };
  };
}

export const HackathonDetailView: React.FC<HackathonDetailProps> = ({ hackathon }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'tracks' | 'prizes' | 'timeline' | 'rules' | 'projects'>('overview');
  const [registered, setRegistered] = useState(false);

  const totalPrizeAmount = hackathon.prizes.reduce(
    (sum: number, p: any) => sum + Number(p.amount || 0),
    0
  );
  const currency = hackathon.prizes[0]?.currency || 'USD';

  const handleRegister = () => {
    setRegistered(true);
    alert('Registration submitted successfully! You can now create or join a team.');
  };

  return (
    <AppShell
      userRole="PARTICIPANT"
      showFeaturedRail={false}
      pageTitle={hackathon.title}
      pageSubtitle={hackathon.tagline || hackathon.description.slice(0, 120)}
    >
      {/* Back button */}
      <div className="mb-2">
        <Link
          href="/hackathons"
          className="inline-flex items-center text-xs font-semibold text-[#64748B] hover:text-[#2563EB] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Back to Explore
        </Link>
      </div>

      {/* Top Rich Header Card (Unstop Spec) */}
      <div className="bg-white border border-[#E2E8F0] rounded-[18px] p-6 sm:p-8 shadow-card space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2.5 max-w-2xl">
            <div className="flex items-center space-x-2 text-xs font-semibold text-[#64748B]">
              <span className="text-[#334155]">{hackathon.organizationName}</span>
              <span>•</span>
              <Badge variant="blue">ONLINE</Badge>
              <Badge variant="emerald">{hackathon.status.replace('_', ' ')}</Badge>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-[#111827] tracking-tight leading-snug">
              {hackathon.title}
            </h1>

            {hackathon.tagline && (
              <p className="text-sm text-[#475569] font-normal leading-relaxed">
                {hackathon.tagline}
              </p>
            )}
          </div>

          {/* Primary CTA & Registered Status */}
          <div className="flex flex-col sm:flex-row md:flex-col items-stretch sm:items-center md:items-end gap-3 w-full md:w-auto">
            <Button
              variant="primary"
              size="lg"
              onClick={handleRegister}
              className="w-full sm:w-auto"
            >
              {registered ? '✓ Registered' : 'Register Now'}
            </Button>
            <span className="text-[11px] text-[#64748B] text-center md:text-right">
              Free Entry • Verified Certificate Provided
            </span>
          </div>
        </div>

        {/* Highlights Row: Deadline, Teams, Prize Pool, Participants */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-5 border-t border-[#F1F5F9]">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
              Registration Deadline
            </span>
            <div className="flex items-center text-xs font-bold text-[#111827]">
              <Clock className="w-3.5 h-3.5 mr-1.5 text-[#F59E0B]" />
              {new Date(hackathon.regEndTime).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
              Team Requirement
            </span>
            <div className="flex items-center text-xs font-bold text-[#111827]">
              <Users className="w-3.5 h-3.5 mr-1.5 text-[#2563EB]" />
              {hackathon.minTeamSize === hackathon.maxTeamSize
                ? `${hackathon.minTeamSize} member`
                : `${hackathon.minTeamSize}–${hackathon.maxTeamSize} members`}
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
              Total Prize Pool
            </span>
            <div className="flex items-center text-xs font-bold text-[#047857]">
              <Trophy className="w-3.5 h-3.5 mr-1.5 text-[#059669]" />
              {totalPrizeAmount > 0
                ? `${currency} ${totalPrizeAmount.toLocaleString()}`
                : 'Verifiable Awards'}
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
              Registered Teams
            </span>
            <div className="flex items-center text-xs font-bold text-[#111827]">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-[#059669]" />
              {hackathon._count?.registrations || 128} Builders
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center space-x-1 border-b border-[#E2E8F0] overflow-x-auto no-scrollbar">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'tracks', label: `Tracks (${hackathon.tracks.length})` },
          { id: 'prizes', label: `Prizes (${hackathon.prizes.length})` },
          { id: 'timeline', label: 'Timeline' },
          { id: 'rules', label: 'Rules & Guidelines' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all select-none whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-[#2563EB] text-[#2563EB]'
                : 'border-transparent text-[#64748B] hover:text-[#111827]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <div className="space-y-6">
        {activeTab === 'overview' && (
          <div className="bg-white border border-[#E2E8F0] rounded-[16px] p-6 sm:p-7 shadow-card space-y-4">
            <h3 className="text-base font-bold text-[#111827]">About this Competition</h3>
            <div className="text-xs sm:text-sm text-[#475569] leading-relaxed whitespace-pre-line font-normal">
              {hackathon.description}
            </div>
          </div>
        )}

        {activeTab === 'tracks' && (
          <div className="space-y-4">
            {hackathon.tracks.map((track) => (
              <div
                key={track.id}
                className="bg-white border border-[#E2E8F0] rounded-[16px] p-6 shadow-card space-y-4"
              >
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB]" />
                  <h4 className="text-base font-bold text-[#111827]">{track.title}</h4>
                </div>
                {track.description && (
                  <p className="text-xs text-[#64748B] leading-relaxed">{track.description}</p>
                )}

                {/* Problem Statements */}
                {track.problemStatements?.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <span className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider">
                      Problem Statements
                    </span>
                    <div className="grid grid-cols-1 gap-2.5">
                      {track.problemStatements.map((ps: any) => (
                        <div
                          key={ps.id}
                          className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3.5 space-y-1.5"
                        >
                          <div className="flex items-center space-x-2">
                            <span className="px-2 py-0.5 rounded bg-white border border-[#E2E8F0] font-mono text-[10px] font-bold text-[#111827]">
                              {ps.code}
                            </span>
                            <span className="text-xs font-bold text-[#111827]">{ps.title}</span>
                          </div>
                          <p className="text-xs text-[#64748B] leading-relaxed">{ps.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'prizes' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {hackathon.prizes.map((prize, idx) => (
              <div
                key={prize.id || idx}
                className="bg-white border border-[#E2E8F0] rounded-[16px] p-5 shadow-card space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE]">
                    Rank #{prize.rankOrder || idx + 1}
                  </span>
                  <span className="text-base font-extrabold text-[#047857]">
                    {prize.currency || 'USD'} {Number(prize.amount).toLocaleString()}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-[#111827]">{prize.title}</h4>
                {prize.description && (
                  <p className="text-xs text-[#64748B]">{prize.description}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="bg-white border border-[#E2E8F0] rounded-[16px] p-6 shadow-card space-y-4">
            <h3 className="text-base font-bold text-[#111827]">Competition Timeline</h3>
            <div className="space-y-4 text-xs">
              <div className="flex items-start space-x-3">
                <div className="w-2.5 h-2.5 rounded-full bg-[#059669] mt-1" />
                <div>
                  <span className="font-bold text-[#111827] block">Registration Period</span>
                  <span className="text-[#64748B]">
                    {new Date(hackathon.regStartTime).toLocaleString()} —{' '}
                    {new Date(hackathon.regEndTime).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-2.5 h-2.5 rounded-full bg-[#2563EB] mt-1" />
                <div>
                  <span className="font-bold text-[#111827] block">Submission Window</span>
                  <span className="text-[#64748B]">
                    {new Date(hackathon.subStartTime).toLocaleString()} —{' '}
                    {new Date(hackathon.subEndTime).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-2.5 h-2.5 rounded-full bg-[#7E22CE] mt-1" />
                <div>
                  <span className="font-bold text-[#111827] block">Jury Evaluation & Normalization</span>
                  <span className="text-[#64748B]">
                    {new Date(hackathon.judgingStartTime).toLocaleString()} —{' '}
                    {new Date(hackathon.judgingEndTime).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-2.5 h-2.5 rounded-full bg-[#D97706] mt-1" />
                <div>
                  <span className="font-bold text-[#111827] block">Results Announcement</span>
                  <span className="text-[#64748B]">
                    {new Date(hackathon.eventEndTime).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'rules' && (
          <div className="bg-white border border-[#E2E8F0] rounded-[16px] p-6 shadow-card space-y-4">
            <h3 className="text-base font-bold text-[#111827]">Rules & Eligibility</h3>
            <div className="space-y-3 text-xs text-[#475569] leading-relaxed">
              <p>
                <strong>Eligibility:</strong> {hackathon.eligibilityRules || 'Open to all developers worldwide.'}
              </p>
              <p>
                <strong>Code of Conduct:</strong> {hackathon.rulesAndGuidelines || 'All submissions must be original code created during the hackathon. Teams must adhere to fair play and zero plagiarism.'}
              </p>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
};
