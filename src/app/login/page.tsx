import { LoginButton } from '@/components/auth/LoginButton';

export default function LoginPage() {
    return (
        <main
            style={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: "'Inter', 'Segoe UI', sans-serif",
                padding: '24px',
            }}
        >
            <div style={{
                background: 'rgba(255,255,255,0.05)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 24,
                padding: '48px 40px',
                maxWidth: 400,
                width: '100%',
                textAlign: 'center',
                boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
            }}>
                <div style={{
                    width: 60, height: 60, margin: '0 auto 20px',
                    background: 'linear-gradient(135deg, #7C3AED, #4F46E5)',
                    borderRadius: 16, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: 28,
                }}>
                    ⭐
                </div>

                <h1 style={{ fontSize: 28, fontWeight: 700, color: '#ffffff', margin: '0 0 8px' }}>
                    Welcome back
                </h1>
                <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', margin: '0 0 32px' }}>
                    Sign in to your ReviewPost account
                </p>

                <LoginButton className="mx-auto" />
            </div>
        </main>
    );
}
