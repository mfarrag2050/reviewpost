'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

// ─── Constants ─────────────────────────────────────────────────────────────────

// Fallback limits used if API doesn't return postsLimit (e.g. user has no plan assigned yet)
const PLAN_LIMITS_FALLBACK: Record<string, number> = { STARTER: 30, GROWTH: 150, AGENCY: 500 };
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAY_KEYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

const TABS = [
    { id: 'schedule', label: 'Posting Schedule' },
    { id: 'templates', label: 'Templates' },
    { id: 'brand', label: 'Brand Kit' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'account', label: 'Account' },
];

// ─── Types ─────────────────────────────────────────────────────────────────────

interface BrandColors {
    primary?: string;
    secondary?: string;
    selectedTemplate?: string;
    autoPostEnabled?: boolean;
    postFrequency?: number;
    postDays?: string[];
    postTime?: string;
    defaultPlatforms?: string[];
    notifications?: {
        emailEnabled?: boolean;
        telegramEnabled?: boolean;
        postPublished?: boolean;
        weeklyReport?: boolean;
        usageAlert80?: boolean;
        usageLimit100?: boolean;
    };
}

interface SettingsData {
    user: {
        id: string;
        plan: string;
        aiMode: string;
        language: string;
        hasByokKey: boolean;
    };
    business: {
        id: string;
        name: string;
        logoUrl: string | null;
        brandColors: BrandColors;
    } | null;
    usage: {
        postsGenerated: number;
        postsPublished: number;
    };
}

interface ScheduleData {
    autoPost: boolean;
    days: string[];
    time: string;
    postsPerWeek: number;
    platforms: string[];
}

interface TemplateTabData {
    selectedTemplate: string;
    primaryColor: string;
    secondaryColor: string;
}

interface BrandData {
    businessName: string;
    logoUrl: string;
    primaryColor: string;
    secondaryColor: string;
    selectedTemplate: string;
}

interface NotifData {
    emailEnabled: boolean;
    telegramEnabled: boolean;
    postPublished: boolean;
    weeklyReport: boolean;
    usageAlert80: boolean;
    usageLimit100: boolean;
}

interface AccountData {
    plan: string;
    planDisplayName: string;
    postsLimit: number;
    aiMode: string;
    hasByokKey: boolean;
    postsGenerated: number;
    postsPublished: number;
    hasStripeSubscription: boolean;
    subscriptionStatus: string | null;
    cancelAtPeriodEnd: boolean;
    currentPeriodEnd: string | null;
}

// ─── Shared UI Primitives ─────────────────────────────────────────────────────

function SectionCard({
    title,
    children,
    className = '',
}: {
    title: string;
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div
            className={`bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6 ${className}`}
        >
            <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">
                {title}
            </h3>
            {children}
        </div>
    );
}

function Toggle({
    checked,
    onChange,
    label,
    description,
}: {
    checked: boolean;
    onChange: (v: boolean) => void;
    label: string;
    description?: string;
}) {
    return (
        <div className="flex items-center justify-between py-3.5">
            <div className="min-w-0 pr-4">
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{label}</p>
                {description && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>
                )}
            </div>
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                onClick={() => onChange(!checked)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${
                    checked ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-600'
                }`}
            >
                <span
                    className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                        checked ? 'translate-x-6' : 'translate-x-1'
                    }`}
                />
            </button>
        </div>
    );
}

function TabSkeleton() {
    return (
        <div className="space-y-4 animate-pulse">
            {[0, 1, 2].map((i) => (
                <div
                    key={i}
                    className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6"
                >
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-5" />
                    <div className="space-y-3">
                        <div className="h-3.5 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                        <div className="h-3.5 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-xl w-full mt-2" />
                    </div>
                </div>
            ))}
        </div>
    );
}

// ─── Toast ─────────────────────────────────────────────────────────────────────

interface ToastState {
    visible: boolean;
    message: string;
    type: 'success' | 'error';
}

function Toast({ toast }: { toast: ToastState }) {
    return (
        <div
            className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-2xl text-sm font-medium transition-all duration-300 ${
                toast.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3 pointer-events-none'
            } ${toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}
        >
            {toast.type === 'success' ? (
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
            ) : (
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            )}
            {toast.message}
        </div>
    );
}

// ─── Template Previews ────────────────────────────────────────────────────────

function ClassicPreview({ primary, secondary }: { primary: string; secondary: string }) {
    return (
        <div
            style={{
                width: '100%',
                height: '100%',
                background: '#fff',
                borderRadius: '6px',
                overflow: 'hidden',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                boxSizing: 'border-box',
            }}
        >
            <div style={{ display: 'flex', gap: '3px' }}>
                {[1, 2, 3, 4, 5].map((s) => (
                    <span key={s} style={{ color: primary, fontSize: '12px' }}>★</span>
                ))}
            </div>
            <p style={{ fontSize: '8px', color: '#374151', lineHeight: 1.5, flex: 1, margin: 0 }}>
                "Amazing service! The team was incredibly helpful and professional throughout our entire experience."
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div
                    style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        background: primary,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                    }}
                >
                    <span style={{ fontSize: '9px', color: '#fff', fontWeight: 700 }}>A</span>
                </div>
                <span style={{ fontSize: '7px', color: '#6B7280' }}>Ahmed Mohammed</span>
            </div>
            <div
                style={{
                    borderTop: `2.5px solid ${primary}`,
                    paddingTop: '5px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}
            >
                <span style={{ fontSize: '7px', fontWeight: 700, color: primary }}>Business Name</span>
                <span style={{ fontSize: '6px', color: secondary, fontWeight: 600 }}>Google Reviews</span>
            </div>
        </div>
    );
}

function BoldPreview({ primary, secondary }: { primary: string; secondary: string }) {
    return (
        <div
            style={{
                width: '100%',
                height: '100%',
                background: `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)`,
                borderRadius: '6px',
                overflow: 'hidden',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxSizing: 'border-box',
            }}
        >
            <div style={{ fontSize: '38px', color: 'rgba(255,255,255,0.2)', lineHeight: 1, fontFamily: 'Georgia, serif' }}>
                "
            </div>
            <p
                style={{
                    fontSize: '8px',
                    color: '#fff',
                    lineHeight: 1.6,
                    textAlign: 'center',
                    margin: '-14px 0',
                    fontStyle: 'italic',
                }}
            >
                "Amazing service! The team was incredibly helpful and professional throughout."
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                <div style={{ display: 'flex', gap: '2px' }}>
                    {[1, 2, 3, 4, 5].map((s) => (
                        <span key={s} style={{ color: '#FCD34D', fontSize: '10px' }}>★</span>
                    ))}
                </div>
                <span style={{ fontSize: '7px', color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>
                    Ahmed Mohammed
                </span>
                <span style={{ fontSize: '6px', color: 'rgba(255,255,255,0.6)' }}>Business Name</span>
            </div>
        </div>
    );
}

function ProductPreview({ primary, secondary }: { primary: string; secondary: string }) {
    return (
        <div
            style={{
                width: '100%',
                height: '100%',
                background: '#fff',
                borderRadius: '6px',
                overflow: 'hidden',
                display: 'flex',
                boxSizing: 'border-box',
            }}
        >
            <div
                style={{
                    width: '42%',
                    background: `linear-gradient(160deg, ${primary}18, ${secondary}25)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                }}
            >
                <div
                    style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '6px',
                        background: `${primary}25`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '18px',
                    }}
                >
                    🛍
                </div>
            </div>
            <div
                style={{
                    padding: '10px 8px',
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '5px',
                }}
            >
                <span style={{ fontSize: '7px', fontWeight: 700, color: primary }}>Product Name</span>
                <div style={{ display: 'flex', gap: '1px' }}>
                    {[1, 2, 3, 4, 5].map((s) => (
                        <span key={s} style={{ color: '#F59E0B', fontSize: '8px' }}>★</span>
                    ))}
                </div>
                <p style={{ fontSize: '6.5px', color: '#4B5563', lineHeight: 1.4, flex: 1, margin: 0 }}>
                    "Great product! Exactly as described. Very fast delivery."
                </p>
                <span style={{ fontSize: '5.5px', color: '#9CA3AF' }}>By Ahmed M.</span>
                <div style={{ borderTop: `1.5px solid ${primary}`, paddingTop: '4px' }}>
                    <span style={{ fontSize: '6px', fontWeight: 700, color: primary }}>Business</span>
                </div>
            </div>
        </div>
    );
}

const TEMPLATE_META = [
    {
        id: 'classic',
        name: 'Classic',
        description: 'Clean white background with elegant typography. Perfect for professional businesses.',
        Preview: ClassicPreview,
    },
    {
        id: 'bold',
        name: 'Bold',
        description: 'Vibrant gradient background that makes your reviews impossible to ignore.',
        Preview: BoldPreview,
    },
    {
        id: 'product',
        name: 'Product',
        description: 'Split layout with product image showcase. Ideal for e-commerce stores.',
        Preview: ProductPreview,
    },
];

// ─── Tab 1: Posting Schedule ───────────────────────────────────────────────────

function ScheduleTab({
    initialData,
    onSave,
}: {
    initialData: ScheduleData;
    onSave: (data: Record<string, unknown>) => void;
}) {
    const [data, setData] = useState(initialData);
    const isFirst = useRef(true);

    useEffect(() => {
        if (isFirst.current) {
            isFirst.current = false;
            return;
        }
        const timer = setTimeout(() => {
            onSave({
                autoPostEnabled: data.autoPost,
                postDays: data.days,
                postTime: data.time,
                postFrequency: data.postsPerWeek,
                defaultPlatforms: data.platforms,
            });
        }, 700);
        return () => clearTimeout(timer);
    }, [data, onSave]);

    const toggleDay = (key: string) =>
        setData((prev) => ({
            ...prev,
            days: prev.days.includes(key) ? prev.days.filter((d) => d !== key) : [...prev.days, key],
        }));

    const togglePlatform = (p: string) =>
        setData((prev) => ({
            ...prev,
            platforms: prev.platforms.includes(p)
                ? prev.platforms.filter((x) => x !== p)
                : [...prev.platforms, p],
        }));

    return (
        <div className="space-y-4">
            <SectionCard title="Auto-Publishing">
                <Toggle
                    checked={data.autoPost}
                    onChange={(v) => setData((prev) => ({ ...prev, autoPost: v }))}
                    label="Enable auto-posting"
                    description="Automatically create and schedule posts from new reviews as they come in"
                />
            </SectionCard>

            <SectionCard title="Schedule">
                <div className="space-y-5">
                    <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2.5">
                            Posting Days
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {DAY_KEYS.map((key, i) => (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => toggleDay(key)}
                                    className={`px-3.5 py-1.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                                        data.days.includes(key)
                                            ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200 dark:shadow-indigo-900/40'
                                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                    }`}
                                >
                                    {DAY_LABELS[i]}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5">
                                Posting Time
                            </label>
                            <input
                                type="time"
                                value={data.time}
                                onChange={(e) => setData((prev) => ({ ...prev, time: e.target.value }))}
                                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5">
                                Posts per Week
                            </label>
                            <select
                                value={data.postsPerWeek}
                                onChange={(e) =>
                                    setData((prev) => ({ ...prev, postsPerWeek: Number(e.target.value) }))
                                }
                                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                                    <option key={n} value={n}>
                                        {n} post{n > 1 ? 's' : ''} / week
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </SectionCard>

            <SectionCard title="Default Platforms">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                    New posts will be published to these platforms by default
                </p>
                <div className="space-y-3">
                    {[
                        {
                            key: 'INSTAGRAM',
                            label: 'Instagram',
                            badge: 'bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400',
                        },
                        {
                            key: 'FACEBOOK',
                            label: 'Facebook',
                            badge: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
                        },
                        {
                            key: 'TWITTER',
                            label: 'X / Twitter',
                            badge: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
                        },
                    ].map(({ key, label, badge }) => {
                        const active = data.platforms.includes(key);
                        return (
                            <label key={key} className="flex items-center gap-3 cursor-pointer group">
                                <div
                                    onClick={() => togglePlatform(key)}
                                    className={`w-5 h-5 rounded-md flex items-center justify-center cursor-pointer border-2 transition-colors flex-shrink-0 ${
                                        active
                                            ? 'bg-indigo-600 border-indigo-600'
                                            : 'border-gray-300 dark:border-gray-500 group-hover:border-indigo-400'
                                    }`}
                                >
                                    {active && (
                                        <svg
                                            className="w-3 h-3 text-white"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={3}
                                                d="M5 13l4 4L19 7"
                                            />
                                        </svg>
                                    )}
                                </div>
                                <span
                                    className={`text-sm font-semibold px-2.5 py-1 rounded-lg ${badge}`}
                                >
                                    {label}
                                </span>
                            </label>
                        );
                    })}
                </div>
            </SectionCard>
        </div>
    );
}

// ─── Tab 2: Templates ─────────────────────────────────────────────────────────

function TemplatesTab({
    initialData,
    onSave,
}: {
    initialData: TemplateTabData;
    onSave: (data: Record<string, unknown>) => void;
}) {
    const [selected, setSelected] = useState(initialData.selectedTemplate);
    const isFirst = useRef(true);

    useEffect(() => {
        if (isFirst.current) {
            isFirst.current = false;
            return;
        }
        const timer = setTimeout(() => {
            onSave({ selectedTemplate: selected });
        }, 400);
        return () => clearTimeout(timer);
    }, [selected, onSave]);

    return (
        <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
                <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">
                    Choose Template
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">
                    Your brand colors are applied automatically. Go to{' '}
                    <button
                        type="button"
                        className="text-indigo-600 dark:text-indigo-400 underline underline-offset-2"
                    >
                        Brand Kit
                    </button>{' '}
                    to change them.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    {TEMPLATE_META.map((tpl) => {
                        const isActive = selected === tpl.id;
                        const { Preview } = tpl;
                        return (
                            <button
                                key={tpl.id}
                                type="button"
                                onClick={() => setSelected(tpl.id)}
                                className={`group relative rounded-2xl border-2 overflow-hidden transition-all duration-150 text-left focus:outline-none ${
                                    isActive
                                        ? 'border-indigo-500 shadow-lg shadow-indigo-100 dark:shadow-indigo-900/30 ring-1 ring-indigo-500'
                                        : 'border-gray-100 dark:border-gray-700 hover:border-indigo-200 dark:hover:border-indigo-700'
                                }`}
                            >
                                {/* Preview area */}
                                <div className="aspect-square bg-gray-50 dark:bg-gray-900/50 relative overflow-hidden">
                                    <Preview
                                        primary={initialData.primaryColor}
                                        secondary={initialData.secondaryColor}
                                    />
                                    {isActive && (
                                        <div className="absolute top-2 right-2">
                                            <span className="bg-indigo-600 text-white text-xs font-semibold px-2 py-0.5 rounded-full shadow-sm">
                                                Active
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="p-4 bg-white dark:bg-gray-800">
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                                        {tpl.name}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                                        {tpl.description}
                                    </p>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Sample post preview */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
                <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">
                    Sample Post Preview
                </h3>
                <div className="flex flex-col sm:flex-row items-start gap-6">
                    <div className="w-48 h-48 flex-shrink-0 rounded-xl overflow-hidden shadow-md border border-gray-100 dark:border-gray-700">
                        {(() => {
                            const tpl = TEMPLATE_META.find((t) => t.id === selected) ?? TEMPLATE_META[0];
                            const { Preview } = tpl;
                            return (
                                <Preview
                                    primary={initialData.primaryColor}
                                    secondary={initialData.secondaryColor}
                                />
                            );
                        })()}
                    </div>
                    <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                        <p className="font-medium text-gray-800 dark:text-gray-200">
                            {TEMPLATE_META.find((t) => t.id === selected)?.name ?? 'Classic'} Template
                        </p>
                        <p>{TEMPLATE_META.find((t) => t.id === selected)?.description}</p>
                        <p className="text-xs">
                            Rendered at 1080×1080px for Instagram · 1200×630px for Facebook
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Tab 3: Brand Kit ─────────────────────────────────────────────────────────

function BrandKitTab({
    initialData,
    onSave,
}: {
    initialData: BrandData;
    onSave: (data: Record<string, unknown>) => void;
}) {
    const [data, setData] = useState(initialData);
    const isFirst = useRef(true);

    useEffect(() => {
        if (isFirst.current) {
            isFirst.current = false;
            return;
        }
        const timer = setTimeout(() => {
            onSave({
                businessName: data.businessName,
                logoUrl: data.logoUrl,
                primaryColor: data.primaryColor,
                secondaryColor: data.secondaryColor,
            });
        }, 700);
        return () => clearTimeout(timer);
    }, [data, onSave]);

    const update = <K extends keyof BrandData>(key: K, value: BrandData[K]) =>
        setData((prev) => ({ ...prev, [key]: value }));

    const selectedTpl =
        TEMPLATE_META.find((t) => t.id === data.selectedTemplate) ?? TEMPLATE_META[0];
    const { Preview } = selectedTpl;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-start">
            {/* Left: form — 3 cols */}
            <div className="lg:col-span-3 space-y-4">
                <SectionCard title="Business Info">
                    <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5">
                            Business Name
                        </label>
                        <input
                            type="text"
                            value={data.businessName}
                            onChange={(e) => update('businessName', e.target.value)}
                            placeholder="Your business name"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                </SectionCard>

                <SectionCard title="Logo">
                    <div className="space-y-3">
                        {data.logoUrl && (
                            <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-gray-100 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 flex items-center justify-center">
                                <img
                                    src={data.logoUrl}
                                    alt="Logo preview"
                                    className="max-w-full max-h-full object-contain p-2"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                />
                            </div>
                        )}
                        <div>
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5">
                                Logo URL
                            </label>
                            <input
                                type="url"
                                value={data.logoUrl}
                                onChange={(e) => update('logoUrl', e.target.value)}
                                placeholder="https://example.com/logo.png"
                                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                Public URL to your logo image (PNG, SVG, JPG)
                            </p>
                        </div>
                    </div>
                </SectionCard>

                <SectionCard title="Brand Colors">
                    <div className="space-y-5">
                        {(
                            [
                                { key: 'primaryColor', label: 'Primary Color' },
                                { key: 'secondaryColor', label: 'Secondary Color' },
                            ] as { key: 'primaryColor' | 'secondaryColor'; label: string }[]
                        ).map(({ key, label }) => (
                            <div key={key}>
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
                                    {label}
                                </label>
                                <div className="flex items-center gap-3">
                                    <div className="relative flex-shrink-0">
                                        <input
                                            type="color"
                                            value={data[key]}
                                            onChange={(e) => update(key, e.target.value)}
                                            className="w-11 h-11 rounded-xl cursor-pointer border-2 border-gray-200 dark:border-gray-600 p-1 bg-transparent"
                                        />
                                    </div>
                                    <input
                                        type="text"
                                        value={data[key]}
                                        onChange={(e) => {
                                            const v = e.target.value;
                                            if (/^#[0-9A-Fa-f]{0,6}$/.test(v)) update(key, v);
                                        }}
                                        placeholder="#000000"
                                        className="flex-1 px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                    <div
                                        className="w-10 h-10 rounded-xl border-2 border-gray-200 dark:border-gray-600 flex-shrink-0 shadow-inner"
                                        style={{ backgroundColor: data[key] }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </SectionCard>
            </div>

            {/* Right: Live Preview — 2 cols */}
            <div className="lg:col-span-2 lg:sticky lg:top-8">
                <SectionCard title="Live Preview">
                    <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
                        Updates as you type · {selectedTpl.name} template
                    </p>

                    <div className="aspect-square w-full max-w-[220px] mx-auto rounded-xl overflow-hidden shadow-lg border border-gray-100 dark:border-gray-700">
                        <Preview primary={data.primaryColor} secondary={data.secondaryColor} />
                    </div>

                    <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl flex items-center gap-3">
                        <div
                            className="w-8 h-8 rounded-lg flex-shrink-0 border border-gray-200 dark:border-gray-600"
                            style={{ backgroundColor: data.primaryColor }}
                        />
                        <div
                            className="w-8 h-8 rounded-lg flex-shrink-0 border border-gray-200 dark:border-gray-600"
                            style={{ backgroundColor: data.secondaryColor }}
                        />
                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
                                {data.businessName || 'Business Name'}
                            </p>
                            <p className="text-xs text-gray-400 dark:text-gray-500">Brand colors</p>
                        </div>
                    </div>
                </SectionCard>
            </div>
        </div>
    );
}

// ─── Tab 4: Notifications ─────────────────────────────────────────────────────

function NotificationsTab({
    initialData,
    onSave,
}: {
    initialData: NotifData;
    onSave: (data: Record<string, unknown>) => void;
}) {
    const [data, setData] = useState(initialData);
    const isFirst = useRef(true);

    useEffect(() => {
        if (isFirst.current) {
            isFirst.current = false;
            return;
        }
        const timer = setTimeout(() => {
            onSave({ notifications: data });
        }, 700);
        return () => clearTimeout(timer);
    }, [data, onSave]);

    const toggle = (key: keyof NotifData) =>
        setData((prev) => ({ ...prev, [key]: !prev[key] }));

    return (
        <div className="space-y-4">
            <SectionCard title="Channels">
                <div className="divide-y divide-gray-100 dark:divide-gray-700/60">
                    <Toggle
                        checked={data.emailEnabled}
                        onChange={() => toggle('emailEnabled')}
                        label="Email Notifications"
                        description="Receive notifications to your account email address"
                    />
                    <Toggle
                        checked={data.telegramEnabled}
                        onChange={() => toggle('telegramEnabled')}
                        label="Telegram Notifications"
                        description="Receive real-time alerts via your connected Telegram bot"
                    />
                </div>
            </SectionCard>

            <SectionCard title="Notification Types">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                    Control which events trigger notifications
                </p>
                <div className="divide-y divide-gray-100 dark:divide-gray-700/60">
                    <Toggle
                        checked={data.postPublished}
                        onChange={() => toggle('postPublished')}
                        label="Post Published"
                        description="Notify when a post is successfully published to social media"
                    />
                    <Toggle
                        checked={data.weeklyReport}
                        onChange={() => toggle('weeklyReport')}
                        label="Weekly Summary Report"
                        description="Every Monday: posts published, engagement highlights, top review"
                    />
                    <Toggle
                        checked={data.usageAlert80}
                        onChange={() => toggle('usageAlert80')}
                        label="Usage Alert (80%)"
                        description="Alert when you've used 80% of your monthly post allowance"
                    />
                    <Toggle
                        checked={data.usageLimit100}
                        onChange={() => toggle('usageLimit100')}
                        label="Usage Limit Reached (100%)"
                        description="Immediate alert when your monthly post limit is fully consumed"
                    />
                </div>
            </SectionCard>
        </div>
    );
}

// ─── Tab 5: Account ───────────────────────────────────────────────────────────

const PLAN_STYLES: Record<string, string> = {
    STARTER: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
    GROWTH: 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-400',
    AGENCY: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400',
};

const AI_MODE_INFO: Record<string, { label: string; desc: string; color: string }> = {
    SHARED: {
        label: 'Shared',
        desc: 'Using ReviewPost shared AI resources — included in your plan',
        color: 'text-gray-700 dark:text-gray-300',
    },
    BYOK: {
        label: 'Bring Your Own Key',
        desc: 'Using your personal OpenAI API key — you control costs directly',
        color: 'text-blue-700 dark:text-blue-400',
    },
    MANAGED: {
        label: 'Managed Dedicated',
        desc: 'Dedicated AI resources with priority access and guaranteed throughput',
        color: 'text-violet-700 dark:text-violet-400',
    },
};

function AccountTab({
    initialData,
    onSave,
}: {
    initialData: AccountData;
    onSave: (data: Record<string, unknown>) => void;
}) {
    const [byokKey, setByokKey] = useState('');
    const [showKey, setShowKey] = useState(false);
    const [savingKey, setSavingKey] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [billingLoading, setBillingLoading] = useState<'upgrade' | 'portal' | null>(null);
    const [showPlanPicker, setShowPlanPicker] = useState(false);
    const [availablePlans, setAvailablePlans] = useState<{ id: string; name: string; displayName: string; price: number; currency: string; interval: string; postsLimit: number }[]>([]);

    const limit = initialData.postsLimit || PLAN_LIMITS_FALLBACK[initialData.plan] || 30;
    const progress = Math.min(100, (initialData.postsGenerated / limit) * 100);
    const modeInfo = AI_MODE_INFO[initialData.aiMode] ?? AI_MODE_INFO.SHARED;

    const handleSaveKey = async () => {
        if (!byokKey.trim()) return;
        setSavingKey(true);
        await onSave({ ownApiKey: byokKey.trim() });
        setSavingKey(false);
        setByokKey('');
    };

    const handleUpgrade = async () => {
        setBillingLoading('upgrade');
        try {
            const plansRes = await fetch('/api/plans');
            const plansData = await plansRes.json();
            setAvailablePlans(plansData.plans ?? []);
            setShowPlanPicker(true);
        } catch {
            // handled below
        } finally {
            setBillingLoading(null);
        }
    };

    const handleCheckout = async (planId: string) => {
        setBillingLoading('upgrade');
        setShowPlanPicker(false);
        try {
            const res = await fetch('/api/billing/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ planId }),
            });
            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                throw new Error(data.error ?? 'Checkout failed');
            }
        } catch (e) {
            alert(e instanceof Error ? e.message : 'Failed to start checkout');
        } finally {
            setBillingLoading(null);
        }
    };

    const handlePortal = async () => {
        setBillingLoading('portal');
        try {
            const res = await fetch('/api/billing/portal', { method: 'POST' });
            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                throw new Error(data.error ?? 'Failed to open portal');
            }
        } catch (e) {
            alert(e instanceof Error ? e.message : 'Failed to open billing portal');
        } finally {
            setBillingLoading(null);
        }
    };

    return (
        <div className="space-y-4">
            {/* Plan + Usage */}
            <SectionCard title="Plan & Usage">
                <div className="flex items-start justify-between mb-5 flex-wrap gap-3">
                    <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">Current Plan</p>
                        <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${
                                PLAN_STYLES[initialData.plan] ?? PLAN_STYLES.STARTER
                            }`}
                        >
                            {initialData.planDisplayName || initialData.plan}
                        </span>
                        {initialData.cancelAtPeriodEnd && initialData.currentPeriodEnd && (
                            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                                Cancels on {new Date(initialData.currentPeriodEnd).toLocaleDateString()}
                            </p>
                        )}
                        {initialData.subscriptionStatus === 'PAST_DUE' && (
                            <p className="text-xs text-red-600 dark:text-red-400 mt-1 font-semibold">
                                Payment past due — please update your payment method
                            </p>
                        )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <button
                            onClick={handleUpgrade}
                            disabled={billingLoading === 'upgrade'}
                            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors shadow-sm shadow-indigo-200 dark:shadow-indigo-900/40 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {billingLoading === 'upgrade' ? 'Loading…' : 'Upgrade Plan'}
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </button>
                        {initialData.hasStripeSubscription && (
                            <button
                                onClick={handlePortal}
                                disabled={billingLoading === 'portal'}
                                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {billingLoading === 'portal' ? 'Loading…' : 'Manage Subscription'}
                            </button>
                        )}
                    </div>
                </div>

                {/* Plan Picker Modal */}
                {showPlanPicker && availablePlans.length > 0 && (
                    <div className="mb-5 bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Choose a Plan</h4>
                            <button onClick={() => setShowPlanPicker(false)} className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                                Cancel
                            </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {availablePlans
                                .filter((p) => p.interval === 'MONTHLY')
                                .map((plan) => (
                                <button
                                    key={plan.id}
                                    onClick={() => handleCheckout(plan.id)}
                                    disabled={plan.name === initialData.plan}
                                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                                        plan.name === initialData.plan
                                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 cursor-default'
                                            : 'border-gray-200 dark:border-gray-600 hover:border-indigo-300 dark:hover:border-indigo-700 cursor-pointer'
                                    }`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-bold text-gray-900 dark:text-white">{plan.displayName}</span>
                                        {plan.name === initialData.plan && (
                                            <span className="text-xs bg-indigo-600 text-white px-2 py-0.5 rounded-full">Current</span>
                                        )}
                                    </div>
                                    <p className="text-lg font-extrabold text-gray-900 dark:text-white">
                                        {plan.currency === 'SAR' ? '﷼' : plan.currency === 'TL' ? '₺' : '$'}{plan.price}
                                        <span className="text-xs font-normal text-gray-500">/mo</span>
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{plan.postsLimit} posts/month</p>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2.5">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Posts generated this month
                        </span>
                        <span className="text-sm font-bold text-gray-900 dark:text-white tabular-nums">
                            {initialData.postsGenerated}
                            <span className="text-gray-400 dark:text-gray-500 font-normal">/{limit}</span>
                        </span>
                    </div>
                    <div className="w-full h-3 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-700 ${
                                progress >= 90
                                    ? 'bg-red-500'
                                    : progress >= 75
                                    ? 'bg-amber-500'
                                    : 'bg-indigo-600'
                            }`}
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            {limit - initialData.postsGenerated} posts remaining
                        </p>
                        {progress >= 80 && (
                            <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                                </svg>
                                Running low
                            </p>
                        )}
                    </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                    {[
                        { label: 'Posts Published', value: initialData.postsPublished },
                        { label: 'Plan Limit', value: `${limit}/mo` },
                    ].map(({ label, value }) => (
                        <div
                            key={label}
                            className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 text-center"
                        >
                            <p className="text-lg font-bold text-gray-900 dark:text-white tabular-nums">
                                {value}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
                        </div>
                    ))}
                </div>
            </SectionCard>

            {/* AI Mode */}
            <SectionCard title="AI Mode">
                <div className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl mb-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center flex-shrink-0">
                        <svg
                            className="w-5 h-5 text-indigo-600 dark:text-indigo-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.8}
                                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                            />
                        </svg>
                    </div>
                    <div>
                        <p className={`text-sm font-bold ${modeInfo.color}`}>{modeInfo.label}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                            {modeInfo.desc}
                        </p>
                    </div>
                </div>

                {initialData.aiMode === 'BYOK' && (
                    <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-2">
                            OpenAI API Key
                            {initialData.hasByokKey && (
                                <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-normal">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    Key saved
                                </span>
                            )}
                        </label>
                        <div className="flex gap-2">
                            <input
                                type={showKey ? 'text' : 'password'}
                                value={byokKey}
                                onChange={(e) => setByokKey(e.target.value)}
                                placeholder={initialData.hasByokKey ? 'Enter new key to replace…' : 'sk-…'}
                                className="flex-1 px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-0"
                            />
                            <button
                                type="button"
                                onClick={() => setShowKey((v) => !v)}
                                title={showKey ? 'Hide key' : 'Show key'}
                                className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors flex-shrink-0"
                            >
                                {showKey ? (
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" />
                                    </svg>
                                ) : (
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={handleSaveKey}
                                disabled={!byokKey.trim() || savingKey}
                                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors flex-shrink-0"
                            >
                                {savingKey ? 'Saving…' : 'Save Key'}
                            </button>
                        </div>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">
                            Your key is stored securely and never shared with third parties.
                        </p>
                    </div>
                )}

                {initialData.aiMode !== 'BYOK' && (
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                        To switch AI mode or use your own API key, upgrade your plan or contact support.
                    </p>
                )}
            </SectionCard>

            {/* Danger Zone */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-red-100 dark:border-red-900/40 shadow-sm p-6">
                <h3 className="text-xs font-semibold text-red-500 dark:text-red-400 uppercase tracking-widest mb-4">
                    Danger Zone
                </h3>

                {!showDeleteConfirm ? (
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div>
                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                Delete Account
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                Permanently delete your account, all businesses, posts, and reviews.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowDeleteConfirm(true)}
                            className="flex-shrink-0 px-4 py-2 rounded-xl border-2 border-red-200 dark:border-red-800/60 text-red-600 dark:text-red-400 text-sm font-semibold hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                            Delete Account
                        </button>
                    </div>
                ) : (
                    <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4">
                        <p className="text-sm font-bold text-red-700 dark:text-red-400 mb-1">
                            Are you absolutely sure?
                        </p>
                        <p className="text-xs text-red-600/80 dark:text-red-400/70 mb-4 leading-relaxed">
                            This will permanently delete your ReviewPost account, all connected
                            businesses, every post, and every review. This action cannot be undone.
                        </p>
                        <div className="flex items-center gap-3 flex-wrap">
                            <button
                                type="button"
                                onClick={() => setShowDeleteConfirm(false)}
                                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() =>
                                    alert(
                                        'Account deletion requires identity verification.\nPlease email support@reviewpost.app with subject: DELETE ACCOUNT',
                                    )
                                }
                                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors"
                            >
                                Yes, Delete Everything
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Main Settings Page ────────────────────────────────────────────────────────

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState('schedule');
    const [settings, setSettings] = useState<SettingsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState<ToastState>({
        visible: false,
        message: '',
        type: 'success',
    });

    const showToast = useCallback(
        (message: string, type: 'success' | 'error' = 'success') => {
            setToast({ visible: true, message, type });
            setTimeout(() => setToast((prev) => ({ ...prev, visible: false })), 3000);
        },
        [],
    );

    useEffect(() => {
        fetch('/api/settings')
            .then((r) => r.json())
            .then((data: SettingsData) => {
                setSettings(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    // ── Save handlers (per tab) ──────────────────────────────────────────────

    const handleScheduleSave = useCallback(
        async (data: Record<string, unknown>) => {
            try {
                const r = await fetch('/api/settings', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ type: 'schedule', data }),
                });
                if (!r.ok) throw new Error();
                showToast('Schedule saved');
            } catch {
                showToast('Failed to save schedule', 'error');
            }
        },
        [showToast],
    );

    const handleTemplateSave = useCallback(
        async (data: Record<string, unknown>) => {
            try {
                const r = await fetch('/api/settings/brand', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                });
                if (!r.ok) throw new Error();
                showToast('Template saved');
            } catch {
                showToast('Failed to save template', 'error');
            }
        },
        [showToast],
    );

    const handleBrandSave = useCallback(
        async (data: Record<string, unknown>) => {
            try {
                const r = await fetch('/api/settings/brand', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                });
                if (!r.ok) throw new Error();
                showToast('Brand kit saved');
            } catch {
                showToast('Failed to save brand kit', 'error');
            }
        },
        [showToast],
    );

    const handleNotifSave = useCallback(
        async (data: Record<string, unknown>) => {
            try {
                const r = await fetch('/api/settings', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ type: 'notifications', data }),
                });
                if (!r.ok) throw new Error();
                showToast('Notifications saved');
            } catch {
                showToast('Failed to save notifications', 'error');
            }
        },
        [showToast],
    );

    const handleAccountSave = useCallback(
        async (data: Record<string, unknown>) => {
            try {
                const r = await fetch('/api/settings', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ type: 'account', data }),
                });
                if (!r.ok) throw new Error();
                showToast('Account updated');
            } catch {
                showToast('Failed to update account', 'error');
            }
        },
        [showToast],
    );

    // ── Derive tab-specific data from loaded settings ────────────────────────

    const bc = settings?.business?.brandColors ?? {};

    const scheduleData: ScheduleData = {
        autoPost: bc.autoPostEnabled ?? false,
        days: bc.postDays ?? ['MON', 'WED', 'FRI'],
        time: bc.postTime ?? '09:00',
        postsPerWeek: bc.postFrequency ?? 3,
        platforms: bc.defaultPlatforms ?? ['INSTAGRAM'],
    };

    const templateData: TemplateTabData = {
        selectedTemplate: bc.selectedTemplate ?? 'classic',
        primaryColor: bc.primary ?? '#7C3AED',
        secondaryColor: bc.secondary ?? '#4F46E5',
    };

    const brandData: BrandData = {
        businessName: settings?.business?.name ?? '',
        logoUrl: settings?.business?.logoUrl ?? '',
        primaryColor: bc.primary ?? '#7C3AED',
        secondaryColor: bc.secondary ?? '#4F46E5',
        selectedTemplate: bc.selectedTemplate ?? 'classic',
    };

    const notifData: NotifData = {
        emailEnabled: bc.notifications?.emailEnabled ?? true,
        telegramEnabled: bc.notifications?.telegramEnabled ?? false,
        postPublished: bc.notifications?.postPublished ?? true,
        weeklyReport: bc.notifications?.weeklyReport ?? true,
        usageAlert80: bc.notifications?.usageAlert80 ?? true,
        usageLimit100: bc.notifications?.usageLimit100 ?? true,
    };

    const userExt = settings?.user as {
        planDisplayName?: string;
        postsLimit?: number;
        hasStripeSubscription?: boolean;
        subscriptionStatus?: string | null;
        cancelAtPeriodEnd?: boolean;
        currentPeriodEnd?: string | null;
    } | undefined;

    const accountData: AccountData = {
        plan: settings?.user.plan ?? 'STARTER',
        planDisplayName: userExt?.planDisplayName ?? settings?.user.plan ?? 'Starter',
        postsLimit: userExt?.postsLimit ?? PLAN_LIMITS_FALLBACK[settings?.user.plan ?? 'STARTER'] ?? 30,
        aiMode: settings?.user.aiMode ?? 'SHARED',
        hasByokKey: settings?.user.hasByokKey ?? false,
        postsGenerated: settings?.usage.postsGenerated ?? 0,
        postsPublished: settings?.usage.postsPublished ?? 0,
        hasStripeSubscription: userExt?.hasStripeSubscription ?? false,
        subscriptionStatus: userExt?.subscriptionStatus ?? null,
        cancelAtPeriodEnd: userExt?.cancelAtPeriodEnd ?? false,
        currentPeriodEnd: userExt?.currentPeriodEnd ?? null,
    };

    return (
        <div className="p-6 md:p-8 max-w-5xl mx-auto">
            {/* Page header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    Changes are saved automatically · Arabic RTL support enabled
                </p>
            </div>

            {/* Tab navigation */}
            <div className="flex overflow-x-auto border-b border-gray-200 dark:border-gray-700 mb-6 -mx-6 md:-mx-8 px-6 md:px-8 gap-0.5 pb-px">
                {TABS.map((tab) => (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition-all duration-150 focus:outline-none ${
                            activeTab === tab.id
                                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab content */}
            {loading ? (
                <TabSkeleton />
            ) : (
                <>
                    {activeTab === 'schedule' && (
                        <ScheduleTab
                            key="schedule"
                            initialData={scheduleData}
                            onSave={handleScheduleSave}
                        />
                    )}
                    {activeTab === 'templates' && (
                        <TemplatesTab
                            key="templates"
                            initialData={templateData}
                            onSave={handleTemplateSave}
                        />
                    )}
                    {activeTab === 'brand' && (
                        <BrandKitTab
                            key="brand"
                            initialData={brandData}
                            onSave={handleBrandSave}
                        />
                    )}
                    {activeTab === 'notifications' && (
                        <NotificationsTab
                            key="notifications"
                            initialData={notifData}
                            onSave={handleNotifSave}
                        />
                    )}
                    {activeTab === 'account' && (
                        <AccountTab
                            key="account"
                            initialData={accountData}
                            onSave={handleAccountSave}
                        />
                    )}
                </>
            )}

            {/* Toast */}
            <Toast toast={toast} />
        </div>
    );
}
