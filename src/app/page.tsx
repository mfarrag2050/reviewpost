import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { LoginButton } from '@/components/auth/LoginButton';

export default async function LandingPage() {
  const session = await auth();

  // Redirect authenticated users straight to dashboard
  if (session?.user) {
    redirect('/dashboard');
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
        padding: '24px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background glow orbs */}
      <div style={{
        position: 'absolute', width: 600, height: 600, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(124,58,237,0.3) 0%, transparent 70%)',
        top: -200, left: -200, pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', width: 400, height: 400, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(59,130,246,0.2) 0%, transparent 70%)',
        bottom: -100, right: -100, pointerEvents: 'none',
      }} />

      {/* Card */}
      <div style={{
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 32,
        padding: '60px 48px',
        maxWidth: 480,
        width: '100%',
        textAlign: 'center',
        position: 'relative',
        boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
      }}>
        {/* Logo mark */}
        <div style={{
          width: 72, height: 72, margin: '0 auto 24px',
          background: 'linear-gradient(135deg, #7C3AED, #4F46E5)',
          borderRadius: 20, display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: 36,
          boxShadow: '0 8px 32px rgba(124,58,237,0.5)',
        }}>
          ⭐
        </div>

        <h1 style={{
          fontSize: 36, fontWeight: 800, color: '#ffffff',
          margin: '0 0 12px', lineHeight: 1.2, letterSpacing: '-0.5px',
        }}>
          ReviewPost
        </h1>

        <p style={{
          fontSize: 17, color: 'rgba(255,255,255,0.6)',
          margin: '0 0 8px', lineHeight: 1.6,
        }}>
          Turn 5-star reviews into stunning social media posts
        </p>

        <p style={{
          fontSize: 14, color: 'rgba(255,255,255,0.35)',
          margin: '0 0 40px',
        }}>
          Instagram · Facebook · Twitter — powered by AI
        </p>

        {/* Features list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 36, textAlign: 'left' }}>
          {[
            { icon: '🔗', text: 'Connect Google Business in one click' },
            { icon: '🤖', text: 'AI writes captions in Arabic, English & Turkish' },
            { icon: '🎨', text: '3 beautiful branded templates, 1080×1080px' },
          ].map(({ icon, text }) => (
            <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 20, flexShrink: 0 }}>{icon}</span>
              <span style={{ fontSize: 15, color: 'rgba(255,255,255,0.7)' }}>{text}</span>
            </div>
          ))}
        </div>

        {/* Login button rendered client-side */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <LoginButton />
        </div>

        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', marginTop: 24 }}>
          Free to start · No credit card required
        </p>
      </div>
    </main>
  );
}
