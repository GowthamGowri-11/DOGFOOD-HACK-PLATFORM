'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface RegistrationItem {
  id: string;
  userId: string;
  status: string;
  checkedIn: boolean;
  registeredAt: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    avatarUrl?: string | null;
  };
  hackathon: {
    id: string;
    title: string;
  };
}

export default function OrganizerRegistrationsPage() {
  const [hackathons, setHackathons] = useState<any[]>([]);
  const [selectedHackathonId, setSelectedHackathonId] = useState<string>('');
  const [registrations, setRegistrations] = useState<RegistrationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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

  const fetchRegistrations = async (hId: string) => {
    if (!hId) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/v1/hackathons/${hId}/registrations`);
      const json = await res.json();
      if (res.ok && json.data?.registrations) {
        setRegistrations(json.data.registrations);
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to fetch registrations' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedHackathonId) {
      fetchRegistrations(selectedHackathonId);
    }
  }, [selectedHackathonId]);

  const handleUpdateStatus = async (registrationId: string, newStatus: string) => {
    try {
      setMessage(null);
      const res = await fetch(`/api/v1/registrations/${registrationId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to update registration status');
      setMessage({ type: 'success', text: `Registration status updated to ${newStatus}` });
      fetchRegistrations(selectedHackathonId);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const filtered = registrations.filter((r) => {
    if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        r.user.fullName.toLowerCase().includes(q) ||
        r.user.email.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 select-none">
      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#E2E8F0] gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-bold text-[#2563EB] bg-[#EFF6FF] px-2.5 py-0.5 rounded-full border border-[#BFDBFE]">
              Participant Registry
            </span>
            <span className="text-[11px] font-semibold text-[#64748B]">
              {registrations.length} Total Enrolled
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#111827] mt-1 tracking-tight">
            Registration Management
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-0.5 font-normal">
            Inspect participant rosters, approve or reject applications, and verify check-in statuses.
          </p>
        </div>

        {/* Hackathon Selector */}
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

      {/* Notifications */}
      {message && (
        <div
          className={`p-4 rounded-[12px] text-xs font-medium flex items-center shadow-xs ${
            message.type === 'success'
              ? 'bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46]'
              : 'bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B]'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 mr-2 text-[#059669] flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 mr-2 text-[#DC2626] flex-shrink-0" />
          )}
          {message.text}
        </div>
      )}

      {/* Filter Row */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search participant name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-[38px] pl-10 pr-4 bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] rounded-[19px] text-xs text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/15"
          />
        </div>

        <div className="flex items-center space-x-2 overflow-x-auto w-full sm:w-auto">
          {['ALL', 'APPROVED', 'PENDING', 'REJECTED', 'WAITLISTED', 'CANCELLED'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`h-[34px] px-3 rounded-[17px] text-[12px] font-medium border transition-colors whitespace-nowrap ${
                statusFilter === s
                  ? 'bg-[#EFF6FF] text-[#2563EB] border-[#3B82F6] font-semibold'
                  : 'bg-white text-[#475569] border-[#E2E8F0] hover:bg-[#F8FAFC]'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Registrations Table */}
      <div className="bg-white border border-[#E2E8F0] rounded-[18px] overflow-hidden shadow-card">
        {loading ? (
          <div className="py-16 text-center text-xs text-[#64748B]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2563EB] mx-auto mb-2" />
            Loading registrations...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#94A3B8]">
            No registrations match your search or filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#F8FAFC] text-[#64748B] font-bold uppercase tracking-wider border-b border-[#E2E8F0]">
                  <th className="py-3 px-5">Participant</th>
                  <th className="py-3 px-5">Email</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5">Checked In</th>
                  <th className="py-3 px-5">Registered Date</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="py-3.5 px-5 font-bold text-[#111827]">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-7 h-7 rounded-full bg-[#EFF6FF] text-[#2563EB] font-bold text-[11px] flex items-center justify-center">
                          {r.user.fullName.charAt(0)}
                        </div>
                        <span>{r.user.fullName}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-5 text-[#475569]">{r.user.email}</td>
                    <td className="py-3.5 px-5">
                      <Badge
                        variant={
                          r.status === 'APPROVED'
                            ? 'emerald'
                            : r.status === 'PENDING'
                            ? 'amber'
                            : r.status === 'REJECTED'
                            ? 'rose'
                            : 'neutral'
                        }
                        size="sm"
                      >
                        {r.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-5">
                      {r.checkedIn ? (
                        <span className="inline-flex items-center text-[#059669] font-semibold text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Yes
                        </span>
                      ) : (
                        <span className="text-[#94A3B8] text-[11px]">No</span>
                      )}
                    </td>
                    <td className="py-3.5 px-5 text-[#64748B]">
                      {new Date(r.registeredAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-5 text-right space-x-1.5">
                      {r.status !== 'APPROVED' && (
                        <button
                          onClick={() => handleUpdateStatus(r.id, 'APPROVED')}
                          className="px-2.5 py-1 bg-[#ECFDF5] hover:bg-[#059669] text-[#059669] hover:text-white rounded-md text-[11px] font-semibold transition-colors"
                        >
                          Approve
                        </button>
                      )}
                      {r.status !== 'REJECTED' && (
                        <button
                          onClick={() => handleUpdateStatus(r.id, 'REJECTED')}
                          className="px-2.5 py-1 bg-[#FEF2F2] hover:bg-[#DC2626] text-[#DC2626] hover:text-white rounded-md text-[11px] font-semibold transition-colors"
                        >
                          Reject
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
