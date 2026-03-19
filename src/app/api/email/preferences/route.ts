export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

interface EmailPreferences {
    emailEnabled: boolean;
    weeklyReport: boolean;
    usageAlert80: boolean;
    usageLimit100: boolean;
    postPublished: boolean;
}

const DEFAULT_PREFS: EmailPreferences = {
    emailEnabled: true,
    weeklyReport: true,
    usageAlert80: true,
    usageLimit100: true,
    postPublished: false,
};

/**
 * GET /api/email/preferences
 * Returns the user's email notification preferences.
 */
export async function GET() {
    const session = await auth();
    if (!session?.user?.userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const business = await prisma.business.findFirst({
            where: { userId: session.user.userId },
            select: { brandColors: true },
            orderBy: { createdAt: 'desc' },
        });

        const stored = (business?.brandColors as Record<string, unknown>)?.notifications as Partial<EmailPreferences> | undefined;

        const prefs: EmailPreferences = {
            emailEnabled: stored?.emailEnabled ?? DEFAULT_PREFS.emailEnabled,
            weeklyReport: stored?.weeklyReport ?? DEFAULT_PREFS.weeklyReport,
            usageAlert80: stored?.usageAlert80 ?? DEFAULT_PREFS.usageAlert80,
            usageLimit100: stored?.usageLimit100 ?? DEFAULT_PREFS.usageLimit100,
            postPublished: stored?.postPublished ?? DEFAULT_PREFS.postPublished,
        };

        return NextResponse.json({ preferences: prefs });
    } catch (err) {
        console.error('[api/email/preferences] GET error:', err);
        return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 });
    }
}

/**
 * PUT /api/email/preferences
 * Updates the user's email notification preferences.
 *
 * Body: Partial<EmailPreferences>
 */
export async function PUT(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json() as Partial<EmailPreferences>;

        const business = await prisma.business.findFirst({
            where: { userId: session.user.userId },
            orderBy: { createdAt: 'desc' },
        });

        if (!business) {
            return NextResponse.json(
                { error: 'No business found. Complete onboarding first.' },
                { status: 404 },
            );
        }

        const existing = (business.brandColors as Record<string, unknown>) ?? {};
        const currentNotifs = (existing.notifications as Record<string, unknown>) ?? {};

        const validKeys: (keyof EmailPreferences)[] = [
            'emailEnabled', 'weeklyReport', 'usageAlert80', 'usageLimit100', 'postPublished',
        ];
        const updated: Record<string, unknown> = { ...currentNotifs };
        for (const key of validKeys) {
            if (body[key] !== undefined) {
                updated[key] = body[key];
            }
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await prisma.business.update({
            where: { id: business.id },
            data: { brandColors: { ...existing, notifications: updated } as any },
        });

        return NextResponse.json({ success: true, preferences: updated });
    } catch (err) {
        console.error('[api/email/preferences] PUT error:', err);
        return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 });
    }
}
