import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import type { NextAuthConfig } from 'next-auth';
import { prisma } from '@/lib/prisma';

export const authConfig: NextAuthConfig = {
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
    ],

    callbacks: {
        async signIn({ user, account }) {
            if (!user.email) return false;

            try {
                // Upsert user into our DB on every sign-in
                await prisma.user.upsert({
                    where: { email: user.email },
                    create: {
                        email: user.email,
                        name: user.name ?? null,
                        plan: 'STARTER',
                        aiMode: 'SHARED',
                        language: 'AR',
                    },
                    update: {
                        // Keep name in sync with Google profile
                        name: user.name ?? undefined,
                    },
                });
                return true;
            } catch (err) {
                console.error('[NextAuth] signIn error:', err);
                return false;
            }
        },

        async jwt({ token, user }) {
            // On first sign-in `user` is available; enrich token with our DB id + plan
            if (user?.email) {
                const dbUser = await prisma.user.findUnique({
                    where: { email: user.email },
                    select: { id: true, plan: true, aiMode: true, language: true },
                });
                if (dbUser) {
                    token.userId = dbUser.id;
                    token.plan = dbUser.plan;
                    token.aiMode = dbUser.aiMode;
                    token.language = dbUser.language;
                }
            }
            return token;
        },

        async session({ session, token }) {
            // Expose our DB fields onto the session object available in components
            if (token) {
                session.user.userId = token.userId as string;
                session.user.plan = token.plan as string;
                session.user.aiMode = token.aiMode as string;
                session.user.language = token.language as string;
            }
            return session;
        },
    },

    pages: {
        signIn: '/login',
        error: '/login',
    },

    session: { strategy: 'jwt' },
};

export const { handlers, signIn, signOut, auth } = NextAuth(authConfig);
