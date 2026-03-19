export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
    try {
        await requireAdmin();
    } catch (err) {
        return err as NextResponse;
    }

    const currentMonth = (() => {
        const n = new Date();
        return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}`;
    })();

    try {
        const user = await prisma.user.findUnique({
            where: { id: params.id },
            include: {
                currentPlan: { select: { id: true, name: true, displayName: true, postsLimit: true } },
                businesses: {
                    orderBy: { createdAt: 'desc' },
                    select: { id: true, name: true, platform: true, createdAt: true },
                },
                usages: {
                    orderBy: { month: 'desc' },
                    take: 12,
                    select: { month: true, postsGenerated: true, postsPublished: true, reviewsPulled: true },
                },
            },
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const recentPosts = await prisma.post.findMany({
            where: { business: { userId: params.id } },
            orderBy: { createdAt: 'desc' },
            take: 10,
            select: { id: true, caption: true, platform: true, status: true, createdAt: true },
        });

        const currentUsage = user.usages.find((u) => u.month === currentMonth);

        return NextResponse.json({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            isActive: user.isActive,
            planId: user.planId,
            planName: user.currentPlan?.name ?? null,
            aiMode: user.aiMode,
            language: user.language,
            createdAt: user.createdAt.toISOString(),
            suspendedAt: user.suspendedAt?.toISOString() ?? null,
            businesses: user.businesses.map((b) => ({
                id: b.id,
                name: b.name,
                platform: b.platform,
                createdAt: b.createdAt.toISOString(),
            })),
            usages: user.usages,
            recentPosts: recentPosts.map((p) => ({
                id: p.id,
                caption: p.caption,
                platform: p.platform,
                status: p.status,
                createdAt: p.createdAt.toISOString(),
            })),
            postsUsed: currentUsage?.postsGenerated ?? 0,
            postsLimit: user.currentPlan?.postsLimit ?? 0,
        });
    } catch (err) {
        console.error('[admin/users/[id] GET]', err);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        await requireAdmin();
    } catch (err) {
        return err as NextResponse;
    }

    try {
        const body = await req.json() as Record<string, unknown>;
        const { isActive, planId, role } = body as { isActive?: boolean; planId?: string | null; role?: string };

        const updateData: Record<string, unknown> = {};

        if (typeof isActive === 'boolean') {
            updateData.isActive = isActive;
            updateData.suspendedAt = isActive ? null : new Date();
        }
        if ('planId' in body) {
            updateData.planId = planId ?? null;
        }
        if (role) {
            updateData.role = role;
        }

        const user = await prisma.user.update({
            where: { id: params.id },
            data: updateData,
            select: { id: true, isActive: true, planId: true, role: true },
        });

        return NextResponse.json(user);
    } catch (err) {
        console.error('[admin/users/[id] PATCH]', err);
        return NextResponse.json({ error: 'Update failed' }, { status: 500 });
    }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
    try {
        await requireAdmin();
    } catch (err) {
        return err as NextResponse;
    }

    try {
        await prisma.user.delete({ where: { id: params.id } });
        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('[admin/users/[id] DELETE]', err);
        return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
    }
}
