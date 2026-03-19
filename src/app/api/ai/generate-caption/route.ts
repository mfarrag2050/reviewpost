import { NextRequest, NextResponse } from 'next/server';
import { PostPlatform } from '@/generated/prisma';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { getAIKey } from '@/lib/ai/key-router';
import { CaptionGenerator } from '@/lib/ai/caption-generator';
import { CaptionRequest } from '@/lib/ai/types';
import { wrapApiHandler } from '@/lib/monitoring/error-handler';
import { createLogger } from '@/lib/monitoring/logger';

const log = createLogger('CaptionGenerator');

/**
 * POST /api/ai/generate-caption
 * Body: { reviewId, platform, language?, includeHashtags?, includeCTA? }
 */
export const POST = wrapApiHandler('/api/ai/generate-caption', async (req: NextRequest) => {
    const session = await auth();
    if (!session?.user?.userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json() as CaptionRequest;
    const { reviewId, platform, language, includeHashtags, includeCTA } = body;

    if (!reviewId || typeof reviewId !== 'string') {
        return NextResponse.json({ error: 'reviewId is required' }, { status: 400 });
    }

    if (!platform || !Object.values(PostPlatform).includes(platform as PostPlatform)) {
        return NextResponse.json(
            { error: `platform must be one of: ${Object.values(PostPlatform).join(', ')}` },
            { status: 400 },
        );
    }

    const review = await prisma.review.findUnique({
        where: { id: reviewId },
        include: {
            business: { select: { id: true, name: true, type: true, userId: true } },
        },
    });

    if (!review) {
        return NextResponse.json({ error: `Review ${reviewId} not found` }, { status: 404 });
    }

    if (review.business.userId !== session.user.userId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const resolvedUserId = review.business.userId;

    const user = await prisma.user.findUnique({
        where: { id: resolvedUserId },
        select: { language: true },
    });

    const { apiKey, mode } = await getAIKey(resolvedUserId);

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

    const generator = new CaptionGenerator(apiKey);
    const result = await generator.generateCaption(reviewCtx, businessCtx, {
        platform: platform as PostPlatform,
        language: language ?? user?.language ?? 'AR',
        includeHashtags: includeHashtags ?? true,
        includeCTA: includeCTA ?? true,
    });

    log.info('Caption generated', {
        reviewId,
        platform,
        keyMode: mode,
        tokensUsed: result.tokensUsed,
    });

    return NextResponse.json({
        success: true,
        reviewId,
        platform,
        keyMode: mode,
        ...result,
    });
});
