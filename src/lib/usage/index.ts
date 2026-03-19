import { prisma } from '@/lib/prisma';
import { getPlanLimits } from '@/lib/plans';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface UsageStatus {
    allowed: boolean;
    postsGenerated: number;
    postsLimit: number;
    percentUsed: number;
    isNearLimit: boolean;
    isAtLimit: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Returns the current YYYY-MM string in UTC.
 */
export function currentMonth(): string {
    const now = new Date();
    return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
}

/**
 * Check whether a user is allowed to generate another post this month.
 * Reads the post limit from their assigned Plan row; falls back to STARTER limits.
 */
export async function checkPostUsage(userId: string): Promise<UsageStatus> {
    const month = currentMonth();

    const [user, usage] = await Promise.all([
        prisma.user.findUnique({
            where: { id: userId },
            select: { currentPlan: { select: { name: true, postsLimit: true } } },
        }),
        prisma.usage.findUnique({
            where: { userId_month: { userId, month } },
            select: { postsGenerated: true },
        }),
    ]);

    const postsLimit = user?.currentPlan?.postsLimit
        ?? (await getPlanLimits(user?.currentPlan?.name ?? 'STARTER')).postsLimit;

    const postsGenerated = usage?.postsGenerated ?? 0;
    const percentUsed = postsLimit > 0 ? Math.round((postsGenerated / postsLimit) * 100) : 0;

    return {
        allowed: postsGenerated < postsLimit,
        postsGenerated,
        postsLimit,
        percentUsed,
        isNearLimit: percentUsed >= 80 && percentUsed < 100,
        isAtLimit: postsGenerated >= postsLimit,
    };
}

/**
 * Increment postsGenerated counter for the current month.
 * Uses upsert so the row is created if it doesn't exist yet.
 */
export async function incrementPostUsage(userId: string): Promise<void> {
    const month = currentMonth();
    await prisma.usage.upsert({
        where: { userId_month: { userId, month } },
        create: { userId, month, postsGenerated: 1 },
        update: { postsGenerated: { increment: 1 } },
    });
}

/**
 * Increment postsPublished counter.
 */
export async function incrementPublishUsage(userId: string): Promise<void> {
    const month = currentMonth();
    await prisma.usage.upsert({
        where: { userId_month: { userId, month } },
        create: { userId, month, postsPublished: 1 },
        update: { postsPublished: { increment: 1 } },
    });
}

/**
 * Increment reviewsPulled counter.
 */
export async function incrementReviewPullUsage(userId: string, count = 1): Promise<void> {
    const month = currentMonth();
    await prisma.usage.upsert({
        where: { userId_month: { userId, month } },
        create: { userId, month, reviewsPulled: count },
        update: { reviewsPulled: { increment: count } },
    });
}
