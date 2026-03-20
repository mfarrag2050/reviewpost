import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { SallaSync } from '@/lib/salla/sync';
import { wrapApiHandler } from '@/lib/monitoring/error-handler';
import { createLogger } from '@/lib/monitoring/logger';

const sallaSync = new SallaSync();
const log = createLogger('SallaReviews');

/**
 * GET /api/salla/reviews?storeId=xxx
 * Manually triggers a full review sync for a Salla store.
 */
export const GET = wrapApiHandler('/api/salla/reviews', async (req: NextRequest) => {
    const session = await auth();
    if (!session?.user?.userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const storeId = req.nextUrl.searchParams.get('storeId');
    if (!storeId) {
        return NextResponse.json({ error: 'storeId query parameter is required' }, { status: 400 });
    }

    const ownerCheck = await prisma.sallaStore.findFirst({
        where: { id: storeId, userId: session.user.userId },
        select: { id: true },
    });
    if (!ownerCheck) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const result = await sallaSync.syncReviews(storeId);

    log.info('Manual sync triggered', {
        storeId,
        totalFound: result.totalFound,
        saved: result.saved,
    });

    return NextResponse.json({
        success: true,
        ...result,
    });
});
