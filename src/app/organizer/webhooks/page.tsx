'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Webhook,
  Plus,
  Send,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Shield,
  Key,
  RefreshCw,
  ExternalLink,
  Code2,
  Activity,
  Zap,
  Check,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

interface WebhookItem {
  id: string;
  hackathonId: string;
  url: string;
  secret: string;
  description?: string;
  events: string[];
  isActive: boolean;
  createdAt: string;
}

interface DeliveryLog {
  id: string;
  webhookId: string;
  url: string;
  event: string;
  status: 'SUCCESS' | 'FAILED';
  statusCode: number;
  durationMs: number;
  requestPayload: any;
  responseBody?: string;
  errorMessage?: string;
  attemptedAt: string;
}

export default function OrganizerWebhooksPage() {
  const [webhooks, setWebhooks] = useState<WebhookItem[]>([]);
  const [deliveries, setDeliveries] = useState<DeliveryLog[]>([]);
  const [supportedEvents, setSupportedEvents] = useState<{ event: string; label: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // New webhook modal form states
  const [showModal, setShowModal] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>([
    'submission.locked',
    'results.published',
    'vote.cast',
  ]);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [resHooks, resDeliveries] = await Promise.all([
        fetch('/api/v1/webhooks'),
        fetch('/api/v1/webhooks/deliveries'),
      ]);

      const jsonHooks = await resHooks.json();
      const jsonDeliv = await resDeliveries.json();

      if (jsonHooks.success && jsonHooks.data) {
        setWebhooks(jsonHooks.data.webhooks || []);
        setSupportedEvents(jsonHooks.data.supportedEvents || []);
      }
      if (jsonDeliv.success && jsonDeliv.data) {
        setDeliveries(jsonDeliv.data.deliveries || []);
      }
    } catch (err: any) {
      console.error('Failed to load webhooks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTestPing = async (id: string) => {
    try {
      setTestingId(id);
      const res = await fetch(`/api/v1/webhooks/${id}/test`, { method: 'POST' });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || 'Ping failed');
      }

      setToast({
        type: 'success',
        message: `Test ping delivered! HTTP ${json.data.statusCode} in ${json.data.durationMs}ms`,
      });
      loadData();
    } catch (err: any) {
      setToast({ type: 'error', message: err.message || 'Error delivering test ping' });
    } finally {
      setTestingId(null);
    }
  };

  const handleDeleteWebhook = async (id: string) => {
    if (!confirm('Are you sure you want to delete this webhook subscription?')) return;
    try {
      const res = await fetch(`/api/v1/webhooks/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setWebhooks((prev) => prev.filter((w) => w.id !== id));
        setToast({ type: 'success', message: 'Webhook deleted successfully.' });
      }
    } catch (err: any) {
      setToast({ type: 'error', message: err.message });
    }
  };

  const handleCreateWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl.trim()) return;

    try {
      const res = await fetch('/api/v1/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: newUrl,
          description: newDesc,
          events: selectedEvents,
          hackathonId: 'hack_apex_2026',
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || 'Failed to create webhook');
      }

      setToast({ type: 'success', message: 'Webhook registered successfully!' });
      setShowModal(false);
      setNewUrl('');
      setNewDesc('');
      loadData();
    } catch (err: any) {
      setToast({ type: 'error', message: err.message || 'Error registering webhook' });
    }
  };

  const toggleEventSelect = (evt: string) => {
    setSelectedEvents((prev) =>
      prev.includes(evt) ? prev.filter((e) => e !== evt) : [...prev, evt]
    );
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#131417] text-neutral-900 dark:text-neutral-100 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#FA541C] uppercase tracking-wider mb-1">
              <Zap className="w-4 h-4" />
              <span>Developer Integration & Automation</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              REST Webhooks & Event Subscriptions
            </h1>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
              Trigger downstream workflows in Slack, Discord, Zapier, or internal CI/CD pipelines whenever hackathon actions occur.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              disabled={loading}
              className="p-2 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              title="Refresh endpoints"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 rounded-xl bg-[#FA541C] text-white hover:bg-[#e04513] text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Register Webhook</span>
            </button>
          </div>
        </div>

        {/* Toast Alert */}
        {toast && (
          <div
            className={`p-4 rounded-xl flex items-center justify-between gap-3 text-sm animate-in fade-in-50 ${
              toast.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800'
                : 'bg-red-50 dark:bg-red-950/50 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800'
            }`}
          >
            <div className="flex items-center gap-2">
              {toast.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600 dark:text-red-400" />
              )}
              <span>{toast.message}</span>
            </div>
            <button
              onClick={() => setToast(null)}
              className="text-xs font-semibold underline hover:opacity-75"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Security & Verification Banner */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#1A1C20] border border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center flex-shrink-0">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-neutral-900 dark:text-neutral-100">
                Cryptographic HMAC-SHA256 Signatures Active
              </div>
              <div className="text-neutral-500 dark:text-neutral-400 mt-0.5">
                Every outgoing request includes a signature in the header <code className="font-mono text-[11px] bg-neutral-100 dark:bg-neutral-800 px-1 py-0.5 rounded">X-Dogfood-Signature: sha256=...</code> verified via your webhook secret.
              </div>
            </div>
          </div>
        </div>

        {/* Registered Webhooks List */}
        <div className="space-y-4">
          <h2 className="text-base font-bold flex items-center gap-2">
            <Webhook className="w-4 h-4 text-[#FA541C]" />
            <span>Active Webhook Subscriptions ({webhooks.length})</span>
          </h2>

          {webhooks.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-[#1A1C20] rounded-2xl border border-neutral-200 dark:border-neutral-800">
              <Webhook className="w-10 h-10 text-neutral-300 dark:text-neutral-700 mx-auto mb-2" />
              <p className="text-sm font-bold">No Webhooks Registered</p>
              <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
                Register an HTTP endpoint to start streaming realtime hackathon events to your external tools.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {webhooks.map((hook) => (
                <div
                  key={hook.id}
                  className="bg-white dark:bg-[#1A1C20] rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 shadow-sm space-y-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                          {hook.description}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                          Active
                        </span>
                      </div>
                      <div className="font-mono text-xs text-neutral-600 dark:text-neutral-300 break-all">
                        {hook.url}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleTestPing(hook.id)}
                        disabled={testingId === hook.id}
                        className="px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                      >
                        {testingId === hook.id ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Send className="w-3.5 h-3.5 text-[#FA541C]" />
                        )}
                        <span>Send Test Ping</span>
                      </button>

                      <button
                        onClick={() => handleDeleteWebhook(hook.id)}
                        className="p-2 rounded-xl text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                        title="Delete webhook"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Subscribed Events Chips */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-neutral-100 dark:border-neutral-800/80">
                    <span className="text-[11px] text-neutral-400 font-semibold mr-1">Events:</span>
                    {hook.events.map((evt) => (
                      <span
                        key={evt}
                        className="px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-mono text-[10.5px]"
                      >
                        {evt}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Webhook Delivery Logs */}
        <div className="bg-white dark:bg-[#1A1C20] rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-500" />
              <span>Recent Webhook Delivery Attempts</span>
            </h2>
            <span className="text-xs text-neutral-400 font-mono">
              Last {deliveries.length} dispatches
            </span>
          </div>

          <div className="divide-y divide-neutral-100 dark:divide-neutral-800/80">
            {deliveries.length === 0 ? (
              <div className="text-center py-8 text-neutral-400 text-xs">
                No delivery logs recorded yet. Send a test ping to verify!
              </div>
            ) : (
              deliveries.slice(0, 10).map((del) => {
                const isExpanded = expandedLogId === del.id;
                return (
                  <div key={del.id} className="py-3 text-xs space-y-2">
                    <div
                      onClick={() => setExpandedLogId(isExpanded ? null : del.id)}
                      className="flex flex-wrap items-center justify-between gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                            del.status === 'SUCCESS'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                          }`}
                        >
                          {del.statusCode || 'ERR'}
                        </span>
                        <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200">
                          {del.event}
                        </span>
                        <span className="text-neutral-400 font-mono text-[11px] truncate max-w-xs">
                          {del.url}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-neutral-400">
                        <span className="font-mono text-[11px]">{del.durationMs}ms</span>
                        <span>{new Date(del.attemptedAt).toLocaleTimeString()}</span>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </div>

                    {/* Expandable JSON Payload Inspector */}
                    {isExpanded && (
                      <div className="p-3 bg-neutral-900 text-neutral-200 rounded-xl font-mono text-[11px] space-y-2 overflow-x-auto">
                        <div className="text-neutral-400 text-[10px] uppercase font-bold">
                          HTTP POST Request Body
                        </div>
                        <pre className="text-emerald-400">
                          {JSON.stringify(del.requestPayload, null, 2)}
                        </pre>
                        {del.responseBody && (
                          <>
                            <div className="text-neutral-400 text-[10px] uppercase font-bold pt-2 border-t border-neutral-800">
                              HTTP Response Body
                            </div>
                            <pre className="text-neutral-300">{del.responseBody}</pre>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Register Webhook Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in-50">
          <div className="bg-white dark:bg-[#1A1C20] rounded-2xl border border-neutral-200 dark:border-neutral-800 max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#FA541C]" />
                <span>Register Webhook Endpoint</span>
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateWebhook} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 block mb-1">
                  Destination URL
                </label>
                <input
                  type="url"
                  placeholder="https://api.mycompany.com/webhooks/dogfood"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#FA541C]"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 block mb-1">
                  Description / Service Name
                </label>
                <input
                  type="text"
                  placeholder="Slack Live Announcements Channel"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#FA541C]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 block mb-2">
                  Select Event Triggers
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {supportedEvents.map((evt) => (
                    <label
                      key={evt.event}
                      className="flex items-start gap-2.5 p-2 rounded-lg bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 text-xs cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    >
                      <input
                        type="checkbox"
                        checked={selectedEvents.includes(evt.event)}
                        onChange={() => toggleEventSelect(evt.event)}
                        className="rounded text-[#FA541C] focus:ring-[#FA541C] mt-0.5"
                      />
                      <div>
                        <div className="font-mono font-bold text-neutral-800 dark:text-neutral-200">
                          {evt.event}
                        </div>
                        <div className="text-[11px] text-neutral-500">{evt.label}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 text-xs font-semibold hover:bg-neutral-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#FA541C] text-white text-xs font-semibold hover:bg-[#e04513] transition-colors"
                >
                  Register Webhook
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
