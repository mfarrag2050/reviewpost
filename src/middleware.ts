import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import type { NextAuthRequest } from 'next-auth';

export const config = {
    matcher: [
        '/dashboard/:path*',
        '/api/((?!auth/).*)',
    ],
};

export default auth(function middleware(req: NextAuthRequest) {
    const { nextUrl } = req;
    const isLoggedIn = !!req.auth?.user;

    const isLoginPage = nextUrl.pathname === '/login';
    const isDashboard = nextUrl.pathname.startsWith('/dashboard');
    const isApiRoute = nextUrl.pathname.startsWith('/api');

    // Redirect authenticated users away from login page
    if (isLoginPage && isLoggedIn) {
        return NextResponse.redirect(new URL('/dashboard', nextUrl));
    }

    // Protect dashboard routes — redirect to /login
    if (isDashboard && !isLoggedIn) {
        const callbackUrl = encodeURIComponent(nextUrl.pathname + nextUrl.search);
        return NextResponse.redirect(new URL(`/login?callbackUrl=${callbackUrl}`, nextUrl));
    }

    // Protect API routes — return 401
    if (isApiRoute && !isLoggedIn) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.next();
});
