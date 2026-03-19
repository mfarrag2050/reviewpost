'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ReviewScoreResults from './results';
import type { ReviewScoreResponse } from '@/app/api/tools/review-score/route';

type Lang = 'EN' | 'AR' | 'TR';

// ── Translations ──────────────────────────────────────────────────────────
const T: Record<Lang, Record<string, string>> = {
    EN: {
        title: 'Free Review Social Score Calculator',
        subtitle: 'Discover how well your Google reviews perform as social media content',
        placeholder: 'Enter your business name or Google Maps URL…',
        cta: 'Calculate My Score',
        loading: 'Analyzing your reviews…',
        loadingSub: 'Pulling reviews, calculating scores, and generating sample posts',
        features1: 'No signup required',
        features2: 'Instant results',
        features3: '100% free',
        howTitle: 'How It Works',
        step1title: 'Enter Your Business',
        step1desc: 'Type your business name or paste your Google Maps link',
        step2title: 'We Analyze Reviews',
        step2desc: 'We score your reviews on volume, quality, freshness, and detail',
        step3title: 'Get Your Score',
        step3desc: 'See your score, breakdown, and sample Instagram posts from your reviews',
        whyTitle: 'Why Your Review Score Matters',
        why1title: '92% of consumers',
        why1desc: 'read online reviews before visiting a business',
        why2title: '4.2× more engagement',
        why2desc: 'review-based posts get vs generic brand content',
        why3title: '73% of customers',
        why3desc: 'trust a business more after seeing positive review posts',
        faq: 'Frequently Asked Questions',
        faq1q: 'How is the score calculated?',
        faq1a: 'We analyze 4 dimensions: review volume (how many reviews you have), rating quality (average stars), freshness (how recent your reviews are), and detail level (how detailed your reviews are).',
        faq2q: 'Is this really free?',
        faq2a: 'Yes! The Review Social Score tool is 100% free. No signup, no credit card, no catch. We built it to help businesses understand their review potential.',
        faq3q: 'How can I improve my score?',
        faq3a: 'Encourage customers to leave detailed reviews, respond to all reviews promptly, and share review-based content on social media. ReviewPost can automate the last part for you.',
        backHome: 'Back to Home',
    },
    AR: {
        title: 'حاسبة نتيجة التقييمات الاجتماعية — مجاناً',
        subtitle: 'اكتشف مدى فعالية تقييمات Google الخاصة بك كمحتوى على وسائل التواصل',
        placeholder: 'أدخل اسم نشاطك التجاري أو رابط خرائط Google…',
        cta: 'احسب نتيجتي',
        loading: 'جاري تحليل تقييماتك…',
        loadingSub: 'نسحب التقييمات ونحسب النتائج وننشئ منشورات نموذجية',
        features1: 'بدون تسجيل',
        features2: 'نتائج فورية',
        features3: 'مجاني 100%',
        howTitle: 'كيف يعمل؟',
        step1title: 'أدخل نشاطك التجاري',
        step1desc: 'اكتب اسم نشاطك أو الصق رابط خرائط Google',
        step2title: 'نحلل تقييماتك',
        step2desc: 'نقيّم تقييماتك من حيث العدد والجودة والحداثة والتفصيل',
        step3title: 'احصل على نتيجتك',
        step3desc: 'شاهد نتيجتك وتحليلها ومنشورات إنستقرام نموذجية من تقييماتك',
        whyTitle: 'لماذا نتيجة تقييماتك مهمة؟',
        why1title: '92% من المستهلكين',
        why1desc: 'يقرأون التقييمات عبر الإنترنت قبل زيارة النشاط',
        why2title: '4.2× تفاعل أكثر',
        why2desc: 'تحصل عليه منشورات التقييمات مقارنة بالمحتوى العادي',
        why3title: '73% من العملاء',
        why3desc: 'يثقون بالنشاط أكثر بعد رؤية منشورات التقييمات الإيجابية',
        faq: 'الأسئلة الشائعة',
        faq1q: 'كيف يتم حساب النتيجة؟',
        faq1a: 'نحلل 4 أبعاد: عدد التقييمات، جودة التقييم (متوسط النجوم)، حداثة التقييمات، ومستوى التفصيل في النصوص.',
        faq2q: 'هل هذا مجاني فعلاً؟',
        faq2a: 'نعم! أداة نتيجة التقييمات مجانية 100%. بدون تسجيل ولا بطاقة ائتمان. بنيناها لمساعدة الأنشطة التجارية.',
        faq3q: 'كيف أحسّن نتيجتي؟',
        faq3a: 'شجّع عملاءك على ترك تقييمات مفصلة، ورد على جميع التقييمات بسرعة، وشارك محتوى قائم على التقييمات. ReviewPost يمكنه أتمتة الجزء الأخير.',
        backHome: 'العودة للرئيسية',
    },
    TR: {
        title: 'Ücretsiz Yorum Sosyal Puan Hesaplayıcı',
        subtitle: 'Google yorumlarınızın sosyal medya içeriği olarak ne kadar etkili olduğunu keşfedin',
        placeholder: 'İşletme adınızı veya Google Haritalar bağlantınızı girin…',
        cta: 'Puanımı Hesapla',
        loading: 'Yorumlarınız analiz ediliyor…',
        loadingSub: 'Yorumlar çekiliyor, puanlar hesaplanıyor ve örnek gönderiler oluşturuluyor',
        features1: 'Kayıt gerektirmez',
        features2: 'Anında sonuçlar',
        features3: '100% ücretsiz',
        howTitle: 'Nasıl Çalışır?',
        step1title: 'İşletmenizi Girin',
        step1desc: 'İşletme adınızı yazın veya Google Haritalar linkinizi yapıştırın',
        step2title: 'Yorumları Analiz Ederiz',
        step2desc: 'Yorumlarınızı hacim, kalite, güncellik ve detay açısından puanlarız',
        step3title: 'Puanınızı Alın',
        step3desc: 'Puanınızı, analizinizi ve yorumlarınızdan örnek Instagram gönderilerini görün',
        whyTitle: 'Yorum Puanınız Neden Önemli?',
        why1title: 'Tüketicilerin %92\'si',
        why1desc: 'bir işletmeyi ziyaret etmeden önce online yorumları okur',
        why2title: '4.2× daha fazla etkileşim',
        why2desc: 'yorum gönderileri genel marka içeriğinden alır',
        why3title: 'Müşterilerin %73\'ü',
        why3desc: 'olumlu yorum paylaşımları gördükten sonra işletmeye daha çok güvenir',
        faq: 'Sık Sorulan Sorular',
        faq1q: 'Puan nasıl hesaplanıyor?',
        faq1a: '4 boyutu analiz ediyoruz: yorum sayısı, puan kalitesi, güncellik ve detay seviyesi.',
        faq2q: 'Gerçekten ücretsiz mi?',
        faq2a: 'Evet! Yorum Puan aracı %100 ücretsizdir. Kayıt yok, kredi kartı yok.',
        faq3q: 'Puanımı nasıl iyileştirebilirim?',
        faq3a: 'Müşterilerinizi detaylı yorum bırakmaya teşvik edin ve tüm yorumlara hızlıca yanıt verin. ReviewPost son kısmı sizin için otomatikleştirebilir.',
        backHome: 'Ana Sayfaya Dön',
    },
};

// ── Loading Skeleton ──────────────────────────────────────────────────────
function LoadingState({ lang }: { lang: Lang }) {
    const t = T[lang];
    return (
        <div className="max-w-xl mx-auto text-center py-16">
            {/* Animated circles */}
            <div className="relative w-32 h-32 mx-auto mb-8">
                <div className="absolute inset-0 rounded-full border-4 border-indigo-100 dark:border-indigo-900/40" />
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-600 animate-spin" />
                <div className="absolute inset-3 rounded-full border-4 border-transparent border-t-purple-500 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
                <div className="absolute inset-0 flex items-center justify-center">
                    <svg className="w-8 h-8 text-indigo-600 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t.loading}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t.loadingSub}</p>

            {/* Skeleton bars */}
            <div className="mt-10 space-y-3 max-w-sm mx-auto">
                {[80, 65, 90, 55].map((w, i) => (
                    <div key={i} className="flex items-center gap-3">
                        <div className="w-20 h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                        <div className="flex-1 h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"
                                style={{ width: `${w}%`, animationDelay: `${i * 0.2}s` }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── FAQ Item ──────────────────────────────────────────────────────────────
function FaqItem({ q, a }: { q: string; a: string }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="border-b border-gray-200 dark:border-gray-700">
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between py-4 text-left"
            >
                <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{q}</span>
                <svg className={`w-5 h-5 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            <div className={`overflow-hidden transition-all duration-300 ${open ? 'max-h-40 pb-4' : 'max-h-0'}`}>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{a}</p>
            </div>
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────
export default function ReviewScorePage() {
    const [lang, setLang] = useState<Lang>('EN');
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<ReviewScoreResponse | null>(null);

    const t = T[lang];
    const rtl = lang === 'AR';

    // Check for shared score ID in URL
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const id = params.get('id');
        if (id) {
            // Could cache results server-side in the future
        }
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim() || loading) return;

        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const res = await fetch('/api/tools/review-score', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: query.trim() }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error ?? 'Something went wrong');
                return;
            }

            setResult(data);
        } catch {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setResult(null);
        setQuery('');
        setError(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900" dir={rtl ? 'rtl' : 'ltr'}>
            {/* ── Header ───────────────────────────────────────────── */}
            <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
                    <Link href="/" className="text-xl font-extrabold text-indigo-600">
                        ReviewPost
                    </Link>
                    <div className="flex items-center gap-3">
                        {/* Language switcher */}
                        <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
                            {(['EN', 'AR', 'TR'] as Lang[]).map((l) => (
                                <button
                                    key={l}
                                    onClick={() => setLang(l)}
                                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                                        lang === l
                                            ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
                                    }`}
                                >
                                    {l}
                                </button>
                            ))}
                        </div>
                        <Link
                            href="/"
                            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                        >
                            {t.backHome}
                        </Link>
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 py-8 md:py-12">
                {/* ── Hero + Search ─────────────────────────────────── */}
                {!result && !loading && (
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-semibold mb-4">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            {t.features1} · {t.features2} · {t.features3}
                        </div>
                        <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-4 leading-tight">
                            {t.title}
                        </h1>
                        <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto mb-8">
                            {t.subtitle}
                        </p>

                        <form onSubmit={handleSubmit} className="max-w-xl mx-auto">
                            <div className="flex flex-col sm:flex-row gap-3">
                                <input
                                    type="text"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder={t.placeholder}
                                    className="flex-1 px-5 py-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm"
                                    dir={rtl ? 'rtl' : 'ltr'}
                                />
                                <button
                                    type="submit"
                                    disabled={!query.trim()}
                                    className="px-8 py-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-base transition-all shadow-lg shadow-indigo-200 dark:shadow-indigo-900/40 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                                >
                                    {t.cta}
                                </button>
                            </div>
                            {error && (
                                <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>
                            )}
                        </form>
                    </div>
                )}

                {/* Search bar when results are showing */}
                {(result || loading) && !loading && (
                    <form onSubmit={handleSubmit} className="max-w-xl mx-auto mb-8">
                        <div className="flex flex-col sm:flex-row gap-3">
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder={t.placeholder}
                                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                                dir={rtl ? 'rtl' : 'ltr'}
                            />
                            <button
                                type="submit"
                                disabled={!query.trim()}
                                className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                            >
                                {t.cta}
                            </button>
                        </div>
                        {error && (
                            <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>
                        )}
                    </form>
                )}

                {/* ── Loading ──────────────────────────────────────── */}
                {loading && <LoadingState lang={lang} />}

                {/* ── Results ──────────────────────────────────────── */}
                {result && !loading && (
                    <ReviewScoreResults data={result} lang={lang} onReset={handleReset} />
                )}

                {/* ── How It Works (only on input page) ────────────── */}
                {!result && !loading && (
                    <>
                        {/* How it works */}
                        <div className="mt-16 mb-16">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-10">
                                {t.howTitle}
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {[
                                    { icon: '🔍', title: t.step1title, desc: t.step1desc, num: '1' },
                                    { icon: '📊', title: t.step2title, desc: t.step2desc, num: '2' },
                                    { icon: '🏆', title: t.step3title, desc: t.step3desc, num: '3' },
                                ].map((step) => (
                                    <div key={step.num} className="relative bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 text-center">
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-indigo-600 text-white text-sm font-bold flex items-center justify-center shadow-lg shadow-indigo-200">
                                            {step.num}
                                        </div>
                                        <div className="text-3xl mb-3 mt-2">{step.icon}</div>
                                        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2">{step.title}</h3>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{step.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Why it matters */}
                        <div className="mb-16">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-10">
                                {t.whyTitle}
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {[
                                    { title: t.why1title, desc: t.why1desc, color: 'from-indigo-500 to-purple-500' },
                                    { title: t.why2title, desc: t.why2desc, color: 'from-amber-500 to-orange-500' },
                                    { title: t.why3title, desc: t.why3desc, color: 'from-emerald-500 to-teal-500' },
                                ].map((item, i) => (
                                    <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                                        <p className={`text-lg font-extrabold bg-gradient-to-r ${item.color} bg-clip-text text-transparent mb-2`}>
                                            {item.title}
                                        </p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">{item.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* FAQ */}
                        <div className="max-w-2xl mx-auto mb-16">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-8">
                                {t.faq}
                            </h2>
                            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 px-6">
                                <FaqItem q={t.faq1q} a={t.faq1a} />
                                <FaqItem q={t.faq2q} a={t.faq2a} />
                                <FaqItem q={t.faq3q} a={t.faq3a} />
                            </div>
                        </div>

                        {/* Bottom CTA */}
                        <div className="text-center mb-8">
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                {lang === 'AR'
                                    ? 'جاهز لتحويل تقييماتك إلى محتوى اجتماعي؟'
                                    : lang === 'TR'
                                    ? 'Yorumlarınızı sosyal içeriğe dönüştürmeye hazır mısınız?'
                                    : 'Ready to turn your reviews into social content?'
                                }
                            </p>
                            <Link
                                href="/login"
                                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-colors"
                            >
                                {lang === 'AR' ? 'ابدأ مجاناً' : lang === 'TR' ? 'Ücretsiz Başlayın' : 'Get Started Free'}
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                            </Link>
                        </div>
                    </>
                )}
            </main>

            {/* ── Footer ───────────────────────────────────────────── */}
            <footer className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 py-6">
                <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <p className="text-xs text-gray-400">
                        &copy; {new Date().getFullYear()} ReviewPost. {lang === 'AR' ? 'جميع الحقوق محفوظة.' : 'All rights reserved.'}
                    </p>
                    <div className="flex items-center gap-4">
                        <Link href="/" className="text-xs text-gray-400 hover:text-gray-600">
                            {t.backHome}
                        </Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
