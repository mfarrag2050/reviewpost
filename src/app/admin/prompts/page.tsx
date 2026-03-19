'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@/components/admin/Toast';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';

interface Prompt {
    id: string;
    key: string;
    name: string;
    content: string;
    isActive: boolean;
    updatedAt: string;
}

const BLANK_PROMPT: Omit<Prompt, 'id' | 'updatedAt'> = {
    key: '',
    name: '',
    content: '',
    isActive: true,
};

export default function AdminPromptsPage() {
    const { toast } = useToast();
    const [prompts, setPrompts] = useState<Prompt[]>([]);
    const [loading, setLoading] = useState(true);
    const [editPrompt, setEditPrompt] = useState<Partial<Prompt> | null>(null);
    const [saving, setSaving] = useState(false);
    const [deletePrompt, setDeletePrompt] = useState<Prompt | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const fetchPrompts = () => {
        setLoading(true);
        fetch('/api/admin/prompts')
            .then((r) => r.json())
            .then((d) => setPrompts(d.prompts ?? []))
            .catch(() => toast('Failed to load prompts', 'error'))
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchPrompts(); }, []);

    const handleSave = async () => {
        if (!editPrompt) return;
        setSaving(true);
        try {
            const isNew = !editPrompt.id;
            const res = await fetch(
                isNew ? '/api/admin/prompts' : `/api/admin/prompts/${editPrompt.id}`,
                {
                    method: isNew ? 'POST' : 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(editPrompt),
                }
            );
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error ?? 'Save failed');
            }
            toast(isNew ? 'Prompt created' : 'Prompt updated', 'success');
            setEditPrompt(null);
            fetchPrompts();
        } catch (e: unknown) {
            toast((e as Error).message ?? 'Save failed', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deletePrompt) return;
        setDeleteLoading(true);
        try {
            await fetch(`/api/admin/prompts/${deletePrompt.id}`, { method: 'DELETE' });
            toast('Prompt deleted', 'success');
            fetchPrompts();
        } catch {
            toast('Delete failed', 'error');
        } finally {
            setDeleteLoading(false);
            setDeletePrompt(null);
        }
    };

    const toggleActive = async (prompt: Prompt) => {
        try {
            await fetch(`/api/admin/prompts/${prompt.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: !prompt.isActive }),
            });
            toast(`Prompt ${prompt.isActive ? 'deactivated' : 'activated'}`, 'success');
            fetchPrompts();
        } catch {
            toast('Action failed', 'error');
        }
    };

    return (
        <div className="p-6 md:p-8 max-w-[1200px] mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">AI Prompts</h1>
                    <p className="text-sm text-slate-400 mt-0.5">Manage prompt templates used by the AI</p>
                </div>
                <button
                    onClick={() => setEditPrompt({ ...BLANK_PROMPT })}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    New Prompt
                </button>
            </div>

            {loading ? (
                <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="bg-slate-800 rounded-2xl border border-slate-700 animate-pulse h-24" />
                    ))}
                </div>
            ) : prompts.length === 0 ? (
                <div className="bg-slate-800 rounded-2xl border border-slate-700 py-16 text-center">
                    <p className="text-slate-400 mb-3">No prompts yet</p>
                    <button onClick={() => setEditPrompt({ ...BLANK_PROMPT })} className="text-indigo-400 hover:underline text-sm">
                        Create first prompt
                    </button>
                </div>
            ) : (
                <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-700">
                                <th className="px-5 py-3.5">Name</th>
                                <th className="px-5 py-3.5">Key</th>
                                <th className="px-5 py-3.5">Preview</th>
                                <th className="px-5 py-3.5">Updated</th>
                                <th className="px-5 py-3.5">Status</th>
                                <th className="px-5 py-3.5">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                            {prompts.map((prompt) => (
                                <tr key={prompt.id} className="hover:bg-slate-700/30 transition-colors">
                                    <td className="px-5 py-4">
                                        <span className="font-medium text-slate-200">{prompt.name}</span>
                                    </td>
                                    <td className="px-5 py-4">
                                        <code className="text-xs bg-slate-700 text-indigo-400 px-2 py-0.5 rounded-md font-mono">{prompt.key}</code>
                                    </td>
                                    <td className="px-5 py-4 max-w-xs">
                                        <p className="text-xs text-slate-500 truncate">{prompt.content}</p>
                                    </td>
                                    <td className="px-5 py-4 text-xs text-slate-500">
                                        {new Date(prompt.updatedAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-full ${prompt.isActive ? 'bg-emerald-900/40 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${prompt.isActive ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                                            {prompt.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => toggleActive(prompt)}
                                                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-slate-700 transition-colors"
                                                title={prompt.isActive ? 'Deactivate' : 'Activate'}
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    {prompt.isActive
                                                        ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                                        : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />}
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => setEditPrompt({ ...prompt })}
                                                className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-400 hover:bg-slate-700 transition-colors"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => setDeletePrompt(prompt)}
                                                className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-700 transition-colors"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Edit Modal */}
            {editPrompt && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setEditPrompt(null)} />
                    <div className="relative bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl w-full max-w-2xl">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
                            <h2 className="text-base font-semibold text-white">
                                {editPrompt.id ? 'Edit Prompt' : 'New Prompt'}
                            </h2>
                            <button onClick={() => setEditPrompt(null)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-700">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Name</label>
                                    <input
                                        type="text"
                                        value={editPrompt.name ?? ''}
                                        onChange={(e) => setEditPrompt({ ...editPrompt, name: e.target.value })}
                                        placeholder="Instagram Caption"
                                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Key (unique identifier)</label>
                                    <input
                                        type="text"
                                        value={editPrompt.key ?? ''}
                                        onChange={(e) => setEditPrompt({ ...editPrompt, key: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                                        placeholder="instagram_caption"
                                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-xl text-sm text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1.5">Prompt Content</label>
                                <p className="text-xs text-slate-600 mb-2">Variables: {'{{review_text}}'}, {'{{rating}}'}, {'{{business_name}}'}, {'{{author_name}}'}, {'{{language}}'}</p>
                                <textarea
                                    value={editPrompt.content ?? ''}
                                    onChange={(e) => setEditPrompt({ ...editPrompt, content: e.target.value })}
                                    rows={10}
                                    placeholder="Write an engaging Instagram caption based on this customer review: {{review_text}}..."
                                    className="w-full px-3 py-2.5 bg-slate-900 border border-slate-600 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-indigo-500 resize-none"
                                />
                            </div>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={editPrompt.isActive ?? true}
                                    onChange={(e) => setEditPrompt({ ...editPrompt, isActive: e.target.checked })}
                                    className="w-4 h-4 accent-indigo-500"
                                />
                                <span className="text-sm text-slate-300">Active</span>
                            </label>
                        </div>
                        <div className="flex justify-end gap-3 px-6 pb-6">
                            <button onClick={() => setEditPrompt(null)} className="px-4 py-2 rounded-xl text-sm font-medium text-slate-300 hover:bg-slate-700 transition-colors">
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-5 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors disabled:opacity-50"
                            >
                                {saving ? 'Saving…' : editPrompt.id ? 'Save Changes' : 'Create Prompt'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmDialog
                open={!!deletePrompt}
                title="Delete Prompt"
                message={`Delete "${deletePrompt?.name}"? This cannot be undone.`}
                confirmLabel="Delete Prompt"
                onConfirm={handleDelete}
                onCancel={() => setDeletePrompt(null)}
                loading={deleteLoading}
            />
        </div>
    );
}
