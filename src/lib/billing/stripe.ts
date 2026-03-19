import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import type { SubscriptionStatus } from '@/generated/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

function mapStripeStatus(status: string): SubscriptionStatus {
    switch (status) {
        case 'active': return 'ACTIVE';
        case 'past_due': return 'PAST_DUE';
        case 'canceled': return 'CANCELED';
        case 'trialing': return 'TRIALING';
        case 'incomplete':
        case 'incomplete_expired': return 'INCOMPLETE';
        default: return 'ACTIVE';
    }
}

/**
 * Compute billing period dates from a Stripe subscription.
 * Stripe v2026 API uses start_date + billing_cycle_anchor instead
 * of current_period_start/end.
 */
function computeBillingPeriod(sub: Stripe.Subscription): { periodStart: Date; periodEnd: Date } {
    const anchor = sub.billing_cycle_anchor
        ? new Date(sub.billing_cycle_anchor * 1000)
        : new Date(sub.start_date * 1000);

    const now = new Date();
    const periodStart = new Date(anchor);

    // Walk forward from anchor to find the current period
    const items = sub.items?.data;
    const interval = items?.[0]?.price?.recurring?.interval ?? 'month';

    while (periodStart < now) {
        const next = new Date(periodStart);
        if (interval === 'year') {
            next.setFullYear(next.getFullYear() + 1);
        } else {
            next.setMonth(next.getMonth() + 1);
        }
        if (next > now) break;
        periodStart.setTime(next.getTime());
    }

    const periodEnd = new Date(periodStart);
    if (interval === 'year') {
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    } else {
        periodEnd.setMonth(periodEnd.getMonth() + 1);
    }

    return { periodStart, periodEnd };
}

export class StripeService {
    /**
     * Get or create a Stripe customer for a given user.
     * Stores customer ID in the user's latest subscription for reuse.
     */
    async createCustomer(user: { id: string; email: string; name?: string | null }): Promise<string> {
        const existingSub = await prisma.subscription.findFirst({
            where: { userId: user.id, stripeCustomerId: { not: null } },
            select: { stripeCustomerId: true },
            orderBy: { createdAt: 'desc' },
        });

        if (existingSub?.stripeCustomerId) {
            return existingSub.stripeCustomerId;
        }

        const customer = await stripe.customers.create({
            email: user.email,
            name: user.name ?? undefined,
            metadata: { userId: user.id },
        });

        return customer.id;
    }

    /**
     * Create a Stripe Checkout Session for subscription.
     * Returns the checkout URL to redirect the user.
     */
    async createCheckoutSession(userId: string, planId: string): Promise<string> {
        const [user, plan] = await Promise.all([
            prisma.user.findUniqueOrThrow({ where: { id: userId } }),
            prisma.plan.findUniqueOrThrow({ where: { id: planId } }),
        ]);

        const customerId = await this.createCustomer(user);

        // Create or find a Stripe Price matching this plan
        const priceId = await this.getOrCreateStripePrice(plan);

        const baseUrl = process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

        const session = await stripe.checkout.sessions.create({
            mode: 'subscription',
            customer: customerId,
            line_items: [{ price: priceId, quantity: 1 }],
            success_url: `${baseUrl}/dashboard/settings?tab=account&billing=success`,
            cancel_url: `${baseUrl}/dashboard/settings?tab=account&billing=canceled`,
            metadata: {
                userId,
                planId,
            },
            subscription_data: {
                metadata: {
                    userId,
                    planId,
                },
            },
        });

        if (!session.url) {
            throw new Error('Failed to create checkout session');
        }

        return session.url;
    }

    /**
     * Create a Stripe Billing Portal session for the user
     * to manage their subscription (upgrade/downgrade/cancel).
     */
    async createPortalSession(userId: string): Promise<string> {
        const subscription = await prisma.subscription.findFirst({
            where: { userId, stripeCustomerId: { not: null } },
            select: { stripeCustomerId: true },
            orderBy: { createdAt: 'desc' },
        });

        if (!subscription?.stripeCustomerId) {
            throw new Error('No active Stripe subscription found');
        }

        const baseUrl = process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

        const session = await stripe.billingPortal.sessions.create({
            customer: subscription.stripeCustomerId,
            return_url: `${baseUrl}/dashboard/settings?tab=account`,
        });

        return session.url;
    }

    /**
     * Process a verified Stripe webhook event.
     */
    async handleWebhook(event: Stripe.Event): Promise<void> {
        switch (event.type) {
            case 'checkout.session.completed':
                await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
                break;
            case 'customer.subscription.updated':
                await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
                break;
            case 'customer.subscription.deleted':
                await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
                break;
            case 'invoice.payment_failed':
                await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
                break;
        }
    }

    /**
     * Verify a webhook signature and return the parsed event.
     */
    constructWebhookEvent(body: Buffer, signature: string): Stripe.Event {
        return stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!,
        );
    }

    // ── Private handlers ─────────────────────────────────────────────────────

    private async handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
        const userId = session.metadata?.userId;
        const planId = session.metadata?.planId;

        if (!userId || !planId) {
            console.error('[Stripe] checkout.session.completed missing metadata', session.id);
            return;
        }

        const stripeSubscriptionId = typeof session.subscription === 'string'
            ? session.subscription
            : session.subscription?.id;

        const stripeCustomerId = typeof session.customer === 'string'
            ? session.customer
            : session.customer?.id;

        if (!stripeSubscriptionId) {
            console.error('[Stripe] checkout.session.completed missing subscription', session.id);
            return;
        }

        const stripeSub = await stripe.subscriptions.retrieve(stripeSubscriptionId);
        const { periodStart, periodEnd } = computeBillingPeriod(stripeSub);

        await prisma.$transaction([
            prisma.subscription.upsert({
                where: { stripeSubscriptionId },
                create: {
                    userId,
                    planId,
                    stripeSubscriptionId,
                    stripeCustomerId: stripeCustomerId ?? null,
                    status: 'ACTIVE',
                    currentPeriodStart: periodStart,
                    currentPeriodEnd: periodEnd,
                },
                update: {
                    planId,
                    status: 'ACTIVE',
                    stripeCustomerId: stripeCustomerId ?? null,
                    currentPeriodStart: periodStart,
                    currentPeriodEnd: periodEnd,
                },
            }),
            prisma.user.update({
                where: { id: userId },
                data: { planId },
            }),
        ]);

        console.log(`[Stripe] Activated subscription for user ${userId}, plan ${planId}`);
    }

    private async handleSubscriptionUpdated(sub: Stripe.Subscription): Promise<void> {
        const subscription = await prisma.subscription.findUnique({
            where: { stripeSubscriptionId: sub.id },
        });

        if (!subscription) return;

        const newPlanId = sub.metadata?.planId;
        const { periodStart, periodEnd } = computeBillingPeriod(sub);

        await prisma.subscription.update({
            where: { stripeSubscriptionId: sub.id },
            data: {
                status: mapStripeStatus(sub.status),
                currentPeriodStart: periodStart,
                currentPeriodEnd: periodEnd,
                cancelAtPeriodEnd: sub.cancel_at_period_end,
                ...(newPlanId ? { planId: newPlanId } : {}),
            },
        });

        // If plan changed, update user's plan
        if (newPlanId && newPlanId !== subscription.planId) {
            await prisma.user.update({
                where: { id: subscription.userId },
                data: { planId: newPlanId },
            });
            console.log(`[Stripe] Plan changed for user ${subscription.userId} to ${newPlanId}`);
        }
    }

    private async handleSubscriptionDeleted(sub: Stripe.Subscription): Promise<void> {
        const subscription = await prisma.subscription.findUnique({
            where: { stripeSubscriptionId: sub.id },
        });

        if (!subscription) return;

        await prisma.$transaction([
            prisma.subscription.update({
                where: { stripeSubscriptionId: sub.id },
                data: { status: 'CANCELED' },
            }),
            // Remove user's plan (revert to free/no plan)
            prisma.user.update({
                where: { id: subscription.userId },
                data: { planId: null },
            }),
        ]);

        console.log(`[Stripe] Subscription canceled for user ${subscription.userId}`);
    }

    private async handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
        const stripeCustomerId = typeof invoice.customer === 'string'
            ? invoice.customer
            : invoice.customer?.id;

        if (!stripeCustomerId) return;

        const subscription = await prisma.subscription.findFirst({
            where: { stripeCustomerId },
            include: { user: { select: { email: true, name: true } } },
            orderBy: { createdAt: 'desc' },
        });

        if (!subscription) return;

        await prisma.subscription.update({
            where: { id: subscription.id },
            data: { status: 'PAST_DUE' },
        });

        // TODO: Send notification to user (email + Telegram) about failed payment
        console.warn(
            `[Stripe] Payment failed for user ${subscription.userId} (${subscription.user.email})`,
        );
    }

    // ── Stripe Price helpers ─────────────────────────────────────────────────

    /**
     * Get or create a Stripe Price for the given plan.
     * Uses plan ID in metadata to match existing prices.
     */
    private async getOrCreateStripePrice(plan: {
        id: string;
        name: string;
        displayName: string;
        price: { toNumber(): number } | number;
        currency: string;
        interval: string;
    }): Promise<string> {
        // Search for existing price with matching plan metadata
        const existing = await stripe.prices.search({
            query: `metadata["planId"]:"${plan.id}" active:"true"`,
        });

        if (existing.data.length > 0) {
            return existing.data[0].id;
        }

        // Create product + price
        const product = await stripe.products.create({
            name: `${plan.displayName} Plan`,
            metadata: { planId: plan.id },
        });

        const priceAmount = typeof plan.price === 'number' ? plan.price : plan.price.toNumber();

        const price = await stripe.prices.create({
            product: product.id,
            unit_amount: Math.round(priceAmount * 100),
            currency: plan.currency.toLowerCase(),
            recurring: {
                interval: plan.interval === 'YEARLY' ? 'year' : 'month',
            },
            metadata: { planId: plan.id },
        });

        return price.id;
    }
}

export const stripeService = new StripeService();
