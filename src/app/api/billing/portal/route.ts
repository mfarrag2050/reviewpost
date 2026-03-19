export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { stripeService, billingService } from '@/lib/billing';

export async function POST() {
    let session;
    try {
        session = await requireAuth();
    } catch (err) {
        return err as NextResponse;
    }

    try {
        const hasStripe = await billingService.hasStripeSubscription(session.user.userId);

        if (!hasStripe) {
            return NextResponse.json(
                { error: 'No active Stripe subscription found. Portal is only available for Stripe subscriptions.' },
                { status: 404 },
            );
        }

        const url = await stripeService.createPortalSession(session.user.userId);
        return NextResponse.json({ url });
    } catch (err) {
        console.error('[billing/portal]', err);
        const message = err instanceof Error ? err.message : 'Failed to open billing portal';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
