import { NextRequest, NextResponse } from 'next/server';
import { GoogleReviewsService } from '@/lib/reviews/google';

const service = new GoogleReviewsService();

/**
 * POST /api/reviews/google
 * Body: { businessId: string }
 *
 * Pulls new reviews from Google Business Profile for the given business,
 * filters for rating >= 4, saves to DB, returns pull stats.
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json() as { businessId?: string };
        const { businessId } = body;

        if (!businessId || typeof businessId !== 'string') {
            return NextResponse.json(
                { error: 'businessId is required' },
                { status: 400 },
            );
        }

        const result = await service.pullNewReviews(businessId);

        return NextResponse.json({
            success: true,
            businessId: result.businessId,
            totalFound: result.totalFound,
            saved: result.saved,
            skippedDuplicate: result.skippedDuplicate,
            skippedLowRating: result.skippedLowRating,
            errors: result.errors,
        });
    } catch (err) {
        console.error('[/api/reviews/google] Error:', err);
        return NextResponse.json(
            { error: 'Internal server error', detail: String(err) },
            { status: 500 },
        );
    }
}
