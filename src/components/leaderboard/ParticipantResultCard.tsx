'use client';

import React from 'react';
import { Award, CheckCircle, AlertTriangle, ShieldCheck } from 'lucide-react';

export interface ParticipantCriterionScore {
  criterionId: string;
  criterionName: string;
  weight: number;
  score: number;
  maxScore: number;
}

export interface ParticipantResultCardProps {
  projectTitle: string;
  rank: number;
  finalScore: number;
  isWinner: boolean;
  awardCategory?: string | null;
  calculationMode: 'CALIBRATED_ROBUST' | 'ROBUST_ONLY';
  evidenceStatus: 'SUFFICIENT' | 'LOW_EVIDENCE';
  hasDisagreementFlag: boolean;
  criteria: ParticipantCriterionScore[];
}

export const ParticipantResultCard: React.FC<ParticipantResultCardProps> = ({
  projectTitle,
  rank,
  finalScore,
  isWinner,
  awardCategory,
  calculationMode,
  evidenceStatus,
  hasDisagreementFlag,
  criteria,
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl text-slate-100 relative overflow-hidden">
      {/* Background ambient accent */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400 bg-indigo-950/60 px-2.5 py-0.5 rounded-full border border-indigo-800/50">
              Official Hackathon Result
            </span>
            {isWinner && (
              <span className="flex items-center gap-1 text-xs font-bold text-amber-300 bg-amber-950/60 px-2.5 py-0.5 rounded-full border border-amber-700/50">
                <Award className="w-3.5 h-3.5" />
                {awardCategory || 'Prize Winner'}
              </span>
            )}
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">{projectTitle}</h2>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-xs text-slate-400 uppercase font-medium">Rank</div>
            <div className="text-3xl font-extrabold text-indigo-400">#{rank}</div>
          </div>
          <div className="h-10 w-px bg-slate-800" />
          <div className="text-right">
            <div className="text-xs text-slate-400 uppercase font-medium">Score</div>
            <div className="text-3xl font-extrabold text-emerald-400">
              {finalScore.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* Criterion Breakdown */}
      <div className="my-6">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-3">
          Criterion Breakdown & Rubric Weights
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {criteria.map((crit) => (
            <div
              key={crit.criterionId}
              className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between"
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-sm font-medium text-slate-200">{crit.criterionName}</span>
                <span className="text-xs font-mono text-slate-400 bg-slate-800/60 px-1.5 py-0.5 rounded">
                  {(crit.weight * 100).toFixed(0)}% weight
                </span>
              </div>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-xs text-slate-500">Estimated Quality</span>
                <span className="text-lg font-bold text-slate-100 font-mono">
                  {crit.score.toFixed(2)}{' '}
                  <span className="text-xs text-slate-500 font-normal">/ {crit.maxScore}</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Methodology & Integrity Transparency */}
      <div className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" />
          <span>
            Engine:{' '}
            <strong className="text-slate-200">
              {calculationMode === 'CALIBRATED_ROBUST'
                ? 'Calibrated + Robust IRLS'
                : 'Robust-Only IRLS'}
            </strong>
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            {evidenceStatus === 'SUFFICIENT' ? (
              <span className="flex items-center gap-1 text-emerald-400">
                <CheckCircle className="w-3.5 h-3.5" /> Full Coverage
              </span>
            ) : (
              <span className="flex items-center gap-1 text-amber-400">
                <AlertTriangle className="w-3.5 h-3.5" /> Limited Evidence
              </span>
            )}
          </div>

          {hasDisagreementFlag && (
            <div className="flex items-center gap-1 text-amber-300">
              <AlertTriangle className="w-3.5 h-3.5" /> High Disagreement Preserved
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
