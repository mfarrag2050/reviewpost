import NextAuth from 'next-auth';
import { authConfig } from './auth.config';
import { NextResponse } from 'next/server';
import type { NextAuthRequest } from 'next-auth';

export const config = {
    matcher: [
        '/dashboard/:path*',
        '/admin/:path*',
        '/onboarding/:path*',
        '/login',
        '/api/((?!auth/).*)',
    ],
};

const { auth } = NextAuth(authConfig);

export default auth(function middleware(req: NextAuthRequest) {
    const { nextUrl } = req;
    const isLoggedIn = !!req.auth?.user;
    const userRole = req.auth?.user?.role ?? 'USER';

    const isLoginPage = nextUrl.pathname === '/login';
    const isDashboard = nextUrl.pathname.startsWith('/dashboard');
    const isOnboarding = nextUrl.pathname.startsWith('/onboarding');
    const isAdminPage = nextUrl.pathname.startsWith('/admin');
    const isAdminApi = nextUrl.pathname.startsWith('/api/admin');
    const isApiRoute = nextUrl.pathname.startsWith('/api');

    // Redirect authenticated users away from login page
    if (isLoginPage && isLoggedIn) {
        return NextResponse.redirect(new URL('/dashboard', nextUrl));
    }

    // Protect dashboard and onboarding routes
    if ((isDashboard || isOnboarding) && !isLoggedIn) {
        const callbackUrl = encodeURIComponent(nextUrl.pathname + nextUrl.search);
        return NextResponse.redirect(new URL(`/login?callbackUrl=${callbackUrl}`, nextUrl));
    }

    // Protect admin pages — require ADMIN role
    if (isAdminPage) {
        if (!isLoggedIn) {
            return NextResponse.redirect(new URL('/login', nextUrl));
        }
        if (userRole !== 'ADMIN') {
            return NextResponse.redirect(new URL('/dashboard', nextUrl));
        }
    }

    // Protect admin API routes — require ADMIN role
    if (isAdminApi) {
        if (!isLoggedIn) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        if (userRole !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
    }

    // Public API routes — no user auth required (protected by other means)
    const isPublicApi =
        nextUrl.pathname.startsWith('/api/plans') ||
        nextUrl.pathname.startsWith('/api/health') ||
        nextUrl.pathname.startsWith('/api/tools') ||
        nextUrl.pathname.startsWith('/api/billing/webhook') ||
        nextUrl.pathname.startsWith('/api/billing/moyasar/callback') ||
        nextUrl.pathname.startsWith('/api/email/send') ||
        nextUrl.pathname.startsWith('/api/salla/webhooks');

    // Protect other API routes
    if (isApiRoute && !isLoggedIn && !isPublicApi) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.next();
});
