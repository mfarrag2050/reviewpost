import { NextRequest, NextResponse } from 'next/server';
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
    const body = await req.json() as { postId?: string };
    const { postId } = body;

    if (!postId || typeof postId !== 'string') {
        return NextResponse.json({ error: 'postId is required' }, { status: 400 });
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
