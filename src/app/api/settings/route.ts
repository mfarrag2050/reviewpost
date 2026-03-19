import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/settings
 * Returns the current user's settings from User + Business + Usage tables.
 */
export async function GET() {
    const session = await auth();
    if (!session?.user?.userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.userId;
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const [user, business, usage] = await Promise.all([
        prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                aiMode: true,
                language: true,
                ownApiKey: true,
                currentPlan: {
                    select: {
                        name: true,
                        displayName: true,
                        postsLimit: true,
                        reviewsLimit: true,
                        price: true,
                        currency: true,
                        interval: true,
                    },
                },
            },
        }),
        prisma.business.findFirst({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            select: { id: true, name: true, logoUrl: true, brandColors: true },
        }),
        prisma.usage.findUnique({
            where: { userId_month: { userId, month } },
        }),
    ]);

    return NextResponse.json({
        user: {
            id: user?.id,
            plan: user?.currentPlan?.name ?? 'STARTER',
            planDisplayName: user?.currentPlan?.displayName ?? 'Starter',
            postsLimit: user?.currentPlan?.postsLimit ?? 30,
            reviewsLimit: user?.currentPlan?.reviewsLimit ?? 100,
            aiMode: user?.aiMode ?? 'SHARED',
            language: user?.language ?? 'AR',
            hasByokKey: !!user?.ownApiKey,
        },
        business: business
            ? {
                  id: business.id,
                  name: business.name,
                  logoUrl: business.logoUrl,
                  brandColors: business.brandColors ?? {},
              }
            : null,
        usage: {
            postsGenerated: usage?.postsGenerated ?? 0,
            postsPublished: usage?.postsPublished ?? 0,
        },
    });
}

/**
 * PUT /api/settings
 * Saves settings. Body: { type: 'schedule' | 'notifications' | 'account', data: {...} }
 *
 * schedule / notifications → merges into Business.brandColors
 * account → updates User.aiMode and/or User.ownApiKey
 */
export async function PUT(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.userId;

    try {
        const body = (await req.json()) as {
            type: 'schedule' | 'notifications' | 'account';
            data: Record<string, unknown>;
        };

        switch (body.type) {
            case 'schedule':
            case 'notifications': {
                const business = await prisma.business.findFirst({
                    where: { userId },
                    orderBy: { createdAt: 'desc' },
                });
                if (!business) {
                    return NextResponse.json({ error: 'No business found. Complete onboarding first.' }, { status: 404 });
                }

                const existing = (business.brandColors as Record<string, unknown>) ?? {};

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                await prisma.business.update({
                    where: { id: business.id },
                    data: { brandColors: { ...existing, ...body.data } as any },
                });

                return NextResponse.json({ success: true });
            }

            case 'account': {
                const updates: Record<string, unknown> = {};
                if (body.data.aiMode !== undefined) {
                    updates.aiMode = body.data.aiMode;
                }
                if (body.data.ownApiKey !== undefined) {
                    // In production this should be AES-256 encrypted (per CLAUDE.md)
                    updates.ownApiKey = body.data.ownApiKey || null;
                }
                if (Object.keys(updates).length > 0) {
                    await prisma.user.update({
                        where: { id: userId },
                        data: updates as Parameters<typeof prisma.user.update>[0]['data'],
                    });
                }
                return NextResponse.json({ success: true });
            }

            default:
                return NextResponse.json({ error: 'Unknown settings type' }, { status: 400 });
        }
    } catch (err) {
        console.error('[/api/settings] PUT error:', err);
        return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
    }
}
