'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import type { OnboardingState } from '@/lib/onboarding/types';

// ─── Constants ────────────────────────────────────────────────

const STEPS = [
    { id: 1, title: 'Connect Reviews', icon: '🔗' },
    { id: 2, title: 'Brand Setup', icon: '🎨' },
    { id: 3, title: 'Pick Template', icon: '🖼' },
    { id: 4, title: 'Preview & Launch', icon: '🚀' },
];

const TEMPLATE_CARDS = [
    {
        id: 'classic' as const,
        name: 'Classic',
        desc: 'Clean & professional — great for restaurants, clinics, and service businesses.',
        gradient: 'linear-gradient(145deg, #7C3AED 0%, #3b1e8c 100%)',
        icon: '✨',
    },
    {
        id: 'bold' as const,
        name: 'Bold',
        desc: 'High-contrast dark design — eye-catching for any brand.',
        gradient: 'linear-gradient(145deg, #0d0d0d 0%, #1a1a2e 100%)',
        accent: '#F59E0B',
        icon: '⚡',
    },
    {
        id: 'product' as const,
        name: 'Product',
        desc: 'Split layout with product image — ideal for e-commerce & retail.',
        gradient: 'linear-gradient(145deg, #059669 0%, #065f46 100%)',
        icon: '🛍',
    },
];

const BUSINESS_TYPES = [
    { value: 'RESTAURANT', label: '🍽 Restaurant', labelAr: 'مطعم' },
    { value: 'HOTEL', label: '🏨 Hotel', labelAr: 'فندق' },
    { value: 'CLINIC', label: '🏥 Clinic', labelAr: 'عيادة' },
    { value: 'SALON', label: '💇 Salon', labelAr: 'صالون' },
    { value: 'STORE', label: '🏪 Store', labelAr: 'متجر' },
    { value: 'OTHER', label: '🏢 Other', labelAr: 'أخرى' },
];

// ─── Sample preview posts ─────────────────────────────────────

const SAMPLE_REVIEWS = [
    { author: 'أحمد العلي', text: 'تجربة رائعة جداً! الخدمة ممتازة والجودة عالية.', rating: 5 },
    { author: 'Sarah K.', text: 'Amazing experience! Highly recommend to everyone.', rating: 5 },
    { author: 'Mehmet Yılmaz', text: 'Harikaydı! Kesinlikle tekrar geleceğim.', rating: 5 },
];

// ─── Helpers ─────────────────────────────────────────────────

function Stars({ rating }: { rating: number }) {
    return <span style={{ color: '#FFD700', letterSpacing: 2 }}>{'★'.repeat(rating)}{'☆'.repeat(5 - rating)}</span>;
}

// ─── Mini template preview cards ─────────────────────────────

function MiniTemplatePreview({ template, primary, secondary, logoUrl, businessName, review }: {
    template: 'classic' | 'bold' | 'product';
    primary: string;
    secondary: string;
    logoUrl: string;
    businessName: string;
    review: typeof SAMPLE_REVIEWS[0];
}) {
    const base: React.CSSProperties = {
        width: '100%', paddingBottom: '100%', position: 'relative',
        borderRadius: 12, overflow: 'hidden', flexShrink: 0,
    };

    const inner: React.CSSProperties = {
        position: 'absolute', inset: 0, display: 'flex',
        flexDirection: 'column', padding: 16, fontFamily: "'Inter', sans-serif",
    };

    if (template === 'bold') {
        return (
            <div style={base}>
                <div style={{ ...inner, background: '#0d0d0d' }}>
                    <div style={{ width: 4, position: 'absolute', top: 0, bottom: 0, left: 0, background: `linear-gradient(180deg, ${primary}, ${secondary})` }} />
                    <div style={{ marginLeft: 12 }}>
                        <div style={{ fontSize: 20, color: primary, letterSpacing: 2, marginBottom: 4 }}>★★★★★</div>
                        <div style={{ fontSize: 11, fontWeight: 900, color: '#fff', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{review.text}</div>
                        <div style={{ marginTop: 8, fontSize: 9, color: primary }}>{businessName}</div>
                    </div>
                </div>
            </div>
        );
    }

    if (template === 'product') {
        return (
            <div style={base}>
                <div style={{ ...inner, flexDirection: 'row', background: '#f8f8f8', padding: 0 }}>
                    <div style={{ width: '50%', background: `linear-gradient(135deg, ${primary}33, ${secondary}22)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>🛍</div>
                    <div style={{ flex: 1, padding: 12, borderTop: `4px solid ${primary}` }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: primary, textTransform: 'uppercase', marginBottom: 4 }}>Review</div>
                        <div style={{ fontSize: 10, color: '#333', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>"{review.text}"</div>
                        <div style={{ marginTop: 6, fontSize: 9, color: '#888' }}>{review.author}</div>
                        <div style={{ marginTop: 8, padding: '4px 8px', background: `linear-gradient(135deg, ${primary}, ${secondary})`, borderRadius: 6, fontSize: 9, color: '#fff', textAlign: 'center' }}>Shop Now</div>
                    </div>
                </div>
            </div>
        );
    }

    // Classic
    return (
        <div style={base}>
            <div style={{ ...inner, background: `linear-gradient(145deg, ${primary} 0%, ${secondary} 100%)`, alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, alignSelf: 'flex-start' }}>
                    {logoUrl ? <img src={logoUrl} alt="" style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }} /> : <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(255,255,255,0.3)' }} />}
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#fff' }}>{businessName || 'Your Business'}</span>
                </div>
                <div style={{ fontSize: 12, color: '#fff', textAlign: 'center', fontStyle: 'italic', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>"{review.text}"</div>
                <div style={{ alignSelf: 'stretch', background: 'rgba(0,0,0,0.2)', borderRadius: 8, padding: '6px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.7)' }}>{review.author}</span>
                    <Stars rating={review.rating} />
                </div>
            </div>
        </div>
    );
}

// ─── Progress bar ─────────────────────────────────────────────

function ProgressBar({ current, total }: { current: number; total: number }) {
    return (
        <div className="w-full mb-8">
            <div className="flex justify-between mb-2">
                {STEPS.map((s) => (
                    <div key={s.id} className="flex flex-col items-center gap-1">
                        <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${s.id < current ? 'bg-violet-600 text-white' :
                                    s.id === current ? 'bg-violet-600 text-white ring-4 ring-violet-200 dark:ring-violet-900' :
                                        'bg-gray-200 dark:bg-gray-700 text-gray-400'
                                }`}
                        >
                            {s.id < current ? '✓' : s.icon}
                        </div>
                        <span className={`text-xs hidden sm:block ${s.id === current ? 'text-violet-600 font-semibold' : 'text-gray-400'}`}>
                            {s.title}
                        </span>
                    </div>
                ))}
            </div>
            <div className="relative h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full mt-1">
                <div
                    className="absolute h-full bg-violet-600 rounded-full transition-all duration-500"
                    style={{ width: `${((current - 1) / (total - 1)) * 100}%` }}
                />
            </div>
        </div>
    );
}

// ─── Step 1: Google Connect ───────────────────────────────────

function Step1({ state, setState, onNext }: {
    state: OnboardingState;
    setState: (s: Partial<OnboardingState>) => void;
    onNext: () => void;
}) {
    const [connecting, setConnecting] = useState(false);

    const mockLocations = [
        { name: 'accounts/123/locations/456', display: state.businessName || 'My Business — Al Riyadh' },
        { name: 'accounts/123/locations/789', display: 'My Business — Al Khobar' },
    ];

    const handleConnect = () => {
        setConnecting(true);
        // Trigger Google Business OAuth — in production this goes through the GMB OAuth flow
        signIn('google', {
            callbackUrl: '/onboarding?step=1&connected=true',
            // Additional scopes for GMB can be passed here
        });
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="text-center mb-2">
                <div className="text-5xl mb-3">🔗</div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Connect Your Reviews</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-2">Link your Google Business Profile to start pulling your reviews automatically.</p>
            </div>

            {!state.googleConnected ? (
                <div className="flex flex-col gap-4">
                    <button
                        onClick={handleConnect}
                        disabled={connecting}
                        className="flex items-center justify-center gap-3 w-full py-4 bg-white border-2 border-gray-200 hover:border-violet-400 rounded-2xl font-semibold text-gray-700 hover:text-violet-700 transition-all shadow-sm hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        <svg width="22" height="22" viewBox="0 0 18 18">
                            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
                            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853" />
                            <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
                            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
                        </svg>
                        {connecting ? 'Connecting...' : 'Connect Google Business Profile'}
                    </button>

                    {/* Skip option */}
                    <div className="relative flex items-center gap-3">
                        <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                        <span className="text-xs text-gray-400">or</span>
                        <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                    </div>

                    <button
                        onClick={() => { setState({ googleConnected: true, selectedLocationName: 'manual', selectedLocationDisplay: 'Manual setup' }); onNext(); }}
                        className="w-full py-3 border border-dashed border-gray-300 dark:border-gray-600 rounded-2xl text-sm text-gray-500 hover:text-gray-700 hover:border-gray-400 transition-all"
                    >
                        Skip for now — I&apos;ll add reviews manually
                    </button>
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2 text-green-600 font-semibold mb-2">
                        <span className="text-xl">✅</span> Connected to Google Business
                    </div>
                    <p className="text-sm text-gray-500 mb-1">Select the location to use:</p>
                    {mockLocations.map((loc) => (
                        <button
                            key={loc.name}
                            onClick={() => setState({ selectedLocationName: loc.name, selectedLocationDisplay: loc.display })}
                            className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${state.selectedLocationName === loc.name
                                    ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/30 dark:border-violet-400'
                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                                }`}
                        >
                            <div className="font-semibold text-gray-800 dark:text-white">📍 {loc.display}</div>
                            <div className="text-xs text-gray-400 mt-0.5">Google Business Profile · Connected</div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Step 2: Brand Setup ──────────────────────────────────────

function Step2({ state, setState }: {
    state: OnboardingState;
    setState: (s: Partial<OnboardingState>) => void;
}) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => setState({ logoUrl: ev.target?.result as string });
        reader.readAsDataURL(file);
    };

    return (
        <div className="flex flex-col gap-5">
            <div className="text-center mb-2">
                <div className="text-5xl mb-3">🎨</div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Brand Your Content</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-2">Set up your brand identity so every post looks consistent.</p>
            </div>

            {/* Logo upload */}
            <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Business Logo</label>
                <div
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-4 p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl cursor-pointer hover:border-violet-400 transition-all"
                >
                    {state.logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={state.logoUrl} alt="logo" className="w-16 h-16 rounded-full object-cover border-2 border-violet-200" />
                    ) : (
                        <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-2xl">🏪</div>
                    )}
                    <div>
                        <div className="font-semibold text-gray-700 dark:text-gray-300">
                            {state.logoUrl ? 'Change logo' : 'Upload your logo'}
                        </div>
                        <div className="text-xs text-gray-400">PNG, JPG, SVG — recommended 512×512px</div>
                    </div>
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
            </div>

            {/* Business name */}
            <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Business Name</label>
                <input
                    type="text"
                    value={state.businessName ?? ''}
                    onChange={(e) => setState({ businessName: e.target.value })}
                    placeholder="e.g. مطعم الذواقة / The Coffee Corner"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-400 transition"
                />
            </div>

            {/* Business type */}
            <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Business Type</label>
                <div className="grid grid-cols-3 gap-2">
                    {BUSINESS_TYPES.map((t) => (
                        <button
                            key={t.value}
                            onClick={() => setState({ businessType: t.value })}
                            className={`py-2.5 px-3 rounded-xl text-sm font-medium border-2 transition-all ${state.businessType === t.value
                                    ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300'
                                    : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                                }`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Colors */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Primary Color</label>
                    <div className="flex items-center gap-3 p-3 border border-gray-300 dark:border-gray-600 rounded-xl">
                        <input
                            type="color"
                            value={state.primaryColor ?? '#7C3AED'}
                            onChange={(e) => setState({ primaryColor: e.target.value })}
                            className="w-10 h-10 rounded-lg cursor-pointer border-0 bg-transparent"
                        />
                        <span className="text-sm font-mono text-gray-500 dark:text-gray-400">
                            {state.primaryColor ?? '#7C3AED'}
                        </span>
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Secondary Color</label>
                    <div className="flex items-center gap-3 p-3 border border-gray-300 dark:border-gray-600 rounded-xl">
                        <input
                            type="color"
                            value={state.secondaryColor ?? '#4F46E5'}
                            onChange={(e) => setState({ secondaryColor: e.target.value })}
                            className="w-10 h-10 rounded-lg cursor-pointer border-0 bg-transparent"
                        />
                        <span className="text-sm font-mono text-gray-500 dark:text-gray-400">
                            {state.secondaryColor ?? '#4F46E5'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Live mini preview */}
            <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Preview</label>
                <div className="w-48 mx-auto">
                    <MiniTemplatePreview
                        template={state.selectedTemplate ?? 'classic'}
                        primary={state.primaryColor ?? '#7C3AED'}
                        secondary={state.secondaryColor ?? '#4F46E5'}
                        logoUrl={state.logoUrl ?? ''}
                        businessName={state.businessName ?? 'Your Business'}
                        review={SAMPLE_REVIEWS[0]}
                    />
                </div>
            </div>
        </div>
    );
}

// ─── Step 3: Template picker ──────────────────────────────────

function Step3({ state, setState }: {
    state: OnboardingState;
    setState: (s: Partial<OnboardingState>) => void;
}) {
    const [previewReview, setPreviewReview] = useState(0);

    return (
        <div className="flex flex-col gap-6">
            <div className="text-center mb-2">
                <div className="text-5xl mb-3">🖼</div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Choose Your Template</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-2">Pick the design style that best matches your brand.</p>
            </div>

            {/* Template cards */}
            <div className="flex flex-col gap-3">
                {TEMPLATE_CARDS.map((tpl) => (
                    <button
                        key={tpl.id}
                        onClick={() => setState({ selectedTemplate: tpl.id })}
                        className={`flex items-start gap-4 p-4 rounded-2xl border-2 text-left transition-all ${state.selectedTemplate === tpl.id
                                ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/30'
                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                            }`}
                    >
                        {/* Mini preview */}
                        <div className="w-20 flex-shrink-0">
                            <MiniTemplatePreview
                                template={tpl.id}
                                primary={state.primaryColor ?? '#7C3AED'}
                                secondary={state.secondaryColor ?? '#4F46E5'}
                                logoUrl={state.logoUrl ?? ''}
                                businessName={state.businessName ?? 'Business'}
                                review={SAMPLE_REVIEWS[previewReview]}
                            />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-gray-800 dark:text-white">{tpl.icon} {tpl.name}</span>
                                {state.selectedTemplate === tpl.id && (
                                    <span className="text-xs bg-violet-100 dark:bg-violet-900/50 text-violet-600 dark:text-violet-300 px-2 py-0.5 rounded-full font-medium">Selected</span>
                                )}
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{tpl.desc}</p>
                        </div>
                    </button>
                ))}
            </div>

            {/* Language preview switcher */}
            <div className="flex gap-2 justify-center">
                {SAMPLE_REVIEWS.map((r, i) => (
                    <button
                        key={i}
                        onClick={() => setPreviewReview(i)}
                        className={`px-3 py-1.5 text-xs rounded-full font-medium transition-all ${previewReview === i
                                ? 'bg-violet-600 text-white'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200'
                            }`}
                    >
                        {i === 0 ? '🇸🇦 AR' : i === 1 ? '🇺🇸 EN' : '🇹🇷 TR'}
                    </button>
                ))}
            </div>
        </div>
    );
}

// ─── Step 4: Preview & Launch ─────────────────────────────────

function Step4({ state, setState, onComplete }: {
    state: OnboardingState;
    setState: (s: Partial<OnboardingState>) => void;
    onComplete: () => void;
}) {
    const [carouselIdx, setCarouselIdx] = useState(0);
    const [activating, setActivating] = useState(false);

    const handleActivate = async () => {
        setActivating(true);
        setState({ autoPostEnabled: true, postFrequency: 3 });
        setTimeout(() => { onComplete(); }, 800);
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="text-center mb-2">
                <div className="text-5xl mb-3">🚀</div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Preview & Launch</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-2">Here&apos;s how your posts will look. Ready to go live?</p>
            </div>

            {/* Carousel preview */}
            <div className="relative">
                <div className="w-52 mx-auto">
                    <MiniTemplatePreview
                        template={state.selectedTemplate ?? 'classic'}
                        primary={state.primaryColor ?? '#7C3AED'}
                        secondary={state.secondaryColor ?? '#4F46E5'}
                        logoUrl={state.logoUrl ?? ''}
                        businessName={state.businessName ?? 'Your Business'}
                        review={SAMPLE_REVIEWS[carouselIdx]}
                    />
                </div>
                <div className="flex justify-center gap-2 mt-4">
                    {SAMPLE_REVIEWS.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setCarouselIdx(i)}
                            className={`w-2 h-2 rounded-full transition-all ${i === carouselIdx ? 'bg-violet-600 w-6' : 'bg-gray-300 dark:bg-gray-600'}`}
                        />
                    ))}
                </div>
            </div>

            {/* Auto-post settings */}
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-5 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="font-semibold text-gray-800 dark:text-white">Auto-Post Schedule</div>
                        <div className="text-sm text-gray-500">Automatically post new reviews 3× per week</div>
                    </div>
                    <button
                        onClick={() => setState({ autoPostEnabled: !state.autoPostEnabled })}
                        className={`relative w-12 h-6 rounded-full transition-all ${state.autoPostEnabled ? 'bg-violet-600' : 'bg-gray-300 dark:bg-gray-600'}`}
                    >
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${state.autoPostEnabled ? 'left-7' : 'left-1'}`} />
                    </button>
                </div>

                {state.autoPostEnabled && (
                    <div>
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Posts per week</div>
                        <div className="flex gap-2">
                            {[1, 2, 3, 5, 7].map((n) => (
                                <button
                                    key={n}
                                    onClick={() => setState({ postFrequency: n })}
                                    className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${(state.postFrequency ?? 3) === n
                                            ? 'bg-violet-600 text-white'
                                            : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600'
                                        }`}
                                >
                                    {n}×
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Summary */}
            <div className="bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-950/30 dark:to-indigo-950/30 rounded-2xl p-5 border border-violet-100 dark:border-violet-900">
                <div className="font-semibold text-violet-800 dark:text-violet-300 mb-3">📋 Your Setup</div>
                <div className="grid grid-cols-2 gap-y-2 text-sm">
                    <span className="text-gray-500">Business</span><span className="font-medium text-gray-800 dark:text-white">{state.businessName ?? '—'}</span>
                    <span className="text-gray-500">Template</span><span className="font-medium text-gray-800 dark:text-white capitalize">{state.selectedTemplate ?? 'classic'}</span>
                    <span className="text-gray-500">Reviews from</span><span className="font-medium text-gray-800 dark:text-white">Google Business</span>
                    <span className="text-gray-500">Posting</span><span className="font-medium text-gray-800 dark:text-white">{state.autoPostEnabled ? `${state.postFrequency ?? 3}× / week` : 'Manual'}</span>
                </div>
            </div>

            {/* CTA */}
            <button
                onClick={handleActivate}
                disabled={activating}
                className="w-full py-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold text-lg rounded-2xl shadow-lg shadow-violet-200 dark:shadow-violet-900/50 hover:shadow-xl transition-all active:scale-[0.98] disabled:opacity-70"
            >
                {activating ? '✨ Setting up...' : '🚀 Activate & Go to Dashboard'}
            </button>
        </div>
    );
}

// ─── Main wizard ──────────────────────────────────────────────

const INITIAL_STATE: OnboardingState = {
    googleConnected: false,
    primaryColor: '#7C3AED',
    secondaryColor: '#4F46E5',
    selectedTemplate: 'classic',
    autoPostEnabled: true,
    postFrequency: 3,
    currentStep: 1,
};

export default function OnboardingPage() {
    const router = useRouter();
    const [state, setStateRaw] = useState<OnboardingState>(INITIAL_STATE);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const setState = useCallback((partial: Partial<OnboardingState>) => {
        setStateRaw((prev) => ({ ...prev, ...partial }));
    }, []);

    // تحقق إذا المستخدم أكمل الـ onboarding — إذا نعم، حوّله للداشبورد
    useEffect(() => {
        (async () => {
            try {
                const res = await fetch('/api/onboarding');
                const data = await res.json() as {
                    hasCompletedOnboarding: boolean;
                    business?: { id: string; name: string; logoUrl: string | null; brandColors: Record<string, string> | null };
                };
                if (data.hasCompletedOnboarding && data.business) {
                    const bc = data.business.brandColors ?? {};
                    // إذا في onboardedAt — يعني خلص، حوّله للداشبورد
                    if (bc.onboardedAt) {
                        router.replace('/dashboard');
                        return;
                    }
                    // إذا في بزنس بس ما خلّص — حمّل البيانات المحفوظة وكمّل من وين وقف
                    setState({
                        businessId: data.business.id,
                        businessName: data.business.name,
                        logoUrl: data.business.logoUrl ?? undefined,
                        primaryColor: bc.primary ?? '#7C3AED',
                        secondaryColor: bc.secondary ?? '#4F46E5',
                        selectedTemplate: (bc.selectedTemplate as OnboardingState['selectedTemplate']) ?? 'classic',
                        currentStep: bc.selectedTemplate ? 3 : 2,
                    });
                }
            } catch {
                // تجاهل — يبدأ من الصفر
            } finally {
                setLoading(false);
            }
        })();
    }, [router, setState]);

    const currentStep = state.currentStep;

    const saveStep = async (step: number): Promise<boolean> => {
        setSaving(true);
        setError(null);
        try {
            const res = await fetch('/api/onboarding', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ step, data: state, businessId: state.businessId }),
            });
            const json = await res.json() as { success: boolean; businessId?: string; error?: string };
            if (!json.success) { setError(json.error ?? 'Save failed'); return false; }
            if (json.businessId) setState({ businessId: json.businessId });
            return true;
        } catch (e) {
            setError(String(e));
            return false;
        } finally {
            setSaving(false);
        }
    };

    const handleNext = async () => {
        // Step 1 doesn't need saving at next; Step 2 upserts business
        if (currentStep === 2) {
            const ok = await saveStep(2);
            if (!ok) return;
        }
        if (currentStep === 3) {
            await saveStep(3);
        }
        setState({ currentStep: Math.min(currentStep + 1, 4) });
    };

    const handleBack = () => {
        setState({ currentStep: Math.max(currentStep - 1, 1) });
    };

    const handleComplete = async () => {
        await saveStep(4);
        router.push('/dashboard');
    };

    const canGoNext = () => {
        if (currentStep === 2) return !!(state.businessName?.trim());
        return true;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-4xl mb-4 animate-pulse">⭐</div>
                    <div className="text-gray-400 text-sm">Loading...</div>
                </div>
            </div>
        );
    }

    return (
        <div dir="auto" className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-start justify-center py-8 px-4">
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 bg-white dark:bg-gray-900 rounded-2xl px-4 py-2 shadow-sm border border-gray-100 dark:border-gray-800 mb-4">
                        <span className="text-xl">⭐</span>
                        <span className="font-bold text-gray-800 dark:text-white">ReviewPost</span>
                    </div>
                    <h1 className="text-lg font-medium text-gray-500 dark:text-gray-400">Let&apos;s get you set up in 4 steps</h1>
                </div>

                {/* Card */}
                <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl shadow-gray-200/80 dark:shadow-black/40 border border-gray-100 dark:border-gray-800 p-6 sm:p-8">
                    {/* Progress */}
                    <ProgressBar current={currentStep} total={4} />

                    {/* Error */}
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-600 dark:text-red-400">
                            ⚠️ {error}
                        </div>
                    )}

                    {/* Steps */}
                    {currentStep === 1 && <Step1 state={state} setState={setState} onNext={handleNext} />}
                    {currentStep === 2 && <Step2 state={state} setState={setState} />}
                    {currentStep === 3 && <Step3 state={state} setState={setState} />}
                    {currentStep === 4 && <Step4 state={state} setState={setState} onComplete={handleComplete} />}

                    {/* Navigation (not shown on step 4 which has its own CTA) */}
                    {currentStep < 4 && (
                        <div className="flex gap-3 mt-8">
                            {currentStep > 1 && (
                                <button
                                    onClick={handleBack}
                                    className="flex-1 py-3 border border-gray-200 dark:border-gray-700 rounded-2xl text-gray-600 dark:text-gray-400 font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                                >
                                    ← Back
                                </button>
                            )}
                            {currentStep !== 1 && (
                                <button
                                    onClick={handleNext}
                                    disabled={!canGoNext() || saving}
                                    className="flex-1 py-3 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-400 text-white font-bold rounded-2xl shadow-md shadow-violet-200 dark:shadow-violet-900/30 transition-all active:scale-[0.98] disabled:cursor-not-allowed"
                                >
                                    {saving ? 'Saving...' : currentStep === 3 ? 'Next → Preview' : 'Continue →'}
                                </button>
                            )}
                            {currentStep === 1 && (
                                <button
                                    onClick={handleNext}
                                    className="flex-1 py-3 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-2xl shadow-md shadow-violet-200 dark:shadow-violet-900/30 transition-all active:scale-[0.98]"
                                >
                                    Continue →
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer note */}
                <p className="text-center text-xs text-gray-400 mt-6">
                    Your progress is saved automatically · You can close and come back anytime
                </p>
            </div>
        </div>
    );
}
