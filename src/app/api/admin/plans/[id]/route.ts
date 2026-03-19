export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        await requireAdmin();
    } catch (err) {
        return err as NextResponse;
    }

    try {
        const body = await req.json() as Record<string, unknown>;
        const updateData: Record<string, unknown> = {};

        if (body.name !== undefined) updateData.name = body.name;
        if (body.displayName !== undefined) updateData.displayName = body.displayName;
        if (body.price !== undefined) updateData.price = Number(body.price);
        if (body.currency !== undefined) updateData.currency = body.currency;
        if (body.interval !== undefined) updateData.interval = body.interval;
        if (body.postsLimit !== undefined) updateData.postsLimit = Number(body.postsLimit);
        if (body.reviewsLimit !== undefined) updateData.reviewsLimit = Number(body.reviewsLimit);
        if (body.templatesLimit !== undefined) updateData.templatesLimit = Number(body.templatesLimit);
        if (body.platformsAllowed !== undefined) updateData.platformsAllowed = body.platformsAllowed;
        if (body.features !== undefined) updateData.features = body.features;
        if (body.isActive !== undefined) updateData.isActive = body.isActive;
        if (body.sortOrder !== undefined) updateData.sortOrder = Number(body.sortOrder);

        const plan = await prisma.plan.update({
            where: { id: params.id },
            data: updateData,
        });

        return NextResponse.json(plan);
    } catch (err) {
        console.error('[admin/plans/[id] PATCH]', err);
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
        await prisma.plan.delete({ where: { id: params.id } });
        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('[admin/plans/[id] DELETE]', err);
        return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
    }
}
