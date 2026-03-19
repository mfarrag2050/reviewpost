import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { isValidUrl, isValidHexColor, sanitizeInput } from '@/lib/security';
import type { OnboardingPayload } from '@/lib/onboarding/types';

/**
 * POST /api/onboarding
 * Saves onboarding step progress to the database.
 *
 * Step 1: saves nothing (Google OAuth is handled separately)
 * Step 2: creates/updates Business record with brand data
 * Step 3: saves selectedTemplate to Business.brandColors (as JSON field)
 * Step 4: marks user as onboarded, optionally enables auto-post schedule
 */
export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.userId;

    try {
        const body = await req.json() as OnboardingPayload;
        const { step, data, businessId } = body;

        if (businessId) {
            const ownerCheck = await prisma.business.findFirst({
                where: { id: businessId, userId },
                select: { id: true },
            });
            if (!ownerCheck) {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }
        }

        switch (step) {
            // ── Step 2: Create/update Business with brand info
            case 2: {
                if (!data.businessName || typeof data.businessName !== 'string') {
                    return NextResponse.json({ error: 'businessName is required' }, { status: 400 });
                }

                const businessName = sanitizeInput(data.businessName.trim());
                if (businessName.length > 200) {
                    return NextResponse.json({ error: 'businessName must be 200 characters or fewer' }, { status: 400 });
                }

                // التحقق من صلاحية logoUrl
                const logoUrl = data.logoUrl ?? '';
                if (logoUrl && !isValidUrl(logoUrl, true)) {
                    return NextResponse.json({ error: 'logoUrl must be a valid HTTP(S) URL or data:image' }, { status: 400 });
                }

                // التحقق من صلاحية الألوان
                const primaryColor = data.primaryColor ?? '#7C3AED';
                const secondaryColor = data.secondaryColor ?? '#4F46E5';
                if (!isValidHexColor(primaryColor) || !isValidHexColor(secondaryColor)) {
                    return NextResponse.json({ error: 'Colors must be valid hex format (#RRGGBB)' }, { status: 400 });
                }

                const brandColors = {
                    primary: primaryColor,
                    secondary: secondaryColor,
                    selectedTemplate: data.selectedTemplate,
                };

                let business;
                if (businessId) {
                    business = await prisma.business.update({
                        where: { id: businessId },
                        data: {
                            name: businessName,
                            type: (data.businessType as never) ?? 'OTHER',
                            logoUrl,
                            brandColors,
                        },
                    });
                } else {
                    business = await prisma.business.create({
                        data: {
                            userId,
                            name: businessName,
                            type: (data.businessType as never) ?? 'OTHER',
                            logoUrl,
                            brandColors,
                            platform: 'GOOGLE',
                        },
                    });
                }

                return NextResponse.json({ success: true, businessId: business.id });
            }

            // ── Step 3: Save template selection into Business brandColors JSON
            case 3: {
                if (!businessId) {
                    return NextResponse.json({ error: 'businessId required for step 3' }, { status: 400 });
                }

                const existing = await prisma.business.findUnique({
                    where: { id: businessId },
                    select: { brandColors: true },
                });

                const updatedColors = {
                    ...(existing?.brandColors as Record<string, unknown> ?? {}),
                    selectedTemplate: data.selectedTemplate ?? 'classic',
                };

                await prisma.business.update({
                    where: { id: businessId },
                    data: { brandColors: updatedColors },
                });

                return NextResponse.json({ success: true });
            }

            // ── Step 4: Mark onboarding complete
            case 4: {
                if (!businessId) {
                    return NextResponse.json({ error: 'businessId required for step 4' }, { status: 400 });
                }

                // Store activation settings in brandColors for now
                const existing = await prisma.business.findUnique({
                    where: { id: businessId },
                    select: { brandColors: true },
                });

                const updatedColors = {
                    ...(existing?.brandColors as Record<string, unknown> ?? {}),
                    autoPostEnabled: data.autoPostEnabled ?? false,
                    postFrequency: data.postFrequency ?? 3,
                    onboardedAt: new Date().toISOString(),
                };

                await prisma.business.update({
                    where: { id: businessId },
                    data: { brandColors: updatedColors },
                });

                return NextResponse.json({ success: true });
            }

            default:
                return NextResponse.json({ error: `Unknown step: ${step}` }, { status: 400 });
        }
    } catch (err) {
        console.error('[/api/onboarding] Error:', err);
        return NextResponse.json({ error: 'Onboarding save failed' }, { status: 500 });
    }
}

/**
 * GET /api/onboarding
 * Returns the current onboarding state — i.e. whether the user already has a business.
 */
export async function GET() {
    const session = await auth();
    if (!session?.user?.userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.userId;
    const business = await prisma.business.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        select: {
            id: true,
            name: true,
            logoUrl: true,
            brandColors: true,
        },
    });

    return NextResponse.json({
        hasCompletedOnboarding: !!business,
        business,
    });
}
