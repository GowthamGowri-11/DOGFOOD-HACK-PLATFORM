'use client';

import React, { useState, useEffect } from 'react';
import {
  Layers,
  MessageSquare,
  ThumbsUp,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  EyeOff,
  Eye,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export default function OrganizerCommunityPage() {
  const [hackathons, setHackathons] = useState<any[]>([]);
  const [selectedHackathonId, setSelectedHackathonId] = useState<string>('');

  useEffect(() => {
    async function loadHackathons() {
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
    loadHackathons();
  }, []);

  return (
    <div className="space-y-6 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#E2E8F0] gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-bold text-[#2563EB] bg-[#EFF6FF] px-2.5 py-0.5 rounded-full border border-[#BFDBFE]">
              Community Operations
            </span>
            <span className="text-[11px] font-semibold text-[#059669] bg-[#ECFDF5] px-2.5 py-0.5 rounded-full border border-[#A7F3D0]">
              Anti-Abuse &amp; Moderation Active
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#111827] mt-1 tracking-tight">
            Community Moderation &amp; Voting Hub
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-0.5 font-normal">
            Moderate discussion comments across project gallery submissions and inspect community popularity votes.
          </p>
        </div>

        {hackathons.length > 0 && (
          <div className="flex items-center space-x-2">
            <label className="text-xs font-semibold text-[#334155]">Hackathon:</label>
            <select
              value={selectedHackathonId}
              onChange={(e) => setSelectedHackathonId(e.target.value)}
              className="px-3 py-2 bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] rounded-[11px] text-xs font-semibold text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            >
              {hackathons.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.title}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Community Governance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
        <div className="bg-white border border-[#E2E8F0] rounded-[18px] p-6 shadow-card space-y-3">
          <div className="flex items-center space-x-2">
            <MessageSquare className="w-4 h-4 text-[#2563EB]" />
            <h3 className="text-base font-bold text-[#111827]">Comment Moderation Protocol</h3>
          </div>
          <p className="text-[#64748B] leading-relaxed">
            Organizers hold authority to hide or flag abusive comments on projects submitted to their hackathons. All moderation actions are logged immutably in the audit trail.
          </p>
          <div className="p-3 bg-[#F8FAFC] rounded-xl text-[#334155]">
            <strong>Audit Guarantee:</strong> Content sanitization strips XSS and malicious payloads prior to database persistence.
          </div>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-[18px] p-6 shadow-card space-y-3">
          <div className="flex items-center space-x-2">
            <ThumbsUp className="w-4 h-4 text-[#059669]" />
            <h3 className="text-base font-bold text-[#111827]">Community Popularity Voting</h3>
          </div>
          <p className="text-[#64748B] leading-relaxed">
            Community votes power the People&apos;s Choice awards. As a core architectural invariant, community votes are strictly isolated and never alter official jury rubric scores.
          </p>
          <div className="p-3 bg-[#F8FAFC] rounded-xl text-[#334155]">
            <strong>Invariant:</strong> Jury Z-score normalization remains 100% blind to public vote tallies.
          </div>
        </div>
      </div>
    </div>
  );
}
