'use client';

import { useState, useEffect } from 'react';

export type PostPlatform = 'INSTAGRAM' | 'FACEBOOK' | 'TWITTER' | 'TIKTOK';
export type PostStatus = 'QUEUED' | 'PUBLISHED' | 'FAILED';

export interface DashboardPost {
    id: string;
    caption: string | null;
    imageUrl: string | null;
    platform: PostPlatform;
    status: PostStatus;
    scheduledAt: string | null;
    publishedAt: string | null;
    engagementData: Record<string, number> | null;
    businessName: string;
    reviewAuthor: string | null;
    reviewRating: number | null;
    createdAt: string;
}

export interface UpcomingPost {
    id: string;
    caption: string | null;
    platform: PostPlatform;
    scheduledAt: string | null;
    businessName: string;
}

// ─── Platform Badge ───────────────────────────────────────────────────────────

const PLATFORM_CONFIG: Record<PostPlatform, { label: string; bg: string; fg: string; icon: string }> = {
    INSTAGRAM: { label: 'Instagram', bg: 'bg-pink-100 dark:bg-pink-900/30', fg: 'text-pink-600 dark:text-pink-400', icon: 'IG' },
    FACEBOOK: { label: 'Facebook', bg: 'bg-blue-100 dark:bg-blue-900/30', fg: 'text-blue-600 dark:text-blue-400', icon: 'FB' },
    TWITTER: { label: 'X / Twitter', bg: 'bg-gray-100 dark:bg-gray-700', fg: 'text-gray-700 dark:text-gray-300', icon: 'X' },
    TIKTOK: { label: 'TikTok', bg: 'bg-slate-100 dark:bg-slate-700', fg: 'text-slate-700 dark:text-slate-300', icon: 'TK' },
};

function PlatformBadge({ platform }: { platform: PostPlatform }) {
    const { label, bg, fg, icon } = PLATFORM_CONFIG[platform];
    return (
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${bg} ${fg}`}>
            <span className="font-bold">{icon}</span>
            <span className="hidden sm:inline">{label}</span>
        </span>
    );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<PostStatus, { label: string; classes: string; dot: string }> = {
    PUBLISHED: { label: 'Published', classes: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500' },
    QUEUED: { label: 'Queued', classes: 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400', dot: 'bg-amber-500' },
    FAILED: { label: 'Failed', classes: 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400', dot: 'bg-red-500' },
};

function StatusBadge({ status }: { status: PostStatus }) {
    const { label, classes, dot } = STATUS_CONFIG[status];
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${classes}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
            {label}
        </span>
    );
}

// ─── Post Detail Modal ────────────────────────────────────────────────────────

function PostModal({ post, onClose }: { post: DashboardPost; onClose: () => void }) {
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onClose]);

    const engagement = post.engagementData;
    const date = post.publishedAt ?? post.scheduledAt;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <PlatformBadge platform={post.platform} />
                        <StatusBadge status={post.status} />
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Thumbnail */}
                {post.imageUrl ? (
                    <div className="aspect-square bg-gray-100 dark:bg-gray-700 relative overflow-hidden">
                        <img src={post.imageUrl} alt="Post thumbnail" className="w-full h-full object-cover" />
                    </div>
                ) : (
                    <div className="aspect-video bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-900/40 dark:to-violet-900/40 flex items-center justify-center">
                        <span className="text-4xl opacity-30">🖼️</span>
                    </div>
                )}

                {/* Body */}
                <div className="p-5 space-y-4">
                    {/* Caption */}
                    <div>
                        <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1">Caption</p>
                        <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed">
                            {post.caption ?? <span className="italic text-gray-400">No caption</span>}
                        </p>
                    </div>

                    {/* Meta row */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
                            <p className="text-xs text-gray-400 dark:text-gray-500">Business</p>
                            <p className="font-medium text-gray-800 dark:text-gray-200 mt-0.5 truncate">{post.businessName}</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
                            <p className="text-xs text-gray-400 dark:text-gray-500">Reviewer</p>
                            <p className="font-medium text-gray-800 dark:text-gray-200 mt-0.5 truncate">
                                {post.reviewAuthor ?? 'Unknown'}
                                {post.reviewRating && <span className="ml-1 text-amber-500">{'★'.repeat(post.reviewRating)}</span>}
                            </p>
                        </div>
                        {date && (
                            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
                                <p className="text-xs text-gray-400 dark:text-gray-500">
                                    {post.publishedAt ? 'Published' : 'Scheduled'}
                                </p>
                                <p className="font-medium text-gray-800 dark:text-gray-200 mt-0.5">
                                    {new Date(date).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </p>
                            </div>
                        )}
                        {engagement && (
                            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
                                <p className="text-xs text-gray-400 dark:text-gray-500">Engagement</p>
                                <p className="font-medium text-gray-800 dark:text-gray-200 mt-0.5">
                                    {((engagement.likes ?? 0) + (engagement.comments ?? 0)).toLocaleString()} interactions
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Posts Table Skeleton ─────────────────────────────────────────────────────

function TableSkeleton() {
    return (
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-6 py-4 animate-pulse">
                    <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                        <div className="h-3.5 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                    </div>
                    <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-full w-16 hidden sm:block" />
                    <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-full w-20 hidden md:block" />
                </div>
            ))}
        </div>
    );
}

// ─── Posts Table ──────────────────────────────────────────────────────────────

interface PostsTableProps {
    posts: DashboardPost[];
    loading: boolean;
}

export function PostsTable({ posts, loading }: PostsTableProps) {
    const [selected, setSelected] = useState<DashboardPost | null>(null);

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">Recent Posts</h2>
                <a
                    href="/dashboard/posts"
                    className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                >
                    View all →
                </a>
            </div>

            {/* Table */}
            {loading ? (
                <TableSkeleton />
            ) : posts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <span className="text-4xl mb-3">📭</span>
                    <p className="text-gray-500 dark:text-gray-400 font-medium">No posts yet</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Generate your first post to get started</p>
                </div>
            ) : (
                <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
                    {/* Column headers — desktop only */}
                    <div className="hidden md:grid grid-cols-[2rem_1fr_6rem_6.5rem_6rem_5rem] items-center gap-4 px-6 py-2.5 bg-gray-50 dark:bg-gray-700/30">
                        <span />
                        <span className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">Caption</span>
                        <span className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">Platform</span>
                        <span className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">Status</span>
                        <span className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">Date</span>
                        <span className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide text-right">Eng.</span>
                    </div>

                    {posts.map((post) => {
                        const eng = post.engagementData;
                        const engCount = eng ? (eng.likes ?? 0) + (eng.comments ?? 0) : null;
                        const date = post.publishedAt ?? post.scheduledAt;

                        return (
                            <button
                                key={post.id}
                                onClick={() => setSelected(post)}
                                className="w-full text-left group hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors duration-150"
                            >
                                <div className="grid grid-cols-[2.5rem_1fr] md:grid-cols-[2rem_1fr_6rem_6.5rem_6rem_5rem] items-center gap-4 px-6 py-3.5">
                                    {/* Thumbnail */}
                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-900/40 dark:to-violet-900/40 flex-shrink-0 overflow-hidden">
                                        {post.imageUrl ? (
                                            <img src={post.imageUrl} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="w-full h-full flex items-center justify-center text-xs">🖼</span>
                                        )}
                                    </div>

                                    {/* Caption */}
                                    <div className="min-w-0">
                                        <p className="text-sm text-gray-800 dark:text-gray-200 font-medium truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                            {post.caption ?? <span className="italic text-gray-400">No caption</span>}
                                        </p>
                                        <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5">{post.businessName}</p>
                                        {/* Mobile: show platform + status inline */}
                                        <div className="flex items-center gap-2 mt-1.5 md:hidden">
                                            <PlatformBadge platform={post.platform} />
                                            <StatusBadge status={post.status} />
                                        </div>
                                    </div>

                                    {/* Platform */}
                                    <div className="hidden md:block">
                                        <PlatformBadge platform={post.platform} />
                                    </div>

                                    {/* Status */}
                                    <div className="hidden md:block">
                                        <StatusBadge status={post.status} />
                                    </div>

                                    {/* Date */}
                                    <div className="hidden md:block text-xs text-gray-500 dark:text-gray-400">
                                        {date
                                            ? new Date(date).toLocaleDateString('en', {
                                                  month: 'short',
                                                  day: 'numeric',
                                              })
                                            : '—'}
                                    </div>

                                    {/* Engagement */}
                                    <div className="hidden md:block text-xs text-right font-medium text-gray-700 dark:text-gray-300 tabular-nums">
                                        {engCount !== null ? engCount.toLocaleString() : '—'}
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Post detail modal */}
            {selected && <PostModal post={selected} onClose={() => setSelected(null)} />}
        </div>
    );
}

// ─── Upcoming Queue ───────────────────────────────────────────────────────────

function Countdown({ scheduledAt }: { scheduledAt: string }) {
    const [label, setLabel] = useState('');

    useEffect(() => {
        function compute() {
            const diff = new Date(scheduledAt).getTime() - Date.now();
            if (diff <= 0) { setLabel('Now'); return; }
            const h = Math.floor(diff / 3_600_000);
            const m = Math.floor((diff % 3_600_000) / 60_000);
            if (h > 24) {
                const d = Math.floor(h / 24);
                setLabel(`in ${d}d ${h % 24}h`);
            } else {
                setLabel(`in ${h}h ${m}m`);
            }
        }
        compute();
        const id = setInterval(compute, 30_000);
        return () => clearInterval(id);
    }, [scheduledAt]);

    return <span>{label}</span>;
}

interface QueueProps {
    posts: UpcomingPost[];
    loading: boolean;
}

export function UpcomingQueue({ posts, loading }: QueueProps) {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden h-fit">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">Upcoming Queue</h2>
                <span className="text-xs bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400 font-semibold px-2 py-0.5 rounded-full">
                    {loading ? '…' : posts.length}
                </span>
            </div>

            {loading ? (
                <div className="p-4 space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-3 animate-pulse">
                            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg flex-shrink-0" />
                            <div className="flex-1 space-y-1.5">
                                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                                <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : posts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center px-4">
                    <span className="text-3xl mb-2">🗓️</span>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Queue is empty</p>
                </div>
            ) : (
                <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
                    {posts.map((post) => {
                        const { icon: platformIcon, bg, fg } = PLATFORM_CONFIG[post.platform];
                        return (
                            <div key={post.id} className="flex items-start gap-3 px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors">
                                <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-xs font-bold ${bg} ${fg}`}>
                                    {platformIcon}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm text-gray-800 dark:text-gray-200 font-medium truncate">
                                        {post.caption?.slice(0, 50) ?? 'Untitled post'}
                                        {(post.caption?.length ?? 0) > 50 ? '…' : ''}
                                    </p>
                                    <div className="flex items-center justify-between mt-1">
                                        <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{post.businessName}</p>
                                        {post.scheduledAt && (
                                            <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400 flex-shrink-0 ml-2">
                                                <Countdown scheduledAt={post.scheduledAt} />
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
