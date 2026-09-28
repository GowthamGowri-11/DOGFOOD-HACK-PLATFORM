'use client';

import React, { useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  BarChart3,
  Users,
  Trophy,
  ChevronRight,
  ChevronDown,
  Search,
  Pencil,
  Trash2,
  RefreshCw,
  X,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Sparkles,
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

  // Edit Modal State
  const [editingUser, setEditingUser] = useState<UserDirectoryItem | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState('PARTICIPANT');
  const [editIsActive, setEditIsActive] = useState(true);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

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

  // Re-fetch live telemetry from API
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
      showToast('Live telemetry refreshed successfully');
    } catch (err) {
      console.error('Failed to refresh overview data:', err);
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Open Edit User Modal
  const handleOpenEdit = (u: UserDirectoryItem) => {
    setEditingUser(u);
    setEditFullName(u.fullName);
    setEditEmail(u.email);
    setEditRole(u.role === 'Student' ? 'PARTICIPANT' : u.role);
    setEditIsActive(u.isActive);
    setEditError(null);
  };

  // Save Edit User
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setSavingEdit(true);
    setEditError(null);

    try {
      const res = await fetch(`/api/v1/admin/users/${editingUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: editFullName.trim(),
          email: editEmail.trim(),
          role: editRole,
          isActive: editIsActive,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === editingUser.id
              ? {
                  ...u,
                  fullName: editFullName.trim(),
                  email: editEmail.trim(),
                  role: editRole,
                  isActive: editIsActive,
                }
              : u
          )
        );
        showToast(`User "${editFullName.trim()}" updated successfully`);
        setEditingUser(null);
      } else {
        setEditError(data.error?.message || data.message || 'Failed to update user');
      }
    } catch (err: any) {
      setEditError(err.message || 'Network error updating user');
    } finally {
      setSavingEdit(false);
    }
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
        showToast(`User "${deletingUser.fullName}" removed from platform`);
        setDeletingUser(null);
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

  // Vibrant avatar color generator matching the reference screenshot
  const renderAvatar = (u: UserDirectoryItem, index: number) => {
    if (u.avatarUrl && u.avatarUrl.startsWith('http')) {
      return (
        <img
          src={u.avatarUrl}
          alt={u.fullName}
          className="w-9 h-9 rounded-full object-cover flex-shrink-0 shadow-xs ring-1 ring-black/5"
        />
      );
    }

    const firstLetter = u.fullName.trim().charAt(0).toUpperCase() || 'U';

    // Curated palette sequence matching the screenshot: Orange, Blue, Purple, Cyan, Emerald
    const PALETTES = [
      'bg-[#FA541C] text-white', // Orange (gowtham)
      'bg-[#2563EB] text-white', // Blue (Gowtham M)
      'bg-[#7C3AED] text-white', // Purple (Alice)
      'bg-[#0891B2] text-white', // Cyan (QA Teammate)
      'bg-[#059669] text-white', // Emerald (Charlie)
      'bg-[#D97706] text-white', // Amber
      'bg-[#E11D48] text-white', // Crimson
      'bg-[#4F46E5] text-white', // Indigo
    ];

    const paletteClass = PALETTES[index % PALETTES.length];

    return (
      <div
        className={`w-9 h-9 rounded-full ${paletteClass} flex items-center justify-center text-xs font-black select-none flex-shrink-0 shadow-xs transition-transform duration-200 group-hover:scale-105`}
      >
        {firstLetter}
      </div>
    );
  };

  // Role pill styling matching the reference screenshot
  const renderRoleBadge = (role: string) => {
    switch (role) {
      case 'PARTICIPANT':
      case 'Student':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-[11.5px] font-semibold bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
            Student
          </span>
        );
      case 'ORGANIZER':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-[11.5px] font-semibold bg-[#FFE8D6] text-[#FA541C] border border-[#FED7AA]">
            Organizer
          </span>
        );
      case 'JUDGE':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-[11.5px] font-semibold bg-[#FAF5FF] text-[#7C3AED] border border-[#E9D5FF]">
            Judge
          </span>
        );
      case 'ADMIN':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-[11.5px] font-semibold bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]">
            Admin
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-[11.5px] font-semibold bg-[#F8FAFC] text-[#475569] border border-[#E2E8F0]">
            {role}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-[1440px] mx-auto pb-12 select-none animate-in fade-in duration-300">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-[#18181B] text-white px-4 py-2.5 rounded-xl shadow-xl text-xs font-semibold flex items-center gap-2.5 border border-[#3F3F46] animate-in fade-in slide-in-from-top-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Breadcrumb Bar matching the exact screenshot */}
      <nav className="flex items-center space-x-2 text-xs text-[#64748B] font-medium pt-1">
        <Link href="/" className="hover:text-[#FA541C] transition-colors">
          Home
        </Link>
        <span className="text-[#9CA3AF]">&rsaquo;</span>
        <Link href="/admin/dashboard" className="hover:text-[#FA541C] transition-colors">
          Admin
        </Link>
        <span className="text-[#9CA3AF]">&rsaquo;</span>
        <span className="text-[#18181B] font-bold">Dashboard</span>
      </nav>

      {/* Top Header matching reference */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div className="flex items-start gap-3.5">
          {/* Rounded squircle with orange gradient & 3-bar chart icon */}
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FA541C] to-[#E03A00] flex items-center justify-center text-white flex-shrink-0 shadow-md shadow-[#FA541C]/25 mt-0.5">
            <BarChart3 className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <span className="block text-[11px] font-bold text-[#64748B] tracking-wider uppercase leading-tight">
              ADMIN DASHBOARD
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#111827] tracking-tight leading-tight mt-0.5">
              Overview
            </h1>
            <p className="text-xs sm:text-[13px] text-[#6B7280] font-normal mt-1">
              Total Registered Users, Active Hackathons &amp; Member Directory
            </p>
          </div>
        </div>

        {/* Refresh button with smooth rotate & hover effects */}
        <button
          id="overview-refresh-btn"
          onClick={refreshData}
          disabled={refreshing}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-[#E5E0D8] rounded-xl text-xs font-semibold text-[#18181B] hover:bg-[#FAF8F5] hover:border-[#D1D5DB] shadow-xs hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all self-start sm:self-center cursor-pointer disabled:opacity-50"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 text-[#4B5563] transition-transform duration-500 ${
              refreshing ? 'animate-spin text-[#FA541C]' : ''
            }`}
          />
          <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </div>

      {/* Dynamic 2 Big Metric Cards with Left Orange Accent & Watermark */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: TOTAL REGISTERED USERS */}
        <div
          onClick={() => {
            const el = document.getElementById('user-directory-container');
            el?.scrollIntoView({ behavior: 'smooth' });
          }}
          className="relative bg-white rounded-3xl p-6 sm:p-7 border border-[#E8E2D9] border-l-[5px] border-l-[#FA541C] shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group cursor-pointer overflow-hidden"
        >
          {/* Faint Users Silhouette Watermark on the bottom right */}
          <div className="absolute -right-3 -bottom-3 text-[#F2ECE4] pointer-events-none opacity-40 group-hover:opacity-70 group-hover:scale-105 transition-all duration-500">
            <Users className="w-32 h-32 stroke-[1.2]" />
          </div>

          <div className="relative z-10">
            {/* Top row: Circular peach badge + title + circular chevron button */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-[#FFE8D6] flex items-center justify-center text-[#FA541C] flex-shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                  <Users className="w-5 h-5 stroke-[2.2]" />
                </div>
                <span className="text-[11.5px] font-bold uppercase tracking-wider text-[#64748B]">
                  TOTAL REGISTERED USERS
                </span>
              </div>

              <div className="w-7 h-7 rounded-full bg-[#F4F1EB] group-hover:bg-[#FFE8D6] flex items-center justify-center text-[#9CA3AF] group-hover:text-[#FA541C] transition-all duration-200 group-hover:translate-x-0.5">
                <ChevronRight className="w-4 h-4 stroke-[2.5]" />
              </div>
            </div>

            {/* Metric Value */}
            <div className="text-4xl sm:text-5xl font-black text-[#111827] tracking-tight mt-5 leading-none">
              {metrics.totalUsers.toLocaleString()}
            </div>

            {/* Subtitle */}
            <p className="text-xs text-[#6B7280] font-normal mt-2.5">
              Active verified member accounts across platform
            </p>
          </div>
        </div>

        {/* Card 2: ACTIVE HACKATHONS */}
        <Link
          href="/admin/hackathons"
          className="relative bg-white rounded-3xl p-6 sm:p-7 border border-[#E8E2D9] border-l-[5px] border-l-[#FA541C] shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group cursor-pointer overflow-hidden block"
        >
          {/* Faint Trophy Silhouette Watermark on the bottom right */}
          <div className="absolute -right-3 -bottom-3 text-[#F2ECE4] pointer-events-none opacity-40 group-hover:opacity-70 group-hover:scale-105 transition-all duration-500">
            <Trophy className="w-32 h-32 stroke-[1.2]" />
          </div>

          <div className="relative z-10">
            {/* Top row: Circular peach/gold badge + title + circular chevron button */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-[#FFF0D4] flex items-center justify-center text-[#D97706] flex-shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                  <Trophy className="w-5 h-5 stroke-[2.2]" />
                </div>
                <span className="text-[11.5px] font-bold uppercase tracking-wider text-[#64748B]">
                  ACTIVE HACKATHONS
                </span>
              </div>

              <div className="w-7 h-7 rounded-full bg-[#F4F1EB] group-hover:bg-[#FFF0D4] flex items-center justify-center text-[#9CA3AF] group-hover:text-[#D97706] transition-all duration-200 group-hover:translate-x-0.5">
                <ChevronRight className="w-4 h-4 stroke-[2.5]" />
              </div>
            </div>

            {/* Metric Value */}
            <div className="text-4xl sm:text-5xl font-black text-[#111827] tracking-tight mt-5 leading-none">
              {metrics.activeHackathons}
            </div>

            {/* Subtitle */}
            <p className="text-xs text-[#6B7280] font-normal mt-2.5">
              Live competitions, registration open &amp; judging rounds
            </p>
          </div>
        </Link>
      </div>

      {/* User Directory Container matching screenshot */}
      <div
        id="user-directory-container"
        className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E5E0D8] shadow-xs hover:shadow-md transition-shadow space-y-6"
      >
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#FFE8D6] flex items-center justify-center text-[#FA541C] flex-shrink-0 shadow-2xs">
              <Users className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-[#111827] tracking-tight">
                User Directory
              </h2>
              <p className="text-xs text-[#6B7280] mt-0.5">
                Search and filter users by role or status.
              </p>
            </div>
          </div>

          <div className="text-xs text-[#4B5563] bg-[#F4F1EB] px-3.5 py-1.5 rounded-full border border-[#E5E0D8] font-semibold self-start sm:self-auto shadow-2xs">
            Showing <span className="text-[#111827] font-bold">{filteredUsers.length}</span> of{' '}
            <span className="text-[#111827] font-bold">{users.length}</span> members
          </div>
        </div>

        {/* Filter Controls Row matching screenshot */}
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          {/* Search bar with instant clear */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none" />
            <input
              type="text"
              placeholder="Search by name, email or register number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-11 pl-10 pr-9 text-xs bg-white border border-[#E5E0D8] rounded-xl focus:outline-none focus:border-[#FA541C] focus:ring-2 focus:ring-[#FA541C]/15 transition-all placeholder:text-[#9CA3AF] text-[#111827] shadow-2xs hover:border-[#D1D5DB]"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#111827] p-1 rounded-full hover:bg-[#F3F4F6] transition-colors"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Roles Dropdown */}
            <div className="relative min-w-[145px] w-full sm:w-auto">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full h-11 appearance-none px-4 pr-9 text-xs font-semibold text-[#374151] bg-white border border-[#E5E0D8] rounded-xl focus:outline-none focus:border-[#FA541C] focus:ring-2 focus:ring-[#FA541C]/15 cursor-pointer shadow-2xs hover:border-[#D1D5DB] transition-all"
              >
                <option value="">All Roles</option>
                <option value="PARTICIPANT">Student</option>
                <option value="ORGANIZER">Organizer</option>
                <option value="JUDGE">Judge</option>
                <option value="ADMIN">Admin</option>
              </select>
              <ChevronDown className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-[#FA541C] pointer-events-none" />
            </div>

            {/* Status Dropdown */}
            <div className="relative min-w-[145px] w-full sm:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full h-11 appearance-none px-4 pr-9 text-xs font-semibold text-[#374151] bg-white border border-[#E5E0D8] rounded-xl focus:outline-none focus:border-[#FA541C] focus:ring-2 focus:ring-[#FA541C]/15 cursor-pointer shadow-2xs hover:border-[#D1D5DB] transition-all"
              >
                <option value="">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
              <ChevronDown className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-[#FA541C] pointer-events-none" />
            </div>
          </div>
        </div>

        {/* User Directory Table matching reference screenshot */}
        <div className="overflow-x-auto rounded-2xl border border-[#ECE6DD]">
          {filteredUsers.length === 0 ? (
            <div className="p-12 text-center text-xs text-[#9CA3AF] bg-[#FAF8F5]">
              No members found matching current query or filters.
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#FAF8F5] text-[#6B7280] text-[11px] font-bold uppercase tracking-wider border-b border-[#ECE6DD]">
                  <th className="py-4 px-5">USER</th>
                  <th className="py-4 px-5 text-center">ROLE</th>
                  <th className="py-4 px-5 text-center">STATUS</th>
                  <th className="py-4 px-5 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1ECE4] bg-white">
                {filteredUsers.map((user, idx) => (
                  <tr
                    key={user.id}
                    className="hover:bg-[#FFFBF7] transition-colors duration-150 group"
                  >
                    {/* USER column */}
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3.5">
                        {renderAvatar(user, idx)}
                        <div>
                          <div className="font-bold text-[#111827] text-xs sm:text-[13px] group-hover:text-[#FA541C] transition-colors">
                            {user.fullName}
                          </div>
                          <div className="text-[11px] text-[#6B7280] mt-0.5 font-mono">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* ROLE column */}
                    <td className="py-3.5 px-5 text-center">
                      {renderRoleBadge(user.role)}
                    </td>

                    {/* STATUS column */}
                    <td className="py-3.5 px-5 text-center">
                      {user.isActive ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">
                          <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                          <span>Active</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#F3F4F6] text-[#6B7280] border border-[#E5E7EB]">
                          <span className="w-2 h-2 rounded-full bg-[#9CA3AF]" />
                          <span>Inactive</span>
                        </span>
                      )}
                    </td>

                    {/* ACTIONS column with Edit and Delete matching screenshot */}
                    <td className="py-3.5 px-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Edit Button */}
                        <button
                          id={`overview-edit-user-btn-${user.id}`}
                          onClick={() => handleOpenEdit(user)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E5E0D8] rounded-xl text-xs font-semibold text-[#374151] hover:bg-[#FAF8F5] hover:border-[#CBD5E1] hover:text-[#FA541C] hover:shadow-xs hover:scale-105 active:scale-95 transition-all shadow-2xs cursor-pointer"
                          title="Edit member details"
                        >
                          <Pencil className="w-3.5 h-3.5 text-[#6B7280] group-hover:text-[#FA541C]" />
                          <span>Edit</span>
                        </button>

                        {/* Delete Button */}
                        <button
                          id={`overview-delete-user-btn-${user.id}`}
                          onClick={() => handleOpenDelete(user)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FEF2F2] border border-[#FECACA] rounded-xl text-xs font-semibold text-[#DC2626] hover:bg-[#FEE2E2] hover:border-[#F87171] hover:shadow-xs hover:scale-105 active:scale-95 transition-all shadow-2xs cursor-pointer"
                          title="Delete member"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-[#DC2626]" />
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

      {/* ================= EDIT USER MODAL ================= */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-[#E5E0D8] space-y-5 animate-in zoom-in-95 duration-200 relative">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#F1ECE4]">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-[#FFE8D6] text-[#FA541C] flex items-center justify-center shadow-xs">
                  <Pencil className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#111827]">Edit Member Profile</h3>
                  <p className="text-xs text-[#6B7280]">Update user identity, role access, and status</p>
                </div>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="w-8 h-8 rounded-full bg-[#F4F1EB] hover:bg-[#E5E0D8] text-[#6B7280] flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Error Message */}
            {editError && (
              <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-xl text-xs text-[#DC2626] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#374151] mb-1.5">Full Name</label>
                <input
                  type="text"
                  required
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full h-11 px-3.5 bg-white border border-[#E5E0D8] rounded-xl text-xs text-[#111827] focus:outline-none focus:border-[#FA541C] focus:ring-2 focus:ring-[#FA541C]/15 transition-all"
                  placeholder="e.g. Alice Hacker"
                />
              </div>

              <div>
                <label className="block font-bold text-[#374151] mb-1.5">Email Address</label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full h-11 px-3.5 bg-white border border-[#E5E0D8] rounded-xl text-xs text-[#111827] focus:outline-none focus:border-[#FA541C] focus:ring-2 focus:ring-[#FA541C]/15 transition-all font-mono"
                  placeholder="alice@hackathon.dev"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-[#374151] mb-1.5">Role Permission</label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    className="w-full h-11 px-3.5 bg-white border border-[#E5E0D8] rounded-xl text-xs font-semibold text-[#111827] focus:outline-none focus:border-[#FA541C] focus:ring-2 focus:ring-[#FA541C]/15 transition-all cursor-pointer"
                  >
                    <option value="PARTICIPANT">Student (Participant)</option>
                    <option value="ORGANIZER">Organizer</option>
                    <option value="JUDGE">Judge</option>
                    <option value="ADMIN">Platform Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#374151] mb-1.5">Account Status</label>
                  <select
                    value={editIsActive ? 'ACTIVE' : 'INACTIVE'}
                    onChange={(e) => setEditIsActive(e.target.value === 'ACTIVE')}
                    className="w-full h-11 px-3.5 bg-white border border-[#E5E0D8] rounded-xl text-xs font-semibold text-[#111827] focus:outline-none focus:border-[#FA541C] focus:ring-2 focus:ring-[#FA541C]/15 transition-all cursor-pointer"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive (Suspended)</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[#F1ECE4]">
                <button
                  type="button"
                  onClick={() => {
                    router.push(`/admin/users?edit=${editingUser.id}`);
                  }}
                  className="text-[#64748B] hover:text-[#FA541C] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                >
                  <span>Open Full User Directory Profile</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setEditingUser(null)}
                    className="px-4 py-2.5 border border-[#E5E0D8] rounded-xl text-xs font-semibold text-[#64748B] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingEdit}
                    className="px-5 py-2.5 bg-gradient-to-r from-[#FA541C] to-[#E03A00] hover:from-[#FF6636] hover:to-[#D4380D] text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-[#FA541C]/25 hover:shadow-lg cursor-pointer disabled:opacity-50"
                  >
                    {savingEdit ? 'Saving Changes...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= DELETE CONFIRMATION MODAL ================= */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-[#FECACA] space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-[#FEF2F2] border border-[#FECACA] flex items-center justify-center text-[#DC2626]">
                <Trash2 className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#DC2626]">Remove Platform Member</h3>
                <p className="text-xs text-[#6B7280]">Permanent administrative action</p>
              </div>
            </div>

            <p className="text-xs text-[#4B5563] leading-relaxed">
              Are you sure you want to permanently remove{' '}
              <span className="font-bold text-[#111827]">{deletingUser.fullName}</span> (
              <span className="font-mono text-[#111827]">{deletingUser.email}</span>) from the
              platform database?
            </p>

            {deleteError && (
              <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-xl text-xs text-[#DC2626] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeletingUser(null)}
                className="px-4 py-2.5 border border-[#E5E0D8] rounded-xl text-xs font-semibold text-[#64748B] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="px-5 py-2.5 bg-[#DC2626] hover:bg-[#B91C1C] text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md shadow-[#DC2626]/25 disabled:opacity-50"
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
