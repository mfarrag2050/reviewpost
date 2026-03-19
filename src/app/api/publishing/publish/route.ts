import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { PublishingService } from '@/lib/publishing';
import { wrapApiHandler } from '@/lib/monitoring/error-handler';
import { createLogger } from '@/lib/monitoring/logger';

const service = new PublishingService();
const log = createLogger('Publishing');

/**
 * POST /api/publishing/publish
 * Body: { postId: string }
 */
export const POST = wrapApiHandler('/api/publishing/publish', async (req: NextRequest) => {
    const session = await auth();
    if (!session?.user?.userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json() as { postId?: string };
    const { postId } = body;

    if (!postId || typeof postId !== 'string') {
        return NextResponse.json({ error: 'postId is required' }, { status: 400 });
    }

    const post = await prisma.post.findUnique({
        where: { id: postId },
        select: { review: { select: { business: { select: { userId: true } } } } },
    });
    if (!post || post.review.business.userId !== session.user.userId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const result = await service.publish(postId);

    if (result.success) {
        log.info('Post published', { postId, platform: result.platform });
    } else {
        log.warn('Post publish failed', { postId, error: result.error });
    }

    return NextResponse.json({
        success: result.success,
        postId,
        platform: result.platform,
        status: result.status,
        externalPostId: result.externalPostId,
        publishedAt: result.publishedAt?.toISOString(),
        error: result.error,
    });
});
