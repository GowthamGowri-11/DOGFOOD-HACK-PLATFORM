'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  HelpCircle,
  Search,
  BookOpen,
  Users,
  ShieldCheck,
  Award,
  Layers,
  Sparkles,
  ChevronDown,
  ArrowRight,
  ExternalLink,
  MessageSquare,
  Lock,
  FileText,
  Mail,
  CheckCircle2,
  Cpu,
} from 'lucide-react';
import { AppShell } from '@/components/ui/AppShell';
import { useAuth } from '@/context/AuthContext';

interface FAQItem {
  id: string;
  category: string;
  question: string;
  answer: string;
}

const FAQS: FAQItem[] = [
  {
    id: 'faq-1',
    category: 'Teams & Rosters',
    question: 'How do team invitations and join codes work on ATLYX?',
    answer:
      'When you create a team for an active hackathon, a unique alphanumeric invite code (e.g. TEAM-7X9K) and shareable link are generated instantly. Teammates can enter this code in their "My Teams" dashboard or click your direct join link. If the organizer published a mandatory Team Member Form, applicants will fill in the requested skills/info before being added to the active roster.',
  },
  {
    id: 'faq-2',
    category: 'Submissions & Artifacts',
    question: 'Can I edit my project deliverables after submitting?',
    answer:
      'Yes, you can edit your title, tagline, tech stack, repository URL, and demo deployment links at any time while the competition is in "SUBMISSION OPEN" status. Once the submission deadline closes or the competition enters "LOCKED" status, a final immutable cryptographic snapshot (SHA-256) is minted for judging integrity, and further modifications are locked.',
  },
  {
    id: 'faq-3',
    category: 'Cryptographic Security',
    question: 'What is a Cryptographic Submission Digest (SHA-256)?',
    answer:
      'Every locked submission on ATLYX creates a deterministic canonical JSON payload of your project metadata, repository commit hash, deployment link, and roster members. This payload is hashed with SHA-256 to create an immutable tamper-evident snapshot. Judges and participants can independently verify that the evaluated project matches the exact artifacts locked at deadline.',
  },
  {
    id: 'faq-4',
    category: 'AI Jury & Evaluation',
    question: 'How does the Autonomous AI Jury evaluate problem statements?',
    answer:
      'ATLYX employs multi-agent LLM evaluation suites alongside human judges. The AI Jury evaluates automated test suite outputs, code repository structure, documentation verifiability, and rubrics alignment to assign score breakdowns. Normalized composite scores balance human judge variance to ensure transparent and objective final leaderboard standings.',
  },
  {
    id: 'faq-5',
    category: 'Credentials & Certificates',
    question: 'Where can I find and share my verifiable certificate?',
    answer:
      'Upon completion of a registered event, your completion and award certificates are minted under your "Certificates" dashboard. Each credential includes a QR code, verification slug, and cryptographic signature. You can embed the credential link directly into your LinkedIn profile, resume, or GitHub profile.',
  },
  {
    id: 'faq-6',
    category: 'Registration & Eligibility',
    question: 'Can I participate in multiple hackathons simultaneously?',
    answer:
      'Yes! Your ATLYX participant account enables you to register for multiple simultaneous competitions across different tracks. You can form dedicated teams for each event and track submissions individually inside your Participant Workspace.',
  },
];

const KNOWLEDGE_CATEGORIES = [
  {
    title: 'Getting Started & Registration',
    description: 'Account onboarding, participant profile setup, and joining global hackathons.',
    articlesCount: 8,
    icon: BookOpen,
    tag: 'Beginners',
  },
  {
    title: 'Teams & Squad Management',
    description: 'Creating teams, generating invite codes, organizer custom forms, and member removal.',
    articlesCount: 12,
    icon: Users,
    tag: 'Collaboration',
  },
  {
    title: 'Project Workspaces & Artifacts',
    description: 'Configuring problem statement alignments, GitHub repositories, and live demo links.',
    articlesCount: 15,
    icon: Layers,
    tag: 'Development',
  },
  {
    title: 'Cryptographic Snapshots & Digests',
    description: 'SHA-256 hash generation, tamper-proof audit trails, and submission locking.',
    articlesCount: 6,
    icon: ShieldCheck,
    tag: 'Security',
  },
  {
    title: 'Judging Rubrics & Autonomous AI Jury',
    description: 'Score normalization, peer reviews, criteria breakdowns, and leaderboard calculation.',
    articlesCount: 10,
    icon: Cpu,
    tag: 'Evaluation',
  },
  {
    title: 'Certificates & Verifiable Credentials',
    description: 'Claiming cryptographic credentials, QR code verification, and LinkedIn sharing.',
    articlesCount: 7,
    icon: Award,
    tag: 'Credentials',
  },
];

export default function HelpCenterPage() {
  const { currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [openFaqId, setOpenFaqId] = useState<string | null>('faq-1');

  const toggleFaq = (id: string) => {
    setOpenFaqId((prev) => (prev === id ? null : id));
  };

  const categories = ['All', 'Teams & Rosters', 'Submissions & Artifacts', 'Cryptographic Security', 'AI Jury & Evaluation', 'Credentials & Certificates'];

  const filteredFaqs = useMemo(() => {
    return FAQS.filter((faq) => {
      const matchesCategory = selectedCategory === 'All' || faq.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        faq.question.toLowerCase().includes(q) ||
        faq.answer.toLowerCase().includes(q) ||
        faq.category.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [searchQuery, selectedCategory]);

  return (
    <AppShell
      showFeaturedRail={true}
      pageTitle="ATLYX Help Center & Knowledge Base"
      pageSubtitle="Documentation, step-by-step onboarding guides, FAQs, and rules for builders, organizers, and judges."
    >
      <div className="space-y-8 select-none max-w-[1440px] mx-auto pb-16">
        {/* ================= 1. HEADER SECTION ================= */}
        <div>
          {/* Top Orange Accent Bar */}
          <div className="w-10 h-1 bg-[#FA541C] rounded-full mb-3" />

          {/* Badges */}
          <div className="flex items-center space-x-2 mb-2">
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#FFE8D6] text-[#FA541C] text-[11px] font-bold border border-[#FED7AA]/60">
              <HelpCircle className="w-3.5 h-3.5 text-[#FA541C]" />
              <span>Self-Service Documentation</span>
            </span>
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#F3F4F6] text-[#4B5563] text-[11px] font-medium border border-[#E5E7EB]">
              <Sparkles className="w-3.5 h-3.5 text-[#6B7280]" />
              <span>Updated for 2026 Arena</span>
            </span>
          </div>

          <h1 className="text-2xl sm:text-[34px] font-extrabold text-[#18181B] tracking-tight leading-tight">
            ATLYX Help Center &amp; Guides
          </h1>
          <p className="text-xs sm:text-[14px] text-[#6B7280] font-normal mt-1 leading-relaxed max-w-3xl">
            Everything you need to know about competing, team formation, automated rubric scoring, cryptographic snapshot integrity, and verifiable credentials.
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
                  You are browsing platform documentation while authenticated with{' '}
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

        {/* ================= 2. SEARCH BAR ================= */}
        <div className="bg-gradient-to-br from-[#FFF9F5] via-[#FFF3EC] to-[#FFEFE4] border border-[#FED7AA]/80 rounded-2xl p-6 sm:p-8 shadow-xs relative overflow-hidden">
          <div className="max-w-2xl relative z-10">
            <h2 className="text-base sm:text-lg font-black text-[#18181B] tracking-tight mb-1">
              Search Documentation &amp; Instant Answers
            </h2>
            <p className="text-xs text-[#6B7280] mb-4">
              Type keywords like "invite code", "SHA-256", "AI jury", "certificate", or "tracks"...
            </p>

            <div className="relative">
              <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="How can we help you today? Search knowledge base..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border border-[#E5E0D8] hover:border-[#CBD5E1] rounded-xl text-xs sm:text-sm text-[#18181B] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#FA541C]/20 focus:border-[#FA541C] shadow-sm transition-all"
              />
            </div>
          </div>
        </div>

        {/* ================= 3. 6 TOPIC CATEGORY CARDS ================= */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <span className="w-1.5 h-5 bg-[#FA541C] rounded-full inline-block" />
            <h2 className="text-base sm:text-[18px] font-extrabold text-[#18181B] tracking-tight">
              Browse Knowledge Categories
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {KNOWLEDGE_CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              return (
                <div
                  key={cat.title}
                  className="bg-white border border-[#E5E0D8] hover:border-[#CBD5E1] rounded-2xl p-6 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group cursor-pointer"
                >
                  <div>
                    <div className="flex items-center justify-between pb-3">
                      <div className="w-10 h-10 rounded-xl bg-[#FFE8D6] text-[#FA541C] flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-[10.5px] font-bold px-2.5 py-0.5 rounded-full bg-[#FAF8F5] text-[#6B7280] border border-[#E5E0D8]">
                        {cat.tag}
                      </span>
                    </div>

                    <h3 className="text-base font-extrabold text-[#18181B] group-hover:text-[#FA541C] transition-colors mt-1">
                      {cat.title}
                    </h3>
                    <p className="text-xs text-[#6B7280] mt-1.5 leading-relaxed font-normal">
                      {cat.description}
                    </p>
                  </div>

                  <div className="pt-4 mt-3 border-t border-[#F4EFEA] flex items-center justify-between text-xs">
                    <span className="text-[11px] font-bold text-[#9CA3AF]">
                      {cat.articlesCount} Articles
                    </span>
                    <span className="font-bold text-[#FA541C] flex items-center space-x-1 group-hover:translate-x-1 transition-transform">
                      <span>Explore</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ================= 4. FREQUENTLY ASKED QUESTIONS (ACCORDION) ================= */}
        <div className="space-y-4 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <span className="w-1.5 h-5 bg-[#FA541C] rounded-full inline-block" />
              <h2 className="text-base sm:text-[18px] font-extrabold text-[#18181B] tracking-tight">
                Frequently Asked Questions
              </h2>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-1.5">
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setSelectedCategory(c)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    selectedCategory === c
                      ? 'bg-[#FA541C] text-white shadow-xs'
                      : 'bg-[#FAF8F5] text-[#6B7280] hover:text-[#18181B] border border-[#E5E0D8]'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {filteredFaqs.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#6B7280] bg-white border border-[#E5E0D8] rounded-2xl">
                No questions found matching your search.
              </div>
            ) : (
              filteredFaqs.map((faq) => {
                const isOpen = openFaqId === faq.id;
                return (
                  <div
                    key={faq.id}
                    className={`bg-white border rounded-2xl transition-all duration-200 overflow-hidden ${
                      isOpen
                        ? 'border-[#FA541C]/50 shadow-sm'
                        : 'border-[#E5E0D8] hover:border-[#CBD5E1]'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleFaq(faq.id)}
                      className="w-full px-5 py-4 text-left flex items-center justify-between gap-3 cursor-pointer"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="w-2 h-2 rounded-full bg-[#FA541C] flex-shrink-0" />
                        <span className="text-sm font-extrabold text-[#18181B]">{faq.question}</span>
                      </div>
                      <ChevronDown
                        className={`w-4 h-4 text-[#9CA3AF] transition-transform duration-200 flex-shrink-0 ${
                          isOpen ? 'rotate-180 text-[#FA541C]' : ''
                        }`}
                      />
                    </button>

                    {isOpen && (
                      <div className="px-5 pb-5 pt-1 text-xs sm:text-[13px] text-[#4B5563] leading-relaxed border-t border-[#F4EFEA] animate-in fade-in duration-200">
                        <p>{faq.answer}</p>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ================= 5. STILL NEED HELP? CONTACT DESK ================= */}
        <div className="bg-white border border-[#E5E0D8] rounded-2xl p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 relative overflow-hidden">
          <div className="space-y-1.5 max-w-xl">
            <div className="flex items-center space-x-2 text-xs font-bold text-[#FA541C]">
              <MessageSquare className="w-4 h-4" />
              <span>24/7 SUPPORT AVAILABLE</span>
            </div>
            <h3 className="text-xl font-black text-[#18181B] tracking-tight">
              Can't find the answer you need?
            </h3>
            <p className="text-xs text-[#6B7280] leading-relaxed">
              Reach out directly to the ATLYX support engineering squad. We handle competition emergencies, squad capacity adjustments, and judge rubrics queries.
            </p>
          </div>

          <Link
            href="/contact"
            className="inline-flex items-center space-x-2 px-5 py-3 bg-gradient-to-r from-[#FA541C] to-[#E03A00] hover:from-[#EA4812] hover:to-[#C93300] text-white text-xs font-bold rounded-xl shadow-md shadow-[#FA541C]/25 hover:shadow-lg hover:shadow-[#FA541C]/35 hover:-translate-y-0.5 active:translate-y-0 transition-all flex-shrink-0 cursor-pointer group"
          >
            <Mail className="w-4 h-4" />
            <span>Contact Support Desk &rarr;</span>
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
