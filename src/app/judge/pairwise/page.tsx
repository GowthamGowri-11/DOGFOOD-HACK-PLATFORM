'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Scale,
  Sparkles,
  Trophy,
  ExternalLink,
  Github,
  CheckCircle2,
  RefreshCw,
  ArrowRight,
  TrendingUp,
  BarChart2,
  HelpCircle,
  Award,
  Layers,
  Zap,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

export default function JudgePairwisePage() {
  const [matchup, setMatchup] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loadingMatchup, setLoadingMatchup] = useState(true);
  const [voting, setVoting] = useState(false);
  const [completedCount, setCompletedCount] = useState(5);
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadMatchup = async () => {
    try {
      setLoadingMatchup(true);
      const res = await fetch('/api/v1/pairwise/matchup');
      const json = await res.json();
      if (json.success && json.data) {
        setMatchup(json.data);
      }
    } catch (e) {
      console.error('Error fetching matchup:', e);
    } finally {
      setLoadingMatchup(false);
    }
  };

  const loadLeaderboard = async () => {
    try {
      const res = await fetch('/api/v1/pairwise/leaderboard');
      const json = await res.json();
      if (json.success && json.data?.rankings) {
        setLeaderboard(json.data.rankings);
      }
    } catch (e) {
      console.error('Error fetching leaderboard:', e);
    }
  };

  useEffect(() => {
    loadMatchup();
    loadLeaderboard();
  }, []);

  const handleVote = async (winnerId: string, winnerTitle: string) => {
    if (!matchup || voting) return;
    try {
      setVoting(true);
      const res = await fetch('/api/v1/pairwise/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectAId: matchup.projectA.id,
          projectBId: matchup.projectB.id,
          winnerId,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setCompletedCount((prev) => prev + 1);
        setFeedback(`Voted: "${winnerTitle.slice(0, 30)}..." marked superior. Next matchup loaded!`);
        setTimeout(() => setFeedback(null), 3000);
        await Promise.all([loadMatchup(), loadLeaderboard()]);
      }
    } catch (e) {
      console.error('Error casting vote:', e);
    } finally {
      setVoting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#131417] text-neutral-900 dark:text-neutral-100 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#FA541C] uppercase tracking-wider mb-1">
              <Scale className="w-4 h-4" />
              <span>Alternative Evaluation Paradigm</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Pairwise Judging Arena (The Gavel Approach)
            </h1>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1 max-w-2xl leading-relaxed">
              Never ask for an absolute score. Compare two projects side-by-side, pick the better solution, and a Bradley-Terry estimator mathematically recovers the global rank.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
              {completedCount} Decisions Recorded
            </span>
          </div>
        </div>

        {/* Feedback alert */}
        {feedback && (
          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in-50">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{feedback}</span>
          </div>
        )}

        {/* Pairwise Comparison Arena */}
        {loadingMatchup ? (
          <div className="p-16 text-center text-neutral-400 bg-white dark:bg-[#1A1C20] rounded-3xl border border-neutral-200 dark:border-neutral-800">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-[#FA541C]" />
            <p className="text-xs">Balancing comparison entropy & loading next pair...</p>
          </div>
        ) : !matchup ? (
          <div className="p-12 text-center bg-white dark:bg-[#1A1C20] rounded-3xl border border-neutral-200">
            No projects available for comparison.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative">
            {/* VS Badge in Middle */}
            <div className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-[#FA541C] text-white font-black text-sm items-center justify-center shadow-lg z-10 border-4 border-[#FAF8F5] dark:border-[#131417]">
              VS
            </div>

            {/* Project A Card */}
            <div className="bg-white dark:bg-[#1A1C20] rounded-3xl border border-neutral-200 dark:border-neutral-800 p-6 sm:p-7 shadow-sm flex flex-col justify-between space-y-6 hover:border-[#FA541C]/40 transition-all">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold"
                    style={{
                      backgroundColor: `${matchup.projectA.trackColorHex}15`,
                      color: matchup.projectA.trackColorHex,
                    }}
                  >
                    {matchup.projectA.trackTitle}
                  </span>
                  <span className="text-xs font-mono font-bold text-neutral-400">Option A</span>
                </div>

                <h3 className="text-lg sm:text-xl font-black text-neutral-900 dark:text-neutral-100 leading-snug">
                  {matchup.projectA.title}
                </h3>

                <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  {matchup.projectA.tagline || matchup.projectA.description}
                </p>

                {/* Tech Stack */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {matchup.projectA.techStack.map((tech: string) => (
                    <span
                      key={tech}
                      className="px-2 py-0.5 rounded text-[10px] font-mono bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300"
                    >
                      {tech}
                    </span>
                  ))}
                </div>

                {/* Links */}
                <div className="flex items-center gap-3 pt-2 text-xs">
                  {matchup.projectA.repoUrl && (
                    <a
                      href={matchup.projectA.repoUrl}
                      target="_blank"
                      className="text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 flex items-center gap-1"
                    >
                      <Github className="w-3.5 h-3.5" />
                      <span>Code Repo</span>
                    </a>
                  )}
                  {matchup.projectA.demoUrl && (
                    <a
                      href={matchup.projectA.demoUrl}
                      target="_blank"
                      className="text-[#FA541C] hover:underline flex items-center gap-1 font-semibold"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Live Demo</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Vote for A Button */}
              <button
                onClick={() => handleVote(matchup.projectA.id, matchup.projectA.title)}
                disabled={voting}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#FA541C] to-[#E03A00] text-white font-extrabold text-sm shadow-sm hover:opacity-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span>Select Project A as Superior</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Project B Card */}
            <div className="bg-white dark:bg-[#1A1C20] rounded-3xl border border-neutral-200 dark:border-neutral-800 p-6 sm:p-7 shadow-sm flex flex-col justify-between space-y-6 hover:border-[#FA541C]/40 transition-all">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold"
                    style={{
                      backgroundColor: `${matchup.projectB.trackColorHex}15`,
                      color: matchup.projectB.trackColorHex,
                    }}
                  >
                    {matchup.projectB.trackTitle}
                  </span>
                  <span className="text-xs font-mono font-bold text-neutral-400">Option B</span>
                </div>

                <h3 className="text-lg sm:text-xl font-black text-neutral-900 dark:text-neutral-100 leading-snug">
                  {matchup.projectB.title}
                </h3>

                <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  {matchup.projectB.tagline || matchup.projectB.description}
                </p>

                {/* Tech Stack */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {matchup.projectB.techStack.map((tech: string) => (
                    <span
                      key={tech}
                      className="px-2 py-0.5 rounded text-[10px] font-mono bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300"
                    >
                      {tech}
                    </span>
                  ))}
                </div>

                {/* Links */}
                <div className="flex items-center gap-3 pt-2 text-xs">
                  {matchup.projectB.repoUrl && (
                    <a
                      href={matchup.projectB.repoUrl}
                      target="_blank"
                      className="text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 flex items-center gap-1"
                    >
                      <Github className="w-3.5 h-3.5" />
                      <span>Code Repo</span>
                    </a>
                  )}
                  {matchup.projectB.demoUrl && (
                    <a
                      href={matchup.projectB.demoUrl}
                      target="_blank"
                      className="text-[#FA541C] hover:underline flex items-center gap-1 font-semibold"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Live Demo</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Vote for B Button */}
              <button
                onClick={() => handleVote(matchup.projectB.id, matchup.projectB.title)}
                disabled={voting}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#FA541C] to-[#E03A00] text-white font-extrabold text-sm shadow-sm hover:opacity-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span>Select Project B as Superior</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Skip Button */}
        <div className="text-center">
          <button
            onClick={loadMatchup}
            disabled={loadingMatchup || voting}
            className="text-xs text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 font-semibold underline cursor-pointer"
          >
            Too close to call? Skip to next matchup &rarr;
          </button>
        </div>

        {/* Live Bradley-Terry Leaderboard */}
        <div className="bg-white dark:bg-[#1A1C20] rounded-3xl border border-neutral-200 dark:border-neutral-800 p-6 sm:p-7 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" />
                <span>Recovered Global Leaderboard (Bradley-Terry Estimator)</span>
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Maximum likelihood skill parameter (π) converged via Minorize-Maximization iterations.
              </p>
            </div>

            <button
              onClick={loadLeaderboard}
              className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg"
              title="Refresh ranking"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-3">Rank</th>
                  <th className="py-3 px-3">Project</th>
                  <th className="py-3 px-3 text-center">Wins</th>
                  <th className="py-3 px-3 text-center">Losses</th>
                  <th className="py-3 px-3 text-center">Win Rate</th>
                  <th className="py-3 px-3 text-center">Latent Skill (π)</th>
                  <th className="py-3 px-3 text-right">Calibrated Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60">
                {leaderboard.map((item) => (
                  <tr
                    key={item.projectId}
                    className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors"
                  >
                    <td className="py-3 px-3 font-black text-sm">
                      <span
                        className={`w-6 h-6 rounded-full inline-flex items-center justify-center text-xs ${
                          item.rank === 1
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-black'
                            : 'text-neutral-500'
                        }`}
                      >
                        #{item.rank}
                      </span>
                    </td>

                    <td className="py-3 px-3 font-semibold text-neutral-900 dark:text-neutral-100 max-w-sm">
                      {item.projectTitle}
                    </td>

                    <td className="py-3 px-3 text-center font-bold text-emerald-600">
                      {item.wins}
                    </td>

                    <td className="py-3 px-3 text-center font-mono text-neutral-400">
                      {item.losses}
                    </td>

                    <td className="py-3 px-3 text-center font-mono font-bold">
                      {item.winRate}%
                    </td>

                    <td className="py-3 px-3 text-center font-mono text-neutral-500">
                      {item.latentSkill}
                    </td>

                    <td className="py-3 px-3 text-right font-mono font-bold text-sm text-[#FA541C]">
                      {item.calibratedRating}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
