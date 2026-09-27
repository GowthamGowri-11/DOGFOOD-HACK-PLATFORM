'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Bell,
  CheckCircle2,
  Clock,
  ExternalLink,
  ShieldCheck,
  Check,
  Info,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export default function ParticipantNotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/v1/participants/me/notifications');
      const json = await res.json();
      if (res.ok && json.data?.notifications) {
        setNotifications(json.data.notifications);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAllAsRead = async () => {
    try {
      await fetch('/api/v1/participants/me/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true }),
      });
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const markSingleAsRead = async (id: string) => {
    try {
      await fetch('/api/v1/participants/me/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 select-none max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-[#E2E8F0]">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-bold text-[#2563EB] bg-[#EFF6FF] px-2.5 py-0.5 rounded-full border border-[#BFDBFE]">
              Activity Feed
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#111827] mt-1 tracking-tight">
            Notifications
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-0.5 font-normal">
            Real-time updates regarding registrations, team invites, deadlines, judging milestones, and results.
          </p>
        </div>

        {notifications.some((n) => !n.isRead) && (
          <Button
            variant="secondary"
            size="sm"
            onClick={markAllAsRead}
            icon={<Check className="w-3.5 h-3.5" />}
          >
            Mark All as Read
          </Button>
        )}
      </div>

      {loading ? (
        <div className="py-16 text-center text-xs text-[#64748B]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2563EB] mx-auto mb-2" />
          Loading notifications...
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-white border border-[#E2E8F0] rounded-[18px] p-12 text-center space-y-3 shadow-card max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center mx-auto">
            <Bell className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[#111827]">No Notifications Yet</h3>
          <p className="text-xs text-[#64748B] leading-relaxed">
            You are all caught up! New event announcements and submission reminders will appear here.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-[#E2E8F0] rounded-[18px] divide-y divide-[#F1F5F9] shadow-card overflow-hidden">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`p-5 flex items-start justify-between gap-4 transition-colors ${
                n.isRead ? 'bg-white hover:bg-[#F8FAFC]' : 'bg-[#EFF6FF]/40 hover:bg-[#EFF6FF]/60'
              }`}
            >
              <div className="flex items-start space-x-3.5">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    n.isRead
                      ? 'bg-[#F1F5F9] text-[#64748B]'
                      : 'bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]'
                  }`}
                >
                  <Info className="w-4 h-4" />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="text-sm font-bold text-[#111827]">{n.title}</h4>
                    {!n.isRead && (
                      <span className="w-2 h-2 rounded-full bg-[#2563EB]" />
                    )}
                  </div>
                  <p className="text-xs text-[#475569] leading-relaxed">{n.message}</p>
                  <span className="text-[11px] text-[#94A3B8] block">
                    {new Date(n.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-2 flex-shrink-0">
                {n.linkUrl && (
                  <Link href={n.linkUrl}>
                    <Button variant="outline" size="sm" icon={<ExternalLink className="w-3.5 h-3.5" />}>
                      View
                    </Button>
                  </Link>
                )}
                {!n.isRead && (
                  <button
                    onClick={() => markSingleAsRead(n.id)}
                    className="p-1.5 text-xs text-[#64748B] hover:text-[#2563EB] rounded-lg transition-colors"
                    title="Mark as read"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
