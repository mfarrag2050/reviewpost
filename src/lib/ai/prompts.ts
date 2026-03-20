import { Language, PostPlatform } from '../../generated/prisma';
import { BusinessContext, CaptionOptions, ArabicCaptionOptions, ArabicTone, SallaReviewContext } from './types';

// ─── System prompts per language ─────────────────────────────

const SYSTEM_PROMPTS: Record<Language, string> = {
    AR: `أنت خبير تسويق رقمي متخصص في كتابة محتوى وسائل التواصل الاجتماعي باللغة العربية.
مهمتك: تحويل تقييمات العملاء إلى منشورات جذابة واحترافية.
اكتب المحتوى من اليمين إلى اليسار (RTL) مع استخدام المصطلحات العربية الفصيحة.
أسلوبك: دافئ، موثوق، وحماسي دون مبالغة.`,

    EN: `You are an expert social media marketer specializing in converting customer reviews into engaging content.
Your task: transform review text into compelling, brand-aligned social media posts.
Style: warm, credible, enthusiastic, and authentic.`,

    TR: `Siz, müşteri yorumlarını ilgi çekici sosyal medya içeriklerine dönüştürme konusunda uzman bir dijital pazarlamacısınız.
Göreviniz: Yorum metinlerini marka uyanımlı, etkileyici paylaşımlara çevirmek.
Stil: Sıcak, güvenilir ve heyecan verici.`,
};

// ─── Platform-specific user prompt templates ─────────────────

interface PromptTemplateArgs {
    review: string;
    author: string;
    rating: number;
    business: BusinessContext;
    options: CaptionOptions;
}

function buildInstagramPrompt(args: PromptTemplateArgs): string {
    const { review, author, rating, business, options } = args;
    const stars = '⭐'.repeat(rating);

    if (options.language === 'AR') {
        return `قيّم ${author} خدمات ${business.name} بـ ${rating}/5 ${stars}

التقييم: "${review}"

اكتب منشور إنستغرام جذاباً يتضمن:
- عنوان قصير ومؤثر مع إيموجي مناسب
- نص المنشور (3-4 جمل) يعكس تجربة العميل بأسلوب مشوق
- دعوة للعمل (CTA)${options.includeCTA ? '' : ' (اختياري)'}
- ${options.includeHashtags ? '5-8 هاشتاق عربية وإنجليزية ذات صلة' : 'بدون هاشتاق'}

أجب بتنسيق JSON فقط:
{"caption": "...", "hashtags": ["...", "..."], "emoji": "🌟"}`;
    }

    if (options.language === 'TR') {
        return `${author}, ${business.name} işletmesini ${rating}/5 ${stars} olarak değerlendirdi.

Yorum: "${review}"

Instagram için çekici bir paylaşım yaz:
- Emoji ile kısa ve etkili başlık
- 3-4 cümlelik ilgi çekici metin
${options.includeCTA ? '- Eyleme çağrı (CTA)' : ''}
- ${options.includeHashtags ? '5-8 ilgili hashtag' : 'Hashtag yok'}

Sadece JSON formatında yanıtla:
{"caption": "...", "hashtags": ["...", "..."], "emoji": "🌟"}`;
    }

    return `${author} rated ${business.name} ${rating}/5 ${stars}

Review: "${review}"

Write an engaging Instagram caption that includes:
- A punchy opening line with fitting emoji
- 3-4 sentences highlighting the customer experience
${options.includeCTA ? '- A clear call-to-action' : ''}
- ${options.includeHashtags ? '5-8 relevant hashtags' : 'No hashtags'}

Reply in JSON only:
{"caption": "...", "hashtags": ["...", "..."], "emoji": "✨"}`;
}

function buildFacebookPrompt(args: PromptTemplateArgs): string {
    const { review, author, rating, business, options } = args;
    const stars = '⭐'.repeat(rating);

    if (options.language === 'AR') {
        return `تقييم من ${author} لـ ${business.name}: ${rating}/5 ${stars}

"${review}"

اكتب منشور فيسبوك احترافي يشمل:
- افتتاحية قوية تبرز التقييم الإيجابي
- فقرة تشرح قيمة الخدمة للعملاء المحتملين
${options.includeCTA ? '- دعوة واضحة للتفاعل أو الحجز' : ''}
- ${options.includeHashtags ? '3-5 هاشتاق ذات صلة' : 'بدون هاشتاق'}

أجب بـ JSON فقط:
{"caption": "...", "hashtags": ["...", "..."], "emoji": "👏"}`;
    }

    if (options.language === 'TR') {
        return `${business.name} için ${author} tarafından ${rating}/5 ${stars} değerlendirme.

"${review}"

Profesyonel bir Facebook paylaşımı yaz:
- Güçlü açılış cümlesi
- Müşteri deneyimini öne çıkaran 2-3 paragraf
${options.includeCTA ? '- Rezervasyon veya iletişim için CTA' : ''}
- ${options.includeHashtags ? '3-5 hashtag' : 'Hashtag yok'}

Sadece JSON:
{"caption": "...", "hashtags": ["...", "..."], "emoji": "👍"}`;
    }

    return `${business.name} received a ${rating}/5 ${stars} review from ${author}.

"${review}"

Write a professional Facebook post:
- Strong headline highlighting the positive experience
- 2-3 paragraphs showcasing value for potential customers
${options.includeCTA ? '- Clear CTA (book now, visit us, contact us)' : ''}
- ${options.includeHashtags ? '3-5 relevant hashtags' : 'No hashtags'}

Reply JSON only:
{"caption": "...", "hashtags": ["...", "..."], "emoji": "🙌"}`;
}

function buildTwitterPrompt(args: PromptTemplateArgs): string {
    const { review, author, rating, business, options } = args;
    const stars = '⭐'.repeat(rating);

    if (options.language === 'AR') {
        return `تقييم ${rating}/5 ${stars} من ${author} لـ ${business.name}

"${review}"

اكتب تغريدة قصيرة ومؤثرة (أقل من 200 حرف عربي):
- مقتضبة وتلفت الانتباه
${options.includeCTA ? '- دعوة للعمل قصيرة' : ''}
- ${options.includeHashtags ? '2-3 هاشتاق' : 'بدون هاشتاق'}

JSON فقط:
{"caption": "...", "hashtags": ["...", "..."], "emoji": "🔥"}`;
    }

    if (options.language === 'TR') {
        return `${business.name} için ${rating}/5 ${stars} (${author})

"${review}"

Kısa ve çarpıcı bir tweet yaz (200 karakter altı):
${options.includeCTA ? '- Kısa CTA' : ''}
- ${options.includeHashtags ? '2-3 hashtag' : 'Hashtag yok'}

JSON:
{"caption": "...", "hashtags": ["...", "..."], "emoji": "🔥"}`;
    }

    return `${business.name} — ${rating}/5 ${stars} by ${author}

"${review}"

Write a short punchy tweet (under 200 chars):
- Snappy and attention-grabbing
${options.includeCTA ? '- Short CTA' : ''}
- ${options.includeHashtags ? '2-3 hashtags' : 'No hashtags'}

JSON only:
{"caption": "...", "hashtags": ["...", "..."], "emoji": "🔥"}`;
}

// ─── Exports ─────────────────────────────────────────────────

export function getSystemPrompt(language: Language): string {
    return SYSTEM_PROMPTS[language] ?? SYSTEM_PROMPTS.EN;
}

export function buildUserPrompt(args: PromptTemplateArgs): string {
    switch (args.options.platform) {
        case PostPlatform.INSTAGRAM:
            return buildInstagramPrompt(args);
        case PostPlatform.FACEBOOK:
            return buildFacebookPrompt(args);
        case PostPlatform.TWITTER:
        case PostPlatform.TIKTOK:
            return buildTwitterPrompt(args);
        default:
            return buildInstagramPrompt(args);
    }
}

// ─── Salla Arabic Caption Prompts ───────────────────────────────

const SALLA_SYSTEM_PROMPTS: Record<ArabicTone, string> = {
    FORMAL: `أنت خبير تسويق رقمي متخصص في كتابة محتوى عربي احترافي لمتاجر إلكترونية على منصة سلة.
مهمتك: تحويل تقييمات العملاء إلى منشورات سوشيال ميديا جذابة تزيد المبيعات.
اكتب بالعربية الفصحى المعاصرة (فصيح لكن ليس أكاديمي).
أسلوبك: احترافي، مقنع، يعزز الثقة بالمتجر والمنتج.
لا تترجم أسماء المنتجات الإنجليزية — استخدمها كما هي مع السياق العربي.`,

    COLLOQUIAL: `أنت خبير سوشيال ميديا متخصص في كتابة محتوى عامّي جذاب لمتاجر سلة.
مهمتك: تحويل تقييمات العملاء لبوستات حلوة وقريبة من الناس.
اكتب بالعامية السعودية/الخليجية (مثل: "وش تنتظر؟"، "يستاهل"، "جربوه!").
أسلوبك: ودّي، حماسي، وطبيعي — مثل صديق ينصحك.
لا تترجم أسماء المنتجات الإنجليزية — استخدمها كما هي.`,
};

interface SallaPromptArgs {
    review: SallaReviewContext;
    business: BusinessContext;
    options: ArabicCaptionOptions;
}

function buildSallaInstagramPrompt(args: SallaPromptArgs): string {
    const { review, business, options } = args;
    const stars = '⭐'.repeat(review.rating ?? 5);
    const productInfo = review.productName
        ? `\nالمنتج: ${review.productName}`
        : '';
    const priceInfo = review.productPrice
        ? `\nالسعر: ${review.productPrice}`
        : '';
    const toneNote = options.tone === 'COLLOQUIAL'
        ? 'اكتب بعامية سعودية/خليجية قريبة من الناس.'
        : 'اكتب بعربية فصحى معاصرة واحترافية.';

    return `تقييم عميل لمتجر ${business.name}: ${review.rating}/5 ${stars}
${productInfo}${priceInfo}

التقييم: "${review.text ?? ''}"
المُقيّم: ${review.authorName ?? 'عميل'}

${toneNote}

اكتب منشور إنستغرام لمتجر سلة يتضمن:
- عنوان جذاب مع إيموجي مناسب
- إبراز تجربة العميل والمنتج (3-4 جمل)
${review.productName ? `- ذكر اسم المنتج "${review.productName}" بشكل طبيعي` : ''}
${options.includeCTA ? `- دعوة للشراء: "اطلب الآن" مع رابط المتجر` : ''}
${options.includeHashtags ? `- 5-8 هاشتاقات عربية مثل: #تقييم_عميل #تسوق_اونلاين #سلة #منتجات_أصلية #تقييمات` : '- بدون هاشتاقات'}

أجب بتنسيق JSON فقط:
{"caption": "...", "hashtags": ["#تقييم_عميل", "#تسوق_اونلاين", "..."], "emoji": "🛍", "cta": "اطلب الآن"}`;
}

function buildSallaFacebookPrompt(args: SallaPromptArgs): string {
    const { review, business, options } = args;
    const stars = '⭐'.repeat(review.rating ?? 5);
    const productInfo = review.productName
        ? `\nالمنتج: ${review.productName}`
        : '';
    const toneNote = options.tone === 'COLLOQUIAL'
        ? 'اكتب بعامية سعودية/خليجية.'
        : 'اكتب بعربية فصحى معاصرة.';

    return `تقييم ${review.rating}/5 ${stars} من ${review.authorName ?? 'عميل'} لمتجر ${business.name}
${productInfo}

"${review.text ?? ''}"

${toneNote}

اكتب منشور فيسبوك لمتجر سلة:
- افتتاحية تبرز رضا العميل
- فقرة عن جودة المنتج والخدمة
${options.includeCTA ? '- دعوة للزيارة والشراء' : ''}
${options.includeHashtags ? '- 3-5 هاشتاقات عربية ذات صلة' : '- بدون هاشتاقات'}

JSON فقط:
{"caption": "...", "hashtags": ["...", "..."], "emoji": "👏", "cta": "زوروا متجرنا"}`;
}

function buildSallaTwitterPrompt(args: SallaPromptArgs): string {
    const { review, business, options } = args;
    const stars = '⭐'.repeat(review.rating ?? 5);
    const toneNote = options.tone === 'COLLOQUIAL'
        ? 'اكتب بعامية خليجية مختصرة.'
        : 'اكتب بفصحى مختصرة.';

    return `${review.rating}/5 ${stars} — ${review.authorName ?? 'عميل'} عن ${business.name}
${review.productName ? `المنتج: ${review.productName}` : ''}

"${review.text ?? ''}"

${toneNote}

تغريدة قصيرة (أقل من 200 حرف):
${options.includeCTA ? '- دعوة مختصرة للشراء' : ''}
${options.includeHashtags ? '- 2-3 هاشتاقات' : ''}

JSON:
{"caption": "...", "hashtags": ["...", "..."], "emoji": "🔥", "cta": "اطلب الآن"}`;
}

export function getSallaSystemPrompt(tone: ArabicTone): string {
    return SALLA_SYSTEM_PROMPTS[tone] ?? SALLA_SYSTEM_PROMPTS.FORMAL;
}

export function buildSallaUserPrompt(args: SallaPromptArgs): string {
    switch (args.options.platform) {
        case PostPlatform.INSTAGRAM:
            return buildSallaInstagramPrompt(args);
        case PostPlatform.FACEBOOK:
            return buildSallaFacebookPrompt(args);
        case PostPlatform.TWITTER:
        case PostPlatform.TIKTOK:
            return buildSallaTwitterPrompt(args);
        default:
            return buildSallaInstagramPrompt(args);
    }
}
