'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

// ─── Types ─────────────────────────────────────────────────────────────────────

type Lang = 'EN' | 'AR' | 'TR';

// ─── Scroll Fade Hook ─────────────────────────────────────────────────────────

function useInView(threshold = 0.12) {
    const ref = useRef<HTMLDivElement>(null);
    const [inView, setInView] = useState(false);
    useEffect(() => {
        const node = ref.current;
        if (!node) return;
        const obs = new IntersectionObserver(
            ([e]) => {
                if (e.isIntersecting) { setInView(true); obs.disconnect(); }
            },
            { threshold },
        );
        obs.observe(node);
        return () => obs.disconnect();
    }, [threshold]);
    return { ref, inView };
}

// ─── Template Previews ────────────────────────────────────────────────────────

function ClassicPreview({ primary, secondary }: { primary: string; secondary: string }) {
    return (
        <div style={{ width: '100%', height: '100%', background: '#fff', borderRadius: '8px', overflow: 'hidden', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', gap: '2px' }}>{[1,2,3,4,5].map(s => <span key={s} style={{ color: primary, fontSize: '13px' }}>★</span>)}</div>
            <p style={{ fontSize: '9px', color: '#374151', lineHeight: 1.6, flex: 1, margin: 0, fontStyle: 'italic' }}>"The service was amazing and the staff were incredibly professional throughout!"</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '10px', color: '#fff', fontWeight: 700 }}>A</span>
                </div>
                <span style={{ fontSize: '7px', color: '#6B7280' }}>Ahmed Al-Rashidi</span>
            </div>
            <div style={{ borderTop: `3px solid ${primary}`, paddingTop: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '8px', fontWeight: 700, color: primary }}>Business Name</span>
                <span style={{ fontSize: '7px', color: secondary, fontWeight: 600 }}>Google Reviews</span>
            </div>
        </div>
    );
}

function BoldPreview({ primary, secondary }: { primary: string; secondary: string }) {
    return (
        <div style={{ width: '100%', height: '100%', background: `linear-gradient(135deg, ${primary}, ${secondary})`, borderRadius: '8px', overflow: 'hidden', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxSizing: 'border-box' }}>
            <div style={{ fontSize: '48px', color: 'rgba(255,255,255,0.15)', lineHeight: 1, fontFamily: 'Georgia, serif' }}>"</div>
            <p style={{ fontSize: '9px', color: '#fff', lineHeight: 1.7, textAlign: 'center', margin: 0, fontStyle: 'italic', padding: '0 4px' }}>"The service was amazing and the staff were incredibly professional!"</p>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                <div style={{ display: 'flex', gap: '2px' }}>{[1,2,3,4,5].map(s => <span key={s} style={{ color: '#FCD34D', fontSize: '11px' }}>★</span>)}</div>
                <span style={{ fontSize: '8px', color: 'rgba(255,255,255,0.9)', fontWeight: 700 }}>Ahmed Al-Rashidi</span>
                <span style={{ fontSize: '7px', color: 'rgba(255,255,255,0.6)' }}>Business Name</span>
            </div>
        </div>
    );
}

function ProductPreview({ primary, secondary }: { primary: string; secondary: string }) {
    return (
        <div style={{ width: '100%', height: '100%', background: '#fff', borderRadius: '8px', overflow: 'hidden', display: 'flex', boxSizing: 'border-box' }}>
            <div style={{ width: '40%', background: `linear-gradient(160deg, ${primary}18, ${secondary}28)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '24px' }}>🛍</div>
            <div style={{ padding: '12px 10px', flex: 1, display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <span style={{ fontSize: '8px', fontWeight: 700, color: primary }}>Product Name</span>
                <div style={{ display: 'flex', gap: '1px' }}>{[1,2,3,4,5].map(s => <span key={s} style={{ color: '#F59E0B', fontSize: '9px' }}>★</span>)}</div>
                <p style={{ fontSize: '7px', color: '#4B5563', lineHeight: 1.5, flex: 1, margin: 0 }}>"Great product! Exactly as described."</p>
                <div style={{ borderTop: `2px solid ${primary}`, paddingTop: '4px' }}>
                    <span style={{ fontSize: '7px', fontWeight: 700, color: primary }}>Business</span>
                </div>
            </div>
        </div>
    );
}

// ─── Translations ─────────────────────────────────────────────────────────────

const T = {
    EN: {
        nav: { features: 'Features', pricing: 'Pricing', faq: 'FAQ', login: 'Sign in', cta: 'Start Free' },
        hero: {
            badge: '✨ Auto-publishing to Instagram & Facebook',
            h1: 'Turn Your Reviews into', h1_accent: 'Social Media Posts', h1_end: '— Automatically',
            sub: 'ReviewPost pulls your Google reviews, creates beautifully branded content, and publishes to Instagram & Facebook. Zero effort.',
            cta: 'Start Free Trial — 14 Days',
            sub_cta: 'No credit card required · Cancel anytime',
            stats: [{ v: '10,000+', l: 'Posts generated' }, { v: '500+', l: 'Businesses' }, { v: '4.9★', l: 'Rating' }],
            flow_label: 'ReviewPost AI',
            flow_published: 'Published to',
        },
        how: {
            label: 'HOW IT WORKS', title: 'From review to post in 3 steps',
            steps: [
                { n: '01', t: 'Connect', d: 'Link your Google Business Profile in 2 minutes. Secure OAuth — no passwords shared, ever.' },
                { n: '02', t: 'Automate', d: 'Our AI reads your best reviews and creates beautifully branded posts in your language, automatically.' },
                { n: '03', t: 'Publish', d: 'Posts are auto-scheduled and published to Instagram & Facebook on the days and times you choose.' },
            ],
        },
        templates: {
            label: 'TEMPLATES', title: '3 Beautiful Templates',
            sub: 'Every post is automatically branded with your colors, logo, and business name.',
            items: [
                { id: 'classic', name: 'Classic', desc: 'Clean and professional. Perfect for restaurants, clinics, and hotels.' },
                { id: 'bold', name: 'Bold', desc: 'Eye-catching gradient. Maximum visibility for your best reviews.' },
                { id: 'product', name: 'Product', desc: 'Built for e-commerce. Showcase product reviews with images.' },
            ],
        },
        pricing: {
            label: 'PRICING', title: 'Simple, Honest Pricing',
            sub: 'Start free for 14 days. No credit card required.',
            monthly: 'Monthly', yearly: 'Yearly', save: 'Save 20%',
            cta: 'Start Free Trial', popular: 'Most Popular',
            plans: [
                { name: 'Starter', pm: '19', py: '15', desc: 'For small businesses getting started', popular: false, features: ['30 posts / month', '1 business profile', 'Classic + Bold templates', 'Instagram & Facebook', 'Email support'] },
                { name: 'Growth', pm: '39', py: '31', desc: 'For growing businesses & multiple locations', popular: true, features: ['150 posts / month', '3 business profiles', 'All 3 templates', 'Instagram, Facebook + X', 'Priority support', 'Weekly analytics'] },
                { name: 'Agency', pm: '99', py: '79', desc: 'For agencies managing multiple brands', popular: false, features: ['500 posts / month', '10 business profiles', 'All templates + custom', 'All platforms', 'Dedicated support', 'API access', 'White-label'] },
            ],
        },
        who: {
            label: 'WHO IS IT FOR', title: 'Built for Your Business Type',
            a: { title: 'Local Businesses', sub: 'Turn customer reviews into trust signals on social media', items: ['Restaurants & Cafes', 'Hotels & Hospitality', 'Clinics & Healthcare', 'Salons & Spas', 'Retail Stores'] },
            b: { title: 'Online Stores', sub: 'Showcase product reviews to drive more sales', items: ['Salla Stores', 'Shopify Stores', 'WooCommerce Sites'] },
        },
        faq: {
            label: 'FAQ', title: 'Frequently Asked Questions',
            items: [
                { q: 'How does ReviewPost access my Google reviews?', a: 'We use the official Google Business Profile API with secure OAuth 2.0 authentication. You grant permission once and we read your reviews — we never modify or delete anything.' },
                { q: 'Which social media platforms do you support?', a: 'Currently Instagram and Facebook. X (Twitter) is available on Growth and Agency plans. TikTok and Snapchat are coming soon.' },
                { q: 'Can I edit posts before they go live?', a: 'Yes! Every post sits in a review queue where you can edit, reschedule, or delete it before publishing. Or enable fully automatic publishing for zero manual work.' },
                { q: 'How does the monthly post limit work?', a: 'Each plan includes a monthly post generation limit (30/150/500). Publishing one generated post to multiple platforms counts as one post, not multiple.' },
                { q: 'Do I need any design or technical skills?', a: 'None at all. Connect your Google Business, pick a template and brand colors, and ReviewPost handles everything — from caption writing to image design.' },
                { q: 'What languages does the AI write captions in?', a: 'Arabic, English, and Turkish. The language is set per your preference in settings and can be changed at any time.' },
                { q: 'Is my business data secure?', a: 'Yes. All data is encrypted at rest (AES-256) and in transit (TLS 1.3). We are GDPR compliant and never sell or share your data with third parties.' },
                { q: 'Can I cancel my subscription anytime?', a: 'Absolutely. Cancel from your account settings with no questions asked and no fees. You keep access until the end of your billing period.' },
            ],
        },
        footer: {
            tagline: 'Turn reviews into content. Automatically.',
            links: [
                { title: 'Product', items: [['Features', '#features'], ['Pricing', '#pricing'], ['Templates', '#templates'], ['FAQ', '#faq']] },
                { title: 'Legal', items: [['Privacy Policy', '/privacy'], ['Terms of Service', '/terms'], ['Cookie Policy', '/cookies']] },
            ],
            powered: 'Powered by PrimeFlow Solutions',
            copy: '© 2025 ReviewPost. All rights reserved.',
        },
    },
    AR: {
        nav: { features: 'المميزات', pricing: 'الأسعار', faq: 'الأسئلة الشائعة', login: 'تسجيل الدخول', cta: 'ابدأ مجاناً' },
        hero: {
            badge: '✨ النشر التلقائي على Instagram وFacebook',
            h1: 'حوّل مراجعاتك إلى', h1_accent: 'منشورات سوشيال ميديا', h1_end: '— تلقائياً',
            sub: 'يسحب ReviewPost مراجعاتك من Google ويصمم محتوى بهويتك البصرية وينشر تلقائياً على Instagram وFacebook. بدون أي جهد.',
            cta: 'ابدأ التجربة المجانية — 14 يوماً',
            sub_cta: 'لا حاجة لبطاقة ائتمانية · إلغاء في أي وقت',
            stats: [{ v: '+10,000', l: 'منشور تم إنشاؤه' }, { v: '+500', l: 'عمل تجاري' }, { v: '4.9★', l: 'تقييم' }],
            flow_label: 'ReviewPost AI',
            flow_published: 'نُشر على',
        },
        how: {
            label: 'كيف يعمل؟', title: 'من مراجعة إلى منشور في 3 خطوات',
            steps: [
                { n: '01', t: 'ربط', d: 'اربط ملفك التجاري على Google في دقيقتين. مصادقة OAuth آمنة — لا مشاركة لكلمات المرور أبداً.' },
                { n: '02', t: 'أتمتة', d: 'يقرأ ذكاؤنا الاصطناعي أفضل مراجعاتك ويصمم منشورات مميزة بهويتك البصرية بلغتك تلقائياً.' },
                { n: '03', t: 'نشر', d: 'تُجدوَل المنشورات وتُنشر تلقائياً على Instagram وFacebook في الأيام والمواعيد التي تختارها.' },
            ],
        },
        templates: {
            label: 'القوالب', title: '3 قوالب رائعة',
            sub: 'يتم تطبيق ألوانك وشعارك واسم نشاطك التجاري تلقائياً على كل منشور.',
            items: [
                { id: 'classic', name: 'الكلاسيكي', desc: 'نظيف واحترافي. مثالي للمطاعم والعيادات والفنادق.' },
                { id: 'bold', name: 'الجريء', desc: 'تصميم متدرج لافت للنظر. أقصى قدر من الوضوح لأفضل مراجعاتك.' },
                { id: 'product', name: 'المنتج', desc: 'مصمم للتجارة الإلكترونية. اعرض مراجعات المنتجات مع الصور.' },
            ],
        },
        pricing: {
            label: 'الأسعار', title: 'أسعار بسيطة وواضحة',
            sub: 'ابدأ مجاناً لمدة 14 يوماً. لا حاجة لبطاقة ائتمانية.',
            monthly: 'شهري', yearly: 'سنوي', save: 'وفّر 20%',
            cta: 'ابدأ التجربة المجانية', popular: 'الأكثر شعبية',
            plans: [
                { name: 'المبتدئ', pm: '19', py: '15', desc: 'مثالي للأعمال الصغيرة التي تبدأ', popular: false, features: ['30 منشوراً / شهر', 'ملف تجاري واحد', 'قالبا الكلاسيكي والجريء', 'Instagram وFacebook', 'دعم بالبريد الإلكتروني'] },
                { name: 'النمو', pm: '39', py: '31', desc: 'للأعمال المتنامية والمواقع المتعددة', popular: true, features: ['150 منشوراً / شهر', '3 ملفات تجارية', 'جميع القوالب الثلاثة', 'Instagram وFacebook وX', 'دعم ذو أولوية', 'تقرير تحليلات أسبوعي'] },
                { name: 'الوكالة', pm: '99', py: '79', desc: 'للوكالات التي تدير علامات تجارية متعددة', popular: false, features: ['500 منشور / شهر', '10 ملفات تجارية', 'جميع القوالب + مخصصة', 'جميع المنصات', 'دعم مخصص', 'وصول API', 'العلامة البيضاء'] },
            ],
        },
        who: {
            label: 'لمن هذا؟', title: 'مبني لنوع نشاطك التجاري',
            a: { title: 'الأعمال المحلية', sub: 'حوّل مراجعات العملاء إلى ثقة عبر السوشيال ميديا', items: ['المطاعم والمقاهي', 'الفنادق والضيافة', 'العيادات والرعاية الصحية', 'صالونات التجميل', 'محلات التجزئة'] },
            b: { title: 'المتاجر الإلكترونية', sub: 'اعرض مراجعات المنتجات لزيادة المبيعات', items: ['متاجر سلة', 'متاجر Shopify', 'مواقع WooCommerce'] },
        },
        faq: {
            label: 'الأسئلة الشائعة', title: 'أسئلة مكررة',
            items: [
                { q: 'كيف يصل ReviewPost إلى مراجعات Google الخاصة بي؟', a: 'نستخدم Google Business Profile API الرسمي مع مصادقة OAuth 2.0 الآمنة. تمنح الإذن مرة واحدة ونقرأ مراجعاتك — لا تعديل ولا حذف أبداً.' },
                { q: 'ما هي منصات التواصل الاجتماعي المدعومة؟', a: 'حالياً Instagram وFacebook. X (تويتر) متاح في خطتي النمو والوكالة. TikTok وSnapchat قادمان قريباً.' },
                { q: 'هل يمكنني تعديل المنشورات قبل نشرها؟', a: 'نعم! يجلس كل منشور في قائمة انتظار حيث يمكنك مراجعته أو تعديله أو إعادة جدولته. يمكنك أيضاً تمكين النشر التلقائي الكامل.' },
                { q: 'كيف يعمل حد المنشورات الشهري؟', a: 'تتضمن كل خطة حداً شهرياً لإنشاء المنشورات (30/150/500). يُحسب نشر منشور واحد على منصات متعددة كمنشور واحد.' },
                { q: 'هل أحتاج إلى مهارات تصميم أو تقنية؟', a: 'لا على الإطلاق. فقط اربط نشاطك التجاري واختر قالباً وألوانك، وسيتولى ReviewPost كل شيء.' },
                { q: 'ما اللغات التي يكتب بها الذكاء الاصطناعي؟', a: 'العربية والإنجليزية والتركية. تُعيَّن اللغة بناءً على تفضيلاتك ويمكن تغييرها في أي وقت.' },
                { q: 'هل بياناتي آمنة؟', a: 'نعم. جميع البيانات مشفرة في حالة السكون (AES-256) وأثناء النقل (TLS 1.3). ممتثلون لقانون GDPR ولا نشارك بياناتك أبداً.' },
                { q: 'هل يمكنني إلغاء الاشتراك في أي وقت؟', a: 'بالتأكيد. ألغِ من إعدادات حسابك في أي وقت. لا أسئلة ولا رسوم إلغاء. ستحتفظ بالوصول حتى نهاية الفترة.' },
            ],
        },
        footer: {
            tagline: 'حوّل المراجعات إلى محتوى. تلقائياً.',
            links: [
                { title: 'المنتج', items: [['المميزات', '#features'], ['الأسعار', '#pricing'], ['القوالب', '#templates'], ['الأسئلة الشائعة', '#faq']] as [string, string][] },
                { title: 'قانوني', items: [['سياسة الخصوصية', '/privacy'], ['شروط الخدمة', '/terms'], ['سياسة الكوكيز', '/cookies']] as [string, string][] },
            ],
            powered: 'مدعوم من PrimeFlow Solutions',
            copy: '© 2025 ReviewPost. جميع الحقوق محفوظة.',
        },
    },
    TR: {
        nav: { features: 'Özellikler', pricing: 'Fiyatlar', faq: 'SSS', login: 'Giriş Yap', cta: 'Ücretsiz Başla' },
        hero: {
            badge: "✨ Instagram ve Facebook'a otomatik yayın",
            h1: 'Yorumlarınızı', h1_accent: 'Sosyal Medya Gönderilerine', h1_end: 'Dönüştürün — Otomatik',
            sub: "ReviewPost Google yorumlarınızı çeker, markalı içerik oluşturur ve Instagram & Facebook'a yayınlar. Sıfır çaba.",
            cta: 'Ücretsiz Denemeye Başla — 14 Gün',
            sub_cta: 'Kredi kartı gerekmez · İstediğiniz zaman iptal',
            stats: [{ v: '10.000+', l: 'Oluşturulan gönderi' }, { v: '500+', l: 'İşletme' }, { v: '4.9★', l: 'Puan' }],
            flow_label: 'ReviewPost AI',
            flow_published: 'Yayınlandı',
        },
        how: {
            label: 'NASIL ÇALIŞIR', title: '3 Adımda Yorumdan Gönderiye',
            steps: [
                { n: '01', t: 'Bağlan', d: "Google İşletme Profilinizi 2 dakikada bağlayın. Güvenli OAuth — asla şifre paylaşımı yok." },
                { n: '02', t: 'Otomatikleştir', d: "Yapay zekamız en iyi yorumlarınızı okur ve markanıza uygun güzel gönderiler oluşturur." },
                { n: '03', t: 'Yayınla', d: "Gönderiler seçtiğiniz gün ve saatlerde Instagram ve Facebook'a otomatik olarak yayınlanır." },
            ],
        },
        templates: {
            label: 'ŞABLONLAR', title: '3 Güzel Şablon',
            sub: 'Her gönderi, renkleriniz, logonuz ve işletme adınızla otomatik olarak markalanır.',
            items: [
                { id: 'classic', name: 'Klasik', desc: 'Temiz ve profesyonel. Restoranlar, klinikler ve oteller için mükemmel.' },
                { id: 'bold', name: 'Cesur', desc: 'Göz alıcı degrade tasarım. En iyi yorumlarınız için maksimum görünürlük.' },
                { id: 'product', name: 'Ürün', desc: "E-ticaret için tasarlandı. Ürün yorumlarını resimlerle sergileyin." },
            ],
        },
        pricing: {
            label: 'FİYATLANDIRMA', title: 'Basit, Dürüst Fiyatlandırma',
            sub: '14 gün ücretsiz başlayın. Kredi kartı gerekmez.',
            monthly: 'Aylık', yearly: 'Yıllık', save: '%20 Tasarruf',
            cta: 'Ücretsiz Denemeye Başla', popular: 'En Popüler',
            plans: [
                { name: 'Başlangıç', pm: '19', py: '15', desc: 'Başlayan küçük işletmeler için mükemmel', popular: false, features: ['30 gönderi / ay', '1 işletme profili', 'Klasik + Cesur şablonlar', 'Instagram ve Facebook', 'E-posta desteği'] },
                { name: 'Büyüme', pm: '39', py: '31', desc: 'Birden fazla lokasyonu olan işletmeler için', popular: true, features: ['150 gönderi / ay', '3 işletme profili', 'Tüm 3 şablon', 'Instagram, Facebook + X', 'Öncelikli destek', 'Haftalık analitik'] },
                { name: 'Ajans', pm: '99', py: '79', desc: 'Birden fazla markayı yöneten ajanslar için', popular: false, features: ['500 gönderi / ay', '10 işletme profili', 'Tüm şablonlar + özel', 'Tüm platformlar', 'Özel destek', 'API erişimi', 'White-label'] },
            ],
        },
        who: {
            label: 'KİM İÇİN?', title: 'İşletme Türünüze Göre Tasarlandı',
            a: { title: 'Yerel İşletmeler', sub: 'Yorumları sosyal medyada güven sinyallerine dönüştürün', items: ['Restoran ve Kafeler', 'Otel ve Konaklama', 'Klinik ve Sağlık', 'Kuaför ve Güzellik', 'Perakende Mağazalar'] },
            b: { title: 'Online Mağazalar', sub: 'Satışları artırmak için ürün yorumlarını sergileyin', items: ['Salla Mağazaları', 'Shopify Mağazaları', 'WooCommerce Siteleri'] },
        },
        faq: {
            label: 'SSS', title: 'Sıkça Sorulan Sorular',
            items: [
                { q: 'ReviewPost Google yorumlarıma nasıl erişir?', a: "Güvenli OAuth 2.0 ile resmi Google Business Profile API'sini kullanıyoruz. Bir kez izin verirsiniz, yorumlarınızı okuruz — asla değiştirmez veya silmeyiz." },
                { q: 'Hangi sosyal medya platformlarını destekliyorsunuz?', a: 'Şu anda Instagram ve Facebook. X (Twitter) Büyüme ve Ajans planlarında mevcut. TikTok ve Snapchat yakında geliyor.' },
                { q: 'Gönderiler yayınlanmadan önce düzenleyebilir miyim?', a: 'Evet! Her gönderi inceleyebileceğiniz, düzenleyebileceğiniz veya yeniden zamanlayabileceğiniz bir kuyruğa düşer.' },
                { q: 'Aylık gönderi limiti nasıl çalışır?', a: 'Her plan aylık gönderi oluşturma limiti içerir (30/150/500). Bir gönderi birden fazla platforma yayınlanabilir — bu bir olarak sayılır.' },
                { q: 'Tasarım veya teknik beceri gerekiyor mu?', a: 'Hiç. Sadece Google İşletmenizi bağlayın ve şablon seçin, ReviewPost gerisini halleder.' },
                { q: 'Yapay zeka hangi dillerde başlık yazar?', a: 'Arapça, İngilizce ve Türkçe. Dil, ayarlardaki tercihinize göre belirlenir ve istediğiniz zaman değiştirilebilir.' },
                { q: 'İşletme verilerim güvende mi?', a: "Evet. Tüm veriler AES-256 ile şifrelenir, GDPR'ye uyumluyuz ve verilerinizi paylaşmıyoruz." },
                { q: 'İstediğim zaman iptal edebilir miyim?', a: 'Kesinlikle. Hesap ayarlarından istediğinizde iptal edin — soru yok, ücret yok.' },
            ],
        },
        footer: {
            tagline: 'Yorumları içeriğe dönüştür. Otomatik olarak.',
            links: [
                { title: 'Ürün', items: [['Özellikler', '#features'], ['Fiyatlar', '#pricing'], ['Şablonlar', '#templates'], ['SSS', '#faq']] as [string, string][] },
                { title: 'Yasal', items: [['Gizlilik Politikası', '/privacy'], ['Hizmet Şartları', '/terms'], ['Çerez Politikası', '/cookies']] as [string, string][] },
            ],
            powered: 'PrimeFlow Solutions tarafından desteklenmektedir',
            copy: '© 2025 ReviewPost. Tüm hakları saklıdır.',
        },
    },
} as const;

type TKeys = typeof T['EN'];

// ─── Navbar ───────────────────────────────────────────────────────────────────

const LANGS: { code: Lang; flag: string; label: string }[] = [
    { code: 'EN', flag: '🇬🇧', label: 'EN' },
    { code: 'AR', flag: '🇸🇦', label: 'AR' },
    { code: 'TR', flag: '🇹🇷', label: 'TR' },
];

function Navbar({ lang, setLang, t }: { lang: Lang; setLang: (l: Lang) => void; t: TKeys }) {
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [langOpen, setLangOpen] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const navLinks = [
        { label: t.nav.features, href: '#features' },
        { label: t.nav.pricing, href: '#pricing' },
        { label: t.nav.faq, href: '#faq' },
    ];

    return (
        <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/90 backdrop-blur-md shadow-sm border-b border-gray-100' : 'bg-transparent'}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <a href="#" className="flex items-center gap-2.5 flex-shrink-0">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-200">
                            <span className="text-white text-sm font-bold">R</span>
                        </div>
                        <span className="font-bold text-gray-900 text-lg tracking-tight">ReviewPost</span>
                    </a>

                    {/* Desktop nav */}
                    <nav className="hidden md:flex items-center gap-8">
                        {navLinks.map(link => (
                            <a key={link.href} href={link.href} className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                                {link.label}
                            </a>
                        ))}
                    </nav>

                    {/* Right side */}
                    <div className="flex items-center gap-2">
                        {/* Language switcher */}
                        <div className="relative">
                            <button
                                onClick={() => setLangOpen(v => !v)}
                                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                            >
                                <span>{LANGS.find(l => l.code === lang)?.flag}</span>
                                <span>{lang}</span>
                                <svg className={`w-3.5 h-3.5 transition-transform ${langOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                            {langOpen && (
                                <div className="absolute top-full mt-1 right-0 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50 min-w-[100px]">
                                    {LANGS.map(l => (
                                        <button
                                            key={l.code}
                                            onClick={() => { setLang(l.code); setLangOpen(false); }}
                                            className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${lang === l.code ? 'font-semibold text-indigo-600' : 'text-gray-700'}`}
                                        >
                                            <span>{l.flag}</span>
                                            <span>{l.label}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <Link href="/login" className="hidden sm:block text-sm font-medium text-gray-600 hover:text-gray-900 px-3 py-1.5 transition-colors">
                            {t.nav.login}
                        </Link>
                        <Link href="/login" className="text-sm font-semibold px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm shadow-indigo-200 hover:shadow-md hover:shadow-indigo-200 hover:-translate-y-px transition-all duration-150">
                            {t.nav.cta}
                        </Link>

                        {/* Mobile hamburger */}
                        <button onClick={() => setMobileOpen(v => !v)} className="md:hidden p-1.5 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors ms-1">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                {mobileOpen
                                    ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                }
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile menu */}
            {mobileOpen && (
                <div className="md:hidden bg-white border-t border-gray-100 shadow-lg">
                    <div className="px-4 py-4 space-y-1">
                        {navLinks.map(link => (
                            <a key={link.href} href={link.href} onClick={() => setMobileOpen(false)}
                                className="block px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                                {link.label}
                            </a>
                        ))}
                        <Link href="/login" onClick={() => setMobileOpen(false)}
                            className="block px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                            {t.nav.login}
                        </Link>
                    </div>
                </div>
            )}
        </header>
    );
}

// ─── Hero Section ─────────────────────────────────────────────────────────────

function FlowIllustration({ t }: { t: TKeys }) {
    return (
        <div className="w-full max-w-[460px] mx-auto">
            {/* Glass card container */}
            <div className="relative bg-white rounded-3xl shadow-2xl shadow-indigo-100 border border-gray-100 p-5">
                {/* Glow */}
                <div className="absolute -inset-4 bg-gradient-to-br from-indigo-100/50 to-violet-100/50 rounded-3xl blur-2xl -z-10" />

                {/* Step label */}
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                        <svg className="w-3.5 h-3.5 text-gray-500" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" />
                        </svg>
                    </div>
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Google Business</span>
                </div>

                {/* Google Review */}
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-2xl mb-3">
                    <div className="w-10 h-10 rounded-full bg-white border border-gray-200 shadow-sm flex-shrink-0 flex items-center justify-center overflow-hidden">
                        <div className="text-lg font-bold" style={{ background: 'linear-gradient(135deg, #4285F4, #34A853, #FBBC04, #EA4335)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>G</div>
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-sm font-semibold text-gray-900">Ahmed Al-Rashidi</span>
                            <div className="flex gap-0.5">
                                {[1,2,3,4,5].map(s => <span key={s} className="text-amber-400 text-xs">★</span>)}
                            </div>
                        </div>
                        <p className="text-xs text-gray-600 leading-relaxed">
                            &quot;The service was amazing and the team was incredibly professional. I will definitely come back!&quot;
                        </p>
                    </div>
                </div>

                {/* AI connector */}
                <div className="flex items-center gap-3 my-3 px-1">
                    <div className="flex-1 h-px bg-gradient-to-r from-indigo-200 to-violet-200" />
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-semibold shadow-sm shadow-indigo-300">
                        <span>✨</span>
                        <span>{t.hero.flow_label}</span>
                    </div>
                    <div className="flex-1 h-px bg-gradient-to-r from-violet-200 to-indigo-200" />
                </div>

                {/* Branded post */}
                <div className="rounded-2xl overflow-hidden shadow-md">
                    <div className="p-5" style={{ background: 'linear-gradient(135deg, #4F46E5, #7C3AED)' }}>
                        <div className="text-4xl font-serif text-white/15 leading-none mb-2">&quot;</div>
                        <p className="text-sm text-white font-medium leading-relaxed mb-3">
                            &quot;The service was amazing and the team was incredibly professional. I will definitely come back!&quot;
                        </p>
                        <div className="flex items-end justify-between">
                            <div>
                                <div className="flex gap-0.5 mb-0.5">
                                    {[1,2,3,4,5].map(s => <span key={s} className="text-amber-300 text-xs">★</span>)}
                                </div>
                                <p className="text-xs text-white/75">Ahmed Al-Rashidi</p>
                            </div>
                            <span className="text-xs text-white/50 font-medium">Google Reviews</span>
                        </div>
                    </div>
                    <div className="px-5 py-3 bg-indigo-900/20 border-t border-white/10" style={{ background: 'linear-gradient(135deg, #3730A3, #5B21B6)' }}>
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-white font-bold">Business Name 🌴</span>
                            <span className="text-xs text-white/50">@businessname</span>
                        </div>
                    </div>
                </div>

                {/* Published indicator */}
                <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-100">
                    <span className="text-xs text-gray-400">{t.hero.flow_published}</span>
                    <div className="flex gap-2">
                        {/* Instagram */}
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-sm" style={{ background: 'linear-gradient(135deg, #833AB4, #FD1D1D, #F77737)' }}>
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                            </svg>
                        </div>
                        {/* Facebook */}
                        <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                            </svg>
                        </div>
                    </div>
                    <div className="flex items-center gap-1 ms-auto">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span className="text-xs text-emerald-600 font-medium">Published</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

function HeroSection({ t, isRtl }: { t: TKeys; isRtl: boolean }) {
    return (
        <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
            {/* Backgrounds */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#6366f108_1px,transparent_1px),linear-gradient(to_bottom,#6366f108_1px,transparent_1px)] bg-[size:32px_32px]" />
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-50/80 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-violet-50/80 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3" />

            <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                    {/* Text */}
                    <div className={isRtl ? 'order-1 lg:order-1' : ''}>
                        {/* Badge */}
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-indigo-200 bg-indigo-50 text-indigo-700 text-sm font-medium mb-6">
                            {t.hero.badge}
                        </div>

                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-[1.08] tracking-tight mb-6">
                            {t.hero.h1}{' '}
                            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                                {t.hero.h1_accent}
                            </span>{' '}
                            <span className="text-gray-900">{t.hero.h1_end}</span>
                        </h1>

                        <p className="text-lg sm:text-xl text-gray-600 leading-relaxed mb-8 max-w-xl">
                            {t.hero.sub}
                        </p>

                        <div className="flex flex-col sm:flex-row items-start gap-4 mb-6">
                            <Link
                                href="/login"
                                className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold text-lg shadow-xl shadow-indigo-200 hover:shadow-2xl hover:shadow-indigo-300 hover:-translate-y-0.5 transition-all duration-200 whitespace-nowrap"
                            >
                                {t.hero.cta}
                                <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isRtl ? 'M11 17l-5-5m0 0l5-5m-5 5H18' : 'M13 7l5 5m0 0l-5 5m5-5H6'} />
                                </svg>
                            </Link>
                        </div>

                        <p className="text-sm text-gray-400 mb-10">{t.hero.sub_cta}</p>

                        {/* Stats */}
                        <div className="flex items-center gap-8 pt-8 border-t border-gray-100">
                            {t.hero.stats.map(stat => (
                                <div key={stat.v}>
                                    <p className="text-2xl font-extrabold text-gray-900 tabular-nums">{stat.v}</p>
                                    <p className="text-sm text-gray-500 mt-0.5">{stat.l}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Illustration */}
                    <div className={`${isRtl ? 'order-first lg:order-first' : ''} flex justify-center lg:justify-end`}>
                        <FlowIllustration t={t} />
                    </div>
                </div>
            </div>
        </section>
    );
}

// ─── How It Works ─────────────────────────────────────────────────────────────

const STEP_ICONS = [
    // Link icon
    <svg key="link" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>,
    // Sparkle/AI icon
    <svg key="ai" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>,
    // Send/publish icon
    <svg key="publish" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>,
];

function HowItWorksSection({ t }: { t: TKeys }) {
    const { ref, inView } = useInView();
    return (
        <section id="features" className="py-20 lg:py-28 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div ref={ref} className={`text-center max-w-3xl mx-auto mb-16 transition-all duration-700 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                    <span className="text-xs font-bold tracking-[0.2em] text-indigo-600 uppercase">{t.how.label}</span>
                    <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">{t.how.title}</h2>
                </div>

                <div className="grid md:grid-cols-3 gap-8 relative">
                    {/* Connecting line */}
                    <div className="hidden md:block absolute top-12 left-1/4 right-1/4 h-px bg-gradient-to-r from-indigo-200 via-violet-200 to-indigo-200" />

                    {t.how.steps.map((step, i) => {
                        const { ref: sr, inView: sv } = useInView();
                        return (
                            <div
                                key={step.n}
                                ref={sr}
                                className={`relative text-center transition-all duration-700 ${sv ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                                style={{ transitionDelay: `${i * 150}ms` }}
                            >
                                <div className="inline-flex flex-col items-center">
                                    <div className="relative mb-6">
                                        <div className="w-20 h-20 rounded-2xl bg-white shadow-lg border border-gray-100 flex items-center justify-center text-indigo-600">
                                            {STEP_ICONS[i]}
                                        </div>
                                        <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center">
                                            <span className="text-white text-xs font-bold">{i + 1}</span>
                                        </div>
                                    </div>
                                    <span className="text-xs font-bold tracking-[0.15em] text-indigo-400 mb-2">{step.n}</span>
                                    <h3 className="text-xl font-bold text-gray-900 mb-3">{step.t}</h3>
                                    <p className="text-gray-600 leading-relaxed max-w-xs">{step.d}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}

// ─── Templates Section ────────────────────────────────────────────────────────

const PREVIEW_MAP = {
    classic: ClassicPreview,
    bold: BoldPreview,
    product: ProductPreview,
};

const PRIMARY = '#4F46E5';
const SECONDARY = '#7C3AED';

function TemplatesSection({ t }: { t: TKeys }) {
    const { ref, inView } = useInView();
    return (
        <section id="templates" className="py-20 lg:py-28 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div ref={ref} className={`text-center max-w-3xl mx-auto mb-16 transition-all duration-700 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                    <span className="text-xs font-bold tracking-[0.2em] text-indigo-600 uppercase">{t.templates.label}</span>
                    <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">{t.templates.title}</h2>
                    <p className="mt-4 text-lg text-gray-600">{t.templates.sub}</p>
                </div>

                <div className="grid sm:grid-cols-3 gap-6 max-w-5xl mx-auto">
                    {t.templates.items.map((tpl, i) => {
                        const { ref: tr, inView: tv } = useInView();
                        const Preview = PREVIEW_MAP[tpl.id as keyof typeof PREVIEW_MAP];
                        return (
                            <div
                                key={tpl.id}
                                ref={tr}
                                className={`group rounded-3xl border-2 border-gray-100 overflow-hidden hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-50 transition-all duration-300 ${tv ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                                style={{ transitionDelay: `${i * 100}ms` }}
                            >
                                <div className="aspect-square bg-gray-50 overflow-hidden">
                                    <Preview primary={PRIMARY} secondary={SECONDARY} />
                                </div>
                                <div className="p-5 bg-white">
                                    <p className="font-bold text-gray-900 mb-1.5">{tpl.name}</p>
                                    <p className="text-sm text-gray-500 leading-relaxed">{tpl.desc}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}

// ─── Pricing Section ──────────────────────────────────────────────────────────

function CheckIcon() {
    return (
        <svg className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
    );
}

// ─── API plan shape returned by /api/plans ────────────────────────────────────
interface ApiPlan {
    id: string;
    name: string;
    displayName: string;
    price: number;
    currency: string;
    interval: string;
    postsLimit: number;
    reviewsLimit: number;
    features: string[];
    sortOrder: number;
}

const LANG_CURRENCY: Record<string, string> = { EN: 'USD', AR: 'SAR', TR: 'TL' };
const CURRENCY_SYMBOL: Record<string, string> = { USD: '$', SAR: '﷼', TL: '₺' };
const CURRENCY_SUFFIX: Record<string, boolean> = { SAR: true, TL: true };
const PERIOD_LABEL: Record<string, string> = { USD: '/mo', SAR: '/ شهر', TL: '/ ay' };
const POPULAR_TIER = 'GROWTH';

function PlanCard({ plan, popular, popularLabel, ctaLabel, delay }: {
    plan: ApiPlan & { localName: string; localDesc: string };
    popular: boolean;
    popularLabel: string;
    ctaLabel: string;
    delay: number;
}) {
    const { ref, inView } = useInView();
    const sym = CURRENCY_SYMBOL[plan.currency] ?? plan.currency;
    const suffix = CURRENCY_SUFFIX[plan.currency];
    const period = PERIOD_LABEL[plan.currency] ?? '/mo';
    const priceInt = Math.floor(plan.price);

    return (
        <div
            ref={ref}
            className={`relative rounded-3xl p-8 transition-all duration-700 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${
                popular
                    ? 'bg-gradient-to-b from-indigo-600 to-violet-700 shadow-2xl shadow-indigo-200 ring-2 ring-indigo-600 scale-[1.02]'
                    : 'bg-white border border-gray-100 shadow-sm'
            }`}
            style={{ transitionDelay: `${delay}ms` }}
        >
            {popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="bg-gradient-to-r from-amber-400 to-orange-400 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-sm whitespace-nowrap">
                        {popularLabel}
                    </span>
                </div>
            )}

            <div className="mb-6">
                <p className={`text-lg font-bold mb-1 ${popular ? 'text-white' : 'text-gray-900'}`}>{plan.localName}</p>
                <p className={`text-sm ${popular ? 'text-white/70' : 'text-gray-500'}`}>{plan.localDesc}</p>
            </div>

            <div className="flex items-end gap-1 mb-6">
                {!suffix && (
                    <span className={`text-sm font-semibold ${popular ? 'text-white/80' : 'text-gray-600'}`}>{sym}</span>
                )}
                <span className={`text-5xl font-extrabold tracking-tight ${popular ? 'text-white' : 'text-gray-900'}`}>{priceInt}</span>
                {suffix && (
                    <span className={`text-sm font-semibold ${popular ? 'text-white/80' : 'text-gray-600'} mb-1`}>{sym}</span>
                )}
                <span className={`text-sm ${popular ? 'text-white/70' : 'text-gray-500'} mb-1`}>{period}</span>
            </div>

            <Link
                href="/login"
                className={`block text-center py-3 rounded-2xl text-sm font-bold transition-all duration-150 mb-8 ${
                    popular
                        ? 'bg-white text-indigo-600 hover:bg-white/90 shadow-md'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm shadow-indigo-200'
                }`}
            >
                {ctaLabel}
            </Link>

            <ul className="space-y-3">
                {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                        <svg
                            className={`w-4 h-4 flex-shrink-0 mt-0.5 ${popular ? 'text-white/80' : 'text-indigo-500'}`}
                            fill="none" viewBox="0 0 24 24" stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className={`text-sm ${popular ? 'text-white/90' : 'text-gray-600'}`}>{f}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

function PricingSection({ t, lang }: { t: TKeys; lang: Lang }) {
    const [yearly, setYearly] = useState(false);
    const { ref, inView } = useInView();
    const [apiPlans, setApiPlans] = useState<ApiPlan[]>([]);
    const [plansLoading, setPlansLoading] = useState(true);

    const currency = LANG_CURRENCY[lang] ?? 'USD';

    useEffect(() => {
        setPlansLoading(true);
        fetch(`/api/plans?currency=${currency}`)
            .then((r) => r.json())
            .then((data) => setApiPlans(data.plans ?? []))
            .catch(() => setApiPlans([]))
            .finally(() => setPlansLoading(false));
    }, [currency]);

    const interval = yearly ? 'YEARLY' : 'MONTHLY';
    const displayPlans = apiPlans
        .filter((p) => p.interval === interval)
        .sort((a, b) => a.sortOrder - b.sortOrder);

    // Merge DB plan data with localized names/descs from T object
    const mergedPlans = displayPlans.map((dbPlan, i) => ({
        ...dbPlan,
        localName: t.pricing.plans[i]?.name ?? dbPlan.displayName,
        localDesc: t.pricing.plans[i]?.desc ?? '',
    }));

    return (
        <section id="pricing" className="py-20 lg:py-28" style={{ background: 'linear-gradient(180deg, #f8faff 0%, #f0f4ff 50%, #f8faff 100%)' }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div ref={ref} className={`text-center max-w-3xl mx-auto mb-12 transition-all duration-700 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                    <span className="text-xs font-bold tracking-[0.2em] text-indigo-600 uppercase">{t.pricing.label}</span>
                    <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">{t.pricing.title}</h2>
                    <p className="mt-4 text-lg text-gray-600">{t.pricing.sub}</p>

                    {/* Toggle */}
                    <div className="inline-flex items-center gap-3 mt-8 p-1.5 rounded-2xl bg-white border border-gray-200 shadow-sm">
                        <button
                            onClick={() => setYearly(false)}
                            className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${!yearly ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            {t.pricing.monthly}
                        </button>
                        <button
                            onClick={() => setYearly(true)}
                            className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${yearly ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            {t.pricing.yearly}
                            <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${yearly ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-700'}`}>
                                {t.pricing.save}
                            </span>
                        </button>
                    </div>
                </div>

                {plansLoading ? (
                    <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                        {[0, 1, 2].map((i) => (
                            <div key={i} className="rounded-3xl p-8 bg-white border border-gray-100 shadow-sm animate-pulse">
                                <div className="h-5 bg-gray-200 rounded w-1/3 mb-2" />
                                <div className="h-4 bg-gray-100 rounded w-2/3 mb-8" />
                                <div className="h-14 bg-gray-200 rounded w-1/2 mb-6" />
                                <div className="h-10 bg-gray-100 rounded-2xl mb-8" />
                                {[0, 1, 2, 3].map((j) => (
                                    <div key={j} className="h-4 bg-gray-100 rounded mb-3" />
                                ))}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto items-start">
                        {mergedPlans.map((plan, i) => (
                            <PlanCard
                                key={plan.id}
                                plan={plan}
                                popular={plan.name === POPULAR_TIER}
                                popularLabel={t.pricing.popular}
                                ctaLabel={t.pricing.cta}
                                delay={i * 100}
                            />
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}

// ─── Who Is It For ────────────────────────────────────────────────────────────

const LOCAL_BIZ_ICONS = ['🍽', '🏨', '🏥', '💇', '🛍'];
const ECOM_ICONS = ['🛒', '🛍', '🌐'];

function WhoForSection({ t }: { t: TKeys }) {
    const { ref, inView } = useInView();
    return (
        <section className="py-20 lg:py-28 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div ref={ref} className={`text-center max-w-3xl mx-auto mb-16 transition-all duration-700 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                    <span className="text-xs font-bold tracking-[0.2em] text-indigo-600 uppercase">{t.who.label}</span>
                    <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">{t.who.title}</h2>
                </div>

                <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                    {/* Track A */}
                    <div className="bg-gradient-to-br from-indigo-50 to-violet-50 rounded-3xl border border-indigo-100 p-8">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center mb-4 shadow-md shadow-indigo-200">
                            <span className="text-xl">🏪</span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{t.who.a.title}</h3>
                        <p className="text-sm text-gray-600 mb-6">{t.who.a.sub}</p>
                        <ul className="space-y-3">
                            {t.who.a.items.map((item, i) => (
                                <li key={item} className="flex items-center gap-3">
                                    <span className="text-xl">{LOCAL_BIZ_ICONS[i] ?? '✦'}</span>
                                    <span className="text-sm font-medium text-gray-800">{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Track B */}
                    <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-3xl border border-violet-100 p-8">
                        <div className="w-12 h-12 rounded-2xl bg-violet-600 flex items-center justify-center mb-4 shadow-md shadow-violet-200">
                            <span className="text-xl">🛍</span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{t.who.b.title}</h3>
                        <p className="text-sm text-gray-600 mb-6">{t.who.b.sub}</p>
                        <ul className="space-y-3">
                            {t.who.b.items.map((item, i) => (
                                <li key={item} className="flex items-center gap-3">
                                    <span className="text-xl">{ECOM_ICONS[i] ?? '✦'}</span>
                                    <span className="text-sm font-medium text-gray-800">{item}</span>
                                </li>
                            ))}
                        </ul>

                        {/* Salla badge */}
                        <div className="mt-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-violet-200 text-xs font-semibold text-violet-700">
                            <span>🤝</span>
                            <span>Official Salla App Partner</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

// ─── FAQ Section ──────────────────────────────────────────────────────────────

function FAQSection({ t }: { t: TKeys }) {
    const [open, setOpen] = useState<number | null>(null);
    const { ref, inView } = useInView();

    return (
        <section id="faq" className="py-20 lg:py-28 bg-gray-50">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                <div ref={ref} className={`text-center mb-14 transition-all duration-700 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                    <span className="text-xs font-bold tracking-[0.2em] text-indigo-600 uppercase">{t.faq.label}</span>
                    <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">{t.faq.title}</h2>
                </div>

                <div className="space-y-3">
                    {t.faq.items.map((item, i) => (
                        <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition-shadow hover:shadow-md">
                            <button
                                onClick={() => setOpen(open === i ? null : i)}
                                className="w-full flex items-center justify-between gap-4 p-5 text-start"
                            >
                                <span className={`text-sm font-semibold leading-relaxed ${open === i ? 'text-indigo-600' : 'text-gray-900'}`}>
                                    {item.q}
                                </span>
                                <div className={`w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center transition-all duration-200 ${open === i ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                                    <svg className={`w-4 h-4 transition-transform duration-200 ${open === i ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </button>

                            <div className={`overflow-hidden transition-all duration-300 ${open === i ? 'max-h-40' : 'max-h-0'}`}>
                                <p className="px-5 pb-5 text-sm text-gray-600 leading-relaxed">{item.a}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* CTA */}
                <div className="mt-14 text-center p-8 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-3xl shadow-xl shadow-indigo-200">
                    <h3 className="text-2xl font-bold text-white mb-2">Ready to start?</h3>
                    <p className="text-white/75 mb-6 text-sm">Join 500+ businesses automating their social media with reviews.</p>
                    <Link href="/login" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-white text-indigo-600 font-bold text-sm shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-150">
                        {t.pricing.cta}
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                    </Link>
                </div>
            </div>
        </section>
    );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function FooterSection({ t, lang }: { t: TKeys; lang: Lang }) {
    const isRtl = lang === 'AR';
    return (
        <footer className="bg-gray-950 text-gray-400">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
                    {/* Brand */}
                    <div className="col-span-2 md:col-span-2">
                        <div className={`flex items-center gap-2.5 mb-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-900/40">
                                <span className="text-white font-bold text-sm">R</span>
                            </div>
                            <span className="font-bold text-white text-xl tracking-tight">ReviewPost</span>
                        </div>
                        <p className="text-sm text-gray-500 leading-relaxed max-w-xs">{t.footer.tagline}</p>
                        {/* Social icons */}
                        <div className="flex gap-3 mt-5">
                            {[
                                { label: 'X', path: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.26 5.632zm-1.161 17.52h1.833L7.084 4.126H5.117z' },
                                { label: 'Instagram', path: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069z' },
                            ].map(s => (
                                <a key={s.label} href="#" aria-label={s.label} className="w-9 h-9 rounded-xl bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors">
                                    <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                                        <path d={s.path} />
                                    </svg>
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Links */}
                    {t.footer.links.map(group => (
                        <div key={group.title}>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">{group.title}</p>
                            <ul className="space-y-2.5">
                                {group.items.map(([label, href]) => (
                                    <li key={label}>
                                        <a href={href} className="text-sm text-gray-500 hover:text-gray-300 transition-colors">{label}</a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                <div className="border-t border-gray-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-xs text-gray-600">{t.footer.copy}</p>
                    <p className="text-xs text-gray-600">{t.footer.powered}</p>
                </div>
            </div>
        </footer>
    );
}

// ─── Main Landing Page ────────────────────────────────────────────────────────

export default function LandingPage() {
    const [lang, setLang] = useState<Lang>('EN');
    const router = useRouter();
    const { data: session, status } = useSession();

    // Redirect authenticated users to dashboard
    useEffect(() => {
        if (status === 'authenticated' && session?.user) {
            router.replace('/dashboard');
        }
    }, [status, session, router]);

    // Load language preference from localStorage
    useEffect(() => {
        try {
            const saved = localStorage.getItem('reviewpost-lang') as Lang | null;
            if (saved && T[saved]) setLang(saved);
        } catch {
            // localStorage unavailable (SSR / private mode)
        }
    }, []);

    const handleLangChange = (l: Lang) => {
        setLang(l);
        try { localStorage.setItem('reviewpost-lang', l); } catch { /* ignore */ }
    };

    const t = T[lang] as TKeys;
    const isRtl = lang === 'AR';

    if (status === 'loading') return null;

    return (
        <div dir={isRtl ? 'rtl' : 'ltr'} className="bg-white text-gray-900 overflow-x-hidden">
            <Navbar lang={lang} setLang={handleLangChange} t={t} />
            <main>
                <HeroSection t={t} isRtl={isRtl} />
                <HowItWorksSection t={t} />
                <TemplatesSection t={t} />
                <PricingSection t={t} lang={lang} />
                <WhoForSection t={t} />
                <FAQSection t={t} />
            </main>
            <FooterSection t={t} lang={lang} />
        </div>
    );
}
