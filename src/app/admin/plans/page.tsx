'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@/components/admin/Toast';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';

interface Plan {
    id: string;
    name: string;
    displayName: string;
    price: string;
    currency: string;
    interval: string;
    postsLimit: number;
    reviewsLimit: number;
    templatesLimit: number;
    platformsAllowed: string[];
    features: Record<string, boolean>;
    isActive: boolean;
    sortOrder: number;
    userCount?: number;
}

const BLANK_PLAN: Omit<Plan, 'id' | 'userCount'> = {
    name: '',
    displayName: '',
    price: '0',
    currency: 'USD',
    interval: 'MONTHLY',
    postsLimit: 30,
    reviewsLimit: 100,
    templatesLimit: 3,
    platformsAllowed: ['INSTAGRAM'],
    features: {},
    isActive: true,
    sortOrder: 0,
};

export default function AdminPlansPage() {
    const { toast } = useToast();
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [editPlan, setEditPlan] = useState<Partial<Plan> | null>(null);
    const [savingPlan, setSavingPlan] = useState(false);
    const [deletePlan, setDeletePlan] = useState<Plan | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [previewPlan, setPreviewPlan] = useState<Plan | null>(null);

    const fetchPlans = () => {
        setLoading(true);
        fetch('/api/admin/plans')
            .then((r) => r.json())
            .then((d) => setPlans(d.plans ?? []))
            .catch(() => toast('Failed to load plans', 'error'))
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchPlans(); }, []);

    const handleSave = async () => {
        if (!editPlan) return;
        setSavingPlan(true);
        try {
            const isNew = !editPlan.id;
            const res = await fetch(
                isNew ? '/api/admin/plans' : `/api/admin/plans/${editPlan.id}`,
                {
                    method: isNew ? 'POST' : 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(editPlan),
                }
            );
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error ?? 'Save failed');
            }
            toast(isNew ? 'Plan created' : 'Plan updated', 'success');
            setEditPlan(null);
            fetchPlans();
        } catch (e: unknown) {
            toast((e as Error).message ?? 'Save failed', 'error');
        } finally {
            setSavingPlan(false);
        }
    };

    const handleDelete = async () => {
        if (!deletePlan) return;
        setDeleteLoading(true);
        try {
            await fetch(`/api/admin/plans/${deletePlan.id}`, { method: 'DELETE' });
            toast('Plan deleted', 'success');
            fetchPlans();
        } catch {
            toast('Delete failed', 'error');
        } finally {
            setDeleteLoading(false);
            setDeletePlan(null);
        }
    };

    const toggleActive = async (plan: Plan) => {
        try {
            await fetch(`/api/admin/plans/${plan.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: !plan.isActive }),
            });
            toast(`Plan ${plan.isActive ? 'deactivated' : 'activated'}`, 'success');
            fetchPlans();
        } catch {
            toast('Action failed', 'error');
        }
    };

    return (
        <div className="p-6 md:p-8 max-w-[1200px] mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Plans</h1>
                    <p className="text-sm text-slate-400 mt-0.5">Manage pricing plans and limits</p>
                </div>
                <button
                    onClick={() => setEditPlan({ ...BLANK_PLAN })}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    New Plan
                </button>
            </div>

            {/* Plans Table */}
            <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-700">
                                <th className="px-5 py-3.5">Plan</th>
                                <th className="px-5 py-3.5">Price</th>
                                <th className="px-5 py-3.5">Limits</th>
                                <th className="px-5 py-3.5">Users</th>
                                <th className="px-5 py-3.5">Status</th>
                                <th className="px-5 py-3.5">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                            {loading ? (
                                Array.from({ length: 4 }).map((_, i) => (
                                    <tr key={i}>
                                        {Array.from({ length: 6 }).map((_, j) => (
                                            <td key={j} className="px-5 py-4">
                                                <div className="h-4 bg-slate-700 rounded animate-pulse" />
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : plans.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-5 py-12 text-center text-slate-500">
                                        No plans yet. <button onClick={() => setEditPlan({ ...BLANK_PLAN })} className="text-indigo-400 hover:underline">Create one</button>
                                    </td>
                                </tr>
                            ) : (
                                plans.map((plan) => (
                                    <tr key={plan.id} className="hover:bg-slate-700/30 transition-colors">
                                        <td className="px-5 py-4">
                                            <div className="font-semibold text-slate-200">{plan.displayName}</div>
                                            <div className="text-xs text-slate-500 font-mono">{plan.name} · {plan.interval}</div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className="text-lg font-bold text-white">{plan.price}</span>
                                            <span className="text-xs text-slate-500 ml-1">{plan.currency}</span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="text-xs space-y-0.5 text-slate-400">
                                                <div>{plan.postsLimit} posts/mo</div>
                                                <div>{plan.reviewsLimit} reviews</div>
                                                <div>{plan.templatesLimit} templates</div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className="text-slate-300 font-semibold">{plan.userCount ?? 0}</span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <button onClick={() => toggleActive(plan)} className="group flex items-center gap-1.5">
                                                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-full transition-colors ${
                                                    plan.isActive
                                                        ? 'bg-emerald-900/40 text-emerald-400 group-hover:bg-emerald-900/60'
                                                        : 'bg-slate-700 text-slate-400 group-hover:bg-slate-600'
                                                }`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${plan.isActive ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                                                    {plan.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </button>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => setPreviewPlan(plan)}
                                                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-slate-700 transition-colors"
                                                    title="Preview"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => setEditPlan({ ...plan })}
                                                    className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-400 hover:bg-slate-700 transition-colors"
                                                    title="Edit"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => setDeletePlan(plan)}
                                                    className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-700 transition-colors"
                                                    title="Delete"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit/Create Plan Modal */}
            {editPlan && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setEditPlan(null)} />
                    <div className="relative bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 flex items-center justify-between px-6 py-4 border-b border-slate-700 bg-slate-800 rounded-t-2xl">
                            <h2 className="text-base font-semibold text-white">
                                {editPlan.id ? 'Edit Plan' : 'New Plan'}
                            </h2>
                            <button onClick={() => setEditPlan(null)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-700">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <FormField label="Name (code)">
                                    <input
                                        type="text"
                                        value={editPlan.name ?? ''}
                                        onChange={(e) => setEditPlan({ ...editPlan, name: e.target.value.toUpperCase() })}
                                        placeholder="STARTER"
                                        className="admin-input"
                                    />
                                </FormField>
                                <FormField label="Display Name">
                                    <input
                                        type="text"
                                        value={editPlan.displayName ?? ''}
                                        onChange={(e) => setEditPlan({ ...editPlan, displayName: e.target.value })}
                                        placeholder="Starter"
                                        className="admin-input"
                                    />
                                </FormField>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <FormField label="Price">
                                    <input
                                        type="number"
                                        value={editPlan.price ?? '0'}
                                        onChange={(e) => setEditPlan({ ...editPlan, price: e.target.value })}
                                        className="admin-input"
                                    />
                                </FormField>
                                <FormField label="Currency">
                                    <select
                                        value={editPlan.currency ?? 'USD'}
                                        onChange={(e) => setEditPlan({ ...editPlan, currency: e.target.value })}
                                        className="admin-input"
                                    >
                                        <option>USD</option>
                                        <option>SAR</option>
                                        <option>TL</option>
                                    </select>
                                </FormField>
                                <FormField label="Interval">
                                    <select
                                        value={editPlan.interval ?? 'MONTHLY'}
                                        onChange={(e) => setEditPlan({ ...editPlan, interval: e.target.value })}
                                        className="admin-input"
                                    >
                                        <option value="MONTHLY">Monthly</option>
                                        <option value="YEARLY">Yearly</option>
                                    </select>
                                </FormField>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <FormField label="Posts / Month">
                                    <input
                                        type="number"
                                        value={editPlan.postsLimit ?? 30}
                                        onChange={(e) => setEditPlan({ ...editPlan, postsLimit: Number(e.target.value) })}
                                        className="admin-input"
                                    />
                                </FormField>
                                <FormField label="Reviews Limit">
                                    <input
                                        type="number"
                                        value={editPlan.reviewsLimit ?? 100}
                                        onChange={(e) => setEditPlan({ ...editPlan, reviewsLimit: Number(e.target.value) })}
                                        className="admin-input"
                                    />
                                </FormField>
                                <FormField label="Templates Limit">
                                    <input
                                        type="number"
                                        value={editPlan.templatesLimit ?? 3}
                                        onChange={(e) => setEditPlan({ ...editPlan, templatesLimit: Number(e.target.value) })}
                                        className="admin-input"
                                    />
                                </FormField>
                            </div>
                            <FormField label="Sort Order">
                                <input
                                    type="number"
                                    value={editPlan.sortOrder ?? 0}
                                    onChange={(e) => setEditPlan({ ...editPlan, sortOrder: Number(e.target.value) })}
                                    className="admin-input w-24"
                                />
                            </FormField>
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    checked={editPlan.isActive ?? true}
                                    onChange={(e) => setEditPlan({ ...editPlan, isActive: e.target.checked })}
                                    className="w-4 h-4 rounded accent-indigo-500"
                                />
                                <label htmlFor="isActive" className="text-sm text-slate-300">Active (visible to users)</label>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 px-6 pb-6">
                            <button
                                onClick={() => setEditPlan(null)}
                                className="px-4 py-2 rounded-xl text-sm font-medium text-slate-300 hover:bg-slate-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={savingPlan}
                                className="px-5 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors disabled:opacity-50"
                            >
                                {savingPlan ? 'Saving…' : editPlan.id ? 'Save Changes' : 'Create Plan'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Preview Modal */}
            {previewPlan && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setPreviewPlan(null)} />
                    <div className="relative bg-white rounded-2xl shadow-2xl w-80 overflow-hidden">
                        <div className="p-6">
                            <div className="text-center mb-4">
                                <h3 className="text-xl font-bold text-gray-900">{previewPlan.displayName}</h3>
                                <div className="mt-2">
                                    <span className="text-4xl font-extrabold text-gray-900">
                                        {previewPlan.currency === 'USD' ? '$' : previewPlan.currency === 'SAR' ? '﷼' : '₺'}{previewPlan.price}
                                    </span>
                                    <span className="text-gray-500 text-sm">/{previewPlan.interval === 'MONTHLY' ? 'mo' : 'yr'}</span>
                                </div>
                            </div>
                            <ul className="space-y-2 text-sm text-gray-600">
                                <li className="flex items-center gap-2"><span className="text-green-500">✓</span> {previewPlan.postsLimit} posts per month</li>
                                <li className="flex items-center gap-2"><span className="text-green-500">✓</span> {previewPlan.reviewsLimit} reviews</li>
                                <li className="flex items-center gap-2"><span className="text-green-500">✓</span> {previewPlan.templatesLimit} templates</li>
                                {(previewPlan.platformsAllowed ?? []).map((p) => (
                                    <li key={p} className="flex items-center gap-2"><span className="text-green-500">✓</span> {p}</li>
                                ))}
                            </ul>
                            <button
                                onClick={() => setPreviewPlan(null)}
                                className="mt-4 w-full py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 transition-colors"
                            >
                                Close Preview
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmDialog
                open={!!deletePlan}
                title="Delete Plan"
                message={`Delete the "${deletePlan?.displayName}" plan? Users on this plan will lose their plan assignment.`}
                confirmLabel="Delete Plan"
                onConfirm={handleDelete}
                onCancel={() => setDeletePlan(null)}
                loading={deleteLoading}
            />

            <style jsx global>{`
                .admin-input {
                    width: 100%;
                    padding: 0.5rem 0.75rem;
                    background: rgb(51 65 85);
                    border: 1px solid rgb(71 85 105);
                    border-radius: 0.75rem;
                    font-size: 0.875rem;
                    color: rgb(226 232 240);
                    outline: none;
                }
                .admin-input:focus {
                    border-color: rgb(99 102 241);
                    box-shadow: 0 0 0 1px rgb(99 102 241);
                }
            `}</style>
        </div>
    );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">{label}</label>
            {children}
        </div>
    );
}
