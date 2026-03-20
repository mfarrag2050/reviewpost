import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
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
        // في بيئة التطوير — نسمح بدون secret مع تحذير
        if (process.env.NODE_ENV === 'development') {
            log.warn('SALLA_WEBHOOK_SECRET not configured — allowing in dev mode');
            return true;
        }
        log.error('SALLA_WEBHOOK_SECRET not configured — rejecting webhook');
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
 * Find or create a user for a Salla merchant.
 * Salla Easy Mode sends merchant info in the authorize webhook.
 * We try to match by email, otherwise create a new user.
 */
async function resolveUserId(payload: SallaAuthorizePayload): Promise<string> {
    const merchantId = String(payload.merchant);
    const merchantEmail = (payload as unknown as Record<string, unknown>).email as string | undefined;
    const storeName = payload.store?.name ?? `Salla Store ${merchantId}`;

    // 1) Check if this merchant already has a store linked to a user
    const existingStore = await prisma.sallaStore.findUnique({
        where: { merchantId },
        select: { userId: true },
    });
    if (existingStore) return existingStore.userId;

    // 2) Try to find user by email from the webhook payload
    if (merchantEmail) {
        const existingUser = await prisma.user.findUnique({
            where: { email: merchantEmail },
            select: { id: true },
        });
        if (existingUser) return existingUser.id;
    }

    // 3) Create a new user for this merchant
    const email = merchantEmail ?? `merchant-${merchantId}@salla.store`;
    const user = await prisma.user.create({
        data: {
            email,
            name: storeName,
            language: 'AR', // Salla merchants are primarily Arabic
            aiMode: 'SHARED',
        },
    });

    log.info('Created new user for Salla merchant', { merchantId, userId: user.id, email });
    return user.id;
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
                const userId = await resolveUserId(authorizePayload);
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
                        name: reviewData.name ?? reviewData.customer_name ?? 'مجهول',
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
