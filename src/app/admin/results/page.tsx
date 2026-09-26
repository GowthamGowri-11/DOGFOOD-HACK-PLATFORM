'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Award,
  Trophy,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  BarChart3,
  Flame,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface ResultHackathon {
  id: string;
  title: string;
  slug: string;
  status: string;
  resultsPublishedAt: string | null;
  organizer: { fullName: string };
  prizes: Array<{ id: string; title: string; amount: number | null }>;
  results: Array<{
    rank: number;
    finalScore: number;
    isPublished: boolean;
    awardCategory: string | null;
    project: {
      id: string;
      title: string;
      team: { name: string };
    };
  }>;
  _count: {
    results: number;
    projects: number;
  };
}

export default function AdminResultsPage() {
  const [hackathons, setHackathons] = useState<ResultHackathon[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchResults = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/admin/results');
      const json = await res.json();
      if (json.success && json.data) {
        setHackathons(json.data.hackathons || []);
      }
    } catch (err) {
      console.error('Failed to load results:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const handlePublish = async (hackathonId: string) => {
    setPublishingId(hackathonId);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch('/api/v1/admin/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hackathonId }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage('Results successfully verified and published to public leaderboard!');
        fetchResults();
      } else {
        setError(data.error?.message || 'Failed to publish results');
      }
    } catch {
      setError('Network error while publishing results');
    } finally {
      setPublishingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#E2E8F0] gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-bold text-[#DC2626] bg-[#FEF2F2] px-2.5 py-0.5 rounded-full border border-[#FECACA]">
              Global Platform Control
            </span>
            <span className="text-[11px] font-semibold text-[#059669] bg-[#ECFDF5] px-2.5 py-0.5 rounded-full border border-[#A7F3D0] flex items-center">
              <CheckCircle2 className="w-3 h-3 mr-1" /> Results Engine Synchronized
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#111827] mt-1 tracking-tight">
            Leaderboard & Results Publication
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
            Administers official normalized scores, podium rankings, award assignments, and global public publication.
          </p>
        </div>

        <Link
          href="/leaderboard"
          target="_blank"
          className="inline-flex items-center px-4 py-2.5 bg-[#002B49] text-white text-xs font-semibold rounded-[11px] hover:bg-[#001D32] transition-colors shadow-sm self-start sm:self-center"
        >
          <BarChart3 className="w-4 h-4 mr-1.5" />
          Public Leaderboard
        </Link>
      </div>

      {message && (
        <div className="p-4 bg-[#ECFDF5] border border-[#A7F3D0] rounded-[14px] text-xs text-[#065F46] flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-[#FEF2F2] border border-[#FECACA] rounded-[14px] text-xs text-[#DC2626] flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Results Cards List */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center text-xs text-[#64748B] bg-white rounded-[18px] border border-[#E2E8F0]">
            Loading leaderboard data from PostgreSQL...
          </div>
        ) : hackathons.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-[18px] border border-[#E2E8F0]">
            <Award className="w-8 h-8 text-[#CBD5E1] mx-auto mb-2" />
            <p className="text-sm font-semibold text-[#111827]">No arenas with results</p>
            <p className="text-xs text-[#64748B] mt-0.5">Arenas appear here once judging commences.</p>
          </div>
        ) : (
          hackathons.map((h) => {
            const isPublished = h.status === 'RESULTS_PUBLISHED';
            const hasResults = h._count.results > 0;

            return (
              <div
                key={h.id}
                className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-[18px] p-6 shadow-card space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E2E8F0] gap-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h2 className="text-base font-bold text-[#111827]">{h.title}</h2>
                      {isPublished ? (
                        <Badge variant="emerald">RESULTS PUBLISHED</Badge>
                      ) : (
                        <Badge variant="blue">{h.status}</Badge>
                      )}
                    </div>
                    <p className="text-xs text-[#64748B] mt-0.5">
                      Organized by {h.organizer.fullName} • {h._count.results} ranked projects • {h.prizes.length} prize tiers
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    {hasResults && !isPublished && (
                      <Button
                        size="sm"
                        onClick={() => handlePublish(h.id)}
                        disabled={publishingId === h.id}
                      >
                        <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                        {publishingId === h.id ? 'Publishing...' : 'Publish Official Results'}
                      </Button>
                    )}
                    <Link
                      href={`/leaderboard?hackathonId=${h.id}`}
                      target="_blank"
                      className="inline-flex items-center px-3 py-2 text-xs font-semibold text-[#002B49] bg-[#F1F5F9] hover:bg-[#E2E8F0] rounded-[11px] transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5 mr-1" />
                      View Arena Leaderboard
                    </Link>
                  </div>
                </div>

                {/* Top 3 Podium Mini-View */}
                {h.results.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {h.results.slice(0, 3).map((res) => (
                      <div
                        key={res.project.id}
                        className={`p-3.5 rounded-[14px] border ${
                          res.rank === 1
                            ? 'bg-[#FEFCE8] border-[#FEF08A]'
                            : res.rank === 2
                            ? 'bg-[#F8FAFC] border-[#E2E8F0]'
                            : 'bg-[#FFF7ED] border-[#FFEDD5]'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-bold text-[#111827]">
                            {res.rank === 1 ? '🥇 1st Place' : res.rank === 2 ? '🥈 2nd Place' : '🥉 3rd Place'}
                          </span>
                          <span className="font-mono font-bold text-[#002B49]">
                            {res.finalScore.toFixed(2)} pts
                          </span>
                        </div>
                        <div className="font-semibold text-xs text-[#111827] truncate">
                          {res.project.title}
                        </div>
                        <div className="text-[11px] text-[#64748B] truncate mt-0.5">
                          Team: {res.project.team.name}
                        </div>
                        {res.awardCategory && (
                          <div className="mt-2 text-[10px] font-bold text-[#2563EB] bg-white/80 px-2 py-0.5 rounded-full inline-block border border-[#BFDBFE]">
                            🏆 {res.awardCategory}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#94A3B8] italic">
                    Judging evaluations have not been normalized yet for this arena.
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
