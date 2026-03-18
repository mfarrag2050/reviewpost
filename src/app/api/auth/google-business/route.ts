import { NextRequest, NextResponse } from 'next/server';
import { GoogleReviewsService } from '@/lib/reviews/google';

const service = new GoogleReviewsService();

/**
 * GET /api/auth/google-business/callback
 * Query params: code (from Google OAuth), state (businessId encoded as base64)
 *
 * Exchanges the auth code for tokens, encrypts and stores them, then redirects.
 *
 * Also exported as POST for direct API calls:
 * Body: { code: string, businessId: string }
 */
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // base64-encoded businessId

    if (!code || !state) {
        return NextResponse.json({ error: 'Missing code or state' }, { status: 400 });
    }

    let businessId: string;
    try {
        businessId = Buffer.from(state, 'base64').toString('utf-8');
    } catch {
        return NextResponse.json({ error: 'Invalid state parameter' }, { status: 400 });
    }

    try {
        await service.authenticate(code, businessId);
        // Redirect to dashboard or settings page on success
        const redirectUrl = `${process.env.NEXT_PUBLIC_BASE_URL ?? ''}/dashboard/settings?google_connected=1`;
        return NextResponse.redirect(redirectUrl);
    } catch (err) {
        console.error('[/api/auth/google-business] OAuth error:', err);
        return NextResponse.json({ error: 'OAuth exchange failed', detail: String(err) }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json() as { code?: string; businessId?: string };
        const { code, businessId } = body;

        if (!code || !businessId) {
            return NextResponse.json({ error: 'code and businessId are required' }, { status: 400 });
        }

        await service.authenticate(code, businessId);
        return NextResponse.json({ success: true, businessId });
    } catch (err) {
        console.error('[/api/auth/google-business] POST error:', err);
        return NextResponse.json({ error: 'OAuth exchange failed', detail: String(err) }, { status: 500 });
    }
}
