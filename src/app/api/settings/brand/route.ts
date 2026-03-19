import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { isValidUrl, isValidHexColor, sanitizeInput } from '@/lib/security';

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

        // Validate colors
        if (body.primaryColor !== undefined && !isValidHexColor(body.primaryColor)) {
            return NextResponse.json({ error: 'primaryColor must be valid hex (#RRGGBB)' }, { status: 400 });
        }
        if (body.secondaryColor !== undefined && !isValidHexColor(body.secondaryColor)) {
            return NextResponse.json({ error: 'secondaryColor must be valid hex (#RRGGBB)' }, { status: 400 });
        }

        // Build business update payload
        const businessUpdate: Record<string, unknown> = { brandColors: updatedColors };
        if (body.businessName !== undefined && body.businessName.trim()) {
            const name = sanitizeInput(body.businessName.trim());
            if (name.length > 200) {
                return NextResponse.json({ error: 'businessName must be 200 characters or fewer' }, { status: 400 });
            }
            businessUpdate.name = name;
        }
        if (body.logoUrl !== undefined) {
            if (body.logoUrl && !isValidUrl(body.logoUrl, true)) {
                return NextResponse.json({ error: 'logoUrl must be a valid HTTP(S) URL or data:image' }, { status: 400 });
            }
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
