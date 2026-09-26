'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Trophy,
  Award,
  CheckCircle2,
  Clock,
  ExternalLink,
  ShieldCheck,
  Heart,
  MessageSquare,
  AlertCircle,
  ArrowLeft,
} from 'lucide-react';

export default function ParticipantResultsPage() {
  const [hackathons, setHackathons] = useState<any[]>([]);
  const [selectedHackathonId, setSelectedHackathonId] = useState<string>('');
  const [resultData, setResultData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadRegisteredHackathons() {
      try {
        const res = await fetch('/api/v1/hackathons');
        const json = await res.json();
        if (json.data?.hackathons && json.data.hackathons.length > 0) {
          setHackathons(json.data.hackathons);
          setSelectedHackathonId(json.data.hackathons[0].id);
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadRegisteredHackathons();
  }, []);

  useEffect(() => {
    async function fetchParticipantResult() {
      if (!selectedHackathonId) return;
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/v1/participants/me/hackathons/${selectedHackathonId}/result`);
        const json = await res.json();

        if (!res.ok) {
          throw new Error(json.error?.message || 'No submission found for this event.');
        }

        setResultData(json.data);
      } catch (err: any) {
        setError(err.message);
        setResultData(null);
      } finally {
        setLoading(false);
      }
    }

    fetchParticipantResult();
  }, [selectedHackathonId]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              Participant Hub
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
            My Hackathon Results & Awards
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm">
            Review official judge scores, rank standing, and awards for your submitted projects.
          </p>
        </div>

        {hackathons.length > 0 && (
          <div className="flex items-center space-x-3 self-end md:self-center">
            <label className="text-xs font-bold text-slate-500">Event:</label>
            <select
              value={selectedHackathonId}
              onChange={(e) => setSelectedHackathonId(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 bg-white"
            >
              {hackathons.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.title} {h.status === 'RESULTS_PUBLISHED' ? '🏆' : ''}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
          <p className="text-xs text-slate-500 font-medium mt-3">Loading your result...</p>
        </div>
      ) : error ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-16 text-center space-y-3 shadow-sm max-w-xl mx-auto">
          <AlertCircle className="w-10 h-10 text-slate-300 mx-auto" />
          <h2 className="text-base font-bold text-slate-800">No Submission Found</h2>
          <p className="text-xs text-slate-500">{error}</p>
        </div>
      ) : !resultData?.hackathon?.isPublished ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-16 text-center space-y-3 shadow-sm max-w-xl mx-auto">
          <Clock className="w-12 h-12 text-amber-500 mx-auto" />
          <h2 className="text-lg font-bold text-slate-900">Judging In Progress</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Your project &quot;<strong>{resultData?.project?.title}</strong>&quot; is being evaluated by the jury. Official scores and rank will be unlocked once published by the organizer.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-sm space-y-8">
          {/* Project Title & Track */}
          <div className="flex flex-wrap justify-between items-start gap-4">
            <div>
              <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
                {resultData.project.track}
              </span>
              <h2 className="text-2xl font-black text-slate-900 mt-2">
                {resultData.project.title}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Problem: {resultData.project.problemStatement}
              </p>
            </div>

            <Link
              href={`/projects/${resultData.project.id}`}
              className="inline-flex items-center px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5 mr-1.5" /> View Project Page
            </Link>
          </div>

          {/* Award Card if Winner */}
          {resultData.result?.awardCategory && (
            <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200 rounded-2xl p-6 flex items-center justify-between text-emerald-900 shadow-sm">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-200">
                  <Trophy className="w-7 h-7" />
                </div>
                <div>
                  <div className="text-xs font-black uppercase tracking-wider text-emerald-700">
                    Official Award
                  </div>
                  <div className="text-xl font-black">{resultData.result.awardCategory}</div>
                </div>
              </div>

              <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-200 text-emerald-900">
                Winner
              </span>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-50 border border-slate-200/80 p-5 rounded-2xl">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Official Rank
              </div>
              <div className="text-3xl font-black text-slate-900 mt-1">
                #{resultData.result?.rank}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">In official standings</div>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 p-5 rounded-2xl">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Normalized Score
              </div>
              <div className="text-3xl font-black text-purple-600 font-mono mt-1">
                {resultData.result?.finalScore?.toFixed(1)} <span className="text-sm font-normal text-slate-400">/ 100</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Z-Score calibrated</div>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 p-5 rounded-2xl">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Community Votes
              </div>
              <div className="text-3xl font-black text-rose-500 mt-1 flex items-center">
                <Heart className="w-6 h-6 mr-1.5 fill-rose-500" />
                {resultData.project.communityVotesCount}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">From public showcase</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
