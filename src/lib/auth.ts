import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import type { Session } from 'next-auth';

export { auth as getServerSession };

export async function requireAuth(): Promise<Session> {
    const session = await auth();
    if (!session?.user?.userId) {
        throw NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return session;
}

export async function requireAdmin(): Promise<Session> {
    const session = await auth();
    if (!session?.user?.userId) {
        throw NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (session.user.role !== 'ADMIN') {
        throw NextResponse.json({ error: 'Forbidden' }, { status: 403 });
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
