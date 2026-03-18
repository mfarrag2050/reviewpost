import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
    const session = await auth();

    if (!session?.user) {
        redirect('/login');
    }

    return (
        <main
            style={{
                minHeight: '100vh',
                background: '#0a0a0a',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: "'Inter', sans-serif",
                color: '#fff',
                gap: 16,
            }}
        >
            <div style={{ fontSize: 48 }}>🚀</div>
            <h1 style={{ fontSize: 32, fontWeight: 800, margin: 0 }}>Dashboard</h1>
            <p style={{ color: 'rgba(255,255,255,0.5)', margin: 0 }}>
                Welcome, {session.user.name ?? session.user.email}!
            </p>
            <pre style={{
                background: 'rgba(255,255,255,0.05)',
                padding: '16px 24px',
                borderRadius: 12,
                fontSize: 13,
                color: 'rgba(255,255,255,0.6)',
                maxWidth: 420,
                width: '100%',
            }}>
                {JSON.stringify({
                    plan: session.user.plan,
                    aiMode: session.user.aiMode,
                    language: session.user.language,
                }, null, 2)}
            </pre>
        </main>
    );
}
