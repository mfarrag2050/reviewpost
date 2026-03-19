import { stripeService } from './stripe';
import { moyasarService } from './moyasar';
import { prisma } from '@/lib/prisma';

export type PaymentProvider = 'stripe' | 'moyasar';

/**
 * Determine the payment provider based on the plan's currency.
 * SAR (Saudi Riyal) → Moyasar for GCC customers.
 * Everything else → Stripe.
 */
export function detectProvider(currency: string): PaymentProvider {
    return currency.toUpperCase() === 'SAR' ? 'moyasar' : 'stripe';
}

export class BillingService {
    /**
     * Create a checkout session/payment for a user.
     * Routes to Stripe or Moyasar based on the plan's currency.
     * Returns a redirect URL.
     */
    async createCheckout(userId: string, planId: string): Promise<{ url: string; provider: PaymentProvider }> {
        const plan = await prisma.plan.findUniqueOrThrow({ where: { id: planId } });
        const provider = detectProvider(plan.currency);

        let url: string;
        if (provider === 'moyasar') {
            url = await moyasarService.createPayment(userId, planId, plan.currency);
        } else {
            url = await stripeService.createCheckoutSession(userId, planId);
        }

        return { url, provider };
    }

    /**
     * Get subscription status for a user.
     */
    async getActiveSubscription(userId: string) {
        return prisma.subscription.findFirst({
            where: {
                userId,
                status: { in: ['ACTIVE', 'TRIALING', 'PAST_DUE'] },
            },
            include: { plan: true },
            orderBy: { createdAt: 'desc' },
        });
    }

    /**
     * Check if a user has an active Stripe subscription (for portal access).
     */
    async hasStripeSubscription(userId: string): Promise<boolean> {
        const sub = await prisma.subscription.findFirst({
            where: {
                userId,
                stripeSubscriptionId: { not: null },
                status: { in: ['ACTIVE', 'TRIALING', 'PAST_DUE'] },
            },
        });
        return !!sub;
    }
}

export const billingService = new BillingService();
export { stripeService } from './stripe';
export { moyasarService } from './moyasar';
