import { prisma } from '@/lib/prisma';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PlanRecord {
    id: string;
    name: string;
    displayName: string;
    price: number;
    currency: string;
    interval: string;
    postsLimit: number;
    reviewsLimit: number;
    storageLimit: number;
    platformsAllowed: string[];
    templatesLimit: number;
    features: string[];
    sortOrder: number;
}

// ─── Fallback limits (used when DB is unavailable or user has no plan) ────────

export const FALLBACK_LIMITS: Record<string, { postsLimit: number; reviewsLimit: number; templatesLimit: number }> = {
    STARTER: { postsLimit: 30, reviewsLimit: 100, templatesLimit: 2 },
    GROWTH: { postsLimit: 150, reviewsLimit: 500, templatesLimit: 3 },
    AGENCY: { postsLimit: 500, reviewsLimit: 2000, templatesLimit: 10 },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Fetch all active plans for a given currency, both MONTHLY and YEARLY.
 */
export async function getPlansForCurrency(currency = 'USD'): Promise<PlanRecord[]> {
    const plans = await prisma.plan.findMany({
        where: { isActive: true, currency: currency.toUpperCase() },
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

    return plans.map((p) => ({
        ...p,
        price: Number(p.price),
        storageLimit: Number(p.storageLimit),
        platformsAllowed: p.platformsAllowed as string[],
        features: p.features as string[],
    }));
}

/**
 * Get limits for a specific plan tier by name.
 * Looks up DB first; falls back to hardcoded values if DB record not found.
 */
export async function getPlanLimits(
    planName: string,
    currency = 'USD',
    interval = 'MONTHLY',
): Promise<{ postsLimit: number; reviewsLimit: number; templatesLimit: number; storageLimit: number }> {
    const tier = planName.toUpperCase();

    try {
        const plan = await prisma.plan.findUnique({
            where: { name_currency_interval: { name: tier, currency: currency.toUpperCase(), interval: interval.toUpperCase() } },
            select: { postsLimit: true, reviewsLimit: true, templatesLimit: true, storageLimit: true },
        });

        if (plan) {
            return {
                postsLimit: plan.postsLimit,
                reviewsLimit: plan.reviewsLimit,
                templatesLimit: plan.templatesLimit,
                storageLimit: Number(plan.storageLimit),
            };
        }
    } catch {
        // fall through to defaults
    }

    const fallback = FALLBACK_LIMITS[tier] ?? FALLBACK_LIMITS.STARTER;
    return { ...fallback, storageLimit: 1024 * 1024 * 1024 };
}

/**
 * Get a user's plan name from their planId, with a fallback.
 */
export async function getUserPlanName(userId: string): Promise<string> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { currentPlan: { select: { name: true } } },
    });
    return user?.currentPlan?.name ?? 'STARTER';
}
