import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { GoogleReviewsService } from '@/lib/reviews/google';

const service = new GoogleReviewsService();

/**
 * GET /api/auth/google-business/callback
 * Query params: code (from Google OAuth), state (businessId encoded as base64)
 *
 * Exchanges the auth code for tokens, encrypts and stores them, then redirects.
 * Requires authenticated user + ownership of the business.
 */
export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.userId) {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';
        return NextResponse.redirect(`${baseUrl}/login`);
    }

    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (!code || !state) {
        return NextResponse.json({ error: 'Missing code or state' }, { status: 400 });
    }

    let businessId: string;
    try {
        businessId = Buffer.from(state, 'base64').toString('utf-8');
    } catch {
        return NextResponse.json({ error: 'Invalid state parameter' }, { status: 400 });
    }

    // التحقق من ملكية البزنس
    const ownerCheck = await prisma.business.findFirst({
        where: { id: businessId, userId: session.user.userId },
        select: { id: true },
    });
    if (!ownerCheck) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        await service.authenticate(code, businessId);
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';
        return NextResponse.redirect(`${baseUrl}/dashboard/settings?google_connected=1`);
    } catch (err) {
        console.error('[/api/auth/google-business] OAuth error:', err);
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';
        return NextResponse.redirect(`${baseUrl}/dashboard/settings?google_error=1`);
    }
}

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json() as { code?: string; businessId?: string };
        const { code, businessId } = body;

        if (!code || !businessId) {
            return NextResponse.json({ error: 'code and businessId are required' }, { status: 400 });
        }

        // التحقق من ملكية البزنس
        const ownerCheck = await prisma.business.findFirst({
            where: { id: businessId, userId: session.user.userId },
            select: { id: true },
        });
        if (!ownerCheck) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await service.authenticate(code, businessId);
        return NextResponse.json({ success: true, businessId });
    } catch (err) {
        console.error('[/api/auth/google-business] POST error:', err);
        return NextResponse.json({ error: 'OAuth exchange failed' }, { status: 500 });
    }
}
