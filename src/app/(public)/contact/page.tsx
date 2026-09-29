'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Mail,
  MessageSquare,
  Phone,
  MapPin,
  Clock,
  Send,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  ShieldCheck,
  Building2,
  Users,
  Compass,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { AppShell } from '@/components/ui/AppShell';
import { useAuth } from '@/context/AuthContext';

export default function ContactPage() {
  const { currentUser } = useAuth();

  const getInitialInquiry = () => {
    if (!currentUser) return 'Participant Support';
    const role = currentUser.role?.toUpperCase();
    if (role === 'ADMIN') return 'Platform Operations & Governance';
    if (role === 'ORGANIZER') return 'Event Organizer Inquiry';
    if (role === 'JUDGE') return 'Judge / Jury Question';
    return 'Participant Support';
  };

  const [inquiryType, setInquiryType] = useState(getInitialInquiry);
  const [fullName, setFullName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [organization, setOrganization] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Sync state if currentUser resolves after mount
  React.useEffect(() => {
    if (currentUser) {
      if (!fullName && currentUser.name) setFullName(currentUser.name);
      if (!email && currentUser.email) setEmail(currentUser.email);
    }
  }, [currentUser]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    // Simulate sending message with smooth micro-interaction
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
      if (!currentUser) {
        setFullName('');
        setEmail('');
      }
      setOrganization('');
      setMessage('');
    }, 800);
  };

  const INQUIRY_TYPES = [
    'Participant Support',
    'Event Organizer Inquiry',
    'Judge / Jury Question',
    'Platform Operations & Governance',
    'Sponsorship & Enterprise',
    'Security / Bug Bounty',
  ];

  const CONTACT_CHANNELS = [
    {
      title: 'Hacker Support Desk',
      description: 'Questions about registration, squad formation, project workspaces, or submission deadlines.',
      email: 'support@atlyx.io',
      response: 'Typical response: < 15 minutes',
      icon: Users,
      badge: '24/7 Operational',
      badgeColor: 'bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]',
    },
    {
      title: 'Organizer Partnerships',
      description: 'Host your company hackathon, configure custom judging rubrics, and sponsor prize pools.',
      email: 'partnerships@atlyx.io',
      response: 'Dedicated Account Director',
      icon: Building2,
      badge: 'Enterprise & Univ',
      badgeColor: 'bg-[#FFE8D6] text-[#FA541C] border-[#FED7AA]',
    },
    {
      title: 'Security & Audit Operations',
      description: 'Cryptographic snapshot verification, tamper-evident audit logs, and responsible vulnerability reports.',
      email: 'security@atlyx.io',
      response: 'Immediate PGP Escalation',
      icon: ShieldCheck,
      badge: 'Cryptographic Ops',
      badgeColor: 'bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]',
    },
  ];

  const HUBS = [
    {
      city: 'San Francisco, USA',
      role: 'Global Platform Headquarters',
      address: '548 Market St, Suite 8200, San Francisco, CA 94104',
      timezone: 'PST / PDT (UTC-8)',
    },
    {
      city: 'London, UK',
      role: 'Europe & Middle East Operations',
      address: '1 Fore Street Ave, Moorgate, London EC2Y 9DT',
      timezone: 'GMT / BST (UTC+0)',
    },
    {
      city: 'Bengaluru, India',
      role: 'Asia-Pacific Builder Hub',
      address: 'Indiranagar 100ft Road, Bengaluru, KA 560038',
      timezone: 'IST (UTC+5:30)',
    },
  ];

  return (
    <AppShell
      showFeaturedRail={true}
      pageTitle="Contact & Support Arena"
      pageSubtitle="Get in touch with the ATLYX platform team, organizers, or jury operations."
    >
      <div className="space-y-8 select-none max-w-[1440px] mx-auto pb-16">
        {/* ================= 1. HEADER ROW ================= */}
        <div>
          {/* Small Top Orange Accent Bar */}
          <div className="w-10 h-1 bg-[#FA541C] rounded-full mb-3" />

          {/* Badges */}
          <div className="flex items-center space-x-2 mb-2">
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#FFE8D6] text-[#FA541C] text-[11px] font-bold border border-[#FED7AA]/60">
              <MessageSquare className="w-3.5 h-3.5 text-[#FA541C]" />
              <span>Direct Inquiries</span>
            </span>
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#ECFDF5] text-[#059669] text-[11px] font-bold border border-[#A7F3D0]">
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
              <span>Live Support Ops</span>
            </span>
          </div>

          <h1 className="text-2xl sm:text-[34px] font-extrabold text-[#18181B] tracking-tight leading-tight">
            Let&apos;s Connect &amp; Build Together
          </h1>
          <p className="text-xs sm:text-[14px] text-[#6B7280] font-normal mt-1 leading-relaxed max-w-3xl">
            Whether you&apos;re organizing a premier global hackathon, reporting a technical issue, or seeking partnership opportunities, our operations squad is on standby.
          </p>
        </div>

        {/* Role Workspace Active Banner */}
        {currentUser && currentUser.role?.toUpperCase() !== 'PARTICIPANT' && (
          <div className="bg-gradient-to-r from-[#18181B] via-[#242220] to-[#18181B] text-white rounded-2xl p-4 sm:p-5 border border-[#3A3530] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg shadow-black/10">
            <div className="flex items-center space-x-3.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FA541C] to-[#E03A00] flex items-center justify-center text-white flex-shrink-0 shadow-md shadow-[#FA541C]/30">
                <ShieldCheck className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-extrabold text-[14.5px] text-white">
                    {currentUser.name}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#FA541C] text-white shadow-xs">
                    {currentUser.role?.toUpperCase() === 'ADMIN' ? 'SUPER ADMIN' : currentUser.role?.toUpperCase()} WORKSPACE ACTIVE
                  </span>
                </div>
                <p className="text-xs text-[#A1A1AA] mt-0.5">
                  You are contacting support while authenticated with{' '}
                  <span className="text-[#FED7AA] font-semibold">{currentUser.role}</span> role privileges.
                </p>
              </div>
            </div>
            <Link
              href={
                currentUser.role?.toUpperCase() === 'ADMIN'
                  ? '/admin/dashboard'
                  : currentUser.role?.toUpperCase() === 'ORGANIZER'
                  ? '/organizer/dashboard'
                  : '/judge/dashboard'
              }
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FA541C] to-[#E03A00] hover:from-[#FF6636] hover:to-[#D4380D] text-white text-xs font-bold transition-all shadow-md shadow-[#FA541C]/25 hover:shadow-lg cursor-pointer whitespace-nowrap self-stretch sm:self-auto justify-center"
            >
              <span>Return to {currentUser.role?.toUpperCase() === 'ADMIN' ? 'Admin Dashboard' : `${currentUser.role} Workspace`}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {/* ================= 2. 3 QUICK CONTACT CHANNELS ================= */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {CONTACT_CHANNELS.map((ch) => {
            const Icon = ch.icon;
            return (
              <div
                key={ch.title}
                className="bg-white border border-[#E5E0D8] hover:border-[#CBD5E1] rounded-2xl p-6 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden"
              >
                {/* Subtle peach ambient glow */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#FFEFE6]/60 to-transparent rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform" />

                <div>
                  <div className="flex items-center justify-between pb-3">
                    <div className="w-11 h-11 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] text-[#FA541C] flex items-center justify-center group-hover:scale-110 group-hover:bg-[#FFE8D6] transition-all">
                      <Icon className="w-5 h-5 text-[#FA541C]" />
                    </div>
                    <span className={`text-[10.5px] font-bold px-2.5 py-0.5 rounded-full border ${ch.badgeColor}`}>
                      {ch.badge}
                    </span>
                  </div>

                  <h3 className="text-base font-extrabold text-[#18181B] group-hover:text-[#FA541C] transition-colors mt-2">
                    {ch.title}
                  </h3>
                  <p className="text-xs text-[#6B7280] mt-1.5 leading-relaxed font-normal">
                    {ch.description}
                  </p>
                </div>

                <div className="pt-5 mt-4 border-t border-[#F4EFEA]">
                  <a
                    href={`mailto:${ch.email}`}
                    className="text-xs font-bold text-[#FA541C] hover:text-[#EA4812] flex items-center space-x-1.5 group-hover:translate-x-1 transition-transform"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>{ch.email}</span>
                  </a>
                  <span className="text-[11px] text-[#9CA3AF] block mt-1 font-medium">
                    {ch.response}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* ================= 3. INTERACTIVE CONTACT FORM ================= */}
        <div className="bg-white border border-[#E5E0D8] rounded-2xl p-6 sm:p-8 shadow-xs relative overflow-hidden">
          {/* Ambient Glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-[#FFEFE6]/80 via-[#FFF7F2]/40 to-transparent rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-3xl relative z-10">
            <div className="flex items-center space-x-2 text-xs text-[#FA541C] font-bold mb-2">
              <Sparkles className="w-4 h-4" />
              <span>DIRECT INQUIRY FORM</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-[#18181B] tracking-tight">
              Send a Message to Our Team
            </h2>
            <p className="text-xs sm:text-sm text-[#6B7280] mt-1">
              Select your inquiry category and describe your requirements. We route each ticket directly to the appropriate regional lead.
            </p>

            {submitted && (
              <div className="mt-4 p-4 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46] text-xs font-medium flex items-center space-x-2 animate-in fade-in duration-300">
                <CheckCircle2 className="w-5 h-5 text-[#059669] flex-shrink-0" />
                <span>Thank you! Your message has been dispatched to our operations squad. We will follow up at your email shortly.</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              {/* Inquiry Type Pills */}
              <div>
                <label className="text-xs font-bold text-[#374151] block mb-2">
                  What can we help you with?
                </label>
                <div className="flex flex-wrap gap-2">
                  {INQUIRY_TYPES.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setInquiryType(type)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                        inquiryType === type
                          ? 'bg-[#FA541C] text-white shadow-sm'
                          : 'bg-[#FAF8F5] border border-[#E5E0D8] text-[#4B5563] hover:border-[#CBD5E1] hover:text-[#18181B]'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Name & Email Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-[#374151] block mb-1.5">
                    Your Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alice Hacker"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#E5E0D8] hover:border-[#CBD5E1] rounded-xl text-xs font-medium text-[#18181B] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#FA541C]/20 focus:border-[#FA541C] focus:bg-white shadow-2xs transition-all"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#374151] block mb-1.5">
                    Your Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. alice@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#E5E0D8] hover:border-[#CBD5E1] rounded-xl text-xs font-medium text-[#18181B] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#FA541C]/20 focus:border-[#FA541C] focus:bg-white shadow-2xs transition-all"
                  />
                </div>
              </div>

              {/* Organization / Affiliation */}
              <div>
                <label className="text-xs font-bold text-[#374151] block mb-1.5">
                  Organization / University / Team (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Apex Frontier Labs / Stanford University"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#E5E0D8] hover:border-[#CBD5E1] rounded-xl text-xs font-medium text-[#18181B] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#FA541C]/20 focus:border-[#FA541C] focus:bg-white shadow-2xs transition-all"
                />
              </div>

              {/* Message */}
              <div>
                <label className="text-xs font-bold text-[#374151] block mb-1.5">
                  Your Message or Question *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Detail your inquiry, competition timeline, technical question, or partnership scope..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#E5E0D8] hover:border-[#CBD5E1] rounded-xl text-xs font-medium text-[#18181B] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#FA541C]/20 focus:border-[#FA541C] focus:bg-white shadow-2xs transition-all"
                />
              </div>

              {/* Submit CTA */}
              <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <span className="text-[11px] text-[#9CA3AF] font-medium">
                  We guarantee zero spam and full adherence to our cryptographic privacy policy.
                </span>

                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#FA541C] to-[#E03A00] hover:from-[#EA4812] hover:to-[#C93300] text-white text-xs font-bold shadow-md shadow-[#FA541C]/25 hover:shadow-lg hover:shadow-[#FA541C]/35 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 transition-all duration-200 flex items-center space-x-2 cursor-pointer group"
                >
                  <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-0.5 transition-transform" />
                  <span>{submitting ? 'Transmitting Ticket...' : 'Send Message →'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* ================= 4. GLOBAL OPERATIONS HUBS ================= */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <span className="w-1.5 h-5 bg-[#FA541C] rounded-full inline-block" />
            <h2 className="text-base sm:text-[18px] font-extrabold text-[#18181B] tracking-tight">
              Global Operations Hubs
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {HUBS.map((hub) => (
              <div
                key={hub.city}
                className="bg-white border border-[#E5E0D8] hover:border-[#CBD5E1] rounded-2xl p-5 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
              >
                <div className="flex items-center space-x-2 text-[#FA541C] text-xs font-bold mb-1">
                  <MapPin className="w-4 h-4" />
                  <span>{hub.city}</span>
                </div>
                <div className="text-[13px] font-bold text-[#18181B] mb-2">{hub.role}</div>
                <p className="text-xs text-[#6B7280] leading-relaxed mb-3 font-normal">
                  {hub.address}
                </p>
                <div className="flex items-center space-x-1.5 text-[11px] text-[#9CA3AF] font-medium pt-2 border-t border-[#F4EFEA]">
                  <Clock className="w-3.5 h-3.5 text-[#9CA3AF]" />
                  <span>Timezone: {hub.timezone}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ================= 5. KNOWLEDGE BASE BANNER ================= */}
        <div className="bg-gradient-to-r from-[#18181B] to-[#27272A] rounded-2xl p-6 sm:p-8 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 shadow-lg">
          <div className="space-y-1 max-w-xl">
            <span className="text-[11px] font-bold text-[#FA541C] uppercase tracking-wider block">
              SELF-SERVICE DOCUMENTATION
            </span>
            <h3 className="text-xl font-black tracking-tight text-white">
              Looking for guides, submission rules, or FAQs?
            </h3>
            <p className="text-xs text-[#9CA3AF] leading-relaxed font-normal">
              Find answers instantly across our interactive knowledge base covering squads, judging rubrics, and certificate verification.
            </p>
          </div>

          <Link
            href="/help"
            className="inline-flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-[#FA541C] to-[#E03A00] hover:from-[#EA4812] hover:to-[#C93300] text-white text-xs font-bold rounded-xl shadow-md shadow-[#FA541C]/30 hover:shadow-lg hover:shadow-[#FA541C]/40 hover:-translate-y-0.5 active:translate-y-0 transition-all flex-shrink-0 cursor-pointer group"
          >
            <HelpCircle className="w-4 h-4 stroke-[2.5]" />
            <span>Visit Help Center &rarr;</span>
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
