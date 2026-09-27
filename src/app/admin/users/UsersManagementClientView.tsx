'use client';

import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Search,
  ChevronDown,
  Pencil,
  Trash2,
  RefreshCw,
  Download,
  Plus,
  X,
  CheckCircle2,
  AlertCircle,
  UserCheck,
  UserPlus,
} from 'lucide-react';

export interface UserManagementItem {
  id: string;
  fullName: string;
  email: string;
  role: 'ADMIN' | 'ORGANIZER' | 'JUDGE' | 'PARTICIPANT' | string;
  isActive: boolean;
  avatarUrl?: string | null;
  phone?: string | null;
  bio?: string | null;
  createdAt?: string | Date;
}

interface UsersManagementClientViewProps {
  initialUsers: UserManagementItem[];
  totalCount: number;
}

function UsersManagementContent({
  initialUsers,
  totalCount: initialTotal,
}: UsersManagementClientViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editQueryId = searchParams.get('edit');

  const [users, setUsers] = useState<UserManagementItem[]>(initialUsers);
  const [totalCount, setTotalCount] = useState(initialTotal);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Edit Modal State (Matching Image 4)
  const [editingUser, setEditingUser] = useState<UserManagementItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState('PARTICIPANT');
  const [editStatus, setEditStatus] = useState('ACTIVE');
  const [editPhone, setEditPhone] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Create User Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [createRole, setCreateRole] = useState('PARTICIPANT');
  const [createPhone, setCreatePhone] = useState('');
  const [savingCreate, setSavingCreate] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Delete Modal State
  const [deletingUser, setDeletingUser] = useState<UserManagementItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Helper to open Edit Modal for a user
  const openEditModal = useCallback((u: UserManagementItem) => {
    setEditingUser(u);
    setEditName(u.fullName);
    setEditEmail(u.email);
    setEditRole(u.role === 'Student' ? 'PARTICIPANT' : u.role);
    setEditStatus(u.isActive ? 'ACTIVE' : 'INACTIVE');
    setEditPhone(u.phone || '');
    setEditError(null);
  }, []);

  // Check URL edit parameter to automatically open Edit User modal when redirected from overview
  useEffect(() => {
    if (!editQueryId) return;
    const match = users.find((u) => u.id === editQueryId);
    if (match) {
      openEditModal(match);
    } else {
      // If not yet in local state, fetch user directly from API
      fetch(`/api/v1/admin/users/${editQueryId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data?.user) {
            const u = data.data.user;
            let phone: string | null = null;
            if (u.bio && u.bio.startsWith('Phone:')) {
              phone = u.bio.replace('Phone:', '').trim();
            }
            openEditModal({
              id: u.id,
              fullName: u.fullName,
              email: u.email,
              role: u.role,
              isActive: u.status === 'ACTIVE' || u.isActive,
              phone: phone || u.phone,
              bio: u.bio,
            });
          }
        })
        .catch((e) => console.error('Failed to fetch edit target user:', e));
    }
  }, [editQueryId, users, openEditModal]);

  // 1. REFRESH BUTTON: Re-fetch users from API with live feedback
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch('/api/v1/admin/users?pageSize=100');
      const json = await res.json();
      if (json.success && json.data?.users) {
        const mappedUsers: UserManagementItem[] = json.data.users.map((u: any) => {
          let phone: string | null = null;
          if (u.bio && u.bio.startsWith('Phone:')) {
            phone = u.bio.replace('Phone:', '').trim();
          }
          return {
            id: u.id,
            fullName: u.fullName,
            email: u.email,
            role: u.role,
            isActive: u.isActive !== undefined ? u.isActive : u.status === 'ACTIVE',
            avatarUrl: u.avatarUrl,
            phone: phone || u.phone,
            bio: u.bio,
            createdAt: u.createdAt,
          };
        });
        setUsers(mappedUsers);
        setTotalCount(json.data.totalCount || mappedUsers.length);
        router.refresh();
        showToast('User directory refreshed');
      } else {
        showToast('Refreshed user directory');
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
      showToast('Failed to refresh users');
    } finally {
      setRefreshing(false);
    }
  }, [router]);

  // Filtered Users with memoization
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = (u.fullName || '').toLowerCase().includes(q);
        const matchEmail = (u.email || '').toLowerCase().includes(q);
        const matchPhone = (u.phone || '').toLowerCase().includes(q);
        if (!matchName && !matchEmail && !matchPhone) return false;
      }
      if (roleFilter && u.role !== roleFilter) return false;
      if (statusFilter === 'ACTIVE' && !u.isActive) return false;
      if (statusFilter === 'INACTIVE' && u.isActive) return false;
      return true;
    });
  }, [users, search, roleFilter, statusFilter]);

  // 2. EXPORT CSV BUTTON: Robust CSV generation & automatic browser download
  const handleExportCSV = useCallback(async () => {
    setExporting(true);
    try {
      const exportList = filteredUsers.length > 0 ? filteredUsers : users;
      const headers = ['ID', 'Full Name', 'Email', 'Role', 'Status', 'Phone', 'Created At'];
      const dataRows = exportList.map((u) =>
        [
          `"${u.id}"`,
          `"${(u.fullName || '').replace(/"/g, '""')}"`,
          `"${(u.email || '').replace(/"/g, '""')}"`,
          `"${formatRoleLabel(u.role)}"`,
          `"${u.isActive ? 'Active' : 'Inactive'}"`,
          `"${(u.phone || '').replace(/"/g, '""')}"`,
          `"${u.createdAt ? new Date(u.createdAt).toISOString() : ''}"`,
        ].join(',')
      );

      const csvContent = [headers.join(','), ...dataRows].join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `atlyx_users_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      showToast(`Exported ${exportList.length} users to CSV`);
    } catch (e) {
      console.error('Failed to export CSV locally, falling back to server route:', e);
      // Fallback to server route
      window.location.href = '/api/v1/admin/users/export';
      showToast('Exporting users to CSV...');
    } finally {
      setExporting(false);
    }
  }, [filteredUsers, users]);

  // 3. EDIT USER BUTTON: Save Edit Handler
  const handleSaveEdit = async () => {
    if (!editingUser) return;
    if (!editName.trim()) {
      setEditError('Name cannot be empty');
      return;
    }
    setSavingEdit(true);
    setEditError(null);
    try {
      const res = await fetch(`/api/v1/admin/users/${editingUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: editName.trim(),
          role: editRole,
          isActive: editStatus === 'ACTIVE',
          bio: editPhone.trim() ? `Phone: ${editPhone.trim()}` : null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === editingUser.id
              ? {
                  ...u,
                  fullName: editName.trim(),
                  role: editRole,
                  isActive: editStatus === 'ACTIVE',
                  phone: editPhone.trim(),
                  bio: editPhone.trim() ? `Phone: ${editPhone.trim()}` : null,
                }
              : u
          )
        );
        setEditingUser(null);
        showToast('User details updated successfully');
        if (editQueryId) {
          router.replace('/admin/users');
        }
      } else {
        setEditError(data.error?.message || data.message || 'Failed to update user');
      }
    } catch (err: any) {
      setEditError(err.message || 'Network error while saving user');
    } finally {
      setSavingEdit(false);
    }
  };

  // 4. CREATE USER BUTTON: Submit Create User Modal
  const handleCreateUser = async () => {
    if (!createName.trim() || !createEmail.trim() || !createPassword.trim()) {
      setCreateError('Full name, email, and password are required');
      return;
    }
    if (createPassword.length < 8) {
      setCreateError('Password must be at least 8 characters');
      return;
    }
    setSavingCreate(true);
    setCreateError(null);
    try {
      const res = await fetch('/api/v1/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: createName.trim(),
          email: createEmail.trim(),
          password: createPassword,
          role: createRole,
          phone: createPhone.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        const created = data.data?.user || data.data || {};
        const newUser: UserManagementItem = {
          id: created.id || `usr_${Date.now()}`,
          fullName: createName.trim(),
          email: createEmail.trim(),
          role: createRole,
          isActive: true,
          phone: createPhone.trim(),
          createdAt: new Date().toISOString(),
        };
        setUsers((prev) => [newUser, ...prev]);
        setTotalCount((c) => c + 1);
        setShowCreateModal(false);
        setCreateName('');
        setCreateEmail('');
        setCreatePassword('');
        setCreatePhone('');
        showToast(`Created new platform user: ${newUser.fullName}`);
      } else {
        setCreateError(data.error?.message || data.message || 'Failed to create user');
      }
    } catch (err: any) {
      setCreateError(err.message || 'Network error while creating user');
    } finally {
      setSavingCreate(false);
    }
  };

  // Delete User Handler
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
        setTotalCount((c) => Math.max(0, c - 1));
        setDeletingUser(null);
        showToast('User removed from platform');
      } else {
        setDeleteError(data.error?.message || data.message || 'Failed to delete user');
      }
    } catch (err: any) {
      setDeleteError(err.message || 'Network error while deleting user');
    } finally {
      setDeleting(false);
    }
  };

  // Avatar helper
  const renderAvatar = (u: UserManagementItem) => {
    if (u.avatarUrl === '😊' || (u.fullName && u.fullName.toLowerCase().includes('kiruthik'))) {
      return (
        <div className="w-9 h-9 rounded-full bg-[#fef08a] flex items-center justify-center text-lg select-none flex-shrink-0 shadow-xs border border-[#fde047]">
          😊
        </div>
      );
    }

    const firstLetter = (u.fullName || 'U').charAt(0).toUpperCase() || 'U';
    const palettes = [
      'bg-[#8b5cf6] text-white', // Purple
      'bg-[#4f46e5] text-white', // Indigo
      'bg-[#0284c7] text-white', // Blue
      'bg-[#059669] text-white', // Emerald
      'bg-[#d97706] text-white', // Amber
      'bg-[#7c3aed] text-white', // Violet
    ];
    const nameStr = u.fullName || 'User';
    const charCodeSum = (nameStr.charCodeAt(0) || 0) + (nameStr.charCodeAt(1) || 0);
    const paletteClass = palettes[charCodeSum % palettes.length];

    return (
      <div
        className={`w-9 h-9 rounded-full ${paletteClass} flex items-center justify-center text-xs font-bold select-none flex-shrink-0 shadow-xs`}
      >
        {firstLetter}
      </div>
    );
  };

  // Role display label
  function formatRoleLabel(role: string) {
    switch (role) {
      case 'PARTICIPANT':
        return 'Student';
      case 'ORGANIZER':
        return 'Organizer';
      case 'JUDGE':
        return 'Judge';
      case 'ADMIN':
        return 'Admin';
      default:
        return role;
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 select-none">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          id="admin-toast-message"
          className="fixed top-5 right-5 z-50 bg-[#0f172a] text-white px-4 py-2.5 rounded-xl shadow-xl text-xs font-medium flex items-center gap-2 border border-[#334155] animate-in fade-in slide-in-from-top-4 duration-200"
        >
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
        <span className="text-[#0f172a] font-semibold">User Management</span>
      </nav>

      {/* Top Header Matching Image 3 with Project UI/UX */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#eff6ff] flex items-center justify-center text-[#2563eb] flex-shrink-0 mt-0.5 border border-[#dbeafe]">
            <ShieldCheck className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0f172a] tracking-tight">
              User Management
            </h1>
            <p className="text-xs text-[#64748b] mt-1 font-normal">
              Create, update, and manage platform users, roles, and account status.
            </p>
          </div>
        </div>

        {/* 3 Working Action Buttons: Export CSV, Refresh, + Create User */}
        <div className="flex items-center gap-2.5 self-start sm:self-center flex-wrap">
          {/* Export CSV Button */}
          <button
            type="button"
            id="admin-export-csv-btn"
            onClick={handleExportCSV}
            disabled={exporting}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-[#e2e8f0] rounded-xl text-xs font-semibold text-[#334155] hover:bg-[#f8fafc] hover:border-[#cbd5e1] hover:text-[#2563eb] shadow-xs transition-all cursor-pointer disabled:opacity-50"
            title="Download CSV report"
          >
            <Download className="w-3.5 h-3.5 text-[#64748b]" />
            <span>{exporting ? 'Exporting...' : 'Export CSV'}</span>
          </button>

          {/* Refresh Button */}
          <button
            type="button"
            id="admin-refresh-btn"
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-[#e2e8f0] rounded-xl text-xs font-semibold text-[#334155] hover:bg-[#f8fafc] hover:border-[#cbd5e1] hover:text-[#2563eb] shadow-xs transition-all cursor-pointer disabled:opacity-50"
            title="Refresh users list"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-[#2563eb] ${refreshing ? 'animate-spin' : ''}`}
            />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>

          {/* Create User Button */}
          <button
            type="button"
            id="admin-create-user-btn"
            onClick={() => {
              setShowCreateModal(true);
              setCreateError(null);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Create User</span>
          </button>
        </div>
      </div>

      {/* Main Container Matching Image 3: User Directory */}
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
            <span className="font-bold text-[#0f172a]">{totalCount}</span> members
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
            <input
              type="text"
              id="admin-search-users-input"
              placeholder="Search by name, email or mobile..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 text-xs bg-white border border-[#e2e8f0] rounded-xl focus:outline-none focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/10 transition-all placeholder:text-[#94a3b8] text-[#0f172a]"
            />
            {search && (
              <button
                type="button"
                id="admin-clear-search-btn"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#0f172a] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Roles Dropdown */}
            <div className="relative min-w-[140px] w-full sm:w-auto">
              <select
                id="admin-filter-role-select"
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
                id="admin-filter-status-select"
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

        {/* Table: USER, ROLE, STATUS, ACTIONS (NO DEPARTMENT - per user instruction) */}
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
                          {user.phone && (
                            <div className="text-[10px] text-[#94a3b8] mt-0.5">
                              📞 {user.phone}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* ROLE (Interactive role pill matching Image 3 style) */}
                    <td className="py-3.5 px-5">
                      <button
                        type="button"
                        id={`role-pill-btn-${user.id}`}
                        onClick={() => openEditModal(user)}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#eff6ff] text-[#1d4ed8] border border-[#bfdbfe] hover:bg-[#dbeafe] transition-colors cursor-pointer"
                        title="Click to edit role"
                      >
                        <span>{formatRoleLabel(user.role)}</span>
                        <ChevronDown className="w-3 h-3 text-[#1d4ed8]" />
                      </button>
                    </td>

                    {/* STATUS (Pill with active indicator dot matching Image 3 style) */}
                    <td className="py-3.5 px-5">
                      <button
                        type="button"
                        id={`status-pill-btn-${user.id}`}
                        onClick={() => openEditModal(user)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                          user.isActive
                            ? 'bg-[#ecfdf5] text-[#059669] border border-[#a7f3d0] hover:bg-[#d1fae5]'
                            : 'bg-[#f1f5f9] text-[#64748b] border border-[#e2e8f0] hover:bg-[#e2e8f0]'
                        }`}
                        title="Click to edit status"
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            user.isActive ? 'bg-[#10b981]' : 'bg-[#94a3b8]'
                          }`}
                        />
                        <span>{user.isActive ? 'Active' : 'Inactive'}</span>
                        <ChevronDown className="w-3 h-3 text-current opacity-70" />
                      </button>
                    </td>

                    {/* ACTIONS */}
                    <td className="py-3.5 px-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Edit opens Image 4 Modal */}
                        <button
                          type="button"
                          id={`edit-user-btn-${user.id}`}
                          onClick={() => openEditModal(user)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#e2e8f0] rounded-lg text-xs font-semibold text-[#334155] hover:bg-[#f8fafc] hover:border-[#cbd5e1] hover:text-[#2563eb] transition-colors shadow-2xs cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5 text-[#64748b]" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          id={`delete-user-btn-${user.id}`}
                          onClick={() => {
                            setDeletingUser(user);
                            setDeleteError(null);
                          }}
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

      {/* Edit User Modal (EXACTLY LIKE IMAGE 4, WITHOUT DEPARTMENT) */}
      {editingUser && (
        <div
          id="admin-edit-user-modal"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150"
        >
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#e2e8f0] space-y-4 animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-[#f1f5f9]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#eff6ff] flex items-center justify-center text-[#2563eb] border border-[#dbeafe]">
                  <UserCheck className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#0f172a]">Edit User</h3>
                  <p className="text-xs text-[#64748b] mt-0.5">
                    Update profile details, role assignment, and account status.
                  </p>
                </div>
              </div>
              <button
                type="button"
                id="admin-edit-modal-close-icon"
                onClick={() => {
                  setEditingUser(null);
                  if (editQueryId) router.replace('/admin/users');
                }}
                className="text-[#94a3b8] hover:text-[#0f172a] p-1.5 rounded-lg hover:bg-[#f1f5f9] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form Fields */}
            <div className="space-y-4 text-xs pt-1">
              {/* Field 1: Name */}
              <div className="space-y-1.5">
                <label className="font-bold text-[#334155] text-xs">Name</label>
                <input
                  type="text"
                  id="admin-edit-name-input"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#e2e8f0] rounded-xl text-xs text-[#0f172a] focus:outline-none focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/10 transition-all font-medium"
                />
              </div>

              {/* Field 2: Email */}
              <div className="space-y-1.5">
                <label className="font-bold text-[#334155] text-xs">Email</label>
                <input
                  type="text"
                  id="admin-edit-email-input"
                  disabled
                  value={editEmail}
                  className="w-full px-3.5 py-2.5 bg-[#f8fafc] text-[#64748b] border border-[#e2e8f0] rounded-xl font-mono text-xs cursor-not-allowed select-all"
                />
              </div>

              {/* Field 3: Two Columns Row - Role & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-[#334155] text-xs">Role</label>
                  <div className="relative">
                    <select
                      id="admin-edit-role-select"
                      value={editRole}
                      onChange={(e) => setEditRole(e.target.value)}
                      className="w-full appearance-none px-3.5 py-2.5 pr-8 bg-white border border-[#e2e8f0] rounded-xl text-xs font-semibold text-[#0f172a] focus:outline-none focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/10 cursor-pointer"
                    >
                      <option value="PARTICIPANT">Student</option>
                      <option value="ORGANIZER">Organizer</option>
                      <option value="JUDGE">Judge</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                    <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-[#2563eb] pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-[#334155] text-xs">Status</label>
                  <div className="relative">
                    <select
                      id="admin-edit-status-select"
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                      className="w-full appearance-none px-3.5 py-2.5 pr-8 bg-white border border-[#e2e8f0] rounded-xl text-xs font-semibold text-[#0f172a] focus:outline-none focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/10 cursor-pointer"
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="INACTIVE">Inactive</option>
                    </select>
                    <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-[#2563eb] pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* (NO DEPARTMENT FIELD - per user explicit instruction) */}

              {/* Field 4: Phone (optional) */}
              <div className="space-y-1.5">
                <label className="font-bold text-[#334155] text-xs">Phone (optional)</label>
                <input
                  type="text"
                  id="admin-edit-phone-input"
                  placeholder="Mobile number"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#e2e8f0] rounded-xl text-xs text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/10 transition-all"
                />
              </div>

              {editError && (
                <div className="p-3 bg-[#fef2f2] border border-[#fecaca] rounded-xl text-xs text-[#dc2626] flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{editError}</span>
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#f1f5f9]">
              <button
                type="button"
                id="admin-edit-cancel-btn"
                onClick={() => {
                  setEditingUser(null);
                  if (editQueryId) router.replace('/admin/users');
                }}
                className="px-4 py-2.5 border border-[#e2e8f0] rounded-xl text-xs font-semibold text-[#64748b] hover:bg-[#f8fafc] hover:border-[#cbd5e1] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                id="admin-edit-submit-btn"
                onClick={handleSaveEdit}
                disabled={savingEdit}
                className="px-5 py-2.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {savingEdit ? 'Saving Changes...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateModal && (
        <div
          id="admin-create-user-modal"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150"
        >
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#e2e8f0] space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between pb-3 border-b border-[#f1f5f9]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#eff6ff] flex items-center justify-center text-[#2563eb] border border-[#dbeafe]">
                  <UserPlus className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#0f172a]">Create Platform User</h3>
                  <p className="text-xs text-[#64748b] mt-0.5">
                    Register a new student, organizer, judge, or administrator.
                  </p>
                </div>
              </div>
              <button
                type="button"
                id="admin-create-modal-close-icon"
                onClick={() => setShowCreateModal(false)}
                className="text-[#94a3b8] hover:text-[#0f172a] p-1.5 rounded-lg hover:bg-[#f1f5f9] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs pt-1">
              <div className="space-y-1.5">
                <label className="font-bold text-[#334155] text-xs">Full Name *</label>
                <input
                  type="text"
                  id="admin-create-name-input"
                  placeholder="e.g. Sreya Biju"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#e2e8f0] rounded-xl text-xs text-[#0f172a] focus:outline-none focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/10 transition-all font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-[#334155] text-xs">Email Address *</label>
                <input
                  type="email"
                  id="admin-create-email-input"
                  placeholder="e.g. sreyabiju2029@mca.ajce.in"
                  value={createEmail}
                  onChange={(e) => setCreateEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#e2e8f0] rounded-xl text-xs text-[#0f172a] focus:outline-none focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/10 transition-all font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-[#334155] text-xs">Temporary Password *</label>
                <input
                  type="password"
                  id="admin-create-password-input"
                  placeholder="Minimum 8 characters"
                  value={createPassword}
                  onChange={(e) => setCreatePassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#e2e8f0] rounded-xl text-xs text-[#0f172a] focus:outline-none focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/10 transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-[#334155] text-xs">Role</label>
                  <div className="relative">
                    <select
                      id="admin-create-role-select"
                      value={createRole}
                      onChange={(e) => setCreateRole(e.target.value)}
                      className="w-full appearance-none px-3.5 py-2.5 pr-8 bg-white border border-[#e2e8f0] rounded-xl text-xs font-semibold text-[#0f172a] focus:outline-none focus:border-[#2563eb] cursor-pointer"
                    >
                      <option value="PARTICIPANT">Student</option>
                      <option value="ORGANIZER">Organizer</option>
                      <option value="JUDGE">Judge</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                    <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-[#2563eb] pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-[#334155] text-xs">Phone (optional)</label>
                  <input
                    type="text"
                    id="admin-create-phone-input"
                    placeholder="Mobile number"
                    value={createPhone}
                    onChange={(e) => setCreatePhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-[#e2e8f0] rounded-xl text-xs text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:border-[#2563eb]"
                  />
                </div>
              </div>

              {createError && (
                <div className="p-3 bg-[#fef2f2] border border-[#fecaca] rounded-xl text-xs text-[#dc2626] flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{createError}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#f1f5f9]">
              <button
                type="button"
                id="admin-create-cancel-btn"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2.5 border border-[#e2e8f0] rounded-xl text-xs font-semibold text-[#64748b] hover:bg-[#f8fafc] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                id="admin-create-submit-btn"
                onClick={handleCreateUser}
                disabled={savingCreate}
                className="px-5 py-2.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
              >
                {savingCreate ? 'Creating User...' : 'Create User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Modal */}
      {deletingUser && (
        <div
          id="admin-delete-user-modal"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150"
        >
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
                id="admin-delete-cancel-btn"
                onClick={() => setDeletingUser(null)}
                className="px-4 py-2 border border-[#e2e8f0] rounded-xl text-xs font-semibold text-[#64748b] hover:bg-[#f8fafc] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                id="admin-delete-confirm-btn"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="px-4 py-2 bg-[#dc2626] text-white rounded-xl text-xs font-semibold hover:bg-[#b91c1c] transition-colors cursor-pointer shadow-xs disabled:opacity-50"
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

export default function UsersManagementClientView(props: UsersManagementClientViewProps) {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs text-[#64748b]">Loading user management...</div>}>
      <UsersManagementContent {...props} />
    </Suspense>
  );
}
