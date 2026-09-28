'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
  Clock,
  Bold,
  Italic,
  Underline,
  ShieldAlert,
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

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [unauthorized, setUnauthorized] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [tagline, setTagline] = useState('');
  const [prizePool, setPrizePool] = useState<number | string>(35000);
  const [currency, setCurrency] = useState('USD');
  const [description, setDescription] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [status, setStatus] = useState('PUBLISHED');

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
  const [maxTeamsAllowed, setMaxTeamsAllowed] = useState<string>('100');

  // Year criteria
  const [yearCriteria, setYearCriteria] = useState({
    year1: { min: 0, max: 4 },
    year2: { min: 0, max: 4 },
    year3: { min: 0, max: 4 },
    year4: { min: 0, max: 4 },
  });

  // Important Dates & Submission Window
  const [registrationDeadline, setRegistrationDeadline] = useState('');
  const [eventStartTime, setEventStartTime] = useState('');
  const [eventEndTime, setEventEndTime] = useState('');
  const [subStartTime, setSubStartTime] = useState('');
  const [subEndTime, setSubEndTime] = useState('');

  // Evaluation Rounds
  const [rounds, setRounds] = useState<EvaluationRound[]>([
    {
      name: 'The Qualifiers',
      isFinal: false,
      roundType: 'Mock Hackathon',
      startDate: '',
      endDate: '',
      submissionDeadline: '',
      maxTeamsAllowed: 60,
      requiredSubmissions: {
        github: true,
        ppt: false,
        video: false,
        document: false,
        techStack: true,
      },
      termsAndConditions: 'All code must be original and built during the allocated hackathon round window.',
      criteria: [
        { name: 'Innovation & Idea', maxMarks: 25, description: 'Originality of the idea and relevance of problem statement' },
        { name: 'Technical Implementation', maxMarks: 25, description: 'Code quality and architecture' },
        { name: 'UI/UX Design', maxMarks: 20, description: 'User experience and polish' },
        { name: 'Presentation & Pitch', maxMarks: 15, description: 'Demo clarity' },
        { name: 'Business Impact', maxMarks: 15, description: 'Real-world value' },
      ],
    },
  ]);

  // Load hackathon data
  const fetchHackathon = useCallback(async () => {
    setLoading(true);
    setError(null);
    setUnauthorized(false);
    try {
      const res = await fetch(`/api/v1/hackathons/${id}`);
      const json = await res.json();
      if (res.status === 403) {
        setUnauthorized(true);
        setError('You are not authorized to manage this hackathon. It is assigned to another organizer.');
        return;
      }
      if (json.success && json.data) {
        const h = json.data.hackathon || json.data;
        setTitle(h.title || '');
        setSlug(h.slug || '');
        setTagline(h.tagline || '');
        setDescription(h.description || '');
        setBannerUrl(h.bannerUrl || '');
        setOrganizationName(h.organizationName || '');
        setStatus(h.status || 'PUBLISHED');
        setMinTeamSize(h.minTeamSize || 2);
        setMaxTeamSize(h.maxTeamSize || 4);

        if (h.regEndTime) {
          setRegistrationDeadline(new Date(h.regEndTime).toISOString().slice(0, 16));
        }
        if (h.eventStartTime) {
          setEventStartTime(new Date(h.eventStartTime).toISOString().slice(0, 16));
        }
        if (h.eventEndTime) {
          setEventEndTime(new Date(h.eventEndTime).toISOString().slice(0, 16));
        }
        if (h.subStartTime) {
          setSubStartTime(new Date(h.subStartTime).toISOString().slice(0, 16));
        }
        if (h.subEndTime) {
          setSubEndTime(new Date(h.subEndTime).toISOString().slice(0, 16));
        }

        if (h.prizes && h.prizes.length > 0) {
          const sum = h.prizes.reduce((acc: number, p: any) => acc + Number(p.amount || 0), 0);
          setPrizePool(sum);
          setCurrency(h.prizes[0].currency || 'USD');
        }

        if (h.rulesAndGuidelines) {
          try {
            const parsed = JSON.parse(h.rulesAndGuidelines);
            if (parsed.organizers && Array.isArray(parsed.organizers) && parsed.organizers.length > 0) {
              setOrganizers(parsed.organizers);
            } else if (h.organizer?.fullName) {
              setOrganizers([{ name: h.organizer.fullName, contact: h.organizer.email || '' }]);
            }

            if (parsed.primaryDepartment) setPrimaryDept(parsed.primaryDepartment);
            if (parsed.collaboratingDepartments && Array.isArray(parsed.collaboratingDepartments)) {
              setCollabDepts(parsed.collaboratingDepartments);
            }
            if (parsed.maxTeamsAllowed !== undefined) {
              setMaxTeamsAllowed(parsed.maxTeamsAllowed ? parsed.maxTeamsAllowed.toString() : '');
            }
            if (parsed.yearCriteria) setYearCriteria(parsed.yearCriteria);
            if (parsed.rounds && Array.isArray(parsed.rounds)) setRounds(parsed.rounds);
            if (parsed.prizePool !== undefined && Number(parsed.prizePool) > 0) {
              setPrizePool(parsed.prizePool);
            }
            if (parsed.currency) setCurrency(parsed.currency);
          } catch {
            if (h.organizer?.fullName) {
              setOrganizers([{ name: h.organizer.fullName, contact: h.organizer.email || '' }]);
            }
          }
        } else if (h.organizer?.fullName) {
          setOrganizers([{ name: h.organizer.fullName, contact: h.organizer.email || '' }]);
        }
      } else {
        setError(json.error?.message || json.message || 'Failed to load hackathon details');
      }
    } catch {
      setError('Network error loading hackathon');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchHackathon();
  }, [fetchHackathon]);

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

  const addRound = () => {
    setRounds([
      ...rounds,
      {
        name: `Round ${rounds.length + 1}`,
        isFinal: false,
        roundType: 'Hackathon',
        startDate: eventStartTime,
        endDate: eventEndTime,
        submissionDeadline: eventEndTime,
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccessMsg(null);

    try {
      if (subStartTime && subEndTime) {
        const start = new Date(subStartTime).getTime();
        const end = new Date(subEndTime).getTime();
        if (start >= end) {
          setError('Submission deadline must be after submission opening time.');
          setSaving(false);
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }
      }

      const cleanedOrganizers = organizers.filter((o) => o.name.trim() !== '');

      const extendedConfig = {
        organizers: cleanedOrganizers,
        primaryDepartment: primaryDept,
        collaboratingDepartments: collabDepts,
        maxTeamsAllowed: maxTeamsAllowed ? Number(maxTeamsAllowed) : null,
        yearCriteria,
        rounds,
        prizePool: Number(prizePool) || 0,
        currency,
      };

      const payload = {
        title: title.trim(),
        slug,
        tagline: tagline.trim() || undefined,
        description: description.trim(),
        bannerUrl: bannerUrl.trim() || null,
        minTeamSize: Number(minTeamSize),
        maxTeamSize: Number(maxTeamSize),
        regEndTime: registrationDeadline ? new Date(registrationDeadline).toISOString() : undefined,
        eventStartTime: eventStartTime ? new Date(eventStartTime).toISOString() : undefined,
        eventEndTime: eventEndTime ? new Date(eventEndTime).toISOString() : undefined,
        subStartTime: subStartTime ? new Date(subStartTime).toISOString() : undefined,
        subEndTime: subEndTime ? new Date(subEndTime).toISOString() : undefined,
        prizePool: Number(prizePool) || 0,
        currency,
        rulesAndGuidelines: JSON.stringify(extendedConfig),
      };

      const res = await fetch(`/api/v1/hackathons/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg('Submission window and hackathon configuration saved successfully!');
        setTimeout(() => setSuccessMsg(null), 4000);
      } else {
        setError(data.error?.message || data.message || 'Failed to update hackathon');
      }
    } catch {
      setError('An unexpected network error occurred while saving.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-xs text-[#64748b] bg-white border border-[#e2e8f0] rounded-2xl max-w-5xl mx-auto shadow-xs">
        <RefreshCw className="w-6 h-6 text-[#2563eb] animate-spin mx-auto mb-2" />
        Loading hackathon configuration...
      </div>
    );
  }

  if (unauthorized) {
    return (
      <div className="max-w-2xl mx-auto p-12 text-center bg-white border border-[#fecaca] rounded-2xl shadow-xs space-y-4 my-12">
        <div className="w-12 h-12 rounded-full bg-[#fef2f2] text-[#dc2626] border border-[#fecaca] flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-[#0f172a]">Access Restricted</h2>
        <p className="text-xs text-[#64748b] max-w-md mx-auto leading-relaxed">
          You are not authorized to manage this hackathon. Organizers can only manage events assigned to their account.
        </p>
        <div className="pt-2">
          <Link
            href="/organizer/hackathons"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Assigned Hackathons</span>
          </Link>
        </div>
      </div>
    );
  }

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
        <span className="text-[#0f172a] font-semibold">Edit Hackathon</span>
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
                Edit Hackathon
              </h1>
              <p className="text-xs text-[#64748b] mt-1 font-normal">
                Update the details and configuration for this event.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-center">
          <Link
            href={`/hackathons/${slug}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#334155] bg-white border border-[#e2e8f0] hover:bg-[#f8fafc] hover:border-[#cbd5e1] hover:text-[#2563eb] rounded-xl shadow-xs transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5 text-[#64748b]" />
            <span>Public View</span>
          </Link>
        </div>
      </div>

      {/* Success / Error Messages */}
      {successMsg && (
        <div className="p-4 bg-[#f0fdf4] border border-[#bbf7d0] rounded-2xl text-xs text-[#166534] flex items-center space-x-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-[#166534] flex-shrink-0" />
          <span className="font-semibold">{successMsg}</span>
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
          <div className="border-b border-[#f1f5f9] pb-3">
            <h2 className="text-base font-extrabold text-[#0f172a]">Event Details</h2>
            <p className="text-xs text-[#64748b]">Core hackathon information and branding.</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#334155]">
              Hackathon Title*
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. ATLYX Global AI Hackathon 2026"
              className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#e2e8f0] rounded-xl focus:outline-none focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/10 text-[#0f172a] font-medium transition-all"
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
              className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#e2e8f0] rounded-xl focus:outline-none focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/10 text-[#0f172a] font-medium transition-all"
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
                  className="w-full pl-8 pr-3.5 py-2.5 text-xs bg-white border border-[#e2e8f0] rounded-xl focus:outline-none focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/10 text-[#0f172a] font-bold"
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
                className="inline-flex items-center gap-1 text-xs font-bold text-[#2563eb] hover:text-[#1d4ed8]"
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
                      className="w-full px-3 py-1.5 text-xs bg-white border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#2563eb]"
                    />
                  </div>
                  <div className="flex-1 space-y-1">
                    <span className="text-[10px] font-bold text-[#64748b] uppercase">CONTACT</span>
                    <input
                      type="text"
                      value={org.contact}
                      onChange={(e) => updateOrganizer(idx, 'contact', e.target.value)}
                      placeholder="e.g. +1 555-0199 or alex@atlyx.edu"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#2563eb]"
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

          {/* Description */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#334155]">
                Description* (min 20 characters)
              </label>
              <div className="flex items-center space-x-1 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg p-0.5">
                <button type="button" className="p-1 hover:bg-[#e2e8f0] rounded text-[#64748b] text-xs font-bold" title="Bold">
                  <Bold className="w-3.5 h-3.5" />
                </button>
                <button type="button" className="p-1 hover:bg-[#e2e8f0] rounded text-[#64748b] text-xs italic" title="Italic">
                  <Italic className="w-3.5 h-3.5" />
                </button>
                <button type="button" className="p-1 hover:bg-[#e2e8f0] rounded text-[#64748b] text-xs underline" title="Underline">
                  <Underline className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide a comprehensive overview of the event, eligibility, and core challenges..."
              className="w-full p-3 text-xs bg-white border border-[#e2e8f0] rounded-xl focus:outline-none focus:border-[#2563eb] text-[#0f172a] transition-all"
            />
          </div>

          {/* Banner Preview */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#334155]">Banner Image Preview</label>
            <div className="w-full bg-gradient-to-br from-[#eff6ff] to-[#f8fafc] border-2 border-dashed border-[#bfdbfe] rounded-2xl p-8 text-center flex flex-col items-center justify-center min-h-[140px] relative overflow-hidden group">
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
                className="w-full px-3 py-2 text-xs bg-white border border-[#e2e8f0] rounded-xl focus:outline-none focus:border-[#2563eb]"
              />
            </div>
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
                onChange={(e) => setMinTeamSize(Number(e.target.value))}
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
                className="w-full px-3.5 py-2 text-xs bg-white border border-[#e2e8f0] rounded-xl focus:outline-none focus:border-[#2563eb]"
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

          <div className="p-4 bg-[#eff6ff] border border-[#dbeafe] rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mt-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-[#0f172a]">Team Member Form Builder</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#ecfdf5] text-[#059669] border border-[#a7f3d0]">
                  Published
                </span>
              </div>
              <p className="text-[11px] text-[#64748b] mt-0.5">
                Configure required teammate questions, custom fields, and academic criteria.
              </p>
            </div>

            <Link
              href={`/organizer/hackathons/${id}/team-form`}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-[#2563eb] hover:bg-[#1d4ed8] rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <span>Edit Form Builder</span>
            </Link>
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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#334155]">Registration Deadline*</label>
              <input
                type="datetime-local"
                required
                value={registrationDeadline}
                onChange={(e) => setRegistrationDeadline(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-white border border-[#e2e8f0] rounded-xl focus:outline-none focus:border-[#2563eb]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#334155]">Event Start Date & Time*</label>
              <input
                type="datetime-local"
                required
                value={eventStartTime}
                onChange={(e) => setEventStartTime(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-white border border-[#e2e8f0] rounded-xl focus:outline-none focus:border-[#2563eb]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#334155]">Event End Date & Time*</label>
              <input
                type="datetime-local"
                required
                value={eventEndTime}
                onChange={(e) => setEventEndTime(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-white border border-[#e2e8f0] rounded-xl focus:outline-none focus:border-[#2563eb]"
              />
            </div>
          </div>

          {/* Dedicated Authoritative Submission Window Configuration */}
          <div className="pt-3 border-t border-[#f1f5f9] space-y-3">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-[#2563eb]" />
              <h3 className="text-xs font-extrabold text-[#0f172a] uppercase tracking-wider">
                Submission Window Configuration (Server Authoritative)
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#334155] flex items-center justify-between">
                  <span>Submission Opens*</span>
                  <span className="text-[10px] text-[#64748b] font-normal">Participants can begin submitting</span>
                </label>
                <input
                  type="datetime-local"
                  required
                  value={subStartTime}
                  onChange={(e) => setSubStartTime(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-white border border-[#e2e8f0] rounded-xl focus:outline-none focus:border-[#2563eb]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#334155] flex items-center justify-between">
                  <span>Submission Deadline*</span>
                  <span className="text-[10px] text-[#dc2626] font-normal">Strict cutoff for all solutions</span>
                </label>
                <input
                  type="datetime-local"
                  required
                  value={subEndTime}
                  onChange={(e) => setSubEndTime(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-white border border-[#e2e8f0] rounded-xl focus:outline-none focus:border-[#2563eb]"
                />
              </div>
            </div>

            {subStartTime && subEndTime && (
              <div className="p-3 bg-[#eff6ff] border border-[#dbeafe] rounded-xl text-xs text-[#1e40af] flex items-center justify-between">
                <span>
                  Configured Window: <strong>{new Date(subStartTime).toLocaleString()}</strong> to{' '}
                  <strong>{new Date(subEndTime).toLocaleString()}</strong>
                </span>
                {new Date(subStartTime) >= new Date(subEndTime) && (
                  <span className="text-[#dc2626] font-bold">
                    ⚠️ Submission deadline must be after opening time.
                  </span>
                )}
              </div>
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
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-[#2563eb] bg-[#eff6ff] border border-[#dbeafe] hover:bg-[#dbeafe]/50 rounded-xl shadow-xs transition-colors self-start sm:self-auto"
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
                  className="bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl p-5 space-y-5 relative"
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
                      className="p-1.5 text-[#dc2626] hover:bg-[#fee2e2] rounded-lg transition-colors disabled:opacity-30"
                      title="Delete Round"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-[#64748b] uppercase">ROUND NAME</span>
                        <label className="flex items-center space-x-1 cursor-pointer">
                          <span className="text-[10px] font-bold text-[#64748b] uppercase">FINAL ROUND</span>
                          <input
                            type="checkbox"
                            checked={round.isFinal}
                            onChange={(e) => updateRound(rIdx, 'isFinal', e.target.checked)}
                            className="rounded text-[#2563eb] focus:ring-[#2563eb]"
                          />
                        </label>
                      </div>
                      <input
                        type="text"
                        value={round.name}
                        onChange={(e) => updateRound(rIdx, 'name', e.target.value)}
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-[#64748b] uppercase">START DATE & TIME</span>
                      <input
                        type="datetime-local"
                        value={round.startDate}
                        onChange={(e) => updateRound(rIdx, 'startDate', e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-white border border-[#e2e8f0] rounded-xl focus:outline-none focus:border-[#2563eb]"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-[#64748b] uppercase">END DATE & TIME</span>
                      <input
                        type="datetime-local"
                        value={round.endDate}
                        onChange={(e) => updateRound(rIdx, 'endDate', e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-white border border-[#e2e8f0] rounded-xl focus:outline-none focus:border-[#2563eb]"
                      />
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
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold border flex items-center space-x-1.5 transition-all ${
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
                    <textarea
                      rows={3}
                      value={round.termsAndConditions}
                      onChange={(e) => updateRound(rIdx, 'termsAndConditions', e.target.value)}
                      placeholder="Specify terms, rules, and automatic disqualification criteria..."
                      className="w-full p-2.5 text-xs bg-white border border-[#e2e8f0] rounded-xl focus:outline-none focus:border-[#2563eb] text-[#0f172a]"
                    />
                  </div>

                  <div className="p-3.5 bg-white border border-[#e2e8f0] rounded-xl space-y-3">
                    <div className="flex items-center justify-between pb-1 border-b border-[#f1f5f9]">
                      <span className="text-[10px] font-bold text-[#2563eb] uppercase tracking-wider flex items-center space-x-1">
                        <Award className="w-3.5 h-3.5 mr-1" />
                        JURY EVALUATION MARKING CRITERIA
                      </span>

                      <button
                        type="button"
                        onClick={() => addCriterion(rIdx)}
                        className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold text-white bg-[#2563eb] hover:bg-[#1d4ed8] rounded-xl shadow-xs transition-colors"
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
                                className="p-1 text-[#dc2626] hover:bg-[#fef2f2] rounded-lg transition-colors disabled:opacity-30"
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
                <span>Saving Changes...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
