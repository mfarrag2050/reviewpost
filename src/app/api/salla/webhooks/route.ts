import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { SallaAuth, SallaAuthorizePayload } from '@/lib/salla/auth';
import { SallaSync } from '@/lib/salla/sync';
import { createLogger } from '@/lib/monitoring/logger';
import { timingSafeEqual } from '@/lib/security';

const log = createLogger('SallaWebhook');
const sallaAuth = new SallaAuth();
const sallaSync = new SallaSync();

function verifySignature(rawBody: string, signature: string | null): boolean {
    const secret = process.env.SALLA_WEBHOOK_SECRET;
    if (!secret) {
        log.warn('SALLA_WEBHOOK_SECRET not configured — skipping verification');
        return false;
    }
    if (!signature) return false;

    const computed = crypto
        .createHmac('sha256', secret)
        .update(rawBody, 'utf8')
        .digest('hex');

    return timingSafeEqual(computed, signature);
}

/**
 * POST /api/salla/webhooks
 * Receives webhook events from Salla:
 *   - app.store.authorize — merchant installed the app
 *   - app.store.revoke    — merchant uninstalled the app
 *   - product.rating.created — new product review
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
    try {
        const rawBody = await req.text();
        const signature = req.headers.get('x-salla-signature');

        if (!verifySignature(rawBody, signature)) {
            log.warn('Invalid webhook signature');
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }

        const payload = JSON.parse(rawBody);
        const event: string = payload.event;

        log.info('Webhook received', { event, merchant: payload.merchant });

        switch (event) {
            case 'app.store.authorize': {
                const authorizePayload = payload as SallaAuthorizePayload;
                // For Easy Mode, we auto-assign to a system user.
                // In production, this would map to a specific user via onboarding.
                const userId = payload.user_id ?? 'system';
                await sallaAuth.handleAppAuthorize(authorizePayload, userId);
                break;
            }

            case 'app.store.revoke': {
                const merchantId = String(payload.merchant);
                await sallaAuth.deactivateStore(merchantId);
                break;
            }

            case 'product.rating.created': {
                const merchantId = String(payload.merchant);
                const reviewData = payload.data;
                if (reviewData) {
                    await sallaSync.saveSingleReview(merchantId, {
                        id: reviewData.id,
                        rating: reviewData.rating ?? reviewData.stars ?? 5,
                        content: reviewData.content ?? reviewData.comment ?? '',
                        name: reviewData.name ?? reviewData.customer_name ?? 'Anonymous',
                        product_id: reviewData.product_id ?? reviewData.product?.id,
                        product_name: reviewData.product_name ?? reviewData.product?.name,
                        product_image: reviewData.product_image ?? reviewData.product?.main_image,
                        created_at: reviewData.created_at ?? new Date().toISOString(),
                    });
                }
                break;
            }

            default:
                log.info('Unhandled webhook event', { event });
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        log.error('Webhook processing failed', {}, error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 },
        );
    }
}
