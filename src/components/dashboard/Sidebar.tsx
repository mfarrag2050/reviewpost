'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';

interface NavItem {
    label: string;
    href: string;
    icon: React.ReactNode;
}

interface SidebarProps {
    user: {
        name?: string | null;
        email?: string | null;
        image?: string | null;
        plan?: string | null;
    };
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconDashboard() {
    return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
    );
}

function IconPosts() {
    return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
        </svg>
    );
}

function IconReviews() {
    return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
    );
}

function IconTemplates() {
    return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
        </svg>
    );
}

function IconSettings() {
    return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
    );
}

function IconUsage() {
    return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
    );
}

function IconSun() {
    return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
    );
}

function IconMoon() {
    return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
    );
}

function IconMenu() {
    return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
    );
}

function IconX() {
    return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
    );
}

// ─── Plan Badge ───────────────────────────────────────────────────────────────

const PLAN_STYLES: Record<string, string> = {
    STARTER: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400',
    GROWTH: 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-400',
    AGENCY: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400',
};

// ─── Nav items ────────────────────────────────────────────────────────────────

const NAV_ITEMS: NavItem[] = [
    { label: 'Dashboard', href: '/dashboard', icon: <IconDashboard /> },
    { label: 'Posts', href: '/dashboard/posts', icon: <IconPosts /> },
    { label: 'Reviews', href: '/dashboard/reviews', icon: <IconReviews /> },
    { label: 'Templates', href: '/dashboard/templates', icon: <IconTemplates /> },
    { label: 'Usage', href: '/dashboard/usage', icon: <IconUsage /> },
    { label: 'Settings', href: '/dashboard/settings', icon: <IconSettings /> },
];

// ─── Sidebar Content ──────────────────────────────────────────────────────────

function SidebarContent({
    user,
    pathname,
    isDark,
    onToggleDark,
    onClose,
}: {
    user: SidebarProps['user'];
    pathname: string;
    isDark: boolean;
    onToggleDark: () => void;
    onClose?: () => void;
}) {
    const plan = user.plan ?? 'STARTER';
    const initials = (user.name ?? user.email ?? 'U')
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    return (
        <div className="flex flex-col h-full bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800">
            {/* Logo */}
            <div className="flex items-center gap-2.5 px-5 h-16 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4.5 h-4.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" />
                    </svg>
                </div>
                <span className="font-bold text-gray-900 dark:text-white text-lg tracking-tight">ReviewPost</span>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="ml-auto p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 md:hidden"
                    >
                        <IconX />
                    </button>
                )}
            </div>

            {/* Nav */}
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                {NAV_ITEMS.map((item) => {
                    const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={onClose}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                                isActive
                                    ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                            }`}
                        >
                            <span className={isActive ? 'text-indigo-600 dark:text-indigo-400' : ''}>{item.icon}</span>
                            {item.label}
                            {isActive && (
                                <span className="ml-auto w-1.5 h-5 rounded-full bg-indigo-500 dark:bg-indigo-400" />
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Divider */}
            <div className="mx-4 border-t border-gray-100 dark:border-gray-800" />

            {/* Theme toggle */}
            <div className="px-4 py-3">
                <button
                    onClick={onToggleDark}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-all duration-150"
                >
                    <span>{isDark ? <IconSun /> : <IconMoon />}</span>
                    <span>{isDark ? 'Light mode' : 'Dark mode'}</span>
                </button>
            </div>

            {/* User section */}
            <div className="px-4 pb-4">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                    {/* Avatar */}
                    {user.image ? (
                        <img src={user.image} alt="" className="w-9 h-9 rounded-full flex-shrink-0 object-cover" />
                    ) : (
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                            {initials}
                        </div>
                    )}
                    {/* Name + plan */}
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                            {user.name ?? user.email}
                        </p>
                        <span className={`text-xs font-medium px-1.5 py-0.5 rounded-md ${PLAN_STYLES[plan] ?? PLAN_STYLES.STARTER}`}>
                            {plan}
                        </span>
                    </div>
                    {/* Sign out */}
                    <button
                        onClick={() => signOut({ callbackUrl: '/login' })}
                        title="Sign out"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex-shrink-0"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Sidebar (main export) ────────────────────────────────────────────────────

export function Sidebar({ user }: SidebarProps) {
    const pathname = usePathname();
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [isDark, setIsDark] = useState(false);

    // Sync dark mode from localStorage / system preference on mount
    useEffect(() => {
        const stored = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const dark = stored === 'dark' || (!stored && prefersDark);
        setIsDark(dark);
        document.documentElement.classList.toggle('dark', dark);
    }, []);

    const toggleDark = useCallback(() => {
        setIsDark((prev) => {
            const next = !prev;
            localStorage.setItem('theme', next ? 'dark' : 'light');
            document.documentElement.classList.toggle('dark', next);
            return next;
        });
    }, []);

    // Close mobile sidebar on route change
    useEffect(() => {
        setIsMobileOpen(false);
    }, [pathname]);

    return (
        <>
            {/* Mobile hamburger button */}
            <button
                onClick={() => setIsMobileOpen(true)}
                className="md:hidden fixed top-4 left-4 z-40 p-2 rounded-xl bg-white dark:bg-gray-800 shadow-md border border-gray-100 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                aria-label="Open navigation"
            >
                <IconMenu />
            </button>

            {/* Mobile overlay */}
            {isMobileOpen && (
                <div
                    className="md:hidden fixed inset-0 z-50 flex"
                    onClick={() => setIsMobileOpen(false)}
                >
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
                    <div
                        className="relative w-64 h-full"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <SidebarContent
                            user={user}
                            pathname={pathname}
                            isDark={isDark}
                            onToggleDark={toggleDark}
                            onClose={() => setIsMobileOpen(false)}
                        />
                    </div>
                </div>
            )}

            {/* Desktop sidebar — static */}
            <div className="hidden md:flex flex-col w-64 flex-shrink-0 h-screen sticky top-0">
                <SidebarContent
                    user={user}
                    pathname={pathname}
                    isDark={isDark}
                    onToggleDark={toggleDark}
                />
            </div>
        </>
    );
}
