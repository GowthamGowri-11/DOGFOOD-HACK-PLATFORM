'use client';

import React, { useState } from 'react';
import {
  Layers,
  Plus,
  Trash2,
  Sparkles,
  FileText,
  ChevronDown,
  ChevronUp,
  Globe,
  Lock,
  Tag,
  HelpCircle,
  ExternalLink,
  RotateCw,
  Copy,
} from 'lucide-react';

export interface ProblemStatementItem {
  id?: string;
  code: string;
  title: string;
  description: string;
  challengeDocUrl?: string;
  isPublic: boolean;
  displayOrder?: number;
  roundIndex?: number; // Which evaluation round this question belongs to (-1 or undefined = all rounds)
}

export interface TrackItem {
  id?: string;
  title: string;
  slug?: string;
  description?: string;
  colorHex: string;
  displayOrder?: number;
  problemStatements: ProblemStatementItem[];
}

export interface EvaluationRoundInfo {
  name: string;
  isFinal: boolean;
  roundType: string;
}

export interface TracksAndProblemsEditorProps {
  tracks: TrackItem[];
  onChange: (tracks: TrackItem[]) => void;
  rounds?: EvaluationRoundInfo[];
  embeddedInRound?: boolean;
  roundIndex?: number;
  roundName?: string;
  onCopyFromPrevious?: () => void;
  previousRoundName?: string;
}

const PRESET_COLORS = [
  { name: 'Royal Blue', hex: '#2563EB' },
  { name: 'Indigo', hex: '#6366F1' },
  { name: 'Emerald', hex: '#059669' },
  { name: 'Purple', hex: '#8B5CF6' },
  { name: 'Rose', hex: '#E11D48' },
  { name: 'Amber', hex: '#D97706' },
  { name: 'Cyan', hex: '#0284C7' },
  { name: 'Slate', hex: '#475569' },
];

export const TracksAndProblemsEditor: React.FC<TracksAndProblemsEditorProps> = ({
  tracks = [],
  onChange,
  rounds = [],
  embeddedInRound = false,
  roundIndex,
  roundName,
  onCopyFromPrevious,
  previousRoundName,
}) => {
  const [collapsedTracks, setCollapsedTracks] = useState<Record<number, boolean>>({});

  const toggleCollapse = (idx: number) => {
    setCollapsedTracks((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const addTrack = () => {
    const nextIdx = tracks.length + 1;
    const color = PRESET_COLORS[(nextIdx - 1) % PRESET_COLORS.length].hex;
    const newTrack: TrackItem = {
      title: `Track ${nextIdx}: New Domain`,
      slug: `track-${nextIdx}`,
      description: '',
      colorHex: color,
      displayOrder: tracks.length,
      problemStatements: [
        {
          code: `PS-${nextIdx}01`,
          title: '',
          description: '',
          challengeDocUrl: '',
          isPublic: true,
          displayOrder: 0,
        },
      ],
    };
    onChange([...tracks, newTrack]);
  };

  const removeTrack = (trackIdx: number) => {
    onChange(tracks.filter((_, i) => i !== trackIdx));
  };

  const updateTrack = (trackIdx: number, field: keyof TrackItem, value: any) => {
    const updated = [...tracks];
    updated[trackIdx] = {
      ...updated[trackIdx],
      [field]: value,
      ...(field === 'title' && !updated[trackIdx].id
        ? {
            slug: (value as string)
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/^-+|-+$/g, ''),
          }
        : {}),
    };
    onChange(updated);
  };

  const addProblemStatement = (trackIdx: number) => {
    const updated = [...tracks];
    const track = updated[trackIdx];
    const prefix = track.title ? track.title.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'TR') : 'PS';
    const num = (track.problemStatements.length + 1).toString().padStart(2, '0');
    track.problemStatements.push({
      code: `${prefix}-${num}`,
      title: '',
      description: '',
      challengeDocUrl: '',
      isPublic: true,
      displayOrder: track.problemStatements.length,
    });
    onChange(updated);
  };

  const removeProblemStatement = (trackIdx: number, probIdx: number) => {
    const updated = [...tracks];
    updated[trackIdx].problemStatements = updated[trackIdx].problemStatements.filter(
      (_, i) => i !== probIdx
    );
    onChange(updated);
  };

  const updateProblemStatement = (
    trackIdx: number,
    probIdx: number,
    field: keyof ProblemStatementItem,
    value: any
  ) => {
    const updated = [...tracks];
    updated[trackIdx].problemStatements[probIdx] = {
      ...updated[trackIdx].problemStatements[probIdx],
      [field]: value,
    };
    onChange(updated);
  };

  const loadEnterprisePreset = () => {
    const preset: TrackItem[] = [
      {
        title: 'Enterprise AI & Autonomous Systems',
        slug: 'enterprise-ai-autonomous-systems',
        description:
          'Agentic LLM workflows, retrieval-augmented intelligence, multimodal copilots, and enterprise governance.',
        colorHex: '#2563EB',
        displayOrder: 0,
        problemStatements: [
          {
            code: 'AI-01',
            title: 'Autonomous Clinical Diagnostic and Treatment Verification Agent',
            description:
              'Design an autonomous agent that ingests raw EHR data, verifies multimodal diagnostic evidence against WHO protocols, and outputs structured physician action briefs.',
            challengeDocUrl: 'https://github.com/enterprise/ai-agent-challenge',
            isPublic: true,
            displayOrder: 0,
          },
          {
            code: 'AI-02',
            title: 'Multimodal Legal Discovery and Contract Discrepancy Engine',
            description:
              'Build a semantic discrepancy pipeline cross-referencing NDA and MSA obligations with zero-hallucination citation verification.',
            challengeDocUrl: '',
            isPublic: true,
            displayOrder: 1,
          },
        ],
      },
      {
        title: 'Cloud Infrastructure & Zero-Trust Security',
        slug: 'cloud-infrastructure-zero-trust-security',
        description:
          'Distributed resilience, eBPF telemetry, edge computing, container runtime isolation, and microsegmentation.',
        colorHex: '#6366F1',
        displayOrder: 1,
        problemStatements: [
          {
            code: 'SEC-01',
            title: 'eBPF-Powered Kubernetes Sidecar Runtime Sentinel',
            description:
              'Develop a low-latency kernel telemetry monitor identifying rogue syscalls, memory poisoning, and lateral movement in ephemeral pods.',
            challengeDocUrl: '',
            isPublic: true,
            displayOrder: 0,
          },
        ],
      },
      {
        title: 'FinTech Intelligence & Cryptographic Audit',
        slug: 'fintech-intelligence-cryptographic-audit',
        description:
          'Zero-knowledge proof verification, high-frequency settlement validation, AML graph pattern recognition.',
        colorHex: '#059669',
        displayOrder: 2,
        problemStatements: [
          {
            code: 'FIN-01',
            title: 'Real-Time Graph Anomaly Detection for Cross-Border AML',
            description:
              'Analyze continuous transaction streams across heterogeneous ledgers with sub-50ms heuristic subgraph anomaly scoring.',
            challengeDocUrl: '',
            isPublic: true,
            displayOrder: 0,
          },
        ],
      },
      {
        title: 'HealthTech & Multimodal Diagnostics',
        slug: 'healthtech-multimodal-diagnostics',
        description:
          'Genomic indexing, wearable telemetry streams, clinical decision support, and privacy-preserving federated health models.',
        colorHex: '#8B5CF6',
        displayOrder: 3,
        problemStatements: [
          {
            code: 'MED-01',
            title: 'Federated Privacy-Preserving Rare Disease Biomarker Indexer',
            description:
              'Train collaborative diagnostic models without centralizing patient biological specimen metadata.',
            challengeDocUrl: '',
            isPublic: true,
            displayOrder: 0,
          },
        ],
      },
    ];
    onChange(preset);
  };

  const totalProblemStatements = tracks.reduce(
    (acc, t) => acc + (t.problemStatements?.length || 0),
    0
  );

  return (
    <div
      className={
        embeddedInRound
          ? 'bg-white border border-[#e2e8f0] rounded-2xl p-4 sm:p-5 shadow-2xs space-y-5'
          : 'bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs space-y-6'
      }
    >
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#F1F5F9] gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] flex items-center justify-center shadow-xs shrink-0">
            <Layers className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm sm:text-base font-extrabold text-[#0F172A]">
                {embeddedInRound
                  ? `Tracks & Questions — ${roundName || (roundIndex !== undefined ? `Round ${roundIndex + 1}` : 'Round')}`
                  : 'Tracks & Problem Statements'}
              </h3>
              <span className="px-2 py-0.5 text-[10px] sm:text-[11px] font-bold bg-[#EFF6FF] text-[#2563EB] rounded-full border border-[#BFDBFE]">
                {tracks.length} {tracks.length === 1 ? 'Track' : 'Tracks'}
              </span>
              <span className="px-2 py-0.5 text-[10px] sm:text-[11px] font-bold bg-[#F1F5F9] text-[#475569] rounded-full border border-[#E2E8F0]">
                {totalProblemStatements} {totalProblemStatements === 1 ? 'Question' : 'Questions'}
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-[#64748B]">
              {embeddedInRound
                ? `Domain tracks and challenge questions specifically designated for this round.`
                : 'Define the competition focus areas and assign specific real-world challenge statements for teams to build.'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {tracks.length === 0 && onCopyFromPrevious && previousRoundName && (
            <button
              type="button"
              onClick={onCopyFromPrevious}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#4338ca] bg-[#eef2ff] border border-[#c7d2fe] hover:bg-[#e0e7ff] rounded-xl transition-colors shadow-xs"
              title={`Copy tracks from ${previousRoundName}`}
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy from {previousRoundName}</span>
            </button>
          )}

          {tracks.length === 0 && (
            <button
              type="button"
              onClick={loadEnterprisePreset}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#059669] bg-[#ECFDF5] border border-[#A7F3D0] hover:bg-[#D1FAE5] rounded-xl transition-colors shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Template Tracks</span>
            </button>
          )}

          <button
            type="button"
            onClick={addTrack}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Add Track</span>
          </button>
        </div>
      </div>

      {/* Tracks Empty State */}
      {tracks.length === 0 && (
        <div className="py-8 sm:py-10 border-2 border-dashed border-[#CBD5E1] rounded-2xl text-center flex flex-col items-center justify-center space-y-3 bg-[#F8FAFC]">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center">
            <Layers className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs sm:text-sm font-bold text-[#0F172A]">
              No Tracks for {roundName || (roundIndex !== undefined ? `Round ${roundIndex + 1}` : 'this round')}
            </h4>
            <p className="text-[11px] sm:text-xs text-[#64748B] max-w-sm px-4">
              Add domain tracks and questions for participants to tackle during this evaluation round.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            {onCopyFromPrevious && previousRoundName && (
              <button
                type="button"
                onClick={onCopyFromPrevious}
                className="px-3.5 py-1.5 text-xs font-bold text-[#4338ca] bg-[#eef2ff] border border-[#c7d2fe] hover:bg-[#e0e7ff] rounded-xl transition-colors shadow-xs flex items-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy All Tracks from {previousRoundName}</span>
              </button>
            )}
            <button
              type="button"
              onClick={loadEnterprisePreset}
              className="px-3.5 py-1.5 text-xs font-bold text-[#2563EB] bg-white border border-[#BFDBFE] hover:bg-[#EFF6FF] rounded-xl transition-colors shadow-xs flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Use Enterprise Templates</span>
            </button>
            <button
              type="button"
              onClick={addTrack}
              className="px-3.5 py-1.5 text-xs font-bold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-xl transition-colors shadow-xs flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Empty Track</span>
            </button>
          </div>
        </div>
      )}

      {/* Tracks List */}
      <div className="space-y-5">
        {tracks.map((track, trackIdx) => {
          const isCollapsed = collapsedTracks[trackIdx];
          const trackColor = track.colorHex || '#2563EB';

          return (
            <div
              key={trackIdx}
              className="border border-[#E2E8F0] rounded-2xl overflow-hidden bg-white shadow-xs transition-shadow hover:shadow-sm"
            >
              {/* Track Header Bar */}
              <div
                className="p-4 sm:p-4.5 border-b border-[#E2E8F0] flex flex-wrap items-center justify-between gap-3"
                style={{
                  borderLeftWidth: '6px',
                  borderLeftColor: trackColor,
                  background: 'linear-gradient(to right, #F8FAFC, #FFFFFF)',
                }}
              >
                <div className="flex items-center space-x-3 flex-1 min-w-[240px]">
                  <button
                    type="button"
                    onClick={() => toggleCollapse(trackIdx)}
                    className="p-1 hover:bg-[#E2E8F0] rounded-lg text-[#64748B] transition-colors"
                  >
                    {isCollapsed ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronUp className="w-4 h-4" />
                    )}
                  </button>

                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-[#64748B]">
                        Track {trackIdx + 1}
                      </span>
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: trackColor }}
                      />
                    </div>
                    <input
                      type="text"
                      required
                      value={track.title}
                      onChange={(e) => updateTrack(trackIdx, 'title', e.target.value)}
                      placeholder="e.g. Enterprise AI & Autonomous Systems"
                      className="text-sm sm:text-base font-extrabold text-[#0F172A] bg-transparent border-b border-transparent hover:border-[#CBD5E1] focus:border-[#2563EB] focus:outline-none w-full transition-all"
                    />
                  </div>
                </div>

                {/* Track Right Controls */}
                <div className="flex items-center space-x-2.5">
                  {/* Color Selector */}
                  <div className="flex items-center space-x-1 bg-white border border-[#E2E8F0] rounded-xl p-1 shadow-2xs">
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => updateTrack(trackIdx, 'colorHex', c.hex)}
                        title={c.name}
                        className={`w-4.5 h-4.5 rounded-full transition-transform ${
                          trackColor.toLowerCase() === c.hex.toLowerCase()
                            ? 'scale-125 ring-2 ring-offset-1 ring-[#0F172A]'
                            : 'hover:scale-110 opacity-80 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: c.hex }}
                      />
                    ))}
                    <input
                      type="color"
                      value={trackColor}
                      onChange={(e) => updateTrack(trackIdx, 'colorHex', e.target.value)}
                      title="Custom Color"
                      className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent p-0 ml-1"
                    />
                  </div>

                  {/* Problem count pill */}
                  <span className="text-xs font-bold text-[#475569] bg-[#F1F5F9] px-2.5 py-1 rounded-lg border border-[#E2E8F0]">
                    {track.problemStatements.length} Problems
                  </span>

                  {/* Delete track */}
                  <button
                    type="button"
                    onClick={() => removeTrack(trackIdx)}
                    className="p-1.5 text-[#DC2626] hover:bg-[#FEF2F2] rounded-lg transition-colors"
                    title="Remove Track"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Track Content (Collapsible) */}
              {!isCollapsed && (
                <div className="p-4 sm:p-5 space-y-4">
                  {/* Track Description */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">
                      Track Scope & Objectives (Optional)
                    </label>
                    <input
                      type="text"
                      value={track.description || ''}
                      onChange={(e) => updateTrack(trackIdx, 'description', e.target.value)}
                      placeholder="Brief guidance on what technologies, algorithms, and architectures fit into this track..."
                      className="w-full px-3 py-1.5 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl focus:bg-white focus:outline-none focus:border-[#2563EB] text-[#0F172A]"
                    />
                  </div>

                  {/* Problem Statements Section */}
                  <div className="pt-2 border-t border-[#F1F5F9] space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5">
                        <FileText className="w-3.5 h-3.5 text-[#2563EB]" />
                        <span className="text-xs font-bold text-[#0F172A]">
                          Problem Statements in {track.title || `Track ${trackIdx + 1}`}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => addProblemStatement(trackIdx)}
                        className="inline-flex items-center gap-1 text-xs font-bold text-[#2563EB] hover:text-[#1D4ED8] bg-[#EFF6FF] px-2.5 py-1 rounded-lg border border-[#BFDBFE] transition-colors"
                      >
                        <Plus className="w-3 h-3 stroke-[2.5]" />
                        <span>Add Problem Statement</span>
                      </button>
                    </div>

                    {/* Problem Statements Cards */}
                    {track.problemStatements.length === 0 ? (
                      <div className="p-4 bg-[#F8FAFC] border border-dashed border-[#CBD5E1] rounded-xl text-center space-y-1">
                        <p className="text-xs text-[#64748B] font-medium">
                          No problem statements defined for this track yet.
                        </p>
                        <button
                          type="button"
                          onClick={() => addProblemStatement(trackIdx)}
                          className="text-xs font-bold text-[#2563EB] hover:underline"
                        >
                          + Add the first problem statement
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {track.problemStatements.map((prob, probIdx) => (
                          <div
                            key={probIdx}
                            className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3.5 space-y-3 relative group"
                          >
                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start">
                              {/* Code */}
                              <div className="sm:col-span-2 space-y-1">
                                <span className="text-[9px] font-bold text-[#64748B] uppercase">
                                  CODE*
                                </span>
                                <input
                                  type="text"
                                  required
                                  value={prob.code}
                                  onChange={(e) =>
                                    updateProblemStatement(
                                      trackIdx,
                                      probIdx,
                                      'code',
                                      e.target.value.toUpperCase()
                                    )
                                  }
                                  placeholder="AI-01"
                                  className="w-full px-2.5 py-1 text-xs bg-white border border-[#E2E8F0] rounded-lg font-mono font-bold text-[#2563EB] focus:outline-none focus:border-[#2563EB]"
                                />
                              </div>

                              {/* Title */}
                              <div className="sm:col-span-8 space-y-1">
                                <span className="text-[9px] font-bold text-[#64748B] uppercase">
                                  PROBLEM STATEMENT TITLE*
                                </span>
                                <input
                                  type="text"
                                  required
                                  value={prob.title}
                                  onChange={(e) =>
                                    updateProblemStatement(
                                      trackIdx,
                                      probIdx,
                                      'title',
                                      e.target.value
                                    )
                                  }
                                  placeholder="e.g. Autonomous Clinical Diagnostic Agent"
                                  className="w-full px-2.5 py-1 text-xs bg-white border border-[#E2E8F0] rounded-lg font-bold text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
                                />
                              </div>

                              {/* Actions / Visibility */}
                              <div className="sm:col-span-2 flex items-center justify-end space-x-1.5 pt-4">
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateProblemStatement(
                                      trackIdx,
                                      probIdx,
                                      'isPublic',
                                      !prob.isPublic
                                    )
                                  }
                                  className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 border transition-colors ${
                                    prob.isPublic
                                      ? 'bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]'
                                      : 'bg-[#F1F5F9] text-[#64748B] border-[#E2E8F0]'
                                  }`}
                                  title={prob.isPublic ? 'Visible to participants' : 'Draft / Hidden'}
                                >
                                  {prob.isPublic ? (
                                    <Globe className="w-3.5 h-3.5" />
                                  ) : (
                                    <Lock className="w-3.5 h-3.5" />
                                  )}
                                  <span className="text-[10px]">
                                    {prob.isPublic ? 'Public' : 'Draft'}
                                  </span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => removeProblemStatement(trackIdx, probIdx)}
                                  className="p-1.5 text-[#DC2626] hover:bg-[#FEF2F2] rounded-lg transition-colors"
                                  title="Delete Problem Statement"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Description */}
                            <div className="space-y-1">
                              <span className="text-[9px] font-bold text-[#64748B] uppercase">
                                DESCRIPTION / PROBLEM STATEMENT DETAILS*
                              </span>
                              <textarea
                                required
                                rows={2}
                                value={prob.description}
                                onChange={(e) =>
                                  updateProblemStatement(
                                    trackIdx,
                                    probIdx,
                                    'description',
                                    e.target.value
                                  )
                                }
                                placeholder="Describe the problem context, dataset requirements, key technical deliverables, and success metrics..."
                                className="w-full p-2 text-xs bg-white border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-[#2563EB] text-[#0F172A] leading-relaxed"
                              />
                            </div>

                            {/* Challenge Doc URL */}
                            <div className="space-y-1">
                              <span className="text-[9px] font-bold text-[#64748B] uppercase">
                                CHALLENGE DOCUMENTATION URL (OPTIONAL)
                              </span>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="url"
                                  value={prob.challengeDocUrl || ''}
                                  onChange={(e) =>
                                    updateProblemStatement(
                                      trackIdx,
                                      probIdx,
                                      'challengeDocUrl',
                                      e.target.value
                                    )
                                  }
                                  placeholder="https://github.com/... or https://notion.site/... with detailed challenge PDF/spec"
                                  className="flex-1 px-2.5 py-1 text-xs bg-white border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-[#2563EB] text-[#0F172A]"
                                />
                                {prob.challengeDocUrl && (
                                  <a
                                    href={prob.challengeDocUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-1.5 text-[#2563EB] hover:bg-[#EFF6FF] rounded-lg border border-[#BFDBFE]"
                                    title="Open link"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </a>
                                )}
                              </div>
                            </div>

                            {/* Round Assignment (Standalone mode only) */}
                            {!embeddedInRound && rounds.length > 0 && (
                              <div className="space-y-1">
                                <span className="text-[9px] font-bold text-[#64748B] uppercase flex items-center gap-1">
                                  <RotateCw className="w-3 h-3" />
                                  ASSIGNED TO ROUND
                                </span>
                                <div className="flex items-center gap-2">
                                  <select
                                    value={prob.roundIndex ?? -1}
                                    onChange={(e) =>
                                      updateProblemStatement(
                                        trackIdx,
                                        probIdx,
                                        'roundIndex',
                                        Number(e.target.value)
                                      )
                                    }
                                    className="flex-1 max-w-xs px-2.5 py-1.5 text-xs bg-white border border-[#E2E8F0] rounded-lg font-semibold text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
                                  >
                                    <option value={-1}>All Rounds (Default)</option>
                                    {rounds.map((r, rIdx) => (
                                      <option key={rIdx} value={rIdx}>
                                        Round {rIdx + 1}: {r.name}{r.isFinal ? ' (Finale)' : ''}
                                      </option>
                                    ))}
                                  </select>
                                  {prob.roundIndex != null && prob.roundIndex >= 0 && prob.roundIndex < rounds.length && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] rounded-full">
                                      <RotateCw className="w-3 h-3" />
                                      R{prob.roundIndex + 1}: {rounds[prob.roundIndex].name}
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TracksAndProblemsEditor;
