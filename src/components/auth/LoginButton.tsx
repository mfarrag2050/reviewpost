'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import Image from 'next/image';
import type { DefaultSession } from 'next-auth';

interface LoginButtonProps {
    className?: string;
}

// Combined user type: standard NextAuth fields + our DB extensions
type SessionUser = DefaultSession['user'] & {
    userId: string;
    plan: string;
    aiMode: string;
    language: string;
};

export function LoginButton({ className }: LoginButtonProps) {
    const { data: session, status } = useSession();

    if (status === 'loading') {
        return (
            <button
                disabled
                className={`flex items-center gap-3 px-6 py-3 rounded-xl bg-white/10 text-white/60 text-sm font-medium cursor-not-allowed ${className ?? ''}`}
            >
                <span className="animate-pulse">⏳</span>
                Loading...
            </button>
        );
    }

    if (session?.user) {
        const user = session.user as SessionUser;
        return (
            <div className={`flex items-center gap-4 ${className ?? ''}`}>
                {user.image && (
                    <Image
                        src={user.image}
                        alt={user.name ?? 'User'}
                        width={36}
                        height={36}
                        className="rounded-full border-2 border-white/20"
                    />
                )}
                <span className="text-sm text-white/80 font-medium hidden sm:block">
                    {user.name ?? user.email}
                </span>
                <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors border border-white/10"
                >
                    Sign out
                </button>
            </div>
        );
    }


    return (
        <button
            onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
            className={`flex items-center gap-3 px-6 py-3 rounded-xl bg-white text-gray-900 text-sm font-semibold hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl active:scale-95 ${className ?? ''}`}
        >
            <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853" />
                <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
            </svg>
            Continue with Google
        </button>
    );
}
