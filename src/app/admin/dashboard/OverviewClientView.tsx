'use client';

import React, { useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Activity,
  Users,
  Trophy,
  Search,
  ChevronDown,
  Pencil,
  Trash2,
  RefreshCw,
  X,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export interface UserDirectoryItem {
  id: string;
  fullName: string;
  email: string;
  role: 'ADMIN' | 'ORGANIZER' | 'JUDGE' | 'PARTICIPANT' | string;
  isActive: boolean;
  avatarUrl?: string | null;
  bio?: string | null;
  createdAt?: string | Date;
}

export interface OverviewMetrics {
  totalUsers: number;
  activeHackathons: number;
  totalTeams?: number;
  totalSubmissions?: number;
}

interface OverviewClientViewProps {
  initialMetrics: OverviewMetrics;
  initialUsers: UserDirectoryItem[];
}

export default function OverviewClientView({
  initialMetrics,
  initialUsers,
}: OverviewClientViewProps) {
  const router = useRouter();
  const [users, setUsers] = useState<UserDirectoryItem[]>(initialUsers);
  const [metrics, setMetrics] = useState<OverviewMetrics>(initialMetrics);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Delete Modal State
  const [deletingUser, setDeletingUser] = useState<UserDirectoryItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Feedback Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Re-fetch data from API
  const refreshData = useCallback(async () => {
    setRefreshing(true);
    try {
      const dashRes = await fetch('/api/v1/admin/dashboard');
      const dashJson = await dashRes.json();
      if (dashJson.success && dashJson.data?.metrics) {
        const m = dashJson.data.metrics;
        setMetrics({
          totalUsers: m.totalUsers,
          activeHackathons: m.activeHackathons,
          totalTeams: m.totalTeams,
          totalSubmissions: m.totalSubmissions,
        });
      }

      const usersRes = await fetch('/api/v1/admin/users?pageSize=50');
      const usersJson = await usersRes.json();
      if (usersJson.success && usersJson.data?.users) {
        setUsers(usersJson.data.users);
      }
      showToast('Live telemetry refreshed');
    } catch (err) {
      console.error('Failed to refresh overview data:', err);
    } finally {
      setRefreshing(false);
    }
  }, []);

  // When edit button is clicked, redirect to User Management page with user highlighted/opened
  const handleEditRedirect = (u: UserDirectoryItem) => {
    router.push(`/admin/users?edit=${u.id}`);
  };

  // Handle Delete User
  const handleOpenDelete = (u: UserDirectoryItem) => {
    setDeletingUser(u);
    setDeleteError(null);
  };

  const handleConfirmDelete = async () => {
    if (!deletingUser) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/v1/admin/users/${deletingUser.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setUsers((prev) => prev.filter((u) => u.id !== deletingUser.id));
        setMetrics((prev) => ({
          ...prev,
          totalUsers: Math.max(0, prev.totalUsers - 1),
        }));
        setDeletingUser(null);
        showToast('User removed from platform');
      } else {
        setDeleteError(data.error?.message || 'Failed to delete user');
      }
    } catch {
      setDeleteError('Network error while deleting user');
    } finally {
      setDeleting(false);
    }
  };

  // Filtered Users with memoization
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = u.fullName.toLowerCase().includes(q);
        const matchEmail = u.email.toLowerCase().includes(q);
        if (!matchName && !matchEmail) return false;
      }
      if (roleFilter && u.role !== roleFilter) return false;
      if (statusFilter === 'ACTIVE' && !u.isActive) return false;
      if (statusFilter === 'INACTIVE' && u.isActive) return false;
      return true;
    });
  }, [users, search, roleFilter, statusFilter]);

  // Avatar helper
  const renderAvatar = (u: UserDirectoryItem) => {
    if (u.avatarUrl === '😊' || u.fullName.toLowerCase().includes('kiruthik')) {
      return (
        <div className="w-9 h-9 rounded-full bg-[#fef08a] flex items-center justify-center text-lg select-none flex-shrink-0 shadow-xs border border-[#fde047]">
          😊
        </div>
      );
    }

    const firstLetter = u.fullName.charAt(0).toUpperCase() || 'U';
    const palettes = [
      'bg-[#8b5cf6] text-white', // Purple
      'bg-[#4f46e5] text-white', // Indigo
      'bg-[#0284c7] text-white', // Blue
      'bg-[#059669] text-white', // Emerald
      'bg-[#d97706] text-white', // Amber
      'bg-[#7c3aed] text-white', // Violet
    ];
    const charCodeSum = (u.fullName.charCodeAt(0) || 0) + (u.fullName.charCodeAt(1) || 0);
    const paletteClass = palettes[charCodeSum % palettes.length];

    return (
      <div
        className={`w-9 h-9 rounded-full ${paletteClass} flex items-center justify-center text-xs font-bold select-none flex-shrink-0 shadow-xs`}
      >
        {firstLetter}
      </div>
    );
  };

  // Role pill styling
  const renderRoleBadge = (role: string) => {
    switch (role) {
      case 'PARTICIPANT':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-[#eff6ff] text-[#1d4ed8] border border-[#bfdbfe]">
            Student
          </span>
        );
      case 'ORGANIZER':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-[#faf5ff] text-[#7c3aed] border border-[#e9d5ff]">
            Organizer
          </span>
        );
      case 'JUDGE':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-[#fffbeb] text-[#b45309] border border-[#fde68a]">
            Judge
          </span>
        );
      case 'ADMIN':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-[#fef2f2] text-[#b91c1c] border border-[#fecaca]">
            Admin
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-[#f8fafc] text-[#334155] border border-[#e2e8f0]">
            {role}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-[#0f172a] text-white px-4 py-2.5 rounded-xl shadow-xl text-xs font-medium flex items-center gap-2 border border-[#334155] animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-[#10b981]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Breadcrumb Bar */}
      <nav className="flex items-center space-x-2 text-xs text-[#64748b] font-medium">
        <Link href="/" className="hover:text-[#2563eb] transition-colors">
          Home
        </Link>
        <span>&rsaquo;</span>
        <Link href="/admin/dashboard" className="hover:text-[#2563eb] transition-colors">
          Admin
        </Link>
        <span>&rsaquo;</span>
        <span className="text-[#0f172a] font-semibold">Dashboard</span>
      </nav>

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#eff6ff] flex items-center justify-center text-[#2563eb] flex-shrink-0 mt-0.5 border border-[#dbeafe]">
            <Activity className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0f172a] tracking-tight">
              Overview
            </h1>
            <p className="text-xs text-[#64748b] mt-1 font-normal">
              Total Registered Users, Active Hackathons &amp; Member Directory
            </p>
          </div>
        </div>

        <button
          id="overview-refresh-btn"
          onClick={refreshData}
          disabled={refreshing}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-[#e2e8f0] rounded-xl text-xs font-semibold text-[#334155] hover:bg-[#f8fafc] hover:border-[#cbd5e1] shadow-xs transition-all self-start sm:self-center cursor-pointer disabled:opacity-50"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 text-[#2563eb] ${refreshing ? 'animate-spin' : ''}`}
          />
          <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </div>

      {/* Dynamic Metric Cards Grid (Circled Departments Card removed) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: TOTAL REGISTERED USERS */}
        <div className="bg-white rounded-2xl p-6 border border-[#e2e8f0] shadow-xs hover:border-[#cbd5e1] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#64748b]">
              TOTAL REGISTERED USERS
            </span>
            <div className="w-10 h-10 rounded-xl bg-[#eff6ff] flex items-center justify-center text-[#2563eb] border border-[#dbeafe]">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-4xl font-black text-[#0f172a] tracking-tight mt-4">
            {metrics.totalUsers.toLocaleString()}
          </div>
          <p className="text-[11px] text-[#64748b] mt-2 font-medium">
            Active verified member accounts across platform
          </p>
        </div>

        {/* Card 2: ACTIVE HACKATHONS */}
        <div className="bg-white rounded-2xl p-6 border border-[#e2e8f0] shadow-xs hover:border-[#cbd5e1] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#64748b]">
              ACTIVE HACKATHONS
            </span>
            <div className="w-10 h-10 rounded-xl bg-[#fffbeb] flex items-center justify-center text-[#d97706] border border-[#fef3c7]">
              <Trophy className="w-5 h-5" />
            </div>
          </div>
          <div className="text-4xl font-black text-[#0f172a] tracking-tight mt-4">
            {metrics.activeHackathons}
          </div>
          <p className="text-[11px] text-[#64748b] mt-2 font-medium">
            Live competitions, registration open &amp; judging rounds
          </p>
        </div>
      </div>

      {/* User Directory Container */}
      <div className="bg-white rounded-2xl p-6 border border-[#e2e8f0] shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-[#0f172a]">User Directory</h2>
            <p className="text-xs text-[#64748b] mt-0.5">
              Search and filter users by role or status.
            </p>
          </div>
          <div className="text-xs text-[#64748b] bg-[#f8fafc] px-3 py-1.5 rounded-full border border-[#e2e8f0] font-medium self-start sm:self-auto">
            Showing <span className="font-bold text-[#0f172a]">{filteredUsers.length}</span> of{' '}
            <span className="font-bold text-[#0f172a]">{users.length}</span> members
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
            <input
              type="text"
              placeholder="Search by name, email or register number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 text-xs bg-white border border-[#e2e8f0] rounded-xl focus:outline-none focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/10 transition-all placeholder:text-[#94a3b8] text-[#0f172a]"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#0f172a]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Roles Dropdown */}
            <div className="relative min-w-[140px] w-full sm:w-auto">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full appearance-none px-4 py-2.5 pr-8 text-xs font-medium text-[#334155] bg-white border border-[#e2e8f0] rounded-xl focus:outline-none focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/10 cursor-pointer"
              >
                <option value="">All Roles</option>
                <option value="PARTICIPANT">Student</option>
                <option value="ORGANIZER">Organizer</option>
                <option value="JUDGE">Judge</option>
                <option value="ADMIN">Admin</option>
              </select>
              <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-[#2563eb] pointer-events-none" />
            </div>

            {/* Status Dropdown */}
            <div className="relative min-w-[140px] w-full sm:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full appearance-none px-4 py-2.5 pr-8 text-xs font-medium text-[#334155] bg-white border border-[#e2e8f0] rounded-xl focus:outline-none focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/10 cursor-pointer"
              >
                <option value="">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
              <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-[#2563eb] pointer-events-none" />
            </div>
          </div>
        </div>

        {/* User Directory Table (NO DEPARTMENT COLUMN - User explicit instruction) */}
        <div className="overflow-x-auto rounded-xl border border-[#f1f5f9]">
          {filteredUsers.length === 0 ? (
            <div className="p-12 text-center text-xs text-[#94a3b8] bg-[#fafafa]">
              No members found matching current query or filters.
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#f8fafc] text-[#64748b] text-[11px] font-bold uppercase tracking-wider border-b border-[#e2e8f0]">
                  <th className="py-3.5 px-5">USER</th>
                  <th className="py-3.5 px-5">ROLE</th>
                  <th className="py-3.5 px-5">STATUS</th>
                  <th className="py-3.5 px-5 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f5f9]">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-[#f8fafc]/70 transition-colors">
                    {/* USER */}
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        {renderAvatar(user)}
                        <div>
                          <div className="font-bold text-[#0f172a] text-xs">
                            {user.fullName}
                          </div>
                          <div className="text-[11px] text-[#64748b] mt-0.5 font-mono">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* ROLE */}
                    <td className="py-3.5 px-5">{renderRoleBadge(user.role)}</td>

                    {/* STATUS */}
                    <td className="py-3.5 px-5">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          user.isActive
                            ? 'bg-[#ecfdf5] text-[#059669] border border-[#a7f3d0]'
                            : 'bg-[#f1f5f9] text-[#64748b] border border-[#e2e8f0]'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            user.isActive ? 'bg-[#10b981]' : 'bg-[#94a3b8]'
                          }`}
                        />
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>

                    {/* ACTIONS */}
                    <td className="py-3.5 px-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Edit redirects to user management page as requested */}
                        <button
                          id={`overview-edit-user-btn-${user.id}`}
                          onClick={() => handleEditRedirect(user)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#e2e8f0] rounded-lg text-xs font-semibold text-[#334155] hover:bg-[#f8fafc] hover:border-[#cbd5e1] hover:text-[#2563eb] transition-colors shadow-2xs cursor-pointer"
                          title="Edit user in User Management"
                        >
                          <Pencil className="w-3.5 h-3.5 text-[#64748b]" />
                          <span>Edit</span>
                        </button>
                        <button
                          id={`overview-delete-user-btn-${user.id}`}
                          onClick={() => handleOpenDelete(user)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#fef2f2] border border-[#fecaca] rounded-lg text-xs font-semibold text-[#dc2626] hover:bg-[#fee2e2] transition-colors shadow-2xs cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-[#dc2626]" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#fecaca] space-y-4 animate-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-[#dc2626]">Remove Member</h3>
            <p className="text-xs text-[#64748b] leading-relaxed">
              Are you sure you want to permanently remove{' '}
              <span className="font-bold text-[#0f172a]">{deletingUser.fullName}</span> (
              <span className="font-mono text-[#0f172a]">{deletingUser.email}</span>) from the
              platform?
            </p>

            {deleteError && (
              <div className="p-3 bg-[#fef2f2] border border-[#fecaca] rounded-xl text-xs text-[#dc2626] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingUser(null)}
                className="px-4 py-2 border border-[#e2e8f0] rounded-xl text-xs font-semibold text-[#64748b] hover:bg-[#f8fafc] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="px-4 py-2 bg-[#dc2626] text-white rounded-xl text-xs font-semibold hover:bg-[#b91c1c] transition-colors cursor-pointer shadow-xs"
              >
                {deleting ? 'Removing...' : 'Confirm Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
