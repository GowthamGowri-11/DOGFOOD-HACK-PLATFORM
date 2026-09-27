'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Trophy,
  ArrowLeft,
  Calendar,
  Users,
  Building,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Layers,
  Award,
  Bold,
  Italic,
  Underline,
  FileText,
  Lightbulb,
} from 'lucide-react';

interface OrganizerContact {
  id?: string;
  name: string;
  contact: string;
}

interface CriterionItem {
  id?: string;
  name: string;
  maxMarks: number;
  description: string;
}

interface EvaluationRound {
  id?: string;
  name: string;
  isFinal: boolean;
  roundType: string;
  startDate: string;
  endDate: string;
  submissionDeadline: string;
  maxTeamsAllowed: number;
  requiredSubmissions: {
    github: boolean;
    ppt: boolean;
    video: boolean;
    document: boolean;
    techStack: boolean;
  };
  termsAndConditions: string;
  criteria: CriterionItem[];
}

interface ProblemStatementItem {
  track: string;
  code: string;
  title: string;
  description: string;
}

const DEPARTMENTS = [
  'AI&DS - Artificial Intelligence & Data Science',
  'AIML - Artificial Intelligence & Machine Learning',
  'CSE - Computer Science & Engineering',
  'IT - Information Technology',
  'ECE - Electronics & Communication Engineering',
  'EEE - Electrical & Electronics Engineering',
  'MECH - Mechanical Engineering',
  'CIVIL - Civil Engineering',
  'General / Cross-Department',
];

export default function OrganizerCreateHackathonPage() {
  const router = useRouter();
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dynamic date helpers
  const now = new Date();
  const formatForInput = (d: Date) => d.toISOString().slice(0, 16);
  const addDays = (d: Date, days: number) => new Date(d.getTime() + days * 86400000);

  // Formatter for "Selected: 16 Aug 2026 06:00 AM" display
  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '';
      const day = d.getDate();
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = monthNames[d.getMonth()];
      const year = d.getFullYear();
      let hours = d.getHours();
      const minutes = d.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      const formattedHours = hours.toString().padStart(2, '0');
      return `Selected: ${day} ${month} ${year} ${formattedHours}:${minutes} ${ampm}`;
    } catch {
      return '';
    }
  };

  // Section 1: Event Details
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [tagline, setTagline] = useState('');
  const [prizePool, setPrizePool] = useState<number | string>('');
  const [currency, setCurrency] = useState('USD');
  const [description, setDescription] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [organizationName, setOrganizationName] = useState('');

  // Organizers list
  const [organizers, setOrganizers] = useState<OrganizerContact[]>([
    { name: '', contact: '' },
  ]);

  // Departments
  const [primaryDept, setPrimaryDept] = useState(DEPARTMENTS[0]);
  const [collabDepts, setCollabDepts] = useState<string[]>([]);

  // Section 2: Team Settings & Rules
  const [minTeamSize, setMinTeamSize] = useState<number>(2);
  const [maxTeamSize, setMaxTeamSize] = useState<number>(4);
  const [maxTeamsAllowed, setMaxTeamsAllowed] = useState<string>('');
  const [yearCriteria, setYearCriteria] = useState({
    year1: { min: 0, max: 4 },
    year2: { min: 0, max: 4 },
    year3: { min: 0, max: 4 },
    year4: { min: 0, max: 4 },
  });

  // Section 3: Important Details
  const [registrationDeadline, setRegistrationDeadline] = useState(formatForInput(addDays(now, 7)));

  // Section 4: Evaluation Rounds
  const [rounds, setRounds] = useState<EvaluationRound[]>([
    {
      name: 'The Qualifiers',
      isFinal: false,
      roundType: 'Mock Hackathon',
      startDate: formatForInput(addDays(now, 8)),
      endDate: formatForInput(addDays(now, 10)),
      submissionDeadline: formatForInput(addDays(now, 10)),
      maxTeamsAllowed: 60,
      requiredSubmissions: {
        github: true,
        ppt: false,
        video: false,
        document: false,
        techStack: true,
      },
      termsAndConditions:
        'Missing URL Check: Teams without a GitHub URL are immediately disqualified.\nCommit Time Check: Late commits lead to disqualification.\nCode Extraction: The full repository ZIP is downloaded for analysis.\nAI Analysis: The AI evaluates code quality, architecture, security, and innovation.',
      criteria: [
        { name: 'Innovation & Idea', maxMarks: 25, description: 'Originality of the idea and relevance of problem statement' },
        { name: 'Technical Implementation', maxMarks: 25, description: 'Code quality, architecture, technology usage and functionality' },
        { name: 'UI/UX Design', maxMarks: 20, description: 'User experience, visual appeal, usability, and accessibility' },
        { name: 'Presentation & Pitch', maxMarks: 15, description: 'Communication, live demonstration, documentation' },
        { name: 'Business Impact & Feasibility', maxMarks: 15, description: 'Real-world usefulness and deployment potential' },
      ],
    },
    {
      name: 'The Grand Finale',
      isFinal: true,
      roundType: 'Hackathon',
      startDate: formatForInput(addDays(now, 10)),
      endDate: formatForInput(addDays(now, 12)),
      submissionDeadline: formatForInput(addDays(now, 11)),
      maxTeamsAllowed: 20,
      requiredSubmissions: {
        github: true,
        ppt: true,
        video: true,
        document: false,
        techStack: true,
      },
      termsAndConditions:
        'Teams must present live before the evaluation panel.\nWorking prototype deployment is mandatory for final scoring.',
      criteria: [
        { name: 'Core Innovation', maxMarks: 30, description: 'Breakthrough capability and novelty' },
        { name: 'Production Readiness', maxMarks: 30, description: 'Scalability, resilience, and code quality' },
        { name: 'Product Polish', maxMarks: 20, description: 'Visual finesse and design execution' },
        { name: 'Pitch Delivery', maxMarks: 20, description: 'Clarity and response to jury questions' },
      ],
    },
  ]);

  // Section 5: Problem Statements
  const [problemStatements, setProblemStatements] = useState<ProblemStatementItem[]>([
    {
      track: 'Artificial Intelligence & Agents',
      code: 'PS-01',
      title: 'Autonomous Multi-Agent Enterprise Automation',
      description: 'Build a coordinated multi-agent workflow that solves enterprise data synthesis and pipeline remediation.',
    },
  ]);

  // Slug generator
  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!slug || slug === title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')) {
      setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
    }
  };

  // Description Rich Text Toolbar Handlers
  const handleFormatText = (prefix: string, suffix: string = prefix) => {
    const textarea = descriptionRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentVal = textarea.value;
    const selectedText = currentVal.substring(start, end);

    const replacement = `${prefix}${selectedText || 'text'}${suffix}`;
    const newVal = currentVal.substring(0, start) + replacement + currentVal.substring(end);
    setDescription(newVal);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + (selectedText.length || 4));
    }, 0);
  };

  // Organizers Handlers
  const addOrganizer = () => {
    setOrganizers([...organizers, { name: '', contact: '' }]);
  };

  const removeOrganizer = (index: number) => {
    setOrganizers(organizers.filter((_, i) => i !== index));
  };

  const updateOrganizer = (index: number, field: 'name' | 'contact', value: string) => {
    const updated = [...organizers];
    updated[index][field] = value;
    setOrganizers(updated);
  };

  // Collaborating Departments Handlers
  const addCollabDept = () => {
    setCollabDepts([...collabDepts, DEPARTMENTS[1]]);
  };

  const removeCollabDept = (index: number) => {
    setCollabDepts(collabDepts.filter((_, i) => i !== index));
  };

  const updateCollabDept = (index: number, value: string) => {
    const updated = [...collabDepts];
    updated[index] = value;
    setCollabDepts(updated);
  };

  // Rounds Handlers
  const addRound = () => {
    const lastRound = rounds[rounds.length - 1];
    const newStart = lastRound ? lastRound.endDate : formatForInput(addDays(now, 12));
    const newEnd = formatForInput(addDays(new Date(newStart), 2));

    setRounds([
      ...rounds,
      {
        name: `Round ${rounds.length + 1}`,
        isFinal: false,
        roundType: 'Hackathon',
        startDate: newStart,
        endDate: newEnd,
        submissionDeadline: newEnd,
        maxTeamsAllowed: 50,
        requiredSubmissions: {
          github: true,
          ppt: true,
          video: false,
          document: false,
          techStack: true,
        },
        termsAndConditions: 'All code must be original and built during the allocated hackathon round window.',
        criteria: [
          { name: 'Innovation & Idea', maxMarks: 50, description: 'Novelty and relevance' },
          { name: 'Implementation', maxMarks: 50, description: 'Code quality and completeness' },
        ],
      },
    ]);
  };

  const removeRound = (roundIndex: number) => {
    setRounds(rounds.filter((_, i) => i !== roundIndex));
  };

  const updateRound = (roundIndex: number, field: keyof EvaluationRound, value: any) => {
    const updated = [...rounds];
    updated[roundIndex] = { ...updated[roundIndex], [field]: value };
    setRounds(updated);
  };

  const addCriterion = (roundIndex: number) => {
    const updated = [...rounds];
    updated[roundIndex].criteria.push({
      name: '',
      maxMarks: 20,
      description: '',
    });
    setRounds(updated);
  };

  const removeCriterion = (roundIndex: number, critIndex: number) => {
    const updated = [...rounds];
    updated[roundIndex].criteria = updated[roundIndex].criteria.filter((_, i) => i !== critIndex);
    setRounds(updated);
  };

  const updateCriterion = (roundIndex: number, critIndex: number, field: keyof CriterionItem, value: any) => {
    const updated = [...rounds];
    updated[roundIndex].criteria[critIndex] = {
      ...updated[roundIndex].criteria[critIndex],
      [field]: value,
    };
    setRounds(updated);
  };

  // Problem Statements Handlers
  const addProblemStatement = () => {
    setProblemStatements([
      ...problemStatements,
      {
        track: 'General Innovation',
        code: `PS-0${problemStatements.length + 1}`,
        title: '',
        description: '',
      },
    ]);
  };

  const removeProblemStatement = (index: number) => {
    setProblemStatements(problemStatements.filter((_, i) => i !== index));
  };

  const updateProblemStatement = (index: number, field: keyof ProblemStatementItem, value: string) => {
    const updated = [...problemStatements];
    updated[index] = { ...updated[index], [field]: value };
    setProblemStatements(updated);
  };

  // Form Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!title.trim()) {
      setError('Please provide a hackathon title');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (!description.trim() || description.trim().length < 20) {
      setError('Please enter a description with at least 20 characters');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (!registrationDeadline) {
      setError('Please set a registration deadline');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setSaving(true);

    try {
      const cleanedOrganizers = organizers.filter((o) => o.name.trim() !== '');

      const extendedConfig = {
        organizers: cleanedOrganizers.length > 0 ? cleanedOrganizers : [{ name: 'Event Coordinator', contact: 'coordinator@platform.dev' }],
        primaryDepartment: primaryDept,
        collaboratingDepartments: collabDepts,
        maxTeamsAllowed: maxTeamsAllowed ? Number(maxTeamsAllowed) : null,
        yearCriteria,
        rounds,
        problemStatements: problemStatements.filter((p) => p.title.trim() !== ''),
        prizePool: Number(prizePool) || 0,
        currency,
      };

      // Determine chronological event dates based on rounds and registration
      const regStart = new Date(Date.now() - 60000);
      const regEnd = new Date(registrationDeadline);

      const firstRound = rounds[0];
      const lastRound = rounds[rounds.length - 1];

      const eventStart = firstRound && firstRound.startDate
        ? new Date(firstRound.startDate)
        : addDays(regEnd, 1);

      const eventEnd = lastRound && lastRound.endDate
        ? new Date(lastRound.endDate)
        : addDays(eventStart, 3);

      const subStart = eventStart;
      const subEnd = lastRound && lastRound.submissionDeadline
        ? new Date(lastRound.submissionDeadline)
        : eventEnd;

      const judgingStart = subEnd;
      const judgingEnd = eventEnd;

      const payload = {
        title: title.trim(),
        slug: (slug || title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        tagline: tagline.trim() || undefined,
        description: description.trim(),
        organizationName: organizationName.trim() || 'ATLYX Enterprise Platform',
        bannerUrl: bannerUrl.trim() || null,
        minTeamSize: Number(minTeamSize),
        maxTeamSize: Number(maxTeamSize),
        regStartTime: regStart.toISOString(),
        regEndTime: regEnd.toISOString(),
        eventStartTime: eventStart.toISOString(),
        eventEndTime: eventEnd.toISOString(),
        subStartTime: subStart.toISOString(),
        subEndTime: subEnd.toISOString(),
        judgingStartTime: judgingStart.toISOString(),
        judgingEndTime: judgingEnd.toISOString(),
        prizePool: Number(prizePool) || 0,
        currency,
        rulesAndGuidelines: JSON.stringify(extendedConfig),
      };

      const res = await fetch('/api/v1/hackathons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        router.push('/organizer/hackathons');
      } else {
        setError(data.error?.message || 'Failed to create hackathon');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch {
      setError('An unexpected network error occurred while creating the hackathon.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16 select-none">
      {/* Breadcrumb Bar Matching Site UI */}
      <nav className="flex items-center space-x-2 text-xs text-[#64748b] font-medium">
        <Link href="/" className="hover:text-[#2563eb] transition-colors">
          Home
        </Link>
        <span>&rsaquo;</span>
        <Link href="/organizer/dashboard" className="hover:text-[#2563eb] transition-colors">
          Organizer
        </Link>
        <span>&rsaquo;</span>
        <Link href="/organizer/hackathons" className="hover:text-[#2563eb] transition-colors">
          Hackathons
        </Link>
        <span>&rsaquo;</span>
        <span className="text-[#0f172a] font-semibold">Create Hackathon</span>
      </nav>

      {/* Top Header Matching Site UI */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <Link
            href="/organizer/hackathons"
            className="inline-flex items-center text-xs font-semibold text-[#64748b] hover:text-[#2563eb] mb-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            Back to Hackathon Management
          </Link>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#eff6ff] flex items-center justify-center text-[#2563eb] flex-shrink-0 mt-0.5 border border-[#dbeafe]">
              <Trophy className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0f172a] tracking-tight">
                Create Hackathon
              </h1>
              <p className="text-xs text-[#64748b] mt-1 font-normal">
                Configure details, team criteria, and evaluation rounds for a new arena.
              </p>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-[#fef2f2] border border-[#fecaca] rounded-2xl text-xs text-[#dc2626] flex items-center space-x-2 shadow-xs">
          <AlertCircle className="w-4 h-4 text-[#dc2626] flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ======================================================== */}
        {/* SECTION 1: EVENT DETAILS */}
        {/* ======================================================== */}
        <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 shadow-xs space-y-5">
          <div className="border-b border-[#f1f5f9] pb-3">
            <h2 className="text-base font-extrabold text-[#0f172a]">Event Details</h2>
            <p className="text-xs text-[#64748b]">Core hackathon information, branding, and prize allocation.</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#334155]">
              Hackathon Title*
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="e.g. ATLYX Global AI Hackathon 2026"
              className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#e2e8f0] rounded-xl focus:outline-none focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/10 text-[#0f172a] font-medium transition-all placeholder:text-[#94a3b8]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#334155]">
              Tagline
            </label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="e.g. Building Intelligent Agents for Tomorrow"
              className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#e2e8f0] rounded-xl focus:outline-none focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/10 text-[#0f172a] font-medium transition-all placeholder:text-[#94a3b8]"
            />
          </div>

          {/* Integrated Prize Pool Option */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#334155] flex items-center space-x-1.5">
              <span>Prize Pool</span>
              <span className="text-[10px] font-normal text-[#64748b]">(Global platform reward incentive)</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="sm:col-span-3 relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#64748b]">
                  {currency === 'USD' ? '$' : currency === 'INR' ? '₹' : currency === 'EUR' ? '€' : '£'}
                </span>
                <input
                  type="number"
                  min="0"
                  value={prizePool}
                  onChange={(e) => setPrizePool(e.target.value)}
                  placeholder="e.g. 50000"
                  className="w-full pl-8 pr-3.5 py-2.5 text-xs bg-white border border-[#e2e8f0] rounded-xl focus:outline-none focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/10 text-[#0f172a] font-bold placeholder:text-[#94a3b8]"
                />
              </div>
              <div>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs bg-white border border-[#e2e8f0] rounded-xl focus:outline-none focus:border-[#2563eb] text-[#334155] font-semibold"
                >
                  <option value="USD">USD ($)</option>
                  <option value="INR">INR (₹)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>
            </div>
            <p className="text-[11px] text-[#64748b]">
              This total prize pool amount is showcased on competition cards and leaderboard rewards.
            </p>
          </div>

          {/* Organizers List */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#334155]">
                Organizers*
              </label>
              <button
                type="button"
                onClick={addOrganizer}
                className="inline-flex items-center gap-1 text-xs font-bold text-[#2563eb] hover:text-[#1d4ed8] transition-colors"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Add Organizer</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {organizers.map((org, idx) => (
                <div
                  key={idx}
                  className="flex items-center space-x-3 p-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl"
                >
                  <div className="flex-1 space-y-1">
                    <span className="text-[10px] font-bold text-[#64748b] uppercase">NAME*</span>
                    <input
                      type="text"
                      required
                      value={org.name}
                      onChange={(e) => updateOrganizer(idx, 'name', e.target.value)}
                      placeholder="e.g. Dr. Alex Mercer"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#2563eb] placeholder:text-[#94a3b8]"
                    />
                  </div>
                  <div className="flex-1 space-y-1">
                    <span className="text-[10px] font-bold text-[#64748b] uppercase">CONTACT</span>
                    <input
                      type="text"
                      value={org.contact}
                      onChange={(e) => updateOrganizer(idx, 'contact', e.target.value)}
                      placeholder="e.g. +1 555-0199 or alex@atlyx.edu"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#2563eb] placeholder:text-[#94a3b8]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeOrganizer(idx)}
                    disabled={organizers.length <= 1}
                    className="self-end p-2 text-[#dc2626] hover:bg-[#fef2f2] rounded-lg transition-colors disabled:opacity-40"
                    title="Remove Organizer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Description with Functional Rich Text Toolbar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#334155]">
                Description* (min 20 characters)
              </label>
              <div className="flex items-center space-x-1 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={() => handleFormatText('**', '**')}
                  className="p-1 hover:bg-[#e2e8f0] rounded text-[#64748b] hover:text-[#0f172a] text-xs font-bold transition-colors"
                  title="Bold (Markdown **text**)"
                >
                  <Bold className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleFormatText('*', '*')}
                  className="p-1 hover:bg-[#e2e8f0] rounded text-[#64748b] hover:text-[#0f172a] text-xs italic transition-colors"
                  title="Italic (Markdown *text*)"
                >
                  <Italic className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleFormatText('<u>', '</u>')}
                  className="p-1 hover:bg-[#e2e8f0] rounded text-[#64748b] hover:text-[#0f172a] text-xs underline transition-colors"
                  title="Underline (<u>text</u>)"
                >
                  <Underline className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <textarea
              ref={descriptionRef}
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the hackathon objectives, technical challenges, eligibility criteria, and submission rules..."
              className="w-full p-3 text-xs bg-white border border-[#e2e8f0] rounded-xl focus:outline-none focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/10 text-[#0f172a] placeholder:text-[#94a3b8]"
            />
            <div className="flex justify-end text-[10px] text-[#64748b]">
              <span>{description.length} / 20 characters min</span>
            </div>
          </div>

          {/* Banner Preview */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#334155]">Banner Image Preview</label>
            <div className="w-full bg-gradient-to-br from-[#eff6ff] to-[#f8fafc] border-2 border-dashed border-[#bfdbfe] rounded-2xl p-8 text-center flex flex-col items-center justify-center min-h-[140px]">
              {bannerUrl ? (
                <div className="w-full h-36 relative rounded-xl overflow-hidden">
                  <img src={bannerUrl} alt="Banner Preview" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="space-y-1">
                  <h3 className="text-2xl sm:text-3xl font-black text-[#1e40af] tracking-tight uppercase font-sans">
                    {title || 'HACKATHON TITLE'}
                  </h3>
                  <p className="text-xs text-[#2563eb] font-mono font-semibold">
                    {tagline || 'Tagline will appear here'}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-[#64748b]">Banner Image URL (Optional)</span>
              <input
                type="url"
                value={bannerUrl}
                onChange={(e) => setBannerUrl(e.target.value)}
                placeholder="https://images.unsplash.com/... or /banners/banner.png"
                className="w-full px-3 py-2 text-xs bg-white border border-[#e2e8f0] rounded-xl focus:outline-none focus:border-[#2563eb] placeholder:text-[#94a3b8]"
              />
            </div>
          </div>

          {/* Organization Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#334155]">Organization Name</label>
            <input
              type="text"
              value={organizationName}
              onChange={(e) => setOrganizationName(e.target.value)}
              placeholder="e.g. ATLYX Enterprise Institute"
              className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#e2e8f0] rounded-xl focus:outline-none focus:border-[#2563eb] placeholder:text-[#94a3b8]"
            />
          </div>

          {/* Primary Department */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#334155]">
              Primary Department*
            </label>
            <select
              value={primaryDept}
              onChange={(e) => setPrimaryDept(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#e2e8f0] rounded-xl focus:outline-none focus:border-[#2563eb] text-[#0f172a] font-semibold"
            >
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          {/* Collaborating Departments */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#334155]">
                Collaborating Departments
              </label>
              <button
                type="button"
                onClick={addCollabDept}
                className="inline-flex items-center gap-1 text-xs font-bold text-[#2563eb] hover:text-[#1d4ed8]"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Add Collab</span>
              </button>
            </div>

            <div className="space-y-2">
              {collabDepts.map((collab, idx) => (
                <div
                  key={idx}
                  className="flex items-center space-x-2 p-2.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl"
                >
                  <select
                    value={collab}
                    onChange={(e) => updateCollabDept(idx, e.target.value)}
                    className="flex-1 px-3 py-1.5 text-xs bg-white border border-[#e2e8f0] rounded-lg focus:outline-none text-[#0f172a] font-medium"
                  >
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => removeCollabDept(idx)}
                    className="p-1.5 text-[#dc2626] hover:bg-[#fef2f2] rounded-lg"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* SECTION 2: TEAM SETTINGS & RULES */}
        {/* ======================================================== */}
        <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 shadow-xs space-y-5">
          <div className="border-b border-[#f1f5f9] pb-3 flex items-center space-x-2">
            <Users className="w-4 h-4 text-[#2563eb]" />
            <h2 className="text-base font-extrabold text-[#0f172a]">Team Settings & Rules</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#334155]">Min Team Size</label>
              <input
                type="number"
                min="1"
                max={maxTeamSize}
                value={minTeamSize}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setMinTeamSize(val);
                  if (val > maxTeamSize) setMaxTeamSize(val);
                }}
                className="w-full px-3.5 py-2 text-xs bg-white border border-[#e2e8f0] rounded-xl focus:outline-none focus:border-[#2563eb]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#334155]">Max Team Size</label>
              <input
                type="number"
                min={minTeamSize}
                max="20"
                value={maxTeamSize}
                onChange={(e) => setMaxTeamSize(Number(e.target.value))}
                className="w-full px-3.5 py-2 text-xs bg-white border border-[#e2e8f0] rounded-xl focus:outline-none focus:border-[#2563eb]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#334155]">Max Teams Allowed (Overall)</label>
              <input
                type="text"
                value={maxTeamsAllowed}
                onChange={(e) => setMaxTeamsAllowed(e.target.value)}
                placeholder="e.g. 100 (Blank = Unlimited)"
                className="w-full px-3.5 py-2 text-xs bg-white border border-[#e2e8f0] rounded-xl focus:outline-none focus:border-[#2563eb] placeholder:text-[#94a3b8]"
              />
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <label className="text-xs font-bold text-[#334155] block">
              Team Member Criteria (Year-wise Restrictions)
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {(['year1', 'year2', 'year3', 'year4'] as const).map((yr, idx) => {
                const yearLabel = `Year ${idx + 1}`;
                return (
                  <div
                    key={yr}
                    className="p-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl space-y-2"
                  >
                    <div className="flex items-center justify-between pb-1 border-b border-[#e2e8f0]">
                      <span className="text-xs font-bold text-[#0f172a]">{yearLabel}</span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-[#64748b] uppercase">AT LEAST (MIN)</span>
                      <input
                        type="number"
                        min="0"
                        value={yearCriteria[yr].min}
                        onChange={(e) =>
                          setYearCriteria({
                            ...yearCriteria,
                            [yr]: { ...yearCriteria[yr], min: Number(e.target.value) },
                          })
                        }
                        className="w-full px-2.5 py-1 text-xs bg-white border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#2563eb]"
                      />
                    </div>

                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-[#64748b] uppercase">AT MOST (MAX)</span>
                      <input
                        type="number"
                        min="0"
                        value={yearCriteria[yr].max}
                        onChange={(e) =>
                          setYearCriteria({
                            ...yearCriteria,
                            [yr]: { ...yearCriteria[yr], max: Number(e.target.value) },
                          })
                        }
                        className="w-full px-2.5 py-1 text-xs bg-white border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#2563eb]"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* SECTION 3: IMPORTANT DETAILS */}
        {/* ======================================================== */}
        <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 shadow-xs space-y-4">
          <div className="border-b border-[#f1f5f9] pb-3 flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-[#2563eb]" />
            <div>
              <h2 className="text-base font-extrabold text-[#0f172a]">Important Details</h2>
              <p className="text-xs text-[#64748b]">
                Set the overall registration and hackathon submission deadlines, and team criteria.
              </p>
            </div>
          </div>

          <div className="space-y-1.5 max-w-md">
            <label className="text-xs font-bold text-[#334155]">Registration Deadline*</label>
            <input
              type="datetime-local"
              required
              value={registrationDeadline}
              onChange={(e) => setRegistrationDeadline(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#e2e8f0] rounded-xl focus:outline-none focus:border-[#2563eb]"
            />
            {registrationDeadline && (
              <span className="text-[11px] font-medium text-[#2563eb] block pt-0.5">
                {formatDateDisplay(registrationDeadline)}
              </span>
            )}
          </div>
        </div>

        {/* ======================================================== */}
        {/* SECTION 4: EVALUATION ROUNDS */}
        {/* ======================================================== */}
        <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#f1f5f9] gap-2">
            <div className="flex items-center space-x-2">
              <Layers className="w-4 h-4 text-[#2563eb]" />
              <div>
                <h2 className="text-base font-extrabold text-[#0f172a]">Evaluation Rounds</h2>
                <p className="text-xs text-[#64748b]">
                  Define the sequence of evaluation rounds and their specific problem statements.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={addRound}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-[#2563eb] bg-[#eff6ff] border border-[#dbeafe] hover:bg-[#dbeafe]/50 rounded-xl shadow-xs transition-colors self-start sm:self-auto cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Add Round</span>
            </button>
          </div>

          <div className="space-y-6">
            {rounds.map((round, rIdx) => {
              const totalMarks = round.criteria.reduce((sum, c) => sum + Number(c.maxMarks || 0), 0);

              return (
                <div
                  key={rIdx}
                  className="bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl p-5 space-y-5 relative shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-[#2563eb] bg-[#eff6ff] px-2.5 py-0.5 rounded-full border border-[#dbeafe]">
                        Round {rIdx + 1}
                      </span>
                      {round.isFinal && (
                        <span className="text-[10px] font-bold text-[#d97706] bg-[#fef3c7] px-2.5 py-0.5 rounded-full border border-[#fde68a]">
                          FINALE
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => removeRound(rIdx)}
                      disabled={rounds.length <= 1}
                      className="p-1.5 text-[#dc2626] hover:bg-[#fee2e2] rounded-lg transition-colors disabled:opacity-30 cursor-pointer"
                      title="Delete Round"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-[#64748b] uppercase">ROUND NAME</span>
                        <label className="flex items-center space-x-1.5 cursor-pointer">
                          <span className="text-[10px] font-bold text-[#64748b] uppercase">FINAL ROUND</span>
                          <input
                            type="checkbox"
                            checked={round.isFinal}
                            onChange={(e) => updateRound(rIdx, 'isFinal', e.target.checked)}
                            className="rounded text-[#2563eb] focus:ring-[#2563eb] cursor-pointer"
                          />
                        </label>
                      </div>
                      <input
                        type="text"
                        value={round.name}
                        onChange={(e) => updateRound(rIdx, 'name', e.target.value)}
                        placeholder="e.g. The Qualifiers"
                        className="w-full px-3 py-2 text-xs bg-white border border-[#e2e8f0] rounded-xl font-semibold text-[#0f172a] focus:outline-none focus:border-[#2563eb]"
                      />
                    </div>

                    <div className="sm:col-span-2 space-y-1">
                      <span className="text-[10px] font-bold text-[#64748b] uppercase">ROUND TYPE</span>
                      <select
                        value={round.roundType}
                        onChange={(e) => updateRound(rIdx, 'roundType', e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-white border border-[#e2e8f0] rounded-xl focus:outline-none focus:border-[#2563eb] text-[#0f172a] font-semibold"
                      >
                        <option value="Mock Hackathon">Mock Hackathon</option>
                        <option value="Hackathon">Hackathon</option>
                        <option value="Ideation">Ideation</option>
                        <option value="Presentation">Presentation</option>
                        <option value="Coding Challenge">Coding Challenge</option>
                      </select>
                    </div>
                  </div>

                  {/* Start Date & End Date with formatted date display */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-[#64748b] uppercase">START DATE & TIME</span>
                      <input
                        type="datetime-local"
                        value={round.startDate}
                        onChange={(e) => updateRound(rIdx, 'startDate', e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-white border border-[#e2e8f0] rounded-xl focus:outline-none focus:border-[#2563eb]"
                      />
                      {round.startDate && (
                        <span className="text-[10px] text-[#64748b] block">
                          {formatDateDisplay(round.startDate)}
                        </span>
                      )}
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-[#64748b] uppercase">END DATE & TIME</span>
                      <input
                        type="datetime-local"
                        value={round.endDate}
                        onChange={(e) => updateRound(rIdx, 'endDate', e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-white border border-[#e2e8f0] rounded-xl focus:outline-none focus:border-[#2563eb]"
                      />
                      {round.endDate && (
                        <span className="text-[10px] text-[#64748b] block">
                          {formatDateDisplay(round.endDate)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-[#64748b] uppercase">SUBMISSION DEADLINE</span>
                      <input
                        type="datetime-local"
                        value={round.submissionDeadline}
                        onChange={(e) => updateRound(rIdx, 'submissionDeadline', e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-white border border-[#e2e8f0] rounded-xl focus:outline-none focus:border-[#2563eb]"
                      />
                      {round.submissionDeadline && (
                        <span className="text-[10px] text-[#64748b] block">
                          {formatDateDisplay(round.submissionDeadline)}
                        </span>
                      )}
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-[#64748b] uppercase">MAX TEAMS ALLOWED</span>
                      <input
                        type="number"
                        min="1"
                        value={round.maxTeamsAllowed}
                        onChange={(e) => updateRound(rIdx, 'maxTeamsAllowed', Number(e.target.value))}
                        className="w-full px-3 py-2 text-xs bg-white border border-[#e2e8f0] rounded-xl focus:outline-none focus:border-[#2563eb]"
                      />
                    </div>
                  </div>

                  <div className="p-3.5 bg-white border border-[#e2e8f0] rounded-xl space-y-2">
                    <span className="text-[10px] font-bold text-[#2563eb] uppercase tracking-wider block">
                      WHAT TO EVALUATE (REQUIRED SUBMISSIONS)
                    </span>
                    <p className="text-[11px] text-[#64748b]">
                      Tick what teams must upload for {round.name}. Project title and description are always required.
                    </p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {[
                        { key: 'github', label: 'GitHub link' },
                        { key: 'ppt', label: 'PPT link' },
                        { key: 'video', label: 'Video link' },
                        { key: 'document', label: 'Document link' },
                        { key: 'techStack', label: 'Tech stack' },
                      ].map((item) => {
                        const checked = (round.requiredSubmissions as any)[item.key];
                        return (
                          <button
                            key={item.key}
                            type="button"
                            onClick={() => {
                              const updatedReqs = {
                                ...round.requiredSubmissions,
                                [item.key]: !checked,
                              };
                              updateRound(rIdx, 'requiredSubmissions', updatedReqs);
                            }}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold border flex items-center space-x-1.5 transition-all cursor-pointer ${
                              checked
                                ? 'bg-[#2563eb] text-white border-[#2563eb] shadow-xs'
                                : 'bg-white text-[#64748b] border-[#e2e8f0] hover:bg-[#f8fafc]'
                            }`}
                          >
                            <span>{checked ? '✓' : '+'}</span>
                            <span>{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="p-3.5 bg-white border border-[#e2e8f0] rounded-xl space-y-1.5">
                    <span className="text-[10px] font-bold text-[#64748b] uppercase tracking-wider block">
                      TERMS & CONDITIONS
                    </span>
                    <p className="text-[11px] text-[#64748b]">
                      Shown to teams before they lock their problem statement. Each line becomes one bullet point. Leave empty to use the platform default rules.
                    </p>
                    <textarea
                      rows={3}
                      value={round.termsAndConditions}
                      onChange={(e) => updateRound(rIdx, 'termsAndConditions', e.target.value)}
                      placeholder="Specify terms, rules, and automatic disqualification criteria..."
                      className="w-full p-2.5 text-xs bg-white border border-[#e2e8f0] rounded-xl focus:outline-none focus:border-[#2563eb] text-[#0f172a]"
                    />
                  </div>

                  {/* Marking Criteria */}
                  <div className="p-3.5 bg-white border border-[#e2e8f0] rounded-xl space-y-3">
                    <div className="flex items-center justify-between pb-1 border-b border-[#f1f5f9]">
                      <div>
                        <span className="text-[10px] font-bold text-[#2563eb] uppercase tracking-wider flex items-center space-x-1">
                          <Award className="w-3.5 h-3.5 mr-1" />
                          JURY EVALUATION MARKING CRITERIA
                        </span>
                        <p className="text-[11px] text-[#64748b]">
                          Configure evaluation criteria names, descriptions, and max marks for {round.name}.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => addCriterion(rIdx)}
                        className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold text-white bg-[#2563eb] hover:bg-[#1d4ed8] rounded-xl shadow-xs transition-colors cursor-pointer"
                      >
                        <Plus className="w-3 h-3 stroke-[2.5]" />
                        <span>Add Criterion</span>
                      </button>
                    </div>

                    <div className="space-y-3">
                      {round.criteria.map((crit, cIdx) => (
                        <div
                          key={cIdx}
                          className="p-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl space-y-2 relative"
                        >
                          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                            <div className="sm:col-span-3 space-y-1">
                              <span className="text-[9px] font-bold text-[#64748b] uppercase">CRITERION NAME</span>
                              <input
                                type="text"
                                value={crit.name}
                                onChange={(e) => updateCriterion(rIdx, cIdx, 'name', e.target.value)}
                                placeholder="e.g. Technical Implementation"
                                className="w-full px-2.5 py-1 text-xs bg-white border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#2563eb]"
                              />
                            </div>
                            <div className="space-y-1">
                              <span className="text-[9px] font-bold text-[#64748b] uppercase">MAX MARKS</span>
                              <input
                                type="number"
                                min="1"
                                value={crit.maxMarks}
                                onChange={(e) => updateCriterion(rIdx, cIdx, 'maxMarks', Number(e.target.value))}
                                className="w-full px-2.5 py-1 text-xs bg-white border border-[#e2e8f0] rounded-lg font-bold text-[#2563eb] focus:outline-none focus:border-[#2563eb]"
                              />
                            </div>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[9px] font-bold text-[#64748b] uppercase">DESCRIPTION / GUIDE FOR JURY</span>
                            <div className="flex items-center space-x-2">
                              <input
                                type="text"
                                value={crit.description}
                                onChange={(e) => updateCriterion(rIdx, cIdx, 'description', e.target.value)}
                                placeholder="Guidelines for evaluators and AI scoring..."
                                className="flex-1 px-2.5 py-1 text-xs bg-white border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#2563eb]"
                              />
                              <button
                                type="button"
                                onClick={() => removeCriterion(rIdx, cIdx)}
                                disabled={round.criteria.length <= 1}
                                className="p-1 text-[#dc2626] hover:bg-[#fef2f2] rounded-lg transition-colors disabled:opacity-30 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="p-3 bg-[#eff6ff] border border-[#dbeafe] rounded-xl flex items-center justify-between">
                      <span className="text-xs font-bold text-[#2563eb] uppercase tracking-wider">
                        TOTAL ROUND EVALUATION MARKS:
                      </span>
                      <span className="px-3 py-1 bg-white border border-[#bfdbfe] rounded-full text-xs font-bold text-[#2563eb] shadow-xs">
                        {totalMarks} Marks
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ======================================================== */}
        {/* SECTION 5: PROBLEM STATEMENTS */}
        {/* ======================================================== */}
        <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#f1f5f9]">
            <div className="flex items-center space-x-2">
              <Lightbulb className="w-4 h-4 text-[#2563eb]" />
              <div>
                <h2 className="text-base font-extrabold text-[#0f172a]">Problem Statements</h2>
                <p className="text-xs text-[#64748b]">Configure track challenges and technical statements for participating teams.</p>
              </div>
            </div>

            <button
              type="button"
              onClick={addProblemStatement}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-[#2563eb] bg-[#eff6ff] border border-[#dbeafe] hover:bg-[#dbeafe]/50 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Add Problem Statement</span>
            </button>
          </div>

          <div className="space-y-4">
            {problemStatements.map((ps, pIdx) => (
              <div
                key={pIdx}
                className="p-4 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl space-y-3 relative"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#2563eb] bg-[#eff6ff] px-2.5 py-0.5 rounded-full border border-[#dbeafe]">
                    Challenge #{pIdx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeProblemStatement(pIdx)}
                    disabled={problemStatements.length <= 1}
                    className="p-1 text-[#dc2626] hover:bg-[#fee2e2] rounded-lg transition-colors disabled:opacity-30 cursor-pointer"
                    title="Remove Problem Statement"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-[#64748b] uppercase">CODE / ID</span>
                    <input
                      type="text"
                      value={ps.code}
                      onChange={(e) => updateProblemStatement(pIdx, 'code', e.target.value)}
                      placeholder="e.g. PS-01"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#2563eb] font-semibold text-[#0f172a]"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1">
                    <span className="text-[10px] font-bold text-[#64748b] uppercase">TRACK / CATEGORY</span>
                    <input
                      type="text"
                      value={ps.track}
                      onChange={(e) => updateProblemStatement(pIdx, 'track', e.target.value)}
                      placeholder="e.g. Artificial Intelligence & Agents"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#2563eb]"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-[#64748b] uppercase">CHALLENGE TITLE*</span>
                  <input
                    type="text"
                    value={ps.title}
                    onChange={(e) => updateProblemStatement(pIdx, 'title', e.target.value)}
                    placeholder="e.g. Autonomous Multi-Agent Enterprise Automation"
                    className="w-full px-3 py-1.5 text-xs bg-white border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#2563eb] font-medium text-[#0f172a]"
                  />
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-[#64748b] uppercase">CHALLENGE DESCRIPTION</span>
                  <textarea
                    rows={2}
                    value={ps.description}
                    onChange={(e) => updateProblemStatement(pIdx, 'description', e.target.value)}
                    placeholder="Provide details on scope, expectations, and target deliverables..."
                    className="w-full p-2.5 text-xs bg-white border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#2563eb] text-[#0f172a]"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-[#e2e8f0]">
          <Link
            href="/organizer/hackathons"
            className="px-5 py-2.5 text-xs font-semibold text-[#334155] bg-white border border-[#e2e8f0] hover:bg-[#f8fafc] rounded-xl transition-all"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-[#2563eb] hover:bg-[#1d4ed8] rounded-xl shadow-xs transition-all disabled:opacity-60 cursor-pointer"
          >
            {saving ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Creating Hackathon...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Create Hackathon</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
