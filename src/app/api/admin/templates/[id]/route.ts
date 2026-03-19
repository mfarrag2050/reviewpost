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
        if (body.htmlContent !== undefined) updateData.htmlContent = body.htmlContent;
        if (body.thumbnailUrl !== undefined) updateData.thumbnailUrl = body.thumbnailUrl;
        if (body.category !== undefined) updateData.category = body.category;
        if (body.isRtl !== undefined) updateData.isRtl = body.isRtl;
        if (body.isActive !== undefined) updateData.isActive = body.isActive;
        if (body.isDefault !== undefined) updateData.isDefault = body.isDefault;

        const template = await prisma.$transaction(async (tx) => {
            // If setting as default, clear other defaults first
            if (body.isDefault === true) {
                await tx.template.updateMany({
                    where: { id: { not: params.id } },
                    data: { isDefault: false },
                });
            }
            return tx.template.update({
                where: { id: params.id },
                data: updateData,
            });
        });

        return NextResponse.json(template);
    } catch (err) {
        console.error('[admin/templates/[id] PATCH]', err);
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
        await prisma.template.delete({ where: { id: params.id } });
        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('[admin/templates/[id] DELETE]', err);
        return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
    }
}
