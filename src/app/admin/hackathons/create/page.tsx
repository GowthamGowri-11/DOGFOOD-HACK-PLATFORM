'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Trophy,
  ArrowLeft,
  Calendar,
  Users,
  FileText,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Layers,
  Award,
  Clock,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Link2,
  UploadCloud,
  ImageIcon,
  X,
  Sparkles,
  ChevronDown,
  Check,
} from 'lucide-react';
import { TracksAndProblemsEditor, TrackItem } from '@/components/admin/TracksAndProblemsEditor';

interface OrganizerContact {
  id?: string;
  name: string;
  contact: string;
}

interface CriterionItem {
  id?: string;
  name: string;
  maxMarks: number | string;
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
  selectionCount?: number | string;
  requiredSubmissions: {
    github: boolean;
    ppt: boolean;
    video: boolean;
    document: boolean;
    techStack: boolean;
  };
  termsAndConditions: string;
  criteria: CriterionItem[];
  tracks: TrackItem[];
}

export default function AdminCreateHackathonPage() {
  const router = useRouter();

  // Helper date generators
  const now = new Date();
  const formatForInput = (d: Date) => d.toISOString().slice(0, 16);
  const addDays = (d: Date, days: number) => new Date(d.getTime() + days * 86400000);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [tagline, setTagline] = useState('');
  const [prizePool, setPrizePool] = useState<number | string>(75000);
  const [currency, setCurrency] = useState('USD');
  const [description, setDescription] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [organizationName, setOrganizationName] = useState('ATLYX Enterprise Platform');

  // Organizers list
  const [organizers, setOrganizers] = useState<OrganizerContact[]>([
    { name: 'ATLYX Academic Lead', contact: 'lead@atlyx.io' },
  ]);

  // Team settings
  const [minTeamSize, setMinTeamSize] = useState<number>(2);
  const [maxTeamSize, setMaxTeamSize] = useState<number>(4);
  const [maxTeamsAllowed, setMaxTeamsAllowed] = useState<string>('100');

  // Important Dates & Submission Window
  const [registrationDeadline, setRegistrationDeadline] = useState(formatForInput(addDays(now, 7)));
  const [eventStartTime, setEventStartTime] = useState(formatForInput(addDays(now, 8)));
  const [eventEndTime, setEventEndTime] = useState(formatForInput(addDays(now, 11)));
  const [subStartTime, setSubStartTime] = useState(formatForInput(addDays(now, 8)));
  const [subEndTime, setSubEndTime] = useState(formatForInput(addDays(now, 10)));
  const [showAdvancedWindow, setShowAdvancedWindow] = useState(false);

  // Section: Progression Mode
  const [progressionMode, setProgressionMode] = useState<'SELECTION_BASED' | 'OVERALL_PERFORMANCE'>('OVERALL_PERFORMANCE');

  // Evaluation Rounds & Criteria
  const [activeRoundIdx, setActiveRoundIdx] = useState(0);
  const [roundCollapsed, setRoundCollapsed] = useState<Record<number, boolean>>({});
  const [rounds, setRounds] = useState<EvaluationRound[]>([
    {
      name: 'The Qualifiers',
      isFinal: false,
      roundType: 'Mock Hackathon',
      startDate: formatForInput(addDays(now, 8)),
      endDate: formatForInput(addDays(now, 10)),
      submissionDeadline: formatForInput(addDays(now, 10)),
      maxTeamsAllowed: 50,
      selectionCount: 25,
      requiredSubmissions: {
        github: true,
        ppt: true,
        video: false,
        document: false,
        techStack: true,
      },
      termsAndConditions: 'All code must be original and built during the allocated hackathon round window.',
      criteria: [
        { name: 'Technical Execution', maxMarks: 50, description: 'Code architecture and robustness' },
        { name: 'Innovation', maxMarks: 50, description: 'Novelty of approach' },
      ],
      tracks: [
        {
          title: 'Core Innovation',
          slug: 'core-innovation',
          description: 'Challenge track for Core Innovation',
          colorHex: '#FA541C',
          displayOrder: 0,
          problemStatements: [
            {
              code: 'PS-10-01',
              title: 'Quantum Computing & Cryptographic Verification — Primary Challenge',
              description: 'Build an end-to-end verifiable cryptographic pipeline leveraging quantum-resilient algorithms and autonomous agent audit layers.',
              challengeDocUrl: '',
              isPublic: true,
              displayOrder: 0,
            },
          ],
        },
      ],
    },
  ]);

  // Banner Upload State
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [bannerDragOver, setBannerDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const descTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-slug generator on title change
  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!slug || slug === title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')) {
      setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
    }
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

  // Banner file upload handler
  const handleBannerFile = async (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (PNG, JPG, WEBP, or SVG).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Banner image size exceeds 5MB limit.');
      return;
    }

    setIsUploadingBanner(true);
    try {
      const preview = URL.createObjectURL(file);
      setBannerUrl(preview);

      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/v1/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data?.data?.url) {
        setBannerUrl(data.data.url);
      } else {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) setBannerUrl(e.target.result as string);
        };
        reader.readAsDataURL(file);
      }
    } catch {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) setBannerUrl(e.target.result as string);
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploadingBanner(false);
    }
  };

  // Text formatting in description
  const applyFormat = (prefix: string, suffix: string = '') => {
    const textarea = descTextareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = description.substring(start, end);
    const replacement = `${prefix}${selected || 'text'}${suffix}`;
    const nextVal = description.substring(0, start) + replacement + description.substring(end);
    setDescription(nextVal);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + replacement.length - suffix.length);
    }, 0);
  };

  // Current Round helpers
  const currentRound = rounds[activeRoundIdx] || rounds[0];

  const addRound = () => {
    const lastRound = rounds[rounds.length - 1];
    const newStart = lastRound ? lastRound.endDate : formatForInput(addDays(now, 12));
    const newEnd = formatForInput(addDays(new Date(newStart), 2));

    const newRound: EvaluationRound = {
      name: `Round ${rounds.length + 1}`,
      isFinal: false,
      roundType: 'Hackathon',
      startDate: newStart,
      endDate: newEnd,
      submissionDeadline: newEnd,
      maxTeamsAllowed: 50,
      selectionCount: rounds.length === 1 ? 10 : 5,
      requiredSubmissions: {
        github: true,
        ppt: true,
        video: false,
        document: false,
        techStack: true,
      },
      termsAndConditions: 'All code must be original and built during the allocated hackathon round window.',
      criteria: [
        { name: 'Technical Execution', maxMarks: 50, description: 'Code architecture and robustness' },
        { name: 'Innovation', maxMarks: 50, description: 'Novelty of approach' },
      ],
      tracks: [],
    };
    setRounds([...rounds, newRound]);
    setActiveRoundIdx(rounds.length);
  };

  const removeRound = (roundIndex: number) => {
    if (rounds.length <= 1) return;
    const updated = rounds.filter((_, i) => i !== roundIndex);
    setRounds(updated);
    if (activeRoundIdx >= updated.length) {
      setActiveRoundIdx(updated.length - 1);
    }
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
      maxMarks: 25,
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

  const updateRoundTracks = (roundIndex: number, newTracks: TrackItem[]) => {
    const updated = [...rounds];
    updated[roundIndex] = { ...updated[roundIndex], tracks: newTracks };
    setRounds(updated);
  };

  const copyTracksFromRound = (sourceIdx: number, targetIdx: number) => {
    if (!rounds[sourceIdx]) return;
    const copiedTracks = JSON.parse(JSON.stringify(rounds[sourceIdx].tracks || []));
    updateRoundTracks(targetIdx, copiedTracks);
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

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

    // Validate Selection-Based Progression Counts
    if (progressionMode === 'SELECTION_BASED') {
      for (let i = 0; i < rounds.length; i++) {
        const count = Number(rounds[i].selectionCount);
        if (!rounds[i].selectionCount || isNaN(count) || count <= 0 || !Number.isInteger(count)) {
          setError(`Please specify a valid positive number of teams advancing for Round ${i + 1} ("${rounds[i].name || 'Round ' + (i + 1)}").`);
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }
      }
    }

    setSaving(true);

    try {
      const cleanedOrganizers = organizers.filter((o) => o.name.trim() !== '');

      const allTracks: TrackItem[] = rounds.flatMap((r, rIdx) =>
        (r.tracks || []).map(t => ({
          ...t,
          problemStatements: (t.problemStatements || []).map(p => ({
            ...p,
            roundIndex: rIdx,
          })),
        }))
      );

      const questionRoundAssignments: Record<string, number> = {};
      rounds.forEach((r, rIdx) => {
        (r.tracks || []).forEach(t => {
          (t.problemStatements || []).forEach(ps => {
            questionRoundAssignments[ps.code] = rIdx;
          });
        });
      });

      const processedRounds = rounds.map(r => ({
        ...r,
        selectionCount: progressionMode === 'SELECTION_BASED' && r.selectionCount ? Number(r.selectionCount) : null,
        criteria: r.criteria.map(c => ({
          ...c,
          maxMarks: Number(c.maxMarks) || 10
        }))
      }));

      const extendedConfig = {
        organizers: cleanedOrganizers.length > 0 ? cleanedOrganizers : [{ name: 'ATLYX Academic Lead', contact: 'lead@atlyx.io' }],
        maxTeamsAllowed: maxTeamsAllowed ? Number(maxTeamsAllowed) : null,
        progressionMode,
        rounds: processedRounds,
        questionRoundAssignments,
        prizePool: Number(prizePool) || 0,
        currency,
      };

      const regStart = new Date(Date.now() - 60000);
      const regEnd = new Date(registrationDeadline);
      const eventStart = eventStartTime ? new Date(eventStartTime) : addDays(regEnd, 1);
      const eventEnd = eventEndTime ? new Date(eventEndTime) : addDays(eventStart, 3);
      const subStart = subStartTime ? new Date(subStartTime) : eventStart;
      const subEnd = subEndTime ? new Date(subEndTime) : eventEnd;

      const payload = {
        title: title.trim(),
        slug: (slug || title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        tagline: tagline.trim() || undefined,
        description: description.trim(),
        organizationName: organizationName.trim() || 'ATLYX Platform',
        bannerUrl: bannerUrl.trim() || null,
        minTeamSize: Number(minTeamSize),
        maxTeamSize: Number(maxTeamSize),
        progressionMode,
        regStartTime: regStart.toISOString(),
        regEndTime: regEnd.toISOString(),
        eventStartTime: eventStart.toISOString(),
        eventEndTime: eventEnd.toISOString(),
        subStartTime: subStart.toISOString(),
        subEndTime: subEnd.toISOString(),
        prizePool: Number(prizePool) || 0,
        currency,
        status: 'PUBLISHED',
        tracks: allTracks,
        rounds: processedRounds,
        rulesAndGuidelines: JSON.stringify(extendedConfig),
      };

      const res = await fetch('/api/v1/admin/hackathons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || data.error || 'Failed to create hackathon');
      }

      router.push(`/admin/hackathons/${data.data.id}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred while creating the hackathon.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSaving(false);
    }
  };

  const currentTotalMarks = currentRound?.criteria?.reduce(
    (acc, c) => acc + (Number(c.maxMarks) || 0),
    0
  ) || 0;

  return (
    <div className="space-y-6 select-none max-w-7xl mx-auto pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200">
        <div className="space-y-1">
          <Link
            href="/admin/hackathons"
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-zinc-500 hover:text-orange-600 transition-colors mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Hackathons</span>
          </Link>
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#FA541C] to-[#E03A00] flex items-center justify-center text-white shadow-md shadow-orange-500/20 flex-shrink-0 mt-0.5">
              <Trophy className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">
                Create Hackathon
              </h1>
              <p className="text-xs text-zinc-500 mt-1 font-normal">
                Set up an event with custom evaluation rounds, problem statements, and scoring criteria.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 flex items-center space-x-2.5 shadow-xs animate-in fade-in slide-in-from-top-2 duration-200">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span className="font-semibold">{error}</span>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ======================================================== */}
        {/* TWO-COLUMN CONFIGURATION GRID */}
        {/* ======================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* ====================================================== */}
          {/* ROW 1 - LEFT: EVENT DETAILS */}
          {/* ====================================================== */}
          <div className="bg-white border border-zinc-200/90 rounded-2xl p-6 shadow-xs hover:shadow-md transition-all duration-300 space-y-5">
            <div className="border-b border-zinc-100 pb-3 flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-200/80 flex items-center justify-center text-[#FA541C] flex-shrink-0 mt-0.5">
                <FileText className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-zinc-900">Event Details</h2>
                <p className="text-xs text-zinc-500 font-normal">Core hackathon information and branding.</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-700">
                Hackathon Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="e.g. [QA E2E 2026] ATLYX AI Challenge 10"
                className="w-full px-3.5 py-2.5 text-xs bg-white border border-zinc-200 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 text-zinc-900 font-semibold transition-all hover:border-zinc-300"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-700">
                Tagline
              </label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="e.g. Enterprise Quantum Computing & Cryptographic Verification"
                className="w-full px-3.5 py-2.5 text-xs bg-white border border-zinc-200 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 text-zinc-800 font-normal transition-all hover:border-zinc-300"
              />
            </div>

            {/* Prize Pool & Currency */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-700 flex items-center space-x-1.5">
                <span>Prize Pool</span>
                <span className="text-[10px] font-normal text-zinc-400">(Global platform reward incentive)</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                <div className="sm:col-span-3 relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400">
                    {currency === 'USD' ? '$' : currency === 'INR' ? '₹' : currency === 'EUR' ? '€' : '£'}
                  </span>
                  <input
                    type="number"
                    min="0"
                    value={prizePool}
                    onChange={(e) => setPrizePool(e.target.value)}
                    placeholder="75000"
                    className="w-full pl-8 pr-3.5 py-2.5 text-xs bg-white border border-zinc-200 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 text-zinc-900 font-bold hover:border-zinc-300 transition-all"
                  />
                </div>
                <div>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs bg-white border border-zinc-200 rounded-xl focus:outline-none focus:border-orange-500 text-zinc-700 font-semibold cursor-pointer hover:border-zinc-300 transition-all"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="INR">INR (₹)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
              </div>
              <p className="text-[11px] text-zinc-400">
                This total prize pool amount is showcased on competition cards and leaderboard rewards.
              </p>
            </div>

            {/* Result / Progression Method */}
            <div className="p-4 bg-zinc-50 border border-zinc-200/80 rounded-xl space-y-3">
              <div>
                <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
                  Result / Progression Method
                </h3>
                <p className="text-[11px] text-zinc-500">
                  Select how teams advance through the competition rounds.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label
                  className={`flex items-start p-3 rounded-xl border cursor-pointer transition-all ${
                    progressionMode === 'SELECTION_BASED'
                      ? 'bg-orange-50/50 border-orange-500 ring-1 ring-orange-500'
                      : 'bg-white border-zinc-200 hover:border-zinc-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="progressionMode"
                    value="SELECTION_BASED"
                    checked={progressionMode === 'SELECTION_BASED'}
                    onChange={() => setProgressionMode('SELECTION_BASED')}
                    className="mt-0.5 text-orange-600 focus:ring-orange-500"
                  />
                  <div className="ml-2.5">
                    <span className="block text-xs font-bold text-zinc-900">Selection Based</span>
                    <span className="block text-[11px] text-zinc-500 mt-0.5 leading-relaxed">
                      Elimination model: only top-selected teams advance to the next round.
                    </span>
                  </div>
                </label>

                <label
                  className={`flex items-start p-3 rounded-xl border cursor-pointer transition-all ${
                    progressionMode === 'OVERALL_PERFORMANCE'
                      ? 'bg-orange-50/50 border-orange-500 ring-1 ring-orange-500'
                      : 'bg-white border-zinc-200 hover:border-zinc-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="progressionMode"
                    value="OVERALL_PERFORMANCE"
                    checked={progressionMode === 'OVERALL_PERFORMANCE'}
                    onChange={() => setProgressionMode('OVERALL_PERFORMANCE')}
                    className="mt-0.5 text-orange-600 focus:ring-orange-500"
                  />
                  <div className="ml-2.5">
                    <span className="block text-xs font-bold text-zinc-900">Overall Performance</span>
                    <span className="block text-[11px] text-zinc-500 mt-0.5 leading-relaxed">
                      Cumulative model: all teams participate in all rounds without elimination.
                    </span>
                  </div>
                </label>
              </div>
            </div>
            {/* Organizers List */}
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-zinc-700">
                  Organizers <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={addOrganizer}
                  className="inline-flex items-center gap-1 text-xs font-bold text-orange-600 hover:text-orange-700 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Add Organizer</span>
                </button>
              </div>

              <div className="space-y-2.5">
                {organizers.map((org, idx) => (
                  <div
                    key={idx}
                    className="flex items-center space-x-3 p-3 bg-zinc-50/70 border border-zinc-200/90 rounded-xl hover:border-zinc-300 transition-all"
                  >
                    <div className="flex-1 space-y-1">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">NAME</span>
                      <input
                        type="text"
                        required
                        value={org.name}
                        onChange={(e) => updateOrganizer(idx, 'name', e.target.value)}
                        placeholder="e.g. ATLYX Academic Lead"
                        className="w-full px-3 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg focus:outline-none focus:border-orange-500 text-zinc-900 font-medium"
                      />
                    </div>
                    <div className="flex-1 space-y-1">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">CONTACT</span>
                      <input
                        type="text"
                        value={org.contact}
                        onChange={(e) => updateOrganizer(idx, 'contact', e.target.value)}
                        placeholder="e.g. lead@atlyx.io"
                        className="w-full px-3 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg focus:outline-none focus:border-orange-500 text-zinc-900 font-medium"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeOrganizer(idx)}
                      disabled={organizers.length <= 1}
                      className="self-end p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-30 cursor-pointer"
                      title="Remove Organizer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ====================================================== */}
          {/* ROW 1 - RIGHT: BANNER IMAGE & DESCRIPTION */}
          {/* ====================================================== */}
          <div className="bg-white border border-zinc-200/90 rounded-2xl p-6 shadow-xs hover:shadow-md transition-all duration-300 space-y-5">
            <div className="border-b border-zinc-100 pb-3 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-200/80 flex items-center justify-center text-[#FA541C] flex-shrink-0">
                  <ImageIcon className="w-4 h-4 stroke-[2.2]" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-zinc-900">Banner Image</h2>
                </div>
              </div>
              <span className="text-[11px] text-zinc-400 font-medium">
                PNG, JPG, WEBP or SVG up to 5MB (Recommended 1200 &times; 400px)
              </span>
            </div>

            {/* Banner Preview with X button */}
            <div className="space-y-3">
              <div className="relative w-full h-36 sm:h-44 rounded-xl overflow-hidden border border-zinc-200 bg-zinc-950 shadow-inner group">
                {bannerUrl ? (
                  <>
                    <img
                      src={bannerUrl}
                      alt="Hackathon Banner"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.01]"
                    />
                    <button
                      type="button"
                      onClick={() => setBannerUrl('')}
                      className="absolute top-3 right-3 w-7 h-7 rounded-full bg-zinc-900/80 hover:bg-zinc-900 text-white flex items-center justify-center backdrop-blur-sm transition-all hover:scale-110 shadow-md cursor-pointer"
                      title="Remove Banner"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 text-white">
                    <div className="flex items-center space-x-2 mb-1">
                      <div className="w-5 h-5 rounded-md bg-[#FA541C] flex items-center justify-center text-white text-[10px] font-black">
                        A
                      </div>
                      <span className="font-extrabold tracking-wider text-xs">ATLYX</span>
                    </div>
                    <p className="text-[11px] text-zinc-400">COMPETITION ARENA</p>
                    <p className="text-[10px] text-orange-400/80 mt-1">Upload an event banner to personalize</p>
                  </div>
                )}
              </div>

              {/* Upload Dropzone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setBannerDragOver(true);
                }}
                onDragLeave={() => setBannerDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setBannerDragOver(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleBannerFile(e.dataTransfer.files[0]);
                  }
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`border border-dashed rounded-xl py-3.5 px-4 text-center cursor-pointer transition-all duration-200 group ${
                  bannerDragOver
                    ? 'border-orange-500 bg-orange-50/30'
                    : 'border-zinc-200 hover:border-orange-400 bg-zinc-50/60 hover:bg-orange-50/10'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleBannerFile(e.target.files[0]);
                    }
                  }}
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  className="hidden"
                />
                <div className="flex items-center justify-center space-x-1.5">
                  <UploadCloud className="w-4 h-4 text-orange-500 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold text-orange-600 hover:text-orange-700">
                    Click to upload banner
                  </span>
                  <span className="text-xs text-zinc-500">or drag and drop</span>
                </div>
                <p className="text-[10px] text-zinc-400 mt-0.5">
                  PNG, JPG, WEBP, or SVG up to 5MB (Recommended 1200 &times; 400px)
                </p>
              </div>
            </div>

            {/* Description with formatting toolbar and counter */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-zinc-700">
                  Description <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center space-x-1 bg-zinc-50 border border-zinc-200 rounded-lg p-0.5">
                  <button
                    type="button"
                    onClick={() => applyFormat('**', '**')}
                    className="p-1 hover:bg-zinc-200/70 rounded text-zinc-600 hover:text-zinc-900 transition-colors"
                    title="Bold (**text**)"
                  >
                    <Bold className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => applyFormat('*', '*')}
                    className="p-1 hover:bg-zinc-200/70 rounded text-zinc-600 hover:text-zinc-900 transition-colors"
                    title="Italic (*text*)"
                  >
                    <Italic className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => applyFormat('<u>', '</u>')}
                    className="p-1 hover:bg-zinc-200/70 rounded text-zinc-600 hover:text-zinc-900 transition-colors"
                    title="Underline"
                  >
                    <Underline className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => applyFormat('- ')}
                    className="p-1 hover:bg-zinc-200/70 rounded text-zinc-600 hover:text-zinc-900 transition-colors"
                    title="Bullet List (- item)"
                  >
                    <List className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => applyFormat('1. ')}
                    className="p-1 hover:bg-zinc-200/70 rounded text-zinc-600 hover:text-zinc-900 transition-colors"
                    title="Numbered List (1. item)"
                  >
                    <ListOrdered className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => applyFormat('[', '](https://)')}
                    className="p-1 hover:bg-zinc-200/70 rounded text-zinc-600 hover:text-zinc-900 transition-colors"
                    title="Link [title](url)"
                  >
                    <Link2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <textarea
                ref={descTextareaRef}
                required
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide a comprehensive overview of the event, eligibility criteria, and key highlights..."
                className="w-full p-3 text-xs bg-white border border-zinc-200 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 text-zinc-900 font-normal leading-relaxed hover:border-zinc-300 transition-all font-mono"
              />
              <div className="flex items-center justify-between text-[11px] text-zinc-400">
                <span>Minimum 20 characters required</span>
                <span className={description.length >= 20 ? 'text-emerald-600 font-medium' : 'text-zinc-400'}>
                  {description.length} chars
                </span>
              </div>
            </div>
          </div>

          {/* ====================================================== */}
          {/* ROW 2 - LEFT: TEAM SETTINGS & RULES */}
          {/* ====================================================== */}
          <div className="bg-white border border-zinc-200/90 rounded-2xl p-6 shadow-xs hover:shadow-md transition-all duration-300 space-y-4">
            <div className="border-b border-zinc-100 pb-3 flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-200/80 flex items-center justify-center text-[#FA541C] flex-shrink-0 mt-0.5">
                <Users className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-zinc-900">Team Settings &amp; Rules</h2>
                <p className="text-xs text-zinc-500 font-normal">
                  Configure team formation constraints and registration limits.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700">Min Team Size</label>
                <input
                  type="number"
                  min="1"
                  max={maxTeamSize}
                  value={minTeamSize}
                  onChange={(e) => setMinTeamSize(Number(e.target.value))}
                  className="w-full px-3.5 py-2 text-xs bg-white border border-zinc-200 rounded-xl focus:outline-none focus:border-orange-500 text-zinc-900 font-bold hover:border-zinc-300 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700">Max Team Size</label>
                <input
                  type="number"
                  min={minTeamSize}
                  max="20"
                  value={maxTeamSize}
                  onChange={(e) => setMaxTeamSize(Number(e.target.value))}
                  className="w-full px-3.5 py-2 text-xs bg-white border border-zinc-200 rounded-xl focus:outline-none focus:border-orange-500 text-zinc-900 font-bold hover:border-zinc-300 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700">Max Teams Allowed (Overall)</label>
                <input
                  type="text"
                  value={maxTeamsAllowed}
                  onChange={(e) => setMaxTeamsAllowed(e.target.value)}
                  placeholder="100"
                  className="w-full px-3.5 py-2 text-xs bg-white border border-zinc-200 rounded-xl focus:outline-none focus:border-orange-500 text-zinc-900 font-bold hover:border-zinc-300 transition-all"
                />
              </div>
            </div>
          </div>

          {/* ====================================================== */}
          {/* ROW 2 - RIGHT: IMPORTANT DETAILS */}
          {/* ====================================================== */}
          <div className="bg-white border border-zinc-200/90 rounded-2xl p-6 shadow-xs hover:shadow-md transition-all duration-300 space-y-4">
            <div className="border-b border-zinc-100 pb-3 flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-200/80 flex items-center justify-center text-[#FA541C] flex-shrink-0 mt-0.5">
                <Calendar className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-zinc-900">Important Details</h2>
                <p className="text-xs text-zinc-500 font-normal">
                  Set the overall registration and hackathon submission deadlines.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700">
                  Registration Deadline <span className="text-rose-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  required
                  value={registrationDeadline}
                  onChange={(e) => setRegistrationDeadline(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-zinc-200 rounded-xl focus:outline-none focus:border-orange-500 text-zinc-800 font-medium hover:border-zinc-300 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700">
                  Event Start Date &amp; Time <span className="text-rose-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  required
                  value={eventStartTime}
                  onChange={(e) => setEventStartTime(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-zinc-200 rounded-xl focus:outline-none focus:border-orange-500 text-zinc-800 font-medium hover:border-zinc-300 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700">
                  Event End Date &amp; Time <span className="text-rose-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  required
                  value={eventEndTime}
                  onChange={(e) => setEventEndTime(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-zinc-200 rounded-xl focus:outline-none focus:border-orange-500 text-zinc-800 font-medium hover:border-zinc-300 transition-all"
                />
              </div>
            </div>

            {/* Authoritative Submission Window configuration toggle */}
            <div className="pt-2 border-t border-zinc-100">
              <button
                type="button"
                onClick={() => setShowAdvancedWindow(!showAdvancedWindow)}
                className="text-[11px] font-bold text-zinc-500 hover:text-orange-600 flex items-center gap-1 transition-colors"
              >
                <span>Submission Window (Server Authoritative Cutoff)</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAdvancedWindow ? 'rotate-180' : ''}`} />
              </button>

              {showAdvancedWindow && (
                <div className="mt-3 p-3 bg-zinc-50 rounded-xl border border-zinc-200/80 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase">SUBMISSION OPENS</span>
                      <input
                        type="datetime-local"
                        value={subStartTime}
                        onChange={(e) => setSubStartTime(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg focus:outline-none focus:border-orange-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-rose-500 uppercase">SUBMISSION DEADLINE</span>
                      <input
                        type="datetime-local"
                        value={subEndTime}
                        onChange={(e) => setSubEndTime(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ====================================================== */}
          {/* ROW 3 - LEFT: EVALUATION ROUNDS */}
          {/* ====================================================== */}
          <div className="bg-white border border-zinc-200/90 rounded-2xl p-6 shadow-xs hover:shadow-md transition-all duration-300 space-y-5">
            <div className="border-b border-zinc-100 pb-3 flex items-center justify-between gap-2">
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-200/80 flex items-center justify-center text-[#FA541C] flex-shrink-0 mt-0.5">
                  <Layers className="w-4 h-4 stroke-[2.2]" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-zinc-900">Evaluation Rounds</h2>
                  <p className="text-xs text-zinc-500 font-normal">
                    Define the sequence of evaluation rounds and their specific problem statements.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={addRound}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-orange-600 bg-orange-50 hover:bg-orange-100/70 border border-orange-200/80 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] shrink-0"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Add Round</span>
              </button>
            </div>

            {/* Rounds rendering */}
            <div className="space-y-4">
              {rounds.map((round, rIdx) => {
                const isSelected = activeRoundIdx === rIdx;
                const isCollapsed = roundCollapsed[rIdx];

                return (
                  <div
                    key={rIdx}
                    onClick={() => setActiveRoundIdx(rIdx)}
                    className={`border rounded-2xl p-4.5 space-y-4 transition-all duration-200 ${
                      isSelected
                        ? 'border-orange-300 bg-zinc-50/60 ring-2 ring-orange-500/10 shadow-xs'
                        : 'border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setRoundCollapsed((prev) => ({ ...prev, [rIdx]: !prev[rIdx] }));
                          }}
                          className="flex items-center space-x-1.5 text-xs font-extrabold text-zinc-800 hover:text-orange-600 transition-colors"
                        >
                          <ChevronDown
                            className={`w-4 h-4 text-zinc-500 transition-transform ${
                              isCollapsed ? '-rotate-90' : ''
                            }`}
                          />
                          <span>Round {rIdx + 1}</span>
                        </button>
                        {round.isFinal && (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                            FINALE
                          </span>
                        )}
                        {isSelected && (
                          <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200">
                            Active Round
                          </span>
                        )}
                        {progressionMode === 'SELECTION_BASED' && round.selectionCount && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            Top {round.selectionCount} Advance
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeRound(rIdx);
                        }}
                        disabled={rounds.length <= 1}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-30 cursor-pointer"
                        title="Delete Round"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {!isCollapsed && (
                      <div className="space-y-5 pt-2">
                        {/* Row 1 – Name + Round Type + (optionally Teams Advancing) */}
                        <div className={`grid grid-cols-1 gap-5 ${progressionMode === 'SELECTION_BASED' ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
                          <div className="space-y-2">
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                              Round Name
                            </span>
                            <input
                              type="text"
                              value={round.name}
                              onChange={(e) => updateRound(rIdx, 'name', e.target.value)}
                              placeholder="e.g. The Qualifiers"
                              className="w-full px-3 py-2.5 text-sm bg-white border border-zinc-200 rounded-xl font-bold text-zinc-900 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10"
                            />
                          </div>

                          <div className="space-y-2">
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                              Round Type
                            </span>
                            <select
                              value={round.roundType}
                              onChange={(e) => updateRound(rIdx, 'roundType', e.target.value)}
                              className="w-full px-3 py-2.5 text-sm bg-white border border-zinc-200 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 text-zinc-900 font-semibold cursor-pointer"
                            >
                              <option value="Mock Hackathon">Mock Hackathon</option>
                              <option value="Hackathon">Hackathon</option>
                              <option value="Ideation">Ideation</option>
                              <option value="Presentation">Presentation</option>
                              <option value="Coding Challenge">Coding Challenge</option>
                            </select>
                          </div>

                          {progressionMode === 'SELECTION_BASED' && (
                            <div className="space-y-2">
                              <span className="text-[10px] font-bold text-orange-600 uppercase flex items-center justify-between">
                                <span>Teams Advancing*</span>
                                <span className="text-[9px] text-zinc-400 normal-case">(Cutoff)</span>
                              </span>
                              <input
                                type="number"
                                min="1"
                                required={progressionMode === 'SELECTION_BASED'}
                                value={round.selectionCount ?? ''}
                                onChange={(e) => updateRound(rIdx, 'selectionCount', e.target.value)}
                                placeholder={rIdx === 0 ? "25" : rIdx === 1 ? "10" : "5"}
                                className="w-full px-3 py-2.5 text-sm bg-orange-50/50 border border-orange-200 rounded-xl font-bold text-orange-700 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10"
                              />
                            </div>
                          )}
                        </div>

                        {/* Final Round toggle */}
                        <div className="flex items-center gap-3 px-4 py-3 bg-white border border-zinc-200 rounded-xl">
                          <input
                            id={`admin-final-round-${rIdx}`}
                            type="checkbox"
                            checked={round.isFinal}
                            onChange={(e) => updateRound(rIdx, 'isFinal', e.target.checked)}
                            className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 cursor-pointer"
                          />
                          <label htmlFor={`admin-final-round-${rIdx}`} className="cursor-pointer">
                            <span className="text-sm font-semibold text-zinc-900">Mark as Final Round</span>
                            <p className="text-xs text-zinc-500 mt-0.5">This is the last round — no teams advance after this.</p>
                          </label>
                        </div>

                        {/* Row 2 – Dates */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                          <div className="space-y-2">
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                              Start Date & Time
                            </span>
                            <input
                              type="datetime-local"
                              value={round.startDate}
                              onChange={(e) => updateRound(rIdx, 'startDate', e.target.value)}
                              className="w-full px-3 py-2.5 text-xs bg-white border border-zinc-200 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 text-zinc-800"
                            />
                          </div>
                          <div className="space-y-2">
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                              End Date & Time
                            </span>
                            <input
                              type="datetime-local"
                              value={round.endDate}
                              onChange={(e) => updateRound(rIdx, 'endDate', e.target.value)}
                              className="w-full px-3 py-2.5 text-xs bg-white border border-zinc-200 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 text-zinc-800"
                            />
                          </div>
                          <div className="space-y-2">
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                              Submission Deadline
                            </span>
                            <input
                              type="datetime-local"
                              value={round.submissionDeadline}
                              onChange={(e) => updateRound(rIdx, 'submissionDeadline', e.target.value)}
                              className="w-full px-3 py-2.5 text-xs bg-white border border-zinc-200 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 text-zinc-800"
                            />
                          </div>
                        </div>

                        {/* Row 3 – Max Teams */}
                        <div className="space-y-2">
                          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                            Max Teams Allowed
                          </span>
                          <input
                            type="number"
                            min="1"
                            value={round.maxTeamsAllowed}
                            onChange={(e) => updateRound(rIdx, 'maxTeamsAllowed', Number(e.target.value))}
                            className="w-full sm:w-48 px-3 py-2.5 text-sm bg-white border border-zinc-200 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 text-zinc-900 font-bold"
                          />
                        </div>

                        {/* What to Evaluate (Required Submissions) */}
                        <div className="space-y-3 pt-1">
                          <div>
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">
                              What to Evaluate (Required Submissions)
                            </span>
                            <p className="text-xs text-zinc-500">
                              Select what teams must upload for <span className="font-semibold text-zinc-900">{round.name || 'this round'}</span>.
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2.5">
                            {[
                              { key: 'github', label: 'GitHub link' },
                              { key: 'ppt', label: 'PPT link' },
                              { key: 'techStack', label: 'Tech stack' },
                              { key: 'video', label: 'Video link' },
                              { key: 'document', label: 'Document link' },
                            ].map((item) => {
                              const checked = (round.requiredSubmissions as any)[item.key];
                              return (
                                <button
                                  key={item.key}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const updatedReqs = {
                                      ...round.requiredSubmissions,
                                      [item.key]: !checked,
                                    };
                                    updateRound(rIdx, 'requiredSubmissions', updatedReqs);
                                  }}
                                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border flex items-center space-x-1.5 transition-all cursor-pointer ${
                                    checked
                                      ? 'bg-[#FA541C] text-white border-[#FA541C] shadow-xs'
                                      : 'bg-white text-zinc-600 border-zinc-200 hover:border-orange-300 hover:bg-zinc-50'
                                  }`}
                                >
                                  <span>{checked ? '✓' : '+'}</span>
                                  <span>{item.label}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ====================================================== */}
          {/* ROW 3 - RIGHT: JURY EVALUATION MARKING CRITERIA */}
          {/* ====================================================== */}
          <div className="bg-white border border-zinc-200/90 rounded-2xl p-6 shadow-xs hover:shadow-md transition-all duration-300 space-y-5">
            <div className="border-b border-zinc-100 pb-3 flex items-center justify-between gap-2">
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-200/80 flex items-center justify-center text-[#FA541C] flex-shrink-0 mt-0.5">
                  <Award className="w-4 h-4 stroke-[2.2]" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-zinc-900">Jury Evaluation Marking Criteria</h2>
                  <p className="text-xs text-zinc-500 font-normal">
                    Define the evaluation criteria and maximum marks for each criterion.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => addCriterion(activeRoundIdx)}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-orange-600 bg-orange-50 hover:bg-orange-100/70 border border-orange-200/80 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] shrink-0"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Add Criterion</span>
              </button>
            </div>

            {/* Criteria Cards */}
            <div className="space-y-3">
              {currentRound?.criteria.map((crit, cIdx) => (
                <div
                  key={cIdx}
                  className="p-3.5 bg-zinc-50/70 border border-zinc-200/80 rounded-xl space-y-2.5 hover:border-zinc-300 transition-all"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="sm:col-span-3 space-y-1">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                        CRITERION NAME
                      </span>
                      <input
                        type="text"
                        value={crit.name}
                        onChange={(e) => updateCriterion(activeRoundIdx, cIdx, 'name', e.target.value)}
                        placeholder="e.g. Technical Execution"
                        className="w-full px-3 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg focus:outline-none focus:border-orange-500 text-zinc-900 font-semibold"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                          MAX MARKS
                        </span>
                        <button
                          type="button"
                          onClick={() => removeCriterion(activeRoundIdx, cIdx)}
                          disabled={currentRound.criteria.length <= 1}
                          className="text-rose-500 hover:text-rose-700 disabled:opacity-20 cursor-pointer"
                          title="Delete Criterion"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={crit.maxMarks ?? ''}
                        onChange={(e) => {
                          const clean = e.target.value.replace(/[^0-9]/g, '').replace(/^0+(?=[0-9])/, '');
                          updateCriterion(activeRoundIdx, cIdx, 'maxMarks', clean);
                        }}
                        onBlur={() => {
                          const val = Number(crit.maxMarks);
                          if (!val || val < 1) {
                            updateCriterion(activeRoundIdx, cIdx, 'maxMarks', 10);
                          } else {
                            updateCriterion(activeRoundIdx, cIdx, 'maxMarks', val);
                          }
                        }}
                        className="w-full px-3 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg font-bold text-orange-600 focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                      DESCRIPTION / GUIDE FOR JURY
                    </span>
                    <input
                      type="text"
                      value={crit.description}
                      onChange={(e) => updateCriterion(activeRoundIdx, cIdx, 'description', e.target.value)}
                      placeholder="e.g. Code architecture and robustness"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg focus:outline-none focus:border-orange-500 text-zinc-800"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Total Marks Bar */}
            <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl flex items-center justify-between">
              <span className="text-xs font-bold text-blue-900 tracking-wider">
                Total Round Evaluation Marks:
              </span>
              <span className="px-3 py-0.5 rounded-full text-xs font-bold text-blue-600 bg-white border border-blue-200 shadow-2xs">
                {currentTotalMarks} Marks
              </span>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* ROW 4 - FULL WIDTH: TRACKS & QUESTIONS */}
        {/* ======================================================== */}
        <div className="w-full">
          <TracksAndProblemsEditor
            embeddedInRound
            roundIndex={activeRoundIdx}
            roundName={currentRound?.name || `Round ${activeRoundIdx + 1}`}
            rounds={rounds.map(r => ({ name: r.name, isFinal: r.isFinal, roundType: r.roundType }))}
            tracks={currentRound?.tracks || []}
            onChange={(newTracks) => updateRoundTracks(activeRoundIdx, newTracks)}
            onCopyFromPrevious={
              activeRoundIdx > 0 && (rounds[0]?.tracks?.length || 0) > 0
                ? () => copyTracksFromRound(0, activeRoundIdx)
                : undefined
            }
            previousRoundName={activeRoundIdx > 0 ? (rounds[0]?.name || 'Round 1') : undefined}
          />
        </div>

        {/* Bottom Actions Bar */}
        <div className="flex items-center justify-end space-x-3 pt-6 border-t border-zinc-200">
          <Link
            href="/admin/hackathons"
            className="px-5 py-2.5 text-xs font-semibold text-zinc-700 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-xl transition-all"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-[#FA541C] to-[#E03A00] hover:from-[#E03A00] hover:to-[#C83200] rounded-xl shadow-md shadow-orange-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 cursor-pointer"
          >
            {saving ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Creating Event...</span>
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Create Hackathon</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
