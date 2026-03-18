import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

/**
 * PUT /api/settings/brand
 * Updates the brand kit for the user's primary business.
 * Accepts: { businessName?, logoUrl?, primaryColor?, secondaryColor?, selectedTemplate? }
 */
export async function PUT(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.userId;

    try {
        const body = (await req.json()) as {
            businessName?: string;
            logoUrl?: string;
            primaryColor?: string;
            secondaryColor?: string;
            selectedTemplate?: string;
        };

        const business = await prisma.business.findFirst({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });

        if (!business) {
            return NextResponse.json(
                { error: 'No business found. Complete onboarding first.' },
                { status: 404 },
            );
        }

        const existing = (business.brandColors as Record<string, unknown>) ?? {};

        // Merge color/template fields into brandColors JSON
        const updatedColors: Record<string, unknown> = { ...existing };
        if (body.primaryColor !== undefined) updatedColors.primary = body.primaryColor;
        if (body.secondaryColor !== undefined) updatedColors.secondary = body.secondaryColor;
        if (body.selectedTemplate !== undefined) updatedColors.selectedTemplate = body.selectedTemplate;

        // Build business update payload
        const businessUpdate: Record<string, unknown> = { brandColors: updatedColors };
        if (body.businessName !== undefined && body.businessName.trim()) {
            businessUpdate.name = body.businessName.trim();
        }
        if (body.logoUrl !== undefined) {
            businessUpdate.logoUrl = body.logoUrl;
        }

        await prisma.business.update({
            where: { id: business.id },
            data: businessUpdate as Parameters<typeof prisma.business.update>[0]['data'],
        });

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('[/api/settings/brand] PUT error:', err);
        return NextResponse.json({ error: 'Failed to save brand settings' }, { status: 500 });
    }
}
