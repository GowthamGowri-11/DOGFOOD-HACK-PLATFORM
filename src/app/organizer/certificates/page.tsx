'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Award,
  Upload,
  FileSpreadsheet,
  Layers,
  Save,
  Trash2,
  Eye,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  ChevronRight,
  Shield,
  ShieldCheck,
  Trophy,
  X,
  Type,
  Move,
  Palette,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Search,
  Sparkles,
  Download,
  Users,
  Check,
} from 'lucide-react';
import { parseDataSheet, getSampleDataSheet, ParsedParticipant } from '@/lib/services/datasheet-parser';

export interface FieldConfig {
  id: string;
  label: string;
  badgeColor: string;
  badgeBorder: string;
  badgeBg: string;
  sampleValue: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  fontFamily: 'serif' | 'sans' | 'mono' | 'cursive';
  fontSize: number; // in px
  fontWeight: 'normal' | '500' | 'bold' | '900';
  color: string;
  align: 'left' | 'center' | 'right';
  visible: boolean;
}

function getFontFamilyCss(family: string) {
  switch (family) {
    case 'serif':
      return 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif';
    case 'mono':
      return 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
    case 'cursive':
      return '"Brush Script MT", "Playwrite CU", "Dancing Script", cursive';
    default:
      return 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  }
}

const DEFAULT_FIELDS: Record<string, FieldConfig> = {
  participantName: {
    id: 'participantName',
    label: 'Participant Name',
    badgeColor: '#8B5CF6',
    badgeBorder: '#7C3AED',
    badgeBg: '#8B5CF6',
    sampleValue: 'John Doe',
    x: 50,
    y: 35,
    fontFamily: 'serif',
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0F172A',
    align: 'center',
    visible: true,
  },
  college: {
    id: 'college',
    label: 'College',
    badgeColor: '#10B981',
    badgeBorder: '#059669',
    badgeBg: '#10B981',
    sampleValue: 'Apex Institute of Technology',
    x: 50,
    y: 47,
    fontFamily: 'serif',
    fontSize: 15,
    fontWeight: 'bold',
    color: '#334155',
    align: 'center',
    visible: true,
  },
  hackathonName: {
    id: 'hackathonName',
    label: 'Hackathon Name',
    badgeColor: '#F59E0B',
    badgeBorder: '#D97706',
    badgeBg: '#F59E0B',
    sampleValue: 'Apex Global Hackathon 2026',
    x: 50,
    y: 58,
    fontFamily: 'sans',
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FA541C',
    align: 'center',
    visible: true,
  },
  department: {
    id: 'department',
    label: 'Department',
    badgeColor: '#06B6D4',
    badgeBorder: '#0891B2',
    badgeBg: '#06B6D4',
    sampleValue: 'Computer Science & Engineering',
    x: 22,
    y: 72,
    fontFamily: 'sans',
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0F172A',
    align: 'center',
    visible: true,
  },
  teamName: {
    id: 'teamName',
    label: 'Team Name',
    badgeColor: '#6366F1',
    badgeBorder: '#4F46E5',
    badgeBg: '#6366F1',
    sampleValue: 'Team Phoenix',
    x: 50,
    y: 72,
    fontFamily: 'sans',
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0F172A',
    align: 'center',
    visible: true,
  },
  collaborationDept: {
    id: 'collaborationDept',
    label: 'Collaboration Dept',
    badgeColor: '#3B82F6',
    badgeBorder: '#2563EB',
    badgeBg: '#3B82F6',
    sampleValue: 'AI & Data Science',
    x: 78,
    y: 72,
    fontFamily: 'sans',
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0F172A',
    align: 'center',
    visible: true,
  },
  date: {
    id: 'date',
    label: 'Date',
    badgeColor: '#EC4899',
    badgeBorder: '#DB2777',
    badgeBg: '#EC4899',
    sampleValue: 'September 29, 2026',
    x: 22,
    y: 88,
    fontFamily: 'sans',
    fontSize: 11,
    fontWeight: '500',
    color: '#475569',
    align: 'center',
    visible: true,
  },
  certificateId: {
    id: 'certificateId',
    label: 'Certificate ID',
    badgeColor: '#EF4444',
    badgeBorder: '#DC2626',
    badgeBg: '#EF4444',
    sampleValue: 'APEX-2026-X9B2F',
    x: 78,
    y: 88,
    fontFamily: 'mono',
    fontSize: 11,
    fontWeight: 'bold',
    color: '#DC2626',
    align: 'center',
    visible: true,
  },
};

const DEFAULT_CERTIFICATE_STYLE = {
  borderColor: '#1E293B', // Slate 800
  innerBorderColor: '#D97706', // Warm Gold
  bgColor: '#FFFDF9',
  textColor: '#0F172A',
  institutionTitle: 'INTERNATIONAL HACKATHON ARENA',
  institutionSub: 'Authorized Credential & Innovation Adjudication Board',
  watermark: 'ATLYX',
  emblemText: '★',
  emblemBg: '#FA541C',
  emblemTextColor: '#FFFFFF',
  titleText: 'CERTIFICATE OF ACHIEVEMENT',
};

export default function CertificateManagementPage() {
  const [activeTab, setActiveTab] = useState<'templates' | 'overview' | 'datasheet'>('templates');
  const [hackathons, setHackathons] = useState<any[]>([]);
  const [selectedHackathonId, setSelectedHackathonId] = useState<string>('');
  const [fields, setFields] = useState<Record<string, FieldConfig>>(DEFAULT_FIELDS);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>('participantName');

  // Custom Upload Template State
  const [templateImageUrl, setTemplateImageUrl] = useState<string | null>(null);
  const [templateName, setTemplateName] = useState('Default Certificate Template');
  const [templateStatus, setTemplateStatus] = useState('Default Base Active');
  const [showGuidelinesOverCustom, setShowGuidelinesOverCustom] = useState(true);

  // Active certificate style
  const activePreset = DEFAULT_CERTIFICATE_STYLE;

  // Dragging state
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState<string | null>(null);

  // Data sheet state
  const [dataSheetParticipants, setDataSheetParticipants] = useState<ParsedParticipant[]>([]);
  const [parsing, setParsing] = useState(false);
  const [uploadFileName, setUploadFileName] = useState<string | null>(null);
  const [issuing, setIssuing] = useState(false);
  const [issuedResults, setIssuedResults] = useState<any[]>([]);
  const [previewParticipant, setPreviewParticipant] = useState<ParsedParticipant | null>(null);
  const [searchFilter, setSearchFilter] = useState('');

  // Overview certificates list
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loadingCerts, setLoadingCerts] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showFullPreview, setShowFullPreview] = useState(false);

  // Load Hackathons and saved template preferences
  useEffect(() => {
    async function loadHackathons() {
      try {
        const res = await fetch('/api/v1/hackathons');
        const json = await res.json();
        if (json.data?.hackathons && json.data.hackathons.length > 0) {
          setHackathons(json.data.hackathons);
          setSelectedHackathonId(json.data.hackathons[0].id);
        } else {
          setHackathons([
            { id: 'hack_apex_2026', title: 'Apex Enterprise Hackathon 2026', slug: 'apex-2026' },
            { id: 'hack_frontier_2026', title: 'Frontier AI Global Summit', slug: 'frontier-2026' },
          ]);
          setSelectedHackathonId('hack_apex_2026');
        }
      } catch {
        setHackathons([
          { id: 'hack_apex_2026', title: 'Apex Enterprise Hackathon 2026', slug: 'apex-2026' },
          { id: 'hack_frontier_2026', title: 'Frontier AI Global Summit', slug: 'frontier-2026' },
        ]);
        setSelectedHackathonId('hack_apex_2026');
      }
    }
    loadHackathons();

    // Load saved template config if in localStorage
    try {
      const version = localStorage.getItem('dogfood_certificate_config_version');
      const savedConfig = localStorage.getItem('dogfood_certificate_template_config');
      if (savedConfig && version === 'v3_uncollided_layout') {
        setFields(JSON.parse(savedConfig));
      } else {
        // Upgrade to optimal uncollided layout
        setFields(DEFAULT_FIELDS);
        localStorage.setItem('dogfood_certificate_template_config', JSON.stringify(DEFAULT_FIELDS));
        localStorage.setItem('dogfood_certificate_config_version', 'v3_uncollided_layout');
      }
      const savedImg = localStorage.getItem('dogfood_custom_template_image');
      const savedName = localStorage.getItem('dogfood_custom_template_name');
      if (savedImg) {
        setTemplateImageUrl(savedImg);
        setTemplateName(savedName || 'Custom Uploaded Template');
        setTemplateStatus('Custom Template Active (PNG)');
      }
    } catch {}
  }, []);

  // Fetch issued certificates when hackathon changes
  useEffect(() => {
    if (selectedHackathonId) {
      fetchCertificates(selectedHackathonId);
    }
  }, [selectedHackathonId]);

  const fetchCertificates = async (hId: string) => {
    try {
      setLoadingCerts(true);
      const res = await fetch(`/api/v1/certificates?hackathonId=${hId}`);
      const json = await res.json();
      if (res.ok && json.data?.certificates) {
        setCertificates(json.data.certificates);
      }
    } catch {
      setCertificates([]);
    } finally {
      setLoadingCerts(false);
    }
  };

  // Canvas Drag Handling
  const handleMouseDown = (fieldId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFieldId(fieldId);
    setIsDragging(fieldId);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.min(Math.max(0, ((e.clientX - rect.left) / rect.width) * 100), 100);
    const y = Math.min(Math.max(0, ((e.clientY - rect.top) / rect.height) * 100), 100);

    setFields((prev) => ({
      ...prev,
      [isDragging]: {
        ...prev[isDragging],
        x: Math.round(x),
        y: Math.round(y),
      },
    }));
  };

  const handleMouseUp = () => {
    setIsDragging(null);
  };

  // Save template configuration
  const handleSaveConfig = () => {
    try {
      localStorage.setItem('dogfood_certificate_template_config', JSON.stringify(fields));
      localStorage.setItem('dogfood_certificate_config_version', 'v3_uncollided_layout');
      setNotification({
        type: 'success',
        message: 'Template configuration and dynamic field coordinates saved successfully!',
      });
      setTimeout(() => setNotification(null), 3000);
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Failed to save configuration.' });
    }
  };

  // Reset coordinates to perfect uncollided layout
  const handleResetConfig = () => {
    setFields(DEFAULT_FIELDS);
    try {
      localStorage.setItem('dogfood_certificate_template_config', JSON.stringify(DEFAULT_FIELDS));
      localStorage.setItem('dogfood_certificate_config_version', 'v3_uncollided_layout');
    } catch {}
    setNotification({ type: 'success', message: 'Certificate layout auto-aligned with zero overlapping fields!' });
    setTimeout(() => setNotification(null), 2500);
  };

  // Handle File Upload or Drag-and-Drop for Custom Template
  const handleTemplateFile = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const dataUrl = uploadEvent.target?.result as string;
      if (dataUrl) {
        setTemplateImageUrl(dataUrl);
        setTemplateName(file.name);
        setTemplateStatus(`Custom Template Active (${file.type.split('/')[1]?.toUpperCase() || 'PNG'})`);
        try {
          localStorage.setItem('dogfood_custom_template_image', dataUrl);
          localStorage.setItem('dogfood_custom_template_name', file.name);
        } catch {}
        setNotification({
          type: 'success',
          message: `Custom template "${file.name}" loaded successfully! The canvas has updated with your custom background.`,
        });
        setTimeout(() => setNotification(null), 3500);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleTemplateFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleTemplateFile(file);
  };

  // Remove custom uploaded template and revert to default clean base
  const handleRemoveCustomTemplate = () => {
    setTemplateImageUrl(null);
    setTemplateName('Default Certificate Template');
    setTemplateStatus('Default Base Active');
    try {
      localStorage.removeItem('dogfood_custom_template_image');
      localStorage.removeItem('dogfood_custom_template_name');
      localStorage.removeItem('dogfood_certificate_preset_id');
    } catch {}
    setNotification({
      type: 'success',
      message: 'Custom template removed. Clean certificate base is active.',
    });
    setTimeout(() => setNotification(null), 2500);
  };

  // Data Sheet File Upload (Spreadsheet XLSX / CSV / TSV / JSON)
  const handleDataSheetUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setParsing(true);
      setUploadFileName(file.name);
      const res = await parseDataSheet(file);
      if (!res.success) {
        throw new Error(res.error || 'Failed to parse sheet');
      }
      setDataSheetParticipants(res.participants);
      setNotification({
        type: 'success',
        message: `Successfully parsed ${res.participantCount} participants across ${res.teamCount} teams from ${file.name}.`,
      });
      setActiveTab('datasheet');
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Error parsing data sheet.' });
    } finally {
      setParsing(false);
    }
  };

  // Load benchmark sample data sheet
  const handleLoadSampleDataSheet = () => {
    const samples = getSampleDataSheet();
    setDataSheetParticipants(samples);
    setUploadFileName('kit_coimbatore_hackathon_teams.xlsx');
    setNotification({
      type: 'success',
      message: `Loaded sample data sheet: ${samples.length} participants across 4 teams ready for issuance.`,
    });
    setActiveTab('datasheet');
  };

  // Issue Certificates to All Participants in Teams
  const handleIssueToAll = async () => {
    if (!selectedHackathonId) {
      setNotification({ type: 'error', message: 'Please select a hackathon first.' });
      return;
    }
    if (dataSheetParticipants.length === 0) {
      setNotification({ type: 'error', message: 'No participants available in the data sheet.' });
      return;
    }

    try {
      setIssuing(true);
      setNotification(null);

      const res = await fetch('/api/v1/certificates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hackathonId: selectedHackathonId,
          participants: dataSheetParticipants,
          templateConfig: fields,
          type: 'PARTICIPANT',
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || 'Failed to issue certificates');
      }

      setIssuedResults(json.data?.certificates || []);
      setNotification({
        type: 'success',
        message: `Successfully issued ${json.data?.count || dataSheetParticipants.length} verified certificates to all team participants!`,
      });

      // Refresh overview certificates list
      fetchCertificates(selectedHackathonId);
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Failed to issue certificates.' });
    } finally {
      setIssuing(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const activeField = selectedFieldId ? fields[selectedFieldId] : null;

  // Filtered participants list
  const filteredParticipants = dataSheetParticipants.filter(
    (p) =>
      p.participantName.toLowerCase().includes(searchFilter.toLowerCase()) ||
      p.teamName.toLowerCase().includes(searchFilter.toLowerCase()) ||
      p.department.toLowerCase().includes(searchFilter.toLowerCase()) ||
      p.email.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div
      className="space-y-6 select-none font-sans max-w-7xl mx-auto pb-16 px-4"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* ================= BREADCRUMBS ================= */}
      <div className="flex items-center gap-1.5 text-xs text-stone-500 font-medium pt-2">
        <Link href="/" className="hover:text-stone-800 transition-colors">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
        <Link href="/organizer/dashboard" className="hover:text-stone-800 transition-colors">
          Organizer
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
        <span className="text-stone-900 font-semibold">Certificate Management</span>
      </div>

      {/* ================= HEADER & TABS ================= */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center shadow-xs">
              <Award className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
                Certificate Management
              </h1>
              <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
                Upload a certificate template and position dynamic text fields.
              </p>
            </div>
          </div>

          {/* Hackathon Selector */}
          <div className="flex items-center gap-2 bg-white border border-stone-200 rounded-xl px-3.5 py-2 shadow-xs">
            <Trophy className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <select
              value={selectedHackathonId}
              onChange={(e) => setSelectedHackathonId(e.target.value)}
              className="bg-transparent border-none text-xs font-bold text-stone-900 focus:outline-none cursor-pointer pr-2"
            >
              {hackathons.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tab Pills (Matching Screenshot Style) */}
        <div className="flex items-center gap-3 border-b border-stone-200 pb-3">
          <button
            onClick={() => setActiveTab('overview')}
            className={`text-xs font-bold transition-all px-3.5 py-1.5 rounded ${
              activeTab === 'overview'
                ? 'border-2 border-red-800 text-stone-900 bg-red-50/20'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            Overview
          </button>

          <button
            onClick={() => setActiveTab('templates')}
            className={`text-xs font-bold transition-all px-3.5 py-1.5 rounded ${
              activeTab === 'templates'
                ? 'border-2 border-red-800 text-stone-900 bg-red-50/20'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            Templates
          </button>
        </div>
      </div>

      {/* ================= NOTIFICATION BANNER ================= */}
      {notification && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between shadow-xs transition-all ${
            notification.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-stone-400 hover:text-stone-600 ml-4">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: TEMPLATES (MATCHING THE SCREENSHOT EXACTLY)                         */}
      {/* ========================================================================= */}
      {activeTab === 'templates' && (
        <div className="space-y-6">
          {/* STEP 1: UPLOAD CUSTOM CERTIFICATE TEMPLATE */}
          <div className="bg-white border border-stone-200/90 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-stone-600 flex items-center gap-2 mb-1">
                  <Upload className="w-3.5 h-3.5 text-[#FA541C]" />
                  Step 1 - Upload Custom Certificate Template
                </span>
                <h3 className="text-sm sm:text-base font-extrabold text-stone-900">
                  Custom Template Image
                </h3>
              </div>

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 self-start sm:self-auto">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                {templateStatus}
              </span>
            </div>

            {/* Custom Upload Status Box if Active */}
            {templateImageUrl ? (
              <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-10 rounded-lg border border-amber-300 overflow-hidden bg-white flex-shrink-0 shadow-2xs">
                    <img src={templateImageUrl} alt="Custom Template" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <span className="font-bold text-amber-950 block text-xs">Custom Template Active</span>
                    <span className="text-[11px] text-amber-700 font-medium">{templateName}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <label className="px-3 py-1.5 rounded-lg bg-white border border-amber-300 text-stone-700 text-[11px] font-semibold hover:bg-amber-100 transition-colors shadow-2xs cursor-pointer flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5 text-amber-600" />
                    <span>Replace Image</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,application/pdf"
                      onChange={handleTemplateFileUpload}
                      className="hidden"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={handleRemoveCustomTemplate}
                    className="px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-semibold hover:bg-rose-100 transition-colors flex items-center gap-1.5 shadow-2xs"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remove Template
                  </button>
                </div>
              </div>
            ) : (
              /* Drag & Drop Upload Container */
              <label className="border-2 border-dashed border-stone-200 hover:border-[#FA541C]/60 rounded-2xl p-7 flex flex-col items-center justify-center text-center cursor-pointer transition-all bg-stone-50/50 hover:bg-stone-50 group">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,application/pdf"
                  onChange={handleTemplateFileUpload}
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#FA541C] flex items-center justify-center mb-2.5 shadow-xs group-hover:scale-105 transition-transform">
                  <Upload className="w-6 h-6 stroke-[2.2]" />
                </div>
                <h3 className="text-sm font-bold text-stone-900">
                  Drag &amp; drop or click to upload your custom certificate template
                </h3>
                <p className="text-xs text-stone-500 mt-1">Supports PNG, JPEG, WebP, SVG · Max 15 MB</p>
                <p className="text-[11px] text-[#FA541C] mt-1 font-semibold">
                  Instantly renders your certificate design as the canvas background
                </p>
              </label>
            )}
          </div>

          {/* STEP 2: POSITION FIELDS (DRAG TO MOVE) */}
          <div className="bg-white border border-stone-200/90 rounded-2xl shadow-xs overflow-hidden">
            {/* Top Toolbar */}
            <div className="p-4 border-b border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-50/50">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-2">
                <Move className="w-3.5 h-3.5 text-stone-500" />
                Step 2 - Position Fields (Drag to Move) &bull;{' '}
                <span className="text-amber-700 font-semibold">{templateName}</span>
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleResetConfig}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 text-xs font-bold shadow-2xs transition-all cursor-pointer"
                  title="Auto-align all certificate fields to optimal, non-overlapping positions"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  Auto-Align Layout
                </button>

                <button
                  onClick={() => setShowFullPreview(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 bg-white text-xs font-semibold text-stone-700 hover:bg-stone-50 shadow-2xs transition-colors cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-stone-500" />
                  Preview
                </button>

                <button
                  onClick={handleSaveConfig}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-red-700 hover:bg-red-800 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save Config
                </button>

                <button
                  onClick={handleResetConfig}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Reset
                </button>
              </div>
            </div>

            {/* Split Screen: Canvas (Left) + Field Properties (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-stone-200">
              {/* Certificate Canvas Area */}
              <div className="lg:col-span-8 p-6 flex flex-col items-center justify-center bg-stone-100/70 overflow-hidden">
                <div
                  ref={canvasRef}
                  className="relative w-full aspect-[16/11] max-w-2xl rounded-xl shadow-xl p-6 overflow-hidden select-none transition-colors duration-200"
                  style={{
                    backgroundColor: activePreset.bgColor,
                    borderColor: activePreset.borderColor,
                    borderWidth: '10px',
                    borderStyle: 'solid',
                  }}
                >
                  {/* If custom image uploaded, render it as background */}
                  {templateImageUrl && (
                    <img
                      src={templateImageUrl}
                      alt="Custom Certificate Template"
                      className="absolute inset-0 w-full h-full object-contain pointer-events-none z-0"
                    />
                  )}

                  {/* If not custom image OR guidelines requested, render template frame elements */}
                  {(!templateImageUrl || showGuidelinesOverCustom) && (
                    <>
                      {/* Inner Thin Border */}
                      <div
                        className="absolute inset-2 border-2 rounded-lg pointer-events-none z-1"
                        style={{ borderColor: activePreset.innerBorderColor }}
                      />

                      {/* Watermark Logo in center */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center opacity-10 pointer-events-none z-1">
                        <div
                          className="w-36 h-36 rounded-full border-4 flex items-center justify-center font-serif text-3xl font-extrabold"
                          style={{ borderColor: activePreset.textColor, color: activePreset.textColor }}
                        >
                          {activePreset.watermark}
                        </div>
                        <span
                          className="font-serif text-xl tracking-widest uppercase mt-2 text-center"
                          style={{ color: activePreset.textColor }}
                        >
                          {activePreset.institutionTitle}
                        </span>
                      </div>

                      {/* Top Institution Banner */}
                      <div className="text-center relative z-10 space-y-0.5 pt-1">
                        <div className="inline-flex items-center justify-center gap-2">
                          <div
                            className="w-6 h-6 rounded-full text-[10px] font-black flex items-center justify-center shadow-xs"
                            style={{
                              backgroundColor: activePreset.emblemBg,
                              color: activePreset.emblemTextColor,
                            }}
                          >
                            {activePreset.emblemText}
                          </div>
                          <span
                            className="text-base sm:text-lg font-black tracking-tight font-serif"
                            style={{ color: activePreset.textColor }}
                          >
                            {activePreset.institutionTitle}
                          </span>
                        </div>
                        <p className="text-[9.5px] text-stone-500 font-medium">
                          {activePreset.institutionSub}
                        </p>
                      </div>

                      {/* Heading */}
                      <div className="text-center mt-3 relative z-10 pointer-events-none">
                        <h2
                          className="text-sm sm:text-base font-black uppercase tracking-widest font-serif"
                          style={{ color: activePreset.textColor }}
                        >
                          {activePreset.titleText}
                        </h2>
                        <p className="text-[9px] uppercase tracking-wider text-stone-400 font-semibold mt-0.5">
                          Proudly Presented To
                        </p>
                      </div>

                    </>
                  )}

                  {/* Dynamic Draggable WYSIWYG Fields with Live Text, Font, Size, Color & Align */}
                  {Object.values(fields).map((f) => {
                    if (!f.visible) return null;
                    const isSelected = selectedFieldId === f.id;

                    return (
                      <div
                        key={f.id}
                        onMouseDown={(e) => handleMouseDown(f.id, e)}
                        style={{
                          left: `${f.x}%`,
                          top: `${f.y}%`,
                          transform: 'translate(-50%, -50%)',
                        }}
                        className={`absolute z-30 cursor-move select-none transition-all flex flex-col items-center group ${
                          isSelected
                            ? 'ring-2 ring-[#FA541C] ring-offset-2 ring-offset-white bg-white/95 shadow-xl rounded-xl p-1.5 z-40 scale-102'
                            : 'hover:ring-1 hover:ring-[#FA541C]/60 hover:bg-white/80 rounded-lg p-1'
                        }`}
                      >
                        {/* Top Handle Badge with Field Label */}
                        <div
                          className="px-2 py-0.5 rounded-full text-white text-[9px] font-bold shadow-2xs flex items-center gap-1 mb-0.5 pointer-events-none"
                          style={{ backgroundColor: f.badgeBg }}
                        >
                          <Move className="w-2.5 h-2.5 opacity-90" />
                          <span>{f.label}</span>
                        </div>

                        {/* LIVE STYLED TEXT (Changes instantly when edited!) */}
                        <div
                          style={{
                            fontFamily: getFontFamilyCss(f.fontFamily),
                            fontSize: `${f.fontSize}px`,
                            fontWeight: f.fontWeight,
                            color: f.color,
                            textAlign: f.align,
                            lineHeight: 1.2,
                          }}
                          className="whitespace-nowrap px-1.5 transition-all text-center"
                        >
                          {f.sampleValue || f.label}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Bottom Pill Palette */}
                <div className="w-full max-w-2xl mt-4 pt-3 border-t border-stone-200">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block mb-2">
                    Available Template Fields (Click to Select / Toggle):
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {Object.values(fields).map((f) => (
                      <button
                        key={f.id}
                        onClick={() => setSelectedFieldId(f.id)}
                        className={`px-2.5 py-1 rounded text-[11px] font-bold text-white transition-all ${
                          selectedFieldId === f.id
                            ? 'ring-2 ring-stone-900 ring-offset-1 scale-105'
                            : 'opacity-90 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: f.badgeBg }}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* FIELD PROPERTIES (Right Sidebar Panel) */}
              <div className="lg:col-span-4 p-6 bg-white space-y-6">
                <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700">
                    Field Properties
                  </h3>
                  {activeField && (
                    <span
                      className="px-2 py-0.5 rounded text-[10px] font-bold text-white"
                      style={{ backgroundColor: activeField.badgeBg }}
                    >
                      {activeField.label}
                    </span>
                  )}
                </div>

                {!activeField ? (
                  <div className="py-16 text-center space-y-3">
                    <Move className="w-10 h-10 text-stone-300 mx-auto" />
                    <p className="text-xs text-stone-500 max-w-xs mx-auto leading-relaxed">
                      Click a field handle on the canvas to select and style it.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 text-xs">
                    {/* Sample / Preview Text */}
                    <div className="space-y-1">
                      <label className="font-semibold text-stone-700 block">Sample / Preview Text</label>
                      <input
                        type="text"
                        value={activeField.sampleValue}
                        onChange={(e) =>
                          setFields((prev) => ({
                            ...prev,
                            [activeField.id]: { ...prev[activeField.id], sampleValue: e.target.value },
                          }))
                        }
                        className="w-full px-3 py-2 rounded-lg border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/40 font-medium"
                      />
                    </div>

                    {/* Font Family */}
                    <div className="space-y-1">
                      <label className="font-semibold text-stone-700 block">Font Family</label>
                      <select
                        value={activeField.fontFamily}
                        onChange={(e) =>
                          setFields((prev) => ({
                            ...prev,
                            [activeField.id]: {
                              ...prev[activeField.id],
                              fontFamily: e.target.value as any,
                            },
                          }))
                        }
                        className="w-full px-3 py-2 rounded-lg border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none cursor-pointer"
                      >
                        <option value="serif">Academic Serif (Playfair / Times)</option>
                        <option value="sans">Modern Sans-Serif (Inter / Roboto)</option>
                        <option value="mono">Technical Monospace (JetBrains)</option>
                        <option value="cursive">Calligraphic Cursive (Script)</option>
                      </select>
                    </div>

                    {/* Font Size & Weight */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="font-semibold text-stone-700 block">
                          Size ({activeField.fontSize}px)
                        </label>
                        <input
                          type="range"
                          min="10"
                          max="44"
                          value={activeField.fontSize}
                          onChange={(e) =>
                            setFields((prev) => ({
                              ...prev,
                              [activeField.id]: {
                                ...prev[activeField.id],
                                fontSize: Number(e.target.value),
                              },
                            }))
                          }
                          className="w-full accent-amber-600"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-semibold text-stone-700 block">Font Weight</label>
                        <select
                          value={activeField.fontWeight}
                          onChange={(e) =>
                            setFields((prev) => ({
                              ...prev,
                              [activeField.id]: {
                                ...prev[activeField.id],
                                fontWeight: e.target.value as any,
                              },
                            }))
                          }
                          className="w-full px-2.5 py-1.5 rounded-lg border border-stone-200 bg-stone-50 focus:bg-white"
                        >
                          <option value="normal">Normal (400)</option>
                          <option value="500">Medium (500)</option>
                          <option value="bold">Bold (700)</option>
                          <option value="900">Black (900)</option>
                        </select>
                      </div>
                    </div>

                    {/* Color */}
                    <div className="space-y-1">
                      <label className="font-semibold text-stone-700 block">Text Color</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={activeField.color}
                          onChange={(e) =>
                            setFields((prev) => ({
                              ...prev,
                              [activeField.id]: { ...prev[activeField.id], color: e.target.value },
                            }))
                          }
                          className="w-8 h-8 rounded border border-stone-200 cursor-pointer"
                        />
                        <span className="font-mono text-stone-600 font-semibold">{activeField.color}</span>
                        <div className="flex items-center gap-1 ml-auto">
                          {['#0F172A', '#7F1D1D', '#D97706', '#1E3A8A', '#475569'].map((c) => (
                            <button
                              key={c}
                              onClick={() =>
                                setFields((prev) => ({
                                  ...prev,
                                  [activeField.id]: { ...prev[activeField.id], color: c },
                                }))
                              }
                              className="w-5 h-5 rounded-full border border-stone-300"
                              style={{ backgroundColor: c }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Text Alignment */}
                    <div className="space-y-1">
                      <label className="font-semibold text-stone-700 block">Alignment</label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['left', 'center', 'right'] as const).map((a) => (
                          <button
                            key={a}
                            onClick={() =>
                              setFields((prev) => ({
                                ...prev,
                                [activeField.id]: { ...prev[activeField.id], align: a },
                              }))
                            }
                            className={`py-1.5 rounded-lg border font-semibold flex items-center justify-center capitalize ${
                              activeField.align === a
                                ? 'bg-stone-900 text-white border-stone-900'
                                : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                            }`}
                          >
                            {a}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Coordinates */}
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="space-y-1">
                        <label className="font-semibold text-stone-600 block">X Coordinate (%)</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={activeField.x}
                          onChange={(e) =>
                            setFields((prev) => ({
                              ...prev,
                              [activeField.id]: { ...prev[activeField.id], x: Number(e.target.value) },
                            }))
                          }
                          className="w-full px-2.5 py-1.5 rounded-lg border border-stone-200 bg-stone-50"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-semibold text-stone-600 block">Y Coordinate (%)</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={activeField.y}
                          onChange={(e) =>
                            setFields((prev) => ({
                              ...prev,
                              [activeField.id]: { ...prev[activeField.id], y: Number(e.target.value) },
                            }))
                          }
                          className="w-full px-2.5 py-1.5 rounded-lg border border-stone-200 bg-stone-50"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* STEP 3: DATA SHEET BULK ISSUANCE (UPLOAD ANY FORMAT -> ONE CLICK ISSUE)     */}
          {/* ========================================================================= */}
          {/* Upload & Actions Banner */}
          <div className="bg-white border border-stone-200/90 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-stone-600 flex items-center gap-2 mb-1">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-stone-500" />
                  Step 3 - Upload Data Sheet &amp; Issue Certificates to Teams
                </span>
                <h2 className="text-base sm:text-lg font-extrabold text-stone-900 flex items-center gap-2">
                  Upload Data Sheet (Any Format)
                </h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  Upload XLSX, XLS, CSV, TSV, or JSON containing Team Names and Team Members. Auto-mapped and issued with 1 click.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleLoadSampleDataSheet}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold border border-stone-300 text-stone-700 bg-stone-50 hover:bg-stone-100 transition-colors shadow-2xs flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Load Sample Data Sheet
                </button>
              </div>
            </div>

            {/* Dropzone */}
            <label className="border-2 border-dashed border-stone-200 hover:border-amber-500/70 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all bg-stone-50/50 hover:bg-stone-50">
              <input
                type="file"
                accept=".xlsx,.xls,.csv,.tsv,.json,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
                onChange={handleDataSheetUpload}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mb-3">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-stone-900">
                {uploadFileName ? uploadFileName : 'Drag & drop or click to upload data sheet'}
              </h3>
              <p className="text-xs text-stone-500 mt-1">
                Supports Excel (.xlsx, .xls), CSV, TSV, and JSON formats
              </p>
            </label>
          </div>

          {/* Parsed Participants Data Table */}
          {dataSheetParticipants.length > 0 && (
            <div className="bg-white border border-stone-200/90 rounded-2xl shadow-xs overflow-hidden space-y-4 p-6">
              {/* Table Toolbar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    {dataSheetParticipants.length} Participants Ready
                  </div>

                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-800 text-xs font-bold border border-blue-200">
                    <Users className="w-3.5 h-3.5 text-blue-600" />
                    {new Set(dataSheetParticipants.map((p) => p.teamName)).size} Teams Detected
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search member or team..."
                      value={searchFilter}
                      onChange={(e) => setSearchFilter(e.target.value)}
                      className="pl-8 pr-3 py-1.5 rounded-lg border border-stone-200 text-xs bg-stone-50 focus:bg-white focus:outline-none"
                    />
                  </div>

                  {/* High-Impact Issue Button */}
                  <button
                    onClick={handleIssueToAll}
                    disabled={issuing}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs shadow-md transition-all active:scale-[0.98] disabled:opacity-50"
                  >
                    <Award className={`w-4 h-4 ${issuing ? 'animate-spin' : ''}`} />
                    <span>
                      {issuing
                        ? 'Issuing Digital Certificates...'
                        : `Issue Certificates to All Participants (${dataSheetParticipants.length})`}
                    </span>
                  </button>
                </div>
              </div>

              {/* Data Table */}
              <div className="border border-stone-200 rounded-xl overflow-hidden overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-stone-100 text-stone-600 font-mono text-[11px]">
                    <tr>
                      <th className="p-3">#</th>
                      <th className="p-3">Team Name</th>
                      <th className="p-3">Participant Name</th>
                      <th className="p-3">Email</th>
                      <th className="p-3">Department</th>
                      <th className="p-3">College</th>
                      <th className="p-3">Date</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200 bg-white">
                    {filteredParticipants.map((p, idx) => (
                      <tr key={idx} className="hover:bg-stone-50 transition-colors">
                        <td className="p-3 text-stone-400 font-mono">{idx + 1}</td>
                        <td className="p-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            {p.teamName}
                          </span>
                        </td>
                        <td className="p-3 font-bold text-stone-900">{p.participantName}</td>
                        <td className="p-3 text-stone-500 font-mono text-[11px]">{p.email}</td>
                        <td className="p-3 text-stone-700">{p.department}</td>
                        <td className="p-3 text-stone-700">{p.college}</td>
                        <td className="p-3 text-stone-500 font-mono">{p.date}</td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => setPreviewParticipant(p)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-stone-200 text-stone-700 hover:bg-stone-100 text-[11px] font-semibold transition-colors"
                          >
                            <Eye className="w-3 h-3 text-stone-500" />
                            Preview Certificate
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Issued Results Summary Table */}
          {issuedResults.length > 0 && (
            <div className="bg-emerald-50/50 border border-emerald-200 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold">
                    ✓
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-emerald-950">
                      Successfully Issued {issuedResults.length} Verifiable Certificates
                    </h3>
                    <p className="text-xs text-emerald-800">
                      All participants have received cryptographically tamper-evident credentials.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {issuedResults.slice(0, 6).map((cert) => (
                  <div
                    key={cert.id}
                    className="p-3 rounded-xl bg-white border border-emerald-200 space-y-1 shadow-2xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-stone-900">{cert.recipientName}</span>
                      <span className="font-mono text-[10px] font-bold text-blue-600">
                        {cert.verificationCode}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-stone-500 pt-1">
                      <span>Status: {cert.status}</span>
                      <Link
                        href={`/verify/${cert.verificationCode}`}
                        target="_blank"
                        className="inline-flex items-center gap-0.5 text-blue-600 hover:underline font-semibold"
                      >
                        Verify <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: OVERVIEW & ISSUED CERTIFICATE AUDIT LEDGER                          */}
      {/* ========================================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="bg-white border border-stone-200/90 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-stone-900">
                  Issued Certificate Registry
                </h2>
                <p className="text-xs text-stone-500">
                  All generated credentials for this hackathon with public cryptographic verification tokens.
                </p>
              </div>

              <button
                onClick={() => fetchCertificates(selectedHackathonId)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 text-xs font-semibold text-stone-700 hover:bg-stone-50"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Refresh
              </button>
            </div>

            {loadingCerts ? (
              <div className="py-16 text-center text-xs text-stone-500">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-amber-600 border-t-transparent mx-auto mb-2" />
                Loading certificates...
              </div>
            ) : certificates.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <Award className="w-12 h-12 text-stone-300 mx-auto" />
                <h3 className="text-sm font-bold text-stone-800">No certificates issued yet</h3>
                <p className="text-xs text-stone-500 max-w-sm mx-auto">
                  Switch to the "Data Sheet Bulk Issuance" or "Templates" tab to design and award certificates.
                </p>
              </div>
            ) : (
              <div className="border border-stone-200 rounded-xl overflow-hidden overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-stone-100 text-stone-600 font-mono text-[11px]">
                    <tr>
                      <th className="p-3">Recipient</th>
                      <th className="p-3">Title</th>
                      <th className="p-3">Verification Code</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Issued Date</th>
                      <th className="p-3 text-right">Verification</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200">
                    {certificates.map((cert) => (
                      <tr key={cert.id} className="hover:bg-stone-50">
                        <td className="p-3 font-bold text-stone-900">
                          {cert.recipientName || cert.user?.fullName}
                        </td>
                        <td className="p-3 text-stone-700">{cert.title}</td>
                        <td className="p-3 font-mono font-bold text-blue-600">
                          <button
                            onClick={() => handleCopyCode(cert.verificationCode)}
                            className="inline-flex items-center gap-1 hover:underline"
                          >
                            <span>{cert.verificationCode}</span>
                            {copiedCode === cert.verificationCode ? (
                              <Check className="w-3 h-3 text-emerald-500" />
                            ) : (
                              <Copy className="w-3 h-3 text-stone-400" />
                            )}
                          </button>
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {cert.status}
                          </span>
                        </td>
                        <td className="p-3 text-stone-500 font-mono">
                          {new Date(cert.issuedAt).toLocaleDateString()}
                        </td>
                        <td className="p-3 text-right">
                          <Link
                            href={`/verify/${cert.verificationCode}`}
                            target="_blank"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-stone-900 text-white font-semibold text-[11px] hover:bg-stone-800"
                          >
                            <span>Verify</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CERTIFICATE FULL PREVIEW MODAL                                            */}
      {/* ========================================================================= */}
      {(showFullPreview || previewParticipant) && (
        <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-600" />
                <h3 className="font-extrabold text-stone-900 text-sm">
                  {previewParticipant
                    ? `Certificate Preview: ${previewParticipant.participantName} (${previewParticipant.teamName})`
                    : 'Template Live Render Preview'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowFullPreview(false);
                  setPreviewParticipant(null);
                }}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Rendered Certificate Frame */}
            <div
              className="relative w-full aspect-[16/11] rounded-xl shadow-lg border-[12px] p-8 overflow-hidden transition-all duration-300"
              style={{
                backgroundColor: activePreset.bgColor,
                borderColor: activePreset.borderColor,
                color: activePreset.textColor,
              }}
            >
              {/* If custom image uploaded, render as background */}
              {templateImageUrl && (
                <img
                  src={templateImageUrl}
                  alt="Custom Certificate Template"
                  className="absolute inset-0 w-full h-full object-contain pointer-events-none z-0"
                />
              )}

              {/* Preset Decorative Borders & Watermarks */}
              {(!templateImageUrl || showGuidelinesOverCustom) && (
                <>
                  <div
                    className="absolute inset-2 border-2 rounded-lg pointer-events-none z-1"
                    style={{ borderColor: activePreset.innerBorderColor }}
                  />

                  {/* Watermark */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center opacity-10 pointer-events-none z-1">
                    <div
                      className="w-44 h-44 rounded-full border-4 flex items-center justify-center font-serif text-4xl font-extrabold"
                      style={{ borderColor: activePreset.textColor, color: activePreset.textColor }}
                    >
                      {activePreset.watermark}
                    </div>
                    <span
                      className="font-serif text-2xl tracking-widest uppercase mt-2"
                      style={{ color: activePreset.textColor }}
                    >
                      {activePreset.institutionTitle}
                    </span>
                  </div>

                  {/* Institution Header */}
                  <div className="text-center relative z-10 space-y-1">
                    <div className="inline-flex items-center justify-center gap-2">
                      <div
                        className="w-8 h-8 rounded-full text-xs font-black flex items-center justify-center shadow-xs"
                        style={{
                          backgroundColor: activePreset.emblemBg,
                          color: activePreset.emblemTextColor,
                        }}
                      >
                        {activePreset.emblemText}
                      </div>
                      <span
                        className="text-xl font-black tracking-tight font-serif"
                        style={{ color: activePreset.textColor }}
                      >
                        {activePreset.institutionTitle}
                      </span>
                    </div>
                    <p className="text-xs text-stone-500 font-medium">
                      {activePreset.institutionSub}
                    </p>
                  </div>

                  {/* Title */}
                  <div className="text-center mt-3 mb-2 relative z-10">
                    <h2
                      className="text-lg sm:text-xl font-black uppercase tracking-widest font-serif"
                      style={{ color: activePreset.textColor }}
                    >
                      {activePreset.titleText}
                    </h2>
                    <p className="text-[10px] uppercase tracking-wider text-stone-400 font-semibold mt-0.5">
                      Proudly Presented To
                    </p>
                  </div>
                </>
              )}

              {/* Dynamic Positioned Live Fields in Preview */}
              {Object.values(fields).map((f) => {
                if (!f.visible) return null;
                let displayVal = f.sampleValue;
                if (previewParticipant) {
                  if (f.id === 'participantName') displayVal = previewParticipant.participantName;
                  else if (f.id === 'teamName') displayVal = previewParticipant.teamName;
                  else if (f.id === 'department') displayVal = previewParticipant.department;
                  else if (f.id === 'collaborationDept') displayVal = previewParticipant.collaborationDept;
                  else if (f.id === 'college') displayVal = previewParticipant.college;
                  else if (f.id === 'date') displayVal = previewParticipant.date;
                }

                return (
                  <div
                    key={f.id}
                    style={{
                      position: 'absolute',
                      left: `${f.x}%`,
                      top: `${f.y}%`,
                      transform: 'translate(-50%, -50%)',
                      fontFamily: getFontFamilyCss(f.fontFamily),
                      fontSize: `${f.fontSize}px`,
                      fontWeight: f.fontWeight,
                      color: f.color,
                      textAlign: f.align,
                      lineHeight: 1.2,
                      zIndex: 20,
                    }}
                    className="whitespace-nowrap px-1 text-center"
                  >
                    {displayVal}
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => {
                  setShowFullPreview(false);
                  setPreviewParticipant(null);
                }}
                className="px-4 py-2 rounded-xl bg-stone-900 text-white font-bold text-xs"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
