export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { emailService, type EmailType } from '@/lib/email/resend';
import { timingSafeEqual } from '@/lib/security';

/**
 * POST /api/email/send
 *
 * Internal endpoint for N8N and other services to trigger email sends.
 * Protected by API key (not user auth) with timing-safe comparison.
 *
 * Headers:
 *   x-api-key: INTERNAL_API_KEY
 *
 * Body:
 *   { type: EmailType, userId: string, data?: Record<string, unknown> }
 */
export async function POST(req: NextRequest) {
    const apiKey = req.headers.get('x-api-key');
    const expectedKey = process.env.INTERNAL_API_KEY;

    if (!expectedKey || !apiKey || !timingSafeEqual(apiKey, expectedKey)) {
        return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
    }

    try {
        const body = await req.json() as {
            type: EmailType;
            userId: string;
            data?: Record<string, unknown>;
        };

        if (!body.type || !body.userId) {
            return NextResponse.json(
                { error: 'type and userId are required' },
                { status: 400 },
            );
        }

        const user = await prisma.user.findUnique({
            where: { id: body.userId },
            select: {
                id: true,
                email: true,
                name: true,
                language: true,
                currentPlan: { select: { name: true, displayName: true, postsLimit: true } },
            },
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const userPayload = {
            id: user.id,
            email: user.email,
            name: user.name,
            language: user.language,
        };

        let result;

        switch (body.type) {
            case 'welcome':
                result = await emailService.sendWelcomeEmail(userPayload);
                break;

            case 'weekly_report': {
                const d = body.data as {
                    postsPublished?: number;
                    totalEngagement?: number;
                    topPostCaption?: string | null;
                    topPostPlatform?: string | null;
                    topPostEngagement?: number;
                    reviewsPulled?: number;
                    weekLabel?: string;
                } | undefined;
                result = await emailService.sendWeeklyReport(userPayload, {
                    postsPublished: d?.postsPublished ?? 0,
                    totalEngagement: d?.totalEngagement ?? 0,
                    topPostCaption: d?.topPostCaption ?? null,
                    topPostPlatform: d?.topPostPlatform ?? null,
                    topPostEngagement: d?.topPostEngagement ?? 0,
                    reviewsPulled: d?.reviewsPulled ?? 0,
                    weekLabel: d?.weekLabel ?? new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                });
                break;
            }

            case 'usage_alert':
            case 'usage_limit': {
                const d = body.data as {
                    percentage?: number;
                    postsUsed?: number;
                    postsLimit?: number;
                } | undefined;
                result = await emailService.sendUsageAlert(userPayload, {
                    percentage: d?.percentage ?? (body.type === 'usage_limit' ? 100 : 80),
                    postsUsed: d?.postsUsed ?? 0,
                    postsLimit: d?.postsLimit ?? user.currentPlan?.postsLimit ?? 30,
                    planName: user.currentPlan?.displayName ?? user.currentPlan?.name ?? 'Starter',
                });
                break;
            }

            case 'post_published': {
                const d = body.data as {
                    businessName?: string;
                    reviewAuthor?: string;
                    reviewRating?: number;
                    platform?: string;
                    caption?: string | null;
                    imageUrl?: string | null;
                } | undefined;
                result = await emailService.sendPostPublished(userPayload, {
                    businessName: d?.businessName ?? 'Your Business',
                    reviewAuthor: d?.reviewAuthor ?? 'Customer',
                    reviewRating: d?.reviewRating ?? 5,
                    platform: d?.platform ?? 'Instagram',
                    caption: d?.caption ?? null,
                    imageUrl: d?.imageUrl ?? null,
                });
                break;
            }

            case 'payment_failed':
                result = await emailService.sendPaymentFailed(
                    userPayload,
                    user.currentPlan?.displayName ?? user.currentPlan?.name ?? 'Plan',
                );
                break;

            case 'subscription_canceled': {
                const d = body.data as { periodEnd?: string } | undefined;
                result = await emailService.sendSubscriptionCanceled(userPayload, {
                    planName: user.currentPlan?.displayName ?? user.currentPlan?.name ?? 'Plan',
                    periodEnd: d?.periodEnd ?? new Date().toLocaleDateString(),
                });
                break;
            }

            default:
                return NextResponse.json(
                    { error: `Unknown email type: ${body.type}` },
                    { status: 400 },
                );
        }

        return NextResponse.json(result);
    } catch (err) {
        console.error('[api/email/send]', err);
        return NextResponse.json(
            { error: 'Failed to send email' },
            { status: 500 },
        );
    }
}
