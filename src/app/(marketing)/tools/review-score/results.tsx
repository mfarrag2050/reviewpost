'use client';

import { useState, useEffect, useRef } from 'react';
import type { ReviewScoreResponse } from '@/app/api/tools/review-score/route';

type Lang = 'EN' | 'AR' | 'TR';

// ── Translations ──────────────────────────────────────────────────────────
const T: Record<Lang, Record<string, string>> = {
    EN: {
        score: 'Review Social Score',
        volume: 'Review Volume',
        quality: 'Rating Quality',
        freshness: 'Freshness',
        detail: 'Detail Level',
        topPercent: "You're in the top",
        ofBusinesses: 'of similar businesses in your area',
        sampleTitle: "Here's what your reviews could look like as Instagram posts",
        cta: 'Want these posts published automatically?',
        ctaBtn: 'Start Your Free Trial',
        share: 'Share Your Score',
        copied: 'Link copied!',
        outOf: 'out of 100',
        reviews: 'reviews',
        rating: 'avg rating',
        poor: 'Needs Work',
        average: 'Average',
        good: 'Good',
        excellent: 'Excellent',
        poweredBy: 'Powered by ReviewPost',
    },
    AR: {
        score: 'نتيجة التقييمات الاجتماعية',
        volume: 'عدد التقييمات',
        quality: 'جودة التقييم',
        freshness: 'الحداثة',
        detail: 'مستوى التفصيل',
        topPercent: 'أنت ضمن أفضل',
        ofBusinesses: 'من الأنشطة المشابهة في منطقتك',
        sampleTitle: 'هكذا ستبدو تقييماتك كمنشورات على إنستقرام',
        cta: 'تريد نشر هذه المنشورات تلقائياً؟',
        ctaBtn: 'ابدأ تجربتك المجانية',
        share: 'شارك نتيجتك',
        copied: 'تم نسخ الرابط!',
        outOf: 'من 100',
        reviews: 'تقييم',
        rating: 'متوسط التقييم',
        poor: 'يحتاج تحسين',
        average: 'متوسط',
        good: 'جيد',
        excellent: 'ممتاز',
        poweredBy: 'مدعوم من ReviewPost',
    },
    TR: {
        score: 'Yorum Sosyal Puanı',
        volume: 'Yorum Sayısı',
        quality: 'Puan Kalitesi',
        freshness: 'Güncellik',
        detail: 'Detay Seviyesi',
        topPercent: 'En iyi',
        ofBusinesses: 'benzer işletmeler arasındasınız',
        sampleTitle: 'Yorumlarınız Instagram gönderisi olarak böyle görünür',
        cta: 'Bu gönderilerin otomatik yayınlanmasını ister misiniz?',
        ctaBtn: 'Ücretsiz Denemeye Başla',
        share: 'Puanınızı Paylaşın',
        copied: 'Link kopyalandı!',
        outOf: "100 üzerinden",
        reviews: 'yorum',
        rating: 'ort. puan',
        poor: 'İyileştirme Gerekli',
        average: 'Ortalama',
        good: 'İyi',
        excellent: 'Mükemmel',
        poweredBy: 'ReviewPost tarafından',
    },
};

// ── Animated Score Gauge ──────────────────────────────────────────────────
function ScoreGauge({ score, lang }: { score: number; lang: Lang }) {
    const [animatedScore, setAnimatedScore] = useState(0);
    const t = T[lang];

    useEffect(() => {
        let frame: number;
        const start = performance.now();
        const duration = 1500;

        function animate(now: number) {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setAnimatedScore(Math.round(score * eased));
            if (progress < 1) frame = requestAnimationFrame(animate);
        }

        frame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(frame);
    }, [score]);

    const color = score < 40 ? '#EF4444' : score < 70 ? '#F59E0B' : '#10B981';
    const bgColor = score < 40 ? '#FEE2E2' : score < 70 ? '#FEF3C7' : '#D1FAE5';
    const label = score < 40 ? t.poor : score < 70 ? t.average : score < 85 ? t.good : t.excellent;

    const circumference = 2 * Math.PI * 90;
    const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

    return (
        <div className="flex flex-col items-center">
            <div className="relative w-56 h-56">
                <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90">
                    <circle cx="100" cy="100" r="90" fill="none" stroke={bgColor} strokeWidth="12" />
                    <circle
                        cx="100" cy="100" r="90" fill="none"
                        stroke={color} strokeWidth="12" strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.16, 1, 0.3, 1)' }}
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-5xl font-extrabold tabular-nums" style={{ color }}>{animatedScore}</span>
                    <span className="text-sm text-gray-500 mt-1">{t.outOf}</span>
                </div>
            </div>
            <span
                className="mt-3 px-4 py-1.5 rounded-full text-sm font-bold"
                style={{ backgroundColor: bgColor, color }}
            >
                {label}
            </span>
        </div>
    );
}

// ── Breakdown Bar ─────────────────────────────────────────────────────────
function BreakdownBar({ label, value, delay }: { label: string; value: number; delay: number }) {
    const [width, setWidth] = useState(0);
    useEffect(() => {
        const timer = setTimeout(() => setWidth(value * 10), delay);
        return () => clearTimeout(timer);
    }, [value, delay]);

    const color = value <= 4 ? '#EF4444' : value <= 6 ? '#F59E0B' : '#10B981';

    return (
        <div className="space-y-1.5">
            <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
                <span className="text-sm font-bold tabular-nums" style={{ color }}>{value}/10</span>
            </div>
            <div className="w-full h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                    className="h-full rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${width}%`, backgroundColor: color }}
                />
            </div>
        </div>
    );
}

// ── Sample Post Card (Classic Template) ───────────────────────────────────
function SamplePostCard({
    post,
    businessName,
    index,
}: {
    post: { reviewText: string; authorName: string; rating: number; caption: string };
    businessName: string;
    index: number;
}) {
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const timer = setTimeout(() => setVisible(true), 400 + index * 200);
        return () => clearTimeout(timer);
    }, [index]);

    const stars = '★'.repeat(post.rating) + '☆'.repeat(Math.max(0, 5 - post.rating));
    const initial = post.authorName.charAt(0).toUpperCase();
    const truncatedReview = post.reviewText.length > 140
        ? post.reviewText.slice(0, 140) + '…'
        : post.reviewText;

    return (
        <div
            className={`transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
        >
            {/* Instagram-style post card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm hover:shadow-lg transition-shadow">
                {/* Post image area — Classic template */}
                <div className="aspect-square p-5 flex flex-col justify-between bg-white">
                    <div className="flex gap-0.5 text-lg" style={{ color: '#4F46E5' }}>{stars}</div>
                    <p className="text-sm text-gray-700 leading-relaxed flex-1 mt-3 italic">
                        &ldquo;{truncatedReview}&rdquo;
                    </p>
                    <div className="mt-auto pt-3">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
                                <span className="text-xs text-white font-bold">{initial}</span>
                            </div>
                            <span className="text-xs text-gray-500">{post.authorName}</span>
                        </div>
                        <div className="border-t-[3px] border-indigo-600 pt-2 flex justify-between items-center">
                            <span className="text-xs font-bold text-indigo-600">{businessName}</span>
                            <span className="text-[10px] text-indigo-400 font-semibold">Google Reviews</span>
                        </div>
                    </div>
                </div>
                {/* Caption area */}
                <div className="p-4 border-t border-gray-100 dark:border-gray-700">
                    <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-3">
                        {post.caption}
                    </p>
                </div>
            </div>
        </div>
    );
}

// ── Main Results Component ────────────────────────────────────────────────
export default function ReviewScoreResults({
    data,
    lang,
    onReset,
}: {
    data: ReviewScoreResponse;
    lang: Lang;
    onReset: () => void;
}) {
    const t = T[lang];
    const rtl = lang === 'AR';
    const [copied, setCopied] = useState(false);
    const resultsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, []);

    const shareUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/tools/review-score?id=${data.scoreId}`
        : '';

    const handleShare = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // fallback
        }
    };

    const businessType = data.business.types?.[0]?.replace(/_/g, ' ') ?? 'businesses';

    return (
        <div ref={resultsRef} className={`space-y-8 ${rtl ? 'text-right' : 'text-left'}`} dir={rtl ? 'rtl' : 'ltr'}>

            {/* ── Score Card ────────────────────────────────────────── */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-xl overflow-hidden">
                {/* Business header */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 flex items-center gap-4">
                    {data.business.photoUrl ? (
                        <img
                            src={data.business.photoUrl}
                            alt={data.business.name}
                            className="w-16 h-16 rounded-xl object-cover border-2 border-white/30 flex-shrink-0"
                        />
                    ) : (
                        <div className="w-16 h-16 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                            <span className="text-2xl font-bold text-white">{data.business.name.charAt(0)}</span>
                        </div>
                    )}
                    <div className="min-w-0">
                        <h2 className="text-xl font-bold text-white truncate">{data.business.name}</h2>
                        <p className="text-sm text-white/70 truncate">{data.business.address}</p>
                        <div className="flex items-center gap-3 mt-1">
                            <span className="text-sm text-yellow-300 font-semibold">
                                {'★'.repeat(Math.round(data.business.rating))} {data.business.rating}
                            </span>
                            <span className="text-sm text-white/60">
                                {data.business.totalReviews} {t.reviews}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Score + Breakdown */}
                <div className="p-6 md:p-8">
                    <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-6 text-center">
                        {t.score}
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                        {/* Gauge */}
                        <ScoreGauge score={data.score} lang={lang} />

                        {/* Breakdown bars */}
                        <div className="space-y-5">
                            <BreakdownBar label={t.volume} value={data.breakdown.volume} delay={300} />
                            <BreakdownBar label={t.quality} value={data.breakdown.quality} delay={500} />
                            <BreakdownBar label={t.freshness} value={data.breakdown.freshness} delay={700} />
                            <BreakdownBar label={t.detail} value={data.breakdown.detail} delay={900} />
                        </div>
                    </div>

                    {/* Percentile */}
                    <div className="mt-8 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl text-center">
                        <p className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
                            {t.topPercent} <span className="text-lg font-extrabold">{data.percentile}%</span> {t.ofBusinesses}
                        </p>
                    </div>

                    {/* Share button */}
                    <div className="mt-6 flex justify-center gap-3">
                        <button
                            onClick={handleShare}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                            </svg>
                            {copied ? t.copied : t.share}
                        </button>
                        <button
                            onClick={onReset}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            {lang === 'AR' ? 'بحث آخر' : lang === 'TR' ? 'Yeni Arama' : 'Try Another'}
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Sample Posts ──────────────────────────────────────── */}
            {data.samplePosts.length > 0 && (
                <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 text-center">
                        {t.sampleTitle}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 text-center">
                        {t.poweredBy}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {data.samplePosts.map((post, i) => (
                            <SamplePostCard
                                key={i}
                                post={post}
                                businessName={data.business.name}
                                index={i}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* ── CTA ──────────────────────────────────────────────── */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 p-8 md:p-12 text-center">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full blur-3xl" />
                </div>
                <div className="relative">
                    <h3 className="text-2xl md:text-3xl font-extrabold text-white mb-3">
                        {t.cta}
                    </h3>
                    <p className="text-white/70 text-sm mb-6 max-w-md mx-auto">
                        {lang === 'AR'
                            ? 'ReviewPost يحول تقييمات عملائك إلى منشورات احترافية تلقائياً. ابدأ مجاناً لمدة 14 يوم.'
                            : lang === 'TR'
                            ? 'ReviewPost müşteri yorumlarınızı otomatik olarak profesyonel gönderilere dönüştürür. 14 gün ücretsiz deneyin.'
                            : 'ReviewPost automatically turns your customer reviews into professional social media posts. Try free for 14 days.'
                        }
                    </p>
                    <a
                        href="/login"
                        className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white text-indigo-700 font-bold text-lg shadow-xl shadow-indigo-900/30 hover:shadow-2xl hover:scale-105 transition-all duration-200"
                    >
                        {t.ctaBtn}
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                    </a>
                </div>
            </div>
        </div>
    );
}
