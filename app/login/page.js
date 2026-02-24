'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const { user, loading: authLoading, login, loginWithGoogle } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      router.push('/home');
    }
  }, [authLoading, user, router]);

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await login(email, password);
      if (!res?.success) {
        setError(res?.error || 'Failed to login. Please check your credentials.');
      } else {
        router.push('/home');
      }
    } catch (err) {
      setError(err?.message || 'Failed to login. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
    } catch (err) {
      setGoogleLoading(false);
      setError(err?.message || 'Google sign-in failed. Please try again.');
    }
  };

  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid #eee', borderTopColor: '#4f9cf9', animation: 'spin 1s linear infinite' }} />
        <style jsx global>{`
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  return (
    <div
      style={{
        '--background': '#07070f',
        '--surface': 'rgba(255,255,255,0.04)',
        '--border': 'rgba(255,255,255,0.08)',
        '--text': '#e8e8f0',
        '--muted': '#76768a',
        '--blue': '#4f9cf9',
        '--violet': '#9b59f5',
        minHeight: '100vh',
        background: 'var(--background)',
        color: 'var(--text)',
      }}
    >
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20,
        }}
      >
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 20,
            padding: 40,
            width: '100%',
            maxWidth: 400,
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: 30 }}>
            <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: -0.5 }}>Welcome Back</h1>
            <p style={{ color: 'var(--muted)', marginTop: 8, fontSize: 14 }}>Sign in to your RK account.</p>
          </div>

          {error ? (
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                color: '#ef4444',
                padding: 12,
                borderRadius: 10,
                marginBottom: 20,
                fontSize: 13,
                textAlign: 'center',
              }}
            >
              {error}
            </div>
          ) : null}

          <form onSubmit={handleEmailLogin} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 12,
                  fontWeight: 700,
                  color: 'var(--muted)',
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                  marginBottom: 8,
                }}
              >
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  padding: '12px 16px',
                  color: 'var(--text)',
                  fontSize: 15,
                  outline: 'none',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'var(--blue)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
              />
            </div>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 12,
                  fontWeight: 700,
                  color: 'var(--muted)',
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                  marginBottom: 8,
                }}
              >
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  padding: '12px 16px',
                  color: 'var(--text)',
                  fontSize: 15,
                  outline: 'none',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'var(--blue)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              style={{
                width: '100%',
                marginTop: 10,
                padding: 14,
                fontSize: 15,
                opacity: submitting ? 0.7 : 1,
                background: 'linear-gradient(135deg, var(--blue), var(--violet))',
                color: '#fff',
                border: 'none',
                borderRadius: 50,
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 0 30px rgba(79, 156, 249, 0.3)',
                transition: 'transform 0.2s, opacity 0.2s',
              }}
            >
              {submitting ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 30, position: 'relative' }}>
            <hr style={{ border: 'none', borderTop: '1px solid var(--border)' }} />
            <span
              style={{
                position: 'absolute',
                top: -10,
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'var(--surface)',
                padding: '0 10px',
                fontSize: 12,
                color: 'var(--muted)',
                fontWeight: 700,
              }}
            >
              OR
            </span>
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            style={{
              width: '100%',
              marginTop: 24,
              background: 'transparent',
              border: '1px solid var(--border)',
              borderRadius: 50,
              padding: 12,
              color: 'var(--text)',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              opacity: googleLoading ? 0.7 : 1,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            {googleLoading ? 'Opening Google...' : 'Continue with Google'}
          </button>
        </div>
      </div>
    </div>
  );
}
