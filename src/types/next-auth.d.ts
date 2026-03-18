import 'next-auth';
import 'next-auth/jwt';

// Extend NextAuth types to include our custom DB fields

declare module 'next-auth' {
    interface Session {
        user: {
            // Standard NextAuth fields
            name?: string | null;
            email?: string | null;
            image?: string | null;
            // Our custom DB fields
            userId: string;
            plan: string;
            aiMode: string;
            language: string;
        };
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        userId?: string;
        plan?: string;
        aiMode?: string;
        language?: string;
    }
}
