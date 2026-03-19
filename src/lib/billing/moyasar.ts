import { prisma } from '@/lib/prisma';

const MOYASAR_API_URL = 'https://api.moyasar.com/v1';

interface MoyasarPaymentResponse {
    id: string;
    status: 'initiated' | 'paid' | 'failed' | 'authorized' | 'captured' | 'refunded' | 'voided';
    amount: number;
    currency: string;
    description: string;
    source: {
        type: string;
        transaction_url?: string;
    };
    callback_url: string;
    metadata: Record<string, string>;
}

export class MoyasarService {
    private apiKey: string;

    constructor() {
        this.apiKey = process.env.MOYASAR_API_KEY!;
    }

    private get authHeader(): string {
        return `Basic ${Buffer.from(`${this.apiKey}:`).toString('base64')}`;
    }

    /**
     * Create a Moyasar payment for a GCC customer (SAR currency).
     * Returns a redirect URL to the Moyasar payment page.
     */
    async createPayment(
        userId: string,
        planId: string,
        currency = 'SAR',
    ): Promise<string> {
        const plan = await prisma.plan.findUniqueOrThrow({
            where: { id: planId },
        });

        const baseUrl = process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
        const callbackUrl = `${baseUrl}/api/billing/moyasar/callback`;

        // Moyasar expects amount in halalas (smallest currency unit)
        const amountInHalalas = Math.round(Number(plan.price) * 100);

        const response = await fetch(`${MOYASAR_API_URL}/payments`, {
            method: 'POST',
            headers: {
                'Authorization': this.authHeader,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                amount: amountInHalalas,
                currency: currency.toUpperCase(),
                description: `ReviewPost ${plan.displayName} Plan - ${plan.interval === 'YEARLY' ? 'Annual' : 'Monthly'}`,
                callback_url: callbackUrl,
                metadata: {
                    userId,
                    planId,
                },
                source: {
                    type: 'creditcard',
                },
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            console.error('[Moyasar] Payment creation failed:', error);
            throw new Error('Failed to create Moyasar payment');
        }

        const payment: MoyasarPaymentResponse = await response.json();

        // Moyasar redirect-based flow: the payment source has a transaction_url
        const redirectUrl = payment.source?.transaction_url;
        if (!redirectUrl) {
            throw new Error('Moyasar did not return a redirect URL');
        }

        return redirectUrl;
    }

    /**
     * Verify a Moyasar payment by ID after the callback redirect.
     * If paid, activate the user's plan.
     */
    async handleCallback(paymentId: string): Promise<{ success: boolean; redirectUrl: string }> {
        const baseUrl = process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

        const response = await fetch(`${MOYASAR_API_URL}/payments/${paymentId}`, {
            headers: {
                'Authorization': this.authHeader,
            },
        });

        if (!response.ok) {
            console.error('[Moyasar] Payment fetch failed:', paymentId);
            return {
                success: false,
                redirectUrl: `${baseUrl}/dashboard/settings?tab=account&billing=error`,
            };
        }

        const payment: MoyasarPaymentResponse = await response.json();

        if (payment.status !== 'paid') {
            console.warn(`[Moyasar] Payment ${paymentId} status: ${payment.status}`);
            return {
                success: false,
                redirectUrl: `${baseUrl}/dashboard/settings?tab=account&billing=failed`,
            };
        }

        const userId = payment.metadata?.userId;
        const planId = payment.metadata?.planId;

        if (!userId || !planId) {
            console.error('[Moyasar] Payment missing metadata:', paymentId);
            return {
                success: false,
                redirectUrl: `${baseUrl}/dashboard/settings?tab=account&billing=error`,
            };
        }

        // Calculate period (1 month or 1 year from now)
        const plan = await prisma.plan.findUnique({ where: { id: planId } });
        const now = new Date();
        const periodEnd = new Date(now);
        if (plan?.interval === 'YEARLY') {
            periodEnd.setFullYear(periodEnd.getFullYear() + 1);
        } else {
            periodEnd.setMonth(periodEnd.getMonth() + 1);
        }

        await prisma.$transaction([
            prisma.subscription.create({
                data: {
                    userId,
                    planId,
                    moyasarPaymentId: paymentId,
                    status: 'ACTIVE',
                    currentPeriodStart: now,
                    currentPeriodEnd: periodEnd,
                },
            }),
            prisma.user.update({
                where: { id: userId },
                data: { planId },
            }),
        ]);

        console.log(`[Moyasar] Activated subscription for user ${userId}, plan ${planId}`);

        return {
            success: true,
            redirectUrl: `${baseUrl}/dashboard/settings?tab=account&billing=success`,
        };
    }
}

export const moyasarService = new MoyasarService();
