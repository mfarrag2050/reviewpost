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
        if (body.key !== undefined) updateData.key = body.key;
        if (body.content !== undefined) updateData.content = body.content;
        if (body.isActive !== undefined) updateData.isActive = body.isActive;

        const prompt = await prisma.prompt.update({
            where: { id: params.id },
            data: updateData,
        });

        return NextResponse.json(prompt);
    } catch (err) {
        console.error('[admin/prompts/[id] PATCH]', err);
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
        await prisma.prompt.delete({ where: { id: params.id } });
        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('[admin/prompts/[id] DELETE]', err);
        return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
    }
}
