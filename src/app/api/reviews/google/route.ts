import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
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
    const session = await auth();
    if (!session?.user?.userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json() as { businessId?: string };
    const { businessId } = body;

    if (!businessId || typeof businessId !== 'string') {
        return NextResponse.json({ error: 'businessId is required' }, { status: 400 });
    }

    const ownerCheck = await prisma.business.findFirst({
        where: { id: businessId, userId: session.user.userId },
        select: { id: true },
    });
    if (!ownerCheck) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
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
