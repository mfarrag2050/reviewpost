export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { stripeService } from '@/lib/billing';

export async function POST(req: NextRequest) {
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
        return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
    }

    try {
        const body = Buffer.from(await req.arrayBuffer());
        const event = stripeService.constructWebhookEvent(body, signature);

        await stripeService.handleWebhook(event);

        return NextResponse.json({ received: true });
    } catch (err) {
        console.error('[billing/webhook]', err);
        const message = err instanceof Error ? err.message : 'Webhook processing failed';
        return NextResponse.json({ error: message }, { status: 400 });
    }
}
