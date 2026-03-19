'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface AdminStats {
    totalUsers: number;
    totalPostsPublished: number;
    mrr: number;
    activeSubscriptions: number;
    newSignupsThisWeek: number;
    signupsByDay: { date: string; count: number }[];
    heavyUsers: { id: string; name: string | null; email: string; planName: string; postsUsed: number; postsLimit: number; usagePct: number }[];
    health: { db: 'ok' | 'error'; redis: 'ok' | 'error' | 'unknown'; n8n: 'ok' | 'error' | 'unknown' };
}

function StatCard({ title, value, subtitle, color }: { title: string; value: string | number; subtitle?: string; color: string }) {
    return (
        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-5">
            <p className="text-sm font-medium text-slate-400">{title}</p>
            <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
            {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
        </div>
    );
}

function HealthBadge({ status }: { status: 'ok' | 'error' | 'unknown' }) {
    const styles = {
        ok: 'bg-emerald-900/40 text-emerald-400 border-emerald-800',
        error: 'bg-red-900/40 text-red-400 border-red-800',
        unknown: 'bg-slate-700 text-slate-400 border-slate-600',
    };
    const labels = { ok: 'Healthy', error: 'Error', unknown: 'Unknown' };
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${styles[status]}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${status === 'ok' ? 'bg-emerald-400' : status === 'error' ? 'bg-red-400' : 'bg-slate-400'}`} />
            {labels[status]}
        </span>
    );
}

function SignupChart({ data }: { data: { date: string; count: number }[] }) {
    if (!data.length) return <p className="text-slate-500 text-sm text-center py-8">No data</p>;
    const max = Math.max(...data.map((d) => d.count), 1);
    return (
        <div className="flex items-end gap-1.5 h-24">
            {data.map((d) => (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs text-slate-500 leading-none">{d.count}</span>
                    <div
                        className="w-full bg-indigo-500 rounded-t-sm min-h-[4px]"
                        style={{ height: `${Math.max((d.count / max) * 72, 4)}px` }}
                    />
                    <span className="text-[10px] text-slate-600 leading-none">
                        {new Date(d.date).toLocaleDateString('en', { weekday: 'short' })}
                    </span>
                </div>
            ))}
        </div>
    );
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch('/api/admin/stats')
            .then((r) => {
                if (!r.ok) throw new Error('Failed to load stats');
                return r.json();
            })
            .then(setStats)
            .catch((e: Error) => setError(e.message))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="p-6 md:p-8 max-w-[1400px] mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
                <p className="text-sm text-slate-400 mt-0.5">
                    {new Date().toLocaleDateString('en', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
            </div>

            {error && (
                <div className="flex items-center gap-2 px-4 py-3 bg-red-900/30 border border-red-800 rounded-xl text-sm text-red-400">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    {error}
                </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                {loading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="bg-slate-800 rounded-2xl border border-slate-700 p-5 animate-pulse h-28" />
                    ))
                ) : (
                    <>
                        <StatCard title="Total Users" value={stats?.totalUsers ?? 0} subtitle="All time" color="text-white" />
                        <StatCard title="Posts Published" value={stats?.totalPostsPublished ?? 0} subtitle="All time" color="text-indigo-400" />
                        <StatCard
                            title="MRR"
                            value={stats ? `$${stats.mrr.toLocaleString()}` : '$0'}
                            subtitle="Monthly recurring revenue"
                            color="text-emerald-400"
                        />
                        <StatCard title="Active Subs" value={stats?.activeSubscriptions ?? 0} subtitle="Paid plans" color="text-violet-400" />
                    </>
                )}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Signups Chart */}
                <div className="bg-slate-800 rounded-2xl border border-slate-700 p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-semibold text-slate-200">New Signups — Last 7 Days</h2>
                        {!loading && (
                            <span className="text-xs text-slate-400">{stats?.newSignupsThisWeek ?? 0} total</span>
                        )}
                    </div>
                    {loading ? (
                        <div className="h-24 animate-pulse bg-slate-700 rounded-xl" />
                    ) : (
                        <SignupChart data={stats?.signupsByDay ?? []} />
                    )}
                </div>

                {/* System Health */}
                <div className="bg-slate-800 rounded-2xl border border-slate-700 p-5">
                    <h2 className="text-sm font-semibold text-slate-200 mb-4">System Health</h2>
                    {loading ? (
                        <div className="space-y-3">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="h-8 animate-pulse bg-slate-700 rounded-lg" />
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {[
                                { label: 'Database (PostgreSQL)', key: 'db' },
                                { label: 'Cache (Redis)', key: 'redis' },
                                { label: 'Automation (N8N)', key: 'n8n' },
                            ].map(({ label, key }) => (
                                <div key={key} className="flex items-center justify-between py-2 border-b border-slate-700/50 last:border-0">
                                    <span className="text-sm text-slate-300">{label}</span>
                                    <HealthBadge status={(stats?.health as Record<string, 'ok' | 'error' | 'unknown'>)?.[key] ?? 'unknown'} />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Quick Links */}
                <div className="bg-slate-800 rounded-2xl border border-slate-700 p-5">
                    <h2 className="text-sm font-semibold text-slate-200 mb-4">Quick Actions</h2>
                    <div className="space-y-2">
                        {[
                            { href: '/admin/users', label: 'Manage Users', icon: '👥' },
                            { href: '/admin/plans', label: 'Manage Plans', icon: '💳' },
                            { href: '/admin/templates', label: 'Manage Templates', icon: '🎨' },
                            { href: '/admin/system', label: 'System Settings', icon: '⚙️' },
                        ].map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                            >
                                <span>{item.icon}</span>
                                {item.label}
                                <svg className="w-4 h-4 ml-auto text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>

            {/* Heavy Users Alert */}
            {!loading && (stats?.heavyUsers?.length ?? 0) > 0 && (
                <div className="bg-slate-800 rounded-2xl border border-amber-700/50 p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <h2 className="text-sm font-semibold text-amber-400">Heavy Users Alert ({stats?.heavyUsers.length})</h2>
                        <span className="text-xs text-slate-500 ml-1">Using &gt;80% of plan</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    <th className="pb-3 pr-4">User</th>
                                    <th className="pb-3 pr-4">Plan</th>
                                    <th className="pb-3 pr-4">Posts Used</th>
                                    <th className="pb-3">Usage</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700/50">
                                {stats?.heavyUsers.map((u) => (
                                    <tr key={u.id}>
                                        <td className="py-3 pr-4">
                                            <Link href={`/admin/users/${u.id}`} className="text-slate-200 hover:text-indigo-400 transition-colors">
                                                <div className="font-medium">{u.name ?? '—'}</div>
                                                <div className="text-xs text-slate-500">{u.email}</div>
                                            </Link>
                                        </td>
                                        <td className="py-3 pr-4 text-slate-400">{u.planName}</td>
                                        <td className="py-3 pr-4 text-slate-300">
                                            {u.postsUsed} / {u.postsLimit}
                                        </td>
                                        <td className="py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-20 h-2 bg-slate-700 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-amber-500 rounded-full"
                                                        style={{ width: `${Math.min(u.usagePct, 100)}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs text-amber-400 font-semibold">{u.usagePct}%</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
