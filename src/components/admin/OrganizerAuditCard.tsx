'use client';

import React, { useState } from 'react';
import {
  Shield,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  Activity,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export interface OrganizerAuditCardProps {
  eventId: string;
  algorithmVersion: string;
  rubricVersion: string;
  calculationMode: string;
  modeReason: string;
  outputHash: string;
  headHash: string;
  assignmentValidation: {
    passed: boolean;
    checks: Array<{
      name: string;
      threshold: number | string;
      actualValue: number | string;
      passed: boolean;
      explanation: string;
    }>;
  };
  judgeOffsets: Record<string, number>;
  sensitivity: Array<{
    position: number;
    originalProjectId: string;
    status: 'STABLE' | 'SENSITIVE';
    alteredByJudgeId?: string;
    replacementProjectId?: string;
  }>;
  onRecomputeVerify?: () => Promise<{ passed: boolean; message: string }>;
}

export const OrganizerAuditCard: React.FC<OrganizerAuditCardProps> = ({
  eventId,
  algorithmVersion,
  rubricVersion,
  calculationMode,
  modeReason,
  outputHash,
  headHash,
  assignmentValidation,
  judgeOffsets,
  sensitivity,
  onRecomputeVerify,
}) => {
  const [recomputing, setRecomputing] = useState(false);
  const [recomputeStatus, setRecomputeStatus] = useState<{
    passed: boolean;
    message: string;
  } | null>(null);
  const [expandedSection, setExpandedSection] = useState<'none' | 'validation' | 'sensitivity' | 'offsets'>(
    'validation'
  );

  const handleRecompute = async () => {
    if (!onRecomputeVerify) return;
    setRecomputing(true);
    setRecomputeStatus(null);
    try {
      const res = await onRecomputeVerify();
      setRecomputeStatus(res);
    } catch (err: any) {
      setRecomputeStatus({ passed: false, message: err?.message || 'Recomputation error.' });
    } finally {
      setRecomputing(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl text-slate-100">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white tracking-tight">EWJE v2 Audit Card</h2>
              <span className="text-xs font-mono bg-indigo-950 text-indigo-300 px-2 py-0.5 rounded border border-indigo-800">
                {algorithmVersion}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Mode: <strong className="text-slate-200">{calculationMode}</strong> ({modeReason})
            </p>
          </div>
        </div>

        <button
          onClick={handleRecompute}
          disabled={recomputing}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition shadow-lg shadow-indigo-600/20 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${recomputing ? 'animate-spin' : ''}`} />
          {recomputing ? 'Recomputing...' : 'Recompute & Verify Hash'}
        </button>
      </div>

      {/* Recompute Alert */}
      {recomputeStatus && (
        <div
          className={`mt-4 p-3.5 rounded-xl border flex items-center gap-3 text-xs ${
            recomputeStatus.passed
              ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
              : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
          }`}
        >
          {recomputeStatus.passed ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          ) : (
            <XCircle className="w-4 h-4 shrink-0 text-rose-400" />
          )}
          <span>{recomputeStatus.message}</span>
        </div>
      )}

      {/* Immutable Hash Hashes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 my-5">
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
          <div className="text-xs text-slate-400 mb-1 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-indigo-400" />
            <span>Output Hash (SHA-256 Canonical JSON)</span>
          </div>
          <div className="font-mono text-xs text-slate-200 truncate select-all">{outputHash}</div>
        </div>

        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
          <div className="text-xs text-slate-400 mb-1 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span>Score Event Head Hash</span>
          </div>
          <div className="font-mono text-xs text-slate-200 truncate select-all">{headHash}</div>
        </div>
      </div>

      {/* Collapsible Section 1: Assignment Validation */}
      <div className="border border-slate-800 rounded-xl overflow-hidden mb-3">
        <button
          onClick={() =>
            setExpandedSection(expandedSection === 'validation' ? 'none' : 'validation')
          }
          className="w-full bg-slate-950/50 p-3.5 flex items-center justify-between text-left text-xs font-semibold text-slate-200 hover:bg-slate-800/40 transition cursor-pointer"
        >
          <div className="flex items-center gap-2">
            {assignmentValidation.passed ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <XCircle className="w-4 h-4 text-rose-400" />
            )}
            <span>Assignment Structural Validation (7 Checks)</span>
          </div>
          {expandedSection === 'validation' ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {expandedSection === 'validation' && (
          <div className="p-4 bg-slate-950/30 space-y-2 border-t border-slate-800">
            {assignmentValidation.checks.map((chk, i) => (
              <div
                key={i}
                className="flex items-start justify-between text-xs py-1.5 border-b border-slate-800/40 last:border-0"
              >
                <div>
                  <div className="font-semibold text-slate-200">{chk.name}</div>
                  <div className="text-slate-400 text-xs mt-0.5">{chk.explanation}</div>
                </div>
                <span
                  className={`px-2 py-0.5 rounded font-mono font-bold text-xs shrink-0 ${
                    chk.passed
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : 'bg-rose-950 text-rose-400 border border-rose-800'
                  }`}
                >
                  {chk.passed ? 'PASS' : 'FAIL'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Collapsible Section 2: Sensitivity to Removing One Judge */}
      <div className="border border-slate-800 rounded-xl overflow-hidden mb-3">
        <button
          onClick={() =>
            setExpandedSection(expandedSection === 'sensitivity' ? 'none' : 'sensitivity')
          }
          className="w-full bg-slate-950/50 p-3.5 flex items-center justify-between text-left text-xs font-semibold text-slate-200 hover:bg-slate-800/40 transition cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>Leave-One-Judge-Out Podium Sensitivity</span>
          </div>
          {expandedSection === 'sensitivity' ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {expandedSection === 'sensitivity' && (
          <div className="p-4 bg-slate-950/30 space-y-2 border-t border-slate-800">
            {sensitivity.map((s, i) => (
              <div
                key={i}
                className="flex items-center justify-between text-xs py-1.5 border-b border-slate-800/40 last:border-0"
              >
                <div>
                  <span className="font-bold text-slate-200">Podium #{s.position}: </span>
                  <span className="font-mono text-indigo-300">{s.originalProjectId}</span>
                  {s.status === 'SENSITIVE' && s.alteredByJudgeId && (
                    <span className="text-slate-400 ml-2">
                      (Sensitive: removing judge {s.alteredByJudgeId} yields {s.replacementProjectId})
                    </span>
                  )}
                </div>
                <span
                  className={`px-2 py-0.5 rounded font-mono font-bold text-xs ${
                    s.status === 'STABLE'
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : 'bg-amber-950 text-amber-400 border border-amber-800'
                  }`}
                >
                  {s.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Collapsible Section 3: Judge Offsets */}
      <div className="border border-slate-800 rounded-xl overflow-hidden">
        <button
          onClick={() => (expandedSection === 'offsets' ? setExpandedSection('none') : setExpandedSection('offsets'))}
          className="w-full bg-slate-950/50 p-3.5 flex items-center justify-between text-left text-xs font-semibold text-slate-200 hover:bg-slate-800/40 transition cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-400" />
            <span>Fitted Systematic Judge Offsets (Pseudonyms)</span>
          </div>
          {expandedSection === 'offsets' ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {expandedSection === 'offsets' && (
          <div className="p-4 bg-slate-950/30 grid grid-cols-2 md:grid-cols-4 gap-2 border-t border-slate-800">
            {Object.entries(judgeOffsets).map(([jId, offset]) => (
              <div
                key={jId}
                className="bg-slate-900 border border-slate-800/80 rounded-lg p-2.5 text-xs flex justify-between items-center"
              >
                <span className="font-mono text-slate-300">{jId}</span>
                <span
                  className={`font-mono font-semibold ${
                    offset > 0
                      ? 'text-emerald-400'
                      : offset < 0
                      ? 'text-rose-400'
                      : 'text-slate-400'
                  }`}
                >
                  {offset > 0 ? `+${offset.toFixed(3)}` : offset.toFixed(3)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
