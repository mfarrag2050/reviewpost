export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { moyasarService } from '@/lib/billing';

/**
 * Moyasar callback route — redirect-based flow.
 * After payment, Moyasar redirects the user here with the payment ID.
 */
export async function GET(req: NextRequest) {
    const paymentId = req.nextUrl.searchParams.get('id');

    if (!paymentId) {
        const baseUrl = process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
        return NextResponse.redirect(`${baseUrl}/dashboard/settings?tab=account&billing=error`);
    }

    try {
        const result = await moyasarService.handleCallback(paymentId);
        return NextResponse.redirect(result.redirectUrl);
    } catch (err) {
        console.error('[billing/moyasar/callback]', err);
        const baseUrl = process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
        return NextResponse.redirect(`${baseUrl}/dashboard/settings?tab=account&billing=error`);
    }
}
