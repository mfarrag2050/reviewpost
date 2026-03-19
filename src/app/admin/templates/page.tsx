'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@/components/admin/Toast';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';

interface Template {
    id: string;
    name: string;
    htmlContent: string;
    thumbnailUrl: string | null;
    category: string;
    isRtl: boolean;
    isActive: boolean;
    isDefault: boolean;
    createdAt: string;
}

const BLANK_TEMPLATE: Omit<Template, 'id' | 'createdAt'> = {
    name: '',
    htmlContent: `<!DOCTYPE html>
<html>
<head>
  <style>
    body { margin: 0; font-family: sans-serif; width: 1080px; height: 1080px; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
    .card { background: white; border-radius: 24px; padding: 48px; max-width: 800px; text-align: center; }
    .stars { color: #f59e0b; font-size: 32px; margin-bottom: 16px; }
    .review { font-size: 24px; color: #1f2937; line-height: 1.6; }
    .author { margin-top: 24px; font-size: 18px; color: #6b7280; }
    .brand { margin-top: 32px; font-size: 20px; font-weight: bold; color: #4f46e5; }
  </style>
</head>
<body>
  <div class="card">
    <div class="stars">★★★★★</div>
    <div class="review">{{review_text}}</div>
    <div class="author">— {{author_name}}</div>
    <div class="brand">{{business_name}}</div>
  </div>
</body>
</html>`,
    thumbnailUrl: null,
    category: 'REVIEW',
    isRtl: false,
    isActive: true,
    isDefault: false,
};

export default function AdminTemplatesPage() {
    const { toast } = useToast();
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(true);
    const [editTemplate, setEditTemplate] = useState<Partial<Template> | null>(null);
    const [savingTemplate, setSavingTemplate] = useState(false);
    const [deleteTemplate, setDeleteTemplate] = useState<Template | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [previewHtml, setPreviewHtml] = useState('');

    const fetchTemplates = () => {
        setLoading(true);
        fetch('/api/admin/templates')
            .then((r) => r.json())
            .then((d) => setTemplates(d.templates ?? []))
            .catch(() => toast('Failed to load templates', 'error'))
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchTemplates(); }, []);

    const handleSave = async () => {
        if (!editTemplate) return;
        setSavingTemplate(true);
        try {
            const isNew = !editTemplate.id;
            const res = await fetch(
                isNew ? '/api/admin/templates' : `/api/admin/templates/${editTemplate.id}`,
                {
                    method: isNew ? 'POST' : 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(editTemplate),
                }
            );
            if (!res.ok) throw new Error('Save failed');
            toast(isNew ? 'Template created' : 'Template updated', 'success');
            setEditTemplate(null);
            setPreviewHtml('');
            fetchTemplates();
        } catch {
            toast('Save failed', 'error');
        } finally {
            setSavingTemplate(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteTemplate) return;
        setDeleteLoading(true);
        try {
            await fetch(`/api/admin/templates/${deleteTemplate.id}`, { method: 'DELETE' });
            toast('Template deleted', 'success');
            fetchTemplates();
        } catch {
            toast('Delete failed', 'error');
        } finally {
            setDeleteLoading(false);
            setDeleteTemplate(null);
        }
    };

    const toggleActive = async (template: Template) => {
        try {
            await fetch(`/api/admin/templates/${template.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: !template.isActive }),
            });
            toast(`Template ${template.isActive ? 'deactivated' : 'activated'}`, 'success');
            fetchTemplates();
        } catch {
            toast('Action failed', 'error');
        }
    };

    const setDefault = async (template: Template) => {
        try {
            await fetch(`/api/admin/templates/${template.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isDefault: true }),
            });
            toast('Set as default template', 'success');
            fetchTemplates();
        } catch {
            toast('Action failed', 'error');
        }
    };

    const CATEGORIES = ['REVIEW', 'PRODUCT', 'CAROUSEL', 'STORY'];

    return (
        <div className="p-6 md:p-8 max-w-[1400px] mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Templates</h1>
                    <p className="text-sm text-slate-400 mt-0.5">Manage post templates</p>
                </div>
                <button
                    onClick={() => { setEditTemplate({ ...BLANK_TEMPLATE }); setPreviewHtml(BLANK_TEMPLATE.htmlContent); }}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    New Template
                </button>
            </div>

            {/* Template Grid */}
            {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="bg-slate-800 rounded-2xl border border-slate-700 animate-pulse h-64" />
                    ))}
                </div>
            ) : templates.length === 0 ? (
                <div className="bg-slate-800 rounded-2xl border border-slate-700 py-16 text-center">
                    <p className="text-slate-400 mb-3">No templates yet</p>
                    <button
                        onClick={() => setEditTemplate({ ...BLANK_TEMPLATE })}
                        className="text-indigo-400 hover:underline text-sm"
                    >
                        Create first template
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {templates.map((template) => (
                        <TemplateCard
                            key={template.id}
                            template={template}
                            onEdit={() => { setEditTemplate({ ...template }); setPreviewHtml(template.htmlContent); }}
                            onDelete={() => setDeleteTemplate(template)}
                            onToggleActive={() => toggleActive(template)}
                            onSetDefault={() => setDefault(template)}
                        />
                    ))}
                </div>
            )}

            {/* Edit/Create Template Modal */}
            {editTemplate && (
                <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto">
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => { setEditTemplate(null); setPreviewHtml(''); }} />
                    <div className="relative bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl w-full max-w-5xl my-4">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
                            <h2 className="text-base font-semibold text-white">
                                {editTemplate.id ? 'Edit Template' : 'New Template'}
                            </h2>
                            <button onClick={() => { setEditTemplate(null); setPreviewHtml(''); }} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-700">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                            {/* Left: Form */}
                            <div className="p-6 space-y-4 border-r border-slate-700">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-400 mb-1.5">Name</label>
                                        <input
                                            type="text"
                                            value={editTemplate.name ?? ''}
                                            onChange={(e) => setEditTemplate({ ...editTemplate, name: e.target.value })}
                                            placeholder="Template name"
                                            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-400 mb-1.5">Category</label>
                                        <select
                                            value={editTemplate.category ?? 'REVIEW'}
                                            onChange={(e) => setEditTemplate({ ...editTemplate, category: e.target.value })}
                                            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                                        >
                                            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Thumbnail URL (optional)</label>
                                    <input
                                        type="text"
                                        value={editTemplate.thumbnailUrl ?? ''}
                                        onChange={(e) => setEditTemplate({ ...editTemplate, thumbnailUrl: e.target.value || null })}
                                        placeholder="https://…"
                                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                                    />
                                </div>

                                <div className="flex items-center gap-6">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={editTemplate.isRtl ?? false}
                                            onChange={(e) => setEditTemplate({ ...editTemplate, isRtl: e.target.checked })}
                                            className="w-4 h-4 accent-indigo-500"
                                        />
                                        <span className="text-sm text-slate-300">RTL (Arabic)</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={editTemplate.isActive ?? true}
                                            onChange={(e) => setEditTemplate({ ...editTemplate, isActive: e.target.checked })}
                                            className="w-4 h-4 accent-indigo-500"
                                        />
                                        <span className="text-sm text-slate-300">Active</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={editTemplate.isDefault ?? false}
                                            onChange={(e) => setEditTemplate({ ...editTemplate, isDefault: e.target.checked })}
                                            className="w-4 h-4 accent-indigo-500"
                                        />
                                        <span className="text-sm text-slate-300">Default</span>
                                    </label>
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <label className="text-xs font-medium text-slate-400">HTML Content</label>
                                        <button
                                            onClick={() => setPreviewHtml(editTemplate.htmlContent ?? '')}
                                            className="text-xs text-indigo-400 hover:text-indigo-300"
                                        >
                                            Refresh Preview →
                                        </button>
                                    </div>
                                    <textarea
                                        value={editTemplate.htmlContent ?? ''}
                                        onChange={(e) => setEditTemplate({ ...editTemplate, htmlContent: e.target.value })}
                                        rows={16}
                                        className="w-full px-3 py-2.5 bg-slate-900 border border-slate-600 rounded-xl text-xs text-slate-300 font-mono focus:outline-none focus:border-indigo-500 resize-none"
                                    />
                                </div>
                            </div>

                            {/* Right: Live Preview */}
                            <div className="p-6">
                                <p className="text-xs font-medium text-slate-400 mb-3">Live Preview</p>
                                <div className="border border-slate-700 rounded-xl overflow-hidden bg-white" style={{ height: '400px' }}>
                                    {previewHtml ? (
                                        <iframe
                                            srcDoc={previewHtml}
                                            className="w-full h-full border-0"
                                            sandbox="allow-scripts"
                                            title="Template Preview"
                                        />
                                    ) : (
                                        <div className="h-full flex items-center justify-center bg-slate-900 text-slate-500 text-sm">
                                            Click &quot;Refresh Preview&quot; to see output
                                        </div>
                                    )}
                                </div>
                                        <p className="text-xs text-slate-600 mt-2">
                                            Variables: {'{{'+'review_text'+'}}'},  {'{{'+'author_name'+'}}'},  {'{{'+'business_name'+'}}'},  {'{{'+'rating'+'}}'}
                                        </p>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-700">
                            <button onClick={() => { setEditTemplate(null); setPreviewHtml(''); }} className="px-4 py-2 rounded-xl text-sm font-medium text-slate-300 hover:bg-slate-700 transition-colors">
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={savingTemplate}
                                className="px-5 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors disabled:opacity-50"
                            >
                                {savingTemplate ? 'Saving…' : editTemplate.id ? 'Save Changes' : 'Create Template'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmDialog
                open={!!deleteTemplate}
                title="Delete Template"
                message={`Delete "${deleteTemplate?.name}"? Posts using this template will lose their template reference.`}
                confirmLabel="Delete Template"
                onConfirm={handleDelete}
                onCancel={() => setDeleteTemplate(null)}
                loading={deleteLoading}
            />
        </div>
    );
}

function TemplateCard({
    template,
    onEdit,
    onDelete,
    onToggleActive,
    onSetDefault,
}: {
    template: Template;
    onEdit: () => void;
    onDelete: () => void;
    onToggleActive: () => void;
    onSetDefault: () => void;
}) {
    return (
        <div className={`bg-slate-800 rounded-2xl border overflow-hidden group transition-all ${template.isActive ? 'border-slate-700' : 'border-slate-700/50 opacity-60'}`}>
            {/* Thumbnail */}
            <div className="relative h-36 bg-slate-900 overflow-hidden">
                {template.thumbnailUrl ? (
                    <img src={template.thumbnailUrl} alt={template.name} className="w-full h-full object-cover" />
                ) : (
                    <iframe
                        srcDoc={template.htmlContent}
                        className="w-full h-full border-0 pointer-events-none"
                        style={{ transform: 'scale(0.25)', transformOrigin: 'top left', width: '400%', height: '400%' }}
                        sandbox=""
                        title={template.name}
                    />
                )}
                {/* Badges */}
                <div className="absolute top-2 left-2 flex gap-1">
                    {template.isDefault && (
                        <span className="text-[10px] font-bold bg-amber-500 text-white px-1.5 py-0.5 rounded-md">DEFAULT</span>
                    )}
                    {template.isRtl && (
                        <span className="text-[10px] font-bold bg-indigo-600 text-white px-1.5 py-0.5 rounded-md">RTL</span>
                    )}
                </div>
                {/* Hover actions */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                        onClick={onEdit}
                        className="px-3 py-1.5 rounded-lg bg-white text-slate-900 text-xs font-semibold hover:bg-slate-100 transition-colors"
                    >
                        Edit
                    </button>
                    {!template.isDefault && (
                        <button
                            onClick={onSetDefault}
                            className="px-3 py-1.5 rounded-lg bg-amber-500 text-white text-xs font-semibold hover:bg-amber-600 transition-colors"
                        >
                            Set Default
                        </button>
                    )}
                </div>
            </div>
            {/* Info */}
            <div className="p-3">
                <div className="flex items-start justify-between gap-2">
                    <div>
                        <p className="text-sm font-semibold text-slate-200 truncate">{template.name}</p>
                        <p className="text-xs text-slate-500">{template.category}</p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                            onClick={onToggleActive}
                            title={template.isActive ? 'Deactivate' : 'Activate'}
                            className={`p-1 rounded-lg text-xs transition-colors ${template.isActive ? 'text-emerald-400 hover:bg-slate-700' : 'text-slate-500 hover:bg-slate-700'}`}
                        >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d={template.isActive
                                    ? "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"
                                    : "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"}
                                />
                            </svg>
                        </button>
                        <button
                            onClick={onDelete}
                            title="Delete"
                            className="p-1 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-700 transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
