'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Download,
  Upload,
  Database,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Shield,
  Layers,
  Sparkles,
  ArrowRight,
  RefreshCw,
  FileText,
  Users,
  Copy,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

const SAMPLE_CSV_TEMPLATES = {
  REGISTRATIONS: `email,fullname\ncharlie.crypto@hackathon.dev,Charlie Crypto\ndana.ai@hackathon.dev,Dana AI Specialist\nedward.mesh@hackathon.dev,Edward Mesh`,
  TEAMS: `teamname\nQuantum Sentinel Alpha\nDecentralized Rail Runners\nCyberShield AI Labs`,
  PROBLEMS: `code,title,description\nAI-04,Autonomous Edge Agent Diagnostics,Deploy micro-agents for memory anomaly diagnosis.\nFT-03,Cross-Chain Liquidity Router,Sub-second multi-hop routing with slippage protection.`,
};

export default function OrganizerPortabilityPage() {
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [entityType, setEntityType] = useState<'REGISTRATIONS' | 'TEAMS' | 'PROBLEMS'>('REGISTRATIONS');
  const [format, setFormat] = useState<'csv' | 'json'>('csv');
  const [importContent, setImportContent] = useState(SAMPLE_CSV_TEMPLATES.REGISTRATIONS);
  const [result, setResult] = useState<any>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const hackathonId = 'hack_apex_2026';

  const handleExportFullArchive = () => {
    setExporting(true);
    window.open(`/api/v1/hackathons/${hackathonId}/export-bundle`, '_blank');
    setTimeout(() => setExporting(false), 2000);
  };

  const handleLoadSample = (type: 'REGISTRATIONS' | 'TEAMS' | 'PROBLEMS') => {
    setEntityType(type);
    setFormat('csv');
    setImportContent(SAMPLE_CSV_TEMPLATES[type]);
    setResult(null);
  };

  const handleBulkImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importContent.trim()) return;

    try {
      setImporting(true);
      setResult(null);
      const res = await fetch(`/api/v1/hackathons/${hackathonId}/bulk-import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityType,
          format,
          content: importContent,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || 'Bulk import encountered errors.');
      }

      setResult(json.data);
      setToast({
        type: 'success',
        message: `Bulk import completed! ${json.data.importedCount} records successfully imported.`,
      });
    } catch (err: any) {
      setToast({ type: 'error', message: err.message || 'Error executing import' });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] dark:bg-[#131417] text-neutral-900 dark:text-neutral-100 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#FA541C] uppercase tracking-wider mb-1">
              <Database className="w-4 h-4" />
              <span>Zero Vendor Lock-In & Portability</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Data Portability & Bulk Importer
            </h1>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
              Export your entire hackathon relational graph in one click to leave as easily as you arrived, or bulk import data in seconds.
            </p>
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

        {/* Section 1: Full Portable Data Archive Export */}
        <div className="bg-white dark:bg-[#1A1C20] rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 sm:p-8 shadow-sm space-y-4 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#FA541C]">
                Organizer Portability Guarantee
              </span>
              <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mt-0.5">
                Download Complete Hackathon Archive (JSON Snapshot)
              </h2>
              <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-1 max-w-2xl leading-relaxed">
                Generates a unified, standardized JSON snapshot of all Hackathon data: tracks, problem statements, registered participants, teams, project submissions, judging rubrics, evaluations, normalized scores, verified certificates, and audit logs.
              </p>
            </div>

            <button
              onClick={handleExportFullArchive}
              disabled={exporting}
              className="px-5 py-2.5 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:opacity-90 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 flex-shrink-0 self-start sm:self-center"
            >
              {exporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              <span>{exporting ? 'Packing Archive...' : 'Download Full Archive'}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-neutral-100 dark:border-neutral-800/80 text-center text-xs">
            <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 font-medium text-neutral-600 dark:text-neutral-300">
              Registrations & Teams
            </div>
            <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 font-medium text-neutral-600 dark:text-neutral-300">
              Projects & Submissions
            </div>
            <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 font-medium text-neutral-600 dark:text-neutral-300">
              Evaluations & Scores
            </div>
            <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 font-medium text-neutral-600 dark:text-neutral-300">
              Certificates & Audits
            </div>
          </div>
        </div>

        {/* Section 2: Bulk Data Importer */}
        <div className="bg-white dark:bg-[#1A1C20] rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 sm:p-8 shadow-sm space-y-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-neutral-500 uppercase tracking-wider">
              <Upload className="w-4 h-4 text-[#FA541C]" />
              <span>Bulk Ingestion Engine</span>
            </div>
            <h2 className="text-xl font-bold mt-1">Bulk Import Entities into Hackathon</h2>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
              Quickly onboard batches of participants, pre-register teams, or bulk publish track problem statements.
            </p>
          </div>

          {/* Quick Template Selector */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-800 text-xs">
            <span className="font-semibold text-neutral-700 dark:text-neutral-300">
              Load Sample CSV Format:
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleLoadSample('REGISTRATIONS')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  entityType === 'REGISTRATIONS'
                    ? 'bg-[#FA541C] text-white shadow-xs'
                    : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700'
                }`}
              >
                Participants
              </button>
              <button
                type="button"
                onClick={() => handleLoadSample('TEAMS')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  entityType === 'TEAMS'
                    ? 'bg-[#FA541C] text-white shadow-xs'
                    : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700'
                }`}
              >
                Teams
              </button>
              <button
                type="button"
                onClick={() => handleLoadSample('PROBLEMS')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  entityType === 'PROBLEMS'
                    ? 'bg-[#FA541C] text-white shadow-xs'
                    : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700'
                }`}
              >
                Problem Statements
              </button>
            </div>
          </div>

          <form onSubmit={handleBulkImport} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 block mb-1">
                  Entity Type
                </label>
                <select
                  value={entityType}
                  onChange={(e) => setEntityType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs sm:text-sm font-semibold"
                >
                  <option value="REGISTRATIONS">Participants &amp; Registrations</option>
                  <option value="TEAMS">Teams</option>
                  <option value="PROBLEMS">Problem Statements</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 block mb-1">
                  Payload Format
                </label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value as any)}
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs sm:text-sm font-semibold"
                >
                  <option value="csv">CSV (Comma-Separated)</option>
                  <option value="json">JSON Array</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 block mb-1">
                Data Content (Header + Rows)
              </label>
              <textarea
                rows={6}
                value={importContent}
                onChange={(e) => setImportContent(e.target.value)}
                className="w-full p-3 font-mono text-xs bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FA541C]"
                placeholder="Paste CSV rows or JSON array..."
                required
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-neutral-400">
                Duplicates automatically detected and merged via unique keys.
              </span>

              <button
                type="submit"
                disabled={importing}
                className="px-5 py-2 bg-[#FA541C] text-white hover:bg-[#e04513] text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                {importing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                <span>{importing ? 'Importing Batch...' : 'Execute Bulk Import'}</span>
              </button>
            </div>
          </form>

          {/* Import Result Feedback */}
          {result && (
            <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-800 space-y-2 text-xs">
              <div className="flex items-center justify-between font-bold">
                <span>Batch Processing Summary</span>
                <span className="text-emerald-600 dark:text-emerald-400">
                  {result.importedCount} Records Successfully Processed
                </span>
              </div>
              <div className="text-neutral-500">
                Skipped: {result.skippedCount} | Errors: {result.errors?.length || 0}
              </div>
              {result.errors && result.errors.length > 0 && (
                <div className="p-2 bg-red-50 dark:bg-red-950/40 rounded text-red-700 dark:text-red-300 font-mono text-[10.5px]">
                  {result.errors.join('; ')}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
