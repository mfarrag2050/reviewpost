import { NextRequest, NextResponse } from 'next/server';
import { GoogleReviewsService } from '@/lib/reviews/google';
import { wrapApiHandler } from '@/lib/monitoring/error-handler';
import { createLogger } from '@/lib/monitoring/logger';

const service = new GoogleReviewsService();
const log = createLogger('ReviewsPull');

/**
 * POST /api/reviews/google
 * Body: { businessId: string }
 */
export const POST = wrapApiHandler('/api/reviews/google', async (req: NextRequest) => {
    const body = await req.json() as { businessId?: string };
    const { businessId } = body;

    if (!businessId || typeof businessId !== 'string') {
        return NextResponse.json({ error: 'businessId is required' }, { status: 400 });
    }

    const result = await service.pullNewReviews(businessId);

    log.info('Reviews pulled', {
        businessId,
        totalFound: result.totalFound,
        saved: result.saved,
    });

    if (result.errors.length > 0) {
        log.warn('Review pull had errors', { businessId, errors: result.errors });
    }

    return NextResponse.json({
        success: true,
        businessId: result.businessId,
        totalFound: result.totalFound,
        saved: result.saved,
        skippedDuplicate: result.skippedDuplicate,
        skippedLowRating: result.skippedLowRating,
        errors: result.errors,
    });
});
