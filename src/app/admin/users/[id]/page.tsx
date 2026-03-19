'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/components/admin/Toast';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';

interface UserDetail {
    id: string;
    name: string | null;
    email: string;
    role: string;
    isActive: boolean;
    planId: string | null;
    planName: string | null;
    aiMode: string;
    language: string;
    createdAt: string;
    suspendedAt: string | null;
    businesses: { id: string; name: string; platform: string; createdAt: string }[];
    usages: { month: string; postsGenerated: number; postsPublished: number; reviewsPulled: number }[];
    recentPosts: { id: string; caption: string | null; platform: string; status: string; createdAt: string }[];
    postsUsed: number;
    postsLimit: number;
}

interface Plan {
    id: string;
    name: string;
    displayName: string;
    currency: string;
    interval: string;
}

export default function UserDetailPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const { toast } = useToast();
    const [user, setUser] = useState<UserDetail | null>(null);
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [selectedPlanId, setSelectedPlanId] = useState('');
    const [confirm, setConfirm] = useState<{ type: 'delete' | 'suspend' | 'activate' } | null>(null);
    const [confirmLoading, setConfirmLoading] = useState(false);

    useEffect(() => {
        Promise.all([
            fetch(`/api/admin/users/${id}`).then((r) => r.json()),
            fetch('/api/admin/plans').then((r) => r.json()),
        ])
            .then(([u, p]) => {
                setUser(u);
                setSelectedPlanId(u.planId ?? '');
                setPlans(p.plans ?? []);
            })
            .catch(() => toast('Failed to load user', 'error'))
            .finally(() => setLoading(false));
    }, [id, toast]);

    const handleChangePlan = async () => {
        setSaving(true);
        try {
            const res = await fetch(`/api/admin/users/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ planId: selectedPlanId || null }),
            });
            if (!res.ok) throw new Error();
            toast('Plan updated', 'success');
            const updated = await fetch(`/api/admin/users/${id}`).then((r) => r.json());
            setUser(updated);
        } catch {
            toast('Failed to update plan', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleConfirm = async () => {
        if (!confirm) return;
        setConfirmLoading(true);
        try {
            if (confirm.type === 'delete') {
                await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
                toast('User deleted', 'success');
                router.push('/admin/users');
            } else {
                await fetch(`/api/admin/users/${id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ isActive: confirm.type === 'activate' }),
                });
                toast(confirm.type === 'suspend' ? 'User suspended' : 'User activated', 'success');
                const updated = await fetch(`/api/admin/users/${id}`).then((r) => r.json());
                setUser(updated);
            }
        } catch {
            toast('Action failed', 'error');
        } finally {
            setConfirmLoading(false);
            setConfirm(null);
        }
    };

    const handleImpersonate = async () => {
        toast('Impersonation coming in next sprint', 'info');
    };

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center">
                <div className="flex items-center gap-3 text-slate-400">
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Loading user…
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="p-8 text-center text-slate-400">
                User not found. <Link href="/admin/users" className="text-indigo-400 hover:underline">Back to users</Link>
            </div>
        );
    }

    return (
        <div className="p-6 md:p-8 max-w-[1200px] mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/admin/users" className="p-2 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                </Link>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-white">{user.name ?? user.email}</h1>
                    <p className="text-sm text-slate-400">{user.email}</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleImpersonate}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-slate-700 text-slate-200 hover:bg-slate-600 transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Impersonate
                    </button>
                    {user.isActive ? (
                        <button
                            onClick={() => setConfirm({ type: 'suspend' })}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-amber-900/40 text-amber-400 hover:bg-amber-900/60 border border-amber-700/50 transition-colors"
                        >
                            Suspend
                        </button>
                    ) : (
                        <button
                            onClick={() => setConfirm({ type: 'activate' })}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-emerald-900/40 text-emerald-400 hover:bg-emerald-900/60 border border-emerald-700/50 transition-colors"
                        >
                            Activate
                        </button>
                    )}
                    <button
                        onClick={() => setConfirm({ type: 'delete' })}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-red-900/40 text-red-400 hover:bg-red-900/60 border border-red-700/50 transition-colors"
                    >
                        Delete
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Profile + Plan */}
                <div className="lg:col-span-1 space-y-4">
                    {/* Profile Card */}
                    <div className="bg-slate-800 rounded-2xl border border-slate-700 p-5 space-y-4">
                        <h2 className="text-sm font-semibold text-slate-200">Profile</h2>
                        <div className="space-y-3 text-sm">
                            <InfoRow label="Role">
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${user.role === 'ADMIN' ? 'bg-indigo-900/50 text-indigo-400 border border-indigo-700' : 'bg-slate-700 text-slate-300'}`}>
                                    {user.role}
                                </span>
                            </InfoRow>
                            <InfoRow label="Status">
                                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-full ${user.isActive ? 'bg-emerald-900/40 text-emerald-400' : 'bg-red-900/40 text-red-400'}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${user.isActive ? 'bg-emerald-400' : 'bg-red-400'}`} />
                                    {user.isActive ? 'Active' : 'Suspended'}
                                </span>
                            </InfoRow>
                            <InfoRow label="AI Mode"><span className="text-slate-300">{user.aiMode}</span></InfoRow>
                            <InfoRow label="Language"><span className="text-slate-300">{user.language}</span></InfoRow>
                            <InfoRow label="Joined">
                                <span className="text-slate-300">{new Date(user.createdAt).toLocaleDateString('en', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                            </InfoRow>
                            {user.suspendedAt && (
                                <InfoRow label="Suspended">
                                    <span className="text-red-400 text-xs">{new Date(user.suspendedAt).toLocaleDateString()}</span>
                                </InfoRow>
                            )}
                        </div>
                    </div>

                    {/* Plan Change Card */}
                    <div className="bg-slate-800 rounded-2xl border border-slate-700 p-5 space-y-4">
                        <h2 className="text-sm font-semibold text-slate-200">Plan</h2>
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs font-medium text-slate-400 block mb-1.5">Current Plan</label>
                                <select
                                    value={selectedPlanId}
                                    onChange={(e) => setSelectedPlanId(e.target.value)}
                                    className="w-full px-3 py-2.5 bg-slate-700 border border-slate-600 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                                >
                                    <option value="">No Plan</option>
                                    {plans.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {p.displayName} ({p.currency} / {p.interval})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="text-xs text-slate-500">
                                Posts: {user.postsUsed} / {user.postsLimit}
                                {user.postsLimit > 0 && (
                                    <div className="mt-1.5 w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full ${(user.postsUsed / user.postsLimit) > 0.8 ? 'bg-amber-500' : 'bg-indigo-500'}`}
                                            style={{ width: `${Math.min((user.postsUsed / user.postsLimit) * 100, 100)}%` }}
                                        />
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={handleChangePlan}
                                disabled={saving || selectedPlanId === (user.planId ?? '')}
                                className="w-full py-2 rounded-xl text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {saving ? 'Saving…' : 'Update Plan'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right: Businesses + Usage + Posts */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Businesses */}
                    <div className="bg-slate-800 rounded-2xl border border-slate-700 p-5">
                        <h2 className="text-sm font-semibold text-slate-200 mb-3">
                            Businesses <span className="text-slate-500 font-normal">({user.businesses.length})</span>
                        </h2>
                        {user.businesses.length === 0 ? (
                            <p className="text-sm text-slate-500">No businesses yet</p>
                        ) : (
                            <div className="space-y-2">
                                {user.businesses.map((b) => (
                                    <div key={b.id} className="flex items-center justify-between py-2 border-b border-slate-700/50 last:border-0">
                                        <div>
                                            <p className="text-sm font-medium text-slate-200">{b.name}</p>
                                            <p className="text-xs text-slate-500">{b.platform}</p>
                                        </div>
                                        <span className="text-xs text-slate-500">
                                            {new Date(b.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Usage History */}
                    <div className="bg-slate-800 rounded-2xl border border-slate-700 p-5">
                        <h2 className="text-sm font-semibold text-slate-200 mb-3">Usage History</h2>
                        {user.usages.length === 0 ? (
                            <p className="text-sm text-slate-500">No usage data</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-left border-b border-slate-700">
                                            <th className="pb-2 pr-4">Month</th>
                                            <th className="pb-2 pr-4">Posts Gen.</th>
                                            <th className="pb-2 pr-4">Posts Pub.</th>
                                            <th className="pb-2">Reviews</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-700/50">
                                        {user.usages.map((u) => (
                                            <tr key={u.month}>
                                                <td className="py-2 pr-4 text-slate-300 font-medium">{u.month}</td>
                                                <td className="py-2 pr-4 text-slate-400">{u.postsGenerated}</td>
                                                <td className="py-2 pr-4 text-slate-400">{u.postsPublished}</td>
                                                <td className="py-2 text-slate-400">{u.reviewsPulled}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Recent Posts */}
                    <div className="bg-slate-800 rounded-2xl border border-slate-700 p-5">
                        <h2 className="text-sm font-semibold text-slate-200 mb-3">Recent Posts</h2>
                        {user.recentPosts.length === 0 ? (
                            <p className="text-sm text-slate-500">No posts yet</p>
                        ) : (
                            <div className="space-y-2">
                                {user.recentPosts.map((p) => (
                                    <div key={p.id} className="flex items-start justify-between py-2 border-b border-slate-700/50 last:border-0 gap-4">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-slate-300 truncate">{p.caption ?? '(no caption)'}</p>
                                            <p className="text-xs text-slate-500 mt-0.5">{p.platform} · {new Date(p.createdAt).toLocaleDateString()}</p>
                                        </div>
                                        <PostStatusBadge status={p.status} />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <ConfirmDialog
                open={!!confirm}
                title={confirm?.type === 'delete' ? 'Delete User' : confirm?.type === 'suspend' ? 'Suspend User' : 'Activate User'}
                message={
                    confirm?.type === 'delete'
                        ? `Permanently delete ${user.name ?? user.email}? All data will be lost.`
                        : confirm?.type === 'suspend'
                        ? `Suspend ${user.name ?? user.email}?`
                        : `Reactivate ${user.name ?? user.email}?`
                }
                confirmLabel={confirm?.type === 'delete' ? 'Delete' : confirm?.type === 'suspend' ? 'Suspend' : 'Activate'}
                confirmClass={
                    confirm?.type === 'delete' ? 'bg-red-600 hover:bg-red-700' :
                    confirm?.type === 'suspend' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'
                }
                onConfirm={handleConfirm}
                onCancel={() => setConfirm(null)}
                loading={confirmLoading}
            />
        </div>
    );
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between">
            <span className="text-slate-500">{label}</span>
            <div>{children}</div>
        </div>
    );
}

function PostStatusBadge({ status }: { status: string }) {
    const styles: Record<string, string> = {
        PUBLISHED: 'bg-emerald-900/40 text-emerald-400',
        QUEUED: 'bg-indigo-900/40 text-indigo-400',
        FAILED: 'bg-red-900/40 text-red-400',
    };
    return (
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${styles[status] ?? 'bg-slate-700 text-slate-400'}`}>
            {status}
        </span>
    );
}
