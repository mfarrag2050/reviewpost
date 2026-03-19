export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export async function GET() {
    try {
        await requireAdmin();
    } catch (err) {
        return err as NextResponse;
    }

    try {
        const plans = await prisma.plan.findMany({
            include: { _count: { select: { users: true } } },
            orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        });

        return NextResponse.json({
            plans: plans.map((p) => ({
                id: p.id,
                name: p.name,
                displayName: p.displayName,
                price: p.price.toString(),
                currency: p.currency,
                interval: p.interval,
                postsLimit: p.postsLimit,
                reviewsLimit: p.reviewsLimit,
                templatesLimit: p.templatesLimit,
                platformsAllowed: p.platformsAllowed as string[],
                features: p.features,
                isActive: p.isActive,
                sortOrder: p.sortOrder,
                userCount: p._count.users,
            })),
        });
    } catch (err) {
        console.error('[admin/plans GET]', err);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        await requireAdmin();
    } catch (err) {
        return err as NextResponse;
    }

    try {
        const body = await req.json() as {
            name: string;
            displayName: string;
            price: string;
            currency: string;
            interval: string;
            postsLimit: number;
            reviewsLimit: number;
            templatesLimit: number;
            platformsAllowed: string[];
            features: Record<string, boolean>;
            isActive: boolean;
            sortOrder: number;
        };

        if (!body.name || !body.displayName) {
            return NextResponse.json({ error: 'Name and displayName are required' }, { status: 400 });
        }

        const plan = await prisma.plan.create({
            data: {
                name: body.name,
                displayName: body.displayName,
                price: Number(body.price),
                currency: body.currency ?? 'USD',
                interval: body.interval ?? 'MONTHLY',
                postsLimit: body.postsLimit ?? 30,
                reviewsLimit: body.reviewsLimit ?? 100,
                storageLimit: BigInt(1073741824),
                templatesLimit: body.templatesLimit ?? 3,
                platformsAllowed: body.platformsAllowed ?? ['INSTAGRAM'],
                features: body.features ?? {},
                isActive: body.isActive ?? true,
                sortOrder: body.sortOrder ?? 0,
            },
        });

        return NextResponse.json(plan, { status: 201 });
    } catch (err: unknown) {
        const e = err as { code?: string };
        if (e.code === 'P2002') {
            return NextResponse.json({ error: 'A plan with this name/currency/interval already exists' }, { status: 409 });
        }
        console.error('[admin/plans POST]', err);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
