import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import type { Session } from 'next-auth';

// Re-export for convenience
export { auth as getServerSession };

/**
 * Use in Server Components / Route Handlers.
 * Returns the session or throws a 401 NextResponse.
 */
export async function requireAuth(): Promise<Session> {
    const session = await auth();
    if (!session?.user?.userId) {
        throw NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return session;
}

/**
 * Returns the full User record from DB including their businesses.
 * Returns null if not authenticated.
 */
export async function getCurrentUser() {
    const session = await auth();
    if (!session?.user?.userId) return null;

    return prisma.user.findUnique({
        where: { id: session.user.userId },
        include: {
            businesses: {
                orderBy: { createdAt: 'desc' },
            },
        },
    });
}
