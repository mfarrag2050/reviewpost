'use client';

import { useEffect, useState } from 'react';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { PostsTable, UpcomingQueue } from '@/components/dashboard/PostsTable';
import type { DashboardPost, UpcomingPost } from '@/components/dashboard/PostsTable';

// ─── Stat icons ───────────────────────────────────────────────────────────────

function IconGenerate() {
    return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
    );
}

function IconPublish() {
    return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
    );
}

function IconReviews() {
    return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
        </svg>
    );
}

function IconEngagement() {
    return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
    );
}

// ─── Quick Actions ────────────────────────────────────────────────────────────

function QuickActions() {
    const [pulling, setPulling] = useState(false);

    const handlePullReviews = async () => {
        setPulling(true);
        try {
            await fetch('/api/reviews/google', { method: 'POST' });
        } finally {
            setPulling(false);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
            <div className="flex flex-wrap gap-3">
                <a
                    href="/dashboard/posts/new"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors shadow-sm shadow-indigo-200 dark:shadow-indigo-900/40"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Generate New Post
                </a>

                <button
                    onClick={handlePullReviews}
                    disabled={pulling}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 text-sm font-semibold border border-gray-200 dark:border-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <svg
                        className={`w-4 h-4 ${pulling ? 'animate-spin' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    {pulling ? 'Pulling…' : 'Pull Reviews Now'}
                </button>

                <a
                    href="/dashboard/posts"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 text-sm font-semibold border border-gray-200 dark:border-gray-600 transition-colors"
                >
                    View All Posts
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </a>
            </div>
        </div>
    );
}

// ─── Dashboard data types ─────────────────────────────────────────────────────

interface DashboardStats {
    postsGenerated: number;
    postsPublished: number;
    reviewsPulled: number;
    engagementRate: string;
}

interface DashboardData {
    stats: DashboardStats;
    recentPosts: DashboardPost[];
    upcomingPosts: UpcomingPost[];
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch('/api/dashboard/stats')
            .then((r) => {
                if (!r.ok) throw new Error('Failed to load dashboard data');
                return r.json();
            })
            .then((d: DashboardData) => {
                setData(d);
            })
            .catch((e: Error) => {
                setError(e.message);
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    const stats = data?.stats;
    const now = new Date();
    const monthName = now.toLocaleDateString('en', { month: 'long', year: 'numeric' });

    return (
        <div className="p-6 md:p-8 max-w-[1400px] mx-auto space-y-6">
            {/* Page header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{monthName}</p>
                </div>
                {error && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        {error}
                    </div>
                )}
            </div>

            {/* ── Section 1: Stats Overview ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <StatsCard
                    title="Posts Generated"
                    value={stats?.postsGenerated ?? 0}
                    subtitle="This month"
                    icon={<IconGenerate />}
                    accentClass="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
                    loading={loading}
                />
                <StatsCard
                    title="Posts Published"
                    value={stats?.postsPublished ?? 0}
                    subtitle="This month"
                    icon={<IconPublish />}
                    accentClass="bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400"
                    loading={loading}
                />
                <StatsCard
                    title="Reviews Pulled"
                    value={stats?.reviewsPulled ?? 0}
                    subtitle="Total"
                    icon={<IconReviews />}
                    accentClass="bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
                    loading={loading}
                />
                <StatsCard
                    title="Engagement Rate"
                    value={stats ? `${stats.engagementRate}%` : '—'}
                    subtitle="Avg. likes + comments / reach"
                    icon={<IconEngagement />}
                    accentClass="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                    loading={loading}
                />
            </div>

            {/* ── Section 4: Quick Actions ── */}
            <QuickActions />

            {/* ── Sections 2 + 3: Posts table + Queue ── */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Recent Posts — takes 2/3 width on xl */}
                <div className="xl:col-span-2">
                    <PostsTable
                        posts={data?.recentPosts ?? []}
                        loading={loading}
                    />
                </div>

                {/* Upcoming Queue — takes 1/3 width on xl */}
                <div>
                    <UpcomingQueue
                        posts={data?.upcomingPosts ?? []}
                        loading={loading}
                    />
                </div>
            </div>
        </div>
    );
}
