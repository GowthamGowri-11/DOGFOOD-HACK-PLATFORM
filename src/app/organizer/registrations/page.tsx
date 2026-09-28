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
  Trophy,
  ChevronDown,
  RotateCcw,
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
      } else {
        setRegistrations([]);
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

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
  };

  const filtered = registrations.filter((r) => {
    if (statusFilter !== 'ALL' && r.status.toUpperCase() !== statusFilter.toUpperCase()) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        r.user.fullName.toLowerCase().includes(q) ||
        r.user.email.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const filterOptions = [
    { label: 'All', value: 'ALL', dotColor: null },
    { label: 'Approved', value: 'APPROVED', dotColor: 'bg-[#10B981]' },
    { label: 'Pending', value: 'PENDING', dotColor: 'bg-[#F59E0B]' },
    { label: 'Rejected', value: 'REJECTED', dotColor: 'bg-[#EF4444]' },
    { label: 'Waitlisted', value: 'WAITLISTED', dotColor: 'bg-[#2563EB]' },
    { label: 'Cancelled', value: 'CANCELLED', dotColor: 'bg-[#64748B]' },
  ];

  return (
    <div className="space-y-6 select-none max-w-[1400px] mx-auto pb-12 font-sans">
      {/* 1. HEADER & EVENT SELECTOR */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2">
        <div className="flex items-start space-x-3.5">
          {/* Orange Icon Square */}
          <div className="w-12 h-12 rounded-2xl bg-[#FFF7ED] border border-[#FED7AA] text-[#EA580C] flex items-center justify-center flex-shrink-0 shadow-xs">
            <Users className="w-6 h-6" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FFF7ED] text-[#EA580C] border border-[#FED7AA]">
                Participant Registry
              </span>
              <span className="text-xs font-semibold text-[#64748B]">
                {registrations.length} Total Enrolled
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
              Registration Management
            </h1>
            <p className="text-xs sm:text-sm text-[#64748B] font-normal max-w-xl">
              Inspect participant rosters, approve or reject applications, and verify check-in statuses.
            </p>
          </div>
        </div>

        {/* Right Side: Hackathon Selector Pill */}
        {hackathons.length > 0 && (
          <div className="relative self-start lg:self-center">
            <div className="flex items-center space-x-2.5 px-4 py-2 bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] rounded-2xl shadow-xs transition-colors">
              <div className="w-7 h-7 rounded-lg bg-[#FFF7ED] text-[#EA580C] flex items-center justify-center flex-shrink-0">
                <Trophy className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-[#64748B]">Hackathon</span>
              <select
                value={selectedHackathonId}
                onChange={(e) => setSelectedHackathonId(e.target.value)}
                className="appearance-none bg-transparent pr-6 text-xs sm:text-sm font-bold text-[#0F172A] focus:outline-none cursor-pointer"
              >
                {hackathons.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.title}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-[#64748B] absolute right-3 pointer-events-none" />
            </div>
          </div>
        )}
      </div>

      {/* Notifications */}
      {message && (
        <div
          className={`p-4 rounded-xl text-xs font-medium flex items-center shadow-xs ${
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

      {/* 2. SEARCH & FILTER CONTROLS ROW */}
      <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search participant name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-[42px] pl-10 pr-4 bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] rounded-full text-xs sm:text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#EA580C]/20 shadow-xs placeholder:text-[#94A3B8]"
          />
        </div>

        {/* Status Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0">
          {filterOptions.map((opt) => {
            const isActive = statusFilter === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setStatusFilter(opt.value)}
                className={`h-[38px] px-4 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 flex-shrink-0 shadow-xs border ${
                  isActive
                    ? 'bg-[#EA580C] text-white border-[#EA580C]'
                    : 'bg-white text-[#334155] border-[#E2E8F0] hover:bg-[#F8FAFC]'
                }`}
              >
                {opt.dotColor && (
                  <span className={`w-2 h-2 rounded-full ${opt.dotColor} ${isActive ? 'ring-2 ring-white/50' : ''}`} />
                )}
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. MAIN CARD: EMPTY STATE OR DATA TABLE */}
      <div className="bg-white border border-[#E2E8F0] rounded-[24px] p-8 shadow-xs min-h-[420px] flex flex-col justify-center">
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-orange-200 border-t-[#EA580C] rounded-full animate-spin mx-auto" />
            <p className="text-xs text-[#64748B] font-semibold">Loading participant registry...</p>
          </div>
        ) : filtered.length === 0 ? (
          /* Empty State matching uploaded screenshot */
          <div className="py-12 px-4 text-center max-w-md mx-auto space-y-4">
            {/* Custom Illustration */}
            <div className="relative w-36 h-28 mx-auto flex items-center justify-center">
              {/* Background soft cloud/blob */}
              <div className="absolute inset-0 bg-gradient-to-tr from-[#FFF7ED] via-[#FFEDD5] to-white rounded-full blur-sm opacity-80" />

              {/* Main Document Card */}
              <div className="relative w-20 h-24 bg-white border-2 border-[#FED7AA] rounded-xl shadow-md p-2 flex flex-col items-center justify-center space-y-1.5">
                <div className="w-8 h-8 rounded-full bg-[#FFF7ED] border border-[#FED7AA] text-[#EA580C] flex items-center justify-center font-bold text-xs">
                  <Users className="w-4 h-4" />
                </div>
                <div className="w-10 h-1.5 bg-[#FED7AA] rounded-full" />
                <div className="w-7 h-1 bg-[#FDBA74] rounded-full" />
              </div>

              {/* Paper Airplane */}
              <div className="absolute top-1 right-2 text-[#EA580C] animate-bounce">
                <svg viewBox="0 0 24 24" className="w-7 h-7 fill-[#EA580C] stroke-white stroke-1">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              </div>

              {/* Dotted path */}
              <div className="absolute top-6 right-8 w-12 h-6 border-t-2 border-dashed border-[#FED7AA] rounded-t-full rotate-12" />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-black text-[#0F172A] tracking-tight">
                No registrations found
              </h2>
              <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
                No registrations match your search or filter criteria. Try adjusting your filters or clear them to view all registrations.
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#EA580C] hover:bg-[#C2410C] active:bg-[#9A3412] text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-orange-500/20 transition-all"
              >
                <Filter className="w-4 h-4" />
                <span>Clear Filters</span>
              </button>
            </div>
          </div>
        ) : (
          /* Registrations Data Table */
          <div className="overflow-x-auto -mx-8 -my-8 p-8">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#F8FAFC] text-[#64748B] font-bold uppercase tracking-wider border-b border-[#E2E8F0] text-[11px]">
                  <th className="py-3.5 px-6">Participant</th>
                  <th className="py-3.5 px-6">Email Address</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6">Check-in Status</th>
                  <th className="py-3.5 px-6">Registered Date</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="py-4 px-6 font-bold text-[#0F172A]">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-[#FFF7ED] border border-[#FED7AA] text-[#EA580C] font-bold text-xs flex items-center justify-center flex-shrink-0">
                          {r.user.fullName.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-xs sm:text-sm">{r.user.fullName}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-[#475569] text-xs">{r.user.email}</td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          r.status.toUpperCase() === 'APPROVED'
                            ? 'bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]'
                            : r.status.toUpperCase() === 'PENDING'
                            ? 'bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]'
                            : r.status.toUpperCase() === 'REJECTED'
                            ? 'bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]'
                            : 'bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            r.status.toUpperCase() === 'APPROVED'
                              ? 'bg-[#10B981]'
                              : r.status.toUpperCase() === 'PENDING'
                              ? 'bg-[#F59E0B]'
                              : r.status.toUpperCase() === 'REJECTED'
                              ? 'bg-[#EF4444]'
                              : 'bg-[#2563EB]'
                          }`}
                        />
                        <span>{r.status}</span>
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      {r.checkedIn ? (
                        <span className="inline-flex items-center text-[#059669] font-bold text-xs">
                          <CheckCircle2 className="w-4 h-4 mr-1 text-[#059669]" /> Checked In
                        </span>
                      ) : (
                        <span className="text-[#94A3B8] text-xs font-medium">Pending Check-in</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-[#64748B] text-xs font-medium">
                      {new Date(r.registeredAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      {r.status.toUpperCase() !== 'APPROVED' && (
                        <button
                          onClick={() => handleUpdateStatus(r.id, 'APPROVED')}
                          className="px-3 py-1.5 bg-[#ECFDF5] hover:bg-[#059669] text-[#059669] hover:text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
                        >
                          Approve
                        </button>
                      )}
                      {r.status.toUpperCase() !== 'REJECTED' && (
                        <button
                          onClick={() => handleUpdateStatus(r.id, 'REJECTED')}
                          className="px-3 py-1.5 bg-[#FEF2F2] hover:bg-[#DC2626] text-[#DC2626] hover:text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
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
