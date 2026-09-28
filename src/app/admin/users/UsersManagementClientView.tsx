'use client';

import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Users,
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
  Clock,
  UserCheck,
  Calendar,
  Sparkles,
  ShieldCheck,
  Check,
  ExternalLink,
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
  const [timeFilter, setTimeFilter] = useState('ALL');

  // Checkbox selection state
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  // Inline role dropdown menu state for a specific row
  const [openRoleMenuId, setOpenRoleMenuId] = useState<string | null>(null);

  // Edit Modal State
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
  const [createStatus, setCreateStatus] = useState('ACTIVE');
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

  // Check URL edit parameter to automatically open Edit User modal when redirected
  useEffect(() => {
    if (editQueryId && users.length > 0) {
      const found = users.find((u) => u.id === editQueryId);
      if (found) {
        openEditModal(found);
      }
    }
  }, [editQueryId, users, openEditModal]);

  // Compute live 4 metrics dynamically from users array matching the screenshot
  const metrics = useMemo(() => {
    const total = users.length;
    const active = users.filter((u) => u.isActive).length;
    const inactive = users.filter((u) => !u.isActive).length;
    const elevated = users.filter((u) => u.role === 'ADMIN' || u.role === 'ORGANIZER').length;
    return { total, active, inactive, elevated };
  }, [users]);

  // REFRESH BUTTON: Live fetch
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch('/api/v1/admin/users?pageSize=100');
      const json = await res.json();
      if (json.success && Array.isArray(json.data?.users)) {
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
            isActive: u.isActive,
            avatarUrl: u.avatarUrl,
            phone: phone || u.phone,
            bio: u.bio,
            createdAt: u.createdAt,
          };
        });
        setUsers(mappedUsers);
        setTotalCount(json.data.totalCount || mappedUsers.length);
        router.refresh();
        showToast('User directory refreshed successfully');
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

  // Filtered Users with memoization and Time filter
  const filteredUsers = useMemo(() => {
    const now = Date.now();
    return users.filter((u) => {
      // Search
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = (u.fullName || '').toLowerCase().includes(q);
        const matchEmail = (u.email || '').toLowerCase().includes(q);
        const matchPhone = (u.phone || '').toLowerCase().includes(q);
        if (!matchName && !matchEmail && !matchPhone) return false;
      }
      // Role
      if (roleFilter && u.role !== roleFilter) return false;
      // Status
      if (statusFilter === 'ACTIVE' && !u.isActive) return false;
      if (statusFilter === 'INACTIVE' && u.isActive) return false;

      // Time Filter
      if (timeFilter !== 'ALL' && u.createdAt) {
        const createdMs = new Date(u.createdAt).getTime();
        const diffDays = (now - createdMs) / (1000 * 60 * 60 * 24);
        if (timeFilter === '7D' && diffDays > 7) return false;
        if (timeFilter === '30D' && diffDays > 30) return false;
        if (timeFilter === '90D' && diffDays > 90) return false;
        if (timeFilter === 'YEAR' && diffDays > 365) return false;
      }

      return true;
    });
  }, [users, search, roleFilter, statusFilter, timeFilter]);

  // EXPORT CSV BUTTON: Instant download matching screenshot
  const handleExportCSV = useCallback(async () => {
    setExporting(true);
    try {
      const exportList =
        selectedUserIds.length > 0
          ? users.filter((u) => selectedUserIds.includes(u.id))
          : filteredUsers.length > 0
          ? filteredUsers
          : users;

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
      console.error('Failed to export CSV locally:', e);
      window.location.href = '/api/v1/admin/users/export';
      showToast('Exporting users to CSV...');
    } finally {
      setExporting(false);
    }
  }, [selectedUserIds, filteredUsers, users]);

  // SAVE EDIT USER HANDLER
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
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
          email: editEmail.trim(),
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
                  email: editEmail.trim(),
                  role: editRole,
                  isActive: editStatus === 'ACTIVE',
                  phone: editPhone.trim(),
                  bio: editPhone.trim() ? `Phone: ${editPhone.trim()}` : null,
                }
              : u
          )
        );
        setEditingUser(null);
        showToast(`User "${editName.trim()}" updated successfully`);
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

  // INLINE ROLE QUICK CHANGE
  const handleInlineRoleChange = async (userId: string, newRole: string) => {
    setOpenRoleMenuId(null);
    try {
      const res = await fetch(`/api/v1/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (data.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
        );
        showToast(`Updated role to ${formatRoleLabel(newRole)}`);
      } else {
        showToast(data.error?.message || 'Failed to change role');
      }
    } catch {
      showToast('Error changing role');
    }
  };

  // INLINE STATUS TOGGLE
  const handleToggleStatus = async (u: UserManagementItem) => {
    const nextStatus = !u.isActive;
    try {
      const res = await fetch(`/api/v1/admin/users/${u.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: nextStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setUsers((prev) =>
          prev.map((user) => (user.id === u.id ? { ...user, isActive: nextStatus } : user))
        );
        showToast(`User marked as ${nextStatus ? 'Active' : 'Inactive'}`);
      } else {
        showToast(data.error?.message || 'Failed to update status');
      }
    } catch {
      showToast('Error updating status');
    }
  };

  // CREATE USER BUTTON: Submit Create User Modal
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
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
          isActive: createStatus === 'ACTIVE',
          phone: createPhone.trim(),
        }),
      });
      const data = await res.json();
      if (data.success && data.data?.user) {
        const newUser: UserManagementItem = {
          id: data.data.user.id,
          fullName: data.data.user.fullName || createName.trim(),
          email: data.data.user.email || createEmail.trim(),
          role: data.data.user.role || createRole,
          isActive: createStatus === 'ACTIVE',
          phone: createPhone.trim() || null,
          bio: createPhone.trim() ? `Phone: ${createPhone.trim()}` : null,
          createdAt: data.data.user.createdAt || new Date().toISOString(),
        };
        setUsers((prev) => [newUser, ...prev]);
        setTotalCount((c) => c + 1);
        setShowCreateModal(false);
        setCreateName('');
        setCreateEmail('');
        setCreatePassword('');
        setCreateRole('PARTICIPANT');
        setCreatePhone('');
        showToast(`User "${newUser.fullName}" created successfully!`);
      } else {
        setCreateError(data.error?.message || data.message || 'Failed to create user');
      }
    } catch (err: any) {
      setCreateError(err.message || 'Network error while creating user');
    } finally {
      setSavingCreate(false);
    }
  };

  // DELETE USER CONFIRMATION
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
        showToast(`User "${deletingUser.fullName}" permanently removed`);
        setDeletingUser(null);
        if (editQueryId === deletingUser.id) {
          router.replace('/admin/users');
        }
      } else {
        setDeleteError(data.error?.message || data.message || 'Failed to delete user');
      }
    } catch (err: any) {
      setDeleteError(err.message || 'Network error while deleting user');
    } finally {
      setDeleting(false);
    }
  };

  // Checkbox Selection Helpers
  const isAllSelected =
    filteredUsers.length > 0 &&
    filteredUsers.every((u) => selectedUserIds.includes(u.id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(filteredUsers.map((u) => u.id));
    }
  };

  const toggleSelectUser = (id: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // Avatar sequence matching screenshot
  const renderAvatar = (u: UserManagementItem, index: number) => {
    if (u.avatarUrl && u.avatarUrl.startsWith('http')) {
      return (
        <img
          src={u.avatarUrl}
          alt={u.fullName}
          className="w-9 h-9 rounded-full object-cover flex-shrink-0 shadow-xs ring-1 ring-black/5"
        />
      );
    }

    const firstLetter = (u.fullName || 'U').trim().charAt(0).toUpperCase() || 'U';

    const PALETTES = [
      'bg-[#FA541C] text-white', // Orange (gowtham)
      'bg-[#2563EB] text-white', // Blue (Gowtham M)
      'bg-[#7C3AED] text-white', // Purple (Alice)
      'bg-[#0891B2] text-white', // Cyan (QA Teammate)
      'bg-[#059669] text-white', // Emerald (Charlie)
      'bg-[#7C3AED] text-white', // Violet (Organizer Gamma)
      'bg-[#D97706] text-white', // Amber
      'bg-[#E11D48] text-white', // Crimson
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

  // Format Joined Date & Time matching screenshot: e.g. "Aug 20, 2026" / "10:24 AM"
  const formatJoined = (dateVal?: string | Date) => {
    if (!dateVal) return { date: 'Aug 20, 2026', time: '10:24 AM' };
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return { date: 'Aug 20, 2026', time: '10:24 AM' };
      const date = d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      const time = d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
      return { date, time };
    } catch {
      return { date: 'Aug 20, 2026', time: '10:24 AM' };
    }
  };

  return (
    <div className="space-y-6 max-w-[1440px] mx-auto pb-12 select-none animate-in fade-in duration-300">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          id="admin-toast-message"
          className="fixed top-5 right-5 z-50 bg-[#18181B] text-white px-4 py-2.5 rounded-xl shadow-xl text-xs font-semibold flex items-center gap-2.5 border border-[#3F3F46] animate-in fade-in slide-in-from-top-3 duration-200"
        >
          <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Breadcrumb Bar matching screenshot: Home > Admin > Users */}
      <nav className="flex items-center space-x-2 text-xs text-[#64748B] font-medium pt-1">
        <Link href="/" className="hover:text-[#FA541C] transition-colors">
          Home
        </Link>
        <span className="text-[#9CA3AF]">&rsaquo;</span>
        <Link href="/admin/dashboard" className="hover:text-[#FA541C] transition-colors">
          Admin
        </Link>
        <span className="text-[#9CA3AF]">&rsaquo;</span>
        <span className="text-[#18181B] font-bold">Users</span>
      </nav>

      {/* Top Header matching screenshot */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div className="flex items-start gap-3.5">
          {/* Rounded peach squircle with users icon */}
          <div className="w-12 h-12 rounded-2xl bg-[#FFE8D6] flex items-center justify-center text-[#FA541C] flex-shrink-0 shadow-xs mt-0.5">
            <Users className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <span className="block text-[11px] font-bold text-[#64748B] tracking-wider uppercase leading-tight">
              USER MANAGEMENT
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#111827] tracking-tight leading-tight mt-0.5">
              User Management
            </h1>
            <p className="text-xs sm:text-[13px] text-[#6B7280] font-normal mt-1">
              Create, update, and manage platform users, roles, and account status.
            </p>
          </div>
        </div>

        {/* 3 Action Buttons: Export CSV, Refresh, + Create User */}
        <div className="flex items-center gap-2.5 self-start sm:self-center flex-wrap">
          {/* Export CSV Button */}
          <button
            type="button"
            id="admin-export-csv-btn"
            onClick={handleExportCSV}
            disabled={exporting}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-[#E5E0D8] rounded-xl text-xs font-semibold text-[#18181B] hover:bg-[#FAF8F5] hover:border-[#D1D5DB] shadow-xs hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            title="Download CSV report"
          >
            <Download className="w-3.5 h-3.5 text-[#64748B]" />
            <span>{exporting ? 'Exporting...' : 'Export CSV'}</span>
          </button>

          {/* Refresh Button */}
          <button
            type="button"
            id="admin-refresh-btn"
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-[#E5E0D8] rounded-xl text-xs font-semibold text-[#18181B] hover:bg-[#FAF8F5] hover:border-[#D1D5DB] shadow-xs hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            title="Refresh users list"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-[#4B5563] transition-transform duration-500 ${
                refreshing ? 'animate-spin text-[#FA541C]' : ''
              }`}
            />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>

          {/* + Create User Button */}
          <button
            type="button"
            id="admin-create-user-btn"
            onClick={() => {
              setShowCreateModal(true);
              setCreateError(null);
            }}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-[#FA541C] to-[#E03A00] hover:from-[#FF6636] hover:to-[#D4380D] text-white rounded-xl text-xs font-bold shadow-md shadow-[#FA541C]/25 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.8]" />
            <span>Create User</span>
          </button>
        </div>
      </div>

      {/* ================= 4 METRICS CARDS ROW (Exact match to screenshot) ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Card 1: Total Users (with left orange accent stripe) */}
        <div
          onClick={() => {
            setRoleFilter('');
            setStatusFilter('');
          }}
          className="bg-white rounded-2xl p-5 border border-[#E8E2D9] border-l-[4px] border-l-[#FA541C] shadow-xs hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group cursor-pointer"
        >
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-full bg-[#FFE8D6] flex items-center justify-center text-[#FA541C] flex-shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
              <Users className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="text-2xl font-black text-[#111827] tracking-tight leading-none">
                {metrics.total}
              </div>
              <div className="text-xs font-bold text-[#111827] mt-1">Total Users</div>
              <div className="text-[11px] text-[#6B7280]">Registered on platform</div>
            </div>
          </div>
        </div>

        {/* Card 2: Active Users */}
        <div
          onClick={() => setStatusFilter('ACTIVE')}
          className="bg-white rounded-2xl p-5 border border-[#E8E2D9] shadow-xs hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group cursor-pointer"
        >
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-full bg-[#ECFDF5] flex items-center justify-center text-[#059669] flex-shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
              <span className="w-3 h-3 rounded-full bg-[#10B981] animate-pulse" />
            </div>
            <div>
              <div className="text-2xl font-black text-[#111827] tracking-tight leading-none">
                {metrics.active}
              </div>
              <div className="text-xs font-bold text-[#111827] mt-1">Active Users</div>
              <div className="text-[11px] text-[#6B7280]">Currently active</div>
            </div>
          </div>
        </div>

        {/* Card 3: Inactive Users */}
        <div
          onClick={() => setStatusFilter('INACTIVE')}
          className="bg-white rounded-2xl p-5 border border-[#E8E2D9] shadow-xs hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group cursor-pointer"
        >
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-full bg-[#FFFBEB] flex items-center justify-center text-[#D97706] flex-shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
              <Clock className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="text-2xl font-black text-[#111827] tracking-tight leading-none">
                {metrics.inactive}
              </div>
              <div className="text-xs font-bold text-[#111827] mt-1">Inactive Users</div>
              <div className="text-[11px] text-[#6B7280]">Not yet activated</div>
            </div>
          </div>
        </div>

        {/* Card 4: Admins & Organizers */}
        <div
          onClick={() => setRoleFilter('ORGANIZER')}
          className="bg-white rounded-2xl p-5 border border-[#E8E2D9] shadow-xs hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group cursor-pointer"
        >
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-full bg-[#EFF6FF] flex items-center justify-center text-[#2563EB] flex-shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
              <UserCheck className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="text-2xl font-black text-[#111827] tracking-tight leading-none">
                {metrics.elevated}
              </div>
              <div className="text-xs font-bold text-[#111827] mt-1">Admins &amp; Organizers</div>
              <div className="text-[11px] text-[#6B7280]">With elevated permissions</div>
            </div>
          </div>
        </div>
      </div>

      {/* ================= USER DIRECTORY CONTAINER ================= */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E5E0D8] shadow-xs hover:shadow-md transition-shadow space-y-6">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-[#111827] tracking-tight">
              User Directory
            </h2>
            <p className="text-xs text-[#6B7280] mt-0.5">
              Search and filter users by role or status.
            </p>
          </div>

          <div className="text-xs text-[#4B5563] bg-[#F4F1EB] px-3.5 py-1.5 rounded-full border border-[#E5E0D8] font-semibold self-start sm:self-auto shadow-2xs">
            Showing <span className="text-[#111827] font-bold">{filteredUsers.length}</span> of{' '}
            <span className="text-[#111827] font-bold">{totalCount}</span> members
          </div>
        </div>

        {/* Filter Controls Row: Search + All Roles + All Statuses + All Time */}
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          {/* Search bar with instant clear */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none" />
            <input
              type="text"
              id="admin-search-users-input"
              placeholder="Search by name, email or mobile..."
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

          <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
            {/* Roles Dropdown */}
            <div className="relative min-w-[140px] w-full sm:w-auto">
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
            <div className="relative min-w-[140px] w-full sm:w-auto">
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

            {/* Time Filter Dropdown (All Time) */}
            <div className="relative min-w-[140px] w-full sm:w-auto">
              <div className="relative flex items-center">
                <Calendar className="w-3.5 h-3.5 absolute left-3 text-[#6B7280] pointer-events-none" />
                <select
                  value={timeFilter}
                  onChange={(e) => setTimeFilter(e.target.value)}
                  className="w-full h-11 appearance-none pl-8 pr-9 text-xs font-semibold text-[#374151] bg-white border border-[#E5E0D8] rounded-xl focus:outline-none focus:border-[#FA541C] focus:ring-2 focus:ring-[#FA541C]/15 cursor-pointer shadow-2xs hover:border-[#D1D5DB] transition-all"
                >
                  <option value="ALL">All Time</option>
                  <option value="7D">Last 7 Days</option>
                  <option value="30D">Last 30 Days</option>
                  <option value="90D">Last 90 Days</option>
                  <option value="YEAR">This Year</option>
                </select>
                <ChevronDown className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-[#6B7280] pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Bulk Action Bar (when rows are selected) */}
        {selectedUserIds.length > 0 && (
          <div className="bg-[#FFF5ED] border border-[#FED7AA] rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in duration-200">
            <div className="flex items-center space-x-2 text-xs font-bold text-[#FA541C]">
              <span className="w-2 h-2 rounded-full bg-[#FA541C] animate-pulse" />
              <span>{selectedUserIds.length} members selected</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportCSV}
                className="px-3 py-1.5 bg-white border border-[#FED7AA] hover:bg-[#FFE8D6] text-[#FA541C] rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
              >
                Export Selected
              </button>
              <button
                type="button"
                onClick={() => setSelectedUserIds([])}
                className="px-3 py-1.5 bg-white border border-[#E5E0D8] hover:bg-[#F4F1EB] text-[#4B5563] rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                Deselect
              </button>
            </div>
          </div>
        )}

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
                  <th className="py-4 px-4 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={toggleSelectAll}
                      className="rounded border-[#D1D5DB] text-[#FA541C] focus:ring-[#FA541C] cursor-pointer"
                    />
                  </th>
                  <th className="py-4 px-5">USER</th>
                  <th className="py-4 px-5 text-center">ROLE</th>
                  <th className="py-4 px-5 text-center">STATUS</th>
                  <th className="py-4 px-5">JOINED</th>
                  <th className="py-4 px-5 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1ECE4] bg-white">
                {filteredUsers.map((user, idx) => {
                  const joined = formatJoined(user.createdAt);
                  const isSelected = selectedUserIds.includes(user.id);
                  const isRoleMenuOpen = openRoleMenuId === user.id;

                  return (
                    <tr
                      key={user.id}
                      className={`hover:bg-[#FFFBF7] transition-colors duration-150 group ${
                        isSelected ? 'bg-[#FFF9F5]' : ''
                      }`}
                    >
                      {/* Checkbox column */}
                      <td className="py-3.5 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectUser(user.id)}
                          className="rounded border-[#D1D5DB] text-[#FA541C] focus:ring-[#FA541C] cursor-pointer"
                        />
                      </td>

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

                      {/* ROLE column (interactive dropdown pill) */}
                      <td className="py-3.5 px-5 text-center relative">
                        <div className="inline-block relative">
                          <button
                            type="button"
                            onClick={() =>
                              setOpenRoleMenuId(isRoleMenuOpen ? null : user.id)
                            }
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition-all hover:scale-105 active:scale-95 ${
                              user.role === 'PARTICIPANT' || user.role === 'Student'
                                ? 'bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] hover:bg-[#DBEAFE]'
                                : user.role === 'ORGANIZER'
                                ? 'bg-[#FAF5FF] text-[#7C3AED] border border-[#E9D5FF] hover:bg-[#F3E8FF]'
                                : user.role === 'JUDGE'
                                ? 'bg-[#FFFBEB] text-[#D97706] border border-[#FED7AA] hover:bg-[#FEF3C7]'
                                : 'bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA] hover:bg-[#FEE2E2]'
                            }`}
                            title="Click to change role"
                          >
                            <span>{formatRoleLabel(user.role)}</span>
                            <ChevronDown className="w-3 h-3 stroke-[2.5]" />
                          </button>

                          {/* Quick Role Switcher Dropdown */}
                          {isRoleMenuOpen && (
                            <>
                              <div
                                className="fixed inset-0 z-30"
                                onClick={() => setOpenRoleMenuId(null)}
                              />
                              <div className="absolute left-1/2 -translate-x-1/2 mt-1.5 w-36 bg-white rounded-2xl shadow-xl border border-[#E5E0D8] py-1.5 z-40 animate-in fade-in zoom-in-95 duration-100 text-left">
                                <span className="text-[10px] font-bold text-[#9CA3AF] uppercase px-3 py-1 block">
                                  Select Role
                                </span>
                                {[
                                  { role: 'PARTICIPANT', label: 'Student' },
                                  { role: 'ORGANIZER', label: 'Organizer' },
                                  { role: 'JUDGE', label: 'Judge' },
                                  { role: 'ADMIN', label: 'Admin' },
                                ].map((item) => (
                                  <button
                                    key={item.role}
                                    type="button"
                                    onClick={() => handleInlineRoleChange(user.id, item.role)}
                                    className={`w-full px-3 py-1.5 text-xs text-left font-semibold flex items-center justify-between hover:bg-[#FFF5ED] hover:text-[#FA541C] transition-colors cursor-pointer ${
                                      user.role === item.role ? 'text-[#FA541C]' : 'text-[#374151]'
                                    }`}
                                  >
                                    <span>{item.label}</span>
                                    {user.role === item.role && (
                                      <Check className="w-3.5 h-3.5 text-[#FA541C]" />
                                    )}
                                  </button>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      </td>

                      {/* STATUS column (interactive status toggle) */}
                      <td className="py-3.5 px-5 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(user)}
                          className="cursor-pointer transition-transform hover:scale-105 active:scale-95"
                          title="Click to toggle account status"
                        >
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
                        </button>
                      </td>

                      {/* JOINED column (Date and Time stack) */}
                      <td className="py-3.5 px-5">
                        <div className="font-semibold text-[#111827] text-xs">
                          {joined.date}
                        </div>
                        <div className="text-[11px] text-[#6B7280] mt-0.5">
                          {joined.time}
                        </div>
                      </td>

                      {/* ACTIONS column with Edit and Delete */}
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Edit Button */}
                          <button
                            type="button"
                            id={`admin-edit-user-btn-${user.id}`}
                            onClick={() => openEditModal(user)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E5E0D8] rounded-xl text-xs font-semibold text-[#374151] hover:bg-[#FAF8F5] hover:border-[#CBD5E1] hover:text-[#FA541C] hover:shadow-xs hover:scale-105 active:scale-95 transition-all shadow-2xs cursor-pointer"
                            title="Edit member details"
                          >
                            <Pencil className="w-3.5 h-3.5 text-[#6B7280] group-hover:text-[#FA541C]" />
                            <span>Edit</span>
                          </button>

                          {/* Delete Button */}
                          <button
                            type="button"
                            id={`admin-delete-user-btn-${user.id}`}
                            onClick={() => {
                              setDeletingUser(user);
                              setDeleteError(null);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FEF2F2] border border-[#FECACA] rounded-xl text-xs font-semibold text-[#DC2626] hover:bg-[#FEE2E2] hover:border-[#F87171] hover:shadow-xs hover:scale-105 active:scale-95 transition-all shadow-2xs cursor-pointer"
                            title="Delete member"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-[#DC2626]" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ================= CREATE USER MODAL ================= */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-[#E5E0D8] space-y-5 animate-in zoom-in-95 duration-200 relative">
            <div className="flex items-center justify-between pb-3 border-b border-[#F1ECE4]">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-[#FFE8D6] text-[#FA541C] flex items-center justify-center shadow-xs">
                  <Plus className="w-5 h-5 stroke-[2.8]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#111827]">Create Platform Member</h3>
                  <p className="text-xs text-[#6B7280]">Provision credentials, role scope, and system access</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="w-8 h-8 rounded-full bg-[#F4F1EB] hover:bg-[#E5E0D8] text-[#6B7280] flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {createError && (
              <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-xl text-xs text-[#DC2626] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#374151] mb-1.5">Full Name *</label>
                <input
                  type="text"
                  required
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  className="w-full h-11 px-3.5 bg-white border border-[#E5E0D8] rounded-xl text-xs text-[#111827] focus:outline-none focus:border-[#FA541C] focus:ring-2 focus:ring-[#FA541C]/15 transition-all"
                  placeholder="e.g. Gowtham M"
                />
              </div>

              <div>
                <label className="block font-bold text-[#374151] mb-1.5">Email Address *</label>
                <input
                  type="email"
                  required
                  value={createEmail}
                  onChange={(e) => setCreateEmail(e.target.value)}
                  className="w-full h-11 px-3.5 bg-white border border-[#E5E0D8] rounded-xl text-xs text-[#111827] focus:outline-none focus:border-[#FA541C] focus:ring-2 focus:ring-[#FA541C]/15 transition-all font-mono"
                  placeholder="gowtham@hackathon.dev"
                />
              </div>

              <div>
                <label className="block font-bold text-[#374151] mb-1.5">Password *</label>
                <input
                  type="password"
                  required
                  value={createPassword}
                  onChange={(e) => setCreatePassword(e.target.value)}
                  className="w-full h-11 px-3.5 bg-white border border-[#E5E0D8] rounded-xl text-xs text-[#111827] focus:outline-none focus:border-[#FA541C] focus:ring-2 focus:ring-[#FA541C]/15 transition-all font-mono"
                  placeholder="Min. 8 characters"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-[#374151] mb-1.5">Role Permission</label>
                  <select
                    value={createRole}
                    onChange={(e) => setCreateRole(e.target.value)}
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
                    value={createStatus}
                    onChange={(e) => setCreateStatus(e.target.value)}
                    className="w-full h-11 px-3.5 bg-white border border-[#E5E0D8] rounded-xl text-xs font-semibold text-[#111827] focus:outline-none focus:border-[#FA541C] focus:ring-2 focus:ring-[#FA541C]/15 transition-all cursor-pointer"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive (Suspended)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#374151] mb-1.5">Phone / Mobile (Optional)</label>
                <input
                  type="text"
                  value={createPhone}
                  onChange={(e) => setCreatePhone(e.target.value)}
                  className="w-full h-11 px-3.5 bg-white border border-[#E5E0D8] rounded-xl text-xs text-[#111827] focus:outline-none focus:border-[#FA541C] focus:ring-2 focus:ring-[#FA541C]/15 transition-all"
                  placeholder="+1 (555) 000-0000"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-[#F1ECE4]">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 border border-[#E5E0D8] rounded-xl text-xs font-semibold text-[#64748B] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCreate}
                  className="px-5 py-2.5 bg-gradient-to-r from-[#FA541C] to-[#E03A00] hover:from-[#FF6636] hover:to-[#D4380D] text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-[#FA541C]/25 hover:shadow-lg cursor-pointer disabled:opacity-50"
                >
                  {savingCreate ? 'Creating User...' : '+ Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= EDIT USER MODAL ================= */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-[#E5E0D8] space-y-5 animate-in zoom-in-95 duration-200 relative">
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
                type="button"
                onClick={() => setEditingUser(null)}
                className="w-8 h-8 rounded-full bg-[#F4F1EB] hover:bg-[#E5E0D8] text-[#6B7280] flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {editError && (
              <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-xl text-xs text-[#DC2626] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#374151] mb-1.5">Full Name *</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full h-11 px-3.5 bg-white border border-[#E5E0D8] rounded-xl text-xs text-[#111827] focus:outline-none focus:border-[#FA541C] focus:ring-2 focus:ring-[#FA541C]/15 transition-all"
                  placeholder="Full Name"
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
                  placeholder="email@hackathon.dev"
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
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full h-11 px-3.5 bg-white border border-[#E5E0D8] rounded-xl text-xs font-semibold text-[#111827] focus:outline-none focus:border-[#FA541C] focus:ring-2 focus:ring-[#FA541C]/15 transition-all cursor-pointer"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive (Suspended)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#374151] mb-1.5">Phone / Mobile</label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full h-11 px-3.5 bg-white border border-[#E5E0D8] rounded-xl text-xs text-[#111827] focus:outline-none focus:border-[#FA541C] focus:ring-2 focus:ring-[#FA541C]/15 transition-all"
                  placeholder="+1 (555) 000-0000"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-[#F1ECE4]">
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
            </form>
          </div>
        </div>
      )}

      {/* ================= DELETE USER CONFIRMATION MODAL ================= */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
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

export default function UsersManagementClientView(props: UsersManagementClientViewProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-[400px] flex items-center justify-center">
          <RefreshCw className="w-6 h-6 text-[#FA541C] animate-spin" />
        </div>
      }
    >
      <UsersManagementContent {...props} />
    </Suspense>
  );
}
