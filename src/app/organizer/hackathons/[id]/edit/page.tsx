'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  ExternalLink,
  Layers,
  Award,
  Bold,
  Italic,
  Underline,
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

export default function OrganizerEditHackathonPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const router = useRouter();
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [tagline, setTagline] = useState('');
  const [prizePool, setPrizePool] = useState<number | string>(0);
  const [currency, setCurrency] = useState('USD');
  const [description, setDescription] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [status, setStatus] = useState('DRAFT');

  // Organizers list
  const [organizers, setOrganizers] = useState<OrganizerContact[]>([
    { name: '', contact: '' },
  ]);

  // Departments
  const [primaryDept, setPrimaryDept] = useState(DEPARTMENTS[0]);
  const [collabDepts, setCollabDepts] = useState<string[]>([]);

  // Team settings
  const [minTeamSize, setMinTeamSize] = useState<number>(2);
  const [maxTeamSize, setMaxTeamSize] = useState<number>(4);
  const [maxTeamsAllowed, setMaxTeamsAllowed] = useState<string>('');

  // Year criteria
  const [yearCriteria, setYearCriteria] = useState({
    year1: { min: 0, max: 4 },
    year2: { min: 0, max: 4 },
    year3: { min: 0, max: 4 },
    year4: { min: 0, max: 4 },
  });

  // Important Dates
  const [registrationDeadline, setRegistrationDeadline] = useState('');

  // Evaluation Rounds
  const [rounds, setRounds] = useState<EvaluationRound[]>([]);

  // Problem Statements
  const [problemStatements, setProblemStatements] = useState<ProblemStatementItem[]>([]);

  const formatForInput = (dateStr: string | Date | null) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '';
      return d.toISOString().slice(0, 16);
    } catch {
      return '';
    }
  };

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

  const fetchHackathonData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`/api/v1/hackathons/${id}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || data.error?.message || 'Failed to load hackathon data');
      }

      const h = data.data.hackathon;
      setTitle(h.title || '');
      setSlug(h.slug || '');
      setTagline(h.tagline || '');
      setDescription(h.description || '');
      setOrganizationName(h.organizationName || '');
      setStatus(h.status || 'DRAFT');
      setBannerUrl(h.bannerUrl || '');
      setMinTeamSize(h.minTeamSize || 2);
      setMaxTeamSize(h.maxTeamSize || 4);
      setRegistrationDeadline(formatForInput(h.regEndTime));

      // Calculate total prize pool if available
      const grandPrize = h.prizes?.find((p: any) => p.category === 'Grand Pool');
      if (grandPrize) {
        setPrizePool(grandPrize.amount || 0);
        setCurrency(grandPrize.currency || 'USD');
      } else if (h.prizes?.length > 0) {
        const sum = h.prizes.reduce((acc: number, p: any) => acc + (Number(p.amount) || 0), 0);
        setPrizePool(sum);
        setCurrency(h.prizes[0]?.currency || 'USD');
      }

      // Parse extended JSON configuration
      if (h.rulesAndGuidelines) {
        try {
          const config = JSON.parse(h.rulesAndGuidelines);
          if (config.organizers && Array.isArray(config.organizers)) {
            setOrganizers(config.organizers);
          }
          if (config.primaryDepartment) {
            setPrimaryDept(config.primaryDepartment);
          }
          if (config.collaboratingDepartments && Array.isArray(config.collaboratingDepartments)) {
            setCollabDepts(config.collaboratingDepartments);
          }
          if (config.maxTeamsAllowed) {
            setMaxTeamsAllowed(String(config.maxTeamsAllowed));
          }
          if (config.yearCriteria) {
            setYearCriteria(config.yearCriteria);
          }
          if (config.rounds && Array.isArray(config.rounds)) {
            setRounds(config.rounds);
          }
          if (config.problemStatements && Array.isArray(config.problemStatements)) {
            setProblemStatements(config.problemStatements);
          }
        } catch {
          // Plain text rules
        }
      }

      // Fallback problem statements from tracks if not in config
      if ((!rounds || rounds.length === 0) && h.tracks?.length > 0) {
        const extractedPS: ProblemStatementItem[] = [];
        for (const tr of h.tracks) {
          if (tr.problemStatements?.length > 0) {
            for (const ps of tr.problemStatements) {
              extractedPS.push({
                track: tr.title,
                code: ps.code || 'PS-01',
                title: ps.title,
                description: ps.description || '',
              });
            }
          }
        }
        if (extractedPS.length > 0) {
          setProblemStatements(extractedPS);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Error loading hackathon');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchHackathonData();
  }, [fetchHackathonData]);

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
    const newStart = lastRound ? lastRound.endDate : new Date().toISOString().slice(0, 16);
    const newEnd = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 16);

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
        termsAndConditions: 'All work must adhere to code integrity rules and commit deadlines.',
        criteria: [
          { name: 'Core Innovation', maxMarks: 50, description: 'Novelty and solution value' },
          { name: 'Implementation', maxMarks: 50, description: 'Code quality and architecture' },
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

  // Save Handler
  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setSuccessMsg(null);

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

      const payload: any = {
        title: title.trim(),
        tagline: tagline.trim() || undefined,
        description: description.trim(),
        organizationName: organizationName.trim(),
        bannerUrl: bannerUrl.trim() || null,
        status,
        minTeamSize: Number(minTeamSize),
        maxTeamSize: Number(maxTeamSize),
        prizePool: Number(prizePool) || 0,
        currency,
        rulesAndGuidelines: JSON.stringify(extendedConfig),
      };

      if (registrationDeadline) {
        payload.regEndTime = new Date(registrationDeadline).toISOString();
      }

      const res = await fetch(`/api/v1/hackathons/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMsg('Hackathon configuration updated successfully!');
        setTimeout(() => {
          router.push(`/organizer/hackathons/${id}`);
        }, 800);
      } else {
        setError(data.error?.message || data.message || 'Failed to update hackathon');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch {
      setError('A network error occurred while updating the hackathon.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-xs text-[#64748b]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2563eb] mx-auto mb-2" />
        Loading hackathon settings...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16 select-none">
      {/* Breadcrumb Bar */}
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
        <Link href={`/organizer/hackathons/${id}`} className="hover:text-[#2563eb] transition-colors">
          {title || 'Hackathon Details'}
        </Link>
        <span>&rsaquo;</span>
        <span className="text-[#0f172a] font-semibold">Edit Configuration</span>
      </nav>

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <Link
            href={`/organizer/hackathons/${id}`}
            className="inline-flex items-center text-xs font-semibold text-[#64748b] hover:text-[#2563eb] mb-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            Back to Event Control Center
          </Link>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#eff6ff] flex items-center justify-center text-[#2563eb] flex-shrink-0 mt-0.5 border border-[#dbeafe]">
              <Trophy className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0f172a] tracking-tight">
                Edit Hackathon
              </h1>
              <p className="text-xs text-[#64748b] mt-1 font-normal">
                Update details, team criteria, and evaluation rounds for this arena.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/hackathons/${slug || id}`}
            target="_blank"
            className="inline-flex items-center gap-1 px-3.5 py-2 text-xs font-bold text-[#2563eb] bg-[#eff6ff] hover:bg-[#dbeafe] rounded-xl border border-[#bfdbfe] transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Public Page</span>
          </Link>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-[#ecfdf5] border border-[#a7f3d0] rounded-2xl text-xs text-[#065f46] flex items-center space-x-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-[#059669] flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-[#fef2f2] border border-[#fecaca] rounded-2xl text-xs text-[#dc2626] flex items-center space-x-2 shadow-xs">
          <AlertCircle className="w-4 h-4 text-[#dc2626] flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* ======================================================== */}
        {/* SECTION 1: EVENT DETAILS */}
        {/* ======================================================== */}
        <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 shadow-xs space-y-5">
          <div className="border-b border-[#f1f5f9] pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-[#0f172a]">Event Details</h2>
              <p className="text-xs text-[#64748b]">Core hackathon information, branding, and prize allocation.</p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-[#64748b]">Status:</span>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="px-2.5 py-1 text-xs font-bold bg-[#f8fafc] border border-[#e2e8f0] rounded-lg text-[#2563eb]"
              >
                <option value="DRAFT">DRAFT</option>
                <option value="PUBLISHED">PUBLISHED</option>
                <option value="REGISTRATION_OPEN">REGISTRATION OPEN</option>
                <option value="SUBMISSION_OPEN">SUBMISSION OPEN</option>
                <option value="JUDGING">JUDGING</option>
                <option value="RESULTS_PUBLISHED">RESULTS PUBLISHED</option>
                <option value="COMPLETED">COMPLETED</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#334155]">Hackathon Title*</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#e2e8f0] rounded-xl focus:outline-none focus:border-[#2563eb] text-[#0f172a] font-medium"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#334155]">Tagline</label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#e2e8f0] rounded-xl focus:outline-none focus:border-[#2563eb] text-[#0f172a] font-medium"
            />
          </div>

          {/* Prize Pool */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#334155]">Prize Pool</label>
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
                  className="w-full pl-8 pr-3.5 py-2.5 text-xs bg-white border border-[#e2e8f0] rounded-xl focus:outline-none focus:border-[#2563eb] text-[#0f172a] font-bold"
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
          </div>

          {/* Organizers */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#334155]">Organizers*</label>
              <button
                type="button"
                onClick={addOrganizer}
                className="inline-flex items-center gap-1 text-xs font-bold text-[#2563eb] hover:text-[#1d4ed8]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Organizer</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {organizers.map((org, idx) => (
                <div key={idx} className="flex items-center space-x-3 p-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl">
                  <div className="flex-1 space-y-1">
                    <span className="text-[10px] font-bold text-[#64748b] uppercase">NAME*</span>
                    <input
                      type="text"
                      required
                      value={org.name}
                      onChange={(e) => updateOrganizer(idx, 'name', e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#2563eb]"
                    />
                  </div>
                  <div className="flex-1 space-y-1">
                    <span className="text-[10px] font-bold text-[#64748b] uppercase">CONTACT</span>
                    <input
                      type="text"
                      value={org.contact}
                      onChange={(e) => updateOrganizer(idx, 'contact', e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#2563eb]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeOrganizer(idx)}
                    disabled={organizers.length <= 1}
                    className="self-end p-2 text-[#dc2626] hover:bg-[#fef2f2] rounded-lg disabled:opacity-40"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#334155]">Description*</label>
              <div className="flex items-center space-x-1 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={() => handleFormatText('**', '**')}
                  className="p-1 hover:bg-[#e2e8f0] rounded text-[#64748b] hover:text-[#0f172a] text-xs font-bold"
                >
                  <Bold className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleFormatText('*', '*')}
                  className="p-1 hover:bg-[#e2e8f0] rounded text-[#64748b] hover:text-[#0f172a] text-xs italic"
                >
                  <Italic className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleFormatText('<u>', '</u>')}
                  className="p-1 hover:bg-[#e2e8f0] rounded text-[#64748b] hover:text-[#0f172a] text-xs underline"
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
              className="w-full p-3 text-xs bg-white border border-[#e2e8f0] rounded-xl focus:outline-none focus:border-[#2563eb] text-[#0f172a]"
            />
          </div>

          {/* Banner */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#334155]">Banner Image Preview</label>
            <div className="w-full bg-gradient-to-br from-[#eff6ff] to-[#f8fafc] border-2 border-dashed border-[#bfdbfe] rounded-2xl p-6 text-center flex flex-col items-center justify-center min-h-[140px]">
              {bannerUrl ? (
                <div className="w-full h-36 relative rounded-xl overflow-hidden">
                  <img src={bannerUrl} alt="Banner Preview" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="space-y-1">
                  <Trophy className="w-6 h-6 text-[#2563eb] mx-auto" />
                  <p className="text-xs font-bold text-[#0f172a]">Hackathon Arena Banner</p>
                </div>
              )}
            </div>
            <input
              type="url"
              value={bannerUrl}
              onChange={(e) => setBannerUrl(e.target.value)}
              placeholder="https://images.unsplash.com/... (cover URL)"
              className="w-full px-3.5 py-2 text-xs bg-white border border-[#e2e8f0] rounded-xl focus:outline-none focus:border-[#2563eb]"
            />
          </div>

          {/* Departments */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#f1f5f9]">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#334155]">Primary Host Department*</label>
              <select
                value={primaryDept}
                onChange={(e) => setPrimaryDept(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-[#e2e8f0] rounded-xl focus:outline-none focus:border-[#2563eb]"
              >
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#334155]">Organization / Host Name</label>
              <input
                type="text"
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-[#e2e8f0] rounded-xl focus:outline-none focus:border-[#2563eb]"
              />
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* SECTION 2: TEAM SETTINGS */}
        {/* ======================================================== */}
        <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 shadow-xs space-y-5">
          <div className="border-b border-[#f1f5f9] pb-3">
            <h2 className="text-base font-extrabold text-[#0f172a]">Team Settings & Rules</h2>
            <p className="text-xs text-[#64748b]">Composition limits and year matrix.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#334155]">Min Team Size*</label>
              <input
                type="number"
                min="1"
                max={maxTeamSize}
                value={minTeamSize}
                onChange={(e) => setMinTeamSize(Number(e.target.value))}
                className="w-full px-3.5 py-2 text-xs bg-white border border-[#e2e8f0] rounded-xl font-bold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#334155]">Max Team Size*</label>
              <input
                type="number"
                min={minTeamSize}
                max="10"
                value={maxTeamSize}
                onChange={(e) => setMaxTeamSize(Number(e.target.value))}
                className="w-full px-3.5 py-2 text-xs bg-white border border-[#e2e8f0] rounded-xl font-bold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#334155]">Max Teams Allowed</label>
              <input
                type="number"
                min="1"
                value={maxTeamsAllowed}
                onChange={(e) => setMaxTeamsAllowed(e.target.value)}
                placeholder="Unlimited"
                className="w-full px-3.5 py-2 text-xs bg-white border border-[#e2e8f0] rounded-xl font-bold"
              />
            </div>
          </div>

          {/* Year Criteria */}
          <div className="space-y-2 pt-2 border-t border-[#f1f5f9]">
            <label className="text-xs font-bold text-[#0f172a]">Year Eligibility</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              {[
                { label: '1st Year', key: 'year1' as const },
                { label: '2nd Year', key: 'year2' as const },
                { label: '3rd Year', key: 'year3' as const },
                { label: '4th Year', key: 'year4' as const },
              ].map(({ label, key }) => (
                <div key={key} className="p-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl space-y-2">
                  <span className="text-xs font-bold text-[#0f172a] block">{label}</span>
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div>
                      <span className="text-[#64748b] block mb-0.5">Min</span>
                      <input
                        type="number"
                        min="0"
                        max="4"
                        value={yearCriteria[key].min}
                        onChange={(e) =>
                          setYearCriteria({
                            ...yearCriteria,
                            [key]: { ...yearCriteria[key], min: Number(e.target.value) },
                          })
                        }
                        className="w-full p-1 bg-white border border-[#e2e8f0] rounded text-center font-bold"
                      />
                    </div>
                    <div>
                      <span className="text-[#64748b] block mb-0.5">Max</span>
                      <input
                        type="number"
                        min="0"
                        max="4"
                        value={yearCriteria[key].max}
                        onChange={(e) =>
                          setYearCriteria({
                            ...yearCriteria,
                            [key]: { ...yearCriteria[key], max: Number(e.target.value) },
                          })
                        }
                        className="w-full p-1 bg-white border border-[#e2e8f0] rounded text-center font-bold"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* SECTION 3: IMPORTANT DETAILS */}
        {/* ======================================================== */}
        <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 shadow-xs space-y-5">
          <div className="border-b border-[#f1f5f9] pb-3">
            <h2 className="text-base font-extrabold text-[#0f172a]">Important Details</h2>
            <p className="text-xs text-[#64748b]">Registration timeline.</p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-[#334155] flex items-center space-x-1">
              <Calendar className="w-3.5 h-3.5 text-[#2563eb]" />
              <span>Registration Deadline*</span>
            </label>
            <input
              type="datetime-local"
              required
              value={registrationDeadline}
              onChange={(e) => setRegistrationDeadline(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#e2e8f0] rounded-xl font-medium"
            />
            {registrationDeadline && (
              <p className="text-xs font-semibold text-[#2563eb] bg-[#eff6ff] px-3 py-1.5 rounded-lg border border-[#bfdbfe] inline-block">
                {formatDateDisplay(registrationDeadline)}
              </p>
            )}
          </div>
        </div>

        {/* ======================================================== */}
        {/* SECTION 4: EVALUATION ROUNDS */}
        {/* ======================================================== */}
        <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-[#f1f5f9] pb-3">
            <div>
              <h2 className="text-base font-extrabold text-[#0f172a]">Evaluation Rounds</h2>
              <p className="text-xs text-[#64748b]">Multi-stage rounds and criteria.</p>
            </div>
            <button
              type="button"
              onClick={addRound}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#eff6ff] hover:bg-[#dbeafe] text-[#2563eb] font-bold text-xs rounded-xl border border-[#bfdbfe]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Round</span>
            </button>
          </div>

          <div className="space-y-6">
            {rounds.map((round, rIdx) => (
              <div key={rIdx} className="bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#e2e8f0]">
                  <div className="flex items-center space-x-2">
                    <span className="w-6 h-6 rounded-full bg-[#2563eb] text-white text-xs font-bold flex items-center justify-center">
                      {rIdx + 1}
                    </span>
                    <h3 className="text-sm font-extrabold text-[#0f172a]">{round.name || `Round ${rIdx + 1}`}</h3>
                  </div>
                  <div className="flex items-center space-x-2">
                    <label className="flex items-center space-x-1.5 text-xs text-[#475569] font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={round.isFinal}
                        onChange={(e) => updateRound(rIdx, 'isFinal', e.target.checked)}
                        className="rounded text-[#2563eb]"
                      />
                      <span>Final Round</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => removeRound(rIdx)}
                      className="p-1.5 text-[#dc2626] hover:bg-[#fef2f2] rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#334155]">Round Name*</label>
                    <input
                      type="text"
                      required
                      value={round.name}
                      onChange={(e) => updateRound(rIdx, 'name', e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-[#e2e8f0] rounded-xl font-semibold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#334155]">Round Type</label>
                    <select
                      value={round.roundType}
                      onChange={(e) => updateRound(rIdx, 'roundType', e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-[#e2e8f0] rounded-xl"
                    >
                      <option value="Mock Hackathon">Mock Hackathon</option>
                      <option value="Hackathon">Hackathon</option>
                      <option value="Ideation / Pitch">Ideation / Pitch</option>
                      <option value="Prototype Demo">Prototype Demo</option>
                    </select>
                  </div>
                </div>

                {/* Criteria */}
                <div className="space-y-3 pt-2 border-t border-[#e2e8f0]">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[#0f172a] flex items-center space-x-1">
                      <Award className="w-3.5 h-3.5 text-[#2563eb]" />
                      <span>Scoring Criteria</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => addCriterion(rIdx)}
                      className="text-xs font-bold text-[#2563eb] inline-flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Criterion</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    {round.criteria?.map((crit, cIdx) => (
                      <div
                        key={cIdx}
                        className="flex flex-col sm:flex-row items-start sm:items-center gap-2 p-2.5 bg-white border border-[#e2e8f0] rounded-xl"
                      >
                        <input
                          type="text"
                          required
                          placeholder="Criterion Name"
                          value={crit.name}
                          onChange={(e) => updateCriterion(rIdx, cIdx, 'name', e.target.value)}
                          className="flex-1 px-2.5 py-1 text-xs border border-[#e2e8f0] rounded-lg font-medium"
                        />
                        <div className="flex items-center space-x-1 w-28">
                          <span className="text-[10px] text-[#64748b]">Max Marks:</span>
                          <input
                            type="number"
                            min="1"
                            max="100"
                            value={crit.maxMarks}
                            onChange={(e) => updateCriterion(rIdx, cIdx, 'maxMarks', Number(e.target.value))}
                            className="w-12 p-1 text-xs border border-[#e2e8f0] rounded-lg text-center font-bold"
                          />
                        </div>
                        <input
                          type="text"
                          placeholder="Description"
                          value={crit.description}
                          onChange={(e) => updateCriterion(rIdx, cIdx, 'description', e.target.value)}
                          className="flex-1 px-2.5 py-1 text-xs border border-[#e2e8f0] rounded-lg text-[#64748b]"
                        />
                        <button
                          type="button"
                          onClick={() => removeCriterion(rIdx, cIdx)}
                          className="p-1 text-[#dc2626] hover:bg-[#fef2f2] rounded-lg"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ======================================================== */}
        {/* SECTION 5: PROBLEM STATEMENTS */}
        {/* ======================================================== */}
        <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-[#f1f5f9] pb-3">
            <div>
              <h2 className="text-base font-extrabold text-[#0f172a]">Problem Statements</h2>
              <p className="text-xs text-[#64748b]">Official challenges and prompts.</p>
            </div>
            <button
              type="button"
              onClick={addProblemStatement}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#eff6ff] hover:bg-[#dbeafe] text-[#2563eb] font-bold text-xs rounded-xl border border-[#bfdbfe]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Problem Statement</span>
            </button>
          </div>

          <div className="space-y-4">
            {problemStatements.map((ps, pIdx) => (
              <div key={pIdx} className="p-4 bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Lightbulb className="w-4 h-4 text-[#eab308]" />
                    <span className="text-xs font-bold text-[#0f172a]">Problem #{pIdx + 1}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeProblemStatement(pIdx)}
                    className="p-1 text-[#dc2626] hover:bg-[#fef2f2] rounded-lg"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-[#64748b] uppercase block mb-1">Track</label>
                    <input
                      type="text"
                      required
                      value={ps.track}
                      onChange={(e) => updateProblemStatement(pIdx, 'track', e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-[#e2e8f0] rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-[#64748b] uppercase block mb-1">Code</label>
                    <input
                      type="text"
                      required
                      value={ps.code}
                      onChange={(e) => updateProblemStatement(pIdx, 'code', e.target.value.toUpperCase())}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-[#e2e8f0] rounded-lg font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-[#64748b] uppercase block mb-1">Title</label>
                    <input
                      type="text"
                      required
                      value={ps.title}
                      onChange={(e) => updateProblemStatement(pIdx, 'title', e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-[#e2e8f0] rounded-lg font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-[#64748b] uppercase block mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={ps.description}
                    onChange={(e) => updateProblemStatement(pIdx, 'description', e.target.value)}
                    className="w-full p-2.5 text-xs bg-white border border-[#e2e8f0] rounded-lg"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Save Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-[#e2e8f0]">
          <Link
            href={`/organizer/hackathons/${id}`}
            className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold text-[#64748b] hover:text-[#0f172a] bg-white border border-[#e2e8f0] rounded-xl text-center"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto px-6 py-2.5 text-xs font-extrabold text-white bg-[#2563eb] hover:bg-[#1d4ed8] rounded-xl transition-all shadow-sm disabled:opacity-50 inline-flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Saving Changes...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Save Hackathon Changes</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
