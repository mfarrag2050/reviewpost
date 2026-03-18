import { NextRequest, NextResponse } from 'next/server';
import { PostPlatform } from '@/generated/prisma';
import { prisma } from '@/lib/prisma';
import { getAIKey } from '@/lib/ai/key-router';
import { CaptionGenerator } from '@/lib/ai/caption-generator';
import { CaptionRequest } from '@/lib/ai/types';

/**
 * POST /api/ai/generate-caption
 * Body: { reviewId: string, platform: PostPlatform, language?, includeHashtags?, includeCTA?, userId? }
 *
 * Loads the review + business from DB, resolves the AI key via the 3-layer router,
 * generates a caption, and returns the full result.
 *
 * NOTE: userId is temporary until auth middleware is in place.
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json() as CaptionRequest & { userId?: string };
        const { reviewId, platform, language, includeHashtags, includeCTA, userId } = body;

        if (!reviewId || typeof reviewId !== 'string') {
            return NextResponse.json({ error: 'reviewId is required' }, { status: 400 });
        }

        if (!platform || !Object.values(PostPlatform).includes(platform as PostPlatform)) {
            return NextResponse.json(
                { error: `platform must be one of: ${Object.values(PostPlatform).join(', ')}` },
                { status: 400 },
            );
        }

        // Load review + business from DB
        const review = await prisma.review.findUnique({
            where: { id: reviewId },
            include: {
                business: {
                    select: { id: true, name: true, type: true, userId: true },
                },
            },
        });

        if (!review) {
            return NextResponse.json({ error: `Review ${reviewId} not found` }, { status: 404 });
        }

        // Resolve which userId to use for key routing
        const resolvedUserId = userId ?? review.business.userId;

        // Load user language preference
        const user = await prisma.user.findUnique({
            where: { id: resolvedUserId },
            select: { language: true },
        });

        // Resolve AI key via 3-layer router
        const { apiKey, mode } = await getAIKey(resolvedUserId);

        // Build context objects
        const reviewCtx = {
            id: review.id,
            authorName: review.authorName,
            rating: review.rating,
            text: review.text,
            source: review.source,
        };

        const businessCtx = {
            name: review.business.name,
            type: review.business.type,
            language: language ?? user?.language ?? 'AR',
        };

        // Generate caption
        const generator = new CaptionGenerator(apiKey);
        const result = await generator.generateCaption(reviewCtx, businessCtx, {
            platform: platform as PostPlatform,
            language: language ?? user?.language ?? 'AR',
            includeHashtags: includeHashtags ?? true,
            includeCTA: includeCTA ?? true,
        });

        return NextResponse.json({
            success: true,
            reviewId,
            platform,
            keyMode: mode,
            ...result,
        });
    } catch (err) {
        console.error('[/api/ai/generate-caption] Error:', err);
        return NextResponse.json(
            { error: 'Caption generation failed', detail: String(err) },
            { status: 500 },
        );
    }
}
