import NextAuth from 'next-auth';
import { authConfig } from './auth.config';
import { prisma } from '@/lib/prisma';

export const { handlers, signIn, signOut, auth } = NextAuth({
    ...authConfig,
    callbacks: {
        ...authConfig.callbacks,

        async signIn({ user }) {
            if (!user.email) return false;
            try {
                await prisma.user.upsert({
                    where: { email: user.email },
                    create: {
                        email: user.email,
                        name: user.name ?? null,
                        plan: 'STARTER',
                        aiMode: 'SHARED',
                        language: 'AR',
                    },
                    update: { name: user.name ?? undefined },
                });
                return true;
            } catch (err) {
                console.error('[NextAuth] signIn error:', err);
                return false;
            }
        },

        async jwt({ token, user }) {
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
            if (token) {
                session.user.userId = token.userId as string;
                session.user.plan = token.plan as string;
                session.user.aiMode = token.aiMode as string;
                session.user.language = token.language as string;
            }
            return session;
        },
    },
});
