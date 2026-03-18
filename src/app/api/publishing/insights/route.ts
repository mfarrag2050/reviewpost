import { NextRequest, NextResponse } from 'next/server';
import { PublishingService } from '@/lib/publishing';

const service = new PublishingService();

/**
 * POST /api/publishing/insights
 * Body: { postId: string }
 *
 * يجلب بيانات التفاعل من المنصة ويحدّث engagement_data بالـ DB.
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

        const insights = await service.pullInsights(postId);

        return NextResponse.json({
            success: true,
            postId,
            insights,
        });
    } catch (err) {
        console.error('[/api/publishing/insights] Error:', err);

        const message = err instanceof Error ? err.message : String(err);
        const status = message.includes('not found') ? 404
            : message.includes('not published') ? 400
                : 500;

        return NextResponse.json(
            { error: message },
            { status },
        );
    }
}
