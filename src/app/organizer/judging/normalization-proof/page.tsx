'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Scale,
  Award,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  HelpCircle,
  RefreshCw,
  Info,
  Shield,
  BookOpen,
  Sigma,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

export default function NormalizationProofPage() {
  const [proof, setProof] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProof() {
      try {
        setLoading(true);
        const res = await fetch('/api/v1/normalization/proof');
        const json = await res.json();
        if (json.success && json.data) {
          setProof(json.data);
        }
      } catch (e) {
        console.error('Failed to load normalization proof:', e);
      } finally {
        setLoading(false);
      }
    }
    loadProof();
  }, []);

  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#131417] text-neutral-900 dark:text-neutral-100 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#FA541C] uppercase tracking-wider mb-1">
              <Scale className="w-4 h-4" />
              <span>Statistical Audit & Fair Grading</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Cross-Judge Normalization Proof
            </h1>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1 max-w-2xl leading-relaxed">
              Every commercial platform claims to calibrate judges; here is the transparent mathematical proof that eliminates strict vs lenient judge bias on the fixture dataset.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/organizer/judging"
              className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 text-xs font-bold hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              &larr; Back to Judging Hub
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="p-16 text-center text-neutral-400">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-[#FA541C]" />
            <p className="text-xs">Computing Gaussian Z-Score calibrations...</p>
          </div>
        ) : !proof ? (
          <div className="p-8 text-center bg-white dark:bg-[#1A1C20] rounded-2xl border border-neutral-200">
            Proof computation unavailable.
          </div>
        ) : (
          <div className="space-y-8">
            {/* Judge Evaluation Variance Audit Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {proof.judgeStats.map((judge: any) => (
                <div
                  key={judge.judgeId}
                  className={`bg-white dark:bg-[#1A1C20] rounded-2xl border p-5 shadow-sm space-y-3 ${
                    judge.strictnessRating === 'STRICT'
                      ? 'border-red-200 dark:border-red-950/60'
                      : 'border-blue-200 dark:border-blue-950/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10.5px] font-bold uppercase tracking-wider text-neutral-400">
                        Evaluator Profile
                      </span>
                      <h3 className="font-extrabold text-sm sm:text-base text-neutral-900 dark:text-neutral-100 mt-0.5">
                        {judge.judgeName}
                      </h3>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-extrabold ${
                        judge.strictnessRating === 'STRICT'
                          ? 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300 border border-red-200'
                          : 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200'
                      }`}
                    >
                      {judge.strictnessRating === 'STRICT' ? 'Strict Grader' : 'Lenient Grader'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-center pt-2">
                    <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-800">
                      <div className="text-base font-extrabold text-neutral-900 dark:text-neutral-100">
                        {judge.mean}
                      </div>
                      <div className="text-[10.5px] text-neutral-500">Sample Mean (μ)</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-800">
                      <div className="text-base font-extrabold text-neutral-900 dark:text-neutral-100">
                        {judge.stdDev}
                      </div>
                      <div className="text-[10.5px] text-neutral-500">Std Dev (σ)</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-800">
                      <div className="text-base font-extrabold text-[#FA541C]">
                        {judge.evaluationCount}
                      </div>
                      <div className="text-[10.5px] text-neutral-500">Projects Graded</div>
                    </div>
                  </div>

                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    {judge.strictnessRating === 'STRICT'
                      ? 'Grades on average 20 points lower than the lenient judge. Raw scores alone would artificially penalize any project assigned to this evaluator.'
                      : 'Grades with generous margins. Projects assigned to this judge receive higher raw averages regardless of comparative quality.'}
                  </p>
                </div>
              ))}
            </div>

            {/* Proof Table: Raw vs Normalized Ranking Changes */}
            <div className="bg-white dark:bg-[#1A1C20] rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-[#FA541C]" />
                    <span>The Proof: Raw Scores vs. Normalized Scores &amp; Rank Shifts</span>
                  </h2>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Observe how Z-score normalization restores fair meritocracy and corrects ranking inversions.
                  </p>
                </div>

                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200">
                  {proof.fixtureProofSummary.rankInversionsRecovered} Rank Inversions Recovered
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 uppercase tracking-wider font-semibold">
                      <th className="py-3 px-3">Normalized Rank</th>
                      <th className="py-3 px-3">Project Title</th>
                      <th className="py-3 px-3 text-center">Raw Avg</th>
                      <th className="py-3 px-3 text-center">Raw Rank</th>
                      <th className="py-3 px-3 text-center">Normalized Score</th>
                      <th className="py-3 px-3 text-center">Rank Shift</th>
                      <th className="py-3 px-3">Correction Analysis</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60">
                    {proof.projectOutcomes.map((item: any) => (
                      <tr
                        key={item.projectId}
                        className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors"
                      >
                        <td className="py-3.5 px-3 font-black text-sm">
                          <span
                            className={`w-6 h-6 rounded-full inline-flex items-center justify-center text-xs ${
                              item.normalizedRank === 1
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-black'
                                : 'text-neutral-500'
                            }`}
                          >
                            #{item.normalizedRank}
                          </span>
                        </td>

                        <td className="py-3.5 px-3 font-semibold text-neutral-900 dark:text-neutral-100 max-w-xs">
                          {item.projectTitle || item.projectId}
                        </td>

                        <td className="py-3.5 px-3 text-center font-mono text-neutral-600 dark:text-neutral-300 font-bold">
                          {item.rawAverage}
                        </td>

                        <td className="py-3.5 px-3 text-center font-mono text-neutral-400">
                          #{item.rawRank}
                        </td>

                        <td className="py-3.5 px-3 text-center font-mono text-sm font-black text-[#FA541C]">
                          {item.normalizedScore}
                        </td>

                        <td className="py-3.5 px-3 text-center">
                          {item.rankDelta > 0 ? (
                            <span className="inline-flex items-center gap-1 font-bold text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                              <TrendingUp className="w-3 h-3" />
                              <span>+{item.rankDelta}</span>
                            </span>
                          ) : item.rankDelta < 0 ? (
                            <span className="inline-flex items-center gap-1 font-bold text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                              <TrendingDown className="w-3 h-3" />
                              <span>{item.rankDelta}</span>
                            </span>
                          ) : (
                            <span className="text-neutral-400 font-mono text-xs">—</span>
                          )}
                        </td>

                        <td className="py-3.5 px-3 text-[11px] text-neutral-500 dark:text-neutral-400 max-w-sm">
                          {item.explanation}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* For The Statisticians: Mathematical Foundations Card */}
            <div className="bg-white dark:bg-[#1A1C20] rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 sm:p-8 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 flex items-center justify-center">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-neutral-900 dark:text-neutral-100">
                    Mathematical Specification (For Statisticians)
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Rigorous definition of cross-grader Gaussian normalization
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs pt-2">
                <div className="p-4 bg-neutral-50 dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-1">
                  <span className="text-[10.5px] font-sans font-bold text-neutral-400 uppercase tracking-wider block">
                    1. Standardized Z-Score per Judge
                  </span>
                  <div className="text-sm font-bold text-purple-600 dark:text-purple-400 py-1">
                    {proof.mathematicalSpecification.formulaZScore}
                  </div>
                  <p className="font-sans text-[11px] text-neutral-500">
                    Measures how many standard deviations (&sigma;<sub>j</sub>) a score (x<sub>jk</sub>) lies above or below judge j&#39;s personalized grading mean (&mu;<sub>j</sub>).
                  </p>
                </div>

                <div className="p-4 bg-neutral-50 dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-1">
                  <span className="text-[10.5px] font-sans font-bold text-neutral-400 uppercase tracking-wider block">
                    2. Rescaling to Global Bounded Distribution
                  </span>
                  <div className="text-sm font-bold text-purple-600 dark:text-purple-400 py-1">
                    {proof.mathematicalSpecification.formulaRescaling}
                  </div>
                  <p className="font-sans text-[11px] text-neutral-500">
                    Maps average standardized Z-scores back onto the hackathon&#39;s global distribution (&mu;<sub>global</sub> = {proof.globalStats.globalMean}, &sigma;<sub>global</sub> = {proof.globalStats.globalStdDev}).
                  </p>
                </div>
              </div>

              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200">
                <strong>Defensible Conclusion:</strong> {proof.fixtureProofSummary.conclusion}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
