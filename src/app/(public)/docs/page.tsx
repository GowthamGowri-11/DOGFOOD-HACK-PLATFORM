'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Code,
  FileCode,
  Search,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Shield,
  Zap,
  Terminal,
  Server,
  Layers,
  Sparkles,
  Download,
  BookOpen,
  ArrowRight,
} from 'lucide-react';
import { AppShell } from '@/components/ui/AppShell';
import { Badge } from '@/components/ui/Badge';
import { openApiSpec } from '@/lib/api/openapi';

interface EndpointMeta {
  path: string;
  method: 'get' | 'post' | 'put' | 'delete' | 'patch';
  tag: string;
  summary: string;
  description: string;
  security?: any[];
  parameters?: any[];
  requestBody?: any;
  responses: Record<string, any>;
}

export default function ApiDocsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('ALL');
  const [expandedEndpoints, setExpandedEndpoints] = useState<Record<string, boolean>>({
    'get-/normalization/proof': true,
    'post-/pairwise/vote': true,
  });
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Extract all endpoints from openApiSpec
  const allEndpoints: EndpointMeta[] = useMemo(() => {
    const list: EndpointMeta[] = [];
    for (const [path, methods] of Object.entries(openApiSpec.paths)) {
      for (const [method, def] of Object.entries(methods as any)) {
        if (['get', 'post', 'put', 'delete', 'patch'].includes(method)) {
          const operation = def as any;
          list.push({
            path,
            method: method as any,
            tag: operation.tags?.[0] || 'General',
            summary: operation.summary || '',
            description: operation.description || '',
            security: operation.security,
            parameters: operation.parameters,
            requestBody: operation.requestBody,
            responses: operation.responses || {},
          });
        }
      }
    }
    return list;
  }, []);

  const tags = useMemo(() => {
    const set = new Set<string>();
    allEndpoints.forEach((e) => set.add(e.tag));
    return ['ALL', ...Array.from(set)];
  }, [allEndpoints]);

  const filteredEndpoints = useMemo(() => {
    return allEndpoints.filter((item) => {
      const matchesTag = selectedTag === 'ALL' || item.tag === selectedTag;
      const matchesSearch =
        searchQuery.trim() === '' ||
        item.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.method.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesTag && matchesSearch;
    });
  }, [allEndpoints, selectedTag, searchQuery]);

  const toggleExpand = (key: string) => {
    setExpandedEndpoints((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const getMethodBadgeClass = (method: string) => {
    switch (method.toUpperCase()) {
      case 'GET':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case 'POST':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
      case 'PUT':
      case 'PATCH':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      case 'DELETE':
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
      default:
        return 'bg-stone-500/10 text-stone-600 border-stone-500/20';
    }
  };

  const generateCurl = (endpoint: EndpointMeta) => {
    const baseUrl = 'http://localhost:3000/api/v1';
    let cmd = `curl -X ${endpoint.method.toUpperCase()} "${baseUrl}${endpoint.path}"`;
    if (endpoint.security && endpoint.security.length > 0) {
      cmd += ` \\\n  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"`;
    }
    if (endpoint.requestBody) {
      cmd += ` \\\n  -H "Content-Type: application/json"`;
      cmd += ` \\\n  -d '{"key": "value"}'`;
    }
    return cmd;
  };

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Header Hero */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-stone-900 via-stone-850 to-stone-950 text-white p-8 md:p-10 border border-stone-800 shadow-2xl">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <Terminal className="w-64 h-64 text-amber-400" />
          </div>

          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-mono font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              API FIRST · OpenAPI 3.0.3 SPECIFICATION
            </div>

            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white">
              Platform REST & Realtime API
            </h1>

            <p className="text-stone-300 text-sm md:text-base leading-relaxed">
              Explore and integrate with the Dogfood Hackathon Platform. Complete programmatic control over
              hackathons, teams, cross-judge Z-score normalization proof, Bradley-Terry pairwise matchmaking,
              HMAC webhooks, and tamper-evident credentials.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a
                href="/api/v1/openapi.json"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 text-stone-950 font-semibold text-xs hover:bg-amber-400 transition-colors shadow-md"
              >
                <Download className="w-4 h-4" />
                Raw OpenAPI Specification (.json)
              </a>

              <Link
                href="/threat-model"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white font-medium text-xs border border-white/10 transition-colors"
              >
                <Shield className="w-4 h-4 text-emerald-400" />
                Defensive Threat Model
              </Link>

              <Link
                href="/organizer/judging/normalization-proof"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white font-medium text-xs border border-white/10 transition-colors"
              >
                <Zap className="w-4 h-4 text-blue-400" />
                Live Normalization Proof
              </Link>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="mt-8 pt-6 border-t border-stone-800/80 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-stone-400 block font-mono">SPECIFICATION</span>
              <span className="text-stone-150 font-bold text-sm">OpenAPI 3.0.3</span>
            </div>
            <div>
              <span className="text-stone-400 block font-mono">BASE URL</span>
              <span className="text-stone-150 font-mono text-xs">/api/v1</span>
            </div>
            <div>
              <span className="text-stone-400 block font-mono">AUTHENTICATION</span>
              <span className="text-stone-150 font-bold text-sm">JWT Bearer & HMAC</span>
            </div>
            <div>
              <span className="text-stone-400 block font-mono">TOTAL ROUTES</span>
              <span className="text-stone-150 font-bold text-sm">{allEndpoints.length} Documented</span>
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by endpoint path, method, or keyword (e.g., /normalization, pairwise, vote)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40"
            />
          </div>

          {/* Tag Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            {tags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors border ${
                  selectedTag === tag
                    ? 'bg-stone-900 text-white dark:bg-amber-500 dark:text-stone-950 border-stone-900 dark:border-amber-500'
                    : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Endpoint List */}
        <div className="space-y-4">
          {filteredEndpoints.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-8">
              <FileCode className="w-12 h-12 text-stone-400 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-stone-800 dark:text-stone-200">
                No matching endpoints found
              </h3>
              <p className="text-xs text-stone-500 mt-1">
                Try searching for "pairwise", "normalization", or clear your filter.
              </p>
            </div>
          ) : (
            filteredEndpoints.map((endpoint) => {
              const endpointKey = `${endpoint.method}-${endpoint.path}`;
              const isExpanded = !!expandedEndpoints[endpointKey];
              const curl = generateCurl(endpoint);

              return (
                <div
                  key={endpointKey}
                  className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-sm overflow-hidden transition-all duration-200"
                >
                  {/* Collapsed Header Bar */}
                  <div
                    onClick={() => toggleExpand(endpointKey)}
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-850/50 transition-colors select-none"
                  >
                    <div className="flex items-center gap-3 flex-wrap">
                      <span
                        className={`px-2.5 py-1 rounded text-xs font-mono font-bold uppercase border ${getMethodBadgeClass(
                          endpoint.method
                        )}`}
                      >
                        {endpoint.method}
                      </span>
                      <span className="font-mono text-sm font-semibold text-stone-900 dark:text-stone-100">
                        {endpoint.path}
                      </span>
                      <span className="text-xs text-stone-500 dark:text-stone-400 hidden sm:inline">
                        — {endpoint.summary}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400">
                        {endpoint.tag}
                      </span>
                      {endpoint.security && endpoint.security.length > 0 && (
                        <span title="Requires Authentication">
                          <Shield className="w-3.5 h-3.5 text-amber-500" />
                        </span>
                      )}
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-stone-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-stone-400" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Content Drawer */}
                  {isExpanded && (
                    <div className="p-5 border-t border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-950/40 space-y-6">
                      {/* Description */}
                      <div>
                        <h4 className="text-xs font-mono uppercase tracking-wider text-stone-400 font-semibold mb-1">
                          Description
                        </h4>
                        <p className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
                          {endpoint.description}
                        </p>
                      </div>

                      {/* Parameters if any */}
                      {endpoint.parameters && endpoint.parameters.length > 0 && (
                        <div>
                          <h4 className="text-xs font-mono uppercase tracking-wider text-stone-400 font-semibold mb-2">
                            Query / Path Parameters
                          </h4>
                          <div className="border border-stone-200 dark:border-stone-800 rounded-lg overflow-hidden bg-white dark:bg-stone-900">
                            <table className="w-full text-xs text-left">
                              <thead className="bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 font-mono">
                                <tr>
                                  <th className="p-2.5">Name</th>
                                  <th className="p-2.5">In</th>
                                  <th className="p-2.5">Type</th>
                                  <th className="p-2.5">Required</th>
                                  <th className="p-2.5">Description</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-stone-200 dark:divide-stone-800">
                                {endpoint.parameters.map((p) => (
                                  <tr key={p.name}>
                                    <td className="p-2.5 font-mono font-semibold text-stone-800 dark:text-stone-200">
                                      {p.name}
                                    </td>
                                    <td className="p-2.5 font-mono text-stone-500">{p.in}</td>
                                    <td className="p-2.5 font-mono text-amber-600 dark:text-amber-400">
                                      {p.schema?.type || 'string'}
                                    </td>
                                    <td className="p-2.5">
                                      {p.required ? (
                                        <span className="text-rose-500 font-semibold">Yes</span>
                                      ) : (
                                        <span className="text-stone-400">No</span>
                                      )}
                                    </td>
                                    <td className="p-2.5 text-stone-600 dark:text-stone-300">{p.description}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Request Body Specification */}
                      {endpoint.requestBody && (
                        <div>
                          <h4 className="text-xs font-mono uppercase tracking-wider text-stone-400 font-semibold mb-2">
                            Request Body (application/json)
                          </h4>
                          <div className="p-3 bg-stone-900 text-stone-200 rounded-lg font-mono text-xs overflow-x-auto border border-stone-800">
                            <pre>
                              {JSON.stringify(
                                endpoint.requestBody.content?.['application/json']?.schema || {},
                                null,
                                2
                              )}
                            </pre>
                          </div>
                        </div>
                      )}

                      {/* Responses */}
                      <div>
                        <h4 className="text-xs font-mono uppercase tracking-wider text-stone-400 font-semibold mb-2">
                          Responses
                        </h4>
                        <div className="space-y-2">
                          {Object.entries(endpoint.responses).map(([code, resp]) => (
                            <div
                              key={code}
                              className="border border-stone-200 dark:border-stone-800 rounded-lg p-3 bg-white dark:bg-stone-900"
                            >
                              <div className="flex items-center gap-2 mb-1.5">
                                <span
                                  className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
                                    code.startsWith('2')
                                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                      : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                                  }`}
                                >
                                  {code}
                                </span>
                                <span className="text-xs font-medium text-stone-700 dark:text-stone-300">
                                  {resp.description}
                                </span>
                              </div>
                              {resp.content?.['application/json']?.schema && (
                                <div className="mt-2 p-2.5 bg-stone-900 text-stone-300 rounded font-mono text-[11px] overflow-x-auto">
                                  <pre>
                                    {JSON.stringify(resp.content['application/json'].schema, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* cURL Code Snippet */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-xs font-mono uppercase tracking-wider text-stone-400 font-semibold flex items-center gap-1.5">
                            <Terminal className="w-3.5 h-3.5 text-amber-500" />
                            cURL Example
                          </h4>
                          <button
                            onClick={() => copyToClipboard(curl, endpointKey)}
                            className="inline-flex items-center gap-1 text-xs text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 transition-colors"
                          >
                            {copiedKey === endpointKey ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                                <span className="text-emerald-500 font-medium">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy cURL</span>
                              </>
                            )}
                          </button>
                        </div>
                        <div className="p-3 bg-stone-950 text-amber-400 rounded-lg font-mono text-xs overflow-x-auto border border-stone-800">
                          <pre>{curl}</pre>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer Reference Section */}
        <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/60 p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                Full Machine-Readable OpenAPI 3.0
              </h4>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Import this definition directly into Postman, Swagger UI, Insomnia, or SDK generators.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/api/v1/openapi.json"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-xs font-medium hover:bg-stone-800 transition-colors shadow-sm"
            >
              <span>View JSON</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
