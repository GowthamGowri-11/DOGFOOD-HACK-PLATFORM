'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Edit2,
  MoveUp,
  MoveDown,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Eye,
  Layers,
  Save,
  Send,
  FileText,
  Sliders,
  Sparkles,
  ShieldCheck,
  Globe,
} from 'lucide-react';
import {
  TeamMemberFormField,
  TeamMemberFormConfig,
  FormFieldType,
  DEFAULT_FORM_FIELDS,
} from '@/types/team-form';

const FIELD_TYPES: { type: FormFieldType; label: string; description: string }[] = [
  { type: 'TEXT', label: 'Single-line Text', description: 'Standard short text input' },
  { type: 'EMAIL', label: 'Email Address', description: 'Validated email input' },
  { type: 'PHONE', label: 'Phone Number', description: 'Contact phone / WhatsApp number' },
  { type: 'NUMBER', label: 'Numeric Value', description: 'Integer or decimal numbers' },
  { type: 'TEXTAREA', label: 'Multi-line Text', description: 'Paragraph or extended description' },
  { type: 'SELECT', label: 'Dropdown Select', description: 'Single selection from a list of options' },
  { type: 'MULTI_SELECT', label: 'Multi-select Dropdown', description: 'Multiple selections from options' },
  { type: 'RADIO', label: 'Radio Group', description: 'Single choice radio buttons' },
  { type: 'CHECKBOX', label: 'Checkbox Group', description: 'Multiple choice checkboxes' },
  { type: 'DATE', label: 'Date Picker', description: 'Date selection' },
  { type: 'URL', label: 'Web / Profile Link', description: 'Validated URL input' },
];

export default function OrganizerTeamFormBuilderPage({
  params,
}: {
  params: { id: string };
}) {
  const { id: hackathonId } = params;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form Configuration State
  const [formConfig, setFormConfig] = useState<TeamMemberFormConfig>({
    hackathonId,
    title: 'Team Member Registration Form',
    description: 'Please provide required teammate credentials and academic details to join the squad.',
    status: 'PUBLISHED',
    version: 1,
    fields: [...DEFAULT_FORM_FIELDS],
    updatedAt: new Date().toISOString(),
  });

  // Modal States
  const [fieldModalOpen, setFieldModalOpen] = useState(false);
  const [editingFieldIndex, setEditingFieldIndex] = useState<number | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [fieldToDeleteIndex, setFieldToDeleteIndex] = useState<number | null>(null);

  // Editing Field State
  const [fieldForm, setFieldForm] = useState<TeamMemberFormField>({
    id: '',
    type: 'TEXT',
    label: '',
    description: '',
    placeholder: '',
    required: true,
    options: ['Option 1', 'Option 2'],
    order: 1,
  });
  const [optionsText, setOptionsText] = useState('Option 1\nOption 2');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchFormConfig = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/v1/hackathons/${hackathonId}/team-form`);
      const json = await res.json();
      if (res.ok && json.data?.form) {
        setFormConfig(json.data.form);
      } else {
        setError(json.message || 'Failed to load team form configuration');
      }
    } catch (err: any) {
      setError(err.message || 'Network error loading form');
    } finally {
      setLoading(false);
    }
  }, [hackathonId]);

  useEffect(() => {
    fetchFormConfig();
  }, [fetchFormConfig]);

  // Save Draft Handler
  const handleSaveDraft = async () => {
    try {
      setSaving(true);
      setError(null);
      const res = await fetch(`/api/v1/hackathons/${hackathonId}/team-form`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formConfig,
          status: 'DRAFT',
        }),
      });
      const json = await res.json();
      if (res.ok && json.data?.form) {
        setFormConfig(json.data.form);
        showToast('Draft form configuration saved successfully!');
      } else {
        setError(json.message || 'Failed to save draft');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save draft');
    } finally {
      setSaving(false);
    }
  };

  // Publish Form Handler
  const handlePublish = async () => {
    try {
      setPublishing(true);
      setError(null);
      const res = await fetch(`/api/v1/hackathons/${hackathonId}/team-form/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const json = await res.json();
      if (res.ok && json.data?.form) {
        setFormConfig(json.data.form);
        showToast(`Team Member Form published successfully (v${json.data.form.version})!`);
      } else {
        setError(json.message || 'Failed to publish form');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to publish form');
    } finally {
      setPublishing(false);
    }
  };

  // Open Add Field Modal
  const openAddField = () => {
    const newOrder = formConfig.fields.length + 1;
    const newId = `field_custom_${Date.now()}`;
    setFieldForm({
      id: newId,
      type: 'TEXT',
      label: '',
      description: '',
      placeholder: '',
      required: true,
      options: ['Option 1', 'Option 2'],
      order: newOrder,
    });
    setOptionsText('Option 1\nOption 2');
    setEditingFieldIndex(null);
    setFieldModalOpen(true);
  };

  // Open Edit Field Modal
  const openEditField = (index: number) => {
    const f = formConfig.fields[index];
    setFieldForm({ ...f });
    setOptionsText(f.options ? f.options.join('\n') : '');
    setEditingFieldIndex(index);
    setFieldModalOpen(true);
  };

  // Save Field Modal
  const handleSaveField = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fieldForm.label.trim()) return;

    const parsedOptions = optionsText
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const updatedField: TeamMemberFormField = {
      ...fieldForm,
      label: fieldForm.label.trim(),
      description: fieldForm.description?.trim() || undefined,
      placeholder: fieldForm.placeholder?.trim() || undefined,
      options: ['SELECT', 'MULTI_SELECT', 'RADIO', 'CHECKBOX'].includes(fieldForm.type)
        ? parsedOptions.length > 0
          ? parsedOptions
          : ['Option 1', 'Option 2']
        : undefined,
    };

    let updatedFields = [...formConfig.fields];
    if (editingFieldIndex !== null) {
      updatedFields[editingFieldIndex] = updatedField;
    } else {
      updatedFields.push(updatedField);
    }

    // Recalculate orders
    updatedFields = updatedFields.map((f, i) => ({ ...f, order: i + 1 }));

    setFormConfig({ ...formConfig, fields: updatedFields });
    setFieldModalOpen(false);
    showToast(editingFieldIndex !== null ? 'Field updated' : 'New field added to form');
  };

  // Move Field Up / Down
  const moveField = (index: number, direction: 'UP' | 'DOWN') => {
    if (direction === 'UP' && index === 0) return;
    if (direction === 'DOWN' && index === formConfig.fields.length - 1) return;

    const targetIndex = direction === 'UP' ? index - 1 : index + 1;
    const newFields = [...formConfig.fields];
    const temp = newFields[index];
    newFields[index] = newFields[targetIndex];
    newFields[targetIndex] = temp;

    const reordered = newFields.map((f, i) => ({ ...f, order: i + 1 }));
    setFormConfig({ ...formConfig, fields: reordered });
  };

  // Delete Field
  const confirmDeleteField = () => {
    if (fieldToDeleteIndex === null) return;
    const updated = formConfig.fields.filter((_, i) => i !== fieldToDeleteIndex);
    const reordered = updated.map((f, i) => ({ ...f, order: i + 1 }));
    setFormConfig({ ...formConfig, fields: reordered });
    setDeleteModalOpen(false);
    setFieldToDeleteIndex(null);
    showToast('Field removed from form');
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-xs text-[#64748B] bg-white border border-[#E2E8F0] rounded-2xl max-w-5xl mx-auto shadow-xs">
        <RefreshCw className="w-6 h-6 text-[#2563EB] animate-spin mx-auto mb-2" />
        Loading Team Member Form Builder...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16 select-none">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-[#0F172A] text-white px-4 py-2.5 rounded-xl shadow-xl text-xs font-medium flex items-center gap-2 border border-[#334155] animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Breadcrumb Bar */}
      <nav className="flex items-center space-x-2 text-xs text-[#64748B] font-medium">
        <Link href="/" className="hover:text-[#2563EB] transition-colors">
          Home
        </Link>
        <span>&rsaquo;</span>
        <Link href="/organizer/dashboard" className="hover:text-[#2563EB] transition-colors">
          Organizer
        </Link>
        <span>&rsaquo;</span>
        <Link href="/organizer/hackathons" className="hover:text-[#2563EB] transition-colors">
          Hackathons
        </Link>
        <span>&rsaquo;</span>
        <Link href={`/organizer/hackathons/${hackathonId}`} className="hover:text-[#2563EB] transition-colors">
          Manage Event
        </Link>
        <span>&rsaquo;</span>
        <span className="text-[#0F172A] font-semibold">Team Member Form Builder</span>
      </nav>

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <Link
            href={`/organizer/hackathons/${hackathonId}`}
            className="inline-flex items-center text-xs font-semibold text-[#64748B] hover:text-[#2563EB] mb-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            Back to Hackathon Configuration
          </Link>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] flex items-center justify-center text-[#2563EB] flex-shrink-0 mt-0.5 border border-[#DBEAFE]">
              <FileText className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
                  Team Member Form Builder
                </h1>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border ${
                    formConfig.status === 'PUBLISHED'
                      ? 'bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]'
                      : 'bg-[#FEF3C7] text-[#D97706] border-[#FDE68A]'
                  }`}
                >
                  {formConfig.status} (v{formConfig.version || 1})
                </span>
              </div>
              <p className="text-xs text-[#64748B] mt-1 font-normal">
                Define the teammate information collected when participants create and manage their squads.
              </p>
            </div>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center space-x-2.5 self-start sm:self-center">
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#334155] bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5 text-[#64748B]" />
            <span>{saving ? 'Saving...' : 'Save Draft'}</span>
          </button>

          <button
            type="button"
            onClick={handlePublish}
            disabled={publishing}
            className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>{publishing ? 'Publishing...' : 'Publish Form'}</span>
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-[#FEF2F2] border border-[#FECACA] rounded-2xl text-xs text-[#DC2626] flex items-center space-x-2 shadow-xs">
          <AlertCircle className="w-4 h-4 text-[#DC2626] flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Grid: Form Definition (Left) + Live Preview (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form Builder & Fields Configuration (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Form Meta Card */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs space-y-4">
            <div className="border-b border-[#F1F5F9] pb-3">
              <h2 className="text-base font-extrabold text-[#0F172A]">Form Information</h2>
              <p className="text-xs text-[#64748B]">Heading and guidelines displayed to participants.</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#334155]">Form Title*</label>
              <input
                type="text"
                value={formConfig.title}
                onChange={(e) => setFormConfig({ ...formConfig, title: e.target.value })}
                placeholder="e.g. ATLYX Global Hackathon — Team Member Registration"
                className="w-full px-3.5 py-2 text-xs bg-white border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#2563EB] text-[#0F172A] font-semibold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#334155]">Form Description / Instructions</label>
              <textarea
                rows={2}
                value={formConfig.description}
                onChange={(e) => setFormConfig({ ...formConfig, description: e.target.value })}
                placeholder="Enter instructions for team leaders adding members..."
                className="w-full p-3 text-xs bg-white border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#2563EB] text-[#0F172A]"
              />
            </div>
          </div>

          {/* Form Fields List Card */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
              <div>
                <h2 className="text-base font-extrabold text-[#0F172A]">Form Fields</h2>
                <p className="text-xs text-[#64748B]">
                  {formConfig.fields.length} field{formConfig.fields.length === 1 ? '' : 's'} configured
                </p>
              </div>

              <button
                type="button"
                onClick={openAddField}
                className="inline-flex items-center gap-1 px-3.5 py-1.5 text-xs font-bold text-[#2563EB] bg-[#EFF6FF] border border-[#DBEAFE] hover:bg-[#DBEAFE]/50 rounded-xl transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Add Field</span>
              </button>
            </div>

            <div className="space-y-3">
              {formConfig.fields.map((f, idx) => (
                <div
                  key={f.id || idx}
                  className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3.5 flex items-center justify-between gap-3 hover:border-[#CBD5E1] transition-all"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <span className="w-6 h-6 rounded-lg bg-white border border-[#E2E8F0] flex items-center justify-center text-[10px] font-bold text-[#64748B]">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-[#0F172A] truncate">{f.label}</span>
                        {f.required ? (
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]">
                            REQUIRED
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[9px] font-semibold bg-white text-[#64748B] border border-[#E2E8F0]">
                            OPTIONAL
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-[#64748B] font-mono block">
                        Type: {f.type} {f.options ? `(${f.options.length} options)` : ''}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => moveField(idx, 'UP')}
                      disabled={idx === 0}
                      className="p-1.5 text-[#64748B] hover:bg-white rounded-lg border border-transparent hover:border-[#E2E8F0] disabled:opacity-30"
                      title="Move Up"
                    >
                      <MoveUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveField(idx, 'DOWN')}
                      disabled={idx === formConfig.fields.length - 1}
                      className="p-1.5 text-[#64748B] hover:bg-white rounded-lg border border-transparent hover:border-[#E2E8F0] disabled:opacity-30"
                      title="Move Down"
                    >
                      <MoveDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditField(idx)}
                      className="p-1.5 text-[#2563EB] hover:bg-[#EFF6FF] rounded-lg border border-transparent hover:border-[#DBEAFE]"
                      title="Edit Field"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFieldToDeleteIndex(idx);
                        setDeleteModalOpen(true);
                      }}
                      disabled={formConfig.fields.length <= 1}
                      className="p-1.5 text-[#DC2626] hover:bg-[#FEF2F2] rounded-lg border border-transparent hover:border-[#FECACA] disabled:opacity-30"
                      title="Delete Field"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Live Interactive Participant Form Preview (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs sticky top-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
              <div className="flex items-center space-x-2">
                <Eye className="w-4 h-4 text-[#2563EB]" />
                <h2 className="text-sm font-extrabold text-[#0F172A] uppercase tracking-wider">
                  Live Participant Preview
                </h2>
              </div>
              <span className="text-[10px] font-semibold text-[#059669] bg-[#ECFDF5] px-2 py-0.5 rounded-md border border-[#A7F3D0]">
                Interactive Demo
              </span>
            </div>

            <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-1">
              <h3 className="text-xs font-bold text-[#0F172A]">{formConfig.title}</h3>
              <p className="text-[11px] text-[#64748B]">{formConfig.description}</p>
            </div>

            {/* Dynamic Form Preview Fields */}
            <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-1">
              {formConfig.fields.map((field) => (
                <div key={field.id} className="space-y-1">
                  <label className="text-xs font-bold text-[#334155] flex items-center justify-between">
                    <span>
                      {field.label} {field.required && <span className="text-[#DC2626]">*</span>}
                    </span>
                    <span className="text-[9px] font-mono text-[#94A3B8]">{field.type}</span>
                  </label>
                  {field.description && (
                    <p className="text-[10px] text-[#64748B]">{field.description}</p>
                  )}

                  {field.type === 'TEXTAREA' ? (
                    <textarea
                      rows={2}
                      placeholder={field.placeholder || `Enter ${field.label}...`}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-[#2563EB]"
                    />
                  ) : field.type === 'SELECT' ? (
                    <select className="w-full px-3 py-1.5 text-xs bg-white border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-[#2563EB] text-[#0F172A]">
                      <option value="">{field.placeholder || `Select ${field.label}...`}</option>
                      {field.options?.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : field.type === 'RADIO' ? (
                    <div className="space-y-1 pt-1">
                      {field.options?.map((opt, oIdx) => (
                        <label key={opt} className="flex items-center space-x-2 text-xs text-[#334155] cursor-pointer">
                          <input type="radio" name={field.id} defaultChecked={oIdx === 0} className="text-[#2563EB]" />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  ) : field.type === 'CHECKBOX' ? (
                    <div className="space-y-1 pt-1">
                      {field.options?.map((opt) => (
                        <label key={opt} className="flex items-center space-x-2 text-xs text-[#334155] cursor-pointer">
                          <input type="checkbox" className="rounded text-[#2563EB]" />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <input
                      type={field.type === 'EMAIL' ? 'email' : field.type === 'NUMBER' ? 'number' : field.type === 'DATE' ? 'date' : 'text'}
                      placeholder={field.placeholder || `Enter ${field.label}...`}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-[#2563EB]"
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-[#E2E8F0]">
              <button
                type="button"
                disabled
                className="w-full py-2 bg-[#2563EB] text-white rounded-xl text-xs font-bold opacity-60 cursor-not-allowed"
              >
                + Add Team Member (Demo Button)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add / Edit Field Modal */}
      {fieldModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#E2E8F0] space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#F1F5F9]">
              <h3 className="text-base font-extrabold text-[#0F172A]">
                {editingFieldIndex !== null ? 'Edit Form Field' : 'Add Form Field'}
              </h3>
              <button
                type="button"
                onClick={() => setFieldModalOpen(false)}
                className="text-xs text-[#64748B] hover:text-[#0F172A]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveField} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#334155]">Field Type</label>
                <select
                  value={fieldForm.type}
                  onChange={(e) => setFieldForm({ ...fieldForm, type: e.target.value as FormFieldType })}
                  className="w-full px-3 py-2 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#2563EB] text-[#0F172A] font-semibold"
                >
                  {FIELD_TYPES.map((ft) => (
                    <option key={ft.type} value={ft.type}>
                      {ft.label} ({ft.type})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#334155]">Field Label*</label>
                <input
                  type="text"
                  required
                  value={fieldForm.label}
                  onChange={(e) => setFieldForm({ ...fieldForm, label: e.target.value })}
                  placeholder="e.g. Student Registration ID"
                  className="w-full px-3 py-2 text-xs bg-white border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#334155]">Placeholder</label>
                <input
                  type="text"
                  value={fieldForm.placeholder || ''}
                  onChange={(e) => setFieldForm({ ...fieldForm, placeholder: e.target.value })}
                  placeholder="e.g. 2026-CS-042"
                  className="w-full px-3 py-2 text-xs bg-white border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#334155]">Helper Description</label>
                <input
                  type="text"
                  value={fieldForm.description || ''}
                  onChange={(e) => setFieldForm({ ...fieldForm, description: e.target.value })}
                  placeholder="e.g. Enter your roll number from your college ID card"
                  className="w-full px-3 py-2 text-xs bg-white border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              {['SELECT', 'MULTI_SELECT', 'RADIO', 'CHECKBOX'].includes(fieldForm.type) && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#334155]">
                    Options List (One option per line)
                  </label>
                  <textarea
                    rows={3}
                    value={optionsText}
                    onChange={(e) => setOptionsText(e.target.value)}
                    placeholder="Option 1&#10;Option 2&#10;Option 3"
                    className="w-full p-2.5 text-xs bg-white border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#2563EB]"
                  />
                </div>
              )}

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="reqCheck"
                  checked={fieldForm.required}
                  onChange={(e) => setFieldForm({ ...fieldForm, required: e.target.checked })}
                  className="rounded text-[#2563EB] focus:ring-[#2563EB]"
                />
                <label htmlFor="reqCheck" className="text-xs font-bold text-[#334155] cursor-pointer">
                  Mandatory field (Participants cannot submit without filling this)
                </label>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-[#F1F5F9]">
                <button
                  type="button"
                  onClick={() => setFieldModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#334155] bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-xl shadow-xs"
                >
                  Save Field
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Field Confirmation Modal */}
      {deleteModalOpen && fieldToDeleteIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-[#E2E8F0] space-y-4">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#0F172A]">Delete Field</h3>
                <p className="text-xs text-[#64748B]">Remove this field from the team member form?</p>
              </div>
            </div>

            <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] text-xs font-bold text-[#0F172A]">
              {formConfig.fields[fieldToDeleteIndex]?.label}
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-[#334155] bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteField}
                className="px-4 py-2 text-xs font-bold text-white bg-[#DC2626] hover:bg-[#B91C1C] rounded-xl shadow-xs"
              >
                Delete Field
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
