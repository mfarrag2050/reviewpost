/**
 * Edge-compatible auth config — NO database imports.
 * Used by middleware (Edge Runtime). Providers must be listed here
 * so NextAuth can verify JWT tokens without Node.js-only modules.
 */
import type { NextAuthConfig } from 'next-auth';
import Google from 'next-auth/providers/google';

export const authConfig: NextAuthConfig = {
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
    ],
    pages: {
        signIn: '/login',
        error: '/login',
    },
    session: { strategy: 'jwt' },
    callbacks: {
        // Expose custom JWT fields onto session in edge context
        async session({ session, token }) {
            if (token) {
                session.user.userId = token.userId as string | undefined;
                session.user.plan = token.plan as string | undefined;
                session.user.aiMode = token.aiMode as string | undefined;
                session.user.language = token.language as string | undefined;
            }
            return session;
        },
    },
};
