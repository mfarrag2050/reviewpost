'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useToast } from '@/components/admin/Toast';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';

interface AdminUser {
    id: string;
    name: string | null;
    email: string;
    role: string;
    planName: string | null;
    postsUsed: number;
    postsLimit: number;
    isActive: boolean;
    createdAt: string;
    businessCount: number;
}

interface UsersResponse {
    users: AdminUser[];
    total: number;
    page: number;
    pages: number;
}

const PLAN_OPTIONS = ['All', 'STARTER', 'GROWTH', 'AGENCY'];
const STATUS_OPTIONS = ['All', 'Active', 'Suspended'];

export default function AdminUsersPage() {
    const { toast } = useToast();
    const [data, setData] = useState<UsersResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [planFilter, setPlanFilter] = useState('All');
    const [statusFilter, setStatusFilter] = useState('All');
    const [page, setPage] = useState(1);
    const [sortField, setSortField] = useState<'name' | 'createdAt' | 'postsUsed'>('createdAt');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
    const [actionUserId, setActionUserId] = useState<string | null>(null);
    const [confirmAction, setConfirmAction] = useState<{ type: 'delete' | 'suspend' | 'activate'; userId: string; userName: string } | null>(null);
    const [actionLoading, setActionLoading] = useState(false);

    const fetchUsers = useCallback(() => {
        setLoading(true);
        const params = new URLSearchParams({
            page: String(page),
            search,
            plan: planFilter === 'All' ? '' : planFilter,
            status: statusFilter === 'All' ? '' : statusFilter.toLowerCase(),
            sortField,
            sortDir,
        });
        fetch(`/api/admin/users?${params}`)
            .then((r) => r.json())
            .then(setData)
            .catch(() => toast('Failed to load users', 'error'))
            .finally(() => setLoading(false));
    }, [page, search, planFilter, statusFilter, sortField, sortDir, toast]);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    const handleSort = (field: typeof sortField) => {
        if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        else { setSortField(field); setSortDir('asc'); }
    };

    const handleAction = async () => {
        if (!confirmAction) return;
        setActionLoading(true);
        try {
            const { type, userId } = confirmAction;
            if (type === 'delete') {
                await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
                toast('User deleted', 'success');
            } else {
                await fetch(`/api/admin/users/${userId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ isActive: type === 'activate' }),
                });
                toast(type === 'suspend' ? 'User suspended' : 'User activated', 'success');
            }
            fetchUsers();
        } catch {
            toast('Action failed', 'error');
        } finally {
            setActionLoading(false);
            setConfirmAction(null);
        }
    };

    const SortIcon = ({ field }: { field: typeof sortField }) => (
        <svg className={`w-3.5 h-3.5 inline ml-1 ${sortField === field ? 'text-indigo-400' : 'text-slate-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {sortField === field && sortDir === 'desc'
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />}
        </svg>
    );

    return (
        <div className="p-6 md:p-8 max-w-[1400px] mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Users</h1>
                    <p className="text-sm text-slate-400 mt-0.5">
                        {data ? `${data.total} total users` : 'Loading…'}
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-slate-800 rounded-2xl border border-slate-700 p-4 flex flex-wrap gap-3">
                <div className="flex-1 min-w-[200px] relative">
                    <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Search name or email…"
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        className="w-full pl-9 pr-4 py-2.5 bg-slate-700 border border-slate-600 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                </div>
                <select
                    value={planFilter}
                    onChange={(e) => { setPlanFilter(e.target.value); setPage(1); }}
                    className="px-3 py-2.5 bg-slate-700 border border-slate-600 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                    {PLAN_OPTIONS.map((p) => <option key={p}>{p}</option>)}
                </select>
                <select
                    value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                    className="px-3 py-2.5 bg-slate-700 border border-slate-600 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                    {STATUS_OPTIONS.map((s) => <option key={s}>{s}</option>)}
                </select>
            </div>

            {/* Table */}
            <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-700">
                                <th className="px-5 py-3.5 cursor-pointer hover:text-slate-300" onClick={() => handleSort('name')}>
                                    Name <SortIcon field="name" />
                                </th>
                                <th className="px-5 py-3.5">Plan</th>
                                <th className="px-5 py-3.5 cursor-pointer hover:text-slate-300" onClick={() => handleSort('postsUsed')}>
                                    Posts Used <SortIcon field="postsUsed" />
                                </th>
                                <th className="px-5 py-3.5 cursor-pointer hover:text-slate-300" onClick={() => handleSort('createdAt')}>
                                    Joined <SortIcon field="createdAt" />
                                </th>
                                <th className="px-5 py-3.5">Status</th>
                                <th className="px-5 py-3.5">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                            {loading ? (
                                Array.from({ length: 8 }).map((_, i) => (
                                    <tr key={i}>
                                        {Array.from({ length: 6 }).map((_, j) => (
                                            <td key={j} className="px-5 py-4">
                                                <div className="h-4 bg-slate-700 rounded animate-pulse" />
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : (data?.users ?? []).length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-5 py-12 text-center text-slate-500">No users found</td>
                                </tr>
                            ) : (
                                data?.users.map((user) => (
                                    <tr key={user.id} className="hover:bg-slate-700/30 transition-colors">
                                        <td className="px-5 py-4">
                                            <Link href={`/admin/users/${user.id}`} className="group">
                                                <div className="font-medium text-slate-200 group-hover:text-indigo-400 transition-colors">
                                                    {user.name ?? '—'}
                                                    {user.role === 'ADMIN' && (
                                                        <span className="ml-2 text-xs bg-indigo-900/50 text-indigo-400 border border-indigo-700 px-1.5 py-0.5 rounded-md">Admin</span>
                                                    )}
                                                </div>
                                                <div className="text-xs text-slate-500">{user.email}</div>
                                            </Link>
                                        </td>
                                        <td className="px-5 py-4">
                                            <PlanBadge plan={user.planName ?? 'None'} />
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className="text-slate-300">{user.postsUsed}</span>
                                                <span className="text-slate-600">/</span>
                                                <span className="text-slate-500">{user.postsLimit}</span>
                                                {user.postsLimit > 0 && (
                                                    <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full ${(user.postsUsed / user.postsLimit) > 0.8 ? 'bg-amber-500' : 'bg-indigo-500'}`}
                                                            style={{ width: `${Math.min((user.postsUsed / user.postsLimit) * 100, 100)}%` }}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-slate-400 text-xs">
                                            {new Date(user.createdAt).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </td>
                                        <td className="px-5 py-4">
                                            <StatusBadge active={user.isActive} />
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="relative">
                                                <button
                                                    onClick={() => setActionUserId(actionUserId === user.id ? null : user.id)}
                                                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-slate-700 transition-colors"
                                                >
                                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                                        <path d="M12 13a1 1 0 100-2 1 1 0 000 2zm-7 0a1 1 0 100-2 1 1 0 000 2zm14 0a1 1 0 100-2 1 1 0 000 2z" />
                                                    </svg>
                                                </button>
                                                {actionUserId === user.id && (
                                                    <ActionMenu
                                                        user={user}
                                                        onClose={() => setActionUserId(null)}
                                                        onSuspend={() => {
                                                            setActionUserId(null);
                                                            setConfirmAction({ type: 'suspend', userId: user.id, userName: user.name ?? user.email });
                                                        }}
                                                        onActivate={() => {
                                                            setActionUserId(null);
                                                            setConfirmAction({ type: 'activate', userId: user.id, userName: user.name ?? user.email });
                                                        }}
                                                        onDelete={() => {
                                                            setActionUserId(null);
                                                            setConfirmAction({ type: 'delete', userId: user.id, userName: user.name ?? user.email });
                                                        }}
                                                    />
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {data && data.pages > 1 && (
                    <div className="flex items-center justify-between px-5 py-3 border-t border-slate-700">
                        <span className="text-xs text-slate-500">
                            Page {data.page} of {data.pages}
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={data.page <= 1}
                                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
                                disabled={data.page >= data.pages}
                                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <ConfirmDialog
                open={!!confirmAction}
                title={
                    confirmAction?.type === 'delete' ? 'Delete User' :
                    confirmAction?.type === 'suspend' ? 'Suspend User' : 'Activate User'
                }
                message={
                    confirmAction?.type === 'delete'
                        ? `Permanently delete ${confirmAction.userName}? This will remove all their data.`
                        : confirmAction?.type === 'suspend'
                        ? `Suspend ${confirmAction?.userName}? They won't be able to access their account.`
                        : `Reactivate ${confirmAction?.userName}'s account?`
                }
                confirmLabel={
                    confirmAction?.type === 'delete' ? 'Delete' :
                    confirmAction?.type === 'suspend' ? 'Suspend' : 'Activate'
                }
                confirmClass={
                    confirmAction?.type === 'delete' ? 'bg-red-600 hover:bg-red-700' :
                    confirmAction?.type === 'suspend' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'
                }
                onConfirm={handleAction}
                onCancel={() => setConfirmAction(null)}
                loading={actionLoading}
            />
        </div>
    );
}

function PlanBadge({ plan }: { plan: string }) {
    const styles: Record<string, string> = {
        STARTER: 'bg-slate-700 text-slate-300',
        GROWTH: 'bg-violet-900/40 text-violet-400 border border-violet-700/50',
        AGENCY: 'bg-amber-900/40 text-amber-400 border border-amber-700/50',
        None: 'bg-slate-700/50 text-slate-500',
    };
    return (
        <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-md ${styles[plan] ?? styles.None}`}>
            {plan}
        </span>
    );
}

function StatusBadge({ active }: { active: boolean }) {
    return (
        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-full ${
            active ? 'bg-emerald-900/40 text-emerald-400' : 'bg-red-900/40 text-red-400'
        }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-emerald-400' : 'bg-red-400'}`} />
            {active ? 'Active' : 'Suspended'}
        </span>
    );
}

function ActionMenu({
    user,
    onClose,
    onSuspend,
    onActivate,
    onDelete,
}: {
    user: AdminUser;
    onClose: () => void;
    onSuspend: () => void;
    onActivate: () => void;
    onDelete: () => void;
}) {
    return (
        <>
            <div className="fixed inset-0 z-10" onClick={onClose} />
            <div className="absolute right-0 top-8 z-20 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl py-1 min-w-[160px]">
                <Link
                    href={`/admin/users/${user.id}`}
                    className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    View Details
                </Link>
                {user.isActive ? (
                    <button
                        onClick={onSuspend}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-amber-400 hover:bg-slate-700 transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                        Suspend
                    </button>
                ) : (
                    <button
                        onClick={onActivate}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-emerald-400 hover:bg-slate-700 transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Activate
                    </button>
                )}
                <div className="border-t border-slate-700 my-1" />
                <button
                    onClick={onDelete}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-400 hover:bg-slate-700 transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete
                </button>
            </div>
        </>
    );
}
