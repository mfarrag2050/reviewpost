import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/plans?currency=USD&interval=MONTHLY
 *
 * Returns all active plans filtered by currency (default: USD).
 * Optional interval filter (default: returns both MONTHLY and YEARLY).
 */
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const currency = (searchParams.get('currency') ?? 'USD').toUpperCase();
    const interval = searchParams.get('interval')?.toUpperCase();

    const where: Record<string, unknown> = { isActive: true, currency };
    if (interval) where.interval = interval;

    const plans = await prisma.plan.findMany({
        where,
        orderBy: [{ sortOrder: 'asc' }, { interval: 'asc' }],
        select: {
            id: true,
            name: true,
            displayName: true,
            price: true,
            currency: true,
            interval: true,
            postsLimit: true,
            reviewsLimit: true,
            storageLimit: true,
            platformsAllowed: true,
            templatesLimit: true,
            features: true,
            sortOrder: true,
        },
    });

    // Convert Decimal and BigInt to serializable types
    const serialized = plans.map((p) => ({
        ...p,
        price: Number(p.price),
        storageLimit: Number(p.storageLimit),
    }));

    return NextResponse.json({ plans: serialized });
}
