'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';

interface AdminSidebarProps {
    user: {
        name?: string | null;
        email?: string | null;
        image?: string | null;
    };
}

interface NavItem {
    label: string;
    href: string;
    icon: React.ReactNode;
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

function IconUsers() {
    return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
    );
}

function IconPlans() {
    return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
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

function IconPrompts() {
    return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
    );
}

function IconSystem() {
    return (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
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

const NAV_ITEMS: NavItem[] = [
    { label: 'Dashboard', href: '/admin', icon: <IconDashboard /> },
    { label: 'Users', href: '/admin/users', icon: <IconUsers /> },
    { label: 'Plans', href: '/admin/plans', icon: <IconPlans /> },
    { label: 'Templates', href: '/admin/templates', icon: <IconTemplates /> },
    { label: 'Prompts', href: '/admin/prompts', icon: <IconPrompts /> },
    { label: 'System', href: '/admin/system', icon: <IconSystem /> },
];

function SidebarContent({
    user,
    pathname,
    onClose,
}: {
    user: AdminSidebarProps['user'];
    pathname: string;
    onClose?: () => void;
}) {
    const initials = (user.name ?? user.email ?? 'A')
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    return (
        <div className="flex flex-col h-full bg-slate-900 border-r border-slate-700/50">
            {/* Logo */}
            <div className="flex items-center gap-2.5 px-5 h-16 border-b border-slate-700/50 flex-shrink-0">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" />
                    </svg>
                </div>
                <div>
                    <span className="font-bold text-white text-base tracking-tight">ReviewPost</span>
                    <span className="block text-xs text-indigo-400 font-semibold tracking-widest uppercase leading-none">Admin</span>
                </div>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="ml-auto p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 md:hidden"
                    >
                        <IconX />
                    </button>
                )}
            </div>

            {/* Nav */}
            <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
                {NAV_ITEMS.map((item) => {
                    const isActive =
                        item.href === '/admin'
                            ? pathname === '/admin'
                            : pathname.startsWith(item.href);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={onClose}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                                isActive
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40'
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                            }`}
                        >
                            <span>{item.icon}</span>
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            {/* Back to app */}
            <div className="px-3 pb-3 border-t border-slate-700/50 pt-3">
                <Link
                    href="/dashboard"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:bg-slate-800 hover:text-slate-300 transition-all duration-150"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                            d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back to App
                </Link>
            </div>

            {/* User section */}
            <div className="px-4 pb-4">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800">
                    {user.image ? (
                        <img src={user.image} alt="" className="w-8 h-8 rounded-full flex-shrink-0 object-cover" />
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {initials}
                        </div>
                    )}
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-100 truncate">{user.name ?? user.email}</p>
                        <span className="text-xs text-indigo-400 font-semibold">ADMIN</span>
                    </div>
                    <button
                        onClick={() => signOut({ callbackUrl: '/login' })}
                        title="Sign out"
                        className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-900/20 transition-colors flex-shrink-0"
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

export function AdminSidebar({ user }: AdminSidebarProps) {
    const pathname = usePathname();
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    useEffect(() => {
        setIsMobileOpen(false);
    }, [pathname]);

    return (
        <>
            <button
                onClick={() => setIsMobileOpen(true)}
                className="md:hidden fixed top-4 left-4 z-40 p-2 rounded-xl bg-slate-800 shadow-md border border-slate-700 text-slate-300 hover:text-indigo-400 transition-colors"
                aria-label="Open navigation"
            >
                <IconMenu />
            </button>

            {isMobileOpen && (
                <div className="md:hidden fixed inset-0 z-50 flex" onClick={() => setIsMobileOpen(false)}>
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                    <div className="relative w-64 h-full" onClick={(e) => e.stopPropagation()}>
                        <SidebarContent user={user} pathname={pathname} onClose={() => setIsMobileOpen(false)} />
                    </div>
                </div>
            )}

            <div className="hidden md:flex flex-col w-64 flex-shrink-0 h-screen sticky top-0">
                <SidebarContent user={user} pathname={pathname} />
            </div>
        </>
    );
}
