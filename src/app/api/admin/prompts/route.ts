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
        const prompts = await prisma.prompt.findMany({
            orderBy: { createdAt: 'asc' },
        });

        return NextResponse.json({
            prompts: prompts.map((p) => ({
                ...p,
                createdAt: p.createdAt.toISOString(),
                updatedAt: p.updatedAt.toISOString(),
            })),
        });
    } catch (err) {
        console.error('[admin/prompts GET]', err);
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
        const body = await req.json() as { key: string; name: string; content: string; isActive?: boolean };

        if (!body.key || !body.name || !body.content) {
            return NextResponse.json({ error: 'key, name, and content are required' }, { status: 400 });
        }

        const prompt = await prisma.prompt.create({
            data: {
                key: body.key,
                name: body.name,
                content: body.content,
                isActive: body.isActive ?? true,
            },
        });

        return NextResponse.json(prompt, { status: 201 });
    } catch (err: unknown) {
        const e = err as { code?: string };
        if (e.code === 'P2002') {
            return NextResponse.json({ error: 'A prompt with this key already exists' }, { status: 409 });
        }
        console.error('[admin/prompts POST]', err);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
