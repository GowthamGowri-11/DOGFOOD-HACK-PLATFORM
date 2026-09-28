'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { Bell, Check, ExternalLink, X, Clock, Sparkles, AlertCircle, KeyRound, CheckCheck } from 'lucide-react';
import { useWebSocket } from '@/hooks/useWebSocket';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  linkUrl?: string | null;
  type?: string | null;
  isRead: boolean;
  createdAt: string;
}

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { subscribe } = useWebSocket();

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/v1/notifications?limit=20');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.data.notifications || []);
        setUnreadCount(data.data.unreadCount || 0);
      }
    } catch {
      // Ignore network errors in notification center
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Realtime notification listeners
  useEffect(() => {
    const unsub = subscribe('NOTIFICATION_CREATED', (evt) => {
      setNotifications((prev) => [evt.data?.payload, ...prev.slice(0, 19)]);
      setUnreadCount((c) => c + 1);
    });

    const unsubApprove = subscribe('MARK_EDIT_APPROVED', () => {
      loadNotifications();
    });

    const unsubReject = subscribe('MARK_EDIT_REJECTED', () => {
      loadNotifications();
    });

    return () => {
      unsub();
      unsubApprove();
      unsubReject();
    };
  }, [subscribe, loadNotifications]);

  // Handle outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch(`/api/v1/notifications/${id}/read`, { method: 'POST' });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // Ignore
    }
  };

  const markAllRead = async () => {
    try {
      await fetch('/api/v1/notifications/mark-all-read', { method: 'POST' });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // Ignore
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] rounded-xl transition-colors focus:outline-none"
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-[#DC2626] text-white text-[10px] font-extrabold rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-[#CBD5E1] rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95">
          {/* Header */}
          <div className="p-3.5 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#2563EB]" />
              <h3 className="text-xs font-bold text-[#0F172A]">Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-[10px] font-bold bg-[#EFF6FF] text-[#2563EB] rounded-full border border-[#BFDBFE]">
                  {unreadCount} unread
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-[11px] font-bold text-[#2563EB] hover:text-[#1D4ED8] flex items-center gap-1"
              >
                <CheckCheck className="w-3.5 h-3.5" /> Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-[#E2E8F0]">
            {loading ? (
              <div className="py-8 text-center text-xs text-[#64748B]">Loading notifications...</div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#64748B] space-y-1">
                <Bell className="w-6 h-6 text-[#94A3B8] mx-auto mb-1 opacity-50" />
                <p className="font-semibold text-[#0F172A]">All caught up!</p>
                <p>No new notifications right now.</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-3 text-xs transition-colors flex gap-2.5 items-start ${
                    n.isRead ? 'bg-white hover:bg-[#F8FAFC]' : 'bg-[#EFF6FF]/40 hover:bg-[#EFF6FF]/70'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {n.type === 'MARK_EDIT_APPROVED' ? (
                      <div className="w-6 h-6 rounded-lg bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center">
                        <KeyRound className="w-3.5 h-3.5" />
                      </div>
                    ) : n.type === 'MARK_EDIT_REJECTED' ? (
                      <div className="w-6 h-6 rounded-lg bg-[#FEE2E2] text-[#DC2626] flex items-center justify-center">
                        <X className="w-3.5 h-3.5" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center">
                        <Sparkles className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[#0F172A] truncate">{n.title}</p>
                    <p className="text-[#475569] mt-0.5 leading-snug">{n.message}</p>
                    <p className="text-[10px] text-[#94A3B8] mt-1">
                      {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>

                  {!n.isRead && (
                    <button
                      onClick={(e) => markAsRead(n.id, e)}
                      className="text-[#94A3B8] hover:text-[#2563EB] p-1 rounded-md"
                      title="Mark as read"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
