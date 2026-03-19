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
        const templates = await prisma.template.findMany({
            orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
            select: {
                id: true,
                name: true,
                htmlContent: true,
                thumbnailUrl: true,
                category: true,
                isRtl: true,
                isActive: true,
                isDefault: true,
                createdAt: true,
            },
        });

        return NextResponse.json({
            templates: templates.map((t) => ({
                ...t,
                createdAt: t.createdAt.toISOString(),
            })),
        });
    } catch (err) {
        console.error('[admin/templates GET]', err);
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
            htmlContent: string;
            thumbnailUrl?: string | null;
            category: string;
            isRtl?: boolean;
            isActive?: boolean;
            isDefault?: boolean;
        };

        if (!body.name || !body.htmlContent) {
            return NextResponse.json({ error: 'Name and htmlContent are required' }, { status: 400 });
        }

        const template = await prisma.$transaction(async (tx) => {
            // If setting as default, clear other defaults
            if (body.isDefault) {
                await tx.template.updateMany({ data: { isDefault: false } });
            }
            return tx.template.create({
                data: {
                    name: body.name,
                    htmlContent: body.htmlContent,
                    thumbnailUrl: body.thumbnailUrl ?? null,
                    category: body.category as 'REVIEW' | 'PRODUCT' | 'CAROUSEL' | 'STORY',
                    isRtl: body.isRtl ?? false,
                    isActive: body.isActive ?? true,
                    isDefault: body.isDefault ?? false,
                },
            });
        });

        return NextResponse.json(template, { status: 201 });
    } catch (err) {
        console.error('[admin/templates POST]', err);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
