'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  ArrowLeft,
  Mail,
  Calendar,
  ShieldCheck,
  Trophy,
  FolderKanban,
  FileCheck,
  Award,
  History,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface UserDetailData {
  id: string;
  email: string;
  fullName: string;
  role: string;
  status: string;
  avatarUrl?: string | null;
  bio?: string | null;
  createdAt: string;
  registrations: {
    id: string;
    hackathonId: string;
    hackathonTitle: string;
    hackathonSlug: string;
    hackathonStatus: string;
    status: string;
    registeredAt: string;
  }[];
  teams: {
    id: string;
    name: string;
    isLeader: boolean;
    hackathonTitle: string;
    project?: {
      id: string;
      title: string;
      slug: string;
    } | null;
  }[];
  certificates: {
    id: string;
    verificationCode: string;
    title: string;
    status: string;
    hackathonTitle: string;
    issuedAt: string;
  }[];
  recentActivity: {
    id: string;
    action: string;
    entityType: string;
    createdAt: string;
  }[];
}

export default function AdminUserDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const userId = params.id;
  const [user, setUser] = useState<UserDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadUser() {
      try {
        setLoading(true);
        const res = await fetch(`/api/v1/admin/users/${userId}`);
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.message || 'Failed to load user details');
        }
        setUser(json.data.user);
      } catch (err: any) {
        setError(err.message || 'Error loading user');
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, [userId]);

  return (
    <div className="space-y-6 select-none">
      {/* Breadcrumb Bar */}
      <div className="flex items-center space-x-2 text-xs pb-2 border-b border-[#E2E8F0]">
        <Link
          href="/admin/users"
          className="font-semibold text-[#64748B] hover:text-[#2563EB] flex items-center"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to Directory
        </Link>
        <span className="text-[#CBD5E1]">/</span>
        <span className="font-semibold text-[#111827]">{user?.fullName || 'User Inspection'}</span>
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs text-[#64748B]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2563EB] mx-auto mb-2" />
          Loading user records...
        </div>
      ) : error || !user ? (
        <div className="bg-white border border-[#E2E8F0] rounded-[18px] p-10 text-center space-y-3 shadow-card">
          <AlertCircle className="w-10 h-10 text-[#DC2626] mx-auto" />
          <h2 className="text-base font-bold text-[#111827]">User Not Found</h2>
          <p className="text-xs text-[#64748B]">{error || 'Requested user record does not exist.'}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* User Profile Card */}
          <div className="bg-white border border-[#E2E8F0] rounded-[18px] p-6 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#EFF6FF] to-[#DBEAFE] border border-[#BFDBFE] text-[#2563EB] font-black text-2xl flex items-center justify-center flex-shrink-0">
                {user.fullName.charAt(0)}
              </div>
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <h1 className="text-xl font-bold text-[#111827]">{user.fullName}</h1>
                  <Badge variant={user.role === 'ADMIN' ? 'rose' : user.role === 'ORGANIZER' ? 'amber' : user.role === 'JUDGE' ? 'blue' : 'neutral'} size="sm">
                    {user.role}
                  </Badge>
                  <Badge variant={user.status === 'ACTIVE' ? 'emerald' : 'rose'} size="sm">
                    {user.status}
                  </Badge>
                </div>
                <div className="text-xs text-[#64748B] flex items-center space-x-4">
                  <span className="flex items-center font-mono">
                    <Mail className="w-3.5 h-3.5 mr-1 text-[#94A3B8]" />
                    {user.email}
                  </span>
                  <span>•</span>
                  <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            <div className="text-right text-xs font-mono text-[#94A3B8]">
              ID: {user.id}
            </div>
          </div>

          {/* Associations Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Registered Events */}
            <div className="bg-white border border-[#E2E8F0] rounded-[18px] p-5 shadow-card space-y-3">
              <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
                <div className="flex items-center space-x-2">
                  <Trophy className="w-4 h-4 text-[#2563EB]" />
                  <h3 className="text-sm font-bold text-[#111827]">
                    Event Registrations ({user.registrations.length})
                  </h3>
                </div>
              </div>

              {user.registrations.length === 0 ? (
                <div className="py-6 text-center text-xs text-[#94A3B8]">
                  No hackathons registered.
                </div>
              ) : (
                <div className="space-y-2">
                  {user.registrations.map((r) => (
                    <div
                      key={r.id}
                      className="p-3 rounded-[11px] bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between text-xs"
                    >
                      <div>
                        <Link
                          href={`/hackathons/${r.hackathonSlug}`}
                          className="font-bold text-[#111827] hover:text-[#2563EB]"
                        >
                          {r.hackathonTitle}
                        </Link>
                        <div className="text-[10px] text-[#64748B]">
                          Registered on {new Date(r.registeredAt).toLocaleDateString()}
                        </div>
                      </div>
                      <Badge variant="blue" size="sm">
                        {r.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Teams & Projects */}
            <div className="bg-white border border-[#E2E8F0] rounded-[18px] p-5 shadow-card space-y-3">
              <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
                <div className="flex items-center space-x-2">
                  <FolderKanban className="w-4 h-4 text-[#2563EB]" />
                  <h3 className="text-sm font-bold text-[#111827]">
                    Teams & Projects ({user.teams.length})
                  </h3>
                </div>
              </div>

              {user.teams.length === 0 ? (
                <div className="py-6 text-center text-xs text-[#94A3B8]">
                  No team memberships recorded.
                </div>
              ) : (
                <div className="space-y-2">
                  {user.teams.map((t) => (
                    <div
                      key={t.id}
                      className="p-3 rounded-[11px] bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-[#111827]">{t.name}</span>
                        {t.isLeader && (
                          <span className="ml-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#EFF6FF] text-[#2563EB]">
                            Leader
                          </span>
                        )}
                        <div className="text-[10px] text-[#64748B] mt-0.5">
                          Event: {t.hackathonTitle}
                        </div>
                      </div>
                      {t.project ? (
                        <Link
                          href={`/projects/${t.project.id}`}
                          className="text-[11px] font-semibold text-[#2563EB] hover:underline"
                        >
                          View Project →
                        </Link>
                      ) : (
                        <span className="text-[10px] text-[#94A3B8]">No Project</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Issued Certificates */}
            <div className="bg-white border border-[#E2E8F0] rounded-[18px] p-5 shadow-card space-y-3">
              <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
                <div className="flex items-center space-x-2">
                  <Award className="w-4 h-4 text-[#059669]" />
                  <h3 className="text-sm font-bold text-[#111827]">
                    Certificates ({user.certificates.length})
                  </h3>
                </div>
              </div>

              {user.certificates.length === 0 ? (
                <div className="py-6 text-center text-xs text-[#94A3B8]">
                  No certificates issued for this user.
                </div>
              ) : (
                <div className="space-y-2">
                  {user.certificates.map((c) => (
                    <div
                      key={c.id}
                      className="p-3 rounded-[11px] bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-[#111827]">{c.title}</span>
                        <div className="font-mono text-[10px] text-[#2563EB]">
                          {c.verificationCode}
                        </div>
                      </div>
                      <Link
                        href={`/verify/${c.verificationCode}`}
                        className="text-[11px] font-semibold text-[#059669] hover:underline flex items-center"
                      >
                        Verify <ExternalLink className="w-3 h-3 ml-1" />
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Audit History */}
            <div className="bg-white border border-[#E2E8F0] rounded-[18px] p-5 shadow-card space-y-3">
              <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
                <div className="flex items-center space-x-2">
                  <History className="w-4 h-4 text-[#2563EB]" />
                  <h3 className="text-sm font-bold text-[#111827]">Recent Audit Trail</h3>
                </div>
              </div>

              {user.recentActivity.length === 0 ? (
                <div className="py-6 text-center text-xs text-[#94A3B8]">
                  No recent audit activity.
                </div>
              ) : (
                <div className="space-y-1.5 font-mono text-[11px]">
                  {user.recentActivity.map((a) => (
                    <div
                      key={a.id}
                      className="p-2 rounded-[8px] bg-[#F8FAFC] flex items-center justify-between text-[#475569]"
                    >
                      <span>{a.action}</span>
                      <span className="text-[10px] text-[#94A3B8]">
                        {new Date(a.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
