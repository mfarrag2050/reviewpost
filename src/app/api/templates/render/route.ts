import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { prisma } from '@/lib/prisma';
import { getImageRenderer, RenderFormat } from '@/lib/templates/renderer';
import { TemplateId, TemplateData } from '@/lib/templates/types';

// Map frontend platform names to render formats
const PLATFORM_TO_FORMAT: Record<string, RenderFormat> = {
    INSTAGRAM: 'INSTAGRAM',
    FACEBOOK: 'FACEBOOK',
    TWITTER: 'INSTAGRAM', // use square for Twitter too
    TIKTOK: 'STORY',
    STORY: 'STORY',
};

/**
 * POST /api/templates/render
 * Body: { templateId, reviewId, platform?, businessId? }
 *
 * Loads review + business from DB, injects into template,
 * renders via Puppeteer, returns the saved PNG file info.
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json() as {
            templateId?: string;
            reviewId?: string;
            platform?: string;
            businessId?: string; // optional override
        };

        const { reviewId, platform = 'INSTAGRAM' } = body;
        const templateId = (body.templateId ?? 'classic') as TemplateId;

        if (!reviewId) {
            return NextResponse.json({ error: 'reviewId is required' }, { status: 400 });
        }

        if (!['classic', 'bold', 'product'].includes(templateId)) {
            return NextResponse.json(
                { error: 'templateId must be one of: classic, bold, product' },
                { status: 400 },
            );
        }

        // Load review + business from DB
        const review = await prisma.review.findUnique({
            where: { id: reviewId },
            include: {
                business: {
                    select: {
                        id: true,
                        name: true,
                        type: true,
                        logoUrl: true,
                        brandColors: true,
                    },
                },
            },
        });

        if (!review) {
            return NextResponse.json({ error: `Review ${reviewId} not found` }, { status: 404 });
        }

        const { business } = review;
        const resolvedBusinessId = body.businessId ?? business.id;
        const format: RenderFormat = PLATFORM_TO_FORMAT[platform.toUpperCase()] ?? 'INSTAGRAM';

        // استخراج الألوان من brandColors JSON أو القيم الافتراضية
        const colors = (business.brandColors ?? {}) as Record<string, string>;

        // Build TemplateData from DB records
        const templateData: TemplateData = {
            review_text: review.text ?? '',
            author_name: review.authorName ?? 'Customer',
            rating: review.rating ?? 5,
            business_name: business.name,
            logo_url: business.logoUrl ?? '',
            brand_primary: colors.primary ?? '#7C3AED',
            brand_secondary: colors.secondary ?? '#4F46E5',
            brand_text: colors.text ?? '#ffffff',
            source: review.source === 'GOOGLE' ? 'Google Reviews' : review.source,
            language: 'AR', // TODO: load from user prefs
            // product fields (only used by product template)
            product_name: undefined,
            product_image_url: undefined,
            product_link: undefined,
        };

        // Render via Puppeteer
        const renderer = getImageRenderer();
        const result = await renderer.renderTemplate(templateId, templateData, resolvedBusinessId, {
            format,
        });

        // Build public URL  (Next.js will serve /storage via a future static route,
        // for now we return the relative path from project root)
        const relativePath = path.relative(process.cwd(), result.filePath);
        const publicUrl = `/${relativePath.replace(/\\/g, '/')}`;

        return NextResponse.json({
            success: true,
            templateId,
            platform,
            format,
            filePath: result.filePath,
            publicUrl,
            fileName: result.fileName,
            fileSize: result.fileSize,
            width: result.width,
            height: result.height,
        });
    } catch (err) {
        console.error('[/api/templates/render] Error:', err);
        return NextResponse.json(
            { error: 'Render failed', detail: String(err) },
            { status: 500 },
        );
    }
}
