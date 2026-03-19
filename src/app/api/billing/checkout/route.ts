export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { billingService } from '@/lib/billing';

export async function POST(req: NextRequest) {
    let session;
    try {
        session = await requireAuth();
    } catch (err) {
        return err as NextResponse;
    }

    try {
        const body = await req.json() as { planId?: string };

        if (!body.planId) {
            return NextResponse.json({ error: 'planId is required' }, { status: 400 });
        }

        const { url, provider } = await billingService.createCheckout(
            session.user.userId,
            body.planId,
        );

        return NextResponse.json({ url, provider });
    } catch (err) {
        console.error('[billing/checkout]', err);
        const message = err instanceof Error ? err.message : 'Checkout failed';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
