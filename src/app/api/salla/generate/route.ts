import { NextRequest, NextResponse } from 'next/server';
import { PostPlatform } from '@/generated/prisma';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { getAIKey } from '@/lib/ai/key-router';
import { CaptionGenerator } from '@/lib/ai/caption-generator';
import { ArabicTone } from '@/lib/ai/types';
import { ProductMatcher } from '@/lib/salla/product-matcher';
import { getTemplate } from '@/lib/templates';
import { getImageRenderer } from '@/lib/templates/renderer';
import { TemplateId, TemplateData } from '@/lib/templates/types';
import { wrapApiHandler } from '@/lib/monitoring/error-handler';
import { createLogger } from '@/lib/monitoring/logger';

const log = createLogger('SallaGenerate');
const matcher = new ProductMatcher();

interface GenerateRequestBody {
    reviewId: string;
    platform?: string;
    template?: string;
    tone?: 'FORMAL' | 'COLLOQUIAL';
    renderImage?: boolean;
}

const VALID_SALLA_TEMPLATES: TemplateId[] = ['salla-classic', 'salla-modern', 'salla-product'];

/**
 * POST /api/salla/generate
 * Takes a Salla review ID, generates an Arabic caption + renders template with product image.
 */
export const POST = wrapApiHandler('/api/salla/generate', async (req: NextRequest) => {
    const session = await auth();
    if (!session?.user?.userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json() as GenerateRequestBody;
    const { reviewId, platform, template, tone, renderImage } = body;

    if (!reviewId || typeof reviewId !== 'string') {
        return NextResponse.json({ error: 'reviewId is required' }, { status: 400 });
    }

    const review = await prisma.review.findUnique({
        where: { id: reviewId },
        include: {
            business: {
                select: {
                    id: true,
                    name: true,
                    type: true,
                    userId: true,
                    logoUrl: true,
                    brandColors: true,
                    arabicTone: true,
                },
            },
            sallaStore: {
                select: { id: true, storeUrl: true, storeName: true },
            },
        },
    });

    if (!review) {
        return NextResponse.json({ error: `Review ${reviewId} not found` }, { status: 404 });
    }

    if (review.source !== 'SALLA') {
        return NextResponse.json({ error: 'This endpoint is for Salla reviews only' }, { status: 400 });
    }

    if (review.business.userId !== session.user.userId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const storeId = review.sallaStore?.id;
    let enriched = null;
    if (storeId) {
        enriched = await matcher.enrichReviewWithProduct(reviewId, storeId);
    }

    const resolvedPlatform = (platform as PostPlatform) || PostPlatform.INSTAGRAM;
    const resolvedTone: ArabicTone = tone ?? review.business.arabicTone ?? 'FORMAL';
    const resolvedTemplate: TemplateId =
        (VALID_SALLA_TEMPLATES.includes(template as TemplateId) ? template as TemplateId : null)
        ?? 'salla-classic';

    const { apiKey, mode } = await getAIKey(review.business.userId);
    const generator = new CaptionGenerator(apiKey);

    const captionResult = await generator.generateArabicCaption(
        {
            id: review.id,
            authorName: review.authorName,
            rating: review.rating,
            text: review.text,
            source: review.source,
            productName: enriched?.productName ?? review.productName ?? undefined,
            productImage: enriched?.productImageUrl ?? review.productImageUrl ?? undefined,
            productPrice: enriched?.productPrice,
            productLink: enriched?.productLink,
            storeUrl: review.sallaStore?.storeUrl ?? undefined,
        },
        {
            name: review.business.name,
            type: review.business.type,
            language: 'AR',
        },
        {
            platform: resolvedPlatform,
            tone: resolvedTone,
            includeHashtags: true,
            includeCTA: true,
            storeLink: review.sallaStore?.storeUrl ?? undefined,
        },
    );

    const brandColors = (review.business.brandColors as Record<string, string> | null) ?? {};
    const templateData: TemplateData = {
        review_text: review.text ?? '',
        author_name: review.authorName ?? 'عميل',
        rating: review.rating ?? 5,
        business_name: review.business.name,
        logo_url: review.business.logoUrl ?? '',
        brand_primary: brandColors.primary ?? '#2563eb',
        brand_secondary: brandColors.secondary ?? '#7c3aed',
        brand_text: brandColors.text ?? '#ffffff',
        product_name: enriched?.productName ?? review.productName ?? '',
        product_image_url: enriched?.productImageUrl ?? review.productImageUrl ?? '',
        product_link: enriched?.productLink ?? review.sallaStore?.storeUrl ?? '#',
        product_price: enriched?.productPrice ?? '',
        language: 'AR',
        source: 'سلّة — Salla',
    };

    const html = getTemplate(resolvedTemplate, templateData);

    let imageResult = null;
    if (renderImage !== false) {
        const renderer = getImageRenderer();
        imageResult = await renderer.renderTemplate(
            resolvedTemplate,
            templateData,
            review.business.id,
            { format: 'INSTAGRAM' },
        );
    }

    log.info('Salla post generated', {
        reviewId,
        platform: resolvedPlatform,
        template: resolvedTemplate,
        tone: resolvedTone,
        keyMode: mode,
        tokensUsed: captionResult.tokensUsed,
    });

    return NextResponse.json({
        success: true,
        reviewId,
        caption: captionResult,
        template: resolvedTemplate,
        html,
        image: imageResult ? {
            filePath: imageResult.filePath,
            fileName: imageResult.fileName,
            fileSize: imageResult.fileSize,
            width: imageResult.width,
            height: imageResult.height,
        } : null,
        product: enriched,
    });
});
