import { NextRequest, NextResponse } from 'next/server';
import { PublishingService } from '@/lib/publishing';

const service = new PublishingService();

/**
 * POST /api/publishing/publish
 * Body: { postId: string }
 *
 * يحمّل البوست من DB مع بيانات الـ review و business،
 * يجلب الـ OAuth token، ينشر على المنصة، ويحدّث حالة البوست.
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json() as { postId?: string };
        const { postId } = body;

        if (!postId || typeof postId !== 'string') {
            return NextResponse.json(
                { error: 'postId is required' },
                { status: 400 },
            );
        }

        const result = await service.publish(postId);

        return NextResponse.json({
            success: result.success,
            postId,
            platform: result.platform,
            status: result.status,
            externalPostId: result.externalPostId,
            publishedAt: result.publishedAt?.toISOString(),
            error: result.error,
        });
    } catch (err) {
        console.error('[/api/publishing/publish] Error:', err);
        return NextResponse.json(
            { error: 'Internal server error', detail: String(err) },
            { status: 500 },
        );
    }
}
